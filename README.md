<div align="center">

# TAPASEL FLOW AI

**Sistema Inteligente de Gestión Empresarial y Operacional para TAPASEL SAS — Medellín, Colombia**

</div>

---

## Descripción general

TAPASEL FLOW AI es una plataforma ERP empresarial diseñada para TAPASEL SAS. Centraliza la operación de la compañía (finanzas, talento humano, documentación, producción y logística) en una única aplicación web, con control de acceso por roles y un asistente de inteligencia artificial conectado a los datos del negocio.

La aplicación está construida como una SPA en React servida por un backend Express, que a su vez se apoya en **InsForge** (BaaS sobre PostgreSQL) para autenticación, base de datos y verificación de correo, y en **Google Gemini** para las capacidades de IA generativa.

La interfaz está completamente en español, soporta tema claro/oscuro y es responsive (escritorio y móvil).

---

## Stack tecnológico

### Frontend
- **React 19** + **TypeScript**
- **Vite 6** como bundler y servidor de desarrollo
- **Tailwind CSS v4** (`@tailwindcss/vite`) para estilos
- **lucide-react** para iconografía
- **recharts** para gráficas y visualización de datos
- **motion** para animaciones

### Backend
- **Express 4** (`server.ts`) sirviendo la API REST y el frontend
- **tsx** para ejecución en desarrollo y **esbuild** para el bundle de producción
- **pg** (cliente PostgreSQL) para accesos directos puntuales a la base de datos

### Servicios / plataforma
- **InsForge** (`@insforge/sdk`) — Backend as a Service sobre PostgreSQL: autenticación, base de datos, verificación de correo y restablecimiento de contraseña
- **Google Gemini** (`@google/genai`) — asistente de IA y análisis generativo (lado servidor)
- **dotenv** para gestión de variables de entorno

---

## Árbol del proyecto

```
Tapasel/
├── index.html                  # HTML raíz de la SPA
├── server.ts                   # Servidor Express: API REST + InsForge + Gemini + Vite middleware
├── vite.config.ts              # Configuración de Vite
├── tsconfig.json               # Configuración de TypeScript
├── package.json                # Dependencias y scripts
├── metadata.json               # Metadatos de la aplicación
├── insforge.toml               # Configuración del proyecto InsForge (auth, storage, etc.)
├── infor_database.sql          # Esquema y datos semilla de la base de datos
├── vitest.config.ts            # Configuración de pruebas unitarias (Vitest)
├── .env.local                  # Variables de entorno (claves Gemini e InsForge)
├── .insforge/
│   └── project.json            # Credenciales del proyecto InsForge (usadas por el CLI)
└── src/
    ├── main.tsx                # Punto de entrada de React
    ├── App.tsx                 # Orquestador: auth, navegación por permisos y estado global
    ├── index.css               # Estilos globales / Tailwind
    ├── types.ts                # Tipos e interfaces de dominio (Cliente, Transaccion, etc.)
    ├── mockData.ts             # Datos iniciales / semilla en el cliente
    ├── services/               # Capa de datos / acceso a APIs
    │   └── backendClient.ts    # Cliente único de auth y datos (Express + InsForge)
    ├── lib/                    # Capa de utilidades puras
    │   ├── formatters.ts       # Formato de moneda, números y fechas (centralizado)
    │   └── formatters.test.ts  # Pruebas unitarias de los formateadores
    └── components/             # Capa de interfaz de usuario
        ├── Sidebar.tsx         # Navegación lateral con menús por módulo
        ├── LoginScreen.tsx     # Inicio de sesión, registro y verificación de correo
        ├── DashboardTab.tsx    # Panel principal con KPIs y accesos rápidos
        ├── FinanzasTab.tsx     # Clientes, cartera, proveedores, cotizaciones, egresos
        ├── RRHHTab.tsx         # Empleados, nómina, horarios y novedades
        ├── DocumentosTab.tsx   # Gestión documental con versionado y OCR simulado
        ├── ProduccionTab.tsx   # Órdenes de producción y logística de envíos
        ├── ConfiguracionTab.tsx# Configuración, roles y umbrales
        ├── AiAssistant.tsx     # Asistente de IA conversacional (drawer)
        ├── CommandCenter.tsx   # Búsqueda global y acciones rápidas (Ctrl+K)
        └── TapaselLogo.tsx     # Logotipo de la marca
```

