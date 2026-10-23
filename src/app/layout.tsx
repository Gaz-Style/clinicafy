import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clinicafy - Sistema Operativo y SaaS B2B para Clínicas y Salud Mental',
  description:
    'Ecosistema clínico multi-tenant de alta concurrencia con Ficha Clínica IA (Ambient Scribe), Receta Médica FEA, ERP I-Med/Medipass, Interoperabilidad FHIR R4 e IoT biométrico.',
  keywords: [
    'SaaS Salud Mental',
    'Ficha Clínica Electrónica',
    'Ambient Scribe IA',
    'Receta Médica Electrónica FEA',
    'I-Med Bonos',
    'FHIR R4 Chile',
    'Ley 20.584',
  ],
  authors: [{ name: 'Clinicafy Cloud Architecture Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
