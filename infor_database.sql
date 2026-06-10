-- =============================================================
--  TAPASEL FLOW AI — Base de datos: infor
--  Ejecutar en: Editor SQL de Insforge
--  Proyecto: https://yk386jub.us-east.insforge.app/
--  Encoding: UTF-8
-- =============================================================



-- ─────────────────────────────────────────────────────────────
-- EXTENSIONES
-- ─────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────────────────────
-- TABLAS
-- ─────────────────────────────────────────────────────────────

-- usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id              TEXT PRIMARY KEY,
  nombre          TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  cargo           TEXT NOT NULL,
  rol             TEXT NOT NULL CHECK (rol IN ('ADMIN', 'CFO', 'RRHH', 'COO')),
  avatar_initials TEXT NOT NULL DEFAULT '',
  permisos        TEXT[] NOT NULL DEFAULT '{}'
);

-- clientes
CREATE TABLE IF NOT EXISTS clientes (
  id                TEXT PRIMARY KEY,
  nombre            TEXT NOT NULL,
  contacto          TEXT NOT NULL DEFAULT '',
  email             TEXT NOT NULL DEFAULT '',
  telefono          TEXT NOT NULL DEFAULT '',
  cartera_pendiente NUMERIC(18,2) NOT NULL DEFAULT 0,
  total_comprado    NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado            TEXT NOT NULL CHECK (estado IN ('Al día', 'Mora', 'Inactivo')),
  ultimo_pago       TEXT NOT NULL DEFAULT ''
);

-- transacciones
CREATE TABLE IF NOT EXISTS transacciones (
  id            TEXT PRIMARY KEY,
  fecha         TEXT NOT NULL,
  descripcion   TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('Ingreso', 'Egreso')),
  categoria     TEXT NOT NULL DEFAULT '',
  monto         NUMERIC(18,2) NOT NULL DEFAULT 0,
  estado        TEXT NOT NULL CHECK (estado IN ('Pagado', 'Pendiente', 'Rechazado')),
  cliente_id    TEXT REFERENCES clientes(id) ON DELETE SET NULL,
  proveedor_id  TEXT,
  responsable   TEXT NOT NULL DEFAULT '',
  documento_pdf TEXT
);

-- cartera (Cuentas por cobrar / CxC)
CREATE TABLE IF NOT EXISTS cartera (
  id             TEXT PRIMARY KEY,
  fecha          TEXT NOT NULL,
  cliente_id     TEXT NOT NULL,
  cliente_nombre TEXT NOT NULL,
  factura        TEXT NOT NULL,
  cree           NUMERIC(18,4) NOT NULL DEFAULT 0,
  valor_mercancia NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva            NUMERIC(18,2) NOT NULL DEFAULT 0,
  retencion      NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_a_pagar  NUMERIC(18,2) NOT NULL DEFAULT 0,
  abono          NUMERIC(18,2) NOT NULL DEFAULT 0,
  rc_abono       TEXT NOT NULL DEFAULT '',
  rc_cancelacion TEXT NOT NULL DEFAULT '',
  fecha_pago     TEXT NOT NULL DEFAULT '',
  medio_pago     TEXT NOT NULL DEFAULT '',
  estado         TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Abonado', 'Liquidado'))
);

-- proveedores (Cuentas por pagar / CxP)
CREATE TABLE IF NOT EXISTS proveedores (
  id                 TEXT PRIMARY KEY,
  fecha              TEXT NOT NULL,
  proveedor_nombre   TEXT NOT NULL,
  factura            TEXT NOT NULL,
  valor_mercancia    NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva                NUMERIC(18,2) NOT NULL DEFAULT 0,
  retencion          NUMERIC(18,4) NOT NULL DEFAULT 0,
  total_a_pagar      NUMERIC(18,2) NOT NULL DEFAULT 0,
  comprobante_egreso TEXT NOT NULL DEFAULT '',
  cheque_no          TEXT NOT NULL DEFAULT '',
  fecha_cancelado    TEXT NOT NULL DEFAULT '',
  estado             TEXT NOT NULL CHECK (estado IN ('Pendiente', 'Cancelado'))
);

-- cotizaciones
CREATE TABLE IF NOT EXISTS cotizaciones (
  id                          TEXT PRIMARY KEY,
  fecha                       TEXT NOT NULL,
  cotizacion_no               TEXT NOT NULL,
  empresa                     TEXT NOT NULL DEFAULT 'Tapasel S.A.S.',
  cliente_nombre              TEXT NOT NULL,
  ingeniero                   TEXT NOT NULL DEFAULT '',
  referencia_obra             TEXT NOT NULL DEFAULT '',
  direccion                   TEXT NOT NULL DEFAULT '',
  subtotal                    NUMERIC(18,2) NOT NULL DEFAULT 0,
  iva                         NUMERIC(18,2) NOT NULL DEFAULT 0,
  total                       NUMERIC(18,2) NOT NULL DEFAULT 0,
  firma_digital_representante TEXT NOT NULL DEFAULT '',
  firma_digital_cliente       TEXT NOT NULL DEFAULT '',
  fecha_firma_representante   TEXT,
  fecha_firma_cliente         TEXT
);

