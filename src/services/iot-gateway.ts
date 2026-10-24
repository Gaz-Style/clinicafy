// ============================================================================
// CLINICAFY — IoT GATEWAY (MQTT/WebSocket Edge-to-Cloud)
// Conecta a broker EMQX/Mosquitto TLS para telemetría biométrica en tiempo real.
// Fallback: simulación local si el broker no está configurado.
// ============================================================================
import { BiometricTelemetry } from '@/types';

export class IoTGateway {
  private static ws: WebSocket | null = null;
  private static listeners: Array<(data: BiometricTelemetry) => void> = [];
  private static isConnected = false;
  private static reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Conecta al broker MQTT via WebSocket TLS.
   * Solo disponible en cliente (browser).
   */
  public static connect(deviceId = 'BOX-IOT-BIOMONITOR-01'): void {
    if (typeof window === 'undefined') return; // Server-side guard
    if (this.isConnected) return;

    const brokerUrl = process.env.NEXT_PUBLIC_MQTT_BROKER_URL;

    if (!brokerUrl) {
      console.info('[IoT] MQTT broker not configured — using local simulation');
      return;
    }

    try {
      this.ws = new WebSocket(`${brokerUrl}?clientId=clinicafy-${deviceId}-${Date.now()}`);

      this.ws.onopen = () => {
        this.isConnected = true;
        console.info(`[IoT] Connected to MQTT broker`);
        // Subscribe to device topic
        this.ws?.send(JSON.stringify({
          type: 'subscribe',
          topic: `clinicafy/iot/${deviceId}/telemetry`,
        }));
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'telemetry') {
            const telemetry = this.parseDevicePayload(payload.data, deviceId);
            this.listeners.forEach(cb => cb(telemetry));
          }
        } catch {
          // Ignore malformed messages
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        console.warn('[IoT] WebSocket disconnected — reconnecting in 5s');
        this.reconnectTimer = setTimeout(() => this.connect(deviceId), 5000);
      };

      this.ws.onerror = (err) => {
        console.error('[IoT] WebSocket error:', err);
        this.ws?.close();
      };
    } catch (err) {
      console.error('[IoT] Connection failed:', err);
    }
  }

  public static disconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
    this.listeners = [];
  }

  public static onTelemetry(callback: (data: BiometricTelemetry) => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private static parseDevicePayload(raw: Record<string, unknown>, deviceId: string): BiometricTelemetry {
    return {
      timestamp: String(raw.ts ?? new Date().toISOString()),
      deviceId,
      heartRateBpm: Number(raw.hr ?? 72),
      hrvMs: Number(raw.hrv ?? 50),
      spo2Percent: Number(raw.spo2 ?? 98),
      bloodPressureSystolic: Number(raw.bps ?? 120),
      bloodPressureDiastolic: Number(raw.bpd ?? 80),
      stressLevel: this.classifyStress(Number(raw.hrv ?? 50)),
    };
  }

  private static classifyStress(hrv: number): BiometricTelemetry['stressLevel'] {
    if (hrv >= 60) return 'low';
    if (hrv >= 40) return 'moderate';
    if (hrv >= 20) return 'high';
    return 'alert';
  }

  /**
   * Genera telemetría simulada con variación fisiológicamente realista.
   * Usado cuando el broker MQTT no está configurado.
   */
  public static generateSimulatedTelemetry(baseHr: number): BiometricTelemetry {
    const drift = (min: number, max: number) => min + Math.random() * (max - min);
    const heartRateBpm = Math.round(Math.max(55, Math.min(110, baseHr + (Math.random() - 0.5) * 4)));
    const hrv = Math.round(drift(35, 75));
    const spo2 = Math.round(drift(96, 100) * 10) / 10;
    const systolic = Math.round(drift(110, 135));
    const diastolic = Math.round(drift(68, 88));

    return {
      timestamp: new Date().toISOString(),
      deviceId: 'BOX-IOT-BIOMONITOR-01',
      heartRateBpm,
      hrvMs: hrv,
      spo2Percent: spo2,
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      stressLevel: this.classifyStress(hrv),
    };
  }

  public static get connected(): boolean {
    return this.isConnected;
  }
}