---

## Funcionalidades

### Autenticación y seguridad
- Inicio de sesión, registro y verificación de correo vía InsForge.
- Restablecimiento de contraseña por enlace/código.
- Control de acceso basado en roles: **ADMIN**, **CFO**, **RRHH**, **COO**, cada uno con permisos de módulos definidos.
- La API valida el rol del usuario (cabecera `x-user-role`) en los endpoints de datos.

### Panel principal (Dashboard)
- KPIs ejecutivos (eficiencia, aprobaciones, indicadores financieros).
- Accesos rápidos contextuales según los permisos del usuario.
- Gráficas de evolución con recharts.

### Finanzas
- Gestión de **clientes** y estado de cartera (al día / mora / inactivo).
- **Cartera**: seguimiento de facturas, abonos y cancelaciones.
- **Proveedores**: registro de facturas, IVA, retención y comprobantes de egreso.
- **Cotizaciones**: generación con ítems, subtotales, IVA y firma digital de representante y cliente.
- Registro de **recibos de caja** y **egresos**, con asientos automáticos.

### Recursos Humanos (RR.HH.)
- Control de **empleados**: alta, datos de contacto, área y estado.
- **Nómina**, control de horarios, asistencia del día y novedades.
- Seguimiento de documentos vencidos por colaborador.

### Documentos
- Gestión documental con **versionado** e historial de cambios.
- Estados de verificación y tipificación documental.
- Flujo de **escaneo OCR simulado** para radicación automática.

### Producción y logística
- **Órdenes de producción** con estados (Diseño, Ensamble, Soldadura, Calidad, Despacho), prioridad y eficiencia estimada.
- Seguimiento **logístico de envíos** (transportadora, guía, origen/destino, estado y costo).

### Asistente de IA
- Chat conversacional impulsado por Google Gemini, conectado al estado de los datos del negocio.
- Consultas predefinidas (cartera, ausentismo, flujo de caja, documentos faltantes, cuellos de botella).
- Respuesta simulada de respaldo cuando no hay clave de Gemini configurada.

### Productividad
- **Command Center** (Ctrl/Cmd + K): búsqueda global y navegación rápida entre módulos y acciones.
- **Tema claro/oscuro** con persistencia en `localStorage`.
- **Registro de auditoría** (audit logs) generado por las acciones de los agentes.

---

## API REST (backend)

El servidor Express (`server.ts`) expone, entre otros:

| Área | Endpoints |
|------|-----------|
| Auth | `POST /api/auth/register`, `/login`, `/verify`, `/resend`, `/forgot-password`, `/reset-password` |
| Usuarios | `GET /api/usuarios/:id` |
| Clientes | `GET` / `POST /api/clientes` |
| Transacciones | `GET` / `POST /api/transacciones`, `PUT /api/transacciones/:id` |
| Cartera | `GET` / `POST /api/cartera`, `PUT /api/cartera/:id` |
| Proveedores | `GET` / `POST /api/proveedores`, `PUT /api/proveedores/:id` |
| Cotizaciones | `GET` / `POST /api/cotizaciones`, `PUT` / `DELETE /api/cotizaciones/:id` |
| Empleados | `GET` / `POST /api/empleados` |
| Documentos | `GET` / `POST /api/documentos`, `PUT` / `DELETE /api/documentos/:id` |
| Órdenes de producción | `GET` / `POST /api/ordenes_produccion`, `PUT /api/ordenes_produccion/:id` |
| Alertas | `GET /api/alertas`, `DELETE /api/alertas/:id` |
| Audit logs | `GET` / `POST /api/audit_logs` |
| Configuraciones | `GET` / `POST /api/configuraciones/:id` |
| Asistente IA | `POST /api/assistant` |

---

## Ejecución local

**Requisitos previos:** Node.js (18+)

1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Configurar las variables de entorno en [.env.local](.env.local):
   ```
   GEMINI_API_KEY="tu_clave_de_gemini"
   APP_URL="http://localhost:3000"
   INSFORGE_PROJECT_URL="https://<tu-proyecto>.insforge.app"
   INSFORGE_API_KEY="<tu_api_key>"
   ```
