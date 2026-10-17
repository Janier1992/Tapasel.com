import { describe, it, expect } from 'vitest';
import { buildAssistantContext, serializeContext, MAX_ROWS, MAX_CONTEXT_CHARS } from './assistantContext';

const state = {
  clientes: [
    { id: 'C1', nombre: 'Apex', contacto: 'Juan Pérez', email: 'j@apex.co', telefono: '300123', carteraPendiente: 100, totalComprado: 5, estado: 'Mora', ultimoPago: '2026-01-01' },
    { id: 'C2', nombre: 'Titan', email: 't@t.co', carteraPendiente: 900, totalComprado: 1, estado: 'Mora', ultimoPago: '2026-02-01' },
  ],
  transacciones: [
    { id: 'T1', fecha: '2026-01-01', descripcion: 'Venta', tipo: 'Ingreso', categoria: 'Ventas', monto: 10, estado: 'Pagado', responsable: 'Ana', documentorPdf: 'http://x/y.pdf' },
  ],
  empleados: [
    { id: 'E1', nombre: 'Liam', cargo: 'Técnico', area: 'Logística', estado: 'Activo', email: 'l@t.co', telefono: '1', salario: 9999999, fechaIngreso: '2020-01-01', asistenciaHoy: { checkIn: '08:00', estado: 'Ausente' }, documentosVencidos: ['Alturas'] },
  ],
  documentos: [
    { id: 'D1', nombre: 'Q3.pdf', departamento: 'Finanzas', tipoDocumental: 'Legal', estadoVerificacion: 'Verificado', version: 'v1', fechaModificacion: '2026-01-01', responsable: 'Ana', historialVersiones: [{ comentario: 'https://secreto' }] },
    { id: 'D2', nombre: 'Contrato.pdf', departamento: 'RRHH', tipoDocumental: 'Contrato', estadoVerificacion: 'Verificado', version: 'v1', fechaModificacion: '2026-01-01', responsable: 'Sonia', historialVersiones: [] },
  ],
};

describe('buildAssistantContext', () => {
  it('ADMIN: nunca incluye contacto, salarios, responsables ni historial', () => {
    const json = JSON.stringify(buildAssistantContext(state, 'ADMIN'));
    for (const secreto of ['j@apex.co', 'Juan Pérez', '300123', '9999999', 'l@t.co', 'Ana', 'Sonia', 'secreto', 'y.pdf', '2020-01-01']) {
      expect(json).not.toContain(secreto);
    }
    expect(json).toContain('Apex');
    expect(json).toContain('Alturas');
  });

  it('CFO: finanzas y solo documentos de Finanzas; sin empleados', () => {
    const ctx = buildAssistantContext(state, 'CFO');
    expect(ctx.clientes).toHaveLength(2);
    expect(ctx.empleados).toBeUndefined();
    expect(ctx.documentos).toHaveLength(1);
  });

  it('RRHH y COO: empleados y documentos, sin clientes ni transacciones', () => {
    for (const rol of ['RRHH', 'COO'] as const) {
      const ctx = buildAssistantContext(state, rol);
      expect(ctx.clientes).toBeUndefined();
      expect(ctx.transacciones).toBeUndefined();
      expect(ctx.empleados).toHaveLength(1);
    }
  });

  it('ordena clientes por deuda y limita filas y largo de texto', () => {
    expect((buildAssistantContext(state, 'ADMIN').clientes as any[])[0].nombre).toBe('Titan');
    const big = { clientes: Array.from({ length: 500 }, (_, i) => ({ id: i, nombre: 'x'.repeat(1000), carteraPendiente: i })) };
    const c = buildAssistantContext(big, 'ADMIN').clientes as any[];
    expect(c).toHaveLength(MAX_ROWS);
    expect(c[0].nombre.length).toBeLessThanOrEqual(120);
  });

  it('tolera entradas basura', () => {
    expect(() => buildAssistantContext(null, 'ADMIN')).not.toThrow();
    expect(() => buildAssistantContext({ clientes: 'x', empleados: [null, 3] }, 'ADMIN')).not.toThrow();
  });
});

describe('serializeContext', () => {
  it('no excede el tope de caracteres', () => {
    const big = { documentos: Array.from({ length: 100 }, (_, i) => ({ id: i, nombre: 'n'.repeat(80), departamento: 'd'.repeat(40), tipoDocumental: 't'.repeat(30), estadoVerificacion: 'e'.repeat(30), version: 'v', fechaModificacion: 'f' })) };
    const ctx = buildAssistantContext(big, 'ADMIN');
    expect(serializeContext(ctx).length).toBeLessThanOrEqual(MAX_CONTEXT_CHARS);
  });
});
