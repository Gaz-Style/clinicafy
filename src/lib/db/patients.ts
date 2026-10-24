// ============================================================================
// CLINICAFY — DATA ACCESS LAYER: PATIENTS
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { Patient } from '@/types';

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function getPatients(tenantId: string, search?: string): Promise<Patient[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('last_name', { ascending: true });

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,rut.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getPatients: ${error.message}`);
  return (data ?? []) as Patient[];
}

export async function getPatientById(tenantId: string, patientId: string): Promise<Patient | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', patientId)
    .single();
  if (error) return null;
  return data as Patient;
}

export async function getPatientByRut(tenantId: string, rut: string): Promise<Patient | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('rut', rut)
    .single();
  if (error) return null;
  return data as Patient;
}

export async function createPatient(
  tenantId: string,
  payload: Omit<Patient, 'id' | 'tenantId' | 'isActive'>
): Promise<Patient> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('patients')
    .insert({
      tenant_id: tenantId,
      rut: payload.rut,
      first_name: payload.firstName,
      last_name: payload.lastName,
      birthdate: payload.birthdate,
      gender: payload.gender,
      health_insurance: payload.healthInsurance,
      email: payload.email,
      phone: payload.phone,
      emergency_contact: payload.emergencyContact ?? {},
      allergies: payload.allergies ?? [],
      current_medications: payload.currentMedications ?? [],
    })
    .select()
    .single();
  if (error) throw new Error(`createPatient: ${error.message}`);
  return data as Patient;
}

export async function updatePatient(
  tenantId: string,
  patientId: string,
  payload: Partial<Patient>
): Promise<Patient> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('patients')
    .update({
      ...(payload.firstName && { first_name: payload.firstName }),
      ...(payload.lastName && { last_name: payload.lastName }),
      ...(payload.email && { email: payload.email }),
      ...(payload.phone && { phone: payload.phone }),
      ...(payload.healthInsurance && { health_insurance: payload.healthInsurance }),
      ...(payload.allergies && { allergies: payload.allergies }),
      ...(payload.currentMedications && { current_medications: payload.currentMedications }),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', patientId)
    .select()
    .single();
  if (error) throw new Error(`updatePatient: ${error.message}`);
  return data as Patient;
}
