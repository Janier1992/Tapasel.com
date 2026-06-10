import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Coins, 
  Users, 
  FolderGit, 
  Settings, 
  LogOut,
  X,
  Cpu,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Usuario } from '../types';
import TapaselLogo from './TapaselLogo';

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: { id: string; label: string }[];
}

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: Usuario;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  theme: 'light' | 'dark';
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, onLogout, isOpen, onClose, theme }: SidebarProps) {
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const menuItems: MenuItem[] = [
    { id: 'panel', label: 'Panel', icon: LayoutDashboard },
    { 
      id: 'finanzas', label: 'Finanzas', icon: Coins,
      children: [
        { id: 'finanzas-clientes', label: 'Clientes' },
        { id: 'finanzas-recibos', label: 'Recibos de Caja' },
        { id: 'finanzas-cartera', label: 'Cartera (Seguimiento)' },
        { id: 'finanzas-proveedores', label: 'Proveedores (Ingreso)' },
        { id: 'finanzas-cotizaciones', label: 'Cotizaciones (Cotiza)' },
        { id: 'finanzas-porpagar', label: 'Cuentas por Pagar' },
        { id: 'finanzas-otros', label: 'Otros Egresos' },
        { id: 'finanzas-reportes', label: 'Reportes' },
      ]
    },
    { 
      id: 'rrhh', label: 'RR.HH.', icon: Users,
      children: [
        { id: 'rrhh-empleados', label: 'Control de Empleados' },
        { id: 'rrhh-nomina', label: 'Nómina' },
        { id: 'rrhh-horarios', label: 'Control de Horarios' },
        { id: 'rrhh-novedades', label: 'Novedades' },
        { id: 'rrhh-dashboard', label: 'Costos & Contabilidad' },
      ]
    },
    { 
      id: 'documentos', label: 'Documentos', icon: FolderGit,
      children: [
        { id: 'documentos-archivados', label: 'Archivados' },
        { id: 'documentos-pendientes', label: 'Pendientes' },
      ]
    },
    { 
      id: 'produccion', label: 'Producción', icon: Cpu,
      children: [
        { id: 'produccion-ordenes', label: 'Ordenes' },
        { id: 'produccion-procesos', label: 'Procesos' },
      ]
    },
    { id: 'configuracion', label: 'Configuraciones', icon: Settings },
  ];

  const filteredMenuItems = menuItems.filter((item) => 
    currentUser.permisos.includes(item.id)
  );

  const toggleMenu = (id: string) => {
    setOpenMenus(prev => {
      const alreadyOpen = prev[id];
      if (!alreadyOpen) {
        // Opening this menu, collapse all others
        return { [id]: true };
      } else {
        // Closing this menu
        return { ...prev, [id]: false };
      }
    });
  };

  const isMenuOpen = (id: string) => !!openMenus[id];

  return (
    <aside className={`fixed left-0 top-0 h-full w-[280px] bg-zinc-950 border-r border-zinc-900 flex flex-col py-6 z-45 transition-all duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="px-6 mb-8 flex justify-between items-center gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <TapaselLogo className="h-10 w-auto" isDarkTheme={true} />
          </div>
          <p className="font-mono text-[9px] text-brand-primary uppercase tracking-widest mt-1.5 pl-1.5 font-bold">
            FLOW AI • ERP Modular
          </p>
        </div>
        {onClose && (
          <button 
            onClick={onClose} 
            className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors focus:outline-none border-none bg-transparent cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const hasChildren = item.children && item.children.length > 0;
          const isOpen = isMenuOpen(item.id);

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (hasChildren) {
                    toggleMenu(item.id);
                  } else {
                    setActiveTab(item.id);
                    onClose?.();
                  }
                }}
                className={`w-full flex items-center gap-3 px-6 py-3.5 text-left transition-all cursor-pointer border-none bg-transparent ${
                  isActive
                    ? 'border-l-4 border-brand-primary text-white bg-zinc-900/80 font-semibold font-display'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-brand-primary' : 'text-zinc-500'}`} />
                <span className="text-sm font-semibold flex-1">{item.label}</span>
                {hasChildren && (
                  isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                )}
              </button>
              
              {hasChildren && isOpen && (
                <div className="bg-zinc-900/40 py-1">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => {
                        setActiveTab(child.id);
                        onClose?.();
                      }}
                      className="w-full flex items-center gap-3 px-12 py-2.5 text-left text-sm text-zinc-400 hover:text-white hover:bg-zinc-900/50 transition-all cursor-pointer border-none bg-transparent"
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Dynamic bottom section displaying logged in user and a logout trigger */}
      <div className="mt-auto pt-4 border-t border-zinc-900 px-3 space-y-3">
        <div className="px-3 py-3.5 bg-zinc-900/50 rounded-xl border border-zinc-900 flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-zinc-800 border border-brand-primary/20 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-xs text-brand-primary">
                {currentUser.avatarInitials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-semibold text-white truncate">
                {currentUser.nombre}
              </h4>
              <p className="text-[10px] text-brand-primary font-mono uppercase tracking-wider truncate font-bold">
                {currentUser.cargo}
              </p>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            className="w-full py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 font-medium hover:text-rose-450 hover:bg-rose-500/10 rounded flex items-center justify-center gap-2 transition-all cursor-pointer border-none"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