-- cotizaciones_items
CREATE TABLE IF NOT EXISTS cotizaciones_items (
  id             TEXT PRIMARY KEY,
  cotizacion_id  TEXT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
  referencia     TEXT NOT NULL DEFAULT '',
  descripcion    TEXT NOT NULL,
  unidad         TEXT NOT NULL DEFAULT 'un',
  cantidad       NUMERIC(18,4) NOT NULL DEFAULT 1,
  valor_unitario NUMERIC(18,2) NOT NULL DEFAULT 0,
  valor_total    NUMERIC(18,2) NOT NULL DEFAULT 0
);

-- empleados
CREATE TABLE IF NOT EXISTS empleados (
  id                  TEXT PRIMARY KEY,
  nombre              TEXT NOT NULL,
  cargo               TEXT NOT NULL,
  area                TEXT NOT NULL CHECK (area IN ('Ingeniería', 'Logística', 'RR.HH.', 'Administración', 'Ventas')),
  estado              TEXT NOT NULL CHECK (estado IN ('Activo', 'Licencia', 'Inactivo')),
  email               TEXT NOT NULL DEFAULT '',
  telefono            TEXT NOT NULL DEFAULT '',
  fecha_ingreso       TEXT NOT NULL DEFAULT '',
  salario             NUMERIC(18,2) NOT NULL DEFAULT 0,
  asistencia_checkin  TEXT,
  asistencia_checkout TEXT,
  asistencia_estado   TEXT CHECK (asistencia_estado IN ('Presente', 'Retraso', 'Ausente', 'Licencia')),
  documentos_vencidos TEXT[] NOT NULL DEFAULT '{}'
);

-- documentos
CREATE TABLE IF NOT EXISTS documentos (
  id                  TEXT PRIMARY KEY,
  nombre              TEXT NOT NULL,
  departamento        TEXT NOT NULL DEFAULT '',
  fecha_creacion      TEXT NOT NULL,
  fecha_modificacion  TEXT NOT NULL,
  responsable         TEXT NOT NULL DEFAULT '',
  version             TEXT NOT NULL DEFAULT 'v1.0.0',
  tamano              TEXT NOT NULL DEFAULT '',
  estado_verificacion TEXT NOT NULL CHECK (estado_verificacion IN ('Verificado', 'Chequeo Neural', 'Pendiente Verificación')),
  tipo_documental     TEXT NOT NULL CHECK (tipo_documental IN ('Contrato', 'Incapacidad', 'Vacaciones', 'Certificado', 'Legal', 'Financia'))
);

-- documento_versiones (historial de versiones)
CREATE TABLE IF NOT EXISTS documento_versiones (
  id           SERIAL PRIMARY KEY,
  documento_id TEXT NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
  version      TEXT NOT NULL,
  fecha        TEXT NOT NULL,
  usuario      TEXT NOT NULL,
  comentario   TEXT NOT NULL DEFAULT '',
  orden        INT  NOT NULL DEFAULT 0
);

-- ordenes_produccion
CREATE TABLE IF NOT EXISTS ordenes_produccion (
  id                  TEXT PRIMARY KEY,
  producto            TEXT NOT NULL,
  cantidad            INT  NOT NULL DEFAULT 0,
  cliente             TEXT NOT NULL DEFAULT '',
  fecha_creacion      TEXT NOT NULL,
  fecha_entrega       TEXT NOT NULL,
  estado              TEXT NOT NULL CHECK (estado IN ('Diseño', 'Ensamble PCB', 'Soldadura', 'Calidad QA', 'Despachado')),
  prioridad           TEXT NOT NULL CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
  eficiencia_estimada NUMERIC(5,2) NOT NULL DEFAULT 0,
  operador_asignado   TEXT NOT NULL DEFAULT ''
);

-- alertas
CREATE TABLE IF NOT EXISTS alertas (
  id           TEXT PRIMARY KEY,
  tipo         TEXT NOT NULL CHECK (tipo IN ('warning', 'bolt', 'tips_and_updates')),
  titulo       TEXT NOT NULL,
  descripcion  TEXT NOT NULL,
  accion_label TEXT NOT NULL DEFAULT '',
  destino      TEXT NOT NULL DEFAULT ''
);

-- audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id            TEXT PRIMARY KEY,
  agente_nombre TEXT NOT NULL,
  fecha         TEXT NOT NULL,
  hora          TEXT NOT NULL,
  detalle       TEXT NOT NULL,
  nivel         TEXT NOT NULL CHECK (nivel IN ('Info', 'Alerta', 'Éxito'))
);

