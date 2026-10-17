/**
 * backendClient.ts — Capa de acceso a datos y autenticación (servicios).
 *
 * Diseño y rol:
 * Único punto de comunicación del frontend con el backend. Usa el SDK de
 * InsForge (`createClient`) para hablar DIRECTAMENTE con la API hospedada de
 * InsForge desde el navegador. Esto permite que la autenticación y el acceso a
 * datos funcionen incluso en despliegues estáticos (GitHub Pages), donde no
 * existe el servidor Express.
 *
 * Notas:
 * - El cliente de navegador NO usa la API key de administrador (secreta). Se
 *   conecta con la URL pública del proyecto y la sesión del usuario autenticado.
 * - Se conservan nombres compatibles con la antigua capa (doc, getDoc, setDoc,
 *   auth) para no tener que modificar los componentes de la interfaz.
 * - Incluye respaldos (fallback) a localStorage/datos mock para que la app no se
 *   bloquee ante fallos de red o políticas RLS restrictivas.
 */
import { createClient } from '@insforge/sdk';
import { Usuario } from '../types';
import { PASSWORD_TOO_SHORT_MESSAGE } from '../lib/passwordPolicy';
import { ERP_USUARIOS } from '../mockData';

// URL pública del proyecto InsForge (no es secreta). Configurable por entorno.
const INSFORGE_BASE_URL =
  (import.meta as any).env?.VITE_INSFORGE_PROJECT_URL ||
  'https://yk386jub.us-east.insforge.app';

// Cliente de navegador de InsForge: maneja sesión y token automáticamente.
export const insforge = createClient({ baseUrl: INSFORGE_BASE_URL });

// Clave de almacenamiento local del usuario activo.
const USER_STORAGE_KEY = 'tapasel_flow_user';

// Permisos por defecto para un usuario sin perfil explícito en la base de datos.
const DEFAULT_PERMISOS = ['panel', 'finanzas', 'rrhh', 'documentos', 'produccion', 'configuracion'];

// Cuenta sin perfil aprobado: el rol real lo asigna un administrador en `usuarios`.
const PENDING_PERMISOS = ['panel'];

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// ─────────────────────────────────────────────────────────────
// FUNCIÓN UNIVERSAL DE INSERCIÓN VIA BACKEND (PROXY)
// ─────────────────────────────────────────────────────────────
/**
 * getAuthHeaders — Cabecera Authorization con el token de la sesión activa de
 * InsForge. El servidor verifica el token y decide el rol; el cliente no lo declara.
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  try {
    let token: string | null = (insforge as any).tokenManager?.getAccessToken?.() ?? null;
    if (!token) {
      const { data } = await insforge.auth.refreshSession();
      token = data?.accessToken ?? null;
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (_) {
    return {};
  }
}

export async function apiInsert(table: string, data: any) {
  try {
    const res = await fetch(`/api/db/${table}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(await getAuthHeaders())
      },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }
    return await res.json();
  } catch (err) {
    console.error(`[apiInsert] Error guardando en ${table}:`, err);
    throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// ARCHIVOS DE DOCUMENTOS (bucket privado)
// ─────────────────────────────────────────────────────────────
// El bucket `documentos` es privado: no hay URL pública. Se guarda solo la ruta
// interna (`storage_path`) y la descarga pasa por /api/documentos/:id/archivo,
// donde el servidor verifica la sesión y el rol antes de entregar el archivo.
const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'png', 'jpg', 'jpeg'];
const MAX_DOC_BYTES = 20 * 1024 * 1024;

/** uploadDocumentFile — Sube un archivo al bucket privado y devuelve su ruta interna. */
export async function uploadDocumentFile(file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || '').toLowerCase();
  if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
    throw new Error(`Tipo de archivo no permitido (.${ext}). Use: ${ALLOWED_DOC_EXTENSIONS.join(', ')}.`);
  }
  if (file.size > MAX_DOC_BYTES) {
    throw new Error('El archivo supera el máximo de 20 MB.');
  }
  const storagePath = `${crypto.randomUUID()}.${ext}`;
  const { error } = await insforge.storage.from('documentos').upload(storagePath, file);
  if (error) throw new Error(error.message || 'No se pudo subir el archivo.');
  return storagePath;
}