3. Levantar la aplicación (frontend + API en el puerto **3000**):
   ```bash
   npm run dev
   ```
   La app queda disponible en `http://localhost:3000`.

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Express + Vite) en el puerto 3000 |
| `npm run build` | Compila el frontend (Vite) y empaqueta el servidor (esbuild) en `dist/` |
| `npm run start` | Ejecuta el build de producción (`dist/server.cjs`) |
| `npm run lint` | Verificación de tipos con `tsc --noEmit` |
| `npm run test` | Ejecuta las pruebas unitarias una vez (Vitest) |
| `npm run test:watch` | Ejecuta las pruebas en modo observador |

---

## Arquitectura por capas

El proyecto separa físicamente las tres capas para facilitar el mantenimiento:

- **Capa de datos / servicios** (`src/services/`): `backendClient.ts` es el único punto de comunicación con el backend (Express + InsForge). Ningún componente habla directamente con HTTP.
- **Capa de utilidades / lógica** (`src/lib/`): funciones puras y reutilizables, como los formateadores de `formatters.ts`. Sin estado ni efectos secundarios, y cubiertas por pruebas unitarias.
- **Capa de interfaz** (`src/components/`): componentes React que consumen las capas anteriores y se encargan solo de la presentación e interacción.

---

## Glosario de funciones principales

### Capa de utilidades — `src/lib/formatters.ts`
| Función | Propósito |
|---------|-----------|
| `formatCurrencyCOP(monto)` | Da formato de moneda colombiana (COP) a un número; normaliza valores inválidos a `$ 0`. |
| `formatNumberCO(valor)` | Aplica separadores de miles sin símbolo de moneda. |
| `formatDateLongSpanish(fechaIso)` | Convierte una fecha `YYYY-MM-DD` a texto largo en español. |

### Capa de servicios — `src/services/backendClient.ts`
| Función | Propósito |
|---------|-----------|
| `signInWithEmailAndPassword(...)` | Autentica al usuario contra el backend; cae a datos mock ante fallo de red. |
| `verifyEmailCode(email, code)` | Verifica el código de confirmación de correo. |
| `resendVerificationCode(email)` | Reenvía el código de verificación de correo. |
| `sendPasswordResetEmail(email)` | Solicita el enlace/código de restablecimiento de contraseña. |
| `confirmPasswordReset(token, password)` | Confirma el restablecimiento de contraseña. |
| `getDoc(docRef)` | Obtiene un perfil de usuario o configuración (con respaldo local). |
| `setDoc(docRef, data)` | Registra un usuario o persiste una configuración. |
| `handleFirestoreError(error, op, path)` | Normaliza y registra errores de la capa de datos. |

### Orquestador — `src/App.tsx`
| Función | Propósito |
|---------|-----------|
| `appendLog(agente, detalle, nivel)` | Agrega una entrada al registro de auditoría en memoria. |
| `handleAddReceipt(e)` | Registra un nuevo recibo de caja (ingreso). |
| `handleAddExpenditure(e)` | Registra un nuevo egreso corporativo. |
| `handleAddEmployee(e)` | Da de alta un nuevo colaborador. |
| `handleAddDocument(e)` | Radica un documento mediante el flujo de OCR simulado. |
| `handleResolveAlerta(alertaId)` | Ejecuta el flujo de resolución autónoma de una alerta. |

> Los formateadores de la UI (`formatCurrency`) que antes se duplicaban en
> `FinanzasTab`, `RRHHTab` y `ProduccionTab` ahora se importan desde
> `src/lib/formatters.ts` para evitar duplicación.

---

## Pruebas

Las pruebas unitarias usan **Vitest** y validan las funciones puras de la capa de utilidades:

```bash
npm run test        # ejecución única
npm run test:watch  # modo observador
```

Los archivos de prueba siguen el patrón `*.test.ts` junto al código que validan
(p. ej. `src/lib/formatters.test.ts`).

---

## Control de versiones (Git)

El repositorio usa Git como respaldo y trazabilidad del progreso:

- Realiza *commits* pequeños y descriptivos por cada cambio funcional (checkpoints).
- Trabaja cambios significativos en ramas dedicadas y evita confirmar directo a `main`.
- El archivo `.gitignore` excluye `node_modules/`, `dist/` y archivos de entorno
  sensibles (`.env.local`).

---

## Notas

- Las claves de Gemini e InsForge se leen desde `.env.local`; nunca deben subirse al control de versiones.
- El servidor escucha en `0.0.0.0:3000`. Para limitar el acceso solo a la máquina local, cámbialo a `127.0.0.1`.