-- configuraciones
CREATE TABLE IF NOT EXISTS configuraciones (
  id   TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- ─────────────────────────────────────────────────────────────
-- ÍNDICES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_transacciones_fecha         ON transacciones(fecha);
CREATE INDEX IF NOT EXISTS idx_transacciones_tipo          ON transacciones(tipo);
CREATE INDEX IF NOT EXISTS idx_cartera_cliente_id          ON cartera(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cartera_estado              ON cartera(estado);
CREATE INDEX IF NOT EXISTS idx_documentos_estado           ON documentos(estado_verificacion);
CREATE INDEX IF NOT EXISTS idx_empleados_area              ON empleados(area);
CREATE INDEX IF NOT EXISTS idx_audit_logs_fecha            ON audit_logs(fecha);
CREATE INDEX IF NOT EXISTS idx_doc_versiones_documento_id  ON documento_versiones(documento_id);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE clientes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cartera           ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores       ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones      ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados         ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs        ENABLE ROW LEVEL SECURITY;

-- FORCE RLS: aplica también al superusuario (útil en Insforge)
ALTER TABLE clientes           FORCE ROW LEVEL SECURITY;
ALTER TABLE transacciones      FORCE ROW LEVEL SECURITY;
ALTER TABLE cartera            FORCE ROW LEVEL SECURITY;
ALTER TABLE proveedores        FORCE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones       FORCE ROW LEVEL SECURITY;
ALTER TABLE empleados          FORCE ROW LEVEL SECURITY;
ALTER TABLE documentos         FORCE ROW LEVEL SECURITY;
ALTER TABLE ordenes_produccion FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs         FORCE ROW LEVEL SECURITY;

-- Función helper: lee el rol activo desde la sesión actual
CREATE OR REPLACE FUNCTION current_app_role()
RETURNS TEXT LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('app.current_user_role', true), 'ANON');
$$;

-- ── CLIENTES ──
DROP POLICY IF EXISTS clientes_select ON clientes;
CREATE POLICY clientes_select ON clientes FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS clientes_insert ON clientes;
CREATE POLICY clientes_insert ON clientes FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS clientes_update ON clientes;
CREATE POLICY clientes_update ON clientes FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'CFO'));

-- ── TRANSACCIONES ──
DROP POLICY IF EXISTS transacciones_select ON transacciones;
CREATE POLICY transacciones_select ON transacciones FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS transacciones_insert ON transacciones;
CREATE POLICY transacciones_insert ON transacciones FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO'));

-- ── CARTERA ──
DROP POLICY IF EXISTS cartera_select ON cartera;
CREATE POLICY cartera_select ON cartera FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS cartera_insert ON cartera;
CREATE POLICY cartera_insert ON cartera FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS cartera_update ON cartera;
CREATE POLICY cartera_update ON cartera FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'CFO'));

-- ── PROVEEDORES ──
DROP POLICY IF EXISTS proveedores_select ON proveedores;
CREATE POLICY proveedores_select ON proveedores FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS proveedores_insert ON proveedores;
CREATE POLICY proveedores_insert ON proveedores FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS proveedores_update ON proveedores;
CREATE POLICY proveedores_update ON proveedores FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'CFO'));

-- ── COTIZACIONES ──
DROP POLICY IF EXISTS cotizaciones_select ON cotizaciones;
CREATE POLICY cotizaciones_select ON cotizaciones FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS cotizaciones_insert ON cotizaciones;
CREATE POLICY cotizaciones_insert ON cotizaciones FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS cotizaciones_update ON cotizaciones;
CREATE POLICY cotizaciones_update ON cotizaciones FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'CFO'));

DROP POLICY IF EXISTS cotizaciones_delete ON cotizaciones;
CREATE POLICY cotizaciones_delete ON cotizaciones FOR DELETE
  USING (current_app_role() = 'ADMIN');

-- ── EMPLEADOS ──
DROP POLICY IF EXISTS empleados_select ON empleados;
CREATE POLICY empleados_select ON empleados FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'RRHH', 'CFO', 'COO'));

DROP POLICY IF EXISTS empleados_insert ON empleados;
CREATE POLICY empleados_insert ON empleados FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'RRHH'));

DROP POLICY IF EXISTS empleados_update ON empleados;
CREATE POLICY empleados_update ON empleados FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'RRHH'));

-- ── DOCUMENTOS ──
DROP POLICY IF EXISTS documentos_select ON documentos;
CREATE POLICY documentos_select ON documentos FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO', 'RRHH', 'COO'));

DROP POLICY IF EXISTS documentos_insert ON documentos;
CREATE POLICY documentos_insert ON documentos FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'RRHH'));

