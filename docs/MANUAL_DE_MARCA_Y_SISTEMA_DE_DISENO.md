# 📘 Manual de Marca y Sistema de Diseño Clínico — Clinicafy
### Marco: *Constitución Editorial de Mercenario + Apple Human Interface Guidelines (HIG)*

---

## 1. Misión, Tesis y Filosofía Visual

### 1.1 ¿Qué es Clinicafy?
Clinicafy es la infraestructura operativa y clínica de alta fidelidad para policlínicos, centros médicos y redes de salud mental en Chile. No es un ERP administrativo común ni una planilla digitalizada; es un **sistema operativo clínico de grado médico**.

### 1.2 Regla de Oro (Heredada de Mercenario)
> **"Cada pantalla debe ser un documental operativo de grado médico: sobrio, impecable y con cero ruido visual."**

### 1.3 Principio *Stark White Canvas*
Toda la interfaz se fundamenta en la claridad extrema:
* **Lienzo Claro Dominante**: Fondos limpios, espacios respirables y contraste tipográfico deliberado.
* **Prohibición de Temas Oscuros en Pantallas Principales**: Las pantallas de atención, portales de pacientes, login y paneles de control se conciben en lienzo claro de alta visibilidad médica (`#f8fafc` / `#ffffff`).
* **Micro-retícula Técnica de 24px**: Un fondo con micropuntos sutiles que aportan textura de precisión quirúrgica sin distraer la lectura diagnóstica:
  ```css
  background-color: #f8fafc;
  background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
  background-size: 24px 24px;
  ```

---

## 2. Identidad de Marca y Uso de Logotipos

Los archivos canónicos residen en la carpeta `/public` del proyecto Clinicafy:

| Activo | Archivo | Cuándo Usar | Cuándo NUNCA Usar |
|---|---|---|---|
| **Isotipo Oficial** | `/Isotipo-Clinicafy.webp` | Icono en cabeceras, favicons, avatar de marca, aplicaciones móviles. Siempre dentro de un contenedor blanco con radio `10px–14px` y borde `1px solid #e2e8f0`. | Nunca estirar ni colocar directamente sobre fondos de color saturado sin su contenedor. |
| **Logotipo Navy (Principal)** | `/Logotipo-Clinicafy.webp` | **Siempre en toda la plataforma.** Diseñado con alto contraste para fondos claros (`#f8fafc`, `#ffffff`). | Nunca reemplazar por versiones oscuras en el lienzo claro. |
| **Logotipo Blanco (Restringido)** | `/Logotipo-Clinicafy-white.webp` | Únicamente en modales oscuros expresamente requeridos o materiales de marketing exterior nocturno. | **Prohibido** en pantallas estándar del sistema (Login, Workstation, Portal, Dashboard). |

---

## 3. Tokens Fundamentales del Sistema (`src/app/globals.css`)

El maquetador debe utilizar exclusivamente las variables CSS del sistema:

### 3.1 Paleta de Superficies y Bordes
```css
:root {
  --bg-primary: #f8fafc;       /* Fondo base de página (Slate 50) */
  --bg-secondary: #f1f5f9;     /* Fondo de contenedores secundarios (Slate 100) */
  --bg-card: #ffffff;          /* Tarjetas y paneles principales */
  --border-subtle: #e2e8f0;    /* Separadores de tarjetas y tablas (Slate 200) */
  --border-accent: #cbd5e1;    /* Bordes de inputs y botones secundarios (Slate 300) */
}
```

### 3.2 Paleta Cromática Funcional (Apple Health HIG)
Los colores comunican estado, no adorno:

| Token | Valor Hex | Significado Clínico | Ejemplo de Aplicación |
|---|---|---|---|
| `--brand-indigo` | `#0f172a` | **Mando y Acción Primaria** | Botón de confirmar atención, firma FEA, tabs activas. |
| `--brand-teal` | `#0284c7` | **Acento Interactivo & Enlaces** | Links, botones de telemedicina, focus states. |
| `--status-success` | `#059669` | **Éxito / Aprobado / Biometría OK** | Bono I-Med autorizado, receta firmada, ficha guardada. |
| `--status-warning` | `#d97706` | **Advertencia / Retención** | Receta médica retenida, stock bajo, pago pendiente. |
| `--status-danger` | `#dc2626` | **Peligro / Alergias Severas** | Alergia a fármaco, contraindicación, error crítico. |

---

## 4. Dualidad Tipográfica Obligatoria

