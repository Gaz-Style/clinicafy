import { NextRequest, NextResponse } from 'next/server';
import { ImedEngine } from '@/services/imed-engine';
import { AuditService } from '@/services/audit-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { patientRut, healthInsurance, prestacionCode = '0901001', totalPrice = 45000 } = body;

    const result = await ImedEngine.calculateAndAuthorizeBono({
      patientRut: patientRut || '18.432.890-K',
      healthInsurance: healthInsurance || 'Colmena',
      prestacionCode,
      totalPrice,
    });

    // Auditoría inmutable de validación financiera en salud
    AuditService.logAction({
      tenantId: 'demo-tenant-mental-health',
      userEmail: 'caja.admision@clinicafy.com',
      actionType: 'IMED_VERIFY',
      resourceType: 'BonoElectronico',
      resourceId: result.bonoNumber,
      metadata: {
        insurance: healthInsurance,
        copay: result.copayAmount,
        contribution: result.insuranceContribution,
      },
    });

    return NextResponse.json({
      success: true,
      bono: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error en cálculo de bono I-Med';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
