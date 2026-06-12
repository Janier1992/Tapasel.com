import toast from 'react-hot-toast';
import React, { useState, useEffect } from 'react';
import {   
  Users, 
  Search, 
  Plus, 
  Grid, 
  List, 
  Briefcase, 
  MapPin, 
  Phone, 
  Mail, 
  DollarSign, 
  Calendar, 
  ArrowRight, 
  AlertCircle,
  Clock,
  ShieldAlert,
  Award,
  BookOpen,
  FolderLock,
  CheckCircle,
  Printer,
  Download,
  CreditCard,
  Landmark,
  ShieldCheck,
  UserPlus,
  QrCode,
  Smartphone,
  Activity,
  FileText,
  TrendingUp,
  Bot,
  Zap,
  Sparkles,
  TrendingDown,
  Building,
  Scale,
  Receipt,
  Check,
  FileSpreadsheet,
  BarChart3
, Eye, Pencil, Trash, FileDown , Eye, Pencil, Trash, FileDown } from 'lucide-react';
import { GenericViewModal, GenericEditModal } from './GenericModals';
import { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';
import { apiDelete } from '../services/backendClient';

import { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';
import toast from 'react-hot-toast';
import { Empleado, Transaccion } from '../types';
import { formatCurrencyCOP as formatCurrency } from '../lib/formatters';

interface RRHHTabProps {
  empleados: Empleado[];
  onOpenNewEmployee: () => void;
  onPostAiAssistantQuery: (prompt: string) => void;
  onAddEmployee?: (employee: Empleado) => void;
  onUpdateEmployee?: (employee: Empleado) => void;
  onDeleteEmployee?: (id: string) => void;
  transacciones?: Transaccion[];
  onAddTransaction?: (tx: Omit<Transaccion, 'id'>) => void;
  activeTab: string;
}

export default function RRHHTab({
  empleados,
  onOpenNewEmployee,
  onPostAiAssistantQuery,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  transacciones = [],
  onAddTransaction,
  activeTab
}: RRHHTabProps) {
  const [genericViewRecord, setGenericViewRecord] = useState<any>(null);
  const [genericEditConfig, setGenericEditConfig] = useState<{record: any, table: string} | null>(null);

  const handleGenericDelete = async (id: string, table: string, stateSetter: Function | null, currentState: any[] | null) => {
    if(confirm('¿Estás seguro de eliminar este registro?')) {
      try {
        await apiDelete(table, id);
        if (currentState && stateSetter) {
          stateSetter(currentState.filter((item: any) => item.id !== id));
        } else {
          window.location.reload();
        }
        toast.success('Registro eliminado');
      } catch (err: any) {
        toast.error('Error al eliminar: ' + err.message);
      }
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState<'All' | 'Ingeniería' | 'Logística' | 'RR.HH.' | 'Administración' | 'Ventas'>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Activo' | 'Licencia'>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedEmp, setSelectedEmp] = useState<Empleado | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'directorio' | 'asistencia' | 'novedades' | 'nomina' | 'dashboard'>('directorio');

  // Edit Employee Form state
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editEmpNombre, setEditEmpNombre] = useState('');
  const [editEmpCargo, setEditEmpCargo] = useState('');
  const [editEmpEmail, setEditEmpEmail] = useState('');
  const [editEmpTelefono, setEditEmpTelefono] = useState('');
  const [editEmpSalario, setEditEmpSalario] = useState(0);

  const handleEditEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId || !onUpdateEmployee) return;
    const empToUpdate = empleados.find(emp => emp.id === editingEmpId);
    if (empToUpdate) {
      onUpdateEmployee({
        ...empToUpdate,
        nombre: editEmpNombre,
        cargo: editEmpCargo,
        email: editEmpEmail,
        telefono: editEmpTelefono,
        salario: editEmpSalario
      });
      toast.success(`Colaborador ${editEmpNombre} actualizado correctamente.`);
      setEditingEmpId(null);
    }
  };
  const [showQuickEmpForm, setShowQuickEmpForm] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [quickCargo, setQuickCargo] = useState('');
  const [quickArea, setQuickArea] = useState<'Ingeniería' | 'Logística' | 'RR.HH.' | 'Administración' | 'Ventas'>('Ingeniería');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickSalario, setQuickSalario] = useState('3500000');

  const handleQuickAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName || !quickCargo || !quickEmail) return;

    if (onAddEmployee) {
      onAddEmployee({
        id: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
        nombre: quickName,
        cargo: quickCargo,
        area: quickArea,
        estado: 'Activo',
        email: quickEmail,
        telefono: '315' + (Math.floor(Math.random() * 9000000) + 1000000).toString(),
        fechaIngreso: new Date().toISOString().split('T')[0],
        salario: Number(quickSalario),
        asistenciaHoy: { checkIn: "08:00 AM", estado: "Presente" },
        documentosVencidos: []
      });
      // reset
      setQuickName('');
      setQuickCargo('');
      setQuickEmail('');
      setShowQuickEmpForm(false);
      toast.success(`Colaborador ${quickName} ingresado con éxito en el sistema general ERP.`);
    }
  };

  useEffect(() => {
    const tabMap: Record<string, typeof activeSubTab> = {
      'rrhh-empleados': 'directorio',
      'rrhh-horarios': 'asistencia',
      'rrhh-novedades': 'novedades',
      'rrhh-nomina': 'nomina',
      'rrhh-dashboard': 'dashboard',
    };
    
    if (activeTab in tabMap) {
      setActiveSubTab(tabMap[activeTab]);
    }
  }, [activeTab]);

  // Interactive detail tabs for individual employee drawer
  const [empDetailTab, setEmpDetailTab] = useState<'expediente' | 'historias' | 'novedades'>('expediente');

  // Employee Career, Salary & Disciplinary dossiers history
  const [employeeDossiers, setEmployeeDossiers] = useState<Record<string, {
    historialSalarial: Array<{ fecha: string, salario: number, motivo: string }>;
    historialLaboral: Array<{ fecha: string, cargo: string, area: string, logro: string }>;
    historialDisciplinario: Array<{ fecha: string, tipo: 'Amonestación' | 'Llamado de Atención' | 'Felicitación' | 'Capacitación', descripcion: string, estado: string }>;
  }>>({
    'EMP-0402': {
      historialSalarial: [
        { fecha: '2022-03-15', salario: 7500000, motivo: 'Sueldo de Enganche' },
        { fecha: '2024-01-10', salario: 8500000, motivo: 'Ajuste Anual de Desempeño' }
      ],
      historialLaboral: [
        { fecha: '2022-03-15', cargo: 'Arq. de Sistemas Junior', area: 'Ingeniería', logro: 'Integración básica de línea de ensamble.' },
        { fecha: '2024-02-01', cargo: 'Arq. Líder de Sistemas e Integraciones', area: 'Ingeniería', logro: 'Definición del protocolo de comunicación del ERP industrial.' }
      ],
      historialDisciplinario: [
        { fecha: '2023-09-12', tipo: 'Capacitación', descripcion: 'Certificación en Ciberseguridad de Sistemas OT', estado: 'Completado' },
        { fecha: '2025-02-21', tipo: 'Felicitación', descripcion: 'Liderar migración sin interrupción en Planta Medellín', estado: 'Vigente' }
      ]
    },
    'EMP-1092': {
      historialSalarial: [
        { fecha: '2021-11-01', salario: 6400000, motivo: 'Sueldo de Enganche' },
        { fecha: '2023-05-15', salario: 7200000, motivo: 'Ascenso a Gerencia Operativa' }
      ],
      historialLaboral: [
        { fecha: '2021-11-01', cargo: 'Supervisor de Logística de Distribución', area: 'Logística', logro: 'Reducción de tiempos de entrega en un 12.5%.' },
        { fecha: '2023-05-15', cargo: 'Gerente Operacional y Logístico', area: 'Logística', logro: 'Re-diseño de las rutas nacionales logísticas.' }
      ],
      historialDisciplinario: [
        { fecha: '2024-07-08', tipo: 'Llamado de Atención', descripcion: 'Omisión menor en reporte de inventario físico mensual', estado: 'Superado' },
        { fecha: '2025-01-10', tipo: 'Capacitación', descripcion: 'Especialización en Distribución de Cadena de Suministro', estado: 'Completado' }
      ]
    }
  });

  // Dynamic novelties registry
  const [novedades, setNovedades] = useState<Array<{
    id: string;
    empId: string;
    empNombre: string;
    tipo: 'Incapacidad' | 'Vacaciones' | 'Permiso' | 'Licencia' | 'Bonificación' | 'Deducción';
    fechaInicio: string;
    fechaFin: string;
    monto?: number;
    descripcion: string;
    estadoLog: 'Aprobado' | 'Pendiente' | 'Auditado';
    usuarioAuditor: string;
    fechaRegistro: string;
  }>>([
    { id: "NOV-102", empId: "EMP-1092", empNombre: "David Vance", tipo: "Vacaciones", fechaInicio: "2026-06-01", fechaFin: "2026-06-12", descripcion: "Vacaciones acumuladas período 2024-2025", estadoLog: "Aprobado", usuarioAuditor: "Sonia Park", fechaRegistro: "2026-05-20" },
    { id: "NOV-103", empId: "EMP-0881", empNombre: "Sonia Park", tipo: "Licencia", fechaInicio: "2026-05-15", fechaFin: "2026-06-15", descripcion: "Licencia de maternidad remunerada", estadoLog: "Aprobado", usuarioAuditor: "Marcus Chen", fechaRegistro: "2026-05-10" },
    { id: "NOV-104", empId: "EMP-0552", empNombre: "Tobias Weber", tipo: "Incapacidad", fechaInicio: "2026-05-27", fechaFin: "2026-05-29", descripcion: "Incapacidad médica general (gripal)", estadoLog: "Auditado", usuarioAuditor: "Sonia Park", fechaRegistro: "2026-05-27" },
    { id: "NOV-105", empId: "EMP-0402", empNombre: "Elena Rodríguez", tipo: "Bonificación", fechaInicio: "2026-05-28", fechaFin: "2026-05-28", monto: 1150000, descripcion: "Fondo especial de productividad e innovación metalmecánica", estadoLog: "Aprobado", usuarioAuditor: "Marcus Chen", fechaRegistro: "2026-05-28" }
  ]);

  // Attendance live events tracking for UI (registro entrada/salida)
  const [attendanceLogs, setAttendanceLogs] = useState<Array<{
    id: string;
    empId: string;
    nombre: string;
    evento: 'Entrada' | 'Salida';
    hora: string;
    metodo: 'QR Móvil' | 'Tarjeta RFID' | 'Terminal Biométrico';
    estado: string;
  }>>([
    { id: "ATT-102", empId: "EMP-0402", nombre: "Elena Rodríguez", evento: "Entrada", hora: "08:02 AM", metodo: "Terminal Biométrico", estado: "Presente" },
    { id: "ATT-103", empId: "EMP-1092", nombre: "David Vance", evento: "Entrada", hora: "08:10 AM", metodo: "QR Móvil", estado: "Presente" },
    { id: "ATT-104", empId: "EMP-0552", nombre: "Tobias Weber", evento: "Entrada", hora: "08:15 AM", metodo: "Tarjeta RFID", estado: "Presente" },
    { id: "ATT-105", empId: "EMP-1402", nombre: "Marcus Chen", evento: "Entrada", hora: "08:02 AM", metodo: "Terminal Biométrico", estado: "Presente" }
  ]);

  // Form states for attendance check-ins
  const [selectedAttendEmpId, setSelectedAttendEmpId] = useState<string>('EMP-0402');
  const [clockInTime, setClockInTime] = useState<string>('08:00');
  const [clockMethod, setClockMethod] = useState<'QR Móvil' | 'Tarjeta RFID' | 'Terminal Biométrico'>('Terminal Biométrico');
  const [isQrScanning, setIsQrScanning] = useState<boolean>(false);
  const [biometricScanningSuccess, setBiometricScanningSuccess] = useState<string | null>(null);

  // Form states for adding news
  const [noveltyFormEmp, setNoveltyFormEmp] = useState<string>('EMP-0402');
  const [noveltyFormType, setNoveltyFormType] = useState<'Incapacidad' | 'Vacaciones' | 'Permiso' | 'Licencia' | 'Bonificación' | 'Deducción'>('Permiso');
  const [noveltyFormStart, setNoveltyFormStart] = useState<string>('2026-05-28');
  const [noveltyFormEnd, setNoveltyFormEnd] = useState<string>('2026-05-29');
  const [noveltyFormAmount, setNoveltyFormAmount] = useState<number>(0);
  const [noveltyFormDesc, setNoveltyFormDesc] = useState<string>('');

  // Conversational intelligence chatbot inside RRHH Tab
  const [chatbotQuery, setChatbotQuery] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'ia' | 'usuario', text: string }>>([
    { sender: 'ia', text: "¡Hola! Bienvenido al Agente IA de Nómina. Puedo responder tus consultas sobre costos laborales, ausentismo, horas extras, vencimientos de contrato o anomalías salariales.\n\nEscribe tu consulta o haz clic en alguno de los botones de consulta sugerida a continuación." }
  ]);

  // Interactive dynamic payroll statistics data for employees
  const [payrollData, setPayrollData] = useState<Record<string, {
    horasOrdinarias: number;
    horasExtra: number;
    permisos: number;
    inasistencias: number;
  }>>({
    'EMP-01': { horasOrdinarias: 80, horasExtra: 10, permisos: 1, inasistencias: 0 },
    'CFO-01': { horasOrdinarias: 80, horasExtra: 0, permisos: 0, inasistencias: 0 }, // If CFO exists
    'EMP-02': { horasOrdinarias: 76, horasExtra: 2, permisos: 1, inasistencias: 1 },
    'EMP-03': { horasOrdinarias: 80, horasExtra: 12, permisos: 0, inasistencias: 0 },
  });

  const [selectedPayrollId, setSelectedPayrollId] = useState<string>('EMP-01');
  const [isProcessingPayroll, setIsProcessingPayroll] = useState<boolean>(false);
  const [invoiceDownloadSuccess, setInvoiceDownloadSuccess] = useState<string | null>(null);

  // Prepopulated or dynamically registered bank & social security information for payroll registration
  const [employeeBankData, setEmployeeBankData] = useState<Record<string, {
    banco: string;
    tipoCuenta: string;
    numCuenta: string;
    eps: string;
    arl: string;
    pension: string;
  }>>({
    'EMP-01': { banco: 'Bancolombia', tipoCuenta: 'Ahorros', numCuenta: '912-402831-29', eps: 'SURA EPS', arl: 'SURA Seguros (Clase II)', pension: 'Protección' },
    'CFO-01': { banco: 'Banco de Bogotá', tipoCuenta: 'Corriente', numCuenta: '034-118492-05', eps: 'Sanitas EPS', arl: 'SURA Seguros (Clase I)', pension: 'Porvenir' },
    'EMP-02': { banco: 'Davivienda', tipoCuenta: 'Ahorros', numCuenta: '542-990142-91', eps: 'Sura EPS', arl: 'SURA Seguros (Clase III)', pension: 'Colfondos' },
    'EMP-03': { banco: 'Bancolombia', tipoCuenta: 'Ahorros', numCuenta: '109-224859-10', eps: 'Nueva EPS', arl: 'SURA Seguros (Clase II)', pension: 'Protección' },
    'EMP-0402': { banco: 'Bancolombia', tipoCuenta: 'Ahorros', numCuenta: '304-910248-22', eps: 'SURA EPS', arl: 'SURA Seguros (Clase I)', pension: 'Protección' },
    'EMP-1092': { banco: 'Banco de Occidente', tipoCuenta: 'Corriente', numCuenta: '211-822391-45', eps: 'Compensar EPS', arl: 'SURA Seguros (Clase II)', pension: 'Colpatria' },
    'EMP-0881': { banco: 'Davivienda', tipoCuenta: 'Ahorros', numCuenta: '320-448102-36', eps: 'Colmedica', arl: 'SURA Seguros (Clase I)', pension: 'Colfondos' },
    'EMP-0552': { banco: 'Nequi', tipoCuenta: 'Ahorros', numCuenta: '305-142109-90', eps: 'Famisanar', arl: 'SURA Seguros (Clase III)', pension: 'Porvenir' },
  });

  // Toggle registration form state inside the RRHH module
  const [isPayrollRegisterOpen, setIsPayrollRegisterOpen] = useState(false);
  const [pRegName, setPRegName] = useState('');
  const [pRegCargo, setPRegCargo] = useState('');
  const [pRegSalario, setPRegSalario] = useState<number>(3100000);
  const [pRegArea, setPRegArea] = useState<'Ingeniería' | 'Logística' | 'RR.HH.' | 'Administración' | 'Ventas'>('Ingeniería');
  const [pRegEmail, setPRegEmail] = useState('');
  const [pRegTelefono, setPRegTelefono] = useState('');
  const [pRegBanco, setPRegBanco] = useState('Bancolombia');
  const [pRegTipoCuenta, setPRegTipoCuenta] = useState('Ahorros');
  const [pRegNumCuenta, setPRegNumCuenta] = useState('');
  const [pRegEps, setPRegEps] = useState('SURA EPS');
  const [pRegArl, setPRegArl] = useState('SURA Seguros (Clase II)');
  const [pRegPension, setPRegPension] = useState('Protección');

  const getEmployeePayroll = (empId: string) => {
    return payrollData[empId] || {
      horasOrdinarias: 80,
      horasExtra: 4,
      permisos: 0,
      inasistencias: 0
    };
  };

  const updatePayrollValue = (empId: string, field: 'horasOrdinarias' | 'horasExtra' | 'permisos' | 'inasistencias', delta: number) => {
    setPayrollData(prev => {
      const current = prev[empId] || {
        horasOrdinarias: 80,
        horasExtra: 4,
        permisos: 0,
        inasistencias: 0
      };
      let maxVal = 40;
      if (field === 'horasOrdinarias') maxVal = 80;
      const newVal = Math.min(maxVal, Math.max(0, current[field] + delta));
      return {
        ...prev,
        [empId]: {
          ...current,
          [field]: newVal
        }
      };
    });
  };

  // Filter staff
  const filteredStaff = empleados.filter(emp => {
    const matchesSearch = emp.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          emp.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          emp.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesArea = areaFilter === 'All' || emp.area === areaFilter;
    const matchesStatus = statusFilter === 'All' || emp.estado === statusFilter;

    return matchesSearch && matchesArea && matchesStatus;
  });

  // Formato de moneda centralizado en src/lib/formatters.ts (evita duplicación).
  return (
    <div className="space-y-8 animate-fade-in">
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-900 font-bold tracking-wider block mb-1">Personal Total</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-bold text-slate-900 tabular-nums">842</h2>
            <span className="text-emerald-600 text-xs font-semibold">+4.2% mes</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-primary h-full rounded-full" style={{ width: '842px', maxWidth: '85%' }} />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-900 font-bold tracking-wider block mb-1">Tasa de Ausentismo</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-bold text-slate-900 tabular-nums">2.1%</h2>
            <span className="text-emerald-600 text-xs font-semibold">Óptima</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Promedio Regional Industria: 3.5%</span>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-900 font-bold tracking-wider block mb-1">Retención de Talento</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-bold text-slate-900 tabular-nums">94.8%</h2>
            <span className="text-slate-500 text-xs">Estable</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-brand-primary h-full rounded-full" style={{ width: '94.8%' }} />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-850/30 p-5 rounded-xl flex flex-col justify-between shadow-sm">
          <div>
            <span className="font-mono text-[10px] uppercase text-blue-400 tracking-widest block mb-1 font-bold">PULSO DE RR.HH. IA</span>
            <p className="text-xs text-slate-200 leading-tight">Alerta preventiva de fuga de talento: Bajo riesgo de rotación este mes.</p>
          </div>
          <button 
            onClick={() => onPostAiAssistantQuery("Generar informe IA y análisis preventivo sobre la rotación de talento y deserción en Planta Medellín.")}
            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 hover:underline font-bold self-start mt-2 block uppercase border-none bg-transparent cursor-pointer"
          >
            Generar Informe IA
          </button>
        </div>

      </section>

      {/* Split layout: main directory left (8/12), live asistencia right (4/12) */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Directory left */}
        <div className={`col-span-12 ${selectedEmp ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-6`}>
          
          <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap scrollbar-none gap-1">
            <button 
              onClick={() => setActiveSubTab('directorio')}
              className={`pb-4 px-3 font-display font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'directorio' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              💼 Directorio & Expedientes
            </button>
            <button 
              onClick={() => setActiveSubTab('asistencia')}
              className={`pb-4 px-3 font-display font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'asistencia' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              ⏱️ Control Horario
            </button>
            <button 
              onClick={() => setActiveSubTab('novedades')}
              className={`pb-4 px-3 font-display font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'novedades' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              📢 Novedades
            </button>
            <button 
              onClick={() => setActiveSubTab('nomina')}
              className={`pb-4 px-3 font-display font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'nomina' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              💳 Nómina
            </button>
            <button 
              onClick={() => setActiveSubTab('dashboard')}
              className={`pb-4 px-3 font-display font-bold text-xs md:text-sm border-b-2 transition-all cursor-pointer ${
                activeSubTab === 'dashboard' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              📊 Costos & Contabilidad
            </button>
            {/* Cumplimiento and Organigrama subtabs removed */}
          </div>

          {/* Subtab Content: Directorio */}
          {activeSubTab === 'directorio' && (
            <div className="space-y-6">
              
              {/* Collapsible Form for Quick Employee Onboarding */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div 
                  onClick={() => setShowQuickEmpForm(!showQuickEmpForm)}
                  className="p-5 flex justify-between items-center bg-slate-50 border-b border-slate-100 cursor-pointer hover:bg-slate-100/60 transition-colors"
                >
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-sm flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      Alta Rápida de Colaborador (Ficha de Empleo)
                    </h3>
                    <p className="text-xs text-slate-500">Registra un nuevo colaborador, asignando su cargo base, salario y correo corporativo.</p>
                  </div>
                  <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm border-none cursor-pointer">
                    {showQuickEmpForm ? 'Ocultar Formulario' : 'Desplegar Formulario'}
                  </button>
                </div>

                {showQuickEmpForm && (
                  <form onSubmit={handleQuickAddEmployee} className="p-6 bg-white gap-4 grid grid-cols-1 md:grid-cols-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Nombre Completo</label>
                      <input 
                        type="text"
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="Ej. Juan Carlos Pérez"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Cargo de Oficina o Planta</label>
                      <input 
                        type="text"
                        value={quickCargo}
                        onChange={(e) => setQuickCargo(e.target.value)}
                        placeholder="Ej. Operador Línea SMT"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Área o Departamento</label>
                      <select 
                        value={quickArea}
                        onChange={(e: any) => setQuickArea(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                      >
                        <option value="Ingeniería">Ingeniería</option>
                        <option value="Logística">Logística</option>
                        <option value="RR.HH.">Servicios y RR.HH.</option>
                        <option value="Administración">Administración</option>
                        <option value="Ventas">Ventas y Marketing</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Correo Electrónico</label>
                      <input 
                        type="email"
                        value={quickEmail}
                        onChange={(e) => setQuickEmail(e.target.value)}
                        placeholder="ejemplo@corporativo.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-700">Salario Mensual Base (COP)</label>
                      <input 
                        type="number"
                        value={quickSalario}
                        onChange={(e) => setQuickSalario(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:bg-white outline-none"
                        required
                      />
                    </div>
                    <div className="flex items-end">
                      <button 
                        type="submit"
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all uppercase tracking-wider h-9 border-none cursor-pointer"
                      >
                        Dar Alta de Empleado
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* Toolbar */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-all"
                    placeholder="Buscar empleados por nombre, cargo, ID..."
                  />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <select 
                    value={areaFilter}
                    onChange={(e: any) => setAreaFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-xs text-slate-850 text-slate-800 rounded-lg p-2 flex-grow md:flex-grow-0 outline-none focus:border-blue-550"
                  >
                    <option value="All">Todos las Áreas</option>
                    <option value="Ingeniería">Ingeniería</option>
                    <option value="Logística">Logística</option>
                    <option value="RR.HH.">Talento Humano</option>
                    <option value="Administración">Administración</option>
                  </select>

                  <select 
                    value={statusFilter}
                    onChange={(e: any) => setStatusFilter(e.target.value)}
                    className="bg-slate-100 border border-slate-200 text-xs text-slate-850 text-slate-800 rounded-lg p-2 outline-none focus:border-blue-550"
                  >
                    <option value="All">Todos los Estados</option>
                    <option value="Activo">Activos</option>
                    <option value="Licencia">Licencia</option>
                  </select>

                  <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className={`p-1 rounded cursor-pointer ${viewMode === 'grid' ? 'bg-slate-200 text-blue-600' : 'text-slate-400'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')}
                      className={`p-1 rounded cursor-pointer ${viewMode === 'list' ? 'bg-slate-200 text-blue-600' : 'text-slate-400'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={onOpenNewEmployee}
                    className="p-2 border-none bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                    title="Simular Alta Empleado"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden md:inline">Vincular</span>
                  </button>
                </div>
              </div>

              {/* Grid block layout render */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredStaff.map((emp) => (
                    <div 
                      key={emp.id}
                      onClick={() => setSelectedEmp(emp)}
                      className={`p-5 bg-white border rounded-xl hover:border-brand-primary/50 cursor-pointer group transition-all duration-200 flex flex-col justify-between shadow-sm ${
                        selectedEmp?.id === emp.id ? 'border-brand-primary bg-brand-primary/5' : 'border-slate-200'
                      }`}
                    >
                      <div>
                        {/* Card Header profile layout */}
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center font-display font-bold text-brand-primary shrink-0 relative overflow-hidden group-hover:border-brand-primary transition-all">
                            <span>{emp.nombre.split(' ').map(n=>n[0]).join('')}</span>
                            
                            {/* Operational Status Dot tag */}
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                              <div className={`w-1.5 h-1.5 rounded-full ${emp.estado === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            </div>
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="text-sm font-semibold text-slate-800 truncate group-hover:text-brand-primary transition-colors">{emp.nombre}</h4>
                            <p className="text-xs text-slate-500 truncate">{emp.cargo}</p>
                            <span className="inline-block mt-1 font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                              {emp.area}
                            </span>
                          </div>
                        </div>
                      </div>
 
                      {/* Display Warnings / Documents Alerts */}
                      {emp.documentosVencidos.length > 0 && (
                        <div className="mt-4 p-2 bg-rose-50 border border-rose-100 rounded flex items-center gap-2 text-rose-700 text-[10px] font-medium font-mono">
                          <ShieldAlert className="w-4 h-4 shrink-0" />
                          <span className="truncate">{emp.documentosVencidos.length} pendiente(s) de firma</span>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredStaff.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-xs text-slate-500">
                      No se encontraron empleados con los criterios de búsqueda.
                    </div>
                  )}
                </div>
              ) : (
                /* List view structure layout */
                <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto text-xs shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                      <tr>
                        <th className="p-4 pl-6">Nombre Empleado</th>
                        <th className="p-4">Cargo / Área</th>
                        <th className="p-4">Contacto</th>
                        <th className="p-4">Ingreso</th>
                        <th className="p-4">Salario COP</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-800">
                      {filteredStaff.map((emp) => (
                        <tr 
                          key={emp.id} 
                          onClick={() => setSelectedEmp(emp)}
                          className="hover:bg-slate-55 hover:bg-slate-50 cursor-pointer"
                        >
                          <td className="p-4 pl-6 font-semibold">
                            <div className="flex items-center gap-3">
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.estado === 'Activo' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                              <span>{emp.nombre}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div>
                              <span>{emp.cargo}</span>
                              <span className="text-slate-500 font-mono block text-[9px] uppercase tracking-wider">{emp.area}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-500 font-mono">{emp.email}</td>
                          <td className="p-4 font-mono text-slate-500">{emp.fechaIngreso}</td>
                          <td className="p-4 font-mono font-bold text-brand-primary">{formatCurrency(emp.salario)}</td>
                            </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}

          {/* Subtab Content: Control Horario (Asistencia) */}
          {activeSubTab === 'asistencia' && (
            <div className="space-y-6">
              {/* Header section card */}
              <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 p-6 rounded-xl text-white shadow-sm border border-zinc-800/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-400" />
                      Control Horario, Registro de Turnos y Dispositivos de Asistencia
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Control de ingresos de planta en vivo, reloj de turnos rotativos e integración para escaneo móvil y validadores biométricos.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">LECTORES EN LÍNEA: 24/24</span>
                  </div>
                </div>
              </div>

              {/* Attendance Workspace - Clean Structured Layout */}
              <div className="space-y-6">
                
                {/* Simulated hardware clock & terminal toolbar */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                      <h4 className="font-display font-bold text-slate-900 text-xs uppercase tracking-wide flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-brand-primary" />
                        Terminal de Fichaje Virtual (Simulador)
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">Simule el ingreso o salida de planta de cualquier colaborador en tiempo real.</p>
                    </div>
                    
                    {/* Control Form inline */}
                    <div className="flex flex-wrap gap-2.5 items-end text-xs w-full lg:w-auto">
                      <div className="space-y-1 flex-1 min-w-[150px]">
                        <label className="text-[9px] text-slate-400 font-mono block">Colaborador:</label>
                        <select 
                          value={selectedAttendEmpId}
                          onChange={(e) => setSelectedAttendEmpId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-sans font-medium text-xs text-slate-800 outline-none focus:border-brand-primary"
                        >
                          {empleados.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-slate-400 font-mono block">Hora:</label>
                        <input 
                          type="time" 
                          value={clockInTime}
                          onChange={(e) => setClockInTime(e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-900 outline-none"
                        />
                      </div>

                      <div className="space-y-1 min-w-[120px]">
                        <label className="text-[9px] text-slate-400 font-mono block">Lector Ingress:</label>
                        <select 
                          value={clockMethod}
                          onChange={(e) => setClockMethod(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-sans text-xs text-slate-800 outline-none"
                        >
                          <option value="Terminal Biométrico">Lector Biométrico</option>
                          <option value="QR Móvil">Código QR Móvil</option>
                          <option value="Tarjeta RFID">Tarjeta RFID Planta</option>
                        </select>
                      </div>

                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            const targetEmp = empleados.find(emp => emp.id === selectedAttendEmpId);
                            if (!targetEmp) return;
                            const idStr = `ATT-${Math.floor(Math.random() * 90000) + 10000}`;
                            const nowText = clockInTime + (Number(clockInTime.split(':')[0]) >= 12 ? ' PM' : ' AM');
                            
                            const newLog = {
                              id: idStr,
                              empId: selectedAttendEmpId,
                              nombre: targetEmp.nombre,
                              evento: 'Entrada' as const,
                              hora: nowText,
                              metodo: clockMethod,
                              estado: 'Presente'
                            };

                            setAttendanceLogs(prev => [newLog, ...prev]);
                            targetEmp.asistenciaHoy = { checkIn: nowText, estado: 'Presente' };
                            
                            setPayrollData(prev => {
                              const curr = prev[selectedAttendEmpId] || { horasOrdinarias: 80, horasExtra: 0, permisos: 0, inasistencias: 0 };
                              return {
                                ...prev,
                                [selectedAttendEmpId]: {
                                  ...curr,
                                  horasOrdinarias: Math.min(80, curr.horasOrdinarias + 8)
                                }
                              }
                            });

                            setBiometricScanningSuccess(targetEmp.nombre);
                            setTimeout(() => setBiometricScanningSuccess(null), 3000);
                          }}
                          className="py-2 px-3 bg-brand-primary text-white font-sans font-bold text-xs rounded hover:opacity-95 transition-all border-none cursor-pointer"
                        >
                          Fichar Entrada
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            const targetEmp = empleados.find(emp => emp.id === selectedAttendEmpId);
                            if (!targetEmp) return;
                            const idStr = `ATT-${Math.floor(Math.random() * 90000) + 10000}`;
                            const nowText = clockInTime + (Number(clockInTime.split(':')[0]) >= 12 ? ' PM' : ' AM');

                            const newLog = {
                              id: idStr,
                              empId: selectedAttendEmpId,
                              nombre: targetEmp.nombre,
                              evento: 'Salida' as const,
                              hora: nowText,
                              metodo: clockMethod,
                              estado: 'Presente'
                            };

                            setAttendanceLogs(prev => [newLog, ...prev]);
                            if (targetEmp.asistenciaHoy) {
                              targetEmp.asistenciaHoy.checkOut = nowText;
                            } else {
                              targetEmp.asistenciaHoy = { checkIn: '08:00 AM', checkOut: nowText, estado: 'Presente' };
                            }
                            toast.success(`¡Marcación de Salida guardada para ${targetEmp.nombre}!`);
                          }}
                          className="py-2 px-3 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 font-sans font-bold text-xs rounded transition-all cursor-pointer"
                        >
                          Fichar Salida
                        </button>
                      </div>
                    </div>
                  </div>

                  {biometricScanningSuccess && (
                    <div className="p-3 mt-3 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-900 flex items-center gap-1.5 text-[10px] font-mono animate-fade-in">
                      <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                      <span><b>Marcación Conciliada:</b> {biometricScanningSuccess} registrado en Planta Medellín. 8 horas acumuladas en planilla.</span>
                    </div>
                  )}
                </div>

                {/* Structured Attendance Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <span className="font-display font-semibold text-xs text-slate-900">Planilla General de Horarios y Turnos Activos</span>
                    <span className="text-[10px] font-mono text-slate-500">{empleados.length} Colaboradores Monitoreados</span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                        <tr>
                          <th className="p-3 pl-4">Colaborador</th>
                          <th className="p-3">Área</th>
                          <th className="p-3">Entrada (Check-In)</th>
                          <th className="p-3">Salida (Check-Out)</th>
                          <th className="p-3">Estado</th>
                          <th className="p-3">Último Método Lector</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                        {empleados.map(emp => {
                          const log = attendanceLogs.find(l => l.empId === emp.id);
                          return (
                            <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 pl-4 font-semibold text-slate-900">
                                <span>{emp.nombre}</span>
                                <span className="text-[10px] text-slate-400 block font-normal font-mono">{emp.id} • {emp.cargo}</span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono">{emp.area}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">{emp.asistenciaHoy?.checkIn || '--:--'}</td>
                              <td className="p-3 font-mono font-bold text-slate-900">{emp.asistenciaHoy?.checkOut || '--:--'}</td>
                              <td className="p-3">
                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                                  emp.asistenciaHoy?.estado === 'Presente' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  emp.asistenciaHoy?.estado === 'Retraso' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-rose-50 text-rose-700 border border-rose-100'
                                }`}>
                                  {emp.asistenciaHoy?.estado || 'Ausente'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 font-mono text-[10px]">{log?.metodo || 'Tarjeta RFID Planta'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Subtab Content: Gestión de Novedades */}
          {activeSubTab === 'novedades' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-gradient-to-tr from-zinc-950 to-indigo-950 p-6 rounded-xl text-white shadow-sm border border-zinc-800/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-indigo-400" />
                      Hojas de Novedades, Ausentismos y Recargos Salariales
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Defina e imite novedades como incapacidades médicas, vacaciones periodontales, bonos extra, ausencias justificadas y recargos nocturnos imputados de ley.</p>
                  </div>
                  <span className="text-xs font-mono bg-white/10 px-3 py-1 rounded font-bold border border-white/10 uppercase">Habilitar Firma Electrónica EPS</span>
                </div>
              </div>

              {/* Novelty Grid Setup */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Form to submit a new novelty */}
                <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-display font-semibold text-slate-900 text-xs flex items-center gap-1.5 uppercase">
                      <UserPlus className="w-4 h-4 text-brand-primary" />
                      Radicación de Novedad Laboral
                    </h4>
                    <p className="text-[10px] text-slate-400">El registro quedará de inmediato auditado en la bitácora e impactará los cálculos de liquidación y nómina quincenal.</p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      const targetEmp = empleados.find(emp => emp.id === noveltyFormEmp);
                      if (!targetEmp) return;

                      const noveltyId = `NOV-${Math.floor(Math.random() * 900) + 100}`;
                      const newNovelty = {
                        id: noveltyId,
                        empId: noveltyFormEmp,
                        empNombre: targetEmp.nombre,
                        tipo: noveltyFormType,
                        fechaInicio: noveltyFormStart,
                        fechaFin: noveltyFormEnd,
                        monto: noveltyFormAmount > 0 ? noveltyFormAmount : undefined,
                        descripcion: noveltyFormDesc || `Registro de ${noveltyFormType} autorizado por gerencia`,
                        estadoLog: 'Aprobado' as const,
                        usuarioAuditor: 'Sonia Park',
                        fechaRegistro: new Date().toISOString().split('T')[0]
                      };

                      // Add to state
                      setNovedades(prev => [newNovelty, ...prev]);

                      // Adapt employee payroll factors automatically
                      setPayrollData(prev => {
                        const curr = prev[noveltyFormEmp] || { horasOrdinarias: 80, horasExtra: 0, permisos: 0, inasistencias: 0 };
                        let updated = { ...curr };
                        
                        if (noveltyFormType === 'Vacaciones') {
                          updated.permisos = curr.permisos + 5;
                        } else if (noveltyFormType === 'Permiso' || noveltyFormType === 'Licencia') {
                          updated.permisos = curr.permisos + 1;
                        } else if (noveltyFormType === 'Incapacidad') {
                          updated.inasistencias = curr.inasistencias + 3;
                        }
                        
                        return {
                          ...prev,
                          [noveltyFormEmp]: updated
                        };
                      });

                      // Reset form
                      setNoveltyFormDesc('');
                      setNoveltyFormAmount(0);

                      toast.success(`¡Novedad radicada con Éxito!\nSe ha generado el folio de auditoría digital ${noveltyId} para ${targetEmp.nombre}.\nEl motor de liquidación automatizado ha recalculado el neto de pago.`);
                    }}
                    className="space-y-3 font-mono text-[11px]"
                  >
                    <div>
                      <label className="text-slate-500 block mb-1">A) Colaborador Beneficiario:</label>
                      <select 
                        value={noveltyFormEmp}
                        onChange={(e) => setNoveltyFormEmp(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-sans font-medium text-xs text-slate-800 outline-none"
                      >
                        {empleados.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.nombre} ({emp.cargo})</option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block mb-1">B) Tipo de Novedad:</label>
                        <select 
                          value={noveltyFormType}
                          onChange={(e) => setNoveltyFormType(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 font-sans text-xs text-slate-800 outline-none"
                        >
                          <option value="Permiso">Permiso Horario</option>
                          <option value="Vacaciones">Vacaciones</option>
                          <option value="Incapacidad">Incapacidad Médica</option>
                          <option value="Licencia">Licencia Remunerada</option>
                          <option value="Bonificación">Bonificación / Estímulo</option>
                          <option value="Deducción">Otros Descuentos</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-500 block mb-1">C) Monto (sólo Bonos/Dcto):</label>
                        <input 
                          type="number"
                          placeholder="Monto en COP"
                          value={noveltyFormAmount}
                          onChange={(e) => setNoveltyFormAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-sans outline-none font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-500 block mb-1">D) Fecha de Inicio:</label>
                        <input 
                          type="date"
                          value={noveltyFormStart}
                          onChange={(e) => setNoveltyFormStart(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-sans outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-slate-500 block mb-1">E) Fecha de Término:</label>
                        <input 
                          type="date"
                          value={noveltyFormEnd}
                          onChange={(e) => setNoveltyFormEnd(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs font-sans outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-500 block mb-1">F) Explicación y Justificación de Soporte (EPS / Radicado):</label>
                      <textarea 
                        rows={2}
                        placeholder="Ingrese diagnósticos, números de resolución EPS o licencias aprobadas por jefatura..."
                        value={noveltyFormDesc}
                        onChange={(e) => setNoveltyFormDesc(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-sans outline-none resize-none text-slate-900"
                        required
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white font-sans font-bold text-xs rounded transition-colors border-none cursor-pointer uppercase tracking-wider"
                    >
                      🚀 Radicar Novedad y Auditar Planilla
                    </button>
                  </form>
                </div>

                {/* Structured Novedades Table */}
                <div className="xl:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <h4 className="font-display font-semibold text-slate-900 text-xs uppercase tracking-wide">Padrón de Novedades Auditadas Activas</h4>
                      <span className="text-[10px] font-mono bg-brand-primary/10 border border-brand-primary/20 text-brand-primary rounded px-2.5 py-0.5 font-bold">{novedades.length} REGISTROS</span>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                          <tr>
                            <th className="p-3 pl-4">Colaborador</th>
                            <th className="p-3">Tipo</th>
                            <th className="p-3">Descripción</th>
                            <th className="p-3">Periodo</th>
                            <th className="p-3 text-right">Monto</th>
                            <th className="p-3">Auditor</th>
                            <th className="p-3">Estado</th>
                            <th className="p-3 text-center">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-800">
                          {novedades.map((nov) => (
                            <tr key={nov.id} className="hover:bg-slate-50 transition-colors font-mono text-[11px]">
                              <td className="p-3 pl-4">
                                <span className="font-sans font-semibold text-slate-900 block">{nov.empNombre}</span>
                                <span className="text-[9px] text-slate-400 block font-normal">{nov.empId}</span>
                              </td>
                              <td className="p-3">
                                <span className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase ${
                                  nov.tipo === 'Incapacidad' ? 'bg-red-50 text-red-700 border border-red-200' :
                                  nov.tipo === 'Vacaciones' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                  nov.tipo === 'Bonificación' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {nov.tipo}
                                </span>
                              </td>
                              <td className="p-3 font-sans text-slate-600 truncate max-w-[130px]" title={nov.descripcion}>
                                {nov.descripcion}
                              </td>
                              <td className="p-3 text-[10px] text-slate-500">{nov.fechaInicio} / {nov.fechaFin}</td>
                              <td className="p-3 text-right font-bold text-slate-900">
                                {nov.monto ? formatCurrency(nov.monto) : '--'}
                              </td>
                              <td className="p-3 text-slate-500 font-sans text-[10px]">{nov.usuarioAuditor}</td>
                              <td className="p-3 text-emerald-600 font-semibold text-[10px]">{nov.estadoLog}</td>
                              <td className="p-3 text-center">
                                <button 
                                  onClick={() => {
                                    setNovedades(prev => prev.filter(n => n.id !== nov.id));
                                    toast.success(`Novedad ${nov.id} removida exitosamente.`);
                                  }}
                                  className="text-rose-600 hover:text-rose-800 font-bold hover:underline cursor-pointer bg-transparent border-none"
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 text-[10px] text-slate-400 border-t border-slate-100 font-sans">
                    💡 <i>Las novedades registradas impactan de forma directa en las deducciones y devengados de nómina.</i>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Subtab Content: Nómina */}
          {activeSubTab === 'nomina' && (
            <div className="space-y-6">
              
              {/* Header card with summary statistics */}
              <div className="bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950 p-6 rounded-xl text-white shadow-sm border border-zinc-800/40">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/[0.08] pb-4 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-brand-primary" />
                      Auditoría y Nómina Consolidada Quincenal
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Control de novedades de planta, horas laboradas, inasistencias registradas y liquidaciones.</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button 
                      onClick={() => setIsPayrollRegisterOpen(!isPayrollRegisterOpen)}
                      className={`px-3 py-2 border font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all outline-none cursor-pointer ${
                        isPayrollRegisterOpen 
                          ? 'bg-brand-primary/30 border-brand-primary text-blue-100 hover:bg-brand-primary/40' 
                          : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                      }`}
                    >
                      <UserPlus className="w-4 h-4 text-brand-primary" />
                      {isPayrollRegisterOpen ? 'Ocultar Inscripción' : 'Inscribir Colaborador (Alta)'}
                    </button>
                    <button 
                      onClick={() => {
                        setIsProcessingPayroll(true);
                        setTimeout(() => {
                          setIsProcessingPayroll(false);
                          const total = empleados.reduce((sum, emp) => {
                            const pay = getEmployeePayroll(emp.id);
                            const quincenaBase = emp.salario / 2;
                            const extraVal = pay.horasExtra * (emp.salario / 240) * 1.25;
                            const dedVal = pay.inasistencias * (emp.salario / 240) * 8;
                            return sum + (quincenaBase + extraVal + 70000 - dedVal - (quincenaBase * 0.08));
                          }, 0);
                          
                          if (onAddTransaction) {
                            onAddTransaction({
                              fecha: new Date().toISOString().split('T')[0],
                              descripcion: "Dispersión quincenal de nóminas operativas y administrativas (Bancolombia)",
                              monto: Math.round(total),
                              tipo: 'Egreso',
                              categoria: 'Nómina Operaria',
                              estado: 'Pagado',
                              responsable: 'Marcus Chen (CFO)'
                            });
                          }
                          
                          toast.success(`¡Nómina Procesada con Éxito!\nSe han generado las pólizas quincenales bajo auditoría digital y se registró automáticamente el Egreso en el Libro Contable General.\nValor total liquidado: ${formatCurrency(total)}\nSe ha transmitido el archivo de dispersión bancaria a BANCOLOMBIA.`);
                        }, 1800);
                      }}
                      disabled={isProcessingPayroll}
                      className="px-4 py-2 border-none bg-brand-primary hover:opacity-90 disabled:opacity-50 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-all outline-none cursor-pointer"
                    >
                      <Clock className={`w-4 h-4 ${isProcessingPayroll ? 'animate-spin' : ''}`} />
                      {isProcessingPayroll ? 'Procesando Pagos...' : 'Consolidar y Liquidar Todo'}
                    </button>
                  </div>
                </div>

                {/* Grid of helper statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 font-mono text-xs">
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">Horas Ordinarias</span>
                    <span className="text-sm font-bold text-brand-primary mt-1 block">
                      {empleados.reduce((sum, e) => sum + getEmployeePayroll(e.id).horasOrdinarias, 0)} Hrs
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">Horas Extra</span>
                    <span className="text-sm font-bold text-amber-400 mt-1 block font-sans">
                      +{empleados.reduce((sum, e) => sum + getEmployeePayroll(e.id).horasExtra, 0)} Hrs
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">Permisos Autorizados</span>
                    <span className="text-sm font-bold text-emerald-400 mt-1 block">
                      {empleados.reduce((sum, e) => sum + getEmployeePayroll(e.id).permisos, 0)}
                    </span>
                  </div>
                  <div className="p-3 bg-white/5 rounded border border-white/10">
                    <span className="text-slate-400 text-[10px] uppercase block">Inasistencias</span>
                    <span className="text-sm font-bold text-rose-400 mt-1 block">
                      {empleados.reduce((sum, e) => sum + getEmployeePayroll(e.id).inasistencias, 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Form (Collapsible) */}
              {isPayrollRegisterOpen && (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!pRegName || !pRegCargo || !pRegNumCuenta) {
                      toast.error("Por favor complete todos los campos requeridos mínimos (Nombre, Puesto/Cargo y Número de Cuenta).");
                      return;
                    }

                    const newId = `EMP-${Math.floor(Math.random() * 9000) + 1000}`;
                    const newEmp = {
                      id: newId,
                      nombre: pRegName,
                      cargo: pRegCargo,
                      area: pRegArea,
                      estado: 'Activo' as const,
                      email: pRegEmail || `${newId.toLowerCase()}@tapasel.com.co`,
                      telefono: pRegTelefono || '3004455881',
                      fechaIngreso: new Date().toISOString().split('T')[0],
                      salario: Number(pRegSalario),
                      asistenciaHoy: { checkIn: "08:00 AM", estado: "Presente" as const },
                      documentosVencidos: [] as string[]
                    };

                    setEmployeeBankData(prev => ({
                      ...prev,
                      [newId]: {
                        banco: pRegBanco,
                        tipoCuenta: pRegTipoCuenta,
                        numCuenta: pRegNumCuenta,
                        eps: pRegEps,
                        arl: pRegArl,
                        pension: pRegPension
                      }
                    }));

                    setPayrollData(prev => ({
                      ...prev,
                      [newId]: {
                        horasOrdinarias: 80,
                        horasExtra: 0,
                        permisos: 0,
                        inasistencias: 0
                      }
                    }));

                    if (onAddEmployee) {
                      onAddEmployee(newEmp);
                    }

                    setSelectedPayrollId(newId);
                    setIsPayrollRegisterOpen(false);

                    // Reset form fields
                    setPRegName('');
                    setPRegCargo('');
                    setPRegSalario(3100050);
                    setPRegEmail('');
                    setPRegTelefono('');
                    setPRegNumCuenta('');
                    
                    toast.success(`¡Inscripción Exitosa!\nEl colaborador ${newEmp.nombre} ha sido inscrito en el sistema de nómina quincenal.\nProceda a liquidar sus haberes.`);
                  }}
                  className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 animate-fade-in text-xs text-slate-700"
                >
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div>
                      <h4 className="font-display font-bold text-sm text-slate-900 flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-brand-primary" />
                        Formulario de Inscripción y Alta de Colaborador para Registro Planilla de Nómina
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Defina las novedades del empleado, su cuenta bancaria de dispersión y afiliaciones contractuales.</p>
                    </div>
                    <span className="text-[10px] bg-slate-100 text-slate-500 font-mono px-2 py-0.5 rounded">TASA S.A.S</span>
                  </div>

                  {/* Grid fields */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Column 1: Datos Personales */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold block border-b border-slate-200 pb-1">
                        1. Datos Personales & Puesto
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Nombre Completo: *</label>
                        <input 
                          type="text"
                          required
                          value={pRegName}
                          onChange={(e) => setPRegName(e.target.value)}
                          placeholder="Ej. Andrés Felipe Restrepo"
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Cargo / Rol en Planta: *</label>
                        <input 
                          type="text"
                          required
                          value={pRegCargo}
                          onChange={(e) => setPRegCargo(e.target.value)}
                          placeholder="Ej. Operador Robot SMT Pick & Place"
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Área Organizacional:</label>
                        <select 
                          value={pRegArea}
                          onChange={(e: any) => setPRegArea(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        >
                          <option value="Ingeniería">Ingeniería (Técnica)</option>
                          <option value="Logística">Logística / Planta</option>
                          <option value="RR.HH.">Talento Humano (RR.HH.)</option>
                          <option value="Administración">Administración</option>
                          <option value="Ventas">Ventas y Cuentas</option>
                        </select>
                      </div>
                    </div>

                    {/* Column 2: Datos Financieros */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold block border-b border-slate-200 pb-1 flex items-center gap-1">
                        <Landmark className="w-3.5 h-3.5 text-brand-primary" />
                        2. Dispersión Contable (Bancos)
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Salario Base Mensual (COP): *</label>
                        <input 
                          type="number"
                          required
                          min={1200000}
                          step={100000}
                          value={pRegSalario}
                          onChange={(e) => setPRegSalario(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Entidad Bancaria:</label>
                        <select 
                          value={pRegBanco}
                          onChange={(e) => setPRegBanco(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        >
                          <option value="Bancolombia">Bancolombia</option>
                          <option value="Davivienda">Davivienda</option>
                          <option value="Banco de Bogotá">Banco de Bogotá</option>
                          <option value="Banco de Occidente">Banco de Occidente</option>
                          <option value="Nequi">Nequi</option>
                          <option value="BBVA Colombia">BBVA Colombia</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="font-semibold text-[10px] text-slate-600">Tipo de Cuenta:</label>
                          <select 
                            value={pRegTipoCuenta}
                            onChange={(e) => setPRegTipoCuenta(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                          >
                            <option value="Ahorros">Ahorros</option>
                            <option value="Corriente">Corriente</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-[10px] text-slate-600">Nº Cuenta: *</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ej. 912-304892-12"
                            value={pRegNumCuenta}
                            onChange={(e) => setPRegNumCuenta(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Column 3: Datos de Afiliaciones */}
                    <div className="space-y-3 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500 font-bold block border-b border-slate-200 pb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        3. Afiliaciones (Seguridad Social)
                      </span>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">E.P.S. (Médica):</label>
                        <select 
                          value={pRegEps}
                          onChange={(e) => setPRegEps(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        >
                          <option value="SURA EPS">SURA EPS</option>
                          <option value="Sanitas EPS">Sanitas EPS</option>
                          <option value="Compensar EPS">Compensar EPS</option>
                          <option value="Nueva EPS">Nueva EPS</option>
                          <option value="Salud Total">Salud Total</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Fondo de Pensiones (AFP):</label>
                        <select 
                          value={pRegPension}
                          onChange={(e) => setPRegPension(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        >
                          <option value="Protección">Protección</option>
                          <option value="Porvenir">Porvenir</option>
                          <option value="Colfondos">Colfondos</option>
                          <option value="Colpensiones">Colpensiones</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="font-semibold text-slate-600">Riesgos Laborales (ARL):</label>
                        <input 
                          type="text"
                          value={pRegArl}
                          onChange={(e) => setPRegArl(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-brand-primary"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Operational fields contact details optionally */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-primary/5 p-3 rounded border border-brand-primary/10">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Correo Electrónico (Contacto):</label>
                      <input 
                        type="email"
                        value={pRegEmail}
                        onChange={(e) => setPRegEmail(e.target.value)}
                        placeholder="Ej. andres.restrepo@tapasel.com.co"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-brand-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-600">Teléfono Móvil:</label>
                      <input 
                        type="tel"
                        value={pRegTelefono}
                        onChange={(e) => setPRegTelefono(e.target.value)}
                        placeholder="Ej. 3127810332"
                        className="w-full bg-white border border-slate-200 rounded p-1.5 outline-none focus:border-brand-primary"
                      />
                    </div>
                  </div>

                  {/* Buttons line */}
                  <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                    <button 
                      type="button" 
                      onClick={() => setIsPayrollRegisterOpen(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded cursor-pointer border-none"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-bold rounded cursor-pointer border-none"
                    >
                      Inscribir en Planilla de Nómina
                    </button>
                  </div>
                </form>
              )}

              {/* Grid 2-column layout */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* Payroll Table */}
                <div className="xl:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                      <span className="font-display font-semibold text-xs text-slate-900">Carga Quincenal de Novedades</span>
                      <span className="text-[10px] font-mono text-slate-500 font-medium">Periodo: 15-30 Mayo 2026</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                          <tr>
                            <th className="p-3 pl-4">Empleado</th>
                            <th className="p-3 text-center">Horas Ord.</th>
                            <th className="p-3 text-center">Horas Extra</th>
                            <th className="p-3 text-center">Permisos</th>
                            <th className="p-3 text-center">Inasist.</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-900 font-mono">
                          {empleados.map((emp) => {
                            const pay = getEmployeePayroll(emp.id);
                            const isSelected = selectedPayrollId === emp.id;
                            return (
                              <tr 
                                key={emp.id}
                                onClick={() => {
                                  setSelectedPayrollId(emp.id);
                                  setInvoiceDownloadSuccess(null);
                                }}
                                className={`hover:bg-slate-50 cursor-pointer transition-all ${
                                  isSelected ? 'bg-brand-primary/5 border-l-2 border-l-brand-primary' : ''
                                }`}
                              >
                                <td className="p-3 pl-4">
                                  <span className="font-sans font-semibold text-slate-950 block">{emp.nombre}</span>
                                  <span className="text-[10px] text-slate-500 block font-normal">{emp.cargo}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <div onClick={e => e.stopPropagation()} className="flex justify-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={80}
                                      value={pay.horasOrdinarias}
                                      onChange={(e) => {
                                        const val = Math.min(80, Math.max(0, parseInt(e.target.value) || 0));
                                        setPayrollData(prev => ({
                                          ...prev,
                                          [emp.id]: {
                                            ...(prev[emp.id] || { horasOrdinarias: 80, horasExtra: 4, permisos: 0, inasistencias: 0 }),
                                            horasOrdinarias: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center bg-slate-50 border border-slate-200 rounded p-1 text-xs text-slate-900 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div onClick={e => e.stopPropagation()} className="flex justify-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={40}
                                      value={pay.horasExtra}
                                      onChange={(e) => {
                                        const val = Math.min(40, Math.max(0, parseInt(e.target.value) || 0));
                                        setPayrollData(prev => ({
                                          ...prev,
                                          [emp.id]: {
                                            ...(prev[emp.id] || { horasOrdinarias: 80, horasExtra: 4, permisos: 0, inasistencias: 0 }),
                                            horasExtra: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center bg-slate-50 border border-slate-200 rounded p-1 text-xs text-amber-700 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div onClick={e => e.stopPropagation()} className="flex justify-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={40}
                                      value={pay.permisos}
                                      onChange={(e) => {
                                        const val = Math.min(40, Math.max(0, parseInt(e.target.value) || 0));
                                        setPayrollData(prev => ({
                                          ...prev,
                                          [emp.id]: {
                                            ...(prev[emp.id] || { horasOrdinarias: 80, horasExtra: 4, permisos: 0, inasistencias: 0 }),
                                            permisos: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center bg-slate-50 border border-slate-200 rounded p-1 text-xs text-emerald-600 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  <div onClick={e => e.stopPropagation()} className="flex justify-center">
                                    <input
                                      type="number"
                                      min={0}
                                      max={40}
                                      value={pay.inasistencias}
                                      onChange={(e) => {
                                        const val = Math.min(40, Math.max(0, parseInt(e.target.value) || 0));
                                        setPayrollData(prev => ({
                                          ...prev,
                                          [emp.id]: {
                                            ...(prev[emp.id] || { horasOrdinarias: 80, horasExtra: 4, permisos: 0, inasistencias: 0 }),
                                            inasistencias: val
                                          }
                                        }));
                                      }}
                                      className="w-12 text-center bg-slate-50 border border-slate-200 rounded p-1 text-xs text-rose-600 focus:bg-white focus:border-brand-primary focus:ring-1 focus:ring-brand-primary outline-none font-bold"
                                    />
                                  </div>
                                </td>
                            </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-3 bg-slate-50 text-[10px] text-slate-500 border-t border-slate-100">
                    💡 <i>Haz clic en cualquier empleado de la lista para auditar y generar su póliza quincenal.</i>
                  </div>
                </div>

                {/* Payslip View */}
                <div className="xl:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  {(() => {
                    const emp = empleados.find(e => e.id === selectedPayrollId) || empleados[0];
                    if (!emp) return <div className="text-center py-8 text-xs text-slate-400">Selecciona un empleado para auditar su póliza de pago.</div>;

                    const payModel = getEmployeePayroll(emp.id);
                    const regularHourRate = emp.salario / 240;
                    const sueldoQuincenaTotal = emp.salario / 2;
                    const sueldoOrdinario = (payModel.horasOrdinarias / 80) * sueldoQuincenaTotal;
                    const remuneradaHorasExtra = payModel.horasExtra * regularHourRate * 1.25;
                    const auxTrans = emp.salario < 3000000 ? 70000 : 0; // standard transport aux eligibility
                    
                    const totalDevengado = sueldoOrdinario + remuneradaHorasExtra + auxTrans;

                    const baseParaDeducciones = sueldoOrdinario + remuneradaHorasExtra;
                    const deduccionSalud = baseParaDeducciones * 0.04;
                    const deduccionPension = baseParaDeducciones * 0.04;
                    const deduccionAbsences = payModel.inasistencias * regularHourRate * 8;
                    const totalDeducciones = deduccionSalud + deduccionPension + deduccionAbsences;

                    const netoAPagar = totalDevengado - totalDeducciones;

                    return (
                      <div className="space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                          <div>
                            <span className="font-mono text-[9px] uppercase tracking-wider text-brand-primary font-bold block">Póliza de Pago</span>
                            <h4 className="font-semibold text-slate-950 text-xs mt-0.5">{emp.nombre}</h4>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">{emp.id} | {emp.cargo}</p>
                          </div>
                          <span className="inline-flex px-1.5 py-0.5 rounded font-mono text-[9px] font-bold bg-brand-primary/10 text-brand-primary border border-brand-primary/15">
                            May-2Q-2026
                          </span>
                        </div>

                        {/* Interactive Receipt Sheet */}
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-4 text-[10px] font-mono select-text">
                          <div className="text-center pb-2 border-b border-dashed border-slate-300">
                            <span className="font-sans font-bold text-slate-900 tracking-wider text-xs block uppercase">TASA S.A.S</span>
                            <span className="text-[9px] text-slate-400 block mt-0.5">Medellín, Antioquia - Nit: 900.561.428-2</span>
                            <span className="text-[9px] text-slate-500 font-sans block mt-1">SOPORTE ELECTRÓNICO DE PAGO</span>
                          </div>

                          {/* Detail list items */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Sueldo Base quincena (80h):</span>
                              <span>{formatCurrency(sueldoQuincenaTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-800">
                              <span>Sueldo Devengado ({payModel.horasOrdinarias}h):</span>
                              <span className="font-bold">{formatCurrency(sueldoOrdinario)}</span>
                            </div>
                            {payModel.horasExtra > 0 && (
                              <div className="flex justify-between items-center text-slate-800">
                                <span>Recargo Horas Extra (+{payModel.horasExtra}h):</span>
                                <span className="text-emerald-700 font-bold">+{formatCurrency(remuneradaHorasExtra)}</span>
                              </div>
                            )}
                            {auxTrans > 0 && (
                              <div className="flex justify-between items-center text-slate-500">
                                <span>Auxilio Transporte legal:</span>
                                <span className="text-emerald-700">+{formatCurrency(auxTrans)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-250 pt-1 border-dashed">
                              <span>Total Devengado:</span>
                              <span className="text-brand-primary">{formatCurrency(totalDevengado)}</span>
                            </div>
                          </div>

                          {/* Deducciones */}
                          <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-2">
                            <span className="text-[9px] text-rose-700 font-bold uppercase block mb-1">Deducciones de Ley / Novedades</span>
                            <div className="flex justify-between items-center text-rose-600">
                              <span>Deducción Salud (4%):</span>
                              <span>-{formatCurrency(deduccionSalud)}</span>
                            </div>
                            <div className="flex justify-between items-center text-rose-600">
                              <span>Deducción Pensión (4%):</span>
                              <span>-{formatCurrency(deduccionPension)}</span>
                            </div>
                            {payModel.inasistencias > 0 && (
                              <div className="flex justify-between items-center text-rose-700 font-bold bg-rose-50 px-1 rounded">
                                <span>Fallas de asistencia ({payModel.inasistencias}):</span>
                                <span>-{formatCurrency(deduccionAbsences)}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center text-slate-900 font-bold border-t border-slate-250 pt-1 border-dashed mt-1.5">
                              <span>Total Deducciones:</span>
                              <span className="text-rose-700">{formatCurrency(totalDeducciones)}</span>
                            </div>
                          </div>

                          {/* Neto a pagar */}
                          <div className="border-t-2 border-slate-300 border-double pt-2 flex justify-between items-center text-[11px] text-slate-950 font-bold">
                            <span className="font-sans uppercase">NETO LIQUIDADO:</span>
                            <span className="text-base text-emerald-600 font-sans">{formatCurrency(netoAPagar)}</span>
                          </div>

                          {/* Dispersión Bancaria y Seguridad Social Relacionada */}
                          {(() => {
                            const bankInfo = employeeBankData[emp.id] || {
                              banco: 'Bancolombia',
                              tipoCuenta: 'Ahorros',
                              numCuenta: 'Cuentas Registradas',
                              eps: 'SURA EPS',
                              arl: 'SURA Seguros (Clase I)',
                              pension: 'Protección'
                            };
                            return (
                              <div className="space-y-1 border-t border-slate-200 border-dashed pt-2 text-[9px] text-slate-500 font-mono">
                                <div className="flex justify-between">
                                  <span>Banco / Cuenta:</span>
                                  <span className="font-bold text-slate-800">{bankInfo.banco} ({bankInfo.tipoCuenta})</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Nº Cuenta:</span>
                                  <span className="font-bold text-slate-800">{bankInfo.numCuenta}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Salud (EPS) / Pensiones:</span>
                                  <span className="text-slate-600">{bankInfo.eps} / {bankInfo.pension}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Riesgos Laborales (ARL):</span>
                                  <span className="text-slate-600">{bankInfo.arl}</span>
                                      <GenericViewModal record={genericViewRecord} onClose={() => setGenericViewRecord(null)} />
      {genericEditConfig && (
        <GenericEditModal
          record={genericEditConfig.record}
          tableName={genericEditConfig.table}
          onClose={() => setGenericEditConfig(null)}
          onSaved={(updated) => {
            setGenericEditConfig(null);
            window.location.reload();
          }}
        />
      )}
</div>
                              </div>
                            );
                          })()}

                          <div className="text-center pt-2 border-t border-slate-200 text-[8px] text-slate-400">
                            Firma digital Tapasel Flow IA
                            <br />
                            Soporte electrónico legal equivalente - Decreto de Ley 2242
                          </div>
                        </div>

                        {/* Export actions */}
                        <div className="space-y-2 pt-1 font-sans">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setInvoiceDownloadSuccess(emp.id);
                                setTimeout(() => setInvoiceDownloadSuccess(null), 4000);
                              }}
                              className="flex-1 py-2 border border-slate-250 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Download className="w-4 h-4 text-slate-500" />
                              Exportar Póliza
                            </button>
                            <button 
                              onClick={() => {
                                window.print();
                              }}
                              className="p-2 border border-slate-250 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 flex items-center justify-center transition-all cursor-pointer"
                              title="Imprimir Póliza directamente"
                            >
                              <Printer className="w-4 h-4 text-slate-500" />
                            </button>
                          </div>

                          {invoiceDownloadSuccess === emp.id && (
                            <div className="p-3 bg-emerald-50 border border-emerald-250 rounded-lg border-emerald-300 text-[11px] text-emerald-800 font-medium flex items-center gap-2 animate-fade-in">
                              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Soporte quincenal de {emp.nombre} exportado exitosamente. Descargando <b>POLIZA_{emp.id}_Q2_MAYO.pdf</b></span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
              
            </div>
          )}

          {/* Subtab Content: Dashboard, Costos IA & Agente Conversacional */}
          {activeSubTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
              {/* Header card with details */}
              <div className="bg-gradient-to-tr from-zinc-950 via-zinc-900 to-indigo-950 p-6 rounded-xl text-white shadow-sm border border-zinc-800/40">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h3 className="font-display font-semibold text-sm flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-indigo-400" />
                      Dashboard Analítico de Costos, Contabilidad y Agente IA de Personal
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">Auditoría en tiempo real de costos de personal, provisión automática de prestaciones sociales y diagnóstico de personal asistido por LLM.</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-400">Integración General:</span>
                    <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> DIARIO CENTRALIZADO
                    </span>
                  </div>
                </div>
              </div>

              {/* Live Analytical Cards row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 font-mono text-xs">
                
                {/* Payroll base expenditure projected */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Costo Neto Nómina actual</span>
                    <div className="my-3">
                      <span className="text-xl font-bold text-slate-900 font-sans block">
                        {formatCurrency(
                          empleados.reduce((sum, emp) => {
                            const pay = getEmployeePayroll(emp.id);
                            const quincenaBase = emp.salario / 2;
                            const extraVal = pay.horasExtra * (emp.salario / 240) * 1.25;
                            const dedVal = pay.inasistencias * (emp.salario / 240) * 8;
                            return sum + (quincenaBase + extraVal + 70000 - dedVal - (quincenaBase * 0.08));
                          }, 0)
                        )}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">Calculado sobre {empleados.length} colaboradores activos</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-emerald-50 text-emerald-800 rounded px-1.5 py-0.5 font-bold self-start border border-emerald-100">PRODUCCIÓN CORRIENTE</span>
                </div>

                {/* Provision percentages */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">PROVISIÓN DE PRESTACIONES</span>
                    <div className="my-3">
                      <span className="text-xl font-bold text-slate-900 font-sans block">
                        {formatCurrency(
                          empleados.reduce((sum, emp) => sum + (emp.salario * 0.2183), 0)
                        )}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">Cesantías (8.33%), Prima (8.33%), Vac (4.17%)</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-indigo-50 text-indigo-800 rounded px-1.5 py-0.5 font-bold self-start border border-indigo-100">CONTABILIDAD PASIVA</span>
                </div>

                {/* Absences statistics */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">AUSENTISMO Y LICENCIAS</span>
                    <div className="my-3">
                      <span className="text-xl font-bold text-slate-900 font-sans block">
                        {novedades.filter(n => n.tipo === 'Incapacidad' || n.tipo === 'Permiso').length} Eventos
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-1">Impacto de {empleados.reduce((sum, e) => sum + getEmployeePayroll(e.id).inasistencias, 0)} inasistencias en planta</span>
                    </div>
                  </div>
                  <span className="text-[9px] bg-rose-50 text-rose-800 rounded px-1.5 py-0.5 font-bold self-start border border-rose-100">AUDITORÍA ACTIVA</span>
                </div>

                {/* Accounting integration status */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">ASIENTO DIARIO CONTABLE</span>
                    <div className="my-2.5 space-y-1.5 pt-0.5">
                      <button 
                        type="button"
                        onClick={() => {
                          const totalPayroll = empleados.reduce((sum, emp) => {
                            const pay = getEmployeePayroll(emp.id);
                            const quincenaBase = emp.salario / 2;
                            const extraVal = pay.horasExtra * (emp.salario / 240) * 1.25;
                            const dedVal = pay.inasistencias * (emp.salario / 240) * 8;
                            return sum + (quincenaBase + extraVal + 70000 - dedVal - (quincenaBase * 0.08));
                          }, 0);

                          onAddTransaction({
                            fecha: new Date().toISOString().split('T')[0],
                            descripcion: `Provisión y Liquidación Nómina Quincenal - ${empleados.length} Empleados de Planta`,
                            tipo: 'Egreso' as const,
                            categoria: 'Nómina',
                            monto: totalPayroll,
                            estado: 'Pagado' as const,
                            responsable: 'Sonia Park / Marcus Chen'
                          });

                          toast.success(`¡Asiento Automático Generado!\nSe ha debitado del fondo de tesorería y registrado un asiento de Egreso por valor de ${formatCurrency(totalPayroll)} en el Libro Diario central.`);
                        }}
                        className="w-full text-center py-1.5 bg-zinc-950 hover:bg-zinc-900 font-semibold text-[10px] text-white rounded cursor-pointer transition-colors border-none"
                      >
                        ✉ Sincronizar con Contabilidad
                      </button>
                      <span className="text-[8px] text-slate-400 block text-center">Registrará egreso consolidado en Finanzas</span>
                    </div>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-bold self-center">INTEGRADO CON CORRIENTES</span>
                </div>

              </div>

              {/* 2 Column Layout split: Left Cost Split, Right conversational Assistant chatbot */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                {/* Cost Distribution split analysis */}
                <div className="xl:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-display font-semibold text-slate-950 text-xs uppercase tracking-wide">Distribución de Nómina por Procesos</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">Participación neta del costo laboral acumulado por dependencias.</p>
                  </div>

                  <div className="space-y-4 font-mono text-[10px] text-slate-600">
                    {/* Ingeniería splitting */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-900 font-bold">
                        <span>Ingeniería Planta (Soporte)</span>
                        <span>62% ({formatCurrency(19450000)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-brand-primary h-full rounded-full" style={{ width: '62%' }} />
                      </div>
                    </div>

                    {/* Logística splitting */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-900 font-bold">
                        <span>Logística & Despachos</span>
                        <span>26% ({formatCurrency(8150000)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full" style={{ width: '26%' }} />
                      </div>
                    </div>

                    {/* Administración splitting */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-slate-900 font-bold">
                        <span>Administración & Ventas</span>
                        <span>12% ({formatCurrency(3400000)})</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 space-y-1 text-[9px] text-slate-400">
                      <div><b>Tasa Aportes EPS:</b> 8.5% (Patronal)</div>
                      <div><b>Tasa Pensión:</b> 12% (Patronal)</div>
                      <div><b>ARL Promedio:</b> SURA Seguros de Riesgos Clase II</div>
                    </div>
                  </div>
                </div>

                {/* AI Assistant Chatbot panel */}
                <div className="xl:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                  <div>
                    <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                      <div>
                        <h4 className="font-display font-semibold text-slate-950 text-xs flex items-center gap-1.5 uppercase">
                          <Activity className="w-4 h-4 text-brand-primary animate-pulse" />
                          AGENTE INTELIGENTE AUTÓNOMO DE NÓMINA (IA)
                        </h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">Analiza costos consolidados, inasistencias en planta, contratos y cálculo de novedades quincenales por LLM.</p>
                      </div>
                      <span className="text-[9px] font-mono text-brand-primary font-bold bg-brand-primary/10 border border-brand-primary/20 rounded px-2 py-0.5">MODELO: GEMINI 2.5 COGNITIVE</span>
                    </div>

                    {/* Message stream container */}
                    <div className="my-4 space-y-4 max-h-52 overflow-y-auto pr-2 text-xs font-sans scrollbar-none">
                      {chatMessages.map((msg, idx) => {
                        const isUser = msg.sender === 'user';
                        return (
                          <div 
                            key={idx} 
                            className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
                          >
                            {!isUser && (
                              <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center text-brand-primary shrink-0">
                                <Bot className="w-3.5 h-3.5" />
                              </div>
                            )}
                            
                            <div className={`max-w-[80%] p-3.5 shadow-sm leading-relaxed ${
                              isUser 
                                ? 'bg-brand-primary text-white rounded-2xl rounded-br-none font-medium' 
                                : 'bg-slate-50 border border-slate-150 text-slate-800 rounded-2xl rounded-bl-none'
                            }`}>
                              <span className="text-[8px] block mb-1 font-bold uppercase tracking-wider opacity-60">
                                {isUser ? 'Tú' : 'Asistente IA RR.HH.'}
                              </span>
                              <p className="whitespace-pre-line text-[11px] font-mono leading-normal">{msg.text}</p>
                            </div>

                            {isUser && (
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 text-[8px] font-sans">
                                YO
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Quick suggestion buttons */}
                    <div className="space-y-1.5 border-t border-slate-100 pt-3">
                      <span className="text-[9px] font-mono text-slate-400 font-bold block uppercase mb-1">Consultas Ejecutivas Frecuentes:</span>
                      <div className="flex flex-wrap gap-1.5 font-mono text-[9px]">
                        <button 
                          onClick={() => onPostAiAssistantQuery("¿Cuál es el costo total de la nómina este período?")}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          💸 Costo Total Nómina?
                        </button>
                        <button 
                          onClick={() => onPostAiAssistantQuery("¿Cuáles son los colaboradores con más horas extras?")}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          ⏱️ Colaboradores con Horas Extras?
                        </button>
                        <button 
                          onClick={() => onPostAiAssistantQuery("¿Qué áreas registran mayor índice de ausentismo hoy?")}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          ⚠️ Áreas con Ausentismo?
                        </button>
                        <button 
                          onClick={() => onPostAiAssistantQuery("¿Novedades que afectan el pago quincenal?")}
                          className="px-2 py-1 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-slate-700 cursor-pointer"
                        >
                          📋 Novedades Registradas?
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Input line */}
                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!chatbotQuery.trim()) return;
                      onPostAiAssistantQuery(chatbotQuery);
                      setChatbotQuery('');
                    }}
                    className="flex gap-2 border-t border-slate-100 pt-3"
                  >
                    <input 
                      type="text" 
                      placeholder="Pregunte a la IA de nómina (ej. Horas extras, ausencias, provisiones...)"
                      value={chatbotQuery}
                      onChange={(e) => setChatbotQuery(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-900 outline-none focus:border-brand-primary focus:bg-white transition-all font-medium"
                    />
                    <button 
                      type="submit"
                      className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/90 text-white font-sans font-bold text-xs rounded-lg transition-colors border-none cursor-pointer uppercase tracking-wide flex items-center gap-1"
                    >
                      Preguntar IA 🤖
                    </button>
                  </form>
                </div>

              </div>
            </div>
          )}


        </div>

        {/* Live Attendance checklist right layout (4/12) */}
        {selectedEmp && (
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {/* Active Employee Highlight Detail Pane */}
            <div className="bg-white border border-brand-primary/40 shadow-md p-5 rounded-xl relative overflow-hidden group">
              <div className="absolute inset-x-0 top-0 h-1 bg-brand-primary" />
              <div className="absolute top-2 right-2">
                <button 
                  onClick={() => setSelectedEmp(null)}
                  className="p-1 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded text-[10px] font-mono border-none bg-transparent cursor-pointer font-bold"
                >
                  Cerrar
                </button>
              </div>
 
              <div className="flex items-center gap-3 mt-1 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center font-display font-bold text-brand-primary text-xs">
                  {selectedEmp.nombre.split(' ').map(n=>n[0]).join('')}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{selectedEmp.nombre}</h4>
                  <p className="text-[11px] text-slate-500 leading-none">{selectedEmp.cargo}</p>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="text-[9px] bg-brand-primary/10 text-brand-primary rounded px-1.5 py-0.5 inline-block font-mono font-bold uppercase">{selectedEmp.id}</span>
                    <button 
                      type="button"
                      onClick={() => {
                        setEditingEmpId(selectedEmp.id);
                        setEditEmpNombre(selectedEmp.nombre);
                        setEditEmpCargo(selectedEmp.cargo);
                        setEditEmpEmail(selectedEmp.email);
                        setEditEmpTelefono(selectedEmp.telefono);
                        setEditEmpSalario(selectedEmp.salario);
                      }}
                      className="px-2 py-0.5 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold border-none cursor-pointer text-[9px] transition-all"
                    >
                      Editar
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (confirm(`¿Eliminar al colaborador ${selectedEmp.nombre}?`)) {
                          if (onDeleteEmployee) onDeleteEmployee(selectedEmp.id);
                          setSelectedEmp(null);
                        }
                      }}
                      className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold border-none cursor-pointer text-[9px] transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>

              {/* Mini-Tabs for Dossier Options */}
              <div className="flex border-b border-slate-150 mb-3 font-mono text-[9px] gap-1 pt-2">
                <button 
                  onClick={() => setEmpDetailTab('expediente')}
                  className={`pb-1 px-1.5 font-bold transition-all ${empDetailTab === 'expediente' ? 'border-b-2 border-brand-primary text-brand-primary md:text-[9.5px]' : 'text-slate-400'}`}
                >
                  📁 EXPEDIENTE
                </button>
                <button 
                  onClick={() => setEmpDetailTab('historias')}
                  className={`pb-1 px-1.5 font-bold transition-all ${empDetailTab === 'historias' ? 'border-b-2 border-brand-primary text-brand-primary md:text-[9.5px]' : 'text-slate-400'}`}
                >
                  🗂️ HISTORIALES
                </button>
                <button 
                  onClick={() => setEmpDetailTab('novedades')}
                  className={`pb-1 px-1.5 font-bold transition-all ${empDetailTab === 'novedades' ? 'border-b-2 border-brand-primary text-brand-primary md:text-[9.5px]' : 'text-slate-400'}`}
                >
                  🔔 NOVEDADES ({novedades.filter(n => n.empId === selectedEmp.id).length})
                </button>
              </div>
 
              <div className="space-y-4">
                {empDetailTab === 'expediente' && (
                  <div className="space-y-3">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold">Información Contractual</span>
                    <div className="space-y-2 text-xs text-slate-600 font-mono">
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Tipo Contrato:</span>
                        <span className="text-slate-800 font-bold">Indefinido V2.5</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-800 font-bold select-all truncate">{selectedEmp.email}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Teléfono:</span>
                        <span className="text-slate-800 font-bold select-all">{selectedEmp.telefono}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Centro de Costo:</span>
                        <span className="text-slate-800 font-bold">
                          {selectedEmp.area === 'Ingeniería' ? 'CC-101 Planta Alta' : selectedEmp.area === 'Logística' ? 'CC-202 Bodega Sur' : 'CC-303 Admin Centro'}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Fecha Ingreso:</span>
                        <span className="text-slate-800">{selectedEmp.fechaIngreso}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Salario Mensual:</span>
                        <span className="text-emerald-700 font-bold">{formatCurrency(selectedEmp.salario)}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Banco / Nómina:</span>
                        <span className="text-slate-850 font-bold text-slate-800">{employeeBankData[selectedEmp.id]?.banco || 'Bancolombia'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Nº de Cuenta:</span>
                        <span className="text-slate-700 text-[10px]">{employeeBankData[selectedEmp.id]?.numCuenta || 'No registrada'}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-50 pb-1">
                        <span className="text-slate-400">Seguridad Social:</span>
                        <span className="text-slate-600 text-[10px]">{employeeBankData[selectedEmp.id]?.eps || 'SURA EPS'} / {employeeBankData[selectedEmp.id]?.pension || 'Protección'}</span>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold pt-1">Archivos del Expediente Digital</span>
                    <div className="space-y-1 text-[11px] font-mono">
                      <div className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex justify-between items-center cursor-pointer">
                        <span className="text-slate-755 font-medium">📜 contrato_laboral_firmado.pdf</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">OK</span>
                      </div>
                      <div className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex justify-between items-center cursor-pointer">
                        <span className="text-slate-755 font-medium">📋 examen_medico_ingreso.pdf</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">OK</span>
                      </div>
                      <div className="p-2 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 flex justify-between items-center cursor-pointer">
                        <span className="text-slate-755 font-medium">💳 rut_afiliacion_dian_25.pdf</span>
                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1 rounded font-bold">OK</span>
                      </div>
                    </div>
                  </div>
                )}

                {empDetailTab === 'historias' && (
                  <div className="space-y-3">
                    {/* Career History & Salary Progress */}
                    <div className="space-y-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold">Historial Salarial</span>
                      <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                        {(employeeDossiers[selectedEmp.id]?.historialSalarial || [
                          { fecha: selectedEmp.fechaIngreso, salario: selectedEmp.salario, motivo: 'Sueldo Base de Contratación' }
                        ]).map((hist, idx) => (
                          <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded flex justify-between">
                            <div>
                              <span className="font-bold text-slate-700 block">{formatCurrency(hist.salario)}</span>
                              <span className="text-[8px] text-slate-400">{hist.motivo}</span>
                            </div>
                            <span className="text-[9px] text-slate-500 self-center">{hist.fecha}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold pt-1">Trayectoria Laboral</span>
                      <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                        {(employeeDossiers[selectedEmp.id]?.historialLaboral || [
                          { fecha: selectedEmp.fechaIngreso, cargo: selectedEmp.cargo, area: selectedEmp.area, logro: 'Alta laboral inicial y asignación de equipo.' }
                        ]).map((hlab, idx) => (
                          <div key={idx} className="p-2 bg-slate-50 border border-slate-100 rounded">
                            <div className="flex justify-between items-start">
                              <span className="font-bold text-slate-800 text-[11px] block">{hlab.cargo}</span>
                              <span className="text-[8px] bg-blue-100 text-blue-700 font-bold px-1 rounded">{hlab.area}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1 leading-normal">{hlab.logro}</p>
                            <span className="text-[8px] text-slate-400 block mt-1 text-right">{hlab.fecha}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold pt-1">Historial Disciplinario y Logros</span>
                      <div className="space-y-1.5 font-mono text-[10px] text-slate-600">
                        {(employeeDossiers[selectedEmp.id]?.historialDisciplinario || [
                          { fecha: '2025-05-23', tipo: 'Capacitación', descripcion: 'Certificación de Inducción de Seguridad Industrial', estado: 'Completado' }
                        ]).map((hdisc, idx) => (
                          <div key={idx} className="p-1.5 bg-slate-50 border border-slate-100 rounded flex justify-between gap-1 items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-block w-1.5 h-1.5 rounded-full ${hdisc.tipo === 'Felicitación' ? 'bg-emerald-550 bg-emerald-500' : hdisc.tipo === 'Capacitación' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                                <span className="font-bold text-slate-800 text-[10px]">{hdisc.tipo}</span>
                              </div>
                              <p className="text-[9px] text-slate-500 mt-0.5 leading-tight">{hdisc.descripcion}</p>
                            </div>
                            <span className="text-[8px] bg-slate-205 bg-slate-200 text-slate-505 text-slate-600 rounded px-1 shrink-0 font-bold">{hdisc.estado}</span>
                          </div>
                        ))}
                        <button 
                          type="button"
                          onClick={() => {
                            const desc = prompt("Describa la observación / anotación disciplinaria o logro académico:");
                            if (!desc) return;
                            const type = prompt("Tipo: (Amonestación, Llamado de Atención, Felicitación, Capacitación) Defaults to 'Amonestación':") || 'Amonestación';
                            const newLog = {
                              fecha: new Date().toISOString().split('T')[0],
                              tipo: type as any,
                              descripcion: desc,
                              estado: 'Vigente'
                            };
                            setEmployeeDossiers(prev => {
                              const curr = prev[selectedEmp.id] || { historialSalarial: [], historialLaboral: [], historialDisciplinario: [] };
                              return {
                                ...prev,
                                [selectedEmp.id]: {
                                  ...curr,
                                  historialDisciplinario: [newLog, ...curr.historialDisciplinario]
                                }
                              }
                            });
                            toast.success("¡Anotación guardada en el historial disciplinario bajo auditoría laboral!");
                          }}
                          className="w-full text-center py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-250 border-slate-200 mt-2 text-[10px] font-bold cursor-pointer transition-all"
                        >
                          + Registrar Anotación Disciplinaria / Logro
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {empDetailTab === 'novedades' && (
                  <div className="space-y-4 text-xs font-mono">
                    <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg space-y-2">
                      <span className="text-[9px] text-blue-800 font-bold uppercase block">Acumulados de Horas y Faltas</span>
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                        <div className="p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-slate-500 block text-[9px] uppercase">H. Extras</span>
                          <span className="font-bold text-amber-700 text-xs">{getEmployeePayroll(selectedEmp.id).horasExtra} hrs</span>
                        </div>
                        <div className="p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-slate-500 block text-[9px] uppercase">Permisos</span>
                          <span className="font-bold text-emerald-700 text-xs">{getEmployeePayroll(selectedEmp.id).permisos}</span>
                        </div>
                        <div className="p-1.5 bg-white rounded border border-slate-200">
                          <span className="text-slate-500 block text-[9px] uppercase">Inasist.</span>
                          <span className="font-bold text-rose-700 text-xs">{getEmployeePayroll(selectedEmp.id).inasistencias}</span>
                        </div>
                      </div>
                    </div>

                    <span className="font-mono text-[10px] uppercase tracking-wider text-slate-800 block font-extrabold pt-1">Lista de Novedades Registradas</span>
                    <div className="space-y-2">
                      {novedades.filter(n => n.empId === selectedEmp.id).length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-[10px] italic">
                          Sin novedades registradas este mes.
                        </div>
                      ) : (
                        novedades.filter(n => n.empId === selectedEmp.id).map((nov, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[10px]">
                            <div className="flex justify-between items-center mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                                nov.tipo === 'Incapacidad' ? 'bg-red-50 text-red-700 border border-red-200' :
                                nov.tipo === 'Vacaciones' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                                nov.tipo === 'Bonificación' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {nov.tipo.toUpperCase()}
                              </span>
                              <span className="text-[8px] bg-slate-200 text-slate-600 px-1 rounded font-bold">{nov.id}</span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-snug font-sans font-medium">{nov.descripcion}</p>
                            <div className="flex justify-between items-center mt-2 pt-1 border-t border-slate-200 text-[8px] text-slate-400 font-mono">
                              <span>📅 {nov.fechaInicio} / {nov.fechaFin}</span>
                              {nov.monto ? (
                                <span className="text-emerald-700 font-bold">{formatCurrency(nov.monto)}</span>
                              ) : null}
                            </div>
                            <div className="flex justify-between items-center text-[8px] mt-1 text-slate-400">
                              <span>Auditor: <b className="text-blue-600 font-bold">{nov.usuarioAuditor}</b></span>
                              <span className="text-emerald-600 font-bold">✓ {nov.estadoLog}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedEmp.documentosVencidos.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <label className="text-[10px] font-mono text-rose-700 block uppercase tracking-wider font-bold">
                      Documentos Pendientes de Firma:
                    </label>
                    <div className="space-y-1">
                      {selectedEmp.documentosVencidos.map((doc, idx) => (
                        <div key={idx} className="p-2 bg-rose-50 border border-rose-100 rounded text-[10px] text-rose-700 font-mono leading-tight">
                          {doc}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
 
                <button 
                  onClick={() => onPostAiAssistantQuery(`Realizar un diagnóstico y redactar un correo formal solicitando la firma de documentos pendientes de ${selectedEmp.nombre}.`)}
                  className="w-full text-center py-2 bg-brand-primary hover:opacity-90 border-none text-white font-display font-bold text-xs rounded-lg transition-colors mt-6 block uppercase tracking-wide cursor-pointer"
                >
                  Generar Alerta por Correo IA
                </button>
              </div>
 
            </div>
          </div>
        )}
 
        </div>

      {/* Modal de Edición de Colaborador */}
      {editingEmpId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditEmployeeSubmit} className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in text-slate-800 text-xs text-left">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                Editar Perfil Laboral
              </h3>
              <button 
                type="button" 
                onClick={() => setEditingEmpId(null)}
                className="text-xs bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Nombre Completo</label>
                <input 
                  type="text" 
                  required
                  value={editEmpNombre}
                  onChange={(e) => setEditEmpNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-bold outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Cargo</label>
                <input 
                  type="text" 
                  required
                  value={editEmpCargo}
                  onChange={(e) => setEditEmpCargo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Email Corporativo</label>
                <input 
                  type="email" 
                  required
                  value={editEmpEmail}
                  onChange={(e) => setEditEmpEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Teléfono</label>
                <input 
                  type="text" 
                  required
                  value={editEmpTelefono}
                  onChange={(e) => setEditEmpTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-700">Salario Base (COP)</label>
                <input 
                  type="number" 
                  required
                  min={0}
                  value={editEmpSalario}
                  onChange={(e) => setEditEmpSalario(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
              <button 
                type="button"
                onClick={() => setEditingEmpId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer border-none"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer border-none"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
