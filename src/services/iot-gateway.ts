import { BiometricTelemetry } from '@/types';

export class IoTGateway {
  /**
   * Genera telemetría biométrica en tiempo real transmitida desde el hardware médico en box (MQTT/WebSockets).
   */
  public static generateSimulatedTelemetry(baseHeartRate: number = 72): BiometricTelemetry {
    // Variación fisiológica natural
    const delta = Math.floor(Math.random() * 7) - 3;
    const heartRateBpm = Math.max(55, Math.min(130, baseHeartRate + delta));
    const hrvMs = Math.floor(45 + Math.random() * 25); // 45ms a 70ms
    const spo2Percent = 98 + (Math.random() > 0.8 ? -1 : 0);
    const systolic = 118 + Math.floor(Math.random() * 6);
    const diastolic = 76 + Math.floor(Math.random() * 4);

    let stressLevel: BiometricTelemetry['stressLevel'] = 'low';
    if (heartRateBpm > 95 || hrvMs < 48) {
      stressLevel = 'high';
    } else if (heartRateBpm > 82) {
      stressLevel = 'moderate';
    }

    return {
      timestamp: new Date().toISOString(),
      deviceId: 'BOX-IOT-BIOMONITOR-01',
      heartRateBpm,
      hrvMs,
      spo2Percent,
      bloodPressureSystolic: systolic,
      bloodPressureDiastolic: diastolic,
      stressLevel,
    };
  }
}
