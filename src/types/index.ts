// ============================================================================
// CLINICAFY - ENTERPRISE HEALTHCARE TYPE DEFINITIONS
// Standards: FHIR R4, CIE-10, DSM-5-TR, Ley 20.584, FEA PKI
// ============================================================================

export type ClinicalRole =
  | 'super_admin'
  | 'clinic_admin'
  | 'medical_director'
  | 'psychiatrist'
  | 'psychologist'
  | 'general_practitioner'
  | 'nurse'
  | 'receptionist';

export interface Tenant {
  id: string;
  slug: string;
  businessName: string;
  rut: string;
  domain?: string;
  settings: {
    currency: string;
    timezone: string;
    allowPatientBooking: boolean;
    enforceFea: boolean;
    imedEnabled: boolean;
  };
  isActive: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  isMain: boolean;
}

export interface ClinicalUser {
  id: string;
  tenantId: string;
  email: string;
  role: ClinicalRole;
  rut: string;
  firstName: string;
  lastName: string;
  nationalRegistryId?: string; // SIS Registro Prestadores
  mfaEnforced: boolean;
  feaCertificateId?: string;
  feaProvider?: 'e-cert' | 'acepta' | 'firmagob';
  isActive: boolean;
}

export interface Patient {
  id: string;
  tenantId: string;
  rut: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  gender: 'femenino' | 'masculino' | 'otro' | 'no_especifica';
  healthInsurance: 'Fonasa A' | 'Fonasa B' | 'Fonasa C' | 'Fonasa D' | 'Colmena' | 'Banmédica' | 'Consalud' | 'CruzBlanca' | 'Particular';
  email: string;
  phone: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relation: string;
  };
  allergies: string[];
  currentMedications: string[];
  isActive: boolean;
}

export interface MedicalDiagnosis {
  code: string; // ej: F32.1, F41.1, F90.0
  system: 'ICD-10' | 'DSM-5-TR';
  display: string;
  primary: boolean;
  confidence?: number;
}

export interface SoapNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface DapNote {
  data: string;
  assessment: string;
  plan: string;
}

export interface AmbientScribeMetadata {
  scribeUsed: boolean;
  audioStreamDurationSec: number;
  audioDestroyedAt: string | null;
  confidenceScore: number;
  speechEngine: string;
  entitiesExtracted: Array<{
    category: 'symptom' | 'medication' | 'timeline' | 'mental_status';
    text: string;
  }>;
}

export interface ClinicalEncounter {
  id: string;
  tenantId: string;
  branchId: string;
  patientId: string;
  practitionerId: string;
  status: 'in_progress' | 'completed' | 'amended' | 'cancelled';
  encounterType: 'in_person' | 'telemedicine';
  startedAt: string;
  endedAt?: string;
  noteFormat: 'SOAP' | 'DAP';
  soap: SoapNote;
  dap?: DapNote;
  diagnoses: MedicalDiagnosis[];
  scribeMetadata: AmbientScribeMetadata;
  createdAt: string;
}

export interface PrescriptionMedication {
  id: string;
  name: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  instructions: string;
  isControlled: boolean; // Psicotrópico o estupefaciente sujeto a control
}

export interface ElectronicPrescription {
  id: string;
  tenantId: string;
  encounterId: string;
  patientId: string;
  practitionerId: string;
  prescriptionCode: string;
  type: 'simple' | 'retenida_con_control' | 'cheque';
  medications: PrescriptionMedication[];
  diagnosisCode: string;
  diagnosisName: string;
  validUntil: string;
  feaSigned: boolean;
  feaSignedAt?: string;
  feaCertificateSerial?: string;
  feaSignatureDigest?: string;
  qrVerificationToken: string;
  qrVerificationUrl: string;
  dispenseStatus: 'active' | 'dispensed' | 'cancelled' | 'expired';
  dispensedAt?: string;
  dispensingPharmacyName?: string;
  createdAt: string;
}

export interface ImedBonoRequest {
  patientRut: string;
  healthInsurance: string;
  prestacionCode: string; // ej: 0901001 (Consulta Psiquiatría)
  totalPrice: number;
}

export interface ImedBonoResponse {
  authorized: boolean;
  bonoNumber: string;
  authorizationCode: string;
  insuranceContribution: number;
  copayAmount: number;
  patientRut: string;
  insuranceName: string;
  timestamp: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStockAlert: number;
  unit: string;
  branchId: string;
}

export interface BiometricTelemetry {
  timestamp: string;
  deviceId: string;
  heartRateBpm: number;
  hrvMs: number; // Heart rate variability
  spo2Percent: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  stressLevel: 'low' | 'moderate' | 'high' | 'alert';
}

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userEmail: string;
  actionType:
    | 'READ_RECORD'
    | 'CREATE_ENCOUNTER'
    | 'EDIT_RECORD'
    | 'EXPORT_PDF'
    | 'FEA_SIGN'
    | 'IMED_VERIFY'
    | 'DISPENSE_RECETA'
    | 'CONSUME_INVENTORY';
  resourceType: string;
  resourceId: string;
  patientId?: string;
  clientIp: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}
