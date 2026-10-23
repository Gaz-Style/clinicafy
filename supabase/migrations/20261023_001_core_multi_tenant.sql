-- ============================================================================
-- CLINICAFY - MULTI-TENANT ENTERPRISE HEALTHCARE PLATFORM SCHEMA
-- Compliant with: FHIR R4, Ley 20.584 (Chile), Zero-Trust RLS, FEA PKI
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TENANTS & SUCURSALES (Multi-Tenancy)
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(64) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    rut VARCHAR(20) UNIQUE NOT NULL,
    domain VARCHAR(255) UNIQUE,
    settings JSONB NOT NULL DEFAULT '{
        "currency": "CLP",
        "timezone": "America/Santiago",
        "allow_patient_booking": true,
        "enforce_fea": true,
        "imed_enabled": true
    }'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    name VARCHAR(120) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    phone VARCHAR(30),
    is_main BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_branches_tenant ON branches(tenant_id);

-- 2. USUARIOS CLÍNICOS & CONTROL DE ACCESO (Zero Trust)
DO $$ BEGIN
    CREATE TYPE clinical_role AS ENUM (
        'super_admin',
        'clinic_admin',
        'medical_director',
        'psychiatrist',
        'psychologist',
        'general_practitioner',
        'nurse',
        'receptionist'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS clinical_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    email VARCHAR(255) NOT NULL,
    role clinical_role NOT NULL,
    rut VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    national_registry_id VARCHAR(50), -- N° SIS Registro Prestadores
    mfa_enforced BOOLEAN NOT NULL DEFAULT true,
    mfa_last_verified_at TIMESTAMPTZ,
    fea_certificate_id VARCHAR(100), -- Identificador Certificado FEA
    fea_provider VARCHAR(50) DEFAULT 'e-cert', -- e-cert, acepta, firmagob
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_tenant_user_rut UNIQUE (tenant_id, rut)
);

CREATE INDEX IF NOT EXISTS idx_clinical_users_tenant ON clinical_users(tenant_id);

-- 3. PACIENTES (Protected Health Information - PHI)
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    rut VARCHAR(20) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    birthdate DATE NOT NULL,
    gender VARCHAR(20) NOT NULL,
    health_insurance VARCHAR(50) NOT NULL, -- Fonasa A/B/C/D, Colmena, Banmedica, Consalud, CruzBlanca, Particular
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    emergency_contact JSONB DEFAULT '{"name": "", "phone": "", "relation": ""}'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    current_medications JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_patient_tenant_rut UNIQUE (tenant_id, rut)
);

CREATE INDEX IF NOT EXISTS idx_patients_tenant_rut ON patients(tenant_id, rut);

