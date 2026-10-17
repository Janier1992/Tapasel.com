/**
 * assistantContext.ts — Minimización de datos enviados al asistente de IA (Gemini).
 *
 * El servidor NO reenvía lo que manda el cliente: construye el contexto con una
 * lista blanca de campos, según el rol verificado del usuario, sin datos de
 * contacto ni salarios, con topes de filas y de longitud. Los textos libres se
 * recortan porque pueden contener instrucciones ajenas (inyección de prompt).
 */
import type { AppRole } from "./auth";

export const MAX_ROWS = 100;
export const MAX_TEXT = 120;
export const MAX_CONTEXT_CHARS = 60_000;

const txt = (v: unknown, max = MAX_TEXT): string => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const num = (v: unknown): number => (Number.isFinite(Number(v)) ? Number(v) : 0);
const rows = (v: unknown): any[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === "object") : []);

// Qué colecciones puede consultar cada rol (misma regla que usa la interfaz).
const VE_FINANZAS: AppRole[] = ["ADMIN", "CFO"];
const VE_EMPLEADOS: AppRole[] = ["ADMIN", "RRHH", "COO"];

export interface AssistantContext {
  clientes?: unknown[];
  transacciones?: unknown[];
  empleados?: unknown[];
  documentos?: unknown[];
}

/** Devuelve solo los campos y filas que el rol puede ver y el asistente necesita. */
export function buildAssistantContext(state: any, rol: AppRole): AssistantContext {
  const ctx: AssistantContext = {};

  if (VE_FINANZAS.includes(rol)) {
    // Sin contacto, correo ni teléfono. Se priorizan los de mayor deuda.
    ctx.clientes = rows(state?.clientes)
      .map((c) => ({
        id: txt(c.id, 40),
        nombre: txt(c.nombre),
        estado: txt(c.estado, 20),
        carteraPendiente: num(c.carteraPendiente),
        totalComprado: num(c.totalComprado),
        ultimoPago: txt(c.ultimoPago, 20),
      }))
      .sort((a, b) => b.carteraPendiente - a.carteraPendiente)
      .slice(0, MAX_ROWS);

    // Sin responsable ni PDF adjunto. Se conservan las más recientes.
    ctx.transacciones = rows(state?.transacciones)
      .map((t) => ({
        id: txt(t.id, 40),
        fecha: txt(t.fecha, 20),
        descripcion: txt(t.descripcion),
        tipo: txt(t.tipo, 20),
        categoria: txt(t.categoria, 40),
        monto: num(t.monto),
        estado: txt(t.estado, 20),
      }))
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, MAX_ROWS);
  }

  if (VE_EMPLEADOS.includes(rol)) {
    // Sin correo, teléfono, salario ni fecha de ingreso.
    ctx.empleados = rows(state?.empleados)
      .map((e) => ({
        nombre: txt(e.nombre),
        cargo: txt(e.cargo, 60),
        area: txt(e.area, 30),
        estado: txt(e.estado, 20),
        asistenciaHoy: e.asistenciaHoy ? txt(e.asistenciaHoy.estado, 20) : undefined,
        documentosVencidos: (Array.isArray(e.documentosVencidos) ? e.documentosVencidos : [])
          .slice(0, 10)
          .map((d: unknown) => txt(d, 80)),
      }))
      .slice(0, MAX_ROWS);
  }

  // Documentos: sin historial de comentarios ni responsables. El CFO solo ve Finanzas.
  ctx.documentos = rows(state?.documentos)
    .filter((d) => rol !== "CFO" || d.departamento === "Finanzas")
    .map((d) => ({
      id: txt(d.id, 40),
      nombre: txt(d.nombre, 80),
      departamento: txt(d.departamento, 40),
      tipoDocumental: txt(d.tipoDocumental, 30),
      estadoVerificacion: txt(d.estadoVerificacion, 30),
      version: txt(d.version, 20),
      fechaModificacion: txt(d.fechaModificacion, 20),
    }))
    .slice(0, MAX_ROWS);

  return ctx;
}

/** Serializa el contexto compacto y lo recorta si excede el tope. */
export function serializeContext(ctx: AssistantContext): string {
  let json = JSON.stringify(ctx);
  if (json.length <= MAX_CONTEXT_CHARS) return json;
  // Reduce filas por colección hasta caber.
  let limit = MAX_ROWS;
  while (json.length > MAX_CONTEXT_CHARS && limit > 5) {
    limit = Math.floor(limit / 2);
    const trimmed: Record<string, unknown[]> = {};
    for (const [k, v] of Object.entries(ctx)) trimmed[k] = (v as unknown[]).slice(0, limit);
    json = JSON.stringify(trimmed);
  }
  return json;
}
