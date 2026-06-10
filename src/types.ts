export interface Cliente {
  id: string;
  nombre: string;
  contacto: string;
  email: string;
  telefono: string;
  carteraPendiente: number;
  totalComprado: number;
  estado: 'Al día' | 'Mora' | 'Inactivo';
  ultimoPago: string;
}

export interface Transaccion {
  id: string;
  fecha: string;
  descripcion: string;
  tipo: 'Ingreso' | 'Egreso';
  categoria: string;
  monto: number;
  estado: 'Pagado' | 'Pendiente' | 'Rechazado';
  clienteId?: string;
  proveedorId?: string;
  responsable: string;
  documentorPdf?: string;
}

export interface Empleado {
  id: string;
  nombre: string;
  cargo: string;
  area: 'Ingeniería' | 'Logística' | 'RR.HH.' | 'Administración' | 'Ventas';
  estado: 'Activo' | 'Licencia' | 'Inactivo';
  email: string;
  telefono: string;
  fechaIngreso: string;
  salario: number;
  asistenciaHoy?: {
    checkIn: string;
    checkOut?: string;
    estado: 'Presente' | 'Retraso' | 'Ausente' | 'Licencia';
  };
  documentosVencidos: string[];
}

export interface Documento {
  id: string;
  nombre: string;
  departamento: string;
  fechaCreacion: string;
  fechaModificacion: string;
  responsable: string;
  version: string;
  tamano: string;
  estadoVerificacion: 'Verificado' | 'Chequeo Neural' | 'Pendiente Verificación';
  tipoDocumental: 'Contrato' | 'Incapacidad' | 'Vacaciones' | 'Certificado' | 'Legal' | 'Financia';
  historialVersiones: Array<{
    version: string;
    fecha: string;
    usuario: string;
    comentario: string;
  }>;
}

export interface Mensaje {
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface Alerta {
  id: string;
  tipo: 'warning' | 'bolt' | 'tips_and_updates';
  titulo: string;
  descripcion: string;
  accionLabel: string;
  destino: string;
}

export interface AuditLog {
  id: string;
  agenteName: 'Agente de Finanzas' | 'Agente de RR.HH.' | 'Agente de Documentos' | 'Agente Analítico' | 'Agente de Auditoría';
  fecha: string;
  hora: string;
  detalle: string;
  nivel: 'Info' | 'Alerta' | 'Éxito';
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  cargo: string;
  rol: 'ADMIN' | 'CFO' | 'RRHH' | 'COO';
  avatarInitials: string;
  permisos: string[];
}

export interface OrdenProduccion {
  id: string;
  producto: string;
  cantidad: number;
  cliente: string;
  fechaCreacion: string;
  fechaEntrega: string;
  estado: 'Diseño' | 'Ensamble PCB' | 'Soldadura' | 'Calidad QA' | 'Despachado';
  prioridad: 'Alta' | 'Media' | 'Baja';
  eficienciaEstimada: number; // percentage
  operadorAsignado: string;
}

export interface CarteraRecord {
  id: string;
  fecha: string;
  clienteId: string;
  clienteNombre: string;
  factura: string;
  cree: number;
  valorMercancia: number;
  iva: number;
  retencion: number;
  totalAPagar: number;
  abono: number;
  rcAbono: string;
  rcCancelacion: string;
  fechaPago: string;
  medioPago: string;
  estado: 'Pendiente' | 'Abonado' | 'Liquidado';
}

export interface ProveedorRecord {
  id: string;
  fecha: string;
  proveedorNombre: string;
  factura: string;
  valorMercancia: number;
  iva: number; // 19%
  retencion: number; // 2.5%
  totalAPagar: number;
  comprobanteEgreso: string;
  chequeNo: string;
  fechaCancelado: string;
  estado: 'Pendiente' | 'Cancelado';
}

export interface CotizacionItem {
  id: string;
  referencia: string;
  descripcion: string;
  unidad: string;
  cantidad: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface CotizacionRecord {
  id: string;
  fecha: string;
  cotizacionNo: string;
  empresa: string;
  clienteNombre: string;
  ingeniero: string;
  referenciaObra: string;
  direccion: string;
  items: CotizacionItem[];
  subtotal: number;
  iva: number; // 19%
  total: number;
  firmaDigitalRepresentante: string; // Base64 dataURL or name
  firmaDigitalCliente: string; // Base64 dataURL or name
  fechaFirmaRepresentante?: string;
  fechaFirmaCliente?: string;
}


