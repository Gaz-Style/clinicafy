import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/db/appointments';
import { persistAuditLog } from '@/lib/db/audit';

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * POST /api/payments/webhook
 * Recibe webhooks de MercadoPago y Fintoc para confirmar pagos.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const gateway = req.headers.get('x-gateway') ?? 'unknown';

    // ─── MercadoPago webhook ─────────────────────────────────────────────────
    if (body.type === 'payment' && body.action === 'payment.updated') {
      const paymentId = body.data?.id;
      if (!paymentId) return NextResponse.json({ ok: true });

      // Fetch payment details from MP
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!mpToken) return NextResponse.json({ ok: true });

      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      const payment = await mpRes.json();

      if (payment.status === 'approved' && payment.external_reference) {
        const appointmentId = payment.external_reference;
        await confirmPayment(DEFAULT_TENANT, appointmentId, 'mercadopago', String(paymentId));
        await persistAuditLog({
          tenantId: DEFAULT_TENANT,
          userEmail: 'webhook@mercadopago.com',
          actionType: 'EDIT_RECORD',
          resourceType: 'Appointment/Payment',
          resourceId: appointmentId,
          metadata: { paymentId, status: payment.status, amount: payment.transaction_amount },
        });
      }
      return NextResponse.json({ ok: true });
    }

    // ─── Fintoc webhook ──────────────────────────────────────────────────────
    if (body.type === 'payment_intent.succeeded' && body.data?.reference_id) {
      const appointmentId = body.data.reference_id;
      await confirmPayment(DEFAULT_TENANT, appointmentId, 'fintoc', body.data.id);
      await persistAuditLog({
        tenantId: DEFAULT_TENANT,
        userEmail: 'webhook@fintoc.com',
        actionType: 'EDIT_RECORD',
        resourceType: 'Appointment/Payment',
        resourceId: appointmentId,
        metadata: { fintocPaymentId: body.data.id, amount: body.data.amount },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true, skipped: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    // Always return 200 to prevent retry storms
    return NextResponse.json({ ok: true });
  }
}
