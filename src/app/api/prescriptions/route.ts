import { NextRequest, NextResponse } from 'next/server';
import { PrescriptionEngine } from '@/services/prescription-engine';
import { AuditService } from '@/services/audit-service';
import { savePrescription } from '@/lib/db/encounters';
import { persistAuditLog } from '@/lib/db/audit';

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenantId = DEFAULT_TENANT,
      encounterId,
      patientId,
      practitionerId,
      patientRut,
      patientName,
      practitionerName,
      practitionerRut,
      practitionerRegistry,
      medications,
      diagnosisCode,
      diagnosisName,
      daysValid,
    } = body;

    const { prescription, qrDataUrl } = await PrescriptionEngine.issuePrescription({
      tenantId,
      encounterId: encounterId || 'enc_demo',
      patientId: patientId || 'pat_demo',
      practitionerId: practitionerId || 'prac_demo',
      patientRut: patientRut || '18.432.890-K',
      patientName: patientName || 'Claudia Morales S.',
      practitionerName: practitionerName || 'Dra. Marcela Valenzuela G.',
      practitionerRut: practitionerRut || '14.890.312-4',
      practitionerRegistry: practitionerRegistry || 'SIS-8921-PSQ',
      medications: medications || [],
      diagnosisCode: diagnosisCode || 'F32.1',
      diagnosisName: diagnosisName || 'Episodio depresivo moderado',
      daysValid,
    });

    // Persist to DB (non-blocking if no encounterId provided)
    if (encounterId && patientId && practitionerId) {
      try {
        await savePrescription(tenantId, prescription);
      } catch (dbErr) {
        console.warn('[Prescriptions API] DB save failed (demo mode):', dbErr);
      }
    }

    // Persist audit log to DB
    await persistAuditLog({
      tenantId,
      userEmail: practitionerRut
        ? `${practitionerRut.replace(/\./g, '')}@clinicafy.com`
        : 'dra.valenzuela@clinicafy.com',
      actionType: 'FEA_SIGN',
      resourceType: 'ElectronicPrescription',
      resourceId: prescription.id,
      patientId,
      clientIp: req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1',
      metadata: {
        code: prescription.prescriptionCode,
        isControlled: prescription.type === 'retenida_con_control',
        feaSignatureDigest: prescription.feaSignatureDigest,
      },
    });

    return NextResponse.json({ success: true, prescription, qrDataUrl });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
