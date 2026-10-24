// ============================================================================
// CLINICAFY — DATA ACCESS LAYER: APPOINTMENTS
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export interface Appointment {
  id: string;
  tenantId: string;
  branchId: string;
  patientId: string;
  practitionerId: string;
  encounterId?: string;
  scheduledAt: string;
  durationMinutes: number;
  modality: 'presencial' | 'telemedicine';
  specialty?: string;
  reasonForVisit?: string;
  allergiesDeclared?: string;
  medicationsDeclared?: string;
  status: 'pending_payment' | 'confirmed' | 'checked_in' | 'in_progress' | 'completed' | 'no_show' | 'cancelled';
  consentSigned: boolean;
  consentSignedAt?: string;
  totalAmount: number;
  copayAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  paymentGateway?: string;
  paymentTransactionId?: string;
  paidAt?: string;
  bonoNumber?: string;
  bonoAuthorizationCode?: string;
  insuranceName?: string;
  insuranceContribution?: number;
  telemedicineRoomId?: string;
  telemedicineRoomUrl?: string;
  reminderSentAt?: string;
  confirmationSentAt?: string;
  notes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailableSlot {
  slotStart: string;
  slotEnd: string;
  isAvailable: boolean;
}

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

function mapRow(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    branchId: row.branch_id as string,
    patientId: row.patient_id as string,
    practitionerId: row.practitioner_id as string,
    encounterId: row.encounter_id as string | undefined,
    scheduledAt: row.scheduled_at as string,
    durationMinutes: row.duration_minutes as number,
    modality: row.modality as 'presencial' | 'telemedicine',
    specialty: row.specialty as string | undefined,
    reasonForVisit: row.reason_for_visit as string | undefined,
    allergiesDeclared: row.allergies_declared as string | undefined,
    medicationsDeclared: row.medications_declared as string | undefined,
    status: row.status as Appointment['status'],
    consentSigned: row.consent_signed as boolean,
    consentSignedAt: row.consent_signed_at as string | undefined,
    totalAmount: row.total_amount as number,
    copayAmount: row.copay_amount as number,
    paymentStatus: row.payment_status as Appointment['paymentStatus'],
    paymentGateway: row.payment_gateway as string | undefined,
    paymentTransactionId: row.payment_transaction_id as string | undefined,
    paidAt: row.paid_at as string | undefined,
    bonoNumber: row.bono_number as string | undefined,
    bonoAuthorizationCode: row.bono_authorization_code as string | undefined,
    insuranceName: row.insurance_name as string | undefined,
    insuranceContribution: row.insurance_contribution as number | undefined,
    telemedicineRoomId: row.telemedicine_room_id as string | undefined,
    telemedicineRoomUrl: row.telemedicine_room_url as string | undefined,
    reminderSentAt: row.reminder_sent_at as string | undefined,
    confirmationSentAt: row.confirmation_sent_at as string | undefined,
    notes: row.notes as string | undefined,
    cancelledAt: row.cancelled_at as string | undefined,
    cancellationReason: row.cancellation_reason as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export async function getAppointments(
  tenantId: string,
  filters?: { practitionerId?: string; patientId?: string; dateFrom?: string; dateTo?: string; status?: string }
): Promise<Appointment[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('scheduled_at', { ascending: true });

  if (filters?.practitionerId) query = query.eq('practitioner_id', filters.practitionerId);
  if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
  if (filters?.dateFrom) query = query.gte('scheduled_at', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('scheduled_at', filters.dateTo);
  if (filters?.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  if (error) throw new Error(`getAppointments: ${error.message}`);
  return (data ?? []).map(mapRow);
}

export async function getAppointmentById(tenantId: string, id: string): Promise<Appointment | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', id)
    .single();
  if (error) return null;
  return mapRow(data);
}

export async function createAppointment(
  tenantId: string,
  payload: Pick<Appointment,
    'branchId' | 'patientId' | 'practitionerId' | 'scheduledAt' | 'durationMinutes' |
    'modality' | 'specialty' | 'totalAmount' | 'copayAmount' | 'insuranceName' | 'insuranceContribution'
  > & { reasonForVisit?: string; allergiesDeclared?: string; medicationsDeclared?: string }
): Promise<Appointment> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      tenant_id: tenantId,
      branch_id: payload.branchId,
      patient_id: payload.patientId,
      practitioner_id: payload.practitionerId,
      scheduled_at: payload.scheduledAt,
      duration_minutes: payload.durationMinutes,
      modality: payload.modality,
      specialty: payload.specialty,
      reason_for_visit: payload.reasonForVisit,
      allergies_declared: payload.allergiesDeclared,
      medications_declared: payload.medicationsDeclared,
      total_amount: payload.totalAmount,
      copay_amount: payload.copayAmount,
      insurance_name: payload.insuranceName,
      insurance_contribution: payload.insuranceContribution,
      status: 'pending_payment',
      payment_status: 'pending',
    })
    .select()
    .single();
  if (error) throw new Error(`createAppointment: ${error.message}`);
  return mapRow(data);
}

export async function updateAppointmentStatus(
  tenantId: string,
  id: string,
  status: Appointment['status'],
  extra?: Partial<Record<string, unknown>>
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString(), ...(extra ?? {}) })
    .eq('tenant_id', tenantId)
    .eq('id', id);
  if (error) throw new Error(`updateAppointmentStatus: ${error.message}`);
}

export async function confirmPayment(
  tenantId: string,
  appointmentId: string,
  gateway: string,
  transactionId: string
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('appointments')
    .update({
      payment_status: 'paid',
      payment_gateway: gateway,
      payment_transaction_id: transactionId,
      paid_at: new Date().toISOString(),
      status: 'confirmed',
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', appointmentId);
  if (error) throw new Error(`confirmPayment: ${error.message}`);
}

export async function getAvailableSlots(
  practitionerId: string,
  branchId: string,
  date: string
): Promise<AvailableSlot[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_practitioner_id: practitionerId,
    p_branch_id: branchId,
    p_date: date,
  });
  if (error) throw new Error(`getAvailableSlots: ${error.message}`);
  return (data ?? []).map((r: Record<string, unknown>) => ({
    slotStart: r.slot_start as string,
    slotEnd: r.slot_end as string,
    isAvailable: r.is_available as boolean,
  }));
}
