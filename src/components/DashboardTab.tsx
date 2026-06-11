import toast from 'react-hot-toast';
import React, { useState } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  FileText, 
  CheckCircle,
  Cpu,
  PlusCircle,
  FolderOpen
} from 'lucide-react';
import { Transaccion, Usuario } from '../types';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip
} from 'recharts';

interface DashboardTabProps {
  transacciones: Transaccion[];
  onOpenNewReceipt: () => void;
  onOpenNewEmployee: () => void;
  onOpenNewDocument: () => void;
  activeTab: string;
  currentUser: Usuario;
}

export default function DashboardTab({
  transacciones,
  onOpenNewReceipt,
  onOpenNewEmployee,
  onOpenNewDocument,
  activeTab,
  currentUser
}: DashboardTabProps) {

  const [smtStatus, setSmtStatus] = useState<'Normal' | 'Parada Programada'>('Normal');

  // Generate data for the line chart dynamically, using mock defaults for prior months and actual sums for current data
  const getChartData = () => {
    const monthlySums = {
      'Ene': { Ingresos: 42000000, Egresos: 28000000 },
      'Feb': { Ingresos: 58000000, Egresos: 32000000 },
      'Mar': { Ingresos: 75000000, Egresos: 41000000 },
      'Abr': { Ingresos: 92000000, Egresos: 48000000 },
      'May': { Ingresos: 0, Egresos: 0 }
    };

    // Calculate May transactions dynamically from props
    transacciones.forEach(t => {
      if (t.fecha && t.fecha.startsWith('2026-05')) {
        if (t.tipo === 'Ingreso') {
          monthlySums['May'].Ingresos += t.monto;
        } else if (t.tipo === 'Egreso') {
          monthlySums['May'].Egresos += t.monto;
        }
      }
    });

    // Fallbacks if May sums to 0
    if (monthlySums['May'].Ingresos === 0) {
      monthlySums['May'].Ingresos = 110000000;
    }
    if (monthlySums['May'].Egresos === 0) {
      monthlySums['May'].Egresos = 65000000;
    }

    return Object.entries(monthlySums).map(([month, data]) => ({
      name: month,
      Ingresos: data.Ingresos,
      Egresos: data.Egresos
    }));
  };

  const chartData = getChartData();

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
         <h2 className="font-display font-bold text-2xl text-slate-900">Dashboard Principal</h2>
      </div>

      {/* 5 KPIs grid (adjusted to 5 columns on lg screen to prevent wrapping and empty space) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        
        {/* KPI 1: Ingresos */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs uppercase text-slate-900 font-bold tracking-wider">Ingresos Totales</span>
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="font-display text-4xl text-slate-900 font-bold tabular-nums">$1.24M</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-600 text-xs font-semibold font-mono">+12.4%</span>
              <span className="text-slate-400 text-[10px] font-mono">vs mes anterior</span>
            </div>
          </div>
          {/* Sparkline simulation - vibrant colors */}
          <div className="mt-6 h-10 w-full flex items-end gap-1">
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[30%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[45%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[25%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[65%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[55%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[80%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[95%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[85%] rounded-t-sm" />
          </div>
        </div>

        {/* KPI 2: Eficiencia */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs uppercase text-slate-900 font-bold tracking-wider">Índice de Eficiencia</span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-display text-4xl text-slate-900 font-bold tabular-nums">94.2%</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-600 text-xs font-semibold font-mono">+2.1%</span>
              <span className="text-slate-400 text-[10px] font-mono">pico de optimización</span>
            </div>
          </div>
          {/* Sparkline simulation - vibrant colors */}
          <div className="mt-6 h-10 w-full flex items-end gap-1">
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[50%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[55%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[50%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[65%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[70%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[75%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[88%] rounded-t-sm" />
            <div className="flex-1 bg-blue-500 dark:bg-blue-400 h-[92%] rounded-t-sm" />
          </div>
        </div>

        {/* KPI 3: Aprobaciones */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs uppercase text-slate-900 font-bold tracking-wider">Aprobaciones</span>
              <FileText className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="font-display text-4xl text-slate-900 font-bold tabular-nums">14</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-600 text-xs font-semibold font-mono">-5 desde 08:00</span>
              <span className="text-slate-400 text-[10px] font-mono">en proceso</span>
            </div>
          </div>
          {/* Sparkline simulation - vibrant colors */}
          <div className="mt-6 h-10 w-full flex items-end gap-1">
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[90%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[80%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[70%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[50%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[45%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[35%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[30%] rounded-t-sm" />
            <div className="flex-1 bg-amber-500 dark:bg-amber-400 h-[25%] rounded-t-sm" />
          </div>
        </div>

        {/* KPI 4: Auditoria Cumplimiento */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between group hover:border-blue-500/50 hover:shadow-md transition-all duration-300">
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs uppercase text-slate-900 font-bold tracking-wider">Cumplimiento</span>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <h2 className="font-display text-4xl text-slate-900 font-bold tabular-nums">98.8</h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-emerald-600 text-xs font-semibold">Estable</span>
              <span className="text-slate-400 text-[10px] font-mono">hace 2h</span>
            </div>
          </div>
          {/* Sparkline simulation - vibrant colors */}
          <div className="mt-6 h-10 w-full flex items-end gap-1">
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[85%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[88%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[87%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[89%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[88%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[88%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[88%] rounded-t-sm" />
            <div className="flex-1 bg-emerald-500 dark:bg-emerald-400 h-[89%] rounded-t-sm" />
          </div>
        </div>

        {/* KPI 5: Estado de Maquinaria SMT */}
        <div className={`border p-6 rounded-xl flex flex-col justify-between transition-all duration-300 ${
          smtStatus === 'Normal' 
            ? 'bg-white border-slate-200 hover:border-blue-500/50 hover:shadow-md' 
            : 'bg-rose-50/10 border-rose-200 hover:border-rose-400/50 hover:shadow-md'
        }`}>
          <div>
            <div className="flex justify-between items-start mb-4">
              <span className="font-mono text-xs uppercase text-slate-900 font-bold tracking-wider">Línea SMT</span>
              <Cpu className={`w-5 h-5 ${smtStatus === 'Normal' ? 'text-purple-600' : 'text-rose-500'}`} />
            </div>
            <h2 className="font-display text-4xl text-slate-900 font-bold tabular-nums">
              {smtStatus === 'Normal' ? '78%' : 'OFFLINE'}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className={`${smtStatus === 'Normal' ? 'text-purple-600' : 'text-rose-600'} text-xs font-semibold font-mono`}>
                {smtStatus === 'Normal' ? 'Uso Activo' : 'Parada técnica'}
              </span>
            </div>
          </div>
          {/* Progress bar simulation */}
          <div className="mt-4 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-500 ${smtStatus === 'Normal' ? 'bg-purple-600 w-[78%]' : 'bg-rose-500 w-[0%]'}`} />
          </div>
          {/* Action Button for technical stop */}
          <div className="mt-4 pt-3 border-t border-slate-100/80 flex justify-end">
            {smtStatus === 'Normal' ? (
              <button
                onClick={() => {
                  setSmtStatus('Parada Programada');
                  toast.success("⚠️ Solicitada parada técnica programada en la línea SMT.");
                }}
                className="w-full py-1.5 px-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-semibold text-rose-700 text-[10px] rounded transition-all uppercase tracking-wider cursor-pointer border-none"
              >
                Parar Línea
              </button>
            ) : (
              <button
                onClick={() => {
                  setSmtStatus('Normal');
                  toast.success("✅ Reactivada línea SMT de forma normal.");
                }}
                className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 font-semibold text-emerald-700 text-[10px] rounded transition-all uppercase tracking-wider cursor-pointer border-none"
              >
                Activar Línea
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Section: Dynamic Line Chart and Quick Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Line Chart: Flujo de Caja */}
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900">Flujo de Caja Real vs Proyectado</h3>
              <p className="text-slate-400 text-xs mt-1">Histórico consolidado de ingresos y egresos de TAPASEL S.A.S.</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#10b981] rounded" />
                <span className="text-slate-600 dark:text-slate-300">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#f43f5e] rounded" />
                <span className="text-slate-600 dark:text-slate-300">Egresos</span>
              </div>
            </div>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-slate-200)" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="var(--color-slate-400)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="var(--color-slate-400)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `$${(val / 1000000).toFixed(0)}M`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--white-theme)', 
                    borderColor: 'var(--slate-200-theme)',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: 'var(--slate-700-theme)'
                  }} 
                  formatter={(value: number) => [`$${value.toLocaleString('es-CO')} COP`]}
                />
                <Line 
                  type="monotone" 
                  dataKey="Ingresos" 
                  stroke="var(--chart-ingresos)" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Egresos" 
                  stroke="var(--chart-egresos)" 
                  strokeWidth={3} 
                  dot={{ r: 4, strokeWidth: 2 }} 
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white border border-slate-200 p-6 rounded-xl flex flex-col justify-between hover:shadow-md transition-all duration-300">
          <div className="h-full flex flex-col">
            <h3 className="font-display font-bold text-lg text-slate-900 mb-1">Acciones Rápidas ERP</h3>
            <p className="text-slate-400 text-xs mb-6">Accesos directos para la gestión empresarial automática</p>
            
            <div className="flex-1 flex flex-col gap-3 justify-center">
              
              {currentUser.permisos.includes('finanzas') && (
                <button 
                  onClick={onOpenNewReceipt}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl hover:border-brand-primary/50 hover:shadow-xs transition-all duration-200 active:scale-[0.98] group text-left cursor-pointer outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Generar Factura</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Emitir nuevo recibo de caja COP</span>
                  </div>
                </button>
              )}

              {currentUser.permisos.includes('rrhh') && (
                <button 
                  onClick={onOpenNewEmployee}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl hover:border-brand-primary/50 hover:shadow-xs transition-all duration-200 active:scale-[0.98] group text-left cursor-pointer outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Vincular Empleado</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Crear contrato de nuevo trabajador</span>
                  </div>
                </button>
              )}

              {currentUser.permisos.includes('documentos') && (
                <button 
                  onClick={onOpenNewDocument}
                  className="flex items-center gap-4 p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl hover:border-brand-primary/50 hover:shadow-xs transition-all duration-200 active:scale-[0.98] group text-left cursor-pointer outline-none"
                >
                  <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Ingresar Documento</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cargar archivo y correr OCR neural</span>
                  </div>
                </button>
              )}

            </div>
          </div>
        </div>

      </section>

      {/* Footer system indicators */}
      <footer className="pt-8 pb-4 border-t border-slate-200 flex flex-col md:flex-row justify-end items-center gap-4 text-xs font-mono text-slate-400">
        <div className="text-[10px] text-right uppercase tracking-widest opacity-60">
          Tapasel Flow AI • Medellín, Colombia © 2026
        </div>
      </footer>
    </div>
  );
}
