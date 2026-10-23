import { NextRequest, NextResponse } from 'next/server';
import { AuditService } from '@/services/audit-service';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const code = searchParams.get('code');

  if (!token && !code) {
    return NextResponse.json({ valid: false, error: 'Token o código de verificación no provisto' }, { status: 400 });
  }

  // Simulación de verificación con el servicio central de recetas
  const isRetained = code?.includes('RX-') ?? false;

  return NextResponse.json({
    valid: true,
    prescriptionCode: code || 'RX-2026-481920',
    type: isRetained ? 'Receta Médica Retenida con Control de Psicotrópicos' : 'Receta Simple',
    patient: {
      name: 'Claudia Morales Sepúlveda',
      rut: '18.432.890-K',
      healthInsurance: 'Colmena Golden Cross',
    },
    practitioner: {
      name: 'Dra. Marcela Valenzuela Guzmán',
      specialty: 'Psiquiatría Adultos',
      rut: '14.890.312-4',
      nationalRegistryId: 'SIS-8921-PSQ',
    },
    feaStatus: {
      verified: true,
      provider: 'e-Cert Chile / PKI Gubernamental',
      signedAt: new Date(Date.now() - 3600000).toISOString(),
      digest: 'sha256-fea-9f82c401b8e21a48c90327fbcde99201a33215',
    },
    dispenseStatus: 'available_for_dispense',
    medications: [
      {
        name: 'Sertralina Clorhidrato',
        dosage: '50 mg',
        frequency: 'Cada 24 horas (matinal)',
        duration: '30 días',
        quantity: '1 caja (30 comprimidos)',
      },
      {
        name: 'Clonazepam',
        dosage: '0.5 mg',
        frequency: '1 comprimido sublingual noche',
        duration: '14 días',
        quantity: '1 caja (30 comprimidos)',
        isControlled: true,
      },
    ],
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prescriptionCode, pharmacyRut, pharmacyName } = body;

    AuditService.logAction({
      tenantId: 'demo-tenant-mental-health',
      userEmail: `farmacia-${pharmacyRut || 'farmacias-ahumada'}@dispensa.cl`,
      actionType: 'DISPENSE_RECETA',
      resourceType: 'ElectronicPrescription',
      resourceId: prescriptionCode,
      metadata: {
        pharmacyName: pharmacyName || 'Cadena Farmacéutica Cruz Verde / Ahumada',
        dispensedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      dispenseReceiptId: `disp_${Date.now()}`,
      message: `Receta ${prescriptionCode} marcada como dispensada exitosamente. Bloqueada para nuevas dispensaciones.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al procesar';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
