'use client';

import React, { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, AlertTriangle, ArrowRight, Stethoscope, LayoutDashboard, Users } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'doctor' | 'director' | 'admin'>('doctor');

  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(
        authError.message === 'Invalid login credentials'
          ? 'Email o contraseña incorrectos'
          : authError.message
      );
      setLoading(false);
      return;
    }

    // Redirect handled by middleware after session is established
    window.location.href = '/';
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('clinicafy2026');
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        backgroundImage: 'radial-gradient(#e2e8f0 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        fontFamily: 'var(--font-main, "Plus Jakarta Sans", system-ui, sans-serif)',
      }}
    >
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', zIndex: 1 }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid var(--border-subtle, #e2e8f0)',
              boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
              marginBottom: '1rem',
              padding: '6px',
            }}
          >
            <img
              src="/Isotipo-Clinicafy.webp"
              alt="Clinicafy Isotipo"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <img
              src="/Logotipo-Clinicafy.webp"
              alt="Clinicafy"
              style={{ height: '32px', width: 'auto', objectFit: 'contain', display: 'block' }}
            />
          </div>

          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
            Infraestructura Clínica Enterprise · Red de Salud Mental
          </p>
        </div>

        {/* Card */}
        <div
          className="glass-panel"
          style={{
            background: '#ffffff',
            border: '1px solid var(--border-subtle, #e2e8f0)',
            borderRadius: '16px',
            padding: '2rem',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
          }}
        >
          <div style={{ marginBottom: '1.5rem' }}>
            <h1
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--text-primary, #0f172a)',
                margin: '0 0 0.25rem 0',
                letterSpacing: '-0.02em',
              }}
            >
              Acceso a Workstation
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #64748b)', margin: 0 }}>
              Ingresa tus credenciales clínicas autorizadas
            </p>
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                color: '#991b1b',
                fontSize: '0.83rem',
                fontWeight: 500,
              }}
            >
              <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            {/* Email */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  marginBottom: '0.4rem',
                  letterSpacing: '0.01em',
                }}
              >
                Correo institucional
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="dra.valenzuela@clinicafy.com"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '0.85rem',
                    paddingTop: '0.65rem',
                    paddingBottom: '0.65rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-accent, #cbd5e1)',
                    borderRadius: '10px',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: 'var(--text-primary, #0f172a)',
                    letterSpacing: '0.01em',
                  }}
                >
                  Contraseña
                </label>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  color="#94a3b8"
                  style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)' }}
                />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  style={{
                    width: '100%',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.75rem',
                    paddingTop: '0.65rem',
                    paddingBottom: '0.65rem',
                    background: '#ffffff',
                    border: '1px solid var(--border-accent, #cbd5e1)',
                    borderRadius: '10px',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.85rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Quick Demo Fill Pills */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
                Acceso Rápido Demo
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleQuickFill('dra.valenzuela@clinicafy.com')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  🩺 Médico / Psiquiatra
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@clinicafy.com')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    color: '#0f172a',
                    cursor: 'pointer',
                  }}
                >
                  📊 Administrador
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.8rem',
                background: loading ? '#64748b' : 'var(--brand-indigo, #0f172a)',
                border: 'none',
                borderRadius: '10px',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '0.25rem',
                transition: 'background 0.15s, transform 0.1s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
              }}
            >
              {loading ? (
                'Verificando credenciales...'
              ) : (
                <>
                  Ingresar a la Estación Clínica
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Security notice */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '1.5rem',
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border-subtle, #e2e8f0)',
              color: 'var(--text-secondary, #64748b)',
              fontSize: '0.73rem',
            }}
          >
            <ShieldCheck size={16} color="var(--status-success, #059669)" style={{ flexShrink: 0 }} />
            <span>Cifrado TLS 1.3 · Sesión auditada bajo Ley 20.584</span>
          </div>
        </div>

        {/* Portal paciente link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '0.82rem', margin: 0 }}>
            ¿Eres paciente y buscas agendar hora?{' '}
            <a
              href="/portal"
              style={{
                color: 'var(--brand-teal, #0284c7)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Ir al Portal de Reservas →
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