/** downloadDocumentFile — Descarga el archivo de un documento a través del servidor. */
export async function downloadDocumentFile(docId: string, nombre: string) {
  const res = await fetch(`/api/documentos/${encodeURIComponent(docId)}/archivo`, {
    headers: await getAuthHeaders()
  });
  if (!res.ok) {
    let msg = 'No se pudo descargar el archivo.';
    try { msg = (await res.json()).error || msg; } catch (_) { /* respuesta no JSON */ }
    throw new Error(msg);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

// Referencia simbólica de base de datos (compatibilidad con la API previa).
export const db = {
  firestoreDatabaseId: 'insforge-database'
};

// ─────────────────────────────────────────────────────────────
// UTILIDADES INTERNAS
// ─────────────────────────────────────────────────────────────

/** getInitials — Deriva las iniciales (máx. 2) a partir de un nombre completo. */
function getInitials(nombre: string): string {
  return (nombre || 'US')
    .split(' ')
    .map((palabra) => palabra[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/** mapRowToUsuario — Convierte una fila de la tabla `usuarios` al tipo Usuario. */
function mapRowToUsuario(row: any): Usuario {
  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    cargo: row.cargo || 'Colaborador',
    rol: row.rol || 'PENDIENTE',
    avatarInitials: row.avatar_initials || getInitials(row.nombre),
    permisos: row.permisos || DEFAULT_PERMISOS
  };
}

/**
 * buildDefaultUsuario — Construye un perfil de usuario por defecto a partir de
 * los datos de autenticación, cuando no existe (o no es legible) un perfil en la
 * tabla `usuarios`. Garantiza que un usuario autenticado pueda acceder a la app.
 */
function buildDefaultUsuario(authUser: any, email: string): Usuario {
  const nombre = authUser?.profile?.name || authUser?.name || email.split('@')[0];
  return {
    id: authUser?.id || email.toLowerCase(),
    nombre,
    email: email.toLowerCase(),
    cargo: 'Colaborador',
    rol: 'PENDIENTE',
    avatarInitials: getInitials(nombre),
    permisos: PENDING_PERMISOS
  };
}

/**
 * fetchPerfilUsuario — Intenta leer el perfil del usuario desde la tabla
 * `usuarios`. Si la lectura falla (p. ej. por RLS) o no existe, devuelve un
 * perfil por defecto derivado de la sesión de autenticación.
 */
async function fetchPerfilUsuario(authUser: any, email: string): Promise<Usuario> {
  try {
    const { data: row } = await insforge.database
      .from('usuarios')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle();
    if (row) return mapRowToUsuario(row);
  } catch (err) {
    console.warn('No se pudo leer el perfil en usuarios; usando perfil por defecto.', err);
  }
  return buildDefaultUsuario(authUser, email);
}

/** translateAuthError — Traduce mensajes de error de InsForge al español. */
function translateAuthError(message?: string): string {
  if (!message) return 'Ha ocurrido un error inesperado.';
  const msg = message.toLowerCase();
  if (msg.includes('rate_limited') || msg.includes('rate limit') || msg.includes('too many')) return 'Demasiados intentos. Espere unos minutos antes de intentar de nuevo.';
  if (msg.includes('signup') && msg.includes('disabled')) return 'El registro de usuarios está desactivado.';
  if (msg.includes('already') || msg.includes('unique')) return 'El usuario ya se encuentra registrado con este correo.';
  if (msg.includes('invalid') && msg.includes('credential')) return 'Credenciales inválidas. Verifique su correo y contraseña.';
  if (msg.includes('not verified') || msg.includes('email_not_verified')) return 'Debe confirmar su cuenta desde el correo electrónico para acceder.';
  if (msg.includes('password')) return PASSWORD_TOO_SHORT_MESSAGE;
  if (msg.includes('invalid otp') || msg.includes('verification code') || msg.includes('incorrect code')) return 'Código de verificación inválido. Intente nuevamente.';
  if (msg.includes('not found')) return 'Usuario no encontrado en el sistema. Cree una cuenta primero.';
  return message;
}

/** getRedirectUrl — URL de retorno para enlaces de correo (verificación/reset). */
function getRedirectUrl(): string {
  if (typeof window === 'undefined') return 'http://localhost:3000';
  return window.location.origin + ((import.meta as any).env?.BASE_URL || '/');
}

// ─────────────────────────────────────────────────────────────
// SESIÓN (compatibilidad con la API previa)
// ─────────────────────────────────────────────────────────────

class SessionManager {
  private userKey = USER_STORAGE_KEY;

  get currentUser() {
    const saved = localStorage.getItem(this.userKey);
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      return {
        uid: parsed.id || 'demo-uid',
        email: parsed.email || 'colaborador@tapasel.co',
        displayName: parsed.nombre || 'Colaborador',
        rol: parsed.rol as string | undefined,
        emailVerified: true,
        isAnonymous: false,
        tenantId: null,
        providerData: []
      };
    } catch (_) {
      return null;
    }
  }
}

export const auth = new SessionManager();

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: { userId: auth.currentUser?.uid, email: auth.currentUser?.email }
  };
  console.error('Backend error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ─────────────────────────────────────────────────────────────
// REFERENCIAS DOCUMENTALES (compatibilidad con la API previa)
// ─────────────────────────────────────────────────────────────

export function doc(_dbInstance: any, collection: string, id: string) {
  return { collection, id };
}

/**
 * getDoc — Lee un documento (perfil de usuario o configuración).
 * Pasos:
 *  1. Para `usuarios`: intenta leer de la base de datos por email o id.
 *  2. Si falla o no existe, cae al usuario guardado en localStorage o a los
 *     usuarios mock, garantizando que el login no se bloquee.
 *  3. Para `configuraciones`: usa localStorage (los ajustes son por dispositivo).
 */
export async function getDoc(docRef: { collection: string; id: string }) {
  if (docRef.collection === 'usuarios') {
    try {
      const esEmail = docRef.id.includes('@');
      const consulta = insforge.database.from('usuarios').select('*');
      const { data: row } = await (esEmail
        ? consulta.eq('email', docRef.id.toLowerCase())
        : consulta.eq('id', docRef.id)
      ).maybeSingle();
      if (row) {
        const usuario = mapRowToUsuario(row);
        return { exists: () => true, data: () => usuario };
      }
    } catch (err) {
      console.warn('Lectura de usuarios falló; usando respaldo local.', err);
    }
    // Respaldo: usuario activo en localStorage o usuario mock.
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    let userObj = saved ? JSON.parse(saved) : null;
    if (!userObj || (userObj.id !== docRef.id && userObj.email !== docRef.id.toLowerCase())) {
      userObj =
        ERP_USUARIOS.find((u) => u.id === docRef.id || u.email.toLowerCase() === docRef.id.toLowerCase()) ||
        userObj;
    }
    return { exists: () => !!userObj, data: () => userObj };
  }

  if (docRef.collection === 'configuraciones') {
    const saved = localStorage.getItem(`tapasel_thresholds_${docRef.id}`);
    const data = saved ? JSON.parse(saved) : null;
    return { exists: () => !!data, data: () => data };
  }

  return { exists: () => false, data: () => null };
}

/**
 * setDoc — Persiste un documento.
 *  - `configuraciones`: guarda los ajustes en localStorage.
 *  - `usuarios`: registra un nuevo usuario en InsForge (signUp) e intenta crear
 *    su perfil. Devuelve si se requiere verificación de correo.
 */
export async function setDoc(docRef: { collection: string; id: string }, data: any) {
  if (docRef.collection === 'configuraciones') {
    localStorage.setItem(`tapasel_thresholds_${docRef.id}`, JSON.stringify(data));
    return { success: true };
  }

  if (docRef.collection === 'usuarios') {
    // 1. Alta del usuario en el servicio de autenticación de InsForge.
    const { data: signUpData, error: signUpError } = await insforge.auth.signUp({
      email: String(data.email).toLowerCase(),
      password: data.password,
      name: data.nombre,
      redirectTo: getRedirectUrl()
    } as any);

    if (signUpError) {
      throw new Error(translateAuthError(signUpError.message));
    }

    const requireEmailVerification = !!(signUpData as any)?.requireEmailVerification;
    const userId = (signUpData as any)?.user?.id || String(data.email).toLowerCase();

    // 2. Crear el perfil en la tabla `usuarios` (best-effort; puede bloquear RLS).
    try {
      await insforge.database.from('usuarios').insert([
        {
          id: userId,
          nombre: data.nombre,
          email: String(data.email).toLowerCase(),
          cargo: data.cargo,
          rol: 'PENDIENTE',
          avatar_initials: data.avatarInitials || getInitials(data.nombre),
          permisos: PENDING_PERMISOS
        }
      ]);
    } catch (err) {
      console.warn('No se pudo crear el perfil en usuarios (posible RLS).', err);
    }

    if (requireEmailVerification) {
      return { success: true, requireEmailVerification: true, email: String(data.email).toLowerCase() };
    }

    // Sin verificación: guardar perfil activo localmente.
    const usuario: Usuario = {
      id: userId,
      nombre: data.nombre,
      email: String(data.email).toLowerCase(),
      cargo: data.cargo,
      rol: 'PENDIENTE',
      avatarInitials: data.avatarInitials || getInitials(data.nombre),
      permisos: PENDING_PERMISOS
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    return { success: true, requireEmailVerification: false };
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────────────────────────

/**
 * signInWithEmailAndPassword — Autentica al usuario contra InsForge.
 * Pasos:
 *  1. Inicia sesión con email/contraseña.
 *  2. Si el correo no está verificado, indica que se requiere verificación.
 *  3. Carga (o construye) el perfil y lo guarda en localStorage.
 */
export async function signInWithEmailAndPassword(_authInstance: any, email: string, password: string) {
  const correo = email.toLowerCase();
  const { data: loginData, error: loginError } = await insforge.auth.signInWithPassword({
    email: correo,
    password
  });

  if (loginError) {
    const code = (loginError as any).error;
    if (code === 'EMAIL_NOT_VERIFIED' || /not verified|verif/i.test(loginError.message || '')) {
      return { requireEmailVerification: true, email: correo };
    }
    throw new Error(translateAuthError(loginError.message));
  }

  const authUser = (loginData as any)?.user;
  const usuario = await fetchPerfilUsuario(authUser, correo);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));

  return {
    user: { uid: usuario.id, displayName: usuario.nombre, email: usuario.email }
  };
}

/**
 * verifyEmailCode — Verifica el código (OTP) de confirmación de correo y deja
 * la sesión iniciada, devolviendo el perfil del usuario.
 */
export async function verifyEmailCode(email: string, code: string) {
  const correo = email.toLowerCase();
  const { data: verifyData, error } = await insforge.auth.verifyEmail({ email: correo, otp: code });

  if (error) {
    throw new Error(translateAuthError(error.message));
  }

  const authUser = (verifyData as any)?.user;
  const usuario = await fetchPerfilUsuario(authUser, correo);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
  return usuario;
}

/** resendVerificationCode — Reenvía el correo de verificación. */
export async function resendVerificationCode(email: string) {
  const { data, error } = await insforge.auth.resendVerificationEmail({ email: email.toLowerCase() });
  if (error) throw new Error(translateAuthError(error.message));
  return { success: true, message: (data as any)?.message || 'Verificación reenviada.' };
}

/** sendPasswordResetEmail — Envía el enlace/código de restablecimiento. */
export async function sendPasswordResetEmail(email: string) {
  const { data, error } = await insforge.auth.sendResetPasswordEmail({
    email: email.toLowerCase(),
    redirectTo: getRedirectUrl()
  } as any);
  if (error) throw new Error(translateAuthError(error.message));
  return { success: true, message: (data as any)?.message || 'Enlace de restablecimiento enviado.' };
}

/** confirmPasswordReset — Restablece la contraseña con el token recibido. */
export async function confirmPasswordReset(token: string, password: string) {
  const { data, error } = await insforge.auth.resetPassword({ otp: token, newPassword: password } as any);
  if (error) throw new Error(translateAuthError(error.message));
  return { success: true, message: (data as any)?.message || 'Contraseña restablecida.' };
}

// ─────────────────────────────────────────────────────────────
// PROVEEDORES OAUTH (marcadores de posición, compatibilidad)
// ─────────────────────────────────────────────────────────────

export class GoogleAuthProvider {}

export async function getRedirectResult(_authInstance: any) {
  return null;
}

export async function signInWithPopup(_authInstance: any, _provider: any) {
  return null;
}

export async function signInWithRedirect(_authInstance: any, _provider: any) {
  console.log('OAuth redirect no configurado en este despliegue.');
}

export const apiUpdate = async (table: string, id: string | number, data: any) => {
  try {
    const res = await fetch(`/api/db/${table}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify(data)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Unknown error updating data');
    }
    
    return await res.json();
  } catch (err) {
    console.error('apiUpdate error:', err);
    throw err;
  }
};

export const apiDelete = async (table: string, id: string | number) => {
  try {
    const res = await fetch(`/api/db/${table}/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders()
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Unknown error deleting data');
    }
    
    return await res.json();
  } catch (err) {
    console.error('apiDelete error:', err);
    throw err;
  }
};
