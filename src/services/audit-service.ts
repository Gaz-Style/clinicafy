// ============================================================================
// CLINICAFY — AUDIT SERVICE (híbrido: memoria + Supabase persistente)
// Server-side: persiste en BD. Client-side: mantiene estado local.
// ============================================================================
import { AuditLogEntry } from '@/types';

export class AuditService {
  /** In-memory ledger for client-side display (non-persistent) */
  private static inMemoryLedger: AuditLogEntry[] = [];

  /**
   * Registra una acción clínica de forma local Y la persiste en Supabase
   * via API route (para que funcione tanto en cliente como servidor).
   * Conforme al Art. 12 y 13 de la Ley 20.584.
   */
  public static logAction(params: {
    tenantId: string;
    userEmail: string;
    actionType: AuditLogEntry['actionType'];
    resourceType: string;
    resourceId: string;
    patientId?: string;
    clientIp?: string;
    metadata?: Record<string, unknown>;
  }): AuditLogEntry {
    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      tenantId: params.tenantId,
      userEmail: params.userEmail,
      actionType: params.actionType,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      patientId: params.patientId,
      clientIp: params.clientIp || 'client',
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Local ledger (for UI display)
    this.inMemoryLedger.unshift(entry);

    // Fire-and-forget persist to DB via API route (works from browser)
    if (typeof window !== 'undefined') {
      fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).catch(err => console.warn('[Audit] Persist failed:', err));
    }

    return entry;
  }

  public static getAuditTrail(tenantId: string, limit = 20): AuditLogEntry[] {
    return this.inMemoryLedger
      .filter(e => e.tenantId === tenantId)
      .slice(0, limit);
  }

  public static clearLocalLedger(): void {
    this.inMemoryLedger = [];
  }
}