-- 4. ATENCIONES Y NOTAS CLÍNICAS (SOAP/DAP + AMBIENT SCRIBE)
DO $$ BEGIN
    CREATE TYPE encounter_status AS ENUM ('in_progress', 'completed', 'amended', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS clinical_encounters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES clinical_users(id) ON DELETE RESTRICT,
    status encounter_status NOT NULL DEFAULT 'in_progress',
    encounter_type VARCHAR(50) NOT NULL DEFAULT 'telemedicine', -- in_person, telemedicine
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    ended_at TIMESTAMPTZ,
    
    -- Formato SOAP (Subjective, Objective, Assessment, Plan)
    soap_subjective TEXT,
    soap_objective TEXT,
    soap_assessment TEXT,
    soap_plan TEXT,
    
    -- Formato DAP alternativo para Psicología
    dap_data TEXT,
    dap_assessment TEXT,
    dap_plan TEXT,
    note_format VARCHAR(10) NOT NULL DEFAULT 'SOAP', -- 'SOAP' o 'DAP'
    
    -- Diagnósticos estructurados (CIE-10 / DSM-5-TR)
    diagnoses JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Ambient Scribe Zero-Retention Metadata
    scribe_metadata JSONB DEFAULT '{
        "scribe_used": false,
        "audio_stream_duration_sec": 0,
        "audio_destroyed_at": null,
        "confidence_score": 0.98,
        "speech_engine": "Whisper-v3-Turbo + Gemini-Flash",
        "entities_extracted": []
    }'::jsonb,
    
    -- FHIR R4 Bundle Representation
    fhir_resource JSONB,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_encounters_patient ON clinical_encounters(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_practitioner ON clinical_encounters(tenant_id, practitioner_id);

-- 5. RECETAS MÉDICAS ELECTRÓNICAS (FEA + QR de Validación)
DO $$ BEGIN
    CREATE TYPE prescription_type AS ENUM ('simple', 'retenida_con_control', 'cheque');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS electronic_prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    encounter_id UUID NOT NULL REFERENCES clinical_encounters(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES clinical_users(id) ON DELETE RESTRICT,
    prescription_code VARCHAR(32) UNIQUE NOT NULL,
    type prescription_type NOT NULL DEFAULT 'simple',
    
    -- Medicamentos estructurados
    medications JSONB NOT NULL,
    
    diagnosis_code VARCHAR(30) NOT NULL, -- CIE-10 (ej: F32.1, F41.1)
    diagnosis_name VARCHAR(255) NOT NULL,
    valid_until DATE NOT NULL,
    
    -- Firma Electrónica Avanzada (FEA)
    fea_signed BOOLEAN NOT NULL DEFAULT false,
    fea_signed_at TIMESTAMPTZ,
    fea_certificate_serial VARCHAR(128),
    fea_signature_digest TEXT, -- Hash SHA-256 / PKCS#7
    
    -- Verificación en Cadenas Farmacéuticas
    qr_verification_token VARCHAR(255) NOT NULL,
    qr_verification_url TEXT NOT NULL,
    dispense_status VARCHAR(30) NOT NULL DEFAULT 'active', -- active, dispensed, cancelled, expired
    dispensed_at TIMESTAMPTZ,
    dispensing_pharmacy_name VARCHAR(150),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_prescriptions_code ON electronic_prescriptions(prescription_code);
CREATE INDEX IF NOT EXISTS idx_prescriptions_token ON electronic_prescriptions(qr_verification_token);

-- 6. ERP FINANCIERO: I-MED / MEDIPASS Y PAGOS E-COMMERCE
CREATE TABLE IF NOT EXISTS appointment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    practitioner_id UUID NOT NULL REFERENCES clinical_users(id) ON DELETE RESTRICT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    copay_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'pending', -- pending, authorized, paid, cancelled
    gateway VARCHAR(30) NOT NULL, -- 'mercadopago', 'fintoc', 'imed_bono', 'cash'
    gateway_transaction_id VARCHAR(120),
    
    -- Bono Electrónico I-Med / Medipass
    bono_number VARCHAR(60),
    bono_authorization_code VARCHAR(60),
    insurance_name VARCHAR(50),
    insurance_contribution NUMERIC(12,2) DEFAULT 0,
    
    -- Consentimiento firmado en pre-ingreso
    consent_signed BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Inventario de Insumos en Box
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,
    current_stock INT NOT NULL DEFAULT 0,
    min_stock_alert INT NOT NULL DEFAULT 5,
    unit VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_inventory_sku UNIQUE (tenant_id, branch_id, sku)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE RESTRICT,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    encounter_id UUID REFERENCES clinical_encounters(id) ON DELETE SET NULL,
    quantity_changed INT NOT NULL,
    movement_type VARCHAR(30) NOT NULL,
    recorded_by UUID NOT NULL REFERENCES clinical_users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 7. AUDITORÍA INMUTABLE (LEY 20.584 - DERECHOS DEL PACIENTE)
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL,
    user_id UUID,
    user_email VARCHAR(255),
    action_type VARCHAR(40) NOT NULL, -- READ_RECORD, EDIT_RECORD, EXPORT_PDF, FEA_SIGN, IMED_VERIFY, DISPENSE_RECETA
    resource_type VARCHAR(60) NOT NULL,
    resource_id VARCHAR(60) NOT NULL,
    patient_id UUID,
    client_ip INET DEFAULT '127.0.0.1'::inet,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Bloqueo inmutable contra manipulación de logs
CREATE OR REPLACE FUNCTION fn_prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are strictly append-only by Law 20.584. Modification or deletion is forbidden.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_immutable_audit_logs ON audit_logs;
CREATE TRIGGER trg_immutable_audit_logs
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_tampering();

CREATE INDEX IF NOT EXISTS idx_audit_tenant_patient ON audit_logs(tenant_id, patient_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE electronic_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

DROP POLICY IF EXISTS tenant_isolation_patients ON patients;
CREATE POLICY tenant_isolation_patients ON patients
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_encounters ON clinical_encounters;
CREATE POLICY tenant_isolation_encounters ON clinical_encounters
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_prescriptions ON electronic_prescriptions;
CREATE POLICY tenant_isolation_prescriptions ON electronic_prescriptions
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_orders ON appointment_orders;
CREATE POLICY tenant_isolation_orders ON appointment_orders
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_inventory ON inventory_items;
CREATE POLICY tenant_isolation_inventory ON inventory_items
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_movements ON inventory_movements;
CREATE POLICY tenant_isolation_movements ON inventory_movements
    FOR ALL USING (tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS tenant_isolation_audit ON audit_logs;
CREATE POLICY tenant_isolation_audit ON audit_logs
    FOR SELECT USING (tenant_id = get_current_tenant_id());
