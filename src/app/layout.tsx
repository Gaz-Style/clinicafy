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
  icons: {
    icon: [
      { url: '/Isotipo-Clinicafy.webp', type: 'image/webp' },
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    shortcut: '/Isotipo-Clinicafy.webp',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
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
        <link rel="icon" type="image/webp" href="/Isotipo-Clinicafy.webp" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
