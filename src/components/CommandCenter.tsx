import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Search,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
  LayoutDashboard,
  Coins,
  Users,
  FolderGit,
  Cpu,
  Settings,
  Bot,
  FilePlus2,
  UserPlus,
  Coins as CoinsIcon,
  Building2,
  FileText,
  Receipt,
  CircleSlash,
} from 'lucide-react';
import { Cliente, Empleado, Documento, Transaccion, Usuario } from '../types';

type CommandType = 'action' | 'nav' | 'cliente' | 'empleado' | 'documento' | 'transaccion';

interface CommandItem {
  id: string;
  type: CommandType;
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string;
  run: () => void;
}

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  empleados: Empleado[];
  documentos: Documento[];
  transacciones: Transaccion[];
  currentUser: Usuario;
  onNavigate: (tab: string) => void;
  onOpenNewReceipt: () => void;
  onOpenNewEmployee: () => void;
  onOpenNewDocument: () => void;
  onOpenAi: () => void;
}

const GROUP_LABELS: Record<CommandType, string> = {
  action: 'Acciones rápidas',
  nav: 'Navegación',
  cliente: 'Clientes',
  empleado: 'Empleados',
  documento: 'Documentos',
  transaccion: 'Transacciones',
};

const GROUP_ORDER: CommandType[] = ['action', 'nav', 'cliente', 'empleado', 'documento', 'transaccion'];

