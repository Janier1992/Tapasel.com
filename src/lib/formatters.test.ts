/**
 * formatters.test.ts — Pruebas unitarias de la capa de formateo.
 *
 * Objetivo: validar que cada función de formato produce la salida esperada ante
 * entradas válidas e inválidas, garantizando que futuras modificaciones no
 * rompan el comportamiento (criterio de tests de validación).
 */
import { describe, it, expect } from 'vitest';
import { formatCurrencyCOP, formatNumberCO, formatDateLongSpanish } from './formatters';

describe('formatCurrencyCOP', () => {
  it('formatea un valor entero como moneda COP sin decimales', () => {
    // El espacio en "$ 1.250.000" es un espacio no separable (NBSP) que añade Intl.
    expect(formatCurrencyCOP(1250000)).toContain('1.250.000');
    expect(formatCurrencyCOP(1250000)).toContain('$');
  });

  it('retorna "$ 0" ante un valor no numérico (defensivo)', () => {
    // @ts-expect-error: probamos entrada inválida intencionalmente.
    expect(formatCurrencyCOP('abc')).toContain('0');
    expect(formatCurrencyCOP(null as unknown as number)).toContain('0');
    expect(formatCurrencyCOP(NaN)).toContain('0');
  });

  it('formatea el cero correctamente', () => {
    expect(formatCurrencyCOP(0)).toContain('0');
  });
});

describe('formatNumberCO', () => {
  it('aplica separadores de miles', () => {
    expect(formatNumberCO(1250000)).toBe('1.250.000');
  });

  it('normaliza entradas inválidas a 0', () => {
    expect(formatNumberCO(undefined as unknown as number)).toBe('0');
  });
});

describe('formatDateLongSpanish', () => {
  it('convierte una fecha ISO a texto largo en español', () => {
    const resultado = formatDateLongSpanish('2026-06-05');
    expect(resultado).toContain('2026');
    expect(resultado).toContain('junio');
  });

  it('retorna cadena vacía ante una fecha vacía', () => {
    expect(formatDateLongSpanish('')).toBe('');
  });

  it('retorna la entrada original si la fecha es inválida', () => {
    expect(formatDateLongSpanish('no-es-fecha')).toBe('no-es-fecha');
  });
});
