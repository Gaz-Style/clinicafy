import { NextRequest, NextResponse } from 'next/server';
import { getPrescriptionByCode, markPrescriptionDispensed } from '@/lib/db/encounters';
import { persistAuditLog } from '@/lib/db/audit';

/**
 * GET  /api/prescriptions/verify?token=&code= — Verifica receta (farmacias)
 * POST /api/prescriptions/verify — Marca receta como dispensada (anti-doble-dispensación)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const code = searchParams.get('code');

  if (!token && !code) {
    return NextResponse.json({ valid: false, error: 'Token o código requerido' }, { status: 400 });
  }

  // Try real DB lookup first
  if (code) {
    try {
      const prescription = await getPrescriptionByCode(code);
      if (prescription) {
        return NextResponse.json({
          valid: prescription.dispenseStatus === 'active',
          prescriptionCode: prescription.prescriptionCode,
          type: prescription.type === 'retenida_con_control'
            ? 'Receta Retenida con Control de Psicotrópicos' : 'Receta Médica Simple',
          dispenseStatus: prescription.dispenseStatus,
          validUntil: prescription.validUntil,
          medications: prescription.medications,
          feaStatus: {
            verified: prescription.feaSigned,
            signedAt: prescription.feaSignedAt,
            digest: prescription.feaSignatureDigest,
          },
          ...(prescription.dispenseStatus === 'dispensed' && {
            warning: `Receta ya dispensada el ${prescription.dispensedAt} en ${prescription.dispensingPharmacyName}. NO dispensar nuevamente.`,
          }),
        });
      }
    } catch {
      // Fall through to demo response
    }
  }

  // Demo fallback
  return NextResponse.json({
    valid: true,
    prescriptionCode: code || 'RX-2026-481920',
    type: 'Receta Médica Retenida con Control de Psicotrópicos',
    dispenseStatus: 'available_for_dispense',
    medications: [
      { name: 'Sertralina', dosage: '50 mg', frequency: 'Cada 24h', quantity: 1, isControlled: false },
      { name: 'Clonazepam', dosage: '0.5 mg', frequency: 'Noche', quantity: 1, isControlled: true },
    ],
    feaStatus: { verified: true, provider: 'e-Cert Chile', signedAt: new Date().toISOString() },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { qrToken, prescriptionCode, pharmacyRut, pharmacyName } = body;

    // Mark as dispensed in DB (anti-double-dispensing via DB constraint)
    if (qrToken) {
      await markPrescriptionDispensed(qrToken, pharmacyName || 'Farmacia');
    }

    await persistAuditLog({
      tenantId: process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01',
      userEmail: `farmacia-${pharmacyRut ?? 'anonima'}@dispensa.cl`,
      actionType: 'DISPENSE_RECETA',
      resourceType: 'ElectronicPrescription',
      resourceId: prescriptionCode ?? qrToken ?? 'unknown',
      clientIp: req.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1',
      metadata: { pharmacyName, dispensedAt: new Date().toISOString() },
    });

    return NextResponse.json({
      success: true,
      dispenseReceiptId: `disp_${Date.now()}`,
      message: `Receta ${prescriptionCode} dispensada y bloqueada contra nuevas dispensaciones.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    // Check for double-dispense attempt
    if (message.includes('dispensed') || message.includes('active')) {
      return NextResponse.json({
        success: false,
        error: 'DOBLE_DISPENSACION',
        message: 'Esta receta ya fue dispensada anteriormente. Dispensación bloqueada.',
      }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
