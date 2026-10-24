// ============================================================================
// CLINICAFY — DATA ACCESS LAYER: AUDIT (Persistente en Supabase)
// ============================================================================
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import type { AuditLogEntry } from '@/types';

async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

export async function persistAuditLog(params: {
  tenantId: string;
  userId?: string;
  userEmail: string;
  actionType: AuditLogEntry['actionType'];
  resourceType: string;
  resourceId: string;
  patientId?: string;
  clientIp?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await getSupabase();
  const { error } = await supabase.from('audit_logs').insert({
    tenant_id: params.tenantId,
    user_id: params.userId ?? null,
    user_email: params.userEmail,
    action_type: params.actionType,
    resource_type: params.resourceType,
    resource_id: params.resourceId,
    patient_id: params.patientId ?? null,
    client_ip: params.clientIp ?? '127.0.0.1',
    metadata: params.metadata ?? {},
  });
  if (error) {
    // Log but don't throw — audit failure should never block clinical operations
    console.error('[AuditDB] Failed to persist audit log:', error.message);
  }
}

export async function getAuditTrail(
  tenantId: string,
  filters?: { patientId?: string; actionType?: string; limit?: number }
): Promise<AuditLogEntry[]> {
  const supabase = await getSupabase();
  let query = supabase
    .from('audit_logs')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('timestamp', { ascending: false })
    .limit(filters?.limit ?? 50);

  if (filters?.patientId) query = query.eq('patient_id', filters.patientId);
  if (filters?.actionType) query = query.eq('action_type', filters.actionType);

  const { data, error } = await query;
  if (error) throw new Error(`getAuditTrail: ${error.message}`);

  return (data ?? []).map(r => ({
    id: String(r.id),
    tenantId: r.tenant_id,
    userEmail: r.user_email,
    actionType: r.action_type as AuditLogEntry['actionType'],
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    patientId: r.patient_id ?? undefined,
    clientIp: r.client_ip,
    metadata: r.metadata ?? {},
    timestamp: r.timestamp,
  }));
}
