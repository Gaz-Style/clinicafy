import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/db/appointments';
import { persistAuditLog } from '@/lib/db/audit';
import { createHmac } from 'crypto';

const MERCADOPAGO_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET;
const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * POST /api/payments/mercadopago
 * Crea una preferencia de pago en MercadoPago (Webpay Plus / Khipu).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointmentId, amount, patientEmail, description } = body;

    if (!appointmentId || !amount) {
      return NextResponse.json({ error: 'appointmentId y amount son requeridos' }, { status: 400 });
    }

    if (!MERCADOPAGO_TOKEN) {
      return NextResponse.json({
        success: true,
        mode: 'demo',
        checkoutUrl: `https://www.mercadopago.cl/checkout/v1/redirect?pref_id=demo_${appointmentId}`,
        preferenceId: `demo_pref_${Date.now()}`,
        message: 'Modo demo: configure MERCADOPAGO_ACCESS_TOKEN para pagos reales',
      });
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${MERCADOPAGO_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': `clinicafy-${appointmentId}`,
      },
      body: JSON.stringify({
        items: [{
          id: appointmentId,
          title: description ?? 'Copago Consulta Médica — Clinicafy',
          quantity: 1,
          unit_price: amount,
          currency_id: 'CLP',
        }],
        payer: { email: patientEmail },
        external_reference: appointmentId,
        back_urls: {
          success: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking/success?appointment=${appointmentId}`,
          failure: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking/failure?appointment=${appointmentId}`,
          pending: `${process.env.NEXT_PUBLIC_APP_URL}/portal/booking/pending?appointment=${appointmentId}`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        statement_descriptor: 'CLINICAFY',
        payment_methods: {
          excluded_payment_types: [{ id: 'credit_card' }], // Solo débito/transferencia para Chile
          installments: 1,
        },
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message ?? 'MercadoPago API error');

    return NextResponse.json({
      success: true,
      preferenceId: data.id,
      checkoutUrl: data.init_point, // Webpay Plus redirect URL
      sandboxUrl: data.sandbox_init_point,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
