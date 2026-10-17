<div align="center">

# TAPASEL FLOW AI

**Sistema Inteligente de Gestión Empresarial y Operacional para TAPASEL SAS — Medellín, Colombia**

</div>

---

## Descripción general

TAPASEL FLOW AI es una plataforma ERP empresarial diseñada para TAPASEL SAS. Centraliza la operación de la compañía (finanzas, talento humano, documentación, producción y logística) en una única aplicación web, con control de acceso por roles y un asistente de inteligencia artificial conectado a los datos del negocio.

La aplicación es una SPA en React servida por un único servidor Node (Express). Se apoya en **InsForge** (BaaS sobre PostgreSQL) para autenticación, base de datos y almacenamiento de archivos, y en **Google Gemini** para la IA generativa. El backend es InsForge, no Supabase.

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

### Servicios / plataforma
- **InsForge** (`@insforge/sdk`) — Backend as a Service sobre PostgreSQL: autenticación, base de datos, almacenamiento (bucket privado) y verificación de correo
- **Google Gemini** (`@google/genai`) — asistente de IA y análisis generativo (lado servidor)
- **dotenv** para gestión de variables de entorno

---

## Árbol del proyecto

```
Tapasel/
├── index.html                  # HTML raíz de la SPA
├── server.ts                   # Servidor Express: API REST + InsForge + Gemini + Vite (solo en desarrollo)
├── server/
│   ├── auth.ts                 # Verificación de sesión y rol en el servidor, mapa rol → permisos
│   └── assistantContext.ts     # Extracto mínimo de datos que se envía a Gemini
├── vite.config.ts              # Configuración de Vite
├── tsconfig.json               # Configuración de TypeScript
├── package.json                # Dependencias y scripts
├── Dockerfile / .dockerignore  # Imagen de producción (servidor Node único)
├── insforge.toml               # Configuración del proyecto InsForge (auth, storage, etc.)
├── infor_database.sql          # Esquema y datos semilla de la base de datos
├── migrations/                 # Cambios de seguridad a aplicar sobre la base de datos
├── .env.example                # Plantilla de variables de entorno (copiar a .env.local)
├── .github/workflows/ci.yml    # CI: tipos, pruebas, build y auditoría de dependencias
├── vitest.config.ts            # Configuración de pruebas unitarias (Vitest)
└── src/
    ├── main.tsx                # Punto de entrada de React
    ├── App.tsx                 # Orquestador: auth, navegación por permisos y estado global
    ├── types.ts                # Tipos e interfaces de dominio
    ├── mockData.ts             # Datos iniciales / semilla en el cliente
    ├── services/
    │   └── backendClient.ts    # Cliente único de auth y datos (InsForge directo + API del servidor)
    ├── lib/
    │   ├── formatters.ts       # Formato de moneda, números y fechas
    │   ├── attemptLimiter.ts   # Freno progresivo de intentos (login, verificación, reenvíos)
    │   └── passwordPolicy.ts   # Largo mínimo de contraseña
    └── components/             # Interfaz: Sidebar, LoginScreen, Dashboard, Finanzas, RRHH,
                                # Documentos, Producción, Configuración, UserApprovals,
                                # AiAssistant, CommandCenter, TapaselLogo
```

---

## Funcionalidades

### Autenticación y seguridad
- Inicio de sesión, registro, verificación de correo y restablecimiento de contraseña vía InsForge (el navegador habla directo con InsForge). Contraseña mínima: 10 caracteres.
- **Roles:** ADMIN, CFO, RRHH y COO, cada uno con permisos de módulos fijos (`server/auth.ts`). Las cuentas nuevas nacen como **PENDIENTE** (solo ven el panel) hasta que un ADMIN las aprueba en *Configuración → Aprobación de usuarios*.
- **El servidor es la autoridad:** toda la API exige un token de sesión de InsForge válido y lee el rol de la tabla `usuarios`; no confía en nada que declare el cliente. Un usuario sin perfil aprobado recibe 401.
- El proxy genérico `/api/db/*` solo opera sobre tablas conocidas y con roles autorizados por tabla.
- Documentos: bucket privado; el archivo se descarga por `GET /api/documentos/:id/archivo` con sesión y rol.
- El asistente de IA exige sesión, limita tamaño y frecuencia (20/min por usuario) y solo recibe un extracto mínimo de datos elegido por el servidor según el rol.
- El freno de intentos del login (`attemptLimiter`) solo protege el navegador. **La protección real contra fuerza bruta debe configurarse en InsForge.**

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

Todas las rutas bajo `/api` exigen `Authorization: Bearer <token de sesión InsForge>` y un rol válido. `GET /healthz` es público (comprobación de salud).

