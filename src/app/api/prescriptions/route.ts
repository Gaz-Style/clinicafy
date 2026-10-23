import { NextRequest, NextResponse } from 'next/server';
import { PrescriptionEngine } from '@/services/prescription-engine';
import { AuditService } from '@/services/audit-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId = 'demo-tenant-mental-health',
      encounterId = 'enc_001',
      patientId = 'pat_001',
      practitionerId = 'prac_001',
      patientRut,
      patientName,
      practitionerName,
      practitionerRut,
      practitionerRegistry,
      medications,
      diagnosisCode,
      diagnosisName,
    } = body;

    const { prescription, qrDataUrl } = await PrescriptionEngine.issuePrescription({
      tenantId,
      encounterId,
      patientId,
      practitionerId,
      patientRut: patientRut || '18.432.890-K',
      patientName: patientName || 'Claudia Morales S.',
      practitionerName: practitionerName || 'Dra. Marcela Valenzuela G.',
      practitionerRut: practitionerRut || '14.890.312-4',
      practitionerRegistry: practitionerRegistry || 'SIS-8921-PSQ',
      medications: medications || [],
      diagnosisCode: diagnosisCode || 'F32.1',
      diagnosisName: diagnosisName || 'Episodio depresivo moderado',
    });

    // Registrar en auditoría inmutable
    AuditService.logAction({
      tenantId,
      userEmail: 'dra.valenzuela@clinicafy.com',
      actionType: 'FEA_SIGN',
      resourceType: 'ElectronicPrescription',
      resourceId: prescription.id,
      patientId,
      metadata: {
        code: prescription.prescriptionCode,
        isControlled: prescription.type === 'retenida_con_control',
        feaSignatureDigest: prescription.feaSignatureDigest,
      },
    });

    return NextResponse.json({
      success: true,
      prescription,
      qrDataUrl,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
