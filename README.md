# Clinicafy (SaaS B2B Multi-Tenant para Redes Clínicas y Salud Mental)

Clinicafy es la plataforma de infraestructura clínica y operativa diseñada para gestionar redes de salud ambulatoria y salud mental con alta concurrencia, seguridad estricta y flujos en tiempo real.

---

## 🌟 Módulos Implementados

1. **Ficha Clínica y Copiloto IA (Ambient Scribe):**
   - Transcripción y estructuración en tiempo real bajo formatos **SOAP** (Médico) y **DAP** (Salud Mental).
   - Sugerencia de códigos diagnósticos **CIE-10** y **DSM-5-TR** con scores de confianza.
   - **Garantía Zero Audio Retention:** El audio se procesa en memoria volátil RAM y es destruido de forma criptográfica inmediatamente después de generar la nota.
2. **Receta Médica Electrónica con Firma Avanzada (FEA):**
   - Emisión de recetas simples y retenidas con control de psicotrópicos.
   - Generación de firma digital avanzada PKCS#7 / SHA-256 (e-Cert / Acepta / FirmaGob).
   - Código QR dinámico con token de validación y simulador de dispensación farmacéutica (bloqueo automático contra recetas duplicadas).
3. **ERP Operativo, I-Med / Medipass e Inventario en Box:**
   - Cálculo en milisegundos de bonos electrónicos (Fonasa Tramos A-D e Isapres: Colmena, Banmédica, Consalud, CruzBlanca).
   - Descuento automático de insumos en box médico con alertas push de quiebre de stock.
4. **IoT Biometría Edge-to-Cloud:**
   - Monitor de signos vitales en vivo vía MQTT / WebSockets (Frecuencia Cardíaca, Variabilidad VFC, Presión Arterial, SpO2 y Estrés Autonómico).
   - Inyección en un clic directo en la sección *Objetivo* de la ficha médica.
5. **Motor E-commerce y Onboarding Autónomo:**
   - Portal white-label para pacientes con agendamiento, formulario clínico de pre-ingreso, firma digital de consentimiento informado (Ley 20.584) y recaudación previa (Fintoc / MercadoPago).
6. **Seguridad Zero-Trust y Auditoría Inmutable:**
   - Base de datos Supabase con Row Level Security (RLS) estricto por `tenant_id`.
   - Ledger de auditoría inmutable protegido por triggers en PostgreSQL que impiden modificaciones o eliminaciones.
7. **Interoperabilidad FHIR R4 & HL7:**
   - Exportación nativa de recursos `Encounter`, `Patient`, `Condition` y `MedicationRequest`.

---

## 🚀 Puesta en Marcha Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev

# 3. Compilación de producción
npm run build
npm run start
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

---

## 🗄️ Esquema de Base de Datos y RLS

Las migraciones de PostgreSQL / Supabase se encuentran en:
- `supabase/migrations/20261023_001_core_multi_tenant.sql`

Incluye las tablas de Tenants, Sucursales, Usuarios Clínicos con MFA, Pacientes, Encuentros SOAP/DAP, Recetas FEA, Inventario, Auditoría Inmutable y Políticas RLS.
