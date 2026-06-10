/**
 * formatters.ts — Capa de utilidades de presentación (formato de datos).
 *
 * Diseño y rol:
 * Este módulo centraliza las funciones puras de formateo que antes estaban
 * duplicadas en varios componentes (FinanzasTab, RRHHTab, ProduccionTab).
 * Pertenece a la capa de utilidades: NO contiene reglas de negocio ni acceso a
 * datos, solo transforma valores para mostrarlos en la interfaz.
 *
 * Reglas de uso:
 * - Todas las funciones son puras (mismo input => mismo output, sin efectos).
 * - Cualquier formato de moneda, número o fecha de la app debe pasar por aquí
 *   para garantizar consistencia visual en el 100% de la plataforma.
 */

// Configuración regional única para toda la aplicación (Colombia, español).
const LOCALE_COLOMBIA = 'es-CO';
const MONEDA_COP = 'COP';

/**
 * formatCurrencyCOP — Da formato de moneda colombiana (COP) a un valor numérico.
 *
 * @param monto Valor numérico a formatear (puede venir como string o inválido).
 * @returns Cadena con formato de moneda, p. ej. "$ 1.250.000". Si el valor no es
 *          numérico, retorna "$ 0" para evitar romper la interfaz.
 */
export function formatCurrencyCOP(monto: number): string {
  // Programación defensiva: si llega un valor no numérico (NaN, null, undefined,
  // o string no convertible), se normaliza a 0 en lugar de mostrar "NaN".
  const valorSeguro = Number.isFinite(Number(monto)) ? Number(monto) : 0;

  return new Intl.NumberFormat(LOCALE_COLOMBIA, {
    style: 'currency',
    currency: MONEDA_COP,
    minimumFractionDigits: 0
  }).format(valorSeguro);
}

/**
 * formatNumberCO — Da formato de separadores de miles a un número (sin símbolo
 * de moneda). Útil para tablas donde el símbolo "$" se añade aparte.
 *
 * @param valor Número a formatear.
 * @returns Cadena con separadores de miles, p. ej. "1.250.000".
 */
export function formatNumberCO(valor: number): string {
  const valorSeguro = Number.isFinite(Number(valor)) ? Number(valor) : 0;
  return valorSeguro.toLocaleString(LOCALE_COLOMBIA);
}

/**
 * formatDateLongSpanish — Convierte una fecha ISO ("YYYY-MM-DD") en texto largo
 * en español (p. ej. "5 de junio de 2026").
 *
 * @param fechaIso Fecha en formato "YYYY-MM-DD".
 * @returns Fecha legible en español, o cadena vacía si la entrada es inválida.
 */
export function formatDateLongSpanish(fechaIso: string): string {
  // Validación de entrada: evita excepciones ante fechas vacías o mal formadas.
  if (!fechaIso) return '';

  const fecha = new Date(`${fechaIso}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return fechaIso;

  return fecha.toLocaleDateString(LOCALE_COLOMBIA, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