export default function CommandCenter({
  isOpen,
  onClose,
  clientes,
  empleados,
  documentos,
  transacciones,
  currentUser,
  onNavigate,
  onOpenNewReceipt,
  onOpenNewEmployee,
  onOpenNewDocument,
  onOpenAi,
}: CommandCenterProps) {
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const permits = currentUser.permisos;
  const can = (tab: string) => permits.includes(tab) || permits.includes(tab.split('-')[0]);

  // Build the full command catalogue.
  const allItems = useMemo<CommandItem[]>(() => {
    const navTargets: Array<{ id: string; label: string; icon: CommandItem['icon'] }> = [
      { id: 'panel', label: 'Panel ejecutivo', icon: LayoutDashboard },
      { id: 'finanzas', label: 'Finanzas', icon: Coins },
      { id: 'finanzas-cartera', label: 'Finanzas · Cartera', icon: Coins },
      { id: 'finanzas-cotizaciones', label: 'Finanzas · Cotizaciones', icon: Coins },
      { id: 'rrhh', label: 'Recursos Humanos', icon: Users },
      { id: 'documentos', label: 'Documentos', icon: FolderGit },
      { id: 'produccion', label: 'Producción', icon: Cpu },
      { id: 'configuracion', label: 'Configuración', icon: Settings },
    ];

    const actions: CommandItem[] = [
      {
        id: 'act-ai',
        type: 'action',
        title: 'Abrir Asistente IA',
        subtitle: 'Pregunta, analiza métricas o detecta anomalías',
        icon: Bot,
        keywords: 'asistente ia inteligencia chat agente',
        run: () => { onOpenAi(); onClose(); },
      },
      {
        id: 'act-receipt',
        type: 'action',
        title: 'Nuevo recibo de caja',
        subtitle: 'Registrar un ingreso / conciliación',
        icon: CoinsIcon,
        keywords: 'recibo ingreso caja pago factura cobro',
        run: () => { onOpenNewReceipt(); onClose(); },
      },
      {
        id: 'act-employee',
        type: 'action',
        title: 'Nuevo empleado',
        subtitle: 'Alta de colaborador en nómina',
        icon: UserPlus,
        keywords: 'empleado colaborador nomina alta rrhh persona',
        run: () => { onOpenNewEmployee(); onClose(); },
      },
      {
        id: 'act-document',
        type: 'action',
        title: 'Nuevo documento',
        subtitle: 'Radicar y escanear con OCR',
        icon: FilePlus2,
        keywords: 'documento archivo ocr radicar escanear pdf',
        run: () => { onOpenNewDocument(); onClose(); },
      },
    ];

    const navItems: CommandItem[] = navTargets
      .filter((n) => can(n.id))
      .map((n) => ({
        id: `nav-${n.id}`,
        type: 'nav',
        title: n.label,
        subtitle: 'Ir al módulo',
        icon: n.icon,
        keywords: `${n.label} modulo seccion navegar`,
        run: () => { onNavigate(n.id); onClose(); },
      }));

    const clienteItems: CommandItem[] = permits.includes('finanzas')
      ? clientes.map((c) => ({
          id: `cli-${c.id}`,
          type: 'cliente',
          title: c.nombre,
          subtitle: `${c.estado} · Cartera $${c.carteraPendiente.toLocaleString('es-CO')} COP`,
          icon: Building2,
          keywords: `${c.nombre} ${c.contacto} ${c.email} ${c.estado} cliente`,
          run: () => { onNavigate('finanzas-clientes'); onClose(); },
        }))
      : [];

    const empleadoItems: CommandItem[] = permits.includes('rrhh')
      ? empleados.map((e) => ({
          id: `emp-${e.id}`,
          type: 'empleado',
          title: e.nombre,
          subtitle: `${e.cargo} · ${e.area}`,
          icon: Users,
          keywords: `${e.nombre} ${e.cargo} ${e.area} ${e.email} empleado`,
          run: () => { onNavigate('rrhh-empleados'); onClose(); },
        }))
      : [];

    const documentoItems: CommandItem[] = permits.includes('documentos')
      ? documentos
          .filter((d) => !(currentUser.rol === 'CFO' && d.departamento !== 'Finanzas'))
          .map((d) => ({
            id: `doc-${d.id}`,
            type: 'documento',
            title: d.nombre,
            subtitle: `${d.departamento} · ${d.estadoVerificacion}`,
            icon: FileText,
            keywords: `${d.nombre} ${d.departamento} ${d.tipoDocumental} documento archivo`,
            run: () => { onNavigate('documentos'); onClose(); },
          }))
      : [];

    const transaccionItems: CommandItem[] = permits.includes('finanzas')
      ? transacciones.slice(0, 40).map((t) => ({
          id: `tx-${t.id}`,
          type: 'transaccion',
          title: t.descripcion,
          subtitle: `${t.tipo} · $${t.monto.toLocaleString('es-CO')} COP · ${t.estado}`,
          icon: Receipt,
          keywords: `${t.descripcion} ${t.categoria} ${t.tipo} ${t.id} transaccion movimiento`,
          run: () => { onNavigate('finanzas'); onClose(); },
        }))
      : [];

    return [...actions, ...navItems, ...clienteItems, ...empleadoItems, ...documentoItems, ...transaccionItems];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientes, empleados, documentos, transacciones, currentUser]);

  // Filter according to the query.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // No query: show actions + navigation only to keep it focused.
      return allItems.filter((i) => i.type === 'action' || i.type === 'nav');
    }
    const tokens = q.split(/\s+/);
    return allItems
      .filter((i) => {
        const haystack = `${i.title} ${i.subtitle ?? ''} ${i.keywords}`.toLowerCase();
        return tokens.every((tk) => haystack.includes(tk));
      })
      .slice(0, 50);
  }, [query, allItems]);

  // Group filtered items while keeping a flat ordered list for keyboard nav.
  const { groups, flatOrder } = useMemo(() => {
    const grouped: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      (grouped[item.type] ||= []).push(item);
    }
    const order: CommandItem[] = [];
    const orderedGroups: Array<{ type: CommandType; items: CommandItem[] }> = [];
    for (const type of GROUP_ORDER) {
      if (grouped[type]?.length) {
        orderedGroups.push({ type, items: grouped[type] });
        order.push(...grouped[type]);
      }
    }
    return { groups: orderedGroups, flatOrder: order };
  }, [filtered]);

  // Reset selection when results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [query, isOpen]);

  // Autofocus the input when opened.
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      const t = setTimeout(() => inputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  // Keep the active item scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (flatOrder.length ? (i + 1) % flatOrder.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (flatOrder.length ? (i - 1 + flatOrder.length) % flatOrder.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      flatOrder[activeIndex]?.run();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh] bg-slate-950/50 backdrop-blur-sm animate-fadeIn"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-xl glass-panel rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Centro de comandos"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-slate-200">
          <Search className="w-4.5 h-4.5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar clientes, empleados, documentos, acciones..."
            aria-label="Buscar en todo el sistema"
            aria-controls="command-results"
            className="flex-1 bg-transparent border-none outline-none text-sm text-slate-900 placeholder-slate-400"
          />
          <kbd className="hidden sm:inline-flex items-center px-1.5 h-5 rounded bg-slate-100 border border-slate-200 text-[10px] font-mono text-slate-500">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          id="command-results"
          ref={listRef}
          role="listbox"
          aria-label="Resultados"
          className="max-h-[52vh] overflow-y-auto py-2 scrollbar-none"
        >
          {flatOrder.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 gap-2">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <CircleSlash className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-sm font-semibold text-slate-700">Sin resultados</p>
              <p className="text-xs text-slate-400 max-w-xs">
                No encontramos coincidencias para “{query}”. Prueba con el nombre de un cliente, empleado o módulo.
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.type} className="px-2">
                <p className="px-3 pt-2 pb-1 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                  {GROUP_LABELS[group.type]}
                </p>
                {group.items.map((item) => {
                  const flatIdx = flatOrder.indexOf(item);
                  const isActive = flatIdx === activeIndex;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-cmd-index={flatIdx}
                      role="option"
                      aria-selected={isActive}
                      onMouseMove={() => setActiveIndex(flatIdx)}
                      onClick={() => item.run()}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors duration-150 border-none cursor-pointer ${
                        isActive ? 'bg-brand-primary/10' : 'bg-transparent'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isActive ? 'bg-brand-primary/15 text-brand-primary' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${isActive ? 'text-slate-900 font-semibold' : 'text-slate-700'}`}>
                          {item.title}
                        </p>
                        {item.subtitle && (
                          <p className="text-[11px] text-slate-400 truncate">{item.subtitle}</p>
                        )}
                      </div>
                      {isActive && (
                        <CornerDownLeft className="w-3.5 h-3.5 text-brand-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint bar */}
        <div className="flex items-center justify-between px-4 h-10 border-t border-slate-200 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <ArrowUp className="w-3 h-3" />
              <ArrowDown className="w-3 h-3" />
              navegar
            </span>
            <span className="flex items-center gap-1">
              <CornerDownLeft className="w-3 h-3" />
              seleccionar
            </span>
          </div>
          <span className="font-mono">TAPASEL · Command Center</span>
        </div>
      </div>
    </div>
  );
}