DROP POLICY IF EXISTS documentos_update ON documentos;
CREATE POLICY documentos_update ON documentos FOR UPDATE
  USING (current_app_role() IN ('ADMIN', 'RRHH'));

DROP POLICY IF EXISTS documentos_delete ON documentos;
CREATE POLICY documentos_delete ON documentos FOR DELETE
  USING (current_app_role() = 'ADMIN');

-- ── ÓRDENES DE PRODUCCIÓN ──
DROP POLICY IF EXISTS produccion_select ON ordenes_produccion;
CREATE POLICY produccion_select ON ordenes_produccion FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'COO', 'CFO'));

DROP POLICY IF EXISTS produccion_insert ON ordenes_produccion;
CREATE POLICY produccion_insert ON ordenes_produccion FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'COO'));

-- ── AUDIT LOGS ──
DROP POLICY IF EXISTS audit_logs_select ON audit_logs;
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT
  USING (current_app_role() IN ('ADMIN', 'CFO', 'RRHH', 'COO'));

DROP POLICY IF EXISTS audit_logs_insert ON audit_logs;
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT
  WITH CHECK (current_app_role() IN ('ADMIN', 'CFO', 'RRHH', 'COO'));

-- ─────────────────────────────────────────────────────────────
-- VISTAS ANALÍTICAS
-- ─────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW view_cartera_mora AS
  SELECT id, nombre, contacto, email, cartera_pendiente, ultimo_pago
  FROM clientes
  WHERE estado = 'Mora' AND cartera_pendiente > 0;

CREATE OR REPLACE VIEW view_ausentismo_hoy AS
  SELECT id, nombre, cargo, area, asistencia_estado, asistencia_checkin
  FROM empleados
  WHERE asistencia_estado IN ('Ausente', 'Licencia');

CREATE OR REPLACE VIEW view_documentos_pendientes AS
  SELECT id, nombre, departamento, responsable, estado_verificacion, fecha_modificacion
  FROM documentos
  WHERE estado_verificacion IN ('Chequeo Neural', 'Pendiente Verificación');

CREATE OR REPLACE VIEW view_produccion_activa AS
  SELECT id, producto, cantidad, cliente, estado, prioridad,
         eficiencia_estimada, operador_asignado, fecha_entrega
  FROM ordenes_produccion
  WHERE estado <> 'Despachado';

CREATE OR REPLACE VIEW view_empleados_documentos_vencidos AS
  SELECT id, nombre, cargo, area, documentos_vencidos
  FROM empleados
  WHERE array_length(documentos_vencidos, 1) > 0;

-- ─────────────────────────────────────────────────────────────
-- DATOS INICIALES
-- ─────────────────────────────────────────────────────────────

-- Usuarios ERP
INSERT INTO usuarios (id, nombre, email, cargo, rol, avatar_initials, permisos) VALUES
  ('U-01', 'Andrés Cepeda',  'a.cepeda@tapasel.co', 'Director General Administrativo',      'ADMIN', 'AC', ARRAY['panel','finanzas','rrhh','documentos','produccion','configuracion']),
  ('U-02', 'Alex Mercer',    'a.mercer@tapasel.co', 'Director Financiero CFO',               'CFO',   'AM', ARRAY['panel','finanzas','rrhh','documentos','produccion']),
  ('U-03', 'Sofía Vega',     's.vega@tapasel.co',   'Directora de Talento Humano RR.HH.',    'RRHH',  'SV', ARRAY['panel','rrhh','documentos','produccion']),
  ('U-04', 'Alex Chen',      'a.chen@tapasel.co',   'Director de Operaciones COO',           'COO',   'CO', ARRAY['panel','produccion','documentos'])
ON CONFLICT (id) DO NOTHING;

-- Clientes
INSERT INTO clientes (id, nombre, contacto, email, telefono, cartera_pendiente, total_comprado, estado, ultimo_pago) VALUES
  ('C-4410',       'Titan Corp',                      'Juan Sebastian Gomez',   'jsgomez@titancorp.com',            '3154483922', 12800000,  145000000,  'Mora',   '2026-04-12'),
  ('C-1200',       'Apex Manufacturing',              'Elena Maria Restrepo',   'elena.restrepo@apex.co',           '3004523912', 42500000,  382000000,  'Mora',   '2026-03-30'),
  ('C-1102',       'HeavyMech S.A.',                  'Carlos Arturo Toro',     'carlos.toro@heavymech.co',         '3127712399', 0,         98000000,   'Al día', '2026-05-22'),
  ('C-5582',       'Industrias Metalicas del Aburra', 'Santiago Alvarez',       's.alvarez@metalicasaburra.com.co', '3216692233', 15400000,  210000000,  'Mora',   '2026-04-05'),
  ('C-8012',       'Logistica Nova',                  'Diana Carolina Uribe',   'diana.uribe@novalogistics.com',    '3103328811', 0,         89000000,   'Al día', '2026-05-21'),
  ('C-9040',       'Constructora Conconcreto',        'Andrés Felipe Sierra',   'asierra@conconcreto.com',          '3051184422', 0,         640000000,  'Al día', '2026-05-25'),
  ('901552312-3',  'COMERCIALIZADORA VENTUS S.A.S.',  'Juan Pérez',             'contacto@ventus.com.co',           '3184456677', 0,         25000000,   'Al día', '2026-03-25'),
  ('901441832-5',  'MAS LIGHT SOLAR S.A.S.',          'Pedro Gómez',            'gomez@maslightsolar.co',           '3112233445', 0,         45000000,   'Al día', '2026-01-27'),
  ('900885621-2',  'INVERSIONES E HOSE S.A.S',        'Carlos Hose',            'carlos@inversioneshose.com',       '3004455667', 0,         12000000,   'Al día', '2026-04-08')
