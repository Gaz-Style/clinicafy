'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3, Users, Calendar, TrendingUp, Package, ShieldCheck,
  DollarSign, Activity, Clock, CheckCircle2,
  ChevronRight, RefreshCw, Video, Stethoscope, ArrowRight, AlertTriangle, ArrowLeft
} from 'lucide-react';

interface StatCard { label: string; value: string; sub: string; icon: React.ReactNode; color: string; bg: string }
interface AppointmentRow {
  id: string; patient: string; doctor: string; time: string; specialty: string;
  status: 'confirmed' | 'pending_payment' | 'completed' | 'in_progress'; modality: string;
}

const MOCK_APPOINTMENTS: AppointmentRow[] = [
  { id: 'a1', patient: 'Claudia Morales S.', doctor: 'Dra. Valenzuela', time: '09:00', specialty: 'Psiquiatría', status: 'confirmed', modality: 'Telemedicina' },
  { id: 'a2', patient: 'Roberto Gómez P.', doctor: 'Ps. Fuentes', time: '10:00', specialty: 'Psicología', status: 'in_progress', modality: 'Presencial' },
  { id: 'a3', patient: 'Ana Torres M.', doctor: 'Dr. Ibáñez', time: '11:00', specialty: 'Med. General', status: 'pending_payment', modality: 'Telemedicina' },
  { id: 'a4', patient: 'Jorge Silva C.', doctor: 'Dra. Valenzuela', time: '12:00', specialty: 'Psiquiatría', status: 'completed', modality: 'Telemedicina' },
  { id: 'a5', patient: 'María Pérez L.', doctor: 'Ps. Fuentes', time: '14:00', specialty: 'Psicología', status: 'confirmed', modality: 'Presencial' },
];

