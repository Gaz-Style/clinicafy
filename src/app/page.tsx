'use client';

import React, { useState } from 'react';
import {
  Calculator,
  TrendingUp,
  Coins,
  Brain,
  ShieldCheck,
  Stethoscope,
  Activity,
  Calendar,
  Lock,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  FileSignature,
  Building2,
  Users,
  CreditCard,
  Video,
  ChevronRight,
  Sparkles,
  Zap,
  Check,
  Clock,
  Layers,
  FileText,
  ChevronDown,
  RefreshCw,
  MessageSquare,
  Shield,
  Smartphone,
  CheckCheck,
  Menu,
  X,
  Loader2
} from 'lucide-react';

export default function ClinicafyLandingPage() {
  // Estados interactivos
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState<'psic' | 'med'>('psic');
  const [activePrevision, setActivePrevision] = useState<'fonasa' | 'colmena' | 'banmedica'>('colmena');
  const [billingTimer, setBillingTimer] = useState<boolean>(false);
  const [chatOptionSelected, setChatOptionSelected] = useState<string | null>('providencia');
  const [pricingCycle, setPricingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [calculatorDoctors, setCalculatorDoctors] = useState<number>(3);
  const [calculatorWhatsAppAI, setCalculatorWhatsAppAI] = useState<boolean>(true);
  const [calculatorFacturacion, setCalculatorFacturacion] = useState<boolean>(true);
  const [currencyMode, setCurrencyMode] = useState<'CLP' | 'UF'>('UF');

  // Cálculos dinámicos de inversión escalable (Seat-Based)
  const UF_RATE = 41000;
  // Formateador limpio sin ceros redundantes: 1 UF, 2.2 UF, 6.1 UF, 0.65 UF
  const formatUF = (val: number) => {
    const num = Math.round(val * 100) / 100;
    return String(num);
  };
  const isAnnual = pricingCycle === 'annual';
  const discountFactor = isAnnual ? 0.80 : 1.0;

  // Lógica de cálculo por profesional activo
  let baseUF = 1.0;
  let includedDoctors = 1;
  let extraDoctorUF = 0.65;
  let planTierName = 'Individual';

  if (calculatorDoctors === 1) {
    baseUF = 1.0;
    includedDoctors = 1;
    planTierName = 'Consulta Individual';
  } else if (calculatorDoctors <= 8) {
    baseUF = 2.2;
    includedDoctors = 2;
    extraDoctorUF = 0.65;
    planTierName = 'Clínica Pro';
  } else {
    baseUF = 6.1;
    includedDoctors = 8;
    extraDoctorUF = 0.50;
    planTierName = 'Red Médica Enterprise';
  }

  const extraDoctorsCount = Math.max(0, calculatorDoctors - includedDoctors);
  const extraDoctorsCostUF = extraDoctorsCount * extraDoctorUF;
  const whatsappCostUF = calculatorWhatsAppAI ? 0.60 : 0;
  const facturacionCostUF = calculatorFacturacion ? 0.40 : 0;

  const subtotalUF = baseUF + extraDoctorsCostUF + whatsappCostUF + facturacionCostUF;
  const finalUF = Number((subtotalUF * discountFactor).toFixed(2));
  const finalCLP = Math.round(finalUF * UF_RATE);

  // Comparativa vs software tradicional opaco (ej: Medilink)
  const estimatedMedilinkUF = (calculatorDoctors * 1.25) + (calculatorWhatsAppAI ? 1.4 : 0) + 0.5;
  const estimatedMedilinkCLP = Math.round(estimatedMedilinkUF * UF_RATE);
  const monthlySavingsCLP = Math.max(0, estimatedMedilinkCLP - finalCLP);

  // Modal para captura de leads / Cotizar demo CRM
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoProgressStep, setDemoProgressStep] = useState<number>(0);
  const [demoForm, setDemoForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Chile',
    specialty: 'Medicina General',
    role: 'Director Médico / Dueño',
    professionalsCount: '2 a 5 profesionales',
    seniority: 'Más de 3 años de operación',
    contactReason: 'Reemplazar software actual',
    currentSoftware: 'No uso software (Planillas / Papel)',
    consent: true,
  });

  // Datos interactivos para el simulador de bono I-Med
  const previsionData = {
    fonasa: {
      nombre: 'Fonasa Tramo D',
      arancel: 42000,
      bonificacionPct: 80,
      bonificacion: 33600,
      copago: 8400,
      folio: 'BON-918231',
      tiempo: '2.4s',
    },
    colmena: {
      nombre: 'Isapre Colmena Golden',
      arancel: 48000,
      bonificacionPct: 75,
      bonificacion: 36000,
      copago: 12000,
      folio: 'BON-849102',
      tiempo: '2.8s',
    },
    banmedica: {
      nombre: 'Isapre Banmédica Pleno',
      arancel: 45000,
      bonificacionPct: 70,
      bonificacion: 31500,
      copago: 13500,
      folio: 'BON-772910',
      tiempo: '3.1s',
    },
  };

  const handlePrevisionChange = (prev: 'fonasa' | 'colmena' | 'banmedica') => {
    setActivePrevision(prev);
    setBillingTimer(true);
    setTimeout(() => setBillingTimer(false), 300);
  };

  const currentPrev = previsionData[activePrevision];

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        color: 'var(--text-primary, #0f172a)',
        fontFamily: 'var(--font-main, "Plus Jakarta Sans", system-ui, sans-serif)',
        overflowX: 'hidden',
      }}
    >
      {/* =========================================================================
          1. HEADER INSTITUCIONAL NAVEGABLE (STICKY GLASS + MOBILE HAMBURGER)
          ========================================================================= */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
          padding: '0.75rem 1.25rem',
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: '#ffffff',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
              }}
            >
              <img
                src="/Isotipo-Clinicafy.webp"
                alt="Clinicafy Isotipo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <img
                src="/Logotipo-Clinicafy.webp"
                alt="Clinicafy"
                style={{ height: '22px', width: 'auto', display: 'block' }}
              />
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  background: '#f1f5f9',
                  color: '#0f172a',
                  padding: '0.2rem 0.45rem',
                  borderRadius: '5px',
                }}
                className="hidden-mobile"
              >
                Enterprise B2B
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
              fontSize: '0.84rem',
              fontWeight: 600,
              color: '#475569',
            }}
            className="hidden-mobile"
          >
            <a href="#capacidades" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>
              Capacidades IA
            </a>
            <a href="#por-que-clinicafy" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>
              ¿Por qué Clinicafy?
            </a>
            <a href="#operacion" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>
              Transformación
            </a>
            <a href="#planes" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>
              Planes
            </a>
            <a href="#seguridad" style={{ color: '#475569', textDecoration: 'none', transition: 'color 0.15s' }}>
              Ley 20.584
            </a>
          </nav>

          {/* Action CTAs (Desktop) */}
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="/login"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                color: '#0f172a',
                textDecoration: 'none',
                padding: '0.5rem 0.85rem',
              }}
            >
              Acceso Clínico
            </a>

            <div className="glowing-badge-border">
              <a
                href="/workstation"
                className="btn-pill btn-pill-primary"
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.82rem',
                  borderRadius: '9999px',
                }}
              >
                <span>Estación Demo en Vivo</span>
                <span className="reveal-arrow">
                  <ArrowRight size={14} />
                </span>
              </a>
            </div>
          </div>

          {/* Mobile Actions: Demo Quick Button + Hamburger Toggle */}
          <div className="visible-mobile" style={{ alignItems: 'center', gap: '0.5rem' }}>
            <a
              href="/workstation"
              style={{
                padding: '0.45rem 0.85rem',
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '8px',
                fontSize: '0.75rem',
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <span>Demo</span>
              <ArrowRight size={12} />
            </a>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                color: '#0f172a',
                cursor: 'pointer',
              }}
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              paddingTop: '1rem',
              paddingBottom: '1rem',
              borderTop: '1px solid #e2e8f0',
              marginTop: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
            }}
            className="visible-mobile"
          >
            {[
              { label: 'Capacidades IA', href: '#capacidades' },
              { label: '¿Por qué Clinicafy?', href: '#por-que-clinicafy' },
              { label: 'Transformación Operativa', href: '#operacion' },
              { label: 'Planes & Precios', href: '#planes' },
              { label: 'Ley 20.584 & Seguridad', href: '#seguridad' },
            ].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  padding: '0.75rem 0.5rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  color: '#334155',
                  textDecoration: 'none',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{item.label}</span>
                <ChevronRight size={15} color="#94a3b8" />
              </a>
            ))}

            <div style={{ paddingTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <a
                href="/workstation"
                className="btn-pill btn-pill-primary"
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <Stethoscope size={16} />
                <span>Probar Estación en Vivo</span>
              </a>

              <a
                href="/login"
                className="btn-pill btn-pill-secondary"
                style={{ width: '100%', boxSizing: 'border-box' }}
              >
                <Lock size={15} />
                <span>Acceso Clínico Profesional</span>
              </a>
            </div>
          </div>
        )}
      </header>

      {/* =========================================================================
          2. HERO SECTION EN 2 COLUMNAS (OPTIMIZADO MÓVIL)
          ========================================================================= */}
      <section
        style={{
          maxWidth: '1240px',
          margin: '0 auto',
          padding: '3rem 1.25rem 3.5rem',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
            gap: '2.5rem',
            alignItems: 'center',
          }}
        >
          {/* Columna Izquierda: Copywriting, Headline con Badge & CTAs */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: '#0f172a',
                color: '#ffffff',
                padding: '0.35rem 0.95rem',
                borderRadius: '999px',
                marginBottom: '1.25rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
              }}
            >
              <span className="pulse-dot" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                SOFTWARE MÉDICO
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2rem, 5.5vw, 3.6rem)',
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: '-0.035em',
                color: '#0f172a',
                marginBottom: '1.25rem',
              }}
            >
              El software médico que optimiza{' '}
              <span
                style={{
                  display: 'inline-block',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  padding: '0.08rem 0.65rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                }}
              >
                la operación
              </span>{' '}
              de tu centro de salud.
            </h1>

            <p
              style={{
                fontSize: '1.02rem',
                color: '#475569',
                lineHeight: '1.6',
                maxWidth: '560px',
                marginBottom: '2rem',
                fontWeight: 400,
              }}
            >
              Unifica todos tus procesos con el único sistema clínico que simplifica e integra la <strong>Ficha IA con Ambient Scribe</strong> (Zero Audio Retention), la <strong>Receta FEA Ley 19.799</strong> y la <strong>liquidación de Bonos I-Med en 3 segundos</strong>.
            </p>

            {/* CTAs con adaptación Mobile Stack */}
            <div
              style={{
                display: 'flex',
                alignItems: 'stretch',
                gap: '0.85rem',
                flexWrap: 'wrap',
                marginBottom: '2rem',
              }}
            >
              <div style={{ flex: '1 1 200px' }}>
                <button
                  type="button"
                  onClick={() => setIsDemoModalOpen(true)}
                  className="btn-pill btn-pill-primary"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem 1.6rem',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Stethoscope size={17} />
                  <span>Solicita una Demo</span>
                  <span className="reveal-arrow">
                    <ChevronRight size={16} />
                  </span>
                </button>
              </div>

              <div style={{ flex: '1 1 200px' }}>
                <a
                  href="#planes"
                  className="btn-pill btn-pill-secondary"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '0.85rem 1.5rem',
                    fontSize: '0.92rem',
                  }}
                >
                  <span>Compara nuestros planes</span>
                </a>
              </div>
            </div>

            {/* Micro-Badges de Confianza */}
            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>Sin contratos forzosos</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>Acreditado MINSAL Ley 20.584</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>Soporte en Chile 24/7</span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Fotografía de Equipo Médico Profesional con Badges Flotantes */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'relative',
                borderRadius: '20px',
                overflow: 'hidden',
                boxShadow: '0 20px 50px -15px rgba(15, 23, 42, 0.16), 0 0 30px rgba(2, 132, 199, 0.08)',
                border: '1px solid rgba(203, 213, 225, 0.8)',
                background: '#ffffff',
              }}
            >
              <img
                src="/medical-team-hero.jpg"
                alt="Equipo Médico Clínico Clinicafy"
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease',
                }}
              />

              {/* Floating Badge 1: Ambient Scribe */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '0.5rem 0.75rem',
                  boxShadow: '0 6px 18px rgba(15, 23, 42, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  maxWidth: '85%',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Brain size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0f172a' }}>
                    Ambient Scribe IA
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#059669', fontWeight: 600 }}>
                    ● 96% certeza · SOAP
                  </div>
                </div>
              </div>

              {/* Floating Badge 2: Bono I-Med */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(15, 23, 42, 0.94)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '0.5rem 0.85rem',
                  boxShadow: '0 10px 24px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#ffffff',
                  maxWidth: '85%',
                }}
              >
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.3)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Zap size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#ffffff' }}>
                    Liquidación I-Med
                  </div>
                  <div style={{ fontSize: '0.64rem', color: '#38bdf8', fontWeight: 600 }}>
                    &lt; 3 seg Fonasa / Isapres
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          3. STATS BANNER DE ALTO IMPACTO (2x2 GRID EN MÓVIL)
          ========================================================================= */}
      <section style={{ maxWidth: '1180px', margin: '0 auto 4.5rem', padding: '0 1.25rem' }}>
        <div className="stats-banner-dark" style={{ padding: '2rem 1.5rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
              gap: '1.75rem 1rem',
              alignItems: 'center',
            }}
          >
            {/* Stat 1 */}
            <div>
              <div className="stat-metric-number">&lt; 3 seg</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
                Liquidación Bono
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                I-Med en tiempo real
              </div>
            </div>

            {/* Stat 2 */}
            <div>
              <div className="stat-metric-number">1.8 hrs</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
                Ahorro Médico
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Ficha SOAP por IA
              </div>
            </div>

            {/* Stat 3 */}
            <div>
              <div className="stat-metric-number" style={{ color: '#38bdf8' }}>0 Bytes</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
                Retención de Audio
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Zero Memory en RAM
              </div>
            </div>

            {/* Stat 4 */}
            <div>
              <div className="stat-metric-number">100%</div>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.3rem' }}>
                Firma FEA
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                Ley N° 19.799
              </div>
            </div>
          </div>

          {/* Bottom Trust Marks */}
          <div
            style={{
              marginTop: '1.75rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.85rem',
              fontSize: '0.74rem',
              color: '#94a3b8',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#e2e8f0' }}>
              <ShieldCheck size={16} color="#38bdf8" />
              <span>Acreditación Técnica Integral en Chile:</span>
            </div>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontWeight: 600 }}>
              <span>✓ Ley 20.584</span>
              <span>✓ Datos Sensibles Ley 19.628</span>
              <span>✓ HL7 FHIR R4</span>
              <span>✓ PostgreSQL RLS</span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          4. BENTO GRID INTERACTIVO CON MINI-UIS ILUSTRADAS (RESPONSIVE)
          ========================================================================= */}
      <section id="capacidades" style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0284c7', fontWeight: 700 }}>
            Demostración en Tiempo Real
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0.4rem 0' }}>
            Todo potenciado con Inteligencia Clínica nativa
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
            No mostramos maquetas genéricas. Así funciona cada flujo clínico en Clinicafy.
          </p>
        </div>

        <div className="bento-grid-container">
          {/* Card 1: Ambient Scribe IA (Span 7) */}
          <div className="bento-card-interactive bento-col-7">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                    <Brain size={13} />
                    <span>AMBIENT SCRIBE EN VIVO</span>
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    Escucha ambiental y Ficha SOAP
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    onClick={() => setActiveConsultation('psic')}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: activeConsultation === 'psic' ? '#0f172a' : '#e2e8f0',
                      background: activeConsultation === 'psic' ? '#0f172a' : '#ffffff',
                      color: activeConsultation === 'psic' ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    Psiquiatría
                  </button>
                  <button
                    onClick={() => setActiveConsultation('med')}
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: activeConsultation === 'med' ? '#0f172a' : '#e2e8f0',
                      background: activeConsultation === 'med' ? '#0f172a' : '#ffffff',
                      color: activeConsultation === 'med' ? '#ffffff' : '#64748b',
                      cursor: 'pointer',
                    }}
                  >
                    Med. General
                  </button>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.15rem' }}>
                El médico habla con su paciente sin mirar la pantalla. El modelo extrae síntomas, signos y diagnósticos estructurados en formato SOAP con mapeo CIE-10.
              </p>

              {/* Mini UI Ilustrada: Consola de Audio y SOAP */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                  boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.03)',
                }}
              >
                {/* Audio Streaming Bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <div className="pulse-dot" />
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0f172a' }}>
                      Micrófono Box 3 · Captura Multimodal
                    </span>
                  </div>
                  <div className="waveform-bars">
                    <div className="wave-bar" />
                    <div className="wave-bar" />
                    <div className="wave-bar" />
                    <div className="wave-bar" />
                    <div className="wave-bar" />
                  </div>
                </div>

                {/* Simulated Real-Time Audio Dialog */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '10px',
                    padding: '0.7rem 0.85rem',
                    fontSize: '0.76rem',
                    color: '#334155',
                    fontStyle: 'italic',
                    marginBottom: '0.75rem',
                    lineHeight: '1.45',
                  }}
                >
                  {activeConsultation === 'psic' ? (
                    <span>
                      &ldquo;Dra., hace 4 semanas tengo insomnio grave, me cuesta levantarme de la cama y siento una pesadez profunda...&rdquo;
                    </span>
                  ) : (
                    <span>
                      &ldquo;Doctor, presento tos productiva de 5 días con expectoración verdosa y sensación febril matinal...&rdquo;
                    </span>
                  )}
                </div>

                {/* Extracted Structured SOAP Card */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    fontSize: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                      [S] Subjetivo (Anamnesis)
                    </span>
                    <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.12rem 0.4rem', borderRadius: '4px' }}>
                      96% Certeza
                    </span>
                  </div>
                  <div style={{ color: '#475569', lineHeight: '1.4', marginBottom: '0.45rem' }}>
                    {activeConsultation === 'psic'
                      ? 'Cuadro de 4 semanas con astenia, anhedonia marcada e insomnio de conciliación (>90 min).'
                      : 'Síntomas respiratorios agudos de 5 días con tos productiva y fiebre no cuantificada.'}
                  </div>

                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.4rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.3rem' }}>
                    <div>
                      <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#0284c7' }}>
                        CIE-10 Sugerido:
                      </span>{' '}
                      <strong style={{ color: '#0f172a' }}>
                        {activeConsultation === 'psic' ? 'F32.1 (Depresivo moderado)' : 'J20.9 (Bronquitis aguda)'}
                      </strong>
                    </div>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                      CONF: 94%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                <ShieldCheck size={15} />
                <span>Zero Memory: Audio destruido en RAM</span>
              </div>
              <a href="/workstation" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Ver en Workstation</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Card 2: ERP & Bonos I-Med en 3 Segundos (Span 5) */}
          <div className="bento-card-interactive bento-col-5">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#eff6ff', color: '#0284c7', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <Zap size={13} />
                <span>LIQUIDACIÓN EN 3 SEGUNDOS</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                Bono Electrónico I-Med
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.15rem' }}>
                Cotización en línea con Fonasa e Isapres sin salir de la ficha. Se calcula el arancel y se cobra el copago exacto.
              </p>

              {/* Mini UI Ilustrada: Simulador de Bono */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                {/* Selector de Previsión */}
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem' }}>
                  {(['colmena', 'fonasa', 'banmedica'] as const).map((prev) => (
                    <button
                      key={prev}
                      onClick={() => handlePrevisionChange(prev)}
                      style={{
                        flex: 1,
                        padding: '0.45rem 0.2rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: '1px solid',
                        borderColor: activePrevision === prev ? '#0284c7' : '#cbd5e1',
                        background: activePrevision === prev ? '#eff6ff' : '#ffffff',
                        color: activePrevision === prev ? '#0284c7' : '#475569',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {prev}
                    </button>
                  ))}
                </div>

                {/* Comprobante de Bono */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    padding: '0.85rem',
                    transition: 'opacity 0.2s',
                    opacity: billingTimer ? 0.4 : 1,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a' }}>
                      {currentPrev.nombre}
                    </span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.12rem 0.45rem', borderRadius: '4px' }}>
                      ✓ {currentPrev.tiempo}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginBottom: '0.2rem' }}>
                    <span>Arancel:</span>
                    <span>${currentPrev.arancel.toLocaleString('es-CL')} CLP</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#059669', marginBottom: '0.45rem' }}>
                    <span>Bonificación ({currentPrev.bonificacionPct}%):</span>
                    <span>-${currentPrev.bonificacion.toLocaleString('es-CL')} CLP</span>
                  </div>

                  <div
                    style={{
                      borderTop: '2px dashed #e2e8f0',
                      paddingTop: '0.45rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.66rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
                        Copago:
                      </div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                        ${currentPrev.copago.toLocaleString('es-CL')}{' '}
                        <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>CLP</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.66rem', color: '#64748b', display: 'block', fontFamily: 'var(--font-mono, monospace)' }}>
                        {currentPrev.folio}
                      </span>
                      <span style={{ fontSize: '0.64rem', color: '#0284c7', fontWeight: 700 }}>
                        Huella OK
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Conciliación con Transbank / Webpay
              </span>
              <a href="/workstation" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Probar</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Card 3: Receta Médica FEA con Código QR (Span 5) */}
          <div className="bento-card-interactive bento-col-5">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fdf4ff', color: '#a21caf', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <FileSignature size={13} />
                <span>LEY N° 19.799 ACREDITADA</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                Receta FEA con validación QR
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.15rem' }}>
                Firma criptográfica oficial exigida por el ISP y farmacias de cadena. 0% rechazos en medicamentos retenidos.
              </p>

              {/* Mini UI Ilustrada: Receta Digital */}
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '12px',
                  padding: '1rem',
                  boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.45rem' }}>
                  <div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase' }}>
                      Receta Médica Retenida
                    </span>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>SIS-8921-PSQ · RUT 14.892.110-3</div>
                  </div>
                  <span style={{ fontSize: '0.66rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.12rem 0.4rem', borderRadius: '4px' }}>
                    FEA Válida
                  </span>
                </div>

                <div style={{ marginBottom: '0.65rem' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#0f172a' }}>
                    Sertralina 50 mg comprimidos
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: '2px' }}>
                    1 comp vo c/24h matinal por 30 días. Dispensar 1 caja.
                  </div>
                </div>

                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '0.6rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b', fontWeight: 600 }}>
                      Hash SHA-256 Acreditado ISP:
                    </div>
                    <div style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: '#0f172a' }}>
                      7f8a9e01bc43de...
                    </div>
                  </div>
                  <QrCode size={34} color="#0f172a" />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
                Dispensación directa farmacias
              </span>
              <a href="/workstation" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Ver Receta</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {/* Card 4: Portal Pacientes & Agendamiento Omnicanal 24/7 (Span 7) */}
          <div className="bento-card-interactive bento-col-7">
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#fef3c7', color: '#d97706', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, marginBottom: '0.4rem' }}>
                <MessageSquare size={13} />
                <span>AGENDAMIENTO OMNICANAL 24/7</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem 0' }}>
                WhatsApp, Web y Recordatorios
              </h3>
              <p style={{ fontSize: '0.84rem', color: '#64748b', lineHeight: '1.55', marginBottom: '1.15rem' }}>
                El paciente agenda en su propio teléfono, acepta consentimientos Ley 20.584 y recibe recordatorios con confirmación 1-clic.
              </p>

              {/* Mini UI Ilustrada: Simulación Chat WhatsApp */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '14px',
                  padding: '1rem',
                }}
              >
                {/* Header Chat */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
                  <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', flexShrink: 0 }}>
                    <Smartphone size={15} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a' }}>
                      Clinicafy Bot Asistente
                    </div>
                    <div style={{ fontSize: '0.64rem', color: '#059669', fontWeight: 600 }}>
                      ● En línea · Inmediato
                    </div>
                  </div>
                </div>

                {/* Mensaje Paciente */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.45rem' }}>
                  <div style={{ background: '#e0f2fe', color: '#0369a1', padding: '0.5rem 0.8rem', borderRadius: '12px 12px 2px 12px', fontSize: '0.75rem', maxWidth: '85%' }}>
                    Hola, necesito hora con la Dra. Valenzuela para este jueves.
                  </div>
                </div>

                {/* Mensaje Bot */}
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '0.65rem' }}>
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', padding: '0.6rem 0.8rem', borderRadius: '12px 12px 12px 2px', fontSize: '0.75rem', maxWidth: '90%', lineHeight: '1.4' }}>
                    ¡Hola Claudia! Tengo cupo el <strong>Jueves 24 a las 15:30 hrs</strong>. ¿Prefieres presencial en Providencia o Telemedicina HD?
                  </div>
                </div>

                {/* Botones de Selección */}
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setChatOptionSelected('providencia')}
                    style={{
                      flex: '1 1 140px',
                      padding: '0.45rem 0.55rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: chatOptionSelected === 'providencia' ? '#059669' : '#cbd5e1',
                      background: chatOptionSelected === 'providencia' ? '#ecfdf5' : '#ffffff',
                      color: chatOptionSelected === 'providencia' ? '#059669' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Building2 size={13} />
                    <span>Box Providencia {chatOptionSelected === 'providencia' && '✓'}</span>
                  </button>

                  <button
                    onClick={() => setChatOptionSelected('telemed')}
                    style={{
                      flex: '1 1 140px',
                      padding: '0.45rem 0.55rem',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      border: '1px solid',
                      borderColor: chatOptionSelected === 'telemed' ? '#0284c7' : '#cbd5e1',
                      background: chatOptionSelected === 'telemed' ? '#eff6ff' : '#ffffff',
                      color: chatOptionSelected === 'telemed' ? '#0284c7' : '#475569',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    <Video size={13} />
                    <span>Telemedicina {chatOptionSelected === 'telemed' && '✓'}</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 600 }}>
                ✓ Bloqueo en tiempo real
              </span>
              <a href="/portal" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <span>Ver Portal</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. SECCIÓN COMPARATIVA: ¿POR QUÉ CLINICAFY? (SWIPE MÓVIL)
          ========================================================================= */}
      <section id="por-que-clinicafy" style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0284c7', fontWeight: 700 }}>
            Análisis de Impacto Clínico
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0.4rem 0' }}>
            ¿Por qué Clinicafy y no software genérico?
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '680px', margin: '0 auto' }}>
            Los softwares tradicionales fueron construidos como planillas administrativas. Clinicafy devuelve el tiempo al médico.
          </p>
        </div>

        {/* Swipe hint on mobile */}
        <div className="visible-mobile" style={{ alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.72rem', color: '#64748b', marginBottom: '0.65rem', fontWeight: 600 }}>
          <span>↔ Desliza la tabla para comparar todas las columnas</span>
        </div>

        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '600px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                    Área Operativa
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                    Software Tradicional
                  </th>
                  <th style={{ padding: '1rem 1.25rem', fontSize: '0.78rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', background: '#f0fdf4' }}>
                    Clinicafy Modern OS ✦
                  </th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem', color: '#334155' }}>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    Ficha Médica
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                    Digitación manual (15 min por paciente). El médico escribe de espaldas.
                  </td>
                  <td style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#065f46', fontWeight: 600 }}>
                    <strong>Ambient Scribe IA:</strong> Nota SOAP autocompletada sin tocar teclado.
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    Privacidad Voz
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                    Grabaciones almacenadas en nube de terceros sin soberanía.
                  </td>
                  <td style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#065f46', fontWeight: 600 }}>
                    <strong>Zero Memory:</strong> El audio se destruye en memoria RAM volátil.
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    Receta Médica
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                    PDFs simples sin firma legal o recetarios rechazados en farmacias.
                  </td>
                  <td style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#065f46', fontWeight: 600 }}>
                    <strong>Firma FEA (Ley 19.799):</strong> QR y hash criptográfico oficial ISP.
                  </td>
                </tr>

                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    Liquidación Bonos
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                    Digitación en portal externo, colas en recepción y descuadres de caja.
                  </td>
                  <td style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#065f46', fontWeight: 600 }}>
                    <strong>I-Med en 3 seg:</strong> Fonasa e Isapres con copago automático en pantalla.
                  </td>
                </tr>

                <tr>
                  <td style={{ padding: '1rem 1.25rem', fontWeight: 700, color: '#0f172a' }}>
                    Interoperabilidad
                  </td>
                  <td style={{ padding: '1rem 1.25rem', color: '#64748b' }}>
                    Formatos propietarios cerrados. Imposible migrar o exportar datos.
                  </td>
                  <td style={{ padding: '1rem 1.25rem', background: '#f0fdf4', color: '#065f46', fontWeight: 600 }}>
                    <strong>HL7 FHIR R4:</strong> Estándar médico abierto con exportación JSON.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          6. PLANES & PRECIOS TRANSPARENTES Y CALCULADORA EN UF (ESTÁNDAR B2B CHILE)
          ========================================================================= */}
      <section id="planes" style={{ maxWidth: '1180px', margin: '0 auto 5.5rem', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(2, 132, 199, 0.08)',
              border: '1px solid rgba(2, 132, 199, 0.25)',
              padding: '0.3rem 0.95rem',
              borderRadius: '999px',
              color: '#0284c7',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
            }}
          >
            <Coins size={14} />
            <span>Tarifas B2B en UF • Facturación Mensual o Anual</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0.2rem 0 0.6rem' }}>
            Tarifario Nivel Enterprise en UF. Cobro por profesional activo.
          </h2>
          <p style={{ fontSize: '0.96rem', color: '#64748b', maxWidth: '680px', margin: '0 auto 1.75rem auto', lineHeight: '1.6' }}>
            Al igual que los principales estándares de salud en Chile, cotizamos en Unidades de Fomento (UF) para proteger tu contrato. Secretarias, recepcionistas y cajas siempre 100% gratis.
          </p>

          {/* Selector de Ciclo y Moneda */}
          <div
            style={{
              display: 'inline-flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '0.8rem',
              background: '#f8fafc',
              padding: '0.35rem 0.6rem',
              borderRadius: '999px',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
            }}
          >
            {/* Toggle Mensual / Anual */}
            <div style={{ display: 'inline-flex', alignItems: 'center', background: '#e2e8f0', padding: '0.2rem', borderRadius: '999px' }}>
              <button
                type="button"
                onClick={() => setPricingCycle('monthly')}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  background: pricingCycle === 'monthly' ? '#ffffff' : 'transparent',
                  color: pricingCycle === 'monthly' ? '#0f172a' : '#64748b',
                  boxShadow: pricingCycle === 'monthly' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Mensual
              </button>
              <button
                type="button"
                onClick={() => setPricingCycle('annual')}
                style={{
                  padding: '0.4rem 0.95rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  border: 'none',
                  background: pricingCycle === 'annual' ? '#0f172a' : 'transparent',
                  color: pricingCycle === 'annual' ? '#ffffff' : '#64748b',
                  boxShadow: pricingCycle === 'annual' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>Anual</span>
                <span style={{ fontSize: '0.62rem', background: '#38bdf8', color: '#0f172a', padding: '0.1rem 0.35rem', borderRadius: '4px', fontWeight: 800 }}>
                  -20%
                </span>
              </button>
            </div>

            {/* Toggle UF / CLP */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>
              <span>Moneda:</span>
              <button
                type="button"
                onClick={() => setCurrencyMode('UF')}
                style={{
                  border: 'none',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: currencyMode === 'UF' ? '#0284c7' : 'transparent',
                  color: currencyMode === 'UF' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                UF (Estándar B2B)
              </button>
              <button
                type="button"
                onClick={() => setCurrencyMode('CLP')}
                style={{
                  border: 'none',
                  padding: '0.25rem 0.65rem',
                  borderRadius: '6px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: currencyMode === 'CLP' ? '#0284c7' : 'transparent',
                  color: currencyMode === 'CLP' ? '#ffffff' : '#64748b',
                  transition: 'all 0.15s ease',
                }}
              >
                CLP ($)
              </button>
            </div>
          </div>
        </div>

        {/* ===============================================================
            CALCULADORA INTERACTIVA DE INVERSIÓN EN UF (SEAT SLIDER)
            =============================================================== */}
        <div
          className="glass-panel"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid rgba(2, 132, 199, 0.25)',
            borderRadius: '24px',
            padding: '2rem',
            marginBottom: '3.5rem',
            boxShadow: '0 20px 45px -15px rgba(2, 132, 199, 0.12), 0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', alignItems: 'center' }}>
            {/* Lado Izquierdo: Controles del Slider y Módulos */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Users size={16} color="#0284c7" />
                  ¿Cuántos profesionales de salud atienden en tu centro?
                </span>
                <span
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.75rem',
                    borderRadius: '8px',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {calculatorDoctors} {calculatorDoctors === 1 ? 'médico' : 'médicos'}
                </span>
              </div>

              {/* Slider interactivo */}
              <input
                type="range"
                min="1"
                max="25"
                value={calculatorDoctors}
                onChange={(e) => setCalculatorDoctors(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  height: '8px',
                  borderRadius: '5px',
                  background: '#e2e8f0',
                  outline: 'none',
                  cursor: 'pointer',
                  accentColor: '#0284c7',
                  margin: '1rem 0 0.5rem 0',
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
                <span>1 (Consulta privada)</span>
                <span>5 (Clínica mediana)</span>
                <span>15+ (Centro médico)</span>
                <span>25+ (Red multisede)</span>
              </div>

              {/* Badges de soporte ilimitado gratis */}
              <div style={{ marginTop: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem' }}>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                    Secretarias y Recepción: 0 UF
                  </span>
                </div>
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '0.55rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <CheckCircle2 size={16} color="#16a34a" />
                  <span style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>
                    Cajas y Administradores: 0 UF
                  </span>
                </div>
              </div>

              {/* Toggles de Módulos Opcionales */}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <MessageSquare size={15} color="#0284c7" />
                    <strong>WhatsApp Bot con IA</strong> (Confirmación y agendamiento 24/7)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>+0.6 UF</span>
                    <input
                      type="checkbox"
                      checked={calculatorWhatsAppAI}
                      onChange={(e) => setCalculatorWhatsAppAI(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
                    />
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '0.8rem', color: '#334155' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <FileSignature size={15} color="#0284c7" />
                    <strong>Boleta Electrónica SII Integrada</strong> (Automática al cobrar en caja)
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#0284c7', fontWeight: 700 }}>+0.4 UF</span>
                    <input
                      type="checkbox"
                      checked={calculatorFacturacion}
                      onChange={(e) => setCalculatorFacturacion(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#0284c7', cursor: 'pointer' }}
                    />
                  </div>
                </label>
              </div>
            </div>

            {/* Lado Derecho: Resultado de Inversión en UF y Comparativa ROI */}
            <div
              style={{
                background: '#0f172a',
                color: '#ffffff',
                borderRadius: '18px',
                padding: '1.75rem',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Plan sugerido: {planTierName}
                  </span>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                    {calculatorDoctors} {calculatorDoctors === 1 ? 'profesional habilitado' : 'profesionales habilitados'}
                  </div>
                </div>
                <div style={{ background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38bdf8', padding: '0.2rem 0.55rem', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700 }}>
                  {pricingCycle === 'annual' ? 'Pago Anual (-20%)' : 'Facturación Mensual'}
                </div>
              </div>

              {/* Precio Principal Calculado (Predeterminado en UF) */}
              <div style={{ margin: '1.25rem 0' }}>
                <div style={{ fontSize: '2.6rem', fontWeight: 900, fontFamily: 'var(--font-mono, monospace)', lineHeight: 1, color: '#ffffff' }}>
                  {currencyMode === 'UF' ? formatUF(finalUF) + ' UF' : '$' + finalCLP.toLocaleString('es-CL')}
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#94a3b8' }}> + IVA / mes</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '0.4rem', fontWeight: 600 }}>
                  {currencyMode === 'UF'
                    ? 'Aprox. $' + finalCLP.toLocaleString('es-CL') + ' CLP al mes (UF ref. $' + UF_RATE.toLocaleString('es-CL') + ')'
                    : 'Equivalente a ' + formatUF(finalUF) + ' UF + IVA'}
                </div>
              </div>

              {/* Desglose Transparente en UF */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '0.85rem', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Base Plan ({includedDoctors} {includedDoctors === 1 ? 'profesional' : 'profesionales'}):</span>
                  <span style={{ fontWeight: 700, color: '#ffffff' }}>{formatUF(baseUF)} UF</span>
                </div>
                {extraDoctorsCount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{extraDoctorsCount} profesionales extras (+{formatUF(extraDoctorUF)} UF c/u):</span>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>+{formatUF(extraDoctorsCostUF)} UF</span>
                  </div>
                )}
                {calculatorWhatsAppAI && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>WhatsApp Bot IA (Agendamiento 24/7):</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>+0.60 UF</span>
                  </div>
                )}
                {calculatorFacturacion && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Boleta Electrónica SII:</span>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>+0.40 UF</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4ade80' }}>
                  <span>Secretarias, Recepción y Cajas:</span>
                  <span style={{ fontWeight: 800 }}>0 UF ILIMITADAS</span>
                </div>
              </div>

              {/* Comparativa vs Mercado Opaco en UF */}
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Costo estimado en otros sistemas tradicionales:</span>
                  <span style={{ textDecoration: 'line-through', color: '#f87171', fontWeight: 700 }}>
                    {formatUF(estimatedMedilinkUF)} UF (~${estimatedMedilinkCLP.toLocaleString('es-CL')} CLP)
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 800, marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <TrendingUp size={14} />
                  <span>Ahorro mensual: ~{formatUF(estimatedMedilinkUF - finalUF)} UF (~${monthlySavingsCLP.toLocaleString('es-CL')} CLP)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsDemoModalOpen(true)}
                className="btn-pill btn-pill-accent"
                style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}
              >
                <span>Activar Clinicafy ({formatUF(finalUF)} UF/mes)</span>
                <span className="reveal-arrow">
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ===============================================================
            GRID DE LOS 3 PLANES FORMALIZADOS EN UF
            =============================================================== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '1.5rem', alignItems: 'stretch' }}>
          {/* Plan 1: Individual / Especialista */}
          <div
            className="glass-panel"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Consultas Privadas & Especialistas
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.4rem 0' }}>
                Consulta Individual
              </h3>
              <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Para médicos, odontólogos, psicólogos o terapeutas con su propia consulta o box independiente.
              </p>

              <div style={{ margin: '1.5rem 0 1.25rem 0' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                  {pricingCycle === 'monthly' ? (currencyMode === 'UF' ? '1 UF' : '$41.000') : (currencyMode === 'UF' ? '0.8 UF' : '$32.800')}
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}> + IVA / mes</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0284c7', marginTop: '0.35rem', fontWeight: 600 }}>
                  {pricingCycle === 'annual' ? 'Aprox. $32.800 CLP/mes (-20% dcto. anual)' : 'Aprox. $41.000 CLP/mes (1 profesional)'}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span><strong>1 Profesional habilitado</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span><strong>Secretarias y asistentes ilimitadas (0 UF)</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Agenda médica + Reserva Web 24/7</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Ficha clínica electrónica por especialidad</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Telemedicina HD y Receta médica digital</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Registro de pagos y caja diaria</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => { setCalculatorDoctors(1); setIsDemoModalOpen(true); }}
                className="btn-pill btn-pill-secondary"
                style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}
              >
                <span>Comenzar con Plan Individual</span>
              </button>
            </div>
          </div>

          {/* Plan 2: Clínica Pro (Seat-Based - Más Popular) */}
          <div
            className="glass-panel"
            style={{
              background: '#0f172a',
              border: '2px solid #0284c7',
              borderRadius: '20px',
              padding: '1.85rem',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-12px',
                right: '24px',
                background: '#0284c7',
                color: '#ffffff',
                fontSize: '0.66rem',
                fontWeight: 800,
                padding: '0.22rem 0.75rem',
                borderRadius: '999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                boxShadow: '0 2px 8px rgba(2, 132, 199, 0.4)',
              }}
            >
              MÁS ELEGIDO EN CHILE
            </div>

            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Centros Médicos & Dentales (2 a 8 profesionales)
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff', margin: '0.35rem 0 0.4rem 0' }}>
                Clínica Pro (Escalable)
              </h3>
              <p style={{ fontSize: '0.83rem', color: '#94a3b8', lineHeight: '1.5', margin: 0 }}>
                La suite integral para centros que liquidan comisiones a médicos, controlan inventario y requieren facturación.
              </p>

              <div style={{ margin: '1.5rem 0 1.25rem 0' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                  {pricingCycle === 'monthly' ? (currencyMode === 'UF' ? '2.2 UF' : '$90.200') : (currencyMode === 'UF' ? '1.76 UF' : '$72.160')}
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#94a3b8' }}> + IVA / mes</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#38bdf8', marginTop: '0.35rem', fontWeight: 600 }}>
                  Incluye 2 profesionales (+0.65 UF por profesional adicional)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span><strong>Liquidación y Comisiones Médicas automáticas</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span><strong>Control de Inventario e Insumos por Box</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span><strong>Ambient Scribe IA Ilimitado</strong> (Ficha con voz)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span>Integración I-Med Bono Electrónico Fonasa/Isapre</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span>Secretarias, Recepcionistas y Cajas ilimitadas (0 UF)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#38bdf8" />
                  <span>Odontograma 3D / Ficha Estética Facial</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => { setCalculatorDoctors(3); setIsDemoModalOpen(true); }}
                className="btn-pill btn-pill-accent"
                style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}
              >
                <span>Probar Clínica Pro 14 Días Gratis</span>
                <span className="reveal-arrow">
                  <ArrowRight size={14} />
                </span>
              </button>
            </div>
          </div>

          {/* Plan 3: Red Médica / Enterprise */}
          <div
            className="glass-panel"
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.85rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Policlínicos & Redes Multisede (8+ profesionales)
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.4rem 0' }}>
                Red Enterprise
              </h3>
              <p style={{ fontSize: '0.83rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                Para operadores médicos de alta complejidad, laboratorios y centros con múltiples sucursales.
              </p>

              <div style={{ margin: '1.5rem 0 1.25rem 0' }}>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                  {pricingCycle === 'monthly' ? (currencyMode === 'UF' ? '6.1 UF' : '$250.100') : (currencyMode === 'UF' ? '4.88 UF' : '$200.080')}
                  <span style={{ fontSize: '0.82rem', fontWeight: 500, color: '#64748b' }}> + IVA / mes</span>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#0284c7', marginTop: '0.35rem', fontWeight: 600 }}>
                  Incluye 8 profesionales (+0.50 UF por profesional adicional)
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8rem', color: '#334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span><strong>Módulo de Laboratorio & Exámenes LIS</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span><strong>Conectividad HL7 / FHIR para HIS Hospitalario</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Gestión Multisede y Reportes Consolidados</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Migración asistida desde otros sistemas (sin pérdida de fichas)</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>Base de datos dedicada con cifrado RLS</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={15} color="#059669" />
                  <span>SLA 99.9% y Ejecutivo de Soporte Dedicado</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => { setCalculatorDoctors(10); setIsDemoModalOpen(true); }}
                className="btn-pill btn-pill-secondary"
                style={{ width: '100%', boxSizing: 'border-box', justifyContent: 'center' }}
              >
                <span>Hablar con Ingeniería B2B</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===============================================================
            TABLA COMPARATIVA: CLINICAFY VS SOFTWARE TRADICIONAL (OTROS SISTEMAS)
            =============================================================== */}
        <div
          style={{
            marginTop: '3.5rem',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#0284c7', fontWeight: 700 }}>
              Transparencia Absoluta
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0.2rem 0' }}>
              ¿Por qué las clínicas están migrando desde otros sistemas a Clinicafy?
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 600 }}>Criterio</th>
                  <th style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: 800, background: 'rgba(2, 132, 199, 0.04)', borderRadius: '8px 8px 0 0' }}>
                    Clinicafy (Cotizado en UF)
                  </th>
                  <th style={{ padding: '0.75rem 1rem', color: '#94a3b8', fontWeight: 600 }}>Software Tradicional (Otros Sistemas)</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>Precios Públicos en la Web</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700, background: 'rgba(2, 132, 199, 0.04)' }}>
                    ✅ 100% Públicos en UF con simulador
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>❌ Ocultos (Requiere agendar demo)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>Secretarias y Personal de Caja</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700, background: 'rgba(2, 132, 199, 0.04)' }}>
                    ✅ 0 UF (100% Ilimitadas)
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#334155' }}>Ilimitadas</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>Liquidación de Comisiones Médicas</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700, background: 'rgba(2, 132, 199, 0.04)' }}>
                    ✅ Incluido en Plan Pro
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#64748b' }}>Solo en planes superiores</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>Costo de Setup e Implementación</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700, background: 'rgba(2, 132, 199, 0.04)' }}>
                    ✅ 0 UF (Configuración instantánea)
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>Cobro adicional por onboarding</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#334155' }}>Contrato y Permanencia Forzada</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#16a34a', fontWeight: 700, background: 'rgba(2, 132, 199, 0.04)' }}>
                    ✅ Sin ataduras (Cancela cuando quieras)
                  </td>
                  <td style={{ padding: '0.75rem 1rem', color: '#dc2626' }}>Contratos habituales a 12 meses</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* =========================================================================
          7. TEASER INTERACTIVO DE LA WORKSTATION EN VIVO (MERCENARIO CONSOLE)
          ========================================================================= */}
      <section style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div
          className="glass-panel"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '18px',
            boxShadow: '0 8px 32px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header of Mockup */}
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ display: 'flex', gap: '5px' }}>
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#fca5a5', display: 'inline-block' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#fde68a', display: 'inline-block' }} />
                <span style={{ width: '9px', height: '9px', borderRadius: '50%', background: '#a7f3d0', display: 'inline-block' }} />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                clinicafy.app / workstation / live
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.15rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600, background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}>
                ● Claudia Morales (18.432.890-K)
              </span>
              <a
                href="/workstation"
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  color: 'var(--brand-teal, #0284c7)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}
              >
                Abrir Workstation <ExternalLink size={11} />
              </a>
            </div>
          </div>

          {/* Body of Mockup: 3 Clinical Columns */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem', padding: '1.25rem' }}>
            {/* Columna 1: Telemetría y Paciente */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase' }}>
                  IoT Biomonitor Box
                </span>
                <span style={{ fontSize: '0.68rem', color: '#059669', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                  STREAMING 1.2s
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Frecuencia Cardíaca</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                    74 <span style={{ fontSize: '0.7rem', fontWeight: 500, color: '#64748b' }}>lpm</span>
                  </div>
                </div>
                <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem' }}>
                  <div style={{ fontSize: '0.65rem', color: '#64748b' }}>Presión Arterial</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                    120/78 <span style={{ fontSize: '0.65rem', fontWeight: 500, color: '#64748b' }}>mmHg</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <AlertTriangle size={12} color="#dc2626" /> Alergia Crítica:
                </span>
                <div style={{ fontSize: '0.76rem', color: '#0f172a', fontWeight: 600, marginTop: '2px' }}>
                  Penicilinas y AINEs
                </div>
              </div>
            </div>

            {/* Columna 2: Ambient Scribe IA */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Brain size={13} color="#0284c7" /> Scribe (SOAP)
                </span>
                <span style={{ fontSize: '0.64rem', background: '#ecfdf5', color: '#059669', padding: '0.12rem 0.45rem', borderRadius: '4px', fontWeight: 700 }}>
                  RAM PURGED
                </span>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem', fontSize: '0.75rem', color: '#334155', lineHeight: '1.45' }}>
                <strong style={{ color: '#0f172a', display: 'block' }}>Subjetivo:</strong>
                Paciente con astenia de 4 semanas e insomnio de conciliación (&gt;90min).
                <div style={{ marginTop: '0.45rem', paddingTop: '0.45rem', borderTop: '1px solid #f1f5f9' }}>
                  <strong style={{ color: '#0284c7', display: 'block' }}>CIE-10 Sugerido:</strong>
                  <code style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#0f172a' }}>
                    F32.1 — Depresivo moderado
                  </code>
                </div>
              </div>
            </div>

            {/* Columna 3: Receta FEA y Bono I-Med */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#059669', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <FileSignature size={13} color="#059669" /> Receta & Bono
                </span>
                <span style={{ fontSize: '0.64rem', color: '#64748b', fontFamily: 'var(--font-mono, monospace)' }}>
                  FOLIO 849102
                </span>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#0f172a', fontWeight: 600 }}>
                  <span>Sertralina 50mg</span>
                  <span style={{ color: '#059669' }}>FEA OK</span>
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>
                  1 comp c/24h matinal x 30d
                </div>

                <div style={{ marginTop: '0.65rem', paddingTop: '0.65rem', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '0.64rem', color: '#64748b' }}>Bono Colmena (75%)</div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a', fontFamily: 'var(--font-mono, monospace)' }}>
                      Copago: $12.000 CLP
                    </div>
                  </div>
                  <QrCode size={30} color="#0f172a" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          8. TRANSFORMACIÓN OPERATIVA (ANTES VS DESPUÉS)
          ========================================================================= */}
      <section id="operacion" style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0284c7', fontWeight: 700 }}>
            Resultados Tangibles
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0.4rem 0' }}>
            Así cambia el día a día en tu clínica
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
            La tecnología es invisible. Lo que consigues es tranquilidad y precisión clínica.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
          {[
            {
              before: 'Digitación médica hasta tarde',
              after: 'Ficha estructurada al instante',
              desc: 'Ambient Scribe procesa el diálogo en memoria RAM y autocompleta la nota SOAP sin tocar el teclado.',
              metric: 'Ahorro de 1.8 hrs/día por médico',
            },
            {
              before: 'Recetas en papel rechazadas',
              after: 'Firma Electrónica Avanzada (FEA)',
              desc: 'Emisión con código criptográfico oficial Ley 19.799 y QR de validación farmacéutica inmediata.',
              metric: '0% de rechazos en farmacias',
            },
            {
              before: 'Colas en recepción digitando I-Med',
              after: 'Liquidación en 3 segundos',
              desc: 'El bono Fonasa o Isapre se cotiza en tiempo real y el copago entra verificado a la caja.',
              metric: 'Reducción de 85% de esperas',
            },
            {
              before: 'Fichas aisladas y riesgo legal',
              after: 'Cumplimiento Ley 20.584',
              desc: 'Trazabilidad criptográfica inmutable en base de datos PostgreSQL con RLS por sede médica.',
              metric: 'Auditoría 100% compliant MINSAL',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="glass-panel"
              style={{
                background: '#ffffff',
                border: '1px solid var(--border-subtle, #e2e8f0)',
                borderRadius: '16px',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '0.2rem' }}>
                  {item.before}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  {item.after}
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                  {item.desc}
                </p>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.76rem', color: '#059669', fontWeight: 700 }}>
                <CheckCircle2 size={15} color="#059669" />
                <span>{item.metric}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =========================================================================
          9. SEGURIDAD Y NORMATIVA CHILENA
          ========================================================================= */}
      <section id="seguridad" style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div
          className="glass-panel"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '18px',
            padding: '2.25rem 1.75rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            alignItems: 'center',
          }}
        >
          <div>
            <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#059669', fontWeight: 700 }}>
              Soberanía y Marco Legal
            </span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 1.9rem)', fontWeight: 800, color: '#0f172a', margin: '0.35rem 0 0.85rem 0', letterSpacing: '-0.02em' }}>
              Marco regulatorio de salud en Chile
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: '1.6', marginBottom: '1.25rem' }}>
              La confidencialidad médica no es opcional. Clinicafy implementa controles de seguridad de grado bancario y 
              auditoría persistente inmutable exigida por el MINSAL.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Ley N° 20.584: Derechos y Deberes en Salud</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Ley N° 19.628: Protección de Datos Sensibles</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Firma FEA con acreditación MINSAL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.82rem', color: '#0f172a', fontWeight: 600 }}>
                <CheckCircle2 size={16} color="#059669" />
                <span>Row Level Security (RLS) multi-tenant</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.35rem' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ShieldCheck size={16} color="#059669" />
              Trazabilidad Inmutable
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontFamily: 'var(--font-mono, monospace)', fontSize: '0.72rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem', color: '#334155' }}>
                <span style={{ color: '#0284c7' }}>READ_RECORD</span> · pat-morales-01 · Dra. Valenzuela
                <div style={{ color: '#94a3b8', fontSize: '0.64rem', marginTop: '2px' }}>2026-10-23T12:00:00Z · IP 190.161.42.12</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem', color: '#334155' }}>
                <span style={{ color: '#059669' }}>SIGN_FEA</span> · RX-78910 · SIS-8921-PSQ
                <div style={{ color: '#94a3b8', fontSize: '0.64rem', marginTop: '2px' }}>SHA256: 7f8a9e01bc43de · ISP</div>
              </div>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.55rem', color: '#334155' }}>
                <span style={{ color: '#d97706' }}>ZERO_AUDIO_DESTROYED</span> · RAM Purged
                <div style={{ color: '#94a3b8', fontSize: '0.64rem', marginTop: '2px' }}>Audio stream shredded in memory volátil</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          10. ACCESOS DIRECTOS AL ECOSISTEMA
          ========================================================================= */}
      <section id="ecosistema" style={{ maxWidth: '1180px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#0284c7', fontWeight: 700 }}>
            Ecosistema Conectado
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.3rem)', fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a', margin: '0.4rem 0' }}>
            Explora cada módulo de Clinicafy
          </h2>
          <p style={{ fontSize: '0.92rem', color: '#64748b', maxWidth: '640px', margin: '0 auto' }}>
            Cada pantalla está construida bajo la misma arquitectura de diseño y sincronizada a la misma base de datos.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {/* Card 1: Workstation */}
          <a
            href="/workstation"
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                  <Stethoscope size={17} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                  DEMO EN VIVO
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Estación Clínica (Workstation)
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Ficha SOAP asistida por IA, telemetría IoT y prescripción FEA.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Entrar a la Estación</span>
              <ArrowRight size={13} />
            </div>
          </a>

          {/* Card 2: Portal Paciente */}
          <a
            href="/portal"
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <Users size={17} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                  PACIENTES
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Portal de Pacientes & Reservas
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Agendamiento web, consentimiento Ley 20.584 y pago en línea.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Ver Portal Reservas</span>
              <ArrowRight size={13} />
            </div>
          </a>

          {/* Card 3: Dashboard Admin */}
          <a
            href="/dashboard"
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                  <Activity size={17} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#059669', background: '#ecfdf5', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                  ADMINISTRACIÓN
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Consola de Administración
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Control de agendas, recaudación del día e indicadores clave.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Abrir Dashboard</span>
              <ArrowRight size={13} />
            </div>
          </a>

          {/* Card 4: Acceso Clinico */}
          <a
            href="/login"
            style={{
              textDecoration: 'none',
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '16px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(15,23,42,0.03)',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                  <Lock size={17} />
                </div>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#0284c7', background: '#f0f9ff', padding: '0.15rem 0.45rem', borderRadius: '999px' }}>
                  ACCESO SEGURO
                </span>
              </div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', margin: '0 0 0.3rem 0' }}>
                Acceso Clínico Profesional
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                Autenticación PKI de dos factores con cumplimiento Ley 20.584.
              </p>
            </div>
            <div style={{ marginTop: '1.25rem', fontSize: '0.8rem', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>Ingresar al Sistema</span>
              <ArrowRight size={13} />
            </div>
          </a>
        </div>
      </section>

      {/* =========================================================================
          11. CALL TO ACTION FINAL B2B (RESPONSIVE MÓVIL)
          ========================================================================= */}
      <section style={{ maxWidth: '1000px', margin: '0 auto 5rem', padding: '0 1.25rem' }}>
        <div
          style={{
            backgroundColor: 'var(--brand-indigo, #0f172a)',
            color: '#ffffff',
            borderRadius: '20px',
            padding: '2.75rem 1.5rem',
            textAlign: 'center',
            boxShadow: '0 16px 40px rgba(15, 23, 42, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#38bdf8' }}>
            Despliegue Llave en Mano
          </span>
          <h2 style={{ fontSize: 'clamp(1.7rem, 4vw, 2.4rem)', fontWeight: 800, margin: '0.65rem auto 0.85rem auto', maxWidth: '680px', letterSpacing: '-0.025em' }}>
            Lleva la operación de tu centro médico a la era moderna
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#94a3b8', maxWidth: '580px', margin: '0 auto 2rem auto', lineHeight: '1.6' }}>
            Conectamos tus agendas, certificamos tus firmas FEA ante el MINSAL y habilitamos la integración I-Med en menos de 72 horas.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <div style={{ flex: '1 1 220px', maxWidth: '320px' }}>
              <a
                href="/workstation"
                className="btn-pill btn-pill-secondary"
                style={{ width: '100%', boxSizing: 'border-box', padding: '0.85rem 1.5rem' }}
              >
                <span>Explorar Estación Demo</span>
                <span className="reveal-arrow">
                  <ArrowRight size={15} />
                </span>
              </a>
            </div>

            <div style={{ flex: '1 1 200px', maxWidth: '280px' }}>
              <a
                href="/login"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  padding: '0.85rem 1.4rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  color: '#ffffff',
                  borderRadius: '9999px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  textDecoration: 'none',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <span>Ingreso Credenciales</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          12. FOOTER INSTITUCIONAL (RESPONSIVE MÓVIL)
          ========================================================================= */}
      <footer
        style={{
          borderTop: '1px solid var(--border-subtle, #e2e8f0)',
          backgroundColor: '#ffffff',
          padding: '2.5rem 1.25rem',
        }}
      >
        <div
          style={{
            maxWidth: '1180px',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <img
              src="/Logotipo-Clinicafy.webp"
              alt="Clinicafy"
              style={{ height: '20px', width: 'auto', display: 'block' }}
            />
            <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
              © 2026 Clinicafy Inc. Todos los derechos reservados.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.76rem', color: '#64748b', flexWrap: 'wrap' }}>
            <a href="/workstation" style={{ color: '#64748b', textDecoration: 'none' }}>Workstation</a>
            <a href="/portal" style={{ color: '#64748b', textDecoration: 'none' }}>Portal Paciente</a>
            <a href="/dashboard" style={{ color: '#64748b', textDecoration: 'none' }}>Dashboard Admin</a>
            <a href="/login" style={{ color: '#64748b', textDecoration: 'none' }}>Acceso</a>
          </div>
        </div>
      </footer>

      {/* =========================================================================
          MODAL: COTIZA O PIDE UNA DEMO GRATIS (CAPTURA CRM B2B MEDILINK-STYLE)
          ========================================================================= */}
      {isDemoModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 9999,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDemoModalOpen(false);
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem 1.75rem',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
              position: 'relative',
              border: '1px solid #e2e8f0',
            }}
          >
            {/* Botón cerrar */}
            <button
              type="button"
              onClick={() => {
                setIsDemoModalOpen(false);
                setDemoSubmitted(false);
              }}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: '#f1f5f9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
            >
              <X size={18} />
            </button>

                        {demoLoading ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                    boxShadow: '0 10px 25px rgba(2, 132, 199, 0.35)',
                  }}
                >
                  <Sparkles size={32} color="#ffffff" className="animate-spin" />
                </div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.4rem' }}>
                  Preparando tu Clínica Demo en Vivo
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '380px', margin: '0 auto 2rem', lineHeight: 1.5 }}>
                  Configurando el entorno personalizado para Dr(a). {demoForm.firstName || 'Médico'} ({demoForm.specialty}).
                </p>

                {/* Pasos Progresivos */}
                <div style={{ maxWidth: '360px', margin: '0 auto 2rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: demoProgressStep >= 1 ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                    {demoProgressStep >= 1 ? <CheckCircle2 size={18} color="#059669" /> : <Loader2 size={18} className="animate-spin" color="#0284c7" />}
                    <span>1. Creando box y agenda médica personalizada</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: demoProgressStep >= 2 ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                    {demoProgressStep >= 2 ? <CheckCircle2 size={18} color="#059669" /> : (demoProgressStep === 1 ? <Loader2 size={18} className="animate-spin" color="#0284c7" /> : <Clock size={18} />)}
                    <span>2. Poblando pacientes simulados ({demoForm.specialty})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem', color: demoProgressStep >= 3 ? '#059669' : '#94a3b8', fontWeight: 600 }}>
                    {demoProgressStep >= 3 ? <CheckCircle2 size={18} color="#059669" /> : (demoProgressStep === 2 ? <Loader2 size={18} className="animate-spin" color="#0284c7" /> : <Clock size={18} />)}
                    <span>3. Conectando simulador I-Med y Ambient Scribe IA</span>
                  </div>
                </div>

                <div style={{ fontSize: '0.76rem', color: '#0284c7', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Redirigiendo a tu Estación Médica...</span>
                </div>
              </div>
            ) : demoSubmitted ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.25rem',
                  }}
                >
                  <CheckCircle2 size={36} color="#059669" />
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem' }}>
                  ¡Entorno Clínico Habilitado!
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748b', maxWidth: '420px', margin: '0 auto 1.75rem', lineHeight: 1.5 }}>
                  Tu estación demo para <strong>Dr(a). {demoForm.firstName} {demoForm.lastName}</strong> está lista. También enviamos un respaldo al WhatsApp <strong>{demoForm.phone}</strong>.
                </p>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                  <a
                    href={`/workstation?demo=true&doctor=${encodeURIComponent((demoForm.firstName + ' ' + demoForm.lastName).trim() || 'Doctor')}&specialty=${encodeURIComponent(demoForm.specialty || 'Medicina General')}`}
                    className="btn-pill btn-pill-accent"
                    style={{ textDecoration: 'none' }}
                  >
                    <span>Entrar a mi Estación Médica Ahora</span>
                    <span className="reveal-arrow">
                      <ArrowRight size={14} />
                    </span>
                  </a>
                </div>
              </div>

            ) : (
              <div>
                {/* Header del Modal */}
                <div style={{ marginBottom: '1.5rem', paddingRight: '2rem' }}>
                  <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem', letterSpacing: '-0.02em' }}>
                    <span style={{ color: '#0284c7' }}>Cotiza</span> o pide una <span style={{ color: '#0284c7' }}>demo</span> gratis
                  </h3>
                  <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0 }}>
                    Descubre cómo Clinicafy automatiza tu centro médico y reduce las horas administrativas.
                  </p>
                </div>

                {/* Formulario CRM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setDemoLoading(true);
                    setDemoProgressStep(1);
                    setTimeout(() => setDemoProgressStep(2), 700);
                    setTimeout(() => setDemoProgressStep(3), 1400);
                    setTimeout(() => {
                      const doc = encodeURIComponent((demoForm.firstName + ' ' + demoForm.lastName).trim() || 'Médico');
                      const spec = encodeURIComponent(demoForm.specialty || 'Medicina General');
                      window.location.href = `/workstation?demo=true&doctor=${doc}&specialty=${spec}`;
                    }, 2200);
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  {/* Nombre y Apellido */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Nombre <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Ej: Marcelo"
                        value={demoForm.firstName}
                        onChange={e => setDemoForm({ ...demoForm, firstName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Apellido <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Ej: Valenzuela"
                        value={demoForm.lastName}
                        onChange={e => setDemoForm({ ...demoForm, lastName: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* Email de contacto */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                      Email Profesional o Corporativo <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="dr.valenzuela@clinicamedica.cl"
                      value={demoForm.email}
                      onChange={e => setDemoForm({ ...demoForm, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.86rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Teléfono / WhatsApp con prefijo */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                      Teléfono / WhatsApp de Contacto <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <div
                        style={{
                          padding: '0.65rem 0.75rem',
                          background: '#f8fafc',
                          border: '1px solid #cbd5e1',
                          borderRadius: '8px',
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          color: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <span>🇨🇱</span>
                        <span>+56</span>
                      </div>
                      <input
                        required
                        type="tel"
                        placeholder="9 8765 4321"
                        value={demoForm.phone}
                        onChange={e => setDemoForm({ ...demoForm, phone: e.target.value })}
                        style={{
                          flex: 1,
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.86rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  {/* País y Especialidad */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        País <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <select
                        value={demoForm.country}
                        onChange={e => setDemoForm({ ...demoForm, country: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        <option value="Chile">Chile</option>
                        <option value="Perú">Perú</option>
                        <option value="Colombia">Colombia</option>
                        <option value="México">México</option>
                        <option value="Argentina">Argentina</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Especialidad Principal <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <select
                        value={demoForm.specialty}
                        onChange={e => setDemoForm({ ...demoForm, specialty: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        <option value="Medicina General">Medicina General</option>
                        <option value="Psiquiatría y Salud Mental">Psiquiatría / Psicología</option>
                        <option value="Pediatría">Pediatría</option>
                        <option value="Ginecología y Obstetricia">Ginecología</option>
                        <option value="Dermatología">Dermatología</option>
                        <option value="Centro Multiespecialidad">Centro Multiespecialidad</option>
                      </select>
                    </div>
                  </div>

                  {/* Cargo y Nº de profesionales */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Tu Cargo en el Centro <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <select
                        value={demoForm.role}
                        onChange={e => setDemoForm({ ...demoForm, role: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        <option value="Director Médico / Dueño">Director Médico / Dueño</option>
                        <option value="Gerente de Operaciones / Admin">Gerente / Administrador</option>
                        <option value="Médico Tratante">Médico Tratante</option>
                        <option value="Encargado TI / Sistemas">TI / Informática Médica</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                        Nº de Profesionales <span style={{ color: '#e11d48' }}>*</span>
                      </label>
                      <select
                        value={demoForm.professionalsCount}
                        onChange={e => setDemoForm({ ...demoForm, professionalsCount: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.8rem',
                          borderRadius: '8px',
                          border: '1px solid #cbd5e1',
                          fontSize: '0.84rem',
                          background: '#ffffff',
                          outline: 'none',
                        }}
                      >
                        <option value="1 profesional (Individual)">1 profesional (Individual)</option>
                        <option value="2 a 5 profesionales">2 a 5 profesionales</option>
                        <option value="6 a 15 profesionales">6 a 15 profesionales</option>
                        <option value="Más de 15 profesionales">Más de 15 profesionales</option>
                      </select>
                    </div>
                  </div>

                  {/* ¿Qué sistema usas actualmente? */}
                  <div>
                    <label style={{ fontSize: '0.76rem', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                      ¿Qué software clínico o método usas hoy? <span style={{ color: '#e11d48' }}>*</span>
                    </label>
                    <select
                      value={demoForm.currentSoftware}
                      onChange={e => setDemoForm({ ...demoForm, currentSoftware: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.8rem',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.84rem',
                        background: '#ffffff',
                        outline: 'none',
                      }}
                    >
                      <option value="No uso software (Planillas / Papel)">No uso software (Planillas / Papel)</option>
                      <option value="Medilink">Medilink</option>
                      <option value="Dentalink">Dentalink</option>
                      <option value="Saluta / Reservo">Reservo / AgendaPro</option>
                      <option value="Desarrollo propio / Otro">Desarrollo propio / Otro</option>
                    </select>
                  </div>

                  {/* Consentimiento */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.55rem',
                      fontSize: '0.72rem',
                      color: '#64748b',
                      cursor: 'pointer',
                      marginTop: '0.25rem',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={demoForm.consent}
                      onChange={e => setDemoForm({ ...demoForm, consent: e.target.checked })}
                      style={{ marginTop: '2px', accentColor: '#0f172a' }}
                    />
                    <span>
                      Autorizo a Clinicafy a contactarme vía WhatsApp o correo electrónico para la presentación de la propuesta y demo guiada.
                    </span>
                  </label>

                  {/* Botón Submit */}
                  <button
                    type="submit"
                    disabled={demoLoading || !demoForm.consent}
                    style={{
                      marginTop: '0.5rem',
                      padding: '0.85rem',
                      background: '#0f172a',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: demoLoading ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(15, 23, 42, 0.15)',
                    }}
                  >
                    {demoLoading ? (
                      <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Enviando solicitud...</>
                    ) : (
                      <>Quiero cotizar mi demo <ChevronRight size={18} /></>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