ON CONFLICT (id) DO NOTHING;

-- Transacciones
INSERT INTO transacciones (id, fecha, descripcion, tipo, categoria, monto, estado, cliente_id, proveedor_id, responsable) VALUES
  ('REC-2931', '2026-05-28', 'Pago Parcial Factura #1021 - Constructora Conconcreto',              'Ingreso', 'Facturación',       35000000, 'Pagado',   'C-9040', NULL,     'Agente de Finanzas'),
  ('REC-2930', '2026-05-27', 'Abono Servicio Logístico - Logistica Nova',                         'Ingreso', 'Servicio Técnico',  12500000, 'Pagado',   'C-8012', NULL,     'Diana Carolina Uribe'),
  ('EGR-8520', '2026-05-24', 'CP-8520 • [CXP] Siderúrgica del Pacífico S.A. • Placas Metálicas', 'Egreso',  'Materia Prima',     4250000,  'Pagado',   NULL,     'V-9821', 'Elena Rodríguez'),
  ('REC-2929', '2026-05-23', 'Pago de Mineral de Acero pendiente de cobro - Titan Corp',          'Ingreso', 'Venta de Producto', 12800000, 'Pendiente','C-4410', NULL,     'Agente de Finanzas'),
  ('EGR-8519', '2026-05-22', 'CP-8519 • [CXP] Aceros Bogotá S.A. • Cortadoras Laminadoras',      'Egreso',  'Materia Prima',     8120500,  'Pendiente', NULL,    'V-1102', 'David Vance'),
  ('EGR-8518', '2026-05-21', 'Alquiler mensual de Oficina Corporativa Bloque A',                  'Egreso',  'Arrendamiento',     15000000, 'Pagado',   NULL,     NULL,     'Alex Mercer'),
  ('EGR-8517', '2026-05-20', 'Licencia de Software Vertex Analytics Inteligente',                 'Egreso',  'Software',          1100000,  'Pendiente', NULL,    'V-7723', 'Agente Analítico'),
  ('REC-2928', '2026-05-18', 'Suscripción Trimestral Platino - Industrias Metalicas del Aburra',  'Ingreso', 'Facturación',       15400000, 'Pendiente','C-5582', NULL,     'Agente de Finanzas')
ON CONFLICT (id) DO NOTHING;

-- Cartera (CxC)
INSERT INTO cartera (id, fecha, cliente_id, cliente_nombre, factura, cree, valor_mercancia, iva, retencion, total_a_pagar, abono, rc_abono, rc_cancelacion, fecha_pago, medio_pago, estado) VALUES
  ('CAR-001', '2026-01-27', '901552312-3', 'COMERCIALIZADORA VENTUS S.A.S.', '4945', 7865.556, 655463,  124538, 16386.58, 763614, 0, '', '22638', '2026-03-25', 'TRANSFERENCIA', 'Liquidado'),
  ('CAR-002', '2026-01-27', '901441832-5', 'MAS LIGHT SOLAR S.A.S.',         '4946', 324,      27000,   5130,   0,        32130,  0, '', '22463', '2026-01-27', 'TRANSFERENCIA', 'Liquidado'),
  ('CAR-003', '2026-01-27', '901441832-5', 'MAS LIGHT SOLAR S.A.S.',         '4947', 1694.4,   141200,  26828,  0,        168028, 0, '', '22462', '2026-01-27', 'TRANSFERENCIA', 'Liquidado'),
  ('CAR-004', '2026-01-27', '900885621-2', 'INVERSIONES E HOSE S.A.S',       '4948', 6720,     560000,  106400, 0,        666400, 0, '', '22685', '2026-04-08', 'TRANSFERENCIA', 'Liquidado')
ON CONFLICT (id) DO NOTHING;

