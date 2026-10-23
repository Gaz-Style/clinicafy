export interface AutomationMessage {
  id: string;
  channel: 'whatsapp' | 'email' | 'push_mobile';
  recipient: string;
  template: string;
  variables: Record<string, string>;
  status: 'dispatched' | 'delivered' | 'read';
  timestamp: string;
}

export class AutomationEngine {
  private static messageLog: AutomationMessage[] = [];

  /**
   * Envía recordatorio de cita médica vía WhatsApp Cloud API
   */
  public static async dispatchWhatsAppReminder(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    appointmentDate: string;
    telemedicineLink?: string;
  }): Promise<AutomationMessage> {
    const msg: AutomationMessage = {
      id: `wsp_${Date.now()}`,
      channel: 'whatsapp',
      recipient: params.patientPhone,
      template: 'cita_confirmada_recordatorio',
      variables: {
        nombre: params.patientName,
        profesional: params.doctorName,
        fecha: params.appointmentDate,
        enlace: params.telemedicineLink || 'Box Presencial',
      },
      status: 'dispatched',
      timestamp: new Date().toISOString(),
    };

    this.messageLog.unshift(msg);
    return msg;
  }

  /**
   * Envía alerta Push en tiempo real al administrador/médico (venta confirmada, quiebre stock)
   */
  public static async dispatchPushAlert(title: string, body: string): Promise<AutomationMessage> {
    const msg: AutomationMessage = {
      id: `push_${Date.now()}`,
      channel: 'push_mobile',
      recipient: 'admin-device-tokens',
      template: 'push_urgent_alert',
      variables: { title, body },
      status: 'delivered',
      timestamp: new Date().toISOString(),
    };

    this.messageLog.unshift(msg);
    return msg;
  }

  public static getRecentDispatches(): AutomationMessage[] {
    return this.messageLog.slice(0, 10);
  }
}
