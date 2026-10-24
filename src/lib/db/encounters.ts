// ============================================================================
// CLINICAFY — DATA ACCESS LAYER: ENCOUNTERS & PRESCRIPTIONS
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { ClinicalEncounter, ElectronicPrescription, MedicalDiagnosis } from '@/types';

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

// ─── ENCOUNTERS ──────────────────────────────────────────────────────────────

export async function createEncounter(
  tenantId: string,
  payload: {
    branchId: string;
    patientId: string;
    practitionerId: string;
    appointmentId?: string;
    encounterType: 'in_person' | 'telemedicine';
    noteFormat: 'SOAP' | 'DAP';
  }
): Promise<ClinicalEncounter> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('clinical_encounters')
    .insert({
      tenant_id: tenantId,
      branch_id: payload.branchId,
      patient_id: payload.patientId,
      practitioner_id: payload.practitionerId,
      encounter_type: payload.encounterType,
      note_format: payload.noteFormat,
      status: 'in_progress',
      diagnoses: [],
    })
    .select()
    .single();
  if (error) throw new Error(`createEncounter: ${error.message}`);

  // Link encounter to appointment if provided
  if (payload.appointmentId) {
    await supabase
      .from('appointments')
      .update({ encounter_id: data.id, status: 'in_progress', updated_at: new Date().toISOString() })
      .eq('id', payload.appointmentId);
  }

  return mapEncounterRow(data);
}

export async function updateEncounterNote(
  tenantId: string,
  encounterId: string,
  soap: { subjective: string; objective: string; assessment: string; plan: string },
  dap?: { data: string; assessment: string; plan: string },
  diagnoses?: unknown[],
  scribeMetadata?: unknown
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('clinical_encounters')
    .update({
      soap_subjective: soap.subjective,
      soap_objective: soap.objective,
      soap_assessment: soap.assessment,
      soap_plan: soap.plan,
      ...(dap && { dap_data: dap.data, dap_assessment: dap.assessment, dap_plan: dap.plan }),
      ...(diagnoses && { diagnoses }),
      ...(scribeMetadata ? { scribe_metadata: scribeMetadata } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', encounterId);
  if (error) throw new Error(`updateEncounterNote: ${error.message}`);
}

export async function completeEncounter(tenantId: string, encounterId: string): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('clinical_encounters')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('tenant_id', tenantId)
    .eq('id', encounterId);
  if (error) throw new Error(`completeEncounter: ${error.message}`);
}

export async function getEncountersByPatient(
  tenantId: string,
  patientId: string,
  limit = 20
): Promise<ClinicalEncounter[]> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('clinical_encounters')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getEncountersByPatient: ${error.message}`);
  return (data ?? []).map(mapEncounterRow);
}

function mapEncounterRow(row: Record<string, unknown>): ClinicalEncounter {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    branchId: row.branch_id as string,
    patientId: row.patient_id as string,
    practitionerId: row.practitioner_id as string,
    status: row.status as ClinicalEncounter['status'],
    encounterType: row.encounter_type as ClinicalEncounter['encounterType'],
    startedAt: row.started_at as string,
    endedAt: row.ended_at as string | undefined,
    noteFormat: row.note_format as 'SOAP' | 'DAP',
    soap: {
      subjective: (row.soap_subjective as string) ?? '',
      objective: (row.soap_objective as string) ?? '',
      assessment: (row.soap_assessment as string) ?? '',
      plan: (row.soap_plan as string) ?? '',
    },
    dap: row.dap_data ? {
      data: row.dap_data as string,
      assessment: row.dap_assessment as string,
      plan: row.dap_plan as string,
    } : undefined,
    diagnoses: (row.diagnoses as MedicalDiagnosis[]) ?? [],
    scribeMetadata: (row.scribe_metadata as ClinicalEncounter['scribeMetadata']) ?? {
      scribeUsed: false, audioStreamDurationSec: 0, audioDestroyedAt: null,
      confidenceScore: 0, speechEngine: '', entitiesExtracted: [],
    },
    createdAt: row.created_at as string,
  };
}

// ─── PRESCRIPTIONS ───────────────────────────────────────────────────────────

export async function savePrescription(
  tenantId: string,
  prescription: ElectronicPrescription
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('electronic_prescriptions')
    .upsert({
      id: prescription.id,
      tenant_id: tenantId,
      encounter_id: prescription.encounterId,
      patient_id: prescription.patientId,
      practitioner_id: prescription.practitionerId,
      prescription_code: prescription.prescriptionCode,
      type: prescription.type,
      medications: prescription.medications,
      diagnosis_code: prescription.diagnosisCode,
      diagnosis_name: prescription.diagnosisName,
      valid_until: prescription.validUntil,
      fea_signed: prescription.feaSigned,
      fea_signed_at: prescription.feaSignedAt,
      fea_certificate_serial: prescription.feaCertificateSerial,
      fea_signature_digest: prescription.feaSignatureDigest,
      qr_verification_token: prescription.qrVerificationToken,
      qr_verification_url: prescription.qrVerificationUrl,
      dispense_status: prescription.dispenseStatus,
    });
  if (error) throw new Error(`savePrescription: ${error.message}`);
}

export async function getPrescriptionByCode(code: string): Promise<ElectronicPrescription | null> {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from('electronic_prescriptions')
    .select('*')
    .eq('prescription_code', code)
    .single();
  if (error) return null;
  return mapPrescriptionRow(data);
}

export async function markPrescriptionDispensed(
  token: string,
  pharmacyName: string
): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from('electronic_prescriptions')
    .update({
      dispense_status: 'dispensed',
      dispensed_at: new Date().toISOString(),
      dispensing_pharmacy_name: pharmacyName,
    })
    .eq('qr_verification_token', token)
    .eq('dispense_status', 'active'); // Solo si está activa (previene doble dispensación)
  if (error) throw new Error(`markPrescriptionDispensed: ${error.message}`);
}

function mapPrescriptionRow(row: Record<string, unknown>): ElectronicPrescription {
  return {
    id: row.id as string,
    tenantId: row.tenant_id as string,
    encounterId: row.encounter_id as string,
    patientId: row.patient_id as string,
    practitionerId: row.practitioner_id as string,
    prescriptionCode: row.prescription_code as string,
    type: row.type as ElectronicPrescription['type'],
    medications: row.medications as ElectronicPrescription['medications'],
    diagnosisCode: row.diagnosis_code as string,
    diagnosisName: row.diagnosis_name as string,
    validUntil: row.valid_until as string,
    feaSigned: row.fea_signed as boolean,
    feaSignedAt: row.fea_signed_at as string | undefined,
    feaCertificateSerial: row.fea_certificate_serial as string | undefined,
    feaSignatureDigest: row.fea_signature_digest as string | undefined,
    qrVerificationToken: row.qr_verification_token as string,
    qrVerificationUrl: row.qr_verification_url as string,
    dispenseStatus: row.dispense_status as ElectronicPrescription['dispenseStatus'],
    dispensedAt: row.dispensed_at as string | undefined,
    dispensingPharmacyName: row.dispensing_pharmacy_name as string | undefined,
    createdAt: row.created_at as string,
  };
}