-- Proveedores (CxP)
INSERT INTO proveedores (id, fecha, proveedor_nombre, factura, valor_mercancia, iva, retencion, total_a_pagar, comprobante_egreso, cheque_no, fecha_cancelado, estado) VALUES
  ('PROV-001', '2026-01-14', 'RECYA S.A.S.',                    '88179',  1891000, 359290, 47275,  2203015, '18004', 'TRANSFERENCIA',    '2026-01-14', 'Cancelado'),
  ('PROV-002', '2026-01-22', 'FERRETERIA EL HOGAR S.A.S.',      '55738',  1272689, 241811, 31817,  1482683, '',      '',                 '',           'Pendiente'),
  ('PROV-003', '2026-01-23', 'EQUIPO ELECTRICO LS LG LTDA',     '15218',  4998497, 949714, 124962, 5823249, '18070', 'TRANSFERENCIA',    '2026-04-23', 'Cancelado'),
  ('PROV-004', '2026-01-22', 'S.I SEGURIDAD INDUSTRIAL S.A.S.', '135764', 371200,  70528,  0,      441728,  '',      '',                 '',           'Pendiente'),
  ('PROV-005', '2026-01-22', 'S.I SEGURIDAD INDUSTRIAL S.A.S.', '135776', 163200,  31008,  0,      194208,  '',      '',                 '',           'Pendiente'),
  ('PROV-006', '2026-01-23', 'AGENCIAS NACIONALES',             '25219',  149500,  28405,  0,      177905,  '17998', 'TRANSFERENCIA',    '2026-03-17', 'Cancelado'),
  ('PROV-007', '2026-01-24', 'ELECTRICIDAD GERYALPE S.A.S.',    '5766',   752101,  142899, 18803,  876198,  '18109', 'CRUCE DE CUENTAS', '2026-05-14', 'Cancelado'),
  ('PROV-008', '2026-01-27', 'MAQUIPOS S.A.S.',                 '48903',  176470,  33529,  0,      209999,  '17970', 'TRANSFERENCIA',    '2026-03-03', 'Cancelado')
ON CONFLICT (id) DO NOTHING;

-- Cotizaciones
INSERT INTO cotizaciones (id, fecha, cotizacion_no, empresa, cliente_nombre, ingeniero, referencia_obra, direccion, subtotal, iva, total, firma_digital_representante, firma_digital_cliente, fecha_firma_representante) VALUES
  ('COT-101', '2026-02-16', 'COT-2026-0045', 'Tapasel S.A.S.', 'Sebastián Urrego', 'Andrés Delgado',
   'Transformador de potencia / Planta central', 'Carrera 40 # 43- 50 Medellín',
   3408000, 647520, 4055520, 'Andrés Delgado (Gerente Técnico)', '', '2026-02-16')
ON CONFLICT (id) DO NOTHING;

INSERT INTO cotizaciones_items (id, cotizacion_id, referencia, descripcion, unidad, cantidad, valor_unitario, valor_total) VALUES
  ('ITEM-COT101-1', 'COT-101', 'TRANS',
   'Transformador de corriente para media tensión con relación 10/5A, 17.5 KV clase 0,5s burden 2,5VA, marca RYMEL.',
   'un', 1, 2728000, 2728000),
  ('ITEM-COT101-2', 'COT-101', 'INSTALACION',
   'Retiro de transformador existente en obra y acople del nuevo transformador de corriente que reemplazará el existente, incluye barraje y conexionado en bornes secundarios.',
   'un', 1, 680000, 680000)
ON CONFLICT (id) DO NOTHING;

-- Empleados
INSERT INTO empleados (id, nombre, cargo, area, estado, email, telefono, fecha_ingreso, salario, asistencia_checkin, asistencia_estado, documentos_vencidos) VALUES
  ('EMP-0402', 'Elena Rodríguez', 'Arq. Líder de Sistemas e Integraciones',    'Ingeniería',     'Activo',  'e.rodriguez@tapasel.com.co', '3049102488', '2022-03-15', 8500000,  '08:02 AM', 'Presente', '{}'),
  ('EMP-1092', 'David Vance',     'Gerente Operacional y Logístico',           'Logística',      'Activo',  'd.vance@tapasel.com.co',     '3118223910', '2021-11-01', 7200000,  '08:10 AM', 'Presente', ARRAY['Contrato Laboral V2.4 (Firma Pendiente)','Certificado de Alturas']),
  ('EMP-0881', 'Sonia Park',      'Especialista en RR.HH. y Bienestar',       'RR.HH.',         'Licencia','s.park@tapasel.com.co',      '3204481022', '2023-01-20', 4500000,  '--:--',    'Licencia', '{}'),
  ('EMP-0552', 'Tobias Weber',    'Supervisor Principal de Planta',            'Logística',      'Activo',  't.weber@tapasel.com.co',     '3051421099', '2024-02-10', 5200000,  '08:15 AM', 'Presente', ARRAY['Certificado Médico Ocupacional Vencido']),
  ('EMP-1402', 'Marcus Chen',     'Director Ejecutivo de Operaciones (COO)',   'Administración', 'Activo',  'm.chen@tapasel.com.co',      '3184422912', '2020-05-10', 12000000, '08:02 AM', 'Presente', '{}'),
  ('EMP-0994', 'Sarah Jenkins',   'Coordinadora de Seguridad Industrial',      'RR.HH.',         'Activo',  's.jenkins@tapasel.com.co',   '3174558299', '2023-08-11', 4800000,  '08:15 AM', 'Presente', '{}'),
  ('EMP-0312', 'Liam Foster',     'Ingeniero de Automatización Planta',        'Ingeniería',     'Activo',  'l.foster@tapasel.com.co',    '3015523912', '2024-05-01', 6000000,  '--:--',    'Ausente',  '{}'),
  ('EMP-0111', 'Alex Mercer',     'Director Financiero (CFO)',                 'Administración', 'Activo',  'a.mercer@tapasel.com.co',    '3127812933', '2020-04-01', 11500000, '07:55 AM', 'Presente', '{}')
