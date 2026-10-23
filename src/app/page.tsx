'use client';

import React, { useState, useEffect } from 'react';
import {
  Brain,
  ShieldCheck,
  Stethoscope,
  FileSignature,
  CreditCard,
  Activity,
  UserCheck,
  History,
  Mic,
  MicOff,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  Building2,
  Lock,
  Sparkles,
  RefreshCw,
  ShoppingBag,
  Send,
  Sliders,
  ChevronRight,
  ExternalLink,
  Info,
  Pill,
  Fingerprint
} from 'lucide-react';
import { MedicalDiagnosis, PrescriptionMedication, InventoryItem, BiometricTelemetry, AuditLogEntry } from '@/types';
import { CLINICAL_DIAGNOSTIC_CATALOG, AmbientScribeEngine, ScribeExtractionResult } from '@/services/ambient-scribe';
import { PrescriptionEngine } from '@/services/prescription-engine';
import { ImedEngine } from '@/services/imed-engine';
import { IoTGateway } from '@/services/iot-gateway';
import { AuditService } from '@/services/audit-service';
import { AutomationEngine } from '@/services/automation-service';

const INITIAL_BIOMETRICS: BiometricTelemetry = {
  timestamp: '2026-10-23T12:00:00.000Z',
  deviceId: 'BOX-IOT-BIOMONITOR-01',
  heartRateBpm: 74,
  hrvMs: 55,
  spo2Percent: 98,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 78,
  stressLevel: 'low',
};

const INITIAL_SCRIBE_DATA: ScribeExtractionResult = {
  soap: {
    subjective: `Paciente refiere cuadro de 4 semanas de evolución caracterizado por anhedonia persistente, fatiga psicofísica y dificultades para conciliar el sueño (latencia > 90 min). Menciona estresor laboral agudo en el último mes. Niega ideación suicida activa o síntomas psicóticos. Refiere antecedentes de tratamiento discontinuado con Sertralina en 2024.`,
    objective: `Paciente vigil, lúcido, orientado témporo-espacialmente. Afecto de resonancia disminuida, hipotímico con labilidad emocional moderada al relatar situación laboral. Pensamiento coherente, flujo normal sin bloqueos. No se aprecian alteraciones sensoperceptivas. Juicio de realidad conservado. Normotenso (120/75 mmHg), FC: 74 lpm regular.`,
    assessment: `Cuadro clínico compatible con Episodio Depresivo Moderado (CIE-10 F32.1) reactivo a sobrecarga laboral, con comorbilidad de Ansiedad Generalizada e Insomnio de conciliación secundario.`,
    plan: `1. Reanudación de farmacoterapia: Sertralina 50 mg/día vo matinal los primeros 7 días, titular a 100 mg/día según tolerancia.\n2. Coadyuvante de conciliación: Clonazepam 0.5 mg 1 comp vo noche por 14 días (retirada gradual programada).\n3. Indicación de Psicoterapia Cognitivo-Conductual (1 sesión semanal).\n4. Higiene del sueño estricta y control en 3 semanas con exámenes de laboratorio (Perfil tiroideo TSH/T4L, Hemograma, Vit D).`,
  },
  dap: {
    data: `Motivo de consulta: Angustia y sobrecarga. Discurso fluido pero cargado afectivamente. Manifiesta sintomatología ansioso-depresiva vinculada a dinámicas de autoexigencia y conflicto de rol laboral. Insomnio persistente y aislamiento social leve.`,
    assessment: `Se observa reactivación de esquema cognitivo de vulnerabilidad e insuficiencia personal. Recursos de afrontamiento momentáneamente desbordados. Excelente alianza terapéutica y motivación intrínseca al cambio.`,
    plan: `Trabajo focal en reestructuración de pensamientos automáticos catastrofistas, prescripción de tareas conductuales de autocuidado y registro diario de pensamientos disfóricos. Derivación a evaluación psiquiátrica complementaria coordinada.`,
  },
  suggestedDiagnoses: [
    {
      code: 'F32.1',
      system: 'ICD-10' as const,
      display: 'Episodio depresivo moderado sin síntomas psicóticos',
      primary: true,
      confidence: 0.96,
    },
    {
      code: 'F41.1',
      system: 'ICD-10' as const,
      display: 'Trastorno de ansiedad generalizada (TAG)',
      primary: false,
      confidence: 0.88,
    },
    {
      code: 'F51.01',
      system: 'ICD-10' as const,
      display: 'Insomnio no orgánico',
      primary: false,
      confidence: 0.82,
    },
  ],
  metadata: {
    scribeUsed: true,
    audioStreamDurationSec: 42,
    audioDestroyedAt: '2026-10-23T12:00:00.000Z',
    confidenceScore: 0.94,
    speechEngine: 'Whisper-Large-v3-Turbo + DeepSeek/Gemini Medical Clinical Scribe',
    entitiesExtracted: [
      { category: 'symptom' as const, text: 'Anhedonia e insomnio de conciliación (>90m)' },
      { category: 'symptom' as const, text: 'Fatiga psicofísica vespertina' },
      { category: 'timeline' as const, text: '4 semanas de evolución post-estresor laboral' },
      { category: 'medication' as const, text: 'Antecedente de Sertralina 50mg suspendida' },
      { category: 'mental_status' as const, text: 'Hipotimia, juicio conservado, sin ideación suicida' },
    ],
  },
  transcriptSample: AmbientScribeEngine.getDefaultDemoTranscript(),
};

