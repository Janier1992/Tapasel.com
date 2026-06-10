import { Cliente, Transaccion, Empleado, Documento, Alerta, AuditLog, Usuario, OrdenProduccion, CarteraRecord, ProveedorRecord, CotizacionRecord } from './types';

export const CLIENTES_INICIALES: Cliente[] = [
  {
    id: "C-1102",
    nombre: "HeavyMech S.A.",
    contacto: "Carlos Arturo Toro",
    email: "carlos.toro@heavymech.co",
    telefono: "3127712399",
    carteraPendiente: 0,
    totalComprado: 98000000,
    estado: 'Al día',
    ultimoPago: "2026-05-22"
  }
];

export const TRANSACCIONES_INICIALES: Transaccion[] = [
  {
    id: "REC-2930",
    fecha: "2026-05-27",
    descripcion: "Abono Servicio Logístico - Logistica Nova",
    tipo: "Ingreso",
    categoria: "Servicio Técnico",
    monto: 12500000,
    estado: "Pagado",
    clienteId: "C-8012",
    responsable: "Diana Carolina Uribe"
  }
];

export const EMPLEADOS_INICIALES: Empleado[] = [
  {
    id: "EMP-0402",
    nombre: "Elena Rodríguez",
    cargo: "Arq. Líder de Sistemas e Integraciones",
    area: "Ingeniería",
    estado: "Activo",
    email: "e.rodriguez@tapasel.com.co",
    telefono: "3049102488",
    fechaIngreso: "2022-03-15",
    salario: 8500000,
    asistenciaHoy: { checkIn: "08:02 AM", estado: "Presente" },
    documentosVencidos: []
  }
];

export const DOCUMENTOS_INICIALES: Documento[] = [
  {
    id: "DOC-9921",
    nombre: "Q3_Tax_Adjustment_V4.pdf",
    departamento: "Finanzas",
    fechaCreacion: "2026-05-20",
    fechaModificacion: "2026-05-28 14:32",
    responsable: "Alex Mercer",
    version: "v4.0.0",
    tamano: "1.2 MB",
    estadoVerificacion: "Verificado",
    tipoDocumental: "Financia",
    historialVersiones: [
      { version: "v4.0.0", fecha: "2026-05-28 14:32", usuario: "Alex Mercer", comentario: "Aprobado por Junta Ejecutiva. Conciliado." }
    ]
  }
];

export const AUDIT_LOGS_INICIALES: AuditLog[] = [
  {
    id: "L-001",
    agenteName: "Agente de Finanzas",
    fecha: "2026-05-28",
    hora: "15:22",
    detalle: "Enlaza y genera 5 recibos con firma digital asociados a la Factura #2931.",
    nivel: "Éxito"
  }
];

export const ALERTAS_INICIALES: Alerta[] = [
  {
    id: "A-01",
    tipo: "warning",
    titulo: "Acción Prioritaria de Cartera",
    descripcion: "Pagos vencidos detectados en cartera (titan, apex).",
    accionLabel: "Notificar Agente Finanzas",
    destino: "finanzas"
  }
];

export const ERP_USUARIOS: Usuario[] = [
  {
    id: "U-01",
    nombre: "Andrés Cepeda",
    email: "a.cepeda@tapasel.co",
    cargo: "Administrador general",
    rol: "ADMIN",
    avatarInitials: "AC",
    permisos: ["panel", "finanzas", "rrhh", "documentos", "produccion", "configuracion"]
  },
  {
    id: "U-02",
    nombre: "Alex Mercer",
    email: "a.mercer@tapasel.co",
    cargo: "Director Ejecutivo",
    rol: "CFO",
    avatarInitials: "AM",
    permisos: ["panel", "finanzas", "documentos"]
  },
  {
    id: "U-03",
    nombre: "Sofía Vega",
    email: "s.vega@tapasel.co",
    cargo: "Gestión Talento Humano",
    rol: "RRHH",
    avatarInitials: "SV",
    permisos: ["panel", "rrhh", "produccion", "documentos"]
  },
  {
    id: "U-04",
    nombre: "Alex Chen",
    email: "a.chen@tapasel.co",
    cargo: "Director de Operaciones",
    rol: "COO",
    avatarInitials: "CO",
    permisos: ["panel", "produccion", "documentos"]
  }
];

export const ORDENES_PRODUCCION_INICIALES: OrdenProduccion[] = [
  {
    id: "OP-981",
    producto: "Tarjeta Controladora de Temperatura IoT T-500",
    cantidad: 1200,
    cliente: "TermoControles Industriales S.A.S.",
    fechaCreacion: "2026-05-20",
    fechaEntrega: "2026-06-05",
    estado: "Ensamble PCB",
    prioridad: "Alta",
    eficienciaEstimada: 94,
    operadorAsignado: "Carlos Restrepo"
  }
];

export const CARTERA_INICIAL: CarteraRecord[] = [
  {
    id: "CAR-001",
    fecha: "2026-01-27",
    clienteId: "901552312-3",
    clienteNombre: "COMERCIALIZADORA VENTUS S.A.S.",
    factura: "4945",
    cree: 7865.556,
    valorMercancia: 655463,
    iva: 124538,
    retencion: 16386.58,
    totalAPagar: 763614,
    abono: 0,
    rcAbono: "",
    rcCancelacion: "22638",
    fechaPago: "2026-03-25",
    medioPago: "TRANSFERENCIA",
    estado: "Liquidado"
  }
];

export const PROVEEDORES_INICIALES: ProveedorRecord[] = [
  {
    id: "PROV-001",
    fecha: "2026-01-14",
    proveedorNombre: "RECYA S.A.S.",
    factura: "88179",
    valorMercancia: 1891000,
    iva: 359290,
    retencion: 47275,
    totalAPagar: 2203015,
    comprobanteEgreso: "18004",
    chequeNo: "TRANSFERENCIA",
    fechaCancelado: "2026-01-14",
    estado: "Cancelado"
  }
];

export const COTIZACIONES_INICIALES: CotizacionRecord[] = [
  {
    id: "COT-101",
    fecha: "2026-02-16",
    cotizacionNo: "COT-2026-0045",
    empresa: "Tapasel S.A.S.",
    clienteNombre: "Sebastián Urrego",
    ingeniero: "Andrés Delgado",
    referenciaObra: "Transformador de potencia / Planta central",
    direccion: "Carrera 40 # 43- 50 Medellín",
    items: [
      {
        id: "ITEM-1",
        referencia: "TRANS",
        descripcion: "Transformador de corriente para media tensión con relación 10/5A, 17.5 KV clase 0,5s burden 2,5VA, marca RYMEL.",
        unidad: "un",
        cantidad: 1,
        valorUnitario: 2728000,
        valorTotal: 2728000
      }
    ],
    subtotal: 2728000,
    iva: 518320,
    total: 3246320,
    firmaDigitalRepresentante: "Andrés Delgado (Gerente Técnico)",
    firmaDigitalCliente: "",
    fechaFirmaRepresentante: "2026-02-16"
  }
];
