import { ClinicalEncounter, Patient, ElectronicPrescription } from '@/types';

export class FhirAdapter {
  /**
   * Transforma un encuentro clínico y sus diagnósticos a un Bundle FHIR R4 estándar.
   */
  public static toFhirR4Bundle(encounter: ClinicalEncounter, patient: Patient, prescription?: ElectronicPrescription) {
    const bundleId = `bundle-enc-${encounter.id}`;
    
    return {
      resourceType: 'Bundle',
      id: bundleId,
      type: 'document',
      timestamp: encounter.startedAt,
      entry: [
        {
          fullUrl: `urn:uuid:${patient.id}`,
          resource: {
            resourceType: 'Patient',
            id: patient.id,
            identifier: [
              {
                use: 'official',
                system: 'https://registrocivil.cl/run',
                value: patient.rut,
              },
            ],
            name: [
              {
                family: patient.lastName,
                given: [patient.firstName],
              },
            ],
            gender: patient.gender === 'femenino' ? 'female' : 'male',
            birthDate: patient.birthdate,
            telecom: [
              { system: 'email', value: patient.email },
              { system: 'phone', value: patient.phone },
            ],
          },
        },
        {
          fullUrl: `urn:uuid:${encounter.id}`,
          resource: {
            resourceType: 'Encounter',
            id: encounter.id,
            status: encounter.status === 'completed' ? 'finished' : 'in-progress',
            class: {
              system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
              code: encounter.encounterType === 'telemedicine' ? 'VR' : 'AMB',
              display: encounter.encounterType === 'telemedicine' ? 'Virtual' : 'Ambulatory',
            },
            subject: {
              reference: `urn:uuid:${patient.id}`,
            },
            period: {
              start: encounter.startedAt,
              end: encounter.endedAt || undefined,
            },
          },
        },
        ...encounter.diagnoses.map((diag, idx) => ({
          fullUrl: `urn:uuid:condition-${encounter.id}-${idx}`,
          resource: {
            resourceType: 'Condition',
            clinicalStatus: {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/condition-clinical',
                  code: 'active',
                },
              ],
            },
            code: {
              coding: [
                {
                  system: diag.system === 'ICD-10' ? 'http://hl7.org/fhir/sid/icd-10' : 'http://hl7.org/fhir/sid/dsm-5',
                  code: diag.code,
                  display: diag.display,
                },
              ],
            },
            subject: {
              reference: `urn:uuid:${patient.id}`,
            },
          },
        })),
        ...(prescription
          ? prescription.medications.map((med, mIdx) => ({
              fullUrl: `urn:uuid:med-req-${prescription.id}-${mIdx}`,
              resource: {
                resourceType: 'MedicationRequest',
                status: 'active',
                intent: 'order',
                medicationCodeableConcept: {
                  text: `${med.name} ${med.dosage}`,
                },
                dosageInstruction: [
                  {
                    text: `${med.frequency} por ${med.durationDays} días. ${med.instructions}`,
                  },
                ],
                subject: {
                  reference: `urn:uuid:${patient.id}`,
                },
              },
            }))
          : []),
      ],
    };
  }
}
