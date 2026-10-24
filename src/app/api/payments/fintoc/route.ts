import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/db/appointments';
import { persistAuditLog } from '@/lib/db/audit';

const FINTOC_SECRET = process.env.FINTOC_SECRET_KEY;
const MERCADOPAGO_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * POST /api/payments/fintoc
 * Inicia una sesión de pago Fintoc (Open Banking / Transferencia inmediata).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, amount, patientEmail, patientName, description } = body;

    if (!appointmentId || !amount) {
      return NextResponse.json({ error: 'appointmentId y amount son requeridos' }, { status: 400 });
    }

    if (!FINTOC_SECRET) {
      // Demo mode: simulate payment link
      return NextResponse.json({
        success: true,
        mode: 'demo',
        paymentUrl: `https://app.fintoc.com/payment-intents/demo_${appointmentId}`,
        widgetToken: `wt_demo_${Date.now()}`,
        message: 'Modo demo: configure FINTOC_SECRET_KEY para pagos reales',
      });
    }

    // Real Fintoc API call
    const response = await fetch('https://api.fintoc.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FINTOC_SECRET}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency: 'clp',
        recipient_account: {
          holder_id: process.env.FINTOC_HOLDER_RUT,
          number: process.env.FINTOC_ACCOUNT_NUMBER,
          type: 'checking_account',
          institution_id: process.env.FINTOC_INSTITUTION_ID ?? 'cl_banco_estado',
        },
        reference_id: appointmentId,
        metadata: {
          patient_email: patientEmail,
          patient_name: patientName,
          description: description ?? 'Copago consulta médica',
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message ?? 'Fintoc API error');

    return NextResponse.json({
      success: true,
      paymentIntentId: data.id,
      widgetToken: data.widget_token,
      paymentUrl: data.payment_url,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
