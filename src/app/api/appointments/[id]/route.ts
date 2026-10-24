import { NextRequest, NextResponse } from 'next/server';
import { updateAppointmentStatus, confirmPayment, getAppointmentById } from '@/lib/db/appointments';
import { persistAuditLog } from '@/lib/db/audit';

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * GET /api/appointments/[id] — Detalle de una cita
 * PATCH /api/appointments/[id] — Actualizar estado (cancel, check-in, etc.)
 */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const appointment = await getAppointmentById(DEFAULT_TENANT, id);
    if (!appointment) {
      return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { action, cancellationReason, gateway, transactionId, userEmail } = body;

    switch (action) {
      case 'cancel':
        await updateAppointmentStatus(DEFAULT_TENANT, id, 'cancelled', {
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellationReason ?? 'Cancelado por el paciente',
        });
        break;

      case 'check_in':
        await updateAppointmentStatus(DEFAULT_TENANT, id, 'checked_in');
        break;

      case 'confirm_payment':
        if (!gateway || !transactionId) {
          return NextResponse.json({ error: 'gateway y transactionId requeridos' }, { status: 400 });
        }
        await confirmPayment(DEFAULT_TENANT, id, gateway, transactionId);
        break;

      case 'complete':
        await updateAppointmentStatus(DEFAULT_TENANT, id, 'completed');
        break;

      default:
        return NextResponse.json({ error: `Acción no reconocida: ${action}` }, { status: 400 });
    }

    await persistAuditLog({
      tenantId: DEFAULT_TENANT,
      userEmail: userEmail ?? 'sistema@clinicafy.com',
      actionType: 'EDIT_RECORD',
      resourceType: 'Appointment',
      resourceId: id,
      metadata: { action, cancellationReason, gateway, transactionId },
    });

    return NextResponse.json({ success: true, appointmentId: id, action });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
