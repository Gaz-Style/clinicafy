-- ============================================================================
-- CLINICAFY - MIGRATION 002: APPOINTMENTS, SCHEDULES & TELEMEDICINE
-- ============================================================================

-- 1. AGENDA DE PROFESIONALES (Disponibilidad semanal)
CREATE TABLE IF NOT EXISTS doctor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES clinical_users(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Lunes, 7=Domingo
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration_minutes SMALLINT NOT NULL DEFAULT 50,
    modality VARCHAR(20) NOT NULL DEFAULT 'both', -- 'presencial', 'telemedicine', 'both'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_schedule_day UNIQUE (practitioner_id, branch_id, day_of_week, start_time)
);

CREATE INDEX IF NOT EXISTS idx_schedules_practitioner ON doctor_schedules(tenant_id, practitioner_id);

-- 2. CITAS MÉDICAS
DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM (
        'pending_payment',
        'confirmed',
        'checked_in',
        'in_progress',
        'completed',
        'no_show',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES clinical_users(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,

    -- Scheduling
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes SMALLINT NOT NULL DEFAULT 50,
    modality VARCHAR(20) NOT NULL DEFAULT 'telemedicine',
    specialty VARCHAR(60),

    -- Patient pre-intake
    reason_for_visit TEXT,
    allergies_declared TEXT,
    medications_declared TEXT,

    -- Status & flow
    status appointment_status NOT NULL DEFAULT 'pending_payment',

    -- Consent (Ley 20.584)
    consent_signed BOOLEAN NOT NULL DEFAULT false,
    consent_signed_at TIMESTAMPTZ,

    -- Payment
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    copay_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(30) NOT NULL DEFAULT 'pending',
    payment_gateway VARCHAR(30),
    payment_transaction_id VARCHAR(120),
    paid_at TIMESTAMPTZ,

    -- I-Med Bono
    bono_number VARCHAR(60),
    bono_authorization_code VARCHAR(60),
    insurance_name VARCHAR(50),
    insurance_contribution NUMERIC(12,2) DEFAULT 0,

    -- Telemedicine
    telemedicine_room_id VARCHAR(120),
    telemedicine_room_url TEXT,

    -- Notifications
    reminder_sent_at TIMESTAMPTZ,
    confirmation_sent_at TIMESTAMPTZ,

    notes TEXT,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_practitioner ON appointments(tenant_id, practitioner_id, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(tenant_id, status);

-- 3. PAGOS
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    gateway VARCHAR(30) NOT NULL,
    gateway_transaction_id VARCHAR(120) UNIQUE,
    amount NUMERIC(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'CLP',
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    gateway_response JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 4. NOTIFICACIONES
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    channel VARCHAR(20) NOT NULL,
    recipient VARCHAR(120) NOT NULL,
    template_name VARCHAR(80) NOT NULL,
    variables JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(30) NOT NULL DEFAULT 'dispatched',
    provider_message_id VARCHAR(120),
    error_message TEXT,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 5. RLS
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_schedules ON doctor_schedules FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_appointments ON appointments FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_payments ON payment_transactions FOR ALL USING (tenant_id = get_current_tenant_id());
CREATE POLICY tenant_isolation_notifications ON notification_log FOR ALL USING (tenant_id = get_current_tenant_id());

-- 6. FUNCION: Slots disponibles para un médico en una fecha
CREATE OR REPLACE FUNCTION get_available_slots(
    p_practitioner_id UUID,
    p_branch_id UUID,
    p_date DATE
)
RETURNS TABLE (slot_start TIMESTAMPTZ, slot_end TIMESTAMPTZ, is_available BOOLEAN) AS $$
DECLARE
    v_day_of_week SMALLINT;
    v_schedule RECORD;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
BEGIN
    v_day_of_week := EXTRACT(ISODOW FROM p_date)::SMALLINT;
    FOR v_schedule IN
        SELECT * FROM doctor_schedules
        WHERE practitioner_id = p_practitioner_id
          AND branch_id = p_branch_id
          AND day_of_week = v_day_of_week
          AND is_active = true
    LOOP
        v_slot_start := (p_date + v_schedule.start_time)::TIMESTAMPTZ;
        WHILE v_slot_start + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL
              <= (p_date + v_schedule.end_time)::TIMESTAMPTZ LOOP
            v_slot_end := v_slot_start + (v_schedule.slot_duration_minutes || ' minutes')::INTERVAL;
            RETURN QUERY SELECT v_slot_start, v_slot_end,
                NOT EXISTS (
                    SELECT 1 FROM appointments a
                    WHERE a.practitioner_id = p_practitioner_id
                      AND a.scheduled_at = v_slot_start
                      AND a.status NOT IN ('cancelled', 'no_show')
                );
            v_slot_start := v_slot_end;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql STABLE;