export default function ClinicafyWorkstation() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'scribe' | 'receta' | 'erp' | 'iot' | 'ecommerce' | 'audit'>('scribe');
  const [selectedTenant, setSelectedTenant] = useState('Centro Médico Andino (Providencia)');

  // Patient Mock Context
  const patient = {
    name: 'Claudia Morales Sepúlveda',
    rut: '18.432.890-K',
    age: 33,
    insurance: 'Colmena Golden Cross',
    email: 'claudia.morales@example.cl',
    phone: '+56 9 8765 4321',
  };

  // 1. Ambient Scribe State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [noteFormat, setNoteFormat] = useState<'SOAP' | 'DAP'>('SOAP');
  const [scribeData, setScribeData] = useState<ScribeExtractionResult>(INITIAL_SCRIBE_DATA);
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<MedicalDiagnosis[]>([
    CLINICAL_DIAGNOSTIC_CATALOG[0],
    CLINICAL_DIAGNOSTIC_CATALOG[1],
  ]);
  const [audioPurgedMessage, setAudioPurgedMessage] = useState<string | null>(null);

  // 2. Prescription State
  const [medications, setMedications] = useState<PrescriptionMedication[]>([
    {
      id: 'med_1',
      name: 'Sertralina',
      genericName: 'Sertralina Clorhidrato',
      dosage: '50 mg',
      frequency: 'Cada 24 horas (matinal)',
      durationDays: 30,
      quantity: 1,
      instructions: 'Tomar después del desayuno. Titular a 100 mg al día 8 según tolerancia.',
      isControlled: false,
    },
    {
      id: 'med_2',
      name: 'Clonazepam',
      genericName: 'Clonazepam',
      dosage: '0.5 mg',
      frequency: '1 comprimido sublingual noche',
      durationDays: 14,
      quantity: 1,
      instructions: 'Solo en caso de latencia de sueño prolongada (>60 min). Máx 14 días.',
      isControlled: true,
    },
  ]);
  const [isFeaSigned, setIsFeaSigned] = useState(false);
  const [prescriptionCode, setPrescriptionCode] = useState('RX-2026-894102');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [dispenseSimulated, setDispenseSimulated] = useState(false);

  // 3. ERP & I-Med State
  const [servicePrice, setServicePrice] = useState(45000);
  const [selectedInsurance, setSelectedInsurance] = useState('Colmena');
  const [bonoResult, setBonoResult] = useState<{
    authorized: boolean;
    bonoNumber: string;
    copayAmount: number;
    insuranceContribution: number;
  } | null>(null);

  // Box Inventory
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: '1', sku: 'TEST-NEURO-01', name: 'Escala Hamilton Depresión/Ansiedad (Hojas Impresas)', currentStock: 14, minStockAlert: 5, unit: 'unidades', branchId: 'b1' },
    { id: '2', sku: 'KIT-RAPID-TOX', name: 'Kit Test Rápido Detección Sustancias en Orina', currentStock: 4, minStockAlert: 5, unit: 'kits', branchId: 'b1' },
    { id: '3', sku: 'JER-SUB-01', name: 'Jeringas Tuberculina para Administración Subcutánea', currentStock: 28, minStockAlert: 10, unit: 'unidades', branchId: 'b1' },
    { id: '4', sku: 'KT-AMPO-50', name: 'Vial Clorhidrato de Ketamina 50mg/ml', currentStock: 6, minStockAlert: 3, unit: 'ampollas', branchId: 'b1' },
  ]);
  const [inventoryAlerts, setInventoryAlerts] = useState<string[]>([]);

  // 4. IoT Biometric State
  const [biometrics, setBiometrics] = useState<BiometricTelemetry>(INITIAL_BIOMETRICS);
  const [isIotStreaming, setIsIotStreaming] = useState(true);

  // 5. Onboarding & E-commerce State
  const [bookingStep, setBookingStep] = useState<1 | 2 | 3 | 4>(1);
  const [consentSigned, setConsentSigned] = useState(false);
  const [bookingPaid, setBookingPaid] = useState(false);

  // 6. Audit Trail State
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);

  // Timer for audio recording simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Telemetry real-time loop (Edge to Cloud simulation)
  useEffect(() => {
    if (!isIotStreaming) return;
    const iotInterval = setInterval(() => {
      setBiometrics(prev => IoTGateway.generateSimulatedTelemetry(prev.heartRateBpm));
    }, 3000);
    return () => clearInterval(iotInterval);
  }, [isIotStreaming]);

  // Initial setup of Prescription QR & Initial Audit entries
  useEffect(() => {
    const initPrescription = async () => {
      const { prescription, qrDataUrl } = await PrescriptionEngine.issuePrescription({
        tenantId: 'tenant-andino-01',
        encounterId: 'enc-001',
        patientId: 'pat-morales-01',
        practitionerId: 'prac-valenzuela-01',
        patientRut: patient.rut,
        patientName: patient.name,
        practitionerName: 'Dra. Marcela Valenzuela G.',
        practitionerRut: '14.890.312-4',
        practitionerRegistry: 'SIS-8921-PSQ',
        medications,
        diagnosisCode: 'F32.1',
        diagnosisName: 'Episodio depresivo moderado',
      });
      setPrescriptionCode(prescription.prescriptionCode);
      setQrCodeUrl(qrDataUrl);
      setIsFeaSigned(true);
    };

    initPrescription();

    // Log initial view
    AuditService.logAction({
      tenantId: 'tenant-andino-01',
      userEmail: 'dra.valenzuela@clinicafy.com',
      actionType: 'READ_RECORD',
      resourceType: 'ClinicalEncounter/Patient',
      resourceId: patient.rut,
      patientId: 'pat-morales-01',
      metadata: { reason: 'Ingreso a Consulta Programada' },
    });

    setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
  }, []);

  // Handle ambient recording toggle
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      setRecordSeconds(0);
      setAudioPurgedMessage(null);
    } else {
      setIsRecording(false);
      // Process and destroy
      const result = AmbientScribeEngine.processClinicalAudio('', recordSeconds || 45);
      setScribeData(result);
      setAudioPurgedMessage(
        `✓ Memoria de audio destruida criptográficamente en RAM a las ${new Date().toLocaleTimeString()} (Zero Retention). SOAP estructurado.`
      );

      // Audit log
      AuditService.logAction({
        tenantId: 'tenant-andino-01',
        userEmail: 'dra.valenzuela@clinicafy.com',
        actionType: 'CREATE_ENCOUNTER',
        resourceType: 'ClinicalEncounter/AmbientScribe',
        resourceId: `enc_${Date.now()}`,
        patientId: 'pat-morales-01',
        metadata: { durationSec: recordSeconds || 45, zeroRetentionConfirmed: true },
      });
      setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
    }
  };

  // Handle I-Med Calculation
  const handleCalculateBono = async () => {
    const res = await ImedEngine.calculateAndAuthorizeBono({
      patientRut: patient.rut,
      healthInsurance: selectedInsurance,
      prestacionCode: '0901001',
      totalPrice: servicePrice,
    });
    setBonoResult(res);

    AuditService.logAction({
      tenantId: 'tenant-andino-01',
      userEmail: 'caja.admision@clinicafy.com',
      actionType: 'IMED_VERIFY',
      resourceType: 'BonoElectronico',
      resourceId: res.bonoNumber,
      patientId: 'pat-morales-01',
      metadata: {
        insurance: selectedInsurance,
        copay: res.copayAmount,
        contribution: res.insuranceContribution,
      },
    });
    setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
  };

  // Consume Box supply
  const handleConsumeSupply = (sku: string) => {
    const { updatedInventory, alerts } = ImedEngine.deductBoxSupplies(inventory, [{ sku, quantity: 1 }]);
    setInventory(updatedInventory);
    if (alerts.length > 0) {
      setInventoryAlerts(prev => [...alerts, ...prev]);
      AutomationEngine.dispatchPushAlert('Alerta de Stock Crítico en Box', alerts[0]);
    }

    AuditService.logAction({
      tenantId: 'tenant-andino-01',
      userEmail: 'dra.valenzuela@clinicafy.com',
      actionType: 'CONSUME_INVENTORY',
      resourceType: 'InventoryItem',
      resourceId: sku,
      metadata: { quantity: 1 },
    });
    setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
  };

  // Pharmacy scan simulation
  const handleSimulatePharmacyDispense = () => {
    setDispenseSimulated(true);
    AuditService.logAction({
      tenantId: 'tenant-andino-01',
      userEmail: 'farmacia.cruzverde.841@dispensa.cl',
      actionType: 'DISPENSE_RECETA',
      resourceType: 'ElectronicPrescription',
      resourceId: prescriptionCode,
      patientId: 'pat-morales-01',
      metadata: { pharmacy: 'Cruz Verde - Sucursal Providencia 1402' },
    });
    setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
  };

  // Add biometric vitals directly to SOAP Objective
  const insertBiometricsToSoap = () => {
    const vitalsText = `\n[IoT Box Real-time Sync] FC: ${biometrics.heartRateBpm} lpm | VFC: ${biometrics.hrvMs} ms | PA: ${biometrics.bloodPressureSystolic}/${biometrics.bloodPressureDiastolic} mmHg | SpO2: ${biometrics.spo2Percent}% | Nivel de estrés autonómico: ${biometrics.stressLevel.toUpperCase()}`;
    setScribeData(prev => ({
      ...prev,
      soap: {
        ...prev.soap,
        objective: prev.soap.objective + vitalsText,
      },
    }));
  };

  return (
    <main style={{ minHeight: '100vh', padding: '1.25rem 2rem 3rem' }}>
      {/* =========================================================================
          TOP BAR & TENANT HEADER
          ========================================================================= */}
      <header
        className="glass-panel"
        style={{
          padding: '1rem 1.5rem',
          marginBottom: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
              overflow: 'hidden',
              padding: '2px',
            }}
          >
            <img
              src="/clinicafy-logo.png"
              alt="Clinicafy Logo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 900, letterSpacing: '-0.03em', color: '#0f172a' }}>
                Clinica<span style={{ color: '#059669' }}>fy</span>
              </h1>
              <span className="badge badge-teal">SaaS Multi-Tenant</span>
              <span className="badge badge-indigo">FHIR R4</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Infraestructura Operativa y Clínica para Redes de Salud Mental y Policlínicos
            </p>
          </div>
        </div>

        {/* Tenant Selector & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Building2 size={16} color="var(--brand-blue)" />
            <select
              value={selectedTenant}
              onChange={e => setSelectedTenant(e.target.value)}
              style={{
                background: '#ffffff',
                fontSize: '0.82rem',
                padding: '0.4rem 0.8rem',
                border: '1px solid var(--border-accent)',
              }}
            >
              <option value="Centro Médico Andino (Providencia)">Centro Médico Andino - Sucursal Providencia</option>
              <option value="Red Salud Mental Santiago">Red Salud Mental Santiago - Sucursal Las Condes</option>
              <option value="Clínica Psicológica del Sur">Clínica Psicológica del Sur - Concepción</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.4rem 0.8rem',
              borderRadius: '8px',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
            }}
          >
            <div className="pulse-dot" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#059669' }}>Zero Trust MFA & RLS Activo</span>
          </div>

          {/* Clinician Pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Dra. Marcela Valenzuela</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Psiquiatra · SIS: 8921-PSQ · FEA e-Cert</div>
            </div>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: '#f0f9ff',
                border: '1px solid var(--brand-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                color: 'var(--brand-blue)',
              }}
            >
              MV
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          PATIENT BANNER & SESSION CONTEXT
          ========================================================================= */}
      <div
        className="glass-card"
        style={{
          marginBottom: '1.25rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserCheck size={22} color="#818cf8" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>{patient.name}</span>
              <span className="badge badge-teal">RUT {patient.rut}</span>
              <span className="badge badge-indigo">{patient.age} años</span>
              <span className="badge badge-warning">{patient.insurance}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Motivo: Consulta Psiquiátrica Control & Farmacoterapia · Consentimiento Ley 20.584 Firmado Digitalmente
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }} suppressHydrationWarning>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Telemetría en Box:</span>
          <span className="badge badge-success" suppressHydrationWarning>FC: {biometrics.heartRateBpm} bpm</span>
          <span className="badge badge-teal" suppressHydrationWarning>SpO2: {biometrics.spo2Percent}%</span>
          <span className="badge badge-indigo" suppressHydrationWarning>Estrés: {biometrics.stressLevel.toUpperCase()}</span>
        </div>
      </div>

      {/* =========================================================================
          MODULE TABS NAVIGATION
          ========================================================================= */}
      <nav className="tabs-nav" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab-btn ${activeTab === 'scribe' ? 'active' : ''}`}
          onClick={() => setActiveTab('scribe')}
        >
          <Sparkles size={18} />
          Ficha Clínica & Ambient Scribe (IA)
        </button>
        <button
          className={`tab-btn ${activeTab === 'receta' ? 'active' : ''}`}
          onClick={() => setActiveTab('receta')}
        >
          <FileSignature size={18} />
          Receta Médica FEA & QR
        </button>
        <button
          className={`tab-btn ${activeTab === 'erp' ? 'active' : ''}`}
          onClick={() => setActiveTab('erp')}
        >
          <CreditCard size={18} />
          ERP Operativo & I-Med Bonos
        </button>
        <button
          className={`tab-btn ${activeTab === 'iot' ? 'active' : ''}`}
          onClick={() => setActiveTab('iot')}
        >
          <Activity size={18} />
          IoT Biometría Edge-to-Cloud
        </button>
        <button
          className={`tab-btn ${activeTab === 'ecommerce' ? 'active' : ''}`}
          onClick={() => setActiveTab('ecommerce')}
        >
          <ShoppingBag size={18} />
          Portal Paciente & Onboarding
        </button>
        <button
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          <History size={18} />
          Auditoría Inmutable (Ley 20.584)
        </button>
      </nav>

      {/* =========================================================================
          TAB 1: AMBIENT SCRIBE & FICHA CLÍNICA IA
          ========================================================================= */}
      {activeTab === 'scribe' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem' }}>
          {/* Main Clinical Note */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            {/* Scribe Action Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={toggleRecording}
                  className={`btn ${isRecording ? 'btn-danger' : 'btn-primary'}`}
                  style={{ minWidth: '170px' }}
                >
                  {isRecording ? (
                    <>
                      <MicOff size={18} />
                      Detener ({recordSeconds}s)
                    </>
                  ) : (
                    <>
                      <Mic size={18} />
                      Iniciar Ambient Scribe
                    </>
                  )}
                </button>

                {isRecording && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div className="waveform-bars">
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                      <div className="wave-bar" />
                    </div>
                    <span style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 600 }}>
                      Escuchando consulta médica...
                    </span>
                  </div>
                )}
              </div>

              {/* Format Toggle: SOAP vs DAP */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Formato:</span>
                <button
                  onClick={() => setNoteFormat('SOAP')}
                  className={`btn btn-secondary ${noteFormat === 'SOAP' ? 'badge-teal' : ''}`}
                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                >
                  SOAP (Médico)
                </button>
                <button
                  onClick={() => setNoteFormat('DAP')}
                  className={`btn btn-secondary ${noteFormat === 'DAP' ? 'badge-indigo' : ''}`}
                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                >
                  DAP (Salud Mental)
                </button>
                <button
                  onClick={insertBiometricsToSoap}
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.8rem', fontSize: '0.75rem' }}
                  title="Sincronizar telemetría de box en notas"
                >
                  <Activity size={14} color="#34d399" />
                  + IoT Box
                </button>
              </div>
            </div>

            {/* Zero Retention Proof Alert */}
            {audioPurgedMessage && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.82rem',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <ShieldCheck size={18} />
                <span>{audioPurgedMessage}</span>
              </div>
            )}

            {/* Note Fields */}
            {noteFormat === 'SOAP' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                    S — SUBJETIVO (Anamnesis, Relato del Paciente & Estresores)
                  </label>
                  <textarea
                    rows={4}
                    value={scribeData.soap.subjective}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        soap: { ...scribeData.soap, subjective: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                    O — OBJETIVO (Examen Mental, Afecto, Lenguaje, Examen Físico & IoT)
                  </label>
                  <textarea
                    rows={4}
                    value={scribeData.soap.objective}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        soap: { ...scribeData.soap, objective: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.4rem' }}>
                    A — EVALUACIÓN (Diagnóstico Clínico & Juicio Diagnóstico)
                  </label>
                  <textarea
                    rows={3}
                    value={scribeData.soap.assessment}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        soap: { ...scribeData.soap, assessment: e.target.value },
                      })
                    }
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#059669', marginBottom: '0.4rem' }}>
                    P — PLAN (Farmacoterapia, Receta FEA, Psicoterapia & Próximo Control)
                  </label>
                  <textarea
                    rows={4}
                    value={scribeData.soap.plan}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        soap: { ...scribeData.soap, plan: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            ) : (
              /* DAP format */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.4rem' }}>
                    D — DATA (Contenido de la Sesión, Discurso & Conductas Observadas)
                  </label>
                  <textarea
                    rows={5}
                    value={scribeData.dap.data}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        dap: { ...scribeData.dap, data: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#818cf8', marginBottom: '0.4rem' }}>
                    A — ASSESSMENT (Hipótesis Psicológica & Evolución Terapéutica)
                  </label>
                  <textarea
                    rows={4}
                    value={scribeData.dap.assessment}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        dap: { ...scribeData.dap, assessment: e.target.value },
                      })
                    }
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#059669', marginBottom: '0.4rem' }}>
                    P — PLAN (Intervención, Tareas Inter-sesión & Alianza de Trabajo)
                  </label>
                  <textarea
                    rows={4}
                    value={scribeData.dap.plan}
                    onChange={e =>
                      setScribeData({
                        ...scribeData,
                        dap: { ...scribeData.dap, plan: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            )}

            {/* Action Save Encounter */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Cumple con Estándar MINSAL · Exportable nativamente a FHIR R4 Bundle
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  AuditService.logAction({
                    tenantId: 'tenant-andino-01',
                    userEmail: 'dra.valenzuela@clinicafy.com',
                    actionType: 'EDIT_RECORD',
                    resourceType: 'ClinicalEncounter/SOAP',
                    resourceId: `enc_${Date.now()}`,
                    patientId: 'pat-morales-01',
                    metadata: { format: noteFormat, diagnosesCount: selectedDiagnoses.length },
                  });
                  setAuditEntries(AuditService.getAuditTrail('tenant-andino-01'));
                  alert('Ficha clínica guardada y firmada digitalmente con éxito.');
                }}
              >
                <CheckCircle2 size={16} />
                Guardar Ficha en Supabase (RLS Seguro)
              </button>
            </div>
          </div>

          {/* Scribe Side Panel (IA Diagnoses & Audio Sample) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Suggested Diagnoses (CIE-10 & DSM-5-TR) */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Sparkles size={18} color="var(--brand-teal)" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Diagnósticos IA Sugeridos</h3>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Codificación sugerida en tiempo real desde la conversación médica:
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {CLINICAL_DIAGNOSTIC_CATALOG.slice(0, 4).map(diag => {
                  const isSelected = selectedDiagnoses.some(d => d.code === diag.code);
                  return (
                    <div
                      key={diag.code}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDiagnoses(selectedDiagnoses.filter(d => d.code !== diag.code));
                        } else {
                          setSelectedDiagnoses([...selectedDiagnoses, diag]);
                        }
                      }}
                      style={{
                        padding: '0.6rem 0.8rem',
                        borderRadius: '8px',
                        background: isSelected ? '#f0f9ff' : 'rgba(15, 23, 42, 0.5)',
                        border: isSelected ? '1px solid var(--brand-teal)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="badge badge-teal font-mono">{diag.code}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{diag.system}</span>
                      </div>
                      <div style={{ fontSize: '0.78rem', marginTop: '0.3rem', fontWeight: 500 }}>
                        {diag.display}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Entidades Extraídas por IA */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.6rem' }}>
                Entidades Clínicas Detectadas
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {scribeData.metadata.entitiesExtracted.map((ent, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.74rem',
                      padding: '0.4rem 0.6rem',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderLeft: '3px solid #38bdf8',
                    }}
                  >
                    <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'capitalize' }}>
                      {ent.category}:
                    </span>{' '}
                    {ent.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Zero Retention Security Card */}
            <div
              className="glass-card"
              style={{
                borderLeft: '4px solid #10b981',
                padding: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                <Lock size={14} color="#10b981" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#059669' }}>
                  Cumplimiento Zero-Audio
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                Los paquetes de voz solo residen en memoria RAM volátil mientras transcurre el pipeline de inferencia. El
                audio original nunca se guarda en disco ni en la nube.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 2: RECETA MÉDICA ELECTRÓNICA & FIRMA FEA
          ========================================================================= */}
      {activeTab === 'receta' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.5rem' }}>
          {/* Prescription Document Editor */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span className="badge badge-indigo">Receta Médica Electrónica Oficial</span>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.3rem' }}>
                  Prescripción Digital N° {prescriptionCode}
                </h2>
              </div>
              <span className="badge badge-warning">Retenida con Control de Psicotrópicos</span>
            </div>

            {/* Practitioner & Patient Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
              }}
            >
              <div>
                <strong style={{ color: 'var(--brand-blue)' }}>Médico Prescriptor:</strong>
                <div>Dra. Marcela Valenzuela Guzmán</div>
                <div style={{ color: 'var(--text-muted)' }}>RUT: 14.890.312-4 · Reg. SIS: 8921-PSQ</div>
              </div>
              <div>
                <strong style={{ color: 'var(--brand-blue)' }}>Paciente:</strong>
                <div>{patient.name}</div>
                <div style={{ color: 'var(--text-muted)' }}>RUT: {patient.rut} · Previsión: {patient.insurance}</div>
              </div>
            </div>

            {/* Prescribed Medications */}
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Pill size={16} color="var(--brand-teal)" />
              Medicamentos Prescritos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {medications.map(med => (
                <div
                  key={med.id}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: med.isControlled ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{med.name}</span>
                      <span className="badge badge-teal">{med.dosage}</span>
                      {med.isControlled && <span className="badge badge-warning">Controlado (Psicotrópico)</span>}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cant: {med.quantity} caja(s)</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    <strong>Posología:</strong> {med.frequency} por {med.durationDays} días. {med.instructions}
                  </div>
                </div>
              ))}
            </div>

            {/* FEA Signature Status Box */}
            <div
              style={{
                padding: '1rem',
                borderRadius: '8px',
                background: '#ecfdf5',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Fingerprint size={28} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#059669' }}>
                    Firma Electrónica Avanzada (FEA) Verificada
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Certificado e-Cert Chile N° 9948210398 · Ley 19.799 · Hash SHA-256 inalterable
                  </div>
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => alert('Certificado de Firma Electrónica Avanzada validado ante prestador acreditado.')}
              >
                Re-validar FEA
              </button>
            </div>
          </div>

          {/* QR Code & Pharmacy Validation Simulator */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                {qrCodeUrl ? (
                  <div
                    style={{
                      padding: '12px',
                      background: '#ffffff',
                      borderRadius: '12px',
                      display: 'inline-block',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                    }}
                  >
                    <img src={qrCodeUrl} alt="QR Receta FEA" style={{ width: '180px', height: '180px', display: 'block' }} />
                  </div>
                ) : (
                  <div style={{ width: '180px', height: '180px', background: '#334155', borderRadius: '12px' }} />
                )}
              </div>

              <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                Código QR de Validación en Farmacias
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Las cadenas farmacéuticas (Cruz Verde, Ahumada, Salcobrand) escanean este código para validar la vigencia
                y bloquear dispensaciones duplicadas.
              </p>

              <div
                style={{
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  background: '#ffffff',
                  fontSize: '0.75rem',
                  marginBottom: '1rem',
                  textAlign: 'left',
                }}
              >
                <div style={{ color: 'var(--text-muted)' }}>URL de Verificación Gubernamental / API:</div>
                <div className="font-mono" style={{ color: '#38bdf8', wordBreak: 'break-all' }}>
                  https://dispensa.clinicafy.com/v/fea_994821?code={prescriptionCode}
                </div>
              </div>

              {/* Pharmacy Simulation Button */}
              <button
                className={`btn ${dispenseSimulated ? 'btn-secondary' : 'btn-accent'}`}
                style={{ width: '100%' }}
                onClick={handleSimulatePharmacyDispense}
                disabled={dispenseSimulated}
              >
                <QrCode size={16} />
                {dispenseSimulated ? '✓ Receta Dispensada en Farmacia' : 'Simular Escaneo en Farmacia Cruz Verde'}
              </button>

              {dispenseSimulated && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    color: '#f87171',
                  }}
                >
                  Receta bloqueada para nueva venta. Registro enviado a auditoría inmutable.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 3: ERP OPERATIVO, I-MED & INVENTARIO BOX
          ========================================================================= */}
      {activeTab === 'erp' && (
        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {/* I-Med Bono Calculator */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <CreditCard size={20} color="var(--brand-teal)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Motor de Reglas I-Med / Medipass</h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Cálculo y emisión de bono electrónico en tiempo real vía Web Services I-Med (Fonasa y redes Isapre):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Previsión de Salud del Paciente:
                </label>
                <select
                  value={selectedInsurance}
                  onChange={e => setSelectedInsurance(e.target.value)}
                >
                  <option value="Colmena">Isapre Colmena Golden Cross (75% Cobertura)</option>
                  <option value="Banmédica">Isapre Banmédica (70% Cobertura)</option>
                  <option value="Consalud">Isapre Consalud (70% Cobertura)</option>
                  <option value="CruzBlanca">Isapre CruzBlanca (72% Cobertura)</option>
                  <option value="Fonasa B">Fonasa Tramo B (100% Gratuidad Copago Cero)</option>
                  <option value="Fonasa C">Fonasa Tramo C (90% Cobertura)</option>
                  <option value="Fonasa D">Fonasa Tramo D (80% Cobertura)</option>
                  <option value="Particular">Particular (Sin Cobertura)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Arancel Consulta / Código Prestación (09-01-001):
                </label>
                <input
                  type="number"
                  value={servicePrice}
                  onChange={e => setServicePrice(Number(e.target.value))}
                />
              </div>

              <button className="btn btn-primary" onClick={handleCalculateBono}>
                <RefreshCw size={16} />
                Consultar Web Service I-Med (Milisegundos)
              </button>
            </div>

            {/* Bono Authorization Result */}
            {bonoResult && (
              <div
                style={{
                  padding: '1.25rem',
                  borderRadius: '10px',
                  background: '#f0f9ff',
                  border: '1px solid #bae6fd',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="badge badge-success">✓ Bono I-Med Autorizado</span>
                  <span className="font-mono" style={{ fontSize: '0.8rem', color: '#38bdf8' }}>{bonoResult.bonoNumber}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div className="glass-card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aporte Isapre / Fonasa:</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#059669' }}>
                      ${bonoResult.insuranceContribution.toLocaleString('es-CL')} CLP
                    </div>
                  </div>
                  <div className="glass-card">
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Copago Paciente (Webpay/Fintoc):</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24' }}>
                      ${bonoResult.copayAmount.toLocaleString('es-CL')} CLP
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Box Medical Inventory */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
              <Stethoscope size={20} color="var(--brand-blue)" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Inventario Conectado en Box Médico</h2>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Descuento automático de insumos utilizados en consulta con alertas de quiebre de stock:
            </p>

            {/* Inventory Alerts */}
            {inventoryAlerts.length > 0 && (
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '1rem',
                  fontSize: '0.78rem',
                  color: '#fbbf24',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, marginBottom: '0.2rem' }}>
                  <AlertTriangle size={15} />
                  Alerta Push Disparada al Administrador:
                </div>
                {inventoryAlerts[0]}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {inventory.map(item => {
                const isLow = item.currentStock <= item.minStockAlert;
                return (
                  <div
                    key={item.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: isLow ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        SKU: {item.sku} · Mínimo: {item.minStockAlert} {item.unit}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge ${isLow ? 'badge-danger' : 'badge-success'}`}>
                        {item.currentStock} {item.unit}
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.72rem' }}
                        onClick={() => handleConsumeSupply(item.sku)}
                        title="Descontar 1 unidad usada en este box"
                      >
                        -1 Box
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 4: IOT BIOMETRÍA EDGE-TO-CLOUD
          ========================================================================= */}
      {activeTab === 'iot' && (
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Activity size={22} color="#34d399" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Sincronización Biométrica en Vivo (Edge-to-Cloud)</h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Conexión IoT directa vía MQTT / WebSockets con monitor multiparámetro local en box médico
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="pulse-dot" />
              <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>Broker EMQX TLS Conectado (14ms)</span>
              <button
                className="btn btn-secondary"
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}
                onClick={() => setIsIotStreaming(!isIotStreaming)}
              >
                {isIotStreaming ? 'Pausar Telemetría' : 'Reanudar Telemetría'}
              </button>
            </div>
          </div>

          {/* Biometrics Dashboard Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>FRECUENCIA CARDÍACA</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#38bdf8' }} suppressHydrationWarning>
                {biometrics.heartRateBpm}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>lpm (latidos/min)</div>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>VARIABILIDAD CARDÍACA (VFC)</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#818cf8' }} suppressHydrationWarning>
                {biometrics.hrvMs}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ms (indicador de estrés SNA)</div>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>PRESIÓN ARTERIAL</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#059669' }} suppressHydrationWarning>
                {biometrics.bloodPressureSystolic}/{biometrics.bloodPressureDiastolic}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>mmHg (Normotensa)</div>
            </div>

            <div className="glass-card" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>SATURACIÓN DE OXÍGENO</div>
              <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#f59e0b' }} suppressHydrationWarning>
                {biometrics.spo2Percent}%
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SpO2 Pulsoxímetro Box</div>
            </div>
          </div>

          <div
            style={{
              padding: '1rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Evaluación Autonómica IA: </span>
              <span className={`badge ${biometrics.stressLevel === 'high' ? 'badge-danger' : 'badge-success'}`}>
                Nivel de Activación Simpática: {biometrics.stressLevel.toUpperCase()}
              </span>
            </div>
            <button className="btn btn-primary" onClick={insertBiometricsToSoap}>
              Inyectar Valores en Sección 'Objetivo' de la Ficha
            </button>
          </div>
        </section>
      )}

      {/* =========================================================================
          TAB 5: PORTAL PACIENTE & ONBOARDING AUTÓNOMO (E-COMMERCE)
          ========================================================================= */}
      {activeTab === 'ecommerce' && (
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <span className="badge badge-teal">E-Commerce Clínico White-label</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '0.2rem' }}>
              Onboarding Autónomo & Portal de Reserva Paciente
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Experiencia tipo Shopify donde el paciente agenda, firma consentimientos digitales y paga copagos antes de asistir.
            </p>
          </div>

          {/* Stepper */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className={`badge ${bookingStep >= 1 ? 'badge-teal' : 'badge-secondary'}`}>1. Agendamiento</div>
            <div className={`badge ${bookingStep >= 2 ? 'badge-teal' : 'badge-secondary'}`}>2. Ficha de Pre-Ingreso</div>
            <div className={`badge ${bookingStep >= 3 ? 'badge-teal' : 'badge-secondary'}`}>3. Consentimiento Ley 20.584</div>
            <div className={`badge ${bookingStep >= 4 ? 'badge-success' : 'badge-secondary'}`}>4. Pago & WhatsApp</div>
          </div>

          {bookingStep === 1 && (
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Selección de Cita & Profesional</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Especialidad:</label>
                  <select defaultValue="psiquiatria">
                    <option value="psiquiatria">Psiquiatría Adultos (Dra. Marcela Valenzuela)</option>
                    <option value="psicologia">Psicología Clínica Cognitivo-Conductual</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Modalidad:</label>
                  <select defaultValue="telemedicina">
                    <option value="telemedicina">Telemedicina WebRTC Encriptada</option>
                    <option value="presencial">Presencial Box 3 - Providencia</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setBookingStep(2)}>
                Continuar a Pre-ingreso
              </button>
            </div>
          )}

          {bookingStep === 2 && (
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Formulario Clínico de Pre-Ingreso</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alergias Conocidas:</label>
                  <input type="text" defaultValue="Penicilina (urticaria leve)" />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fármacos en Uso Habitual:</label>
                  <input type="text" defaultValue="Sertralina 50mg suspendida hace 2 meses" />
                </div>
              </div>
              <button className="btn btn-primary" onClick={() => setBookingStep(3)}>
                Continuar a Consentimiento Informado
              </button>
            </div>
          )}

          {bookingStep === 3 && (
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Consentimiento Informado Ley N° 20.584
              </h3>
              <div
                style={{
                  height: '140px',
                  overflowY: 'auto',
                  background: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  lineHeight: '1.5',
                  marginBottom: '1rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Autorizo la atención clínica en Centro Médico Andino y declaro haber sido informado/a sobre las características
                de la atención en salud mental, confidencialidad de la ficha clínica según la Ley 19.628 y Ley 20.584, y el
                uso de herramientas tecnológicas de asistencia diagnóstica sin retención de audio.
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
                <input
                  type="checkbox"
                  id="consentCheck"
                  checked={consentSigned}
                  onChange={e => setConsentSigned(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <label htmlFor="consentCheck" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                  Acepto y firmo digitalmente con mi ClaveÚnica / Cédula de Identidad
                </label>
              </div>

              <button
                className="btn btn-primary"
                disabled={!consentSigned}
                onClick={() => setBookingStep(4)}
              >
                Pasar a Pago Seguro (MercadoPago / Fintoc)
              </button>
            </div>
          )}

          {bookingStep === 4 && (
            <div className="glass-card" style={{ maxWidth: '600px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                Checkout & Recaudación Previa
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.85rem' }}>
                <span>Copago Consulta Psiquiatría:</span>
                <strong style={{ color: '#38bdf8' }}>$11.250 CLP</strong>
              </div>

              {!bookingPaid ? (
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                  <button
                    className="btn btn-accent"
                    style={{ flex: 1 }}
                    onClick={async () => {
                      setBookingPaid(true);
                      await AutomationEngine.dispatchWhatsAppReminder({
                        patientPhone: patient.phone,
                        patientName: patient.name,
                        doctorName: 'Dra. Marcela Valenzuela',
                        appointmentDate: 'Jueves 24 Octubre 11:30 hrs',
                        telemedicineLink: 'https://tele.clinicafy.com/room/andino-9941',
                      });
                    }}
                  >
                    Pagar con Fintoc (Transferencia Inmediata)
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setBookingPaid(true)}
                  >
                    Pagar con MercadoPago (Webpay Plus)
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: '8px',
                    textAlign: 'center',
                  }}
                >
                  <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem' }} />
                  <div style={{ fontWeight: 700, color: '#059669', fontSize: '0.95rem' }}>
                    ¡Reserva Confirmada y Pagada Exitosamente!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                    Se ha enviado automáticamente el comprobante y el enlace de telemedicina al WhatsApp ({patient.phone}).
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* =========================================================================
          TAB 6: AUDITORÍA INMUTABLE (LEY 20.584)
          ========================================================================= */}
      {activeTab === 'audit' && (
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck size={22} color="#10b981" />
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Registro de Auditoría Inmutable (Ledger)</h2>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Trazabilidad protegida por triggers a nivel de base de datos. Ningún registro puede ser editado o borrado
                (Ley 20.584, Art. 12 y 13).
              </p>
            </div>
            <span className="badge badge-success">PostgreSQL Append-Only Trigger Activo</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', textAlign: 'left', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>ID & Timestamp</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Acción</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Usuario / Autor</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Recurso</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>IP Cliente</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Metadatos</th>
                </tr>
              </thead>
              <tbody>
                {auditEntries.map(entry => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <div className="font-mono" style={{ fontSize: '0.72rem', color: '#38bdf8' }}>{entry.id}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem' }}>
                      <span
                        className={`badge ${
                          entry.actionType === 'FEA_SIGN'
                            ? 'badge-indigo'
                            : entry.actionType === 'DISPENSE_RECETA'
                            ? 'badge-warning'
                            : entry.actionType === 'CONSUME_INVENTORY'
                            ? 'badge-danger'
                            : 'badge-teal'
                        }`}
                      >
                        {entry.actionType}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-primary)' }}>{entry.userEmail}</td>
                    <td style={{ padding: '0.6rem 0.8rem' }} className="font-mono">
                      {entry.resourceType}
                    </td>
                    <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-muted)' }}>{entry.clientIp}</td>
                    <td style={{ padding: '0.6rem 0.8rem', fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {JSON.stringify(entry.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
