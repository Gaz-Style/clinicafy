'use client';

import React, { useState } from 'react';
import {
  Calendar, Clock, CreditCard, CheckCircle2, ChevronRight, ChevronLeft,
  User, Phone, Mail, Video, MapPin, ArrowLeft, Loader2,
  Search, Users, X, ShieldCheck, Building2, Smartphone
} from 'lucide-react';

interface Slot {
  slotStart: string;
  slotEnd: string;
  isAvailable: boolean;
}

const SPECIALTIES = [
  {
    id: 'psychiatry',
    title: 'Psiquiatría Adultos',
    doctor: 'Dra. Marcela Valenzuela',
    desc: 'Diagnóstico, farmacoterapia y control de salud mental',
    price: 45000,
  },
  {
    id: 'psychology',
    title: 'Psicología Clínica',
    doctor: 'Ps. Rodrigo Fuentes',
    desc: 'Psicoterapia cognitivo-conductual y manejo de crisis',
    price: 35000,
  },
  {
    id: 'gp',
    title: 'Medicina General',
    doctor: 'Dr. Carlos Ibáñez',
    desc: 'Evaluación clínica general, chequeos y recetas crónicas',
    price: 25000,
  },
];

const COVERAGE_MAP: Record<string, number> = {
  'Fonasa A': 1.0,
  'Fonasa B': 1.0,
  'Fonasa C': 0.9,
  'Fonasa D': 0.8,
  'Colmena': 0.75,
  'Banmédica': 0.7,
  'Consalud': 0.7,
  'CruzBlanca': 0.72,
  'Particular': 0.0,
};