ON CONFLICT (id) DO NOTHING;

-- Documentos
INSERT INTO documentos (id, nombre, departamento, fecha_creacion, fecha_modificacion, responsable, version, tamano, estado_verificacion, tipo_documental) VALUES
  ('DOC-9921', 'Q3_Tax_Adjustment_V4.pdf',      'Finanzas',       '2026-05-20', '2026-05-28 14:32', 'Alex Mercer',          'v4.0.0',   '1.2 MB', 'Verificado',           'Financia'),
  ('DOC-8519', 'Contrato_Laboral_Estandar_v2.pdf','RRHH',          '2026-05-02', '2026-05-26 11:20', 'Sonia Park',           'v2.4.1',   '450 KB', 'Verificado',           'Contrato'),
  ('DOC-7721', 'Bitacora_Logistica_Diaria.xlsx', 'Operaciones',    '2026-05-27', '2026-05-28 18:00', 'David Vance',          'v1.2.0-b', '3.4 MB', 'Chequeo Neural',       'Legal'),
  ('DOC-4482', 'Afiliacion_Seguro_Salud.docx',   'RRHH',           '2026-05-15', '2026-05-21 09:15', 'Sarah Jenkins',        'v1.0.8',   '210 KB', 'Verificado',           'Certificado'),
  ('DOC-3329', 'Codigo_Etica_Empresa_2024.pdf',  'Administración', '2024-01-10', '2024-01-10 08:00', 'Marcus Chen',          'v3.0.0',   '1.5 MB', 'Verificado',           'Legal'),
  ('DOC-3001', 'Anexo_Legal_B_Alianza.pdf',      'Legal',          '2026-05-12', '2026-05-28 15:20', 'Agente de Documentos', 'v2.1.0',   '820 KB', 'Pendiente Verificación','Legal')
ON CONFLICT (id) DO NOTHING;

-- Historial de versiones
INSERT INTO documento_versiones (documento_id, version, fecha, usuario, comentario, orden) VALUES
  ('DOC-9921', 'v4.0.0',   '2026-05-28 14:32', 'Alex Mercer',       'Aprobado por Junta Ejecutiva. Conciliado.',                      1),
  ('DOC-9921', 'v3.2.0',   '2026-05-24 10:12', 'Agente de Finanzas','Revisado por legal de auditoría.',                              2),
  ('DOC-9921', 'v3.0.0',   '2026-05-20 08:30', 'Diana Uribe',       'Envío preliminar de impuestos.',                                3),
  ('DOC-8519', 'v2.4.1',   '2026-05-26 11:20', 'Sonia Park',        'Actualización de cláusula de exclusividad según reforma.',      1),
  ('DOC-8519', 'v2.0.0',   '2026-05-02 09:00', 'Marcus Chen',       'Formato inicial de contratos 2026.',                           2),
  ('DOC-7721', 'v1.2.0-b', '2026-05-28 18:00', 'David Vance',       'Sincronización automatizada n8n diaria.',                      1),
  ('DOC-4482', 'v1.0.8',   '2026-05-21 09:15', 'Sarah Jenkins',     'Documento oficial EPS radicado.',                              1),
  ('DOC-3329', 'v3.0.0',   '2024-01-10 08:00', 'Administración',    'Constitución inicial de políticas de Medellín SAS.',           1),
  ('DOC-3001', 'v2.1.0',   '2026-05-28 15:20', 'Auditor Jefe',      'Cambió la cláusula de indemnización penal.',                   1);

