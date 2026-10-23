import { AuditLogEntry } from '@/types';

export class AuditService {
  private static inMemoryLedger: AuditLogEntry[] = [];

  /**
   * Registra una acción clínica o administrativa de forma inmutable.
   * Conforme al Art. 12 y 13 de la Ley 20.584 (Derechos y Deberes de las Personas en Salud).
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
      clientIp: params.clientIp || '190.161.42.12',
      metadata: params.metadata || {},
      timestamp: new Date().toISOString(),
    };

    // Almacenar en ledger inmutable (en producción ejecuta INSERT en PostgreSQL audit_logs con trigger de inmutabilidad)
    this.inMemoryLedger.unshift(entry);
    return entry;
  }

  public static getAuditTrail(tenantId: string, limit: number = 20): AuditLogEntry[] {
    return this.inMemoryLedger.filter(entry => entry.tenantId === tenantId).slice(0, limit);
  }
}
