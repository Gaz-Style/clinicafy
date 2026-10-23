import { NextRequest, NextResponse } from 'next/server';
import { AmbientScribeEngine } from '@/services/ambient-scribe';
import { AuditService } from '@/services/audit-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { transcript, durationSec = 45, tenantId = 'demo-tenant-mental-health', userEmail = 'dra.valenzuela@clinicafy.com' } = body;

    const result = AmbientScribeEngine.processClinicalAudio(transcript, durationSec);

    // Auditoría inmutable de uso de IA en Ficha Clínica
    AuditService.logAction({
      tenantId,
      userEmail,
      actionType: 'CREATE_ENCOUNTER',
      resourceType: 'ClinicalEncounter/AmbientScribe',
      resourceId: `scribe_${Date.now()}`,
      metadata: {
        audioPurged: true,
        speechEngine: result.metadata.speechEngine,
        diagnosesCount: result.suggestedDiagnoses.length,
      },
    });

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