const STATUS_CONFIG = {
  confirmed: { label: 'Confirmada', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  pending_payment: { label: 'Pago Pendiente', color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  completed: { label: 'Completada', color: '#475569', bg: '#f1f5f9', border: '#cbd5e1' },
  in_progress: { label: 'En Curso', color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' },
};

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview'|'appointments'|'patients'|'inventory'|'audit'|'commissions'>('overview');
  const [commissionsPaid, setCommissionsPaid] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString('es-CL'));
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'commissions') setActiveTab('commissions');
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const stats: StatCard[] = [
    { label: 'Citas Programadas Hoy', value: '12', sub: '3 telemedicina · 9 presencial', icon: <Calendar size={18}/>, color: '#0284c7', bg: '#f0f9ff' },
    { label: 'Recaudación Hoy', value: '$482.500', sub: 'Copagos Fintoc + Bono I-Med', icon: <DollarSign size={18}/>, color: '#059669', bg: '#ecfdf5' },
    { label: 'Pacientes en Control', value: '847', sub: '+12 nuevos este mes', icon: <Users size={18}/>, color: '#0f172a', bg: '#f8fafc' },
    { label: 'Tiempo Promedio de Espera', value: '4.2 min', sub: '↓ 1.3 min vs semana anterior', icon: <Clock size={18}/>, color: '#d97706', bg: '#fffbeb' },
  ];

  const styles = {
    page: {
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary, #f8fafc)',
      fontFamily: 'var(--font-main, "Plus Jakarta Sans", system-ui, sans-serif)',
      display: 'flex',
      color: 'var(--text-primary, #0f172a)',
    },
    sidebar: {
      width: '240px',
      background: '#ffffff',
      borderRight: '1px solid var(--border-subtle, #e2e8f0)',
      padding: '1.5rem 1rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.35rem',
      flexShrink: 0,
      minHeight: '100vh',
    },
    sidebarItem: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '0.65rem',
      padding: '0.65rem 0.85rem',
      borderRadius: '10px',
      cursor: 'pointer',
      fontSize: '0.84rem',
      background: active ? 'var(--brand-indigo, #0f172a)' : 'transparent',
      color: active ? '#ffffff' : '#475569',
      fontWeight: active ? 600 : 500,
      border: 'none',
      width: '100%',
      textAlign: 'left' as const,
      transition: 'all 0.15s ease',
      boxShadow: active ? '0 2px 4px rgba(15, 23, 42, 0.08)' : 'none',
    }),
    main: {
      flex: 1,
      padding: '1.75rem 2.25rem 3.5rem',
      overflowY: 'auto' as const,
      backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
      backgroundSize: '24px 24px',
    },
    statCard: {
      background: '#ffffff',
      border: '1px solid var(--border-subtle, #e2e8f0)',
      borderRadius: '14px',
      padding: '1.25rem 1.4rem',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '0.4rem',
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
      transition: 'all 0.15s ease',
    },
    badge: (cfg: typeof STATUS_CONFIG[keyof typeof STATUS_CONFIG]) => ({
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.3rem',
      padding: '0.22rem 0.65rem',
      borderRadius: '999px',
      fontSize: '0.72rem',
      fontWeight: 600,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
    }),
    tableRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 1.5fr 0.8fr 1.2fr 1fr 1fr',
      padding: '0.85rem 1.25rem',
      borderBottom: '1px solid #f1f5f9',
      alignItems: 'center',
      fontSize: '0.84rem',
      color: '#334155',
    },
  };

  const TABS = [
    { id: 'overview', label: 'Resumen Operativo', icon: <BarChart3 size={16}/> },
    { id: 'appointments', label: 'Agenda Diaria', icon: <Calendar size={16}/> },
    { id: 'patients', label: 'Fichas y Pacientes', icon: <Users size={16}/> },
    { id: 'inventory', label: 'Farmacia e Insumos', icon: <Package size={16}/> },
    { id: 'commissions', label: 'Comisiones Médicas', icon: <DollarSign size={16}/> },
    { id: 'audit', label: 'Auditoría Ley 20.584', icon: <ShieldCheck size={16}/> },
  ] as const;

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <aside style={styles.sidebar}>
        {/* Logo Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem', paddingLeft: '0.25rem' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: '4px',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
          }}>
            <img
              src="/Isotipo-Clinicafy.webp"
              alt="Clinicafy Isotipo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
          <div>
            <img
              src="/Logotipo-Clinicafy.webp"
              alt="Clinicafy"
              style={{ height: '22px', width: 'auto', display: 'block' }}
            />
            <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px', fontWeight: 600 }}>
              Admin Console · Multi-Tenant
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={styles.sidebarItem(activeTab === tab.id)}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}

        {/* Quick Link to Workstation ✅ */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
          <a
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
            }}
          >
            <span>Estación Clínica</span>
            <ChevronRight size={14} color="#64748b" />
          </a>
          <a
            href="/manual-de-marca"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0284c7',
              textDecoration: 'none',
              fontSize: '0.78rem',
              fontWeight: 600,
              marginTop: '0.4rem',
            }}
          >
            <span>📘 Manual de Marca</span>
            <ChevronRight size={14} color="#0284c7" />
          </a>
        </div>

        {/* Footer info */}
        <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-subtle, #e2e8f0)' }}>
          <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#0f172a' }}>Centro Médico Andino</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Sucursal Providencia · Box 1</div>
          <div style={{
            fontSize: '0.78rem',
            color: '#059669',
            marginTop: '0.4rem',
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
            {currentTime}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={styles.main}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary, #0f172a)', margin: 0, letterSpacing: '-0.02em' }}>
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
            <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.82rem', margin: '0.2rem 0 0 0' }}>
              Centro Médico Andino · Red Operativa Asistencial en Tiempo Real
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <a
              href="/portal"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.55rem 0.95rem',
                background: '#ffffff',
                border: '1px solid var(--border-accent, #cbd5e1)',
                borderRadius: '9px',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.82rem',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              + Nueva Cita (Portal Paciente)
            </a>

            <button
              onClick={handleRefresh}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                padding: '0.55rem 0.95rem',
                background: '#ffffff',
                border: '1px solid var(--border-accent, #cbd5e1)',
                borderRadius: '9px',
                color: 'var(--text-primary, #0f172a)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }} />
              Actualizar
            </button>
          </div>
        </div>

        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem' }}>
              {stats.map((s, i) => (
                <div key={i} style={styles.statCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      background: s.bg,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: s.color,
                    }}>
                      {s.icon}
                    </div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>
                      <TrendingUp size={13} color="#059669"/> +4.8%
                    </span>
                  </div>

                  <div style={{
                    fontSize: '1.55rem',
                    fontWeight: 800,
                    color: 'var(--text-primary, #0f172a)',
                    lineHeight: 1.1,
                    marginTop: '0.25rem',
                    fontFamily: s.label.includes('Recaudación') ? 'var(--font-mono, monospace)' : 'inherit',
                  }}>
                    {s.value}
                  </div>

                  <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary, #0f172a)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {s.sub}
                  </div>
                </div>
              ))}
            </div>

            {/* Today's schedule preview */}
            <div style={{
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              borderRadius: '14px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
            }}>
              <div style={{
                padding: '1.1rem 1.4rem',
                borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                    Agenda de Atención Médica de Hoy
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                    Sincronización automática con I-Med y Sala de Espera
                  </p>
                </div>
                <button
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--brand-teal, #0284c7)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    fontWeight: 600,
                  }}
                  onClick={() => setActiveTab('appointments')}
                >
                  Ver agenda completa <ChevronRight size={14}/>
                </button>
              </div>

              {/* Table header */}
              <div style={{
                ...styles.tableRow,
                background: '#f8fafc',
                color: '#64748b',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                borderBottom: '1px solid #e2e8f0',
              }}>
                <span>Paciente</span>
                <span>Profesional</span>
                <span>Hora</span>
                <span>Especialidad</span>
                <span>Estado</span>
                <span>Modalidad</span>
              </div>

              {MOCK_APPOINTMENTS.map(apt => {
                const cfg = STATUS_CONFIG[apt.status];
                return (
                  <div key={apt.id} style={styles.tableRow}>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{apt.patient}</span>
                    <span>{apt.doctor}</span>
                    <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#0f172a' }}>
                      {apt.time}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#475569' }}>
                      <Stethoscope size={13} color="#64748b"/>
                      {apt.specialty}
                    </span>
                    <span>
                      <span style={styles.badge(cfg)}>{cfg.label}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#475569' }}>
                      {apt.modality === 'Telemedicina' ? (
                        <Video size={13} color="#0284c7"/>
                      ) : (
                        <Activity size={13} color="#059669"/>
                      )}
                      {apt.modality}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Alerts & System Status */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '12px',
                padding: '1.15rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <AlertTriangle size={16} color="#d97706"/>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#b45309' }}>
                    Alertas de Farmacia y Stock Crítico
                  </h4>
                </div>
                {[
                  'Kit Test Rápido Detección Sustancias (4 unidades restantes en Box 1)',
                  'Vial Ketamina 50mg/ml (6 ampollas restantes en farmacia central)',
                ].map((alert, i) => (
                  <div key={i} style={{
                    fontSize: '0.8rem',
                    color: '#92400e',
                    padding: '0.45rem 0',
                    borderBottom: i === 0 ? '1px solid rgba(217,119,6,0.15)' : 'none',
                  }}>
                    ⚠ {alert}
                  </div>
                ))}
              </div>

              <div style={{
                background: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '12px',
                padding: '1.15rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <CheckCircle2 size={16} color="#059669"/>
                  <h4 style={{ margin: 0, fontSize: '0.86rem', fontWeight: 700, color: '#047857' }}>
                    Servicios de Infraestructura Operativos
                  </h4>
                </div>
                {[
                  '✓ Supabase DAL con Row Level Security (RLS) activo',
                  '✓ Auditoría Inmutable persistente según Ley N° 20.584',
                  '✓ Infraestructura Telemedicina WebRTC conectada',
                  '✓ Notificaciones WhatsApp Cloud API operativas',
                ].map((item, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', color: '#065f46', padding: '0.25rem 0' }}>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── APPOINTMENTS TAB ─── */}
        {activeTab === 'appointments' && (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{
              padding: '1.1rem 1.4rem',
              borderBottom: '1px solid var(--border-subtle, #e2e8f0)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 700, color: '#0f172a' }}>
                  Todas las citas programadas para hoy
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: '#64748b' }}>
                  Muestra la cola de atención médica y estados de copago
                </p>
              </div>
              <a
                href="/portal"
                style={{
                  fontSize: '0.78rem',
                  color: '#ffffff',
                  background: 'var(--brand-indigo, #0f172a)',
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                }}
              >
                + Nueva cita (Portal)
              </a>
            </div>

            <div style={{
              ...styles.tableRow,
              background: '#f8fafc',
              color: '#64748b',
              fontSize: '0.72rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              borderBottom: '1px solid #e2e8f0',
            }}>
              <span>Paciente</span>
              <span>Médico</span>
              <span>Hora</span>
              <span>Especialidad</span>
              <span>Estado</span>
              <span>Modalidad</span>
            </div>

            {MOCK_APPOINTMENTS.map(apt => {
              const cfg = STATUS_CONFIG[apt.status];
              return (
                <div key={apt.id} style={{ ...styles.tableRow, cursor: 'pointer' }}>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{apt.patient}</span>
                  <span>{apt.doctor}</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: '#0f172a' }}>
                    {apt.time}
                  </span>
                  <span style={{ color: '#475569' }}>{apt.specialty}</span>
                  <span><span style={styles.badge(cfg)}>{cfg.label}</span></span>
                  <span style={{ fontSize: '0.78rem', color: '#475569' }}>{apt.modality}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* ─── OTHER TABS (Patients, Inventory, Audit) ─── */}
        {activeTab === 'commissions' && (
          <div>
            {/* Header del Módulo de Comisiones */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', color: '#059669', fontWeight: 800, marginBottom: '0.5rem' }}>
                  <CheckCircle2 size={13} />
                  <span>CÁLCULO AUTOMATIZADO • MES EN CURSO</span>
                </div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.3rem' }}>
                  Liquidación de Comisiones y Honorarios Médicos
                </h2>
                <p style={{ fontSize: '0.84rem', color: '#64748b', margin: 0, maxWidth: '650px' }}>
                  Cálculo automático de porcentajes pactados por box (Fonasa, Isapres, Particular). Con retención legal de boletas de honorarios (13.75%) lista para F29.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => alert('Generando archivo de nómina para Banco de Chile, Santander y BCI...')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <DollarSign size={14} color="#059669" />
                  <span>Exportar Nómina Bancaria</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCommissionsPaid(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.55rem 0.95rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: commissionsPaid ? '#16a34a' : '#0284c7',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  }}
                >
                  <CheckCircle2 size={14} />
                  <span>{commissionsPaid ? '✓ Período Liquidado' : 'Cerrar y Notificar Médicos'}</span>
                </button>
              </div>
            </div>

            {/* KPI Cards de Comisiones */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>Recaudación Bruta Total</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#0f172a', margin: '0.3rem 0', fontFamily: 'var(--font-mono, monospace)' }}>
                  $10.890.000
                </div>
                <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>195 consultas liquidadas</div>
              </div>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#166534', fontWeight: 700 }}>Margen Neto para la Clínica</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#166534', margin: '0.3rem 0', fontFamily: 'var(--font-mono, monospace)' }}>
                  $3.821.500
                </div>
                <div style={{ fontSize: '0.72rem', color: '#166534' }}>35.1% margen retenido</div>
              </div>

              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#1e40af', fontWeight: 700 }}>Líquido a Transferir a Doctores</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#1e40af', margin: '0.3rem 0', fontFamily: 'var(--font-mono, monospace)' }}>
                  $6.096.340
                </div>
                <div style={{ fontSize: '0.72rem', color: '#1e40af' }}>4 especialistas activos</div>
              </div>

              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '14px', padding: '1.25rem' }}>
                <div style={{ fontSize: '0.74rem', color: '#92400e', fontWeight: 700 }}>Retención SII (13.75%)</div>
                <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#92400e', margin: '0.3rem 0', fontFamily: 'var(--font-mono, monospace)' }}>
                  $972.160
                </div>
                <div style={{ fontSize: '0.72rem', color: '#92400e' }}>Aporte para F29 tributario</div>
              </div>
            </div>

            {/* Tabla Detallada por Especialista */}
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Desglose de Liquidación por Especialista
                </h3>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Ahorro estimado: <strong>~18.5 horas manuales de secretaria al mes</strong>
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>Profesional</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>Especialidad</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Citas</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>Bruto Generado</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>% Doctor</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>Honorario Bruto</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700 }}>Retención 13.75%</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#0284c7', fontWeight: 800 }}>Líquido a Pago</th>
                      <th style={{ padding: '0.75rem 1rem', color: '#64748b', fontWeight: 700, textAlign: 'center' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        Dra. Marcela Valenzuela
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>RUT 14.890.312-4</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>Psiquiatría Adultos</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>42</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>$2.100.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0284c7', fontWeight: 700 }}>70%</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)' }}>$1.470.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#92400e', fontFamily: 'var(--font-mono, monospace)' }}>-$202.125</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.88rem' }}>
                        $1.267.875
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>
                          Listo p/ Transferir
                        </span>
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        Ps. Roberto Fuentes
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>RUT 16.423.891-2</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>Psicología Clínica</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>58</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>$2.030.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0284c7', fontWeight: 700 }}>60%</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)' }}>$1.218.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#92400e', fontFamily: 'var(--font-mono, monospace)' }}>-$167.475</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.88rem' }}>
                        $1.050.525
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>
                          Listo p/ Transferir
                        </span>
                      </td>
                    </tr>

                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        Dr. Andrés Ibáñez
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>RUT 15.112.443-8</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>Medicina General</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>84</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>$2.520.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0284c7', fontWeight: 700 }}>65%</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)' }}>$1.638.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#92400e', fontFamily: 'var(--font-mono, monospace)' }}>-$225.225</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.88rem' }}>
                        $1.412.775
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>
                          Listo p/ Transferir
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: '#0f172a' }}>
                        Dra. Camila Soto
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>RUT 17.589.201-K</div>
                      </td>
                      <td style={{ padding: '0.85rem 1rem', color: '#334155' }}>Dermatología & Estética</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center', fontWeight: 700 }}>65</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)', fontWeight: 600 }}>$3.250.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#0284c7', fontWeight: 700 }}>70%</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono, monospace)' }}>$2.275.000</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#92400e', fontFamily: 'var(--font-mono, monospace)' }}>-$312.812</td>
                      <td style={{ padding: '0.85rem 1rem', color: '#059669', fontWeight: 800, fontFamily: 'var(--font-mono, monospace)', fontSize: '0.88rem' }}>
                        $1.962.188
                      </td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.5rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700 }}>
                          Listo p/ Transferir
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'patients' || activeTab === 'inventory' || activeTab === 'audit') && (
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '14px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#f1f5f9',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              marginBottom: '1rem',
            }}>
              {activeTab === 'patients' ? '👥' : activeTab === 'inventory' ? '📦' : '📜'}
            </div>

            <h3 style={{ color: '#0f172a', fontSize: '1.15rem', fontWeight: 700, margin: '0 0 0.4rem 0' }}>
              {activeTab === 'patients' ? 'Gestión de Fichas de Pacientes' :
               activeTab === 'inventory' ? 'Control de Farmacia e Insumos' : 'Trazabilidad y Auditoría Inmutable'}
            </h3>

            <p style={{ color: '#64748b', fontSize: '0.84rem', maxWidth: '440px', margin: '0 auto 1.5rem', lineHeight: '1.5' }}>
              Módulo conectado a Supabase con políticas RLS activas. Para interactuar con los datos clínicos en tiempo real, puedes acceder a la Workstation.
            </p>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.4rem',
                background: 'var(--brand-indigo, #0f172a)',
                borderRadius: '10px',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
              }}
            >
              Ir a la Estación de Trabajo Clínica
              <ArrowRight size={16} />
            </a>
          </div>
        )}
      </main>
    </div>
  );
}