Toda pantalla combina exactamente dos fuentes tipográficas:

### 4.1 Tipografía Humana: `Plus Jakarta Sans` (`var(--font-main)`)
* **Uso**: Títulos, etiquetas, navegación, cuerpo de texto y descripciones clínicas.
* **Pesos**:
  * `400` (Regular): Textos descriptivos.
  * `500` / `600` (Medium/Semibold): Labels de formularios y badges.
  * `700` / `800` (Bold/Extrabold): Encabezados de sección y métricas principales.

### 4.2 Tipografía Técnica de Precisión: `JetBrains Mono` (`var(--font-mono)`)
* **Uso OBLIGATORIO en**:
  * RUT chileno (`18.432.890-K`).
  * Códigos de diagnóstico CIE-10 y DSM-5-TR (`F32.1`, `F41.1`).
  * Hashes criptográficos de Firma Electrónica Avanzada (`FEA-SHA256`).
  * Horas de cita y tiempos de espera (`09:30`, `14:00`).
  * Montos de copago y valores monetarios (`$45.000 CLP`).
  * Folios de bonos I-Med (`IMED-89421092`).

---

## 5. Anatomía Estructural de Pantallas

Cualquier pantalla nueva creada por el maquetador debe pertenecer a uno de los 4 arquetipos:

### Arquetipo 1: Workstation Clínica (Consola Multimodal)
* **Archivo de Referencia**: [`src/app/page.tsx`](file:///c:/Users/ADMIN/Downloads/IA%20trabajaos/Clinicafy/src/app/page.tsx)
* **Estructura**:
  1. **Top Bar (`glass-panel`)**: Logo dual + Selector de Sede + Badge multi-tenant + Reloj/Estado en vivo.
  2. **Grid de 3 Columnas**:
     * *Columna Izquierda (320px)*: Identificación de paciente, telemetría IoT Box, antecedentes y alergias críticas.
     * *Columna Central (Flexible)*: Ambient Scribe IA (Zero Retention), resumen SOAP/DAP y catálogo CIE-10.
     * *Columna Derecha (360px)*: Prescripción FEA con QR de dispensación, cálculo de copago I-Med y trazabilidad.

### Arquetipo 2: Portales de Autoservicio y Checkout
* **Archivo de Referencia**: [`src/app/portal/page.tsx`](file:///c:/Users/ADMIN/Downloads/IA%20trabajaos/Clinicafy/src/app/portal/page.tsx)
* **Estructura**:
  1. **Cabecera Institucional**: Logo, subtítulo de sede y botón sutil de retorno.
  2. **Contenedor Flotante (`max-w-[720px]`)**: Fondo `#ffffff`, borde `1px solid #e2e8f0`, radio de 16px.
  3. **Stepper Segmentado Superior**: Píldoras de avance (Especialidad → Pre-ingreso → Consentimiento → Pago).
  4. **Zona de Contenido con Espaciado Generoso** (`gap: 1.25rem`).

### Arquetipo 3: Dashboard Administrativo (Split View)
* **Archivo de Referencia**: [`src/app/dashboard/page.tsx`](file:///c:/Users/ADMIN/Downloads/IA%20trabajaos/Clinicafy/src/app/dashboard/page.tsx)
* **Estructura**:
  1. **Sidebar Fijo (240px)**: Fondo `#ffffff`, navegación vertical sobria, reloj activo al pie.
  2. **Área Principal con Micro-retícula**:
     * Barra de estado superior con botón de sincronización.
     * Grilla de KPIs de 4 columnas (cards blancas con números grandes y badges de tendencia).
     * Tabla de datos clínicos con cabecera en mayúsculas tenues (`#64748b`) y estados en badges pastel.

### Arquetipo 4: Autenticación y Acceso Seguro
* **Archivo de Referencia**: [`src/app/login/page.tsx`](file:///c:/Users/ADMIN/Downloads/IA%20trabajaos/Clinicafy/src/app/login/page.tsx)
* **Estructura**:
  1. Centrado óptico en pantalla completa con micro-retícula visible.
  2. Tarjeta `#ffffff` de 420px de ancho con esquinas redondeadas a 16px.
  3. Insignia inferior con mención regulatoria a la Ley 20.584 y cifrado TLS 1.3.

---

## 6. Biblioteca Canónica de Componentes (Snippets para Copiar y Pegar)

### 6.1 Tarjetas (`Cards`)
```html
<!-- Tarjeta Estándar Apple HIG -->
<div class="glass-panel" style="padding: 1.5rem; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
  <h3 style="font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.5rem;">Título de Sección</h3>
  <p style="font-size: 0.85rem; color: #64748b;">Contenido descriptivo clínico...</p>
</div>
```

### 6.2 Botones Canónicos
```html
<!-- 1. Botón Primario (Slate Black) -->
<button style="padding: 0.75rem 1.4rem; background: #0f172a; color: #ffffff; border: none; border-radius: 10px; font-weight: 700; font-size: 0.88rem; cursor: pointer; display: inline-flex; alignItems: center; gap: 0.5rem; box-shadow: 0 2px 6px rgba(15,23,42,0.12);">
  Confirmar Atención
</button>

<!-- 2. Botón Secundario (Borde Sutil) -->
<button style="padding: 0.65rem 1.1rem; background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
  Cancelar
</button>

<!-- 3. Botón Acento Interactivo (Sky Blue) -->
<button style="padding: 0.65rem 1.2rem; background: #0284c7; color: #ffffff; border: none; border-radius: 10px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">
  Iniciar Telemedicina
</button>
```

### 6.3 Badges Semánticos de Estado
```html
<!-- Confirmado / Éxito -->
<span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0;">
  ● Confirmada
</span>

<!-- En Curso / Telemedicina -->
<span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #eff6ff; color: #0284c7; border: 1px solid #bfdbfe;">
  ● En Curso
</span>

<!-- Advertencia / Pendiente / Receta Retenida -->
<span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #fffbeb; color: #d97706; border: 1px solid #fde68a;">
  ▲ Receta Retenida
</span>

<!-- Peligro / Alergia Severa -->
<span style="display: inline-flex; align-items: center; gap: 0.3rem; padding: 0.22rem 0.65rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;">
  ✕ Alergia Crítica
</span>
```

### 6.4 Inputs de Formulario
```html
<div style="display: flex; flex-direction: column; gap: 0.4rem;">
  <label style="font-size: 0.78rem; font-weight: 600; color: #0f172a; letter-spacing: 0.01em;">
    RUT del Paciente
  </label>
  <input 
    type="text" 
    placeholder="12.345.678-K" 
    style="padding: 0.65rem 0.85rem; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; color: #0f172a; font-size: 0.88rem; outline: none; font-family: var(--font-mono);" 
  />
</div>
```

---

## 7. Principios Editoriales y Regulatorios Chilenos

Todo texto redactado en la interfaz debe ceñirse a las siguientes normas:

1. **Ley N° 20.584 (Derechos y Deberes)**: Mencionar siempre la confidencialidad de la ficha y la inmutabilidad de los registros.
2. **Ley N° 19.799 (Firma Electrónica)**: Denominar las recetas como *"Receta Médica Electrónica con Firma Avanzada (FEA)"*. Exponer visiblemente el hash y el código de verificación del ISP.
3. **Privacidad de Audio Zero Retention**: Indicar explícitamente al médico y paciente: *"El audio de la consulta no se graba en disco persistente; se procesa en memoria volátil y se destruye inmediatamente tras estructurar la nota clínica."*
4. **Convenios de Salud**: Utilizar la nomenclatura oficial chilena: **Fonasa (Tramos A, B, C, D)** e **Isapres (Colmena, Banmédica, Consalud, CruzBlanca, etc.)**.

---

## 8. El Decálogo del Maquetador: Lo que NUNCA se debe hacer

* 🚫 **NUNCA usar fondos oscuros generales** (`#090d16`, `#0f172a`) para páginas completas.
* 🚫 **NUNCA usar degradados multicolor estridentes** (neón, violeta-cyan, estética cripto/web3).
* 🚫 **NUNCA usar fuentes genéricas** (`Arial`, `Times New Roman`, etc.). Siempre invocar `var(--font-main)` o `var(--font-mono)`.
* 🚫 **NUNCA mostrar precios, horas o RUTs en fuente proporcional.** Utilizar siempre `var(--font-mono)` para alineación numérica tabular.
* 🚫 **NUNCA usar sombras negras densas ni bordes con resplandor neón (*glow*).**
* 🚫 **NUNCA colocar botones sin hover o con cambios bruscos de tamaño.**
* 🚫 **NUNCA alterar las proporciones del Logotipo o Isotipo oficial.**

---

**Clinicafy Cloud Architecture & Design Team**
*Documento de Referencia Oficial para Nuevas Pantallas, Sprints y Módulos Enterprise.*
