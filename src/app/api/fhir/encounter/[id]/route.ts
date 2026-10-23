import { NextRequest, NextResponse } from 'next/server';
import { FhirAdapter } from '@/services/fhir-adapter';
import { ClinicalEncounter, Patient } from '@/types';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Paciente y Encuentro representativos para FHIR R4
  const mockPatient: Patient = {
    id: 'pat-9941',
    tenantId: 'demo-tenant',
    rut: '18.432.890-K',
    firstName: 'Claudia',
    lastName: 'Morales Sepúlveda',
    birthdate: '1992-06-14',
    gender: 'femenino',
    healthInsurance: 'Colmena',
    email: 'claudia.morales@example.cl',
    phone: '+56987654321',
    allergies: ['Penicilina'],
    currentMedications: ['Sertralina 50mg'],
    isActive: true,
  };

  const mockEncounter: ClinicalEncounter = {
    id,
    tenantId: 'demo-tenant',
    branchId: 'branch-providencia',
    patientId: mockPatient.id,
    practitionerId: 'prac-dra-valenzuela',
    status: 'completed',
    encounterType: 'telemedicine',
    startedAt: new Date(Date.now() - 2400000).toISOString(),
    endedAt: new Date().toISOString(),
    noteFormat: 'SOAP',
    soap: {
      subjective: 'Paciente consulta por sintomatología afectiva depresiva...',
      objective: 'Examen mental: Hipotimia, juicio conservado...',
      assessment: 'Episodio depresivo moderado F32.1...',
      plan: 'Inicio de farmacoterapia y psicoterapia...',
    },
    diagnoses: [
      {
        code: 'F32.1',
        system: 'ICD-10',
        display: 'Episodio depresivo moderado',
        primary: true,
      },
      {
        code: 'F41.1',
        system: 'ICD-10',
        display: 'Trastorno de ansiedad generalizada',
        primary: false,
      },
    ],
    scribeMetadata: {
      scribeUsed: true,
      audioStreamDurationSec: 48,
      audioDestroyedAt: new Date().toISOString(),
      confidenceScore: 0.96,
      speechEngine: 'Whisper-Large-v3-Turbo',
      entitiesExtracted: [],
    },
    createdAt: new Date().toISOString(),
  };

  const fhirBundle = FhirAdapter.toFhirR4Bundle(mockEncounter, mockPatient);

  return NextResponse.json(fhirBundle, {
    headers: {
      'Content-Type': 'application/fhir+json; charset=utf-8',
      'X-FHIR-Version': '4.0.1',
    },
  });
}
