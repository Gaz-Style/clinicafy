import { NextRequest, NextResponse } from 'next/server';
import { persistAuditLog } from '@/lib/db/audit';
import { getAuditTrail } from '@/lib/db/audit';

const DEFAULT_TENANT = process.env.DEFAULT_TENANT_ID ?? 'tenant-andino-01';

/**
 * POST /api/audit — Persiste un registro de auditoría (desde cliente)
 * GET  /api/audit — Retorna el trail de auditoría filtrado
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? '127.0.0.1';

    await persistAuditLog({
      tenantId: body.tenantId ?? DEFAULT_TENANT,
      userEmail: body.userEmail,
      actionType: body.actionType,
      resourceType: body.resourceType,
      resourceId: body.resourceId,
      patientId: body.patientId,
      clientIp,
      metadata: body.metadata ?? {},
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Never fail — audit must not block clinical operations
    console.error('[API/Audit] Error:', error);
    return NextResponse.json({ ok: true });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const patientId = searchParams.get('patientId') ?? undefined;
  const actionType = searchParams.get('actionType') ?? undefined;
  const limit = parseInt(searchParams.get('limit') ?? '50');

  try {
    const entries = await getAuditTrail(DEFAULT_TENANT, { patientId, actionType, limit });
    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
