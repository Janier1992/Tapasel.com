/**
 * auth.ts — Verificación de sesión y rol en el servidor.
 *
 * El rol NUNCA se toma de lo que envía el cliente. Se valida el token de sesión
 * de InsForge contra el propio backend (`/api/auth/sessions/current`) y el rol
 * se lee de la tabla `usuarios` con la clave de administrador. Si el usuario
 * no tiene perfil, no tiene rol y no puede operar.
 *
 * Lo comparten el servidor Express (server.ts) y la función de Vercel
 * (api/assistant.ts).
 */
import { createClient, type InsForgeClient } from "@insforge/sdk";

export type AppRole = "ADMIN" | "CFO" | "RRHH" | "COO";

export interface AuthedUser {
  id: string;
  email: string;
  rol: AppRole;
}

// "PENDIENTE" (cuentas recién registradas sin aprobar) no figura: no opera en la API.
const ROLES_VALIDOS: AppRole[] = ["ADMIN", "CFO", "RRHH", "COO"];

// Permisos (pestañas) que concede cada rol. Los fija el servidor al aprobar un
// usuario; el cliente solo elige el rol.
export const ROLE_PERMISOS: Record<AppRole | "PENDIENTE", string[]> = {
  ADMIN: ["panel", "finanzas", "rrhh", "documentos", "produccion", "configuracion"],
  CFO: ["panel", "finanzas", "documentos"],
  RRHH: ["panel", "rrhh", "produccion", "documentos"],
  COO: ["panel", "produccion", "documentos"],
  PENDIENTE: ["panel"],
};

/** Extrae el token de una cabecera `Authorization: Bearer <token>`. */
export function getBearerToken(header: string | string[] | undefined): string | null {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const match = /^Bearer\s+(.+)$/i.exec(value.trim());
  return match ? match[1] : null;
}

/**
 * Valida el token contra InsForge y resuelve el rol desde `usuarios`.
 * Devuelve null si el token es inválido o el usuario no tiene perfil.
 */
export async function authenticate(
  token: string,
  baseUrl: string,
  admin: InsForgeClient
): Promise<AuthedUser | null> {
  const userClient = createClient({ baseUrl, edgeFunctionToken: token });
  const { data, error } = await userClient.auth.getCurrentUser();
  const authUser = data?.user as { id?: string; email?: string } | null;
  if (error || !authUser?.id || !authUser.email) return null;

  const email = authUser.email.toLowerCase();
  const { data: perfil } = await admin.database
    .from("usuarios")
    .select("id, email, rol")
    .eq("email", email)
    .maybeSingle();

  const rol = perfil?.rol as AppRole | undefined;
  if (!rol || !ROLES_VALIDOS.includes(rol)) return null;
  return { id: authUser.id, email, rol };
}

/** Límite de peticiones por usuario en memoria (ventana deslizante simple). */
export function createRateLimiter(maxPerWindow: number, windowMs: number) {
  const hits = new Map<string, number[]>();
  return (key: string): boolean => {
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (recent.length >= maxPerWindow) {
      hits.set(key, recent);
      return false;
    }
    recent.push(now);
    hits.set(key, recent);
    return true;
  };
}
