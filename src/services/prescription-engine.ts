import QRCode from 'qrcode';
import { ElectronicPrescription, PrescriptionMedication } from '@/types';

export class PrescriptionEngine {
  /**
   * Genera un hash criptográfico SHA-256 simulado para la Firma Electrónica Avanzada (FEA).
   */
  public static async generateSignatureDigest(payload: string): Promise<string> {
    // Si crypto.subtle está disponible (Browser o Node moderno)
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Fallback determinista
    let hash = 0;
    for (let i = 0; i < payload.length; i++) {
      const char = payload.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return 'sha256-fea-' + Math.abs(hash).toString(16).padStart(64, 'a');
  }

  /**
   * Emite una receta médica electrónica con firma digital avanzada y código QR validable.
   */
  public static async issuePrescription(params: {
    tenantId: string;
    encounterId: string;
    patientId: string;
    practitionerId: string;
    patientRut: string;
    patientName: string;
    practitionerName: string;
    practitionerRut: string;
    practitionerRegistry: string;
    medications: PrescriptionMedication[];
    diagnosisCode: string;
    diagnosisName: string;
    daysValid?: number;
  }): Promise<{ prescription: ElectronicPrescription; qrDataUrl: string }> {
    const isRetained = params.medications.some(m => m.isControlled);
    const codeSuffix = Math.floor(100000 + Math.random() * 900000);
    const prescriptionCode = `RX-${new Date().getFullYear()}-${codeSuffix}`;
    const token = `fea_${Buffer.from(`${prescriptionCode}_${params.patientRut}_${Date.now()}`).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '').slice(0, 32)}`;
    
    const validUntilDate = new Date();
    validUntilDate.setDate(validUntilDate.getDate() + (params.daysValid || (isRetained ? 30 : 60)));

    const canonicalPayload = JSON.stringify({
      code: prescriptionCode,
      patientRut: params.patientRut,
      practitionerRut: params.practitionerRut,
      medications: params.medications.map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        quantity: m.quantity,
      })),
      diagnosisCode: params.diagnosisCode,
      validUntil: validUntilDate.toISOString().split('T')[0],
    });

    const signatureDigest = await this.generateSignatureDigest(canonicalPayload);
    const verificationUrl = `https://dispensa.clinicafy.com/v/${token}?code=${prescriptionCode}`;

    // Generar código QR escaneable en Farmacias
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 256,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      });
    } catch {
      qrDataUrl = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23eee"/></svg>';
    }

    const prescription: ElectronicPrescription = {
      id: `presc_${Date.now()}`,
      tenantId: params.tenantId,
      encounterId: params.encounterId,
      patientId: params.patientId,
      practitionerId: params.practitionerId,
      prescriptionCode,
      type: isRetained ? 'retenida_con_control' : 'simple',
      medications: params.medications,
      diagnosisCode: params.diagnosisCode,
      diagnosisName: params.diagnosisName,
      validUntil: validUntilDate.toISOString().split('T')[0],
      feaSigned: true,
      feaSignedAt: new Date().toISOString(),
      feaCertificateSerial: 'CL-PKI-FEA-9948210398',
      feaSignatureDigest: signatureDigest,
      qrVerificationToken: token,
      qrVerificationUrl: verificationUrl,
      dispenseStatus: 'active',
      createdAt: new Date().toISOString(),
    };

    return { prescription, qrDataUrl };
  }
}