| Área | Endpoints |
|------|-----------|
| Usuarios | `GET /api/usuarios` y `PUT /api/usuarios/:id/rol` (solo ADMIN); `GET /api/usuarios/:id` (propio o ADMIN) |
| Clientes | `GET` / `POST /api/clientes` |
| Transacciones | `GET` / `POST /api/transacciones`, `PUT /api/transacciones/:id` |
| Cartera | `GET` / `POST /api/cartera`, `PUT /api/cartera/:id` |
| Proveedores | `GET` / `POST /api/proveedores`, `PUT /api/proveedores/:id` |
| Cotizaciones | `GET` / `POST /api/cotizaciones`, `PUT` / `DELETE /api/cotizaciones/:id` |
| Empleados | `GET` / `POST /api/empleados` |
| Documentos | `GET` / `POST /api/documentos`, `PUT` / `DELETE /api/documentos/:id`, `GET /api/documentos/:id/archivo` |
| Órdenes de producción | `GET` / `POST /api/ordenes_produccion`, `PUT /api/ordenes_produccion/:id` |
| Alertas | `GET /api/alertas`, `DELETE /api/alertas/:id` |
| Audit logs | `GET` / `POST /api/audit_logs` |
| Configuraciones | `GET` / `POST /api/configuraciones/:id` |
| Proxy genérico | `POST /api/db/:table`, `PUT` / `DELETE /api/db/:table/:id` (tablas y roles permitidos en `server.ts`) |
| Asistente IA | `POST /api/assistant` |

---

---

## Ejecución local

**Requisitos previos:** Node.js 22 (o 20+).

1. Instalar dependencias: `npm install`
2. Copiar `.env.example` a `.env.local` y completar `INSFORGE_API_KEY` (clave de **administrador**, solo servidor) y, opcionalmente, `GEMINI_API_KEY` (sin ella el asistente responde de forma simulada). Si falta `INSFORGE_API_KEY`, el servidor no arranca.
3. Levantar la aplicación (frontend + API, puerto **3000**): `npm run dev`

### Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor de desarrollo (Express + Vite) en el puerto 3000 |
| `npm run build` | Compila el frontend (Vite) y empaqueta el servidor (esbuild, ESM) en `dist/` |
| `npm run start` | Ejecuta el build de producción (`dist/server.mjs`) |
| `npm run lint` | Verificación de tipos con `tsc --noEmit` |
| `npm run test` | Ejecuta las pruebas unitarias una vez (Vitest) |
| `npm run test:watch` | Ejecuta las pruebas en modo observador |

---

## Arquitectura por capas

El proyecto separa físicamente las tres capas para facilitar el mantenimiento:

- **Capa de datos / servicios** (`src/services/`): `backendClient.ts` es el único punto de comunicación con el backend (InsForge directo para sesión y archivos, API del servidor para datos protegidos). Ningún componente habla directamente con HTTP.
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

## Despliegue

**Destino único: un servidor Node** (Render, Railway, Fly.io, un VPS, etc.). La app necesita el servidor para guardar, editar y borrar datos, descargar documentos y usar el asistente, por lo que **GitHub Pages y otros hostings estáticos no sirven** (se retiró el workflow de Pages).

### Con Node
```bash
npm ci && npm run build
NODE_ENV=production INSFORGE_API_KEY=... PORT=3000 npm start
```

### Con Docker
```bash
docker build -t tapasel .
docker run -p 3000:3000 -e INSFORGE_API_KEY=... -e GEMINI_API_KEY=... tapasel
```
La imagen no está probada aún en un daemon real; el arranque de producción sí se verificó con `npm start`.

### Variables de entorno (servidor)
| Variable | Obligatoria | Descripción |
|----------|-------------|-------------|
| `INSFORGE_API_KEY` | Sí | Clave de administrador de InsForge. Nunca al navegador ni al repositorio. |
| `INSFORGE_PROJECT_URL` | No | URL del proyecto InsForge (hay un valor por defecto). |
| `GEMINI_API_KEY` | No | Activa el asistente de IA real. |
| `PORT` / `HOST` | No | Puerto (3000) y host (`0.0.0.0`) de escucha. |

El frontend usa `VITE_INSFORGE_PROJECT_URL` (pública) en tiempo de build.

### Lista de comprobación antes de publicar
1. **Rotar** la contraseña de Postgres y la API key de InsForge (estuvieron en el historial de git).
2. Aplicar `infor_database.sql` y luego `migrations/001_security_usuarios.sql` y `002_documentos_storage.sql` en InsForge (en ese orden; revisar antes de confirmar).
3. Poner el bucket **`documentos` en privado** en el panel de InsForge.
4. Crear/actualizar al menos un usuario con `rol = 'ADMIN'` en la tabla `usuarios` (sin él nadie puede aprobar cuentas).
5. Subir `insforge.toml` a InsForge (contraseña mínima de 10, redirecciones permitidas). Añadir ahí la URL pública de la app a `allowed_redirect_urls`, o la verificación de correo y el restablecimiento no funcionarán fuera de localhost.
6. Revisar el límite de intentos de autenticación de InsForge y decidir si se cierra el registro (`disable_signup`).
7. Configurar SMTP en InsForge para los correos de verificación y restablecimiento.

---

## Notas

- Las claves de Gemini e InsForge se leen del entorno (`.env.local` en local); nunca deben subirse al control de versiones.
- El servidor escucha en `0.0.0.0` por defecto. Para limitarlo a la máquina local, define `HOST=127.0.0.1`.
- El asistente de IA recibe un extracto mínimo construido en el servidor (`server/assistantContext.ts`): lista blanca de campos por rol, sin correos, teléfonos ni salarios, hasta 100 filas por colección.