-- Órdenes de Producción
INSERT INTO ordenes_produccion (id, producto, cantidad, cliente, fecha_creacion, fecha_entrega, estado, prioridad, eficiencia_estimada, operador_asignado) VALUES
  ('OP-981', 'Tarjeta Controladora de Temperatura IoT T-500',   1200, 'TermoControles Industriales S.A.S.', '2026-05-20', '2026-06-05', 'Ensamble PCB', 'Alta',  94, 'Carlos Restrepo'),
  ('OP-982', 'Módulo Neural RF Transmisión de Datos v3',        800,  'Satelital Telemetría de Colombia',   '2026-05-22', '2026-06-12', 'Soldadura',    'Alta',  96, 'Diana Montoya'),
  ('OP-983', 'Tarjeta Reguladora Monofásica de Potencia v1',    2500, 'Compañía Eléctrica del Norte S.A.',  '2026-05-24', '2026-06-25', 'Diseño',       'Media', 91, 'Mateo Urrego'),
  ('OP-984', 'Placa Base Microcontrolador Tasa SmartHome v4',   1500, 'Domótica TASA Sucursal Medellín',    '2026-05-25', '2026-06-10', 'Calidad QA',   'Media', 98, 'Helena Pérez'),
  ('OP-985', 'Módulo Amplificador Audio de Alta Fidelidad HIFI', 400, 'TASA Custom Systems Ltda.',          '2026-05-18', '2026-05-29', 'Despachado',   'Baja',  99, 'Andrés Cepeda')
ON CONFLICT (id) DO NOTHING;

-- Alertas
INSERT INTO alertas (id, tipo, titulo, descripcion, accion_label, destino) VALUES
  ('A-01', 'warning',         'Acción Prioritaria de Cartera',  '3 clientes tienen pagos vencidos en cartera por más de 15 días (apex, titan, metalicas).', 'Notificar Agente Finanzas', 'finanzas'),
  ('A-02', 'bolt',            'Eficiencia de Planta',           'Cuello de botella detectado en transportador del Área B Medellín Planta.',                  'Re-enrutar Lógica',        'produccion'),
  ('A-03', 'tips_and_updates','Oportunidad de Suministros',     'Descuento del 18% por volumen de acero disponible en el proveedor Siderúrgica Medellín.',   'Aprobar Compra',           'finanzas')
ON CONFLICT (id) DO NOTHING;

-- Audit Logs iniciales
INSERT INTO audit_logs (id, agente_nombre, fecha, hora, detalle, nivel) VALUES
  ('L-001', 'Agente de Finanzas',   '2026-05-28', '15:22', 'Enlaza y genera 5 recibos con firma digital asociados a la Factura #2931.',                              'Éxito'),
  ('L-002', 'Agente de Auditoría',  '2026-05-28', '15:10', 'Completó el escaneo de seguridad semanal en el repositorio documental. 0 amenazas encontradas.',         'Éxito'),
  ('L-003', 'Agente de RR.HH.',     '2026-05-28', '14:24', 'Actualizó perfiles de cumplimiento de 12 empleados y generó 3 alertas por contratos a vencer.',          'Info'),
  ('L-004', 'Agente de Documentos', '2026-05-28', '13:22', 'Clasificó automáticamente 24 archivos obsoletos. Mapeados a la carpeta histórico.',                      'Info'),
  ('L-005', 'Agente Analítico',     '2026-05-28', '12:20', 'Identificó un nuevo patrón de optimización en el Área B sobre logística de transporte de acero.',        'Info'),
  ('L-006', 'Agente de Finanzas',   '2026-05-28', '10:15', 'Divergencia menor detectada por retraso de pago del cliente Apex Manufacturing.',                        'Alerta')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- VERIFICACIÓN (ejecutar después del COMMIT para confirmar)
-- ─────────────────────────────────────────────────────────────
SELECT 'usuarios'          AS tabla, COUNT(*) AS registros FROM usuarios
UNION ALL SELECT 'clientes',          COUNT(*) FROM clientes
UNION ALL SELECT 'transacciones',     COUNT(*) FROM transacciones
UNION ALL SELECT 'cartera',           COUNT(*) FROM cartera
UNION ALL SELECT 'proveedores',       COUNT(*) FROM proveedores
UNION ALL SELECT 'cotizaciones',      COUNT(*) FROM cotizaciones
UNION ALL SELECT 'cotizaciones_items',COUNT(*) FROM cotizaciones_items
UNION ALL SELECT 'empleados',         COUNT(*) FROM empleados
UNION ALL SELECT 'documentos',        COUNT(*) FROM documentos
UNION ALL SELECT 'doc_versiones',     COUNT(*) FROM documento_versiones
UNION ALL SELECT 'ordenes_produccion',COUNT(*) FROM ordenes_produccion
UNION ALL SELECT 'alertas',           COUNT(*) FROM alertas
UNION ALL SELECT 'audit_logs',        COUNT(*) FROM audit_logs
ORDER BY tabla;