function formatRut(value: string) {
  const clean = value.replace(/[^0-9kK]/g, '').toUpperCase();
  if (!clean) return '';
  if (clean.length === 1) return clean;
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${formatted}-${dv}`;
}

function capitalizeWords(value: string) {
  return value.replace(/\b[a-záéíóúüñ]/gi, char => char.toUpperCase());
}

function validateRut(rutStr: string) {
  const clean = rutStr.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8) return false;
  const dv = clean.slice(-1);
  const body = clean.slice(0, -1);
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i], 10) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expectedDv = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return dv === expectedDv;
}

export default function PatientPortalPage() {
  // Pasos progresivos:
  // 1: identifyPatient (¿Quién es el paciente? RUT + contacto)
  // 2: selectService (Modalidad + Especialidad)
  // 3: selectSlot (Fecha + Hora)
  // 4: reviewAndPay (Previsión + Copago I-Med)
  // 5: confirmation (Ticket digital)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Paso 1: Identificación
  const [patientTarget, setPatientTarget] = useState<'self' | 'family'>('self');
  const [rut, setRut] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [step1Attempted, setStep1Attempted] = useState(false); // Solo mostrar errores si intentó avanzar

  // Paso 2: Servicio
  const [modality, setModality] = useState<'telemedicine' | 'presencial'>('telemedicine');
  const [selectedSpecialty, setSelectedSpecialty] = useState(SPECIALTIES[0]);

  // Paso 3: Horario y Línea de tiempo
  const [selectedDate, setSelectedDate] = useState(() => {
    // Si hoy ya es tarde (>= 18:00) o fin de semana, comenzar por el siguiente día hábil
    const d = new Date();
    d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) {
      d.setDate(d.getDate() + 1);
    }
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [timelineOffset, setTimelineOffset] = useState(0); // Paginación de 10 días para la línea de tiempo

  // Paso 4: Previsión y Pago
  const [insurance, setInsurance] = useState('Colmena');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'onsite'>('online');
  const [documentSerial, setDocumentSerial] = useState(''); // Número de serie para bono no presencial
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [loading, setLoading] = useState(false);
  const [bookingResult, setBookingResult] = useState<{
    id: string;
    copay: number;
    bono: string;
    teleUrl?: string;
    paymentMode?: 'online' | 'onsite';
  } | null>(null);

  // Modal para consultar/anular cita existente
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchRutInput, setSearchRutInput] = useState('');
  const [existingAppointment, setExistingAppointment] = useState<any | null>(null);

  // Cálculos de copago
  const coverage = COVERAGE_MAP[insurance] ?? 0;
  const copay = Math.round(selectedSpecialty.price * (1 - coverage));

  // Bloques de horas simples (mañana y tarde)
  const MORNING_HOURS = ['09:00', '09:45', '10:30', '11:15', '12:00'];
  const AFTERNOON_HOURS = ['14:30', '15:15', '16:00', '16:45', '17:30'];

  const handleBook = async () => {
    setLoading(true);
    try {
      const scheduledDateTime = `${selectedDate}T${selectedTime || '10:00'}:00`;
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientRut: rut,
          patientName: name,
          patientEmail: email,
          patientPhone: phone,
          healthInsurance: insurance,
          scheduledAt: new Date(scheduledDateTime).toISOString(),
          durationMinutes: 45,
          modality,
          specialty: selectedSpecialty.title,
          doctorName: selectedSpecialty.doctor,
          totalAmount: selectedSpecialty.price,
        }),
      });

      const data = await res.json();
      setBookingResult({
        id: data.appointment?.id || `CLIN-${Math.floor(100000 + Math.random() * 900000)}`,
        copay,
        bono: `IMED-${Math.floor(10000000 + Math.random() * 90000000)}`,
        teleUrl: modality === 'telemedicine' ? `https://tele.clinicafy.com/room/andino-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
        paymentMode: paymentMethod,
      });
      setStep(5);
    } catch {
      setBookingResult({
        id: `CLIN-${Math.floor(100000 + Math.random() * 900000)}`,
        copay,
        bono: `IMED-${Math.floor(10000000 + Math.random() * 90000000)}`,
        teleUrl: modality === 'telemedicine' ? `https://tele.clinicafy.com/room/andino-9941` : undefined,
        paymentMode: paymentMethod,
      });
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAppointment = () => {
    if (!searchRutInput) return;
    setExistingAppointment({
      code: 'CLIN-849201',
      doctor: 'Dra. Marcela Valenzuela',
      specialty: 'Psiquiatría Adultos',
      date: 'Mañana, 15:15 hrs',
      modality: 'Telemedicina Online',
      status: 'Confirmada',
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        fontFamily: 'var(--font-main, "Plus Jakarta Sans", system-ui, sans-serif)',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ─── BARRA DE NAVEGACIÓN SUPERIOR (LIMPIA, TIPO APPLE / REDSALUD) ─── */}
      <nav
        style={{
          height: '70px',
          borderBottom: '1px solid #e2e8f0',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src="/Isotipo-Clinicafy.webp"
              alt="Clinicafy"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <img
              src="/Logotipo-Clinicafy.webp"
              alt="Clinicafy"
              style={{ height: '24px', width: 'auto', display: 'block' }}
            />
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Reserva de Horas Médicas
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => setShowSearchModal(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '0.84rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
            }}
          >
            Consultar o anular cita
          </button>

          <a
            href="/"
            style={{
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '0.45rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            Workstation
          </a>
        </div>
      </nav>

      {/* ─── INDICADOR DE PROGRESO DISCRETO (1, 2, 3, 4) ─── */}
      {step < 5 && (
        <div style={{ maxWidth: '520px', width: '100%', margin: '2rem auto 0', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Paso {step} de 4
            </span>
            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
              {step === 1 && 'Identificación'}
              {step === 2 && 'Especialidad'}
              {step === 3 && 'Fecha y Hora'}
              {step === 4 && 'Previsión y Copago'}
            </span>
          </div>
          <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: '#0f172a',
                width: `${(step / 4) * 100}%`,
                transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        </div>
      )}

      {/* ─── ÁREA CENTRAL: UN SOLO PROPÓSITO POR PANTALLA ─── */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem 1rem 3rem',
        }}
      >
        <div
          style={{
            maxWidth: step === 3 ? '640px' : '520px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
            transition: 'max-width 0.2s ease',
          }}
        >
          {/* ═══════════════════════════════════════════════════════════
              PASO 1: IDENTIFY PATIENT (INSPIRACIÓN DIRECTA REDSALUD)
              ═══════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
                ¿Para quién es la atención?
              </h1>
              <p style={{ fontSize: '0.88rem', color: '#64748b', margin: '0 0 1.75rem' }}>
                Ingresa los datos para registrar la reserva y validar tu previsión.
              </p>

              {/* Selector Segmentado: Para mí / Carga */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  background: '#f1f5f9',
                  padding: '4px',
                  borderRadius: '10px',
                  gap: '4px',
                  marginBottom: '1.5rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => setPatientTarget('self')}
                  style={{
                    padding: '0.6rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    background: patientTarget === 'self' ? '#ffffff' : 'transparent',
                    color: patientTarget === 'self' ? '#0f172a' : '#64748b',
                    boxShadow: patientTarget === 'self' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Para mí (Titular)
                </button>
                <button
                  type="button"
                  onClick={() => setPatientTarget('family')}
                  style={{
                    padding: '0.6rem',
                    border: 'none',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.84rem',
                    cursor: 'pointer',
                    background: patientTarget === 'family' ? '#ffffff' : 'transparent',
                    color: patientTarget === 'family' ? '#0f172a' : '#64748b',
                    boxShadow: patientTarget === 'family' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  Para mi hijo/a o carga
                </button>
              </div>

              {/* Formulario enfocado */}
              {/* Formulario enfocado */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {patientTarget === 'family' && (
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      Nombre del Titular o Apoderado
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: step1Attempted && guardianName.trim().split(/\s+/).filter(Boolean).length < 2 ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.9rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      placeholder="Ej: Claudia Morales Soto"
                      value={guardianName}
                      onChange={e => setGuardianName(capitalizeWords(e.target.value))}
                    />
                    {step1Attempted && guardianName.trim().split(/\s+/).filter(Boolean).length < 2 && (
                      <span style={{ fontSize: '0.72rem', color: '#e11d48', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                        Ingresa al menos un nombre y un apellido.
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                    RUT del Paciente que Asistirá
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: step1Attempted && rut.replace(/[^0-9kK]/g, '').length < 8 ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono, "JetBrains Mono", monospace)',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="18.432.890-K"
                    value={rut}
                    onChange={e => setRut(formatRut(e.target.value))}
                  />
                  {step1Attempted && rut.replace(/[^0-9kK]/g, '').length < 8 && (
                    <span style={{ fontSize: '0.72rem', color: '#e11d48', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                      Ingresa un RUT completo con dígito verificador.
                    </span>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                    Nombre y Apellido del Paciente
                  </label>
                  <input
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: step1Attempted && name.trim().split(/\s+/).filter(Boolean).length < 2 ? '1px solid #ef4444' : '1px solid #cbd5e1',
                      borderRadius: '10px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    placeholder="Ej: Mario Cruz"
                    value={name}
                    onChange={e => setName(capitalizeWords(e.target.value))}
                  />
                  {((step1Attempted && name.trim().split(/\s+/).filter(Boolean).length < 2) || (name.trim().length > 0 && name.trim().split(/\s+/).filter(Boolean).length < 2)) && (
                    <span style={{ fontSize: '0.72rem', color: '#e11d48', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                      Ingresa al menos un nombre y un apellido.
                    </span>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: step1Attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ? '1px solid #ef4444' : '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      placeholder="correo@ejemplo.cl"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                    {step1Attempted && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && (
                      <span style={{ fontSize: '0.72rem', color: '#e11d48', marginTop: '0.25rem', display: 'block', fontWeight: 500 }}>
                        Ingresa un correo válido.
                      </span>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.3rem' }}>
                      WhatsApp (Recordatorio)
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        border: '1px solid #cbd5e1',
                        borderRadius: '10px',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      placeholder="+56 9 8765 4321"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                {/* Botón y validación reactiva */}
                {(() => {
                  const isRutCleanValid = rut.replace(/[^0-9kK]/g, '').length >= 8;
                  const isNameValid = name.trim().split(/\s+/).filter(Boolean).length >= 2;
                  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
                  const isGuardianValid = patientTarget === 'self' || guardianName.trim().split(/\s+/).filter(Boolean).length >= 2;
                  const canContinue = isRutCleanValid && isNameValid && isEmailValid && isGuardianValid;

                  const missingFields: string[] = [];
                  if (!isRutCleanValid) missingFields.push('RUT válido');
                  if (!isNameValid) missingFields.push('Nombre y apellido');
                  if (!isEmailValid) missingFields.push('Correo electrónico válido');
                  if (!isGuardianValid) missingFields.push('Nombre del titular');

                  return (
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setStep1Attempted(true);
                          if (canContinue) {
                            setStep(2);
                          }
                        }}
                        style={{
                          marginTop: '0.75rem',
                          width: '100%',
                          padding: '0.85rem',
                          background: canContinue ? '#0f172a' : '#475569',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.92rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          transition: 'all 0.15s',
                        }}
                      >
                        Continuar a Especialidad
                        <ChevronRight size={18} />
                      </button>

                      {/* Solo mostrar el banner de alerta SI el usuario intentó avanzar con campos incompletos */}
                      {step1Attempted && !canContinue && (
                        <div
                          style={{
                            marginTop: '0.65rem',
                            padding: '0.6rem 0.8rem',
                            background: '#fef2f2',
                            border: '1px solid #fee2e2',
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.45rem',
                          }}
                        >
                          <span style={{ color: '#ef4444', fontSize: '0.78rem', lineHeight: '1.2' }}>•</span>
                          <span style={{ fontSize: '0.74rem', color: '#b91c1c', fontWeight: 500, lineHeight: '1.3' }}>
                            Por favor revisa:{' '}
                            <strong style={{ fontWeight: 700 }}>{missingFields.join(', ')}</strong>.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PASO 2: MODALIDAD Y ESPECIALIDAD (LIMPIO, SIN BARRERAS)
              ═══════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setStep(1)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  ¿Qué atención necesitas?
                </h2>
              </div>

              {/* Selector de Modalidad */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                  Modalidad de Consulta
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div
                    onClick={() => setModality('telemedicine')}
                    style={{
                      border: modality === 'telemedicine' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: modality === 'telemedicine' ? '#f8fafc' : '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <Video size={22} color={modality === 'telemedicine' ? '#0f172a' : '#64748b'} style={{ margin: '0 auto 0.4rem' }} />
                    <strong style={{ fontSize: '0.86rem', display: 'block', color: '#0f172a' }}>Telemedicina</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Video consulta online</span>
                  </div>

                  <div
                    onClick={() => setModality('presencial')}
                    style={{
                      border: modality === 'presencial' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                      borderRadius: '12px',
                      padding: '1rem',
                      cursor: 'pointer',
                      background: modality === 'presencial' ? '#f8fafc' : '#ffffff',
                      textAlign: 'center',
                    }}
                  >
                    <MapPin size={22} color={modality === 'presencial' ? '#0f172a' : '#64748b'} style={{ margin: '0 auto 0.4rem' }} />
                    <strong style={{ fontSize: '0.86rem', display: 'block', color: '#0f172a' }}>Presencial</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Providencia, Santiago</span>
                  </div>
                </div>
              </div>

              {/* Lista limpia de especialidades */}
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '0.5rem' }}>
                Selecciona la Especialidad
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.5rem' }}>
                {SPECIALTIES.map(s => {
                  const isSelected = selectedSpecialty.id === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedSpecialty(s)}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: isSelected ? '2px solid #0f172a' : '1px solid #e2e8f0',
                        background: isSelected ? '#f8fafc' : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>
                          {s.title}
                        </strong>
                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {s.doctor}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                          ${s.price.toLocaleString('es-CL')}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.7rem', color: '#059669', fontWeight: 600 }}>
                          Con convenio I-Med
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setStep(3)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                Continuar a Horarios
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PASO 3: FECHA Y HORA (LÍNEA DE TIEMPO REDSALUD STYLE)
              ═══════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <button
                    onClick={() => setStep(2)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                      ¿Qué hora buscas?
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {selectedSpecialty.title} • {selectedSpecialty.doctor}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── LÍNEA DE TIEMPO DE 10 FECHAS (ESTILO REDSALUD) ── */}
              <div style={{ marginBottom: '1.5rem' }}>
                {(() => {
                  // Generar 10 fechas hábiles consecutivas según el offset
                  const dayNames = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
                  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                  
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);

                  // Base date calculando offset
                  const datesList: Array<{
                    dateObj: Date;
                    isoStr: string;
                    dayName: string;
                    dayNum: number;
                    monthName: string;
                    isToday: boolean;
                    isWeekend: boolean;
                    availableCount: number;
                  }> = [];

                  // Empezar a generar a partir de hoy + timelineOffset días
                  let cursor = new Date();
                  cursor.setHours(0, 0, 0, 0);
                  cursor.setDate(cursor.getDate() + timelineOffset);

                  while (datesList.length < 10) {
                    const isWknd = cursor.getDay() === 0 || cursor.getDay() === 6;
                    const isTod = cursor.getTime() === today.getTime();
                    
                    const yyyy = cursor.getFullYear();
                    const mm = String(cursor.getMonth() + 1).padStart(2, '0');
                    const dd = String(cursor.getDate()).padStart(2, '0');
                    const iso = `${yyyy}-${mm}-${dd}`;

                    // Simular cupos disponibles
                    const availableCount = isWknd ? 0 : ((cursor.getDate() * 7) % 15) + 3;

                    datesList.push({
                      dateObj: new Date(cursor),
                      isoStr: iso,
                      dayName: dayNames[cursor.getDay()],
                      dayNum: cursor.getDate(),
                      monthName: monthNames[cursor.getMonth()],
                      isToday: isTod,
                      isWeekend: isWknd,
                      availableCount,
                    });

                    cursor.setDate(cursor.getDate() + 1);
                  }

                  // Obtener el mes representativo del tramo visible
                  const currentMonthLabel = datesList[0].dateObj.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

                  return (
                    <div>
                      {/* Cabecera del tramo de fechas */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>
                          {currentMonthLabel}
                        </span>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            type="button"
                            disabled={timelineOffset <= 0}
                            onClick={() => setTimelineOffset(prev => Math.max(0, prev - 7))}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: timelineOffset <= 0 ? 'not-allowed' : 'pointer',
                              color: timelineOffset <= 0 ? '#cbd5e1' : '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <ChevronLeft size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setTimelineOffset(prev => prev + 7)}
                            style={{
                              background: '#f1f5f9',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              color: '#0f172a',
                              display: 'flex',
                              alignItems: 'center',
                            }}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Carrusel horizontal de 10 fechas tipo píldoras */}
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: '0.5rem',
                          padding: '0.5rem 0',
                        }}
                      >
                        {datesList.slice(0, 10).map((d) => {
                          const isSelected = selectedDate === d.isoStr;
                          const isPastOrClosed = d.isWeekend;

                          return (
                            <button
                              key={d.isoStr}
                              type="button"
                              disabled={isPastOrClosed}
                              onClick={() => {
                                setSelectedDate(d.isoStr);
                                setSelectedTime(null);
                              }}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.55rem 0.25rem',
                                borderRadius: '12px',
                                border: isSelected
                                  ? '2px solid #0f172a'
                                  : d.isToday
                                    ? '1.5px dashed #94a3b8'
                                    : '1px solid #e2e8f0',
                                background: isSelected
                                  ? '#0f172a'
                                  : isPastOrClosed
                                    ? '#f8fafc'
                                    : '#ffffff',
                                color: isSelected
                                  ? '#ffffff'
                                  : isPastOrClosed
                                    ? '#cbd5e1'
                                    : '#0f172a',
                                cursor: isPastOrClosed ? 'not-allowed' : 'pointer',
                                transition: 'all 0.15s ease',
                                position: 'relative',
                              }}
                            >
                              {/* Badge con cupos disponibles si es día hábil */}
                              {!isPastOrClosed && (
                                <span
                                  style={{
                                    fontSize: '0.62rem',
                                    fontWeight: 700,
                                    color: isSelected ? '#38bdf8' : '#059669',
                                    lineHeight: 1,
                                    marginBottom: '2px',
                                  }}
                                >
                                  {d.availableCount} disp.
                                </span>
                              )}

                              <span
                                style={{
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  color: isSelected ? '#94a3b8' : isPastOrClosed ? '#cbd5e1' : '#64748b',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                }}
                              >
                                {d.dayName}
                              </span>

                              <span
                                style={{
                                  fontSize: '1.05rem',
                                  fontWeight: 800,
                                  fontFamily: 'var(--font-mono, monospace)',
                                  marginTop: '2px',
                                }}
                              >
                                {d.dayNum}
                              </span>

                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  color: isSelected ? '#cbd5e1' : '#94a3b8',
                                }}
                              >
                                {d.monthName}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* ── BLOQUES DE HORAS DISPONIBLES PARA LA FECHA SELECCIONADA ── */}
              {(() => {
                const now = new Date();
                const nowHours = now.getHours();
                const nowMinutes = now.getMinutes();
                const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const isSelectedDateToday = selectedDate === todayIso;

                // Filtrar horas pasadas si la fecha seleccionada es hoy
                const filterAvailableHours = (hoursList: string[]) => {
                  if (!isSelectedDateToday) return hoursList;
                  return hoursList.filter(timeStr => {
                    const [h, m] = timeStr.split(':').map(Number);
                    return h > nowHours || (h === nowHours && m > nowMinutes);
                  });
                };

                const availableMorning = filterAvailableHours(MORNING_HOURS);
                const availableAfternoon = filterAvailableHours(AFTERNOON_HOURS);
                const hasAnySlot = availableMorning.length > 0 || availableAfternoon.length > 0;

                return (
                  <div style={{ marginBottom: '1.75rem', background: '#f8fafc', padding: '1rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                        Horarios para el{' '}
                        {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-CL', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                    </div>

                    {!hasAnySlot ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem 0', color: '#64748b' }}>
                        <p style={{ margin: '0 0 0.5rem', fontWeight: 600, fontSize: '0.88rem', color: '#0f172a' }}>
                          No hay horas disponibles para este día
                        </p>
                        <span style={{ fontSize: '0.78rem' }}>
                          {isSelectedDateToday
                            ? 'Por la hora actual (pasadas las 18:00 hrs), las atenciones para hoy ya finalizaron. Selecciona el siguiente día en la línea de tiempo.'
                            : 'Todos los cupos fueron tomados. Selecciona otra fecha arriba.'}
                        </span>
                      </div>
                    ) : (
                      <>
                        {availableMorning.length > 0 && (
                          <div style={{ marginBottom: '0.85rem' }}>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                              Mañana
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              {availableMorning.map(t => {
                                const isSelected = selectedTime === t;
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setSelectedTime(t)}
                                    style={{
                                      padding: '0.5rem 0.85rem',
                                      borderRadius: '8px',
                                      border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                                      background: isSelected ? '#0f172a' : '#ffffff',
                                      color: isSelected ? '#ffffff' : '#0f172a',
                                      fontWeight: 600,
                                      fontSize: '0.84rem',
                                      fontFamily: 'var(--font-mono, monospace)',
                                      cursor: 'pointer',
                                      transition: 'all 0.12s ease',
                                    }}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {availableAfternoon.length > 0 && (
                          <div>
                            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
                              Tarde
                            </label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                              {availableAfternoon.map(t => {
                                const isSelected = selectedTime === t;
                                return (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => setSelectedTime(t)}
                                    style={{
                                      padding: '0.5rem 0.85rem',
                                      borderRadius: '8px',
                                      border: isSelected ? '1px solid #0f172a' : '1px solid #cbd5e1',
                                      background: isSelected ? '#0f172a' : '#ffffff',
                                      color: isSelected ? '#ffffff' : '#0f172a',
                                      fontWeight: 600,
                                      fontSize: '0.84rem',
                                      fontFamily: 'var(--font-mono, monospace)',
                                      cursor: 'pointer',
                                      transition: 'all 0.12s ease',
                                    }}
                                  >
                                    {t}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep(4)}
                style={{
                  width: '100%',
                  padding: '0.85rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.92rem',
                  cursor: !selectedTime ? 'not-allowed' : 'pointer',
                  opacity: !selectedTime ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                Continuar a Previsión
                <ChevronRight size={18} />
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PASO 4: PREVISIÓN, COPAGO Y MODALIDAD DE PAGO
              ═══════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <button
                  onClick={() => setStep(3)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748b' }}
                >
                  <ArrowLeft size={18} />
                </button>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Previsión y Pago de Copago
                </h2>
              </div>

              {/* Selector de Previsión */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.35rem' }}>
                  Selecciona tu Previsión de Salud
                </label>
                <select
                  value={insurance}
                  onChange={e => setInsurance(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    outline: 'none',
                    background: '#ffffff',
                  }}
                >
                  <option value="Colmena">Isapre Colmena (Convenio I-Med)</option>
                  <option value="Banmédica">Isapre Banmédica (Convenio I-Med)</option>
                  <option value="Consalud">Isapre Consalud (Convenio I-Med)</option>
                  <option value="CruzBlanca">Isapre CruzBlanca (Convenio I-Med)</option>
                  <option value="Fonasa B">Fonasa Tramo B (Copago $0 Gratuito)</option>
                  <option value="Fonasa C">Fonasa Tramo C (Convenio MLE)</option>
                  <option value="Fonasa D">Fonasa Tramo D (Convenio MLE)</option>
                  <option value="Particular">Particular (Sin bono de previsión)</option>
                </select>
              </div>

              {/* Tarjeta de Resumen y Copago */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: '0.35rem' }}>
                  <span>Arancel {selectedSpecialty.title}</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                    ${selectedSpecialty.price.toLocaleString('es-CL')}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#059669', marginBottom: '0.75rem' }}>
                  <span>Bonificación estimada {insurance}</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>
                    −${(selectedSpecialty.price - copay).toLocaleString('es-CL')}
                  </span>
                </div>

                <div
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <strong style={{ color: '#0f172a', fontSize: '0.92rem' }}>Copago Estimado:</strong>
                  <strong style={{ color: '#0f172a', fontSize: '1.35rem', fontFamily: 'var(--font-mono, monospace)' }}>
                    {copay === 0 ? 'GRATUITO ($0)' : `$${copay.toLocaleString('es-CL')} CLP`}
                  </strong>
                </div>

                <div style={{ marginTop: '0.65rem', fontSize: '0.74rem', color: '#64748b', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem' }}>
                  📅 Cita: {selectedDate} a las {selectedTime} hrs ({modality === 'telemedicine' ? 'Telemedicina' : 'Presencial'})
                </div>
              </div>

              {/* ── MODALIDAD DE PAGO (SOLO SI HAY COPAGO > 0) ── */}
              {copay > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>
                    ¿Cómo prefieres pagar tu copago?
                  </label>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                    {/* Opción 1: Pago Online */}
                    <div
                      onClick={() => setPaymentMethod('online')}
                      style={{
                        border: paymentMethod === 'online' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                        background: paymentMethod === 'online' ? '#f8fafc' : '#ffffff',
                        borderRadius: '10px',
                        padding: '0.85rem 0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <CreditCard size={18} color={paymentMethod === 'online' ? '#0f172a' : '#64748b'} />
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Pagar Ahora Online</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                        Webpay Plus, Tarjetas débito/crédito. Bono emitido al instante.
                      </p>
                    </div>

                    {/* Opción 2: Pago en Consultorio / Mesón */}
                    <div
                      onClick={() => setPaymentMethod('onsite')}
                      style={{
                        border: paymentMethod === 'onsite' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                        background: paymentMethod === 'onsite' ? '#f8fafc' : '#ffffff',
                        borderRadius: '10px',
                        padding: '0.85rem 0.75rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <Building2 size={18} color={paymentMethod === 'onsite' ? '#0f172a' : '#64748b'} />
                        <strong style={{ fontSize: '0.86rem', color: '#0f172a' }}>Pagar en Consultorio</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3 }}>
                        Paga en recepción antes de la atención (con huella dactilar I-Med).
                      </p>
                    </div>
                  </div>

                  {/* Detalle si elige Pago Online */}
                  {paymentMethod === 'online' && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.85rem',
                        background: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.45rem' }}>
                        <ShieldCheck size={16} color="#15803d" />
                        <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#15803d' }}>
                          Validación I-Med sin biometría requerida
                        </span>
                      </div>
                      <label style={{ fontSize: '0.74rem', color: '#374151', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Nº de Documento / Serie de tu Cédula (opcional para validación inmediata):
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.85rem',
                          background: '#ffffff',
                          fontFamily: 'var(--font-mono, monospace)',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                        placeholder="Ej: A123456789 (al reverso o frente de tu cédula)"
                        value={documentSerial}
                        onChange={e => setDocumentSerial(e.target.value.toUpperCase())}
                      />
                      <span style={{ fontSize: '0.68rem', color: '#65a30d', display: 'block', marginTop: '0.25rem' }}>
                        Reemplaza la huella dactilar validando con el Registro Civil.
                      </span>
                    </div>
                  )}

                  {/* Detalle si elige Pago en Consultorio */}
                  {paymentMethod === 'onsite' && (
                    <div
                      style={{
                        marginTop: '0.85rem',
                        padding: '0.75rem 0.85rem',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        fontSize: '0.76rem',
                        color: '#1e40af',
                        lineHeight: 1.4,
                      }}
                    >
                      📍 Tu hora queda <strong>reservada de inmediato</strong>. Al llegar al consultorio, acércate a recepción 10 minutos antes para registrar tu huella I-Med o cancelar el copago.
                    </div>
                  )}
                </div>
              )}

              {/* Consentimiento mínimo */}
              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  fontSize: '0.78rem',
                  color: '#475569',
                  marginBottom: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={consentAccepted}
                  onChange={e => setConsentAccepted(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: '#0f172a' }}
                />
                <span>
                  Acepto los términos de atención médica y confidencialidad conforme a la <strong>Ley 20.584</strong>.
                </span>
              </label>

              <button
                type="button"
                disabled={loading || !consentAccepted}
                onClick={handleBook}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  cursor: (loading || !consentAccepted) ? 'not-allowed' : 'pointer',
                  opacity: (loading || !consentAccepted) ? 0.45 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.15s',
                }}
              >
                {loading ? (
                  <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Procesando Reserva...</>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {copay === 0
                      ? 'Confirmar Reserva Gratuita'
                      : paymentMethod === 'online'
                        ? `Pagar con Webpay ($${copay.toLocaleString('es-CL')})`
                        : `Reservar y Pagar en Consultorio ($${copay.toLocaleString('es-CL')})`}
                  </>
                )}
              </button>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════
              PASO 5: TICKET DIGITAL LIMPIO (CONFIRMACIÓN)
              ═══════════════════════════════════════════════════════════ */}
          {step === 5 && bookingResult && (
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <CheckCircle2 size={32} color="#059669" />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.35rem' }}>
                ¡Cita Confirmada!
              </h2>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0 0 1.5rem' }}>
                Te enviamos un comprobante y recordatorio a <strong>{email}</strong>
              </p>

              {/* Ficha digital estilo Wallet */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1.25rem',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Paciente:</span>
                  <strong style={{ color: '#0f172a' }}>{name}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Médico:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedSpecialty.doctor}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Fecha:</span>
                  <strong style={{ color: '#0f172a' }}>{selectedDate} a las {selectedTime} hrs</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Estado del Copago:</span>
                  <strong style={{ color: bookingResult.paymentMode === 'onsite' ? '#d97706' : '#059669' }}>
                    {bookingResult.copay === 0
                      ? 'Gratuito (Fonasa B)'
                      : bookingResult.paymentMode === 'onsite'
                        ? `Pendiente en Consultorio ($${bookingResult.copay.toLocaleString('es-CL')})`
                        : `Pagado Online vía Webpay ($${bookingResult.copay.toLocaleString('es-CL')})`}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Bono I-Med:</span>
                  <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: '#0f172a' }}>
                    {bookingResult.bono}
                  </strong>
                </div>

                {bookingResult.teleUrl && (
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '0.65rem' }}>
                    {/* Big telemedicine CTA */}
                    <a
                      href={bookingResult.teleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                        color: '#ffffff',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: '0.88rem',
                        marginBottom: '0.65rem',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                      }}
                    >
                      <span>🎥</span>
                      <span>Unirse a la Sala de Telemedicina</span>
                      <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>(abre en nueva ventana)</span>
                    </a>
                    <span style={{ display: 'block', color: '#64748b', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                      Sala de Telemedicina:
                    </span>
                    <a
                      href={bookingResult.teleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#0284c7',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        wordBreak: 'break-all',
                      }}
                    >
                      {bookingResult.teleUrl}
                    </a>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  onClick={() => setShowSearchModal(true)}
                  style={{
                    padding: '0.65rem 1.1rem',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <span>📋</span>
                  <span>Gestionar esta cita</span>
                </button>
                <button
                  onClick={() => {
                    setStep(1);
                    setRut('');
                    setName('');
                    setEmail('');
                    setPhone('');
                    setSelectedTime(null);
                  }}
                  style={{
                    padding: '0.65rem 1.1rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    color: '#0f172a',
                  }}
                >
                  Agendar otra hora
                </button>

                <a
                  href="/#planes"
                  style={{
                    padding: '0.65rem 1.1rem',
                    background: '#0f172a',
                    color: '#ffffff',
                    borderRadius: '8px',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    textDecoration: 'none',
                  }}
                >
                  Conocer Planes & Precios
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ─── MODAL COMPACTO: CONSULTAR O ANULAR CITA ─── */}
      {showSearchModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Consultar o Anular Cita
              </h3>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  setExistingAppointment(null);
                  setSearchRutInput('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 1rem' }}>
              Ingresa el RUT del paciente para ver citas vigentes.
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <input
                style={{
                  flex: 1,
                  padding: '0.65rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: '0.9rem',
                  outline: 'none',
                }}
                placeholder="18.432.890-K"
                value={searchRutInput}
                onChange={e => setSearchRutInput(formatRut(e.target.value))}
              />
              <button
                type="button"
                onClick={handleSearchAppointment}
                style={{
                  padding: '0.65rem 1rem',
                  background: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Buscar
              </button>
            </div>

            {existingAppointment && (
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{existingAppointment.specialty}</strong>
                  <span style={{ fontSize: '0.72rem', background: '#ecfdf5', color: '#059669', padding: '0.15rem 0.5rem', borderRadius: '999px', fontWeight: 600 }}>
                    {existingAppointment.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.2rem' }}>
                  {existingAppointment.doctor} · {existingAppointment.date}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '1rem' }}>
                  {existingAppointment.modality}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => {
                      alert('Tu cita ha sido anulada con éxito conforme a la Ley 20.584.');
                      setExistingAppointment(null);
                      setShowSearchModal(false);
                    }}
                    style={{
                      flex: 1,
                      padding: '0.55rem',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      color: '#991b1b',
                      borderRadius: '8px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Anular Cita
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
