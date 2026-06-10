import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Search, 
  Bell, 
  Plus, 
  FileText, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Sparkles,
  RefreshCw,
  FolderOpen,
  UserPlus,
  Coins,
  Menu,
  Sun,
  Moon
} from 'lucide-react';

// Types and mock databases
import { Cliente, Transaccion, Empleado, Documento, Alerta, AuditLog, Usuario, CarteraRecord, ProveedorRecord, CotizacionRecord } from './types';
import { 
  CLIENTES_INICIALES, 
  TRANSACCIONES_INICIALES, 
  EMPLEADOS_INICIALES, 
  DOCUMENTOS_INICIALES, 
  ALERTAS_INICIALES, 
  AUDIT_LOGS_INICIALES,
  ERP_USUARIOS,
  CARTERA_INICIAL,
  PROVEEDORES_INICIALES,
  COTIZACIONES_INICIALES
} from './mockData';

// Modular view blocks
import Sidebar from './components/Sidebar';
import AiAssistant from './components/AiAssistant';
import DashboardTab from './components/DashboardTab';
import FinanzasTab from './components/FinanzasTab';
import RRHHTab from './components/RRHHTab';
import DocumentosTab from './components/DocumentosTab';
import ConfiguracionTab from './components/ConfiguracionTab';
import LoginScreen from './components/LoginScreen';
import ProduccionTab from './components/ProduccionTab';
import TapaselLogo from './components/TapaselLogo';
import CommandCenter from './components/CommandCenter';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('tapasel_theme') as 'light' | 'dark') || 'dark';
  });

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('tapasel_theme', next);
  };

  // Synchronize the .dark class on <html> so CSS variables and body styles update
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Global Command Center shortcut (CTRL/CMD + K)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Authentication & Navigation State
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('tapasel_flow_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Synchronize with updated database permissions
        const matched = ERP_USUARIOS.find(u => u.id === parsed.id);
        if (matched) {
          return {
            ...parsed,
            permisos: matched.permisos,
            rol: matched.rol,
            cargo: matched.cargo
          };
        }
        return parsed;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [activeTab, setActiveTab] = useState<string>('panel');
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  
  // Interactive Databases States
  const [clientes, setClientes] = useState<Cliente[]>(CLIENTES_INICIALES);
  const [transacciones, setTransacciones] = useState<Transaccion[]>(TRANSACCIONES_INICIALES);
  const [cartera, setCartera] = useState<CarteraRecord[]>(CARTERA_INICIAL);
  const [proveedores, setProveedores] = useState<ProveedorRecord[]>(PROVEEDORES_INICIALES);
  const [cotizaciones, setCotizaciones] = useState<CotizacionRecord[]>(COTIZACIONES_INICIALES);
  const [empleados, setEmpleados] = useState<Empleado[]>(EMPLEADOS_INICIALES);
  const [documentos, setDocumentos] = useState<Documento[]>(DOCUMENTOS_INICIALES);
  const [alertas, setAlertas] = useState<Alerta[]>(ALERTAS_INICIALES);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(AUDIT_LOGS_INICIALES);

  // Modals visibility states
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isExpenditureModalOpen, setIsExpenditureModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  // Adding logs utility
  const appendLog = (agenteName: AuditLog['agenteName'], detail: string, nivel: AuditLog['nivel'] = 'Info') => {
    const newLog: AuditLog = {
      id: `L-${Date.now()}`,
      agenteName,
      fecha: new Date().toISOString().split('T')[0],
      hora: "0",
      detalle: detail,
      nivel
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Resolve warning actions
  const handleResolveAlerta = (alertaId: string) => {
    const alertFound = alertas.find(a => a.id === alertaId);
    if (!alertFound) return;

    setAlertas(prev => prev.filter(a => a.id !== alertaId));
    appendLog(
      "Agente de Auditoría",
      `Forense automatizado ejecutado: Resolución de alerta de ${alertFound.titulo}.`,
      "Éxito"
    );
    
    // Perform simulated actions based on what warning was closed
    if (alertaId === 'A-01') {
      // Mora warning resolution: mark client payment received
      setClientes(prev => prev.map(c => c.estado === 'Mora' ? { ...c, estado: 'Al día', carteraPendiente: 0 } : c));
      appendLog(
        "Agente de Finanzas",
        "Sincronizó cartera. Recordatorios de pago masivos enviados. 3 cuentas marcadas al día.",
        "Éxito"
      );
    } else if (alertaId === 'A-03') {
      // Iron supplier opportunity buy resolved: register expenditure!
      const newExp: Transaccion = {
        id: `EGR-${Math.floor(Math.random() * 9000) + 1000}`,
        fecha: new Date().toISOString().split('T')[0],
        descripcion: "Suministro Crítico Acero - Compra Volumen con Descuento 18%",
        tipo: 'Egreso',
        categoria: 'Materia Primera',
        monto: 24500000,
        estado: 'Pagado',
        responsable: "Alex Mercer"
      };
      setTransacciones(prev => [newExp, ...prev]);
      appendLog(
        "Agente de Finanzas",
        "Aprobó orden de compra para volumen crítico de acero con suministro garantizado en 24h.",
        "Éxito"
      );
    }
    alert("Resolución autónoma: ¡El flujo de trabajo automatizado para esta alerta se ha completado!");
  };

  // Form Submissions
  const handleAddReceipt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const clienteId = data.get('clienteId') as string;
    const clientFound = clientes.find(c => c.id === clienteId);

    const newRec: Transaccion = {
      id: `REC-${Math.floor(Math.random() * 9000) + 1000}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: `Facturación y Recibo de Caja - ${clientFound ? clientFound.nombre : 'Cliente Genérico'}`,
      tipo: 'Ingreso',
      categoria: data.get('categoria') as string,
      monto: Number(data.get('monto')),
      estado: 'Pagado',
      clienteId,
      responsable: currentUser?.nombre || 'Colaborador'
    };

    setTransacciones(prev => [newRec, ...prev]);
    setIsReceiptModalOpen(false);
    appendLog(
      "Agente de Finanzas",
      `Generó ingreso ${newRec.id} de carteras por valor de $${newRec.monto.toLocaleString('es-CO')} COP dándole conciliación digital.`,
      "Éxito"
    );
  };

  const handleAddExpenditure = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const newExp: Transaccion = {
      id: `EGR-${Math.floor(Math.random() * 9000) + 1000}`,
      fecha: new Date().toISOString().split('T')[0],
      descripcion: data.get('descripcion') as string,
      tipo: 'Egreso',
      categoria: data.get('categoria') as string,
      monto: Number(data.get('monto')),
      estado: 'Pagado',
      responsable: currentUser?.nombre || 'Colaborador'
    };

    setTransacciones(prev => [newExp, ...prev]);
    setIsExpenditureModalOpen(false);
    appendLog(
      "Agente de Finanzas",
      `Registró egreso corporativo ${newExp.id} de tesorería por $${newExp.monto.toLocaleString('es-CO')} COP.`,
      "Éxito"
    );
  };

  const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);

    const newEmp: Empleado = {
      id: `EMP-${Math.floor(Math.random() * 9000) + 1000}`,
      nombre: data.get('nombre') as string,
      cargo: data.get('cargo') as string,
      area: data.get('area') as any,
      estado: 'Activo',
      email: data.get('email') as string,
      telefono: data.get('telefono') as string,
      fechaIngreso: new Date().toISOString().split('T')[0],
      salario: Number(data.get('salario')),
      asistenciaHoy: { checkIn: "08:14 AM", estado: "Presente" },
      documentosVencidos: []
    };

    setEmpleados(prev => [newEmp, ...prev]);
    setIsEmployeeModalOpen(false);
    appendLog(
      "Agente de RR.HH.",
      `Alta corporativa completada: Carga de legajo en nube para el colaborador ${newEmp.nombre}.`,
      "Éxito"
    );
  };

  // OCR Document scanner simulation trigger
  const [scanningDocument, setScanningDocument] = useState(false);
  const handleAddDocument = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setScanningDocument(true);

    setTimeout(() => {
      const newDoc: Documento = {
        id: `DOC-${Math.floor(Math.random() * 9000) + 1000}`,
        nombre: `${data.get('nombre') || 'escaneado_factura'}.pdf`,
        departamento: data.get('departamento') as string,
        fechaCreacion: new Date().toISOString().split('T')[0],
        fechaModificacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
        responsable: currentUser?.nombre || 'Colaborador',
        version: "v1.0.0",
        tamano: "840 KB",
        estadoVerificacion: "Verificado",
        tipoDocumental: "Contrato",
        historialVersiones: [
          { 
            version: "v1.0.0", 
            fecha: new Date().toISOString().replace('T', ' ').substring(0, 16), 
            usuario: currentUser?.nombre || 'Colaborador', 
            comentario: "Documento radicado de forma autónoma tras escaneo y reconocimiento de texto OCR de alta precisión." 
          }
        ]
      };

      setDocumentos(prev => [newDoc, ...prev]);
      setScanningDocument(false);
      setIsDocumentModalOpen(false);
      appendLog(
        "Agente de Documentos",
        `OCR Inteligente completado: Indexado y clasificado PDF de forma automática bajo el descriptor ${newDoc.nombre}.`,
        "Éxito"
      );
      alert("¡Simulación OCR completada! El documento ha sido clasificado y verificado.");
    }, 2000);
  };

  // Sancionar nueva versión en documentos
  const handleSancionarVersion = (docId: string, version: string, comentario: string) => {
    setDocumentos(prev => prev.map(doc => {
      if (doc.id === docId) {
        return {
          ...doc,
          version,
          fechaModificacion: new Date().toISOString().replace('T', ' ').substring(0, 16),
          responsable: currentUser?.nombre || 'Colaborador',
          historialVersiones: [
            {
              version,
              fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
              usuario: currentUser?.nombre || 'Colaborador',
              comentario
            },
            ...doc.historialVersiones
          ]
        };
      }
      return doc;
    }));
    // Append log
    appendLog(
      "Agente de Documentos",
      `Sancionó nueva versión ${version} para archivo ID: ${docId}`,
      "Info"
    );
  };

  // Local AI trigger shortcuts
  const handlePostAiAssistantQuery = (prompt: string) => {
    setIsAiOpen(true);
    // Let's scroll the drawer button or let the state trigger
    setTimeout(() => {
      const customEvent = new CustomEvent('aiPromptSearch', { detail: prompt });
      window.dispatchEvent(customEvent);
    }, 100);
  };

  if (!currentUser) {
    return (
      <div className={theme}>
        <LoginScreen 
          onLoginSuccess={(u) => {
            setCurrentUser(u);
            localStorage.setItem('tapasel_flow_user', JSON.stringify(u));
            if (!u.permisos.includes(activeTab)) {
              setActiveTab(u.permisos[0]);
            }
          }} 
        />
      </div>
    );
  }

  return (
    <div className={theme}>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased text-sm transition-colors duration-200">
      
      {/* Sidebar mobile overlay backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-35 lg:hidden"
        />
      )}

      {/* Structural Modular Sidebar panel */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser} 
        onLogout={() => {
          setCurrentUser(null);
          localStorage.removeItem('tapasel_flow_user');
          setActiveTab('panel');
        }} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        theme={theme}
      />

      {/* Main viewport Container (spacious desktop indent left 280px) */}
      <div className="pl-0 lg:pl-[280px] w-full min-w-0">
        
        {/* Global sticky header */}
        <header className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-200 h-[72px] px-4 sm:px-8 flex items-center justify-between z-30 gap-4">
          
          {/* Hamburger toggle and logo on mobile */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none border-none bg-transparent cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center lg:hidden">
              <TapaselLogo className="h-8 w-auto" isDarkTheme={theme === 'dark'} />
            </div>
            
            {/* Real search bar descriptor (hidden on narrow screens) */}
            <button
              type="button"
              onClick={() => setIsCommandOpen(true)}
              aria-label="Abrir búsqueda global (Ctrl K)"
              className="relative w-80 xl:w-96 hidden md:flex items-center gap-2.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg py-2 pl-10 pr-3 text-xs text-slate-400 transition-colors cursor-pointer outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <span className="flex-1 text-left truncate">Buscar clientes, documentos, acciones...</span>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 h-5 rounded bg-white border border-slate-200 text-[10px] font-mono text-slate-500 shrink-0">
                Ctrl K
              </kbd>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            
            {/* Blinking connection status indicator dot (hidden on small mobile) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full font-mono text-[10px] text-emerald-700 font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              <span>IA ACTIVA</span>
            </div>

            {/* Quick assistant dialog click action */}
            <button 
              onClick={() => setIsAiOpen(true)}
              className="px-3 sm:px-4 py-2 bg-brand-primary hover:bg-brand-primary-container text-white font-display font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-all outline-none border-none cursor-pointer shadow-sm shadow-brand-primary/10"
            >
              <Bot className="w-4 h-4" />
              <span className="hidden xs:inline">Asistente IA</span>
              <span className="inline xs:hidden">Chat IA</span>
            </button>



            {/* Selector de Tema Claro/Oscuro */}
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded-lg transition-all border-none bg-transparent cursor-pointer flex items-center justify-center outline-none"
              title="Cambiar Tema Claro/Oscuro"
            >
              {theme === 'light' ? (
                <Moon className="w-4.5 h-4.5" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-brand-primary" />
              )}
            </button>

            {/* Notifications panel toggle button */}
            <button className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all relative border-none bg-transparent cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-1 right-1 bg-red-500 w-1.5 h-1.5 rounded-full animate-pulse" />
            </button>

          </div>

        </header>

        {/* Tab contents viewport wrapper fluid sizing */}
        <main className="p-4 sm:p-8 max-w-[1440px] mx-auto pb-20">
          {activeTab === 'panel' && (
            <DashboardTab 
              transacciones={transacciones}
              onOpenNewReceipt={() => setIsReceiptModalOpen(true)}
              onOpenNewEmployee={() => setIsEmployeeModalOpen(true)}
              onOpenNewDocument={() => setIsDocumentModalOpen(true)}
              activeTab={activeTab}
              currentUser={currentUser}
            />
          )}

          {activeTab.startsWith('finanzas') && (
            <FinanzasTab 
              transacciones={transacciones}
              clientes={clientes}
              cartera={cartera}
              proveedores={proveedores}
              cotizaciones={cotizaciones}
              onOpenNewReceipt={() => setIsReceiptModalOpen(true)}
              onOpenNewExpenditure={() => setIsExpenditureModalOpen(true)}
              onPostAiAssistantQuery={handlePostAiAssistantQuery}
              activeTab={activeTab}
              onAddProveedor={(newProv) => {
                setProveedores(prev => [newProv, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Nuevo registro de Proveedor: ${newProv.proveedorNombre} - Factura #${newProv.factura} de $${newProv.totalAPagar.toLocaleString('es-CO')} COP.`,
                  "Éxito"
                );
              }}
              onUpdateProveedor={(updatedProv) => {
                setProveedores(prev => prev.map(p => p.id === updatedProv.id ? updatedProv : p));
                appendLog(
                  "Agente de Finanzas",
                  `Proveedor Actualizado: ${updatedProv.proveedorNombre} - Factura #${updatedProv.factura} cambiada a estado '${updatedProv.estado}'.`,
                  "Éxito"
                );
              }}
              onAddCotizacion={(newCot) => {
                setCotizaciones(prev => [newCot, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Nueva Cotización generada: No. ${newCot.cotizacionNo} para ${newCot.clienteNombre} por un total de $${newCot.total.toLocaleString('es-CO')} COP.`,
                  "Éxito"
                );
              }}
              onUpdateCotizacion={(updatedCot) => {
                setCotizaciones(prev => prev.map(c => c.id === updatedCot.id ? updatedCot : c));
                appendLog(
                  "Agente de Finanzas",
                  `Cotización No. ${updatedCot.cotizacionNo} actualizada y firmada con éxito.`,
                  "Éxito"
                );
              }}
              onDeleteCotizacion={(id) => {
                setCotizaciones(prev => prev.filter(c => c.id !== id));
                appendLog(
                  "Agente de Finanzas",
                  `Cotización con ID ${id} eliminada.`,
                  "Alerta"
                );
              }}
              onAddTransaction={(newTx) => {
                const finalTx: Transaccion = {
                  ...newTx,
                  id: `${newTx.tipo === 'Ingreso' ? 'REC' : 'EGR'}-${Math.floor(Math.random() * 9000) + 1000}`
                };
                setTransacciones(prev => [finalTx, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Asiento contable integrado: ${finalTx.descripcion} (${finalTx.tipo}) por $${finalTx.monto.toLocaleString('es-CO')} COP.`,
                  "Éxito"
                );
              }}
              onSettleTransaction={(id) => {
                setTransacciones(prev => prev.map(t => {
                  if (t.id === id) {
                    return { ...t, estado: 'Pagado' };
                  }
                  return t;
                }));
                const titleText = transacciones.find(t => t.id === id)?.descripcion || id;
                appendLog(
                  "Agente de Finanzas",
                  `Conciliación y sello definitivo para el asiento ${id} [${titleText}] asentado positivamente en balances corporativos.`,
                  "Éxito"
                );
              }}
              onAddCliente={(newCli) => {
                setClientes(prev => [newCli, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Registro de base de datos de clientes completo: ${newCli.nombre} (NIT o CC: ${newCli.id}) asociado a obra/proyecto: ${newCli.contacto}`,
                  "Éxito"
                );
              }}
              onAddCartera={(newRecord) => {
                setCartera(prev => [newRecord, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Nuevo registro en Cartera: Factura #${newRecord.factura} para el cliente ${newRecord.clienteNombre} por un total de $${newRecord.totalAPagar.toLocaleString('es-CO')} COP.`,
                  "Éxito"
                );
              }}
              onUpdateCartera={(updatedRecord) => {
                setCartera(prev => prev.map(r => r.id === updatedRecord.id ? updatedRecord : r));
                appendLog(
                  "Agente de Finanzas",
                  `Actualizado registro de Cartera Factura #${updatedRecord.factura} (${updatedRecord.clienteNombre}): Estado cambió a '${updatedRecord.estado}'.`,
                  "Éxito"
                );
              }}
            />
          )}

          {activeTab.startsWith('rrhh') && (
            <RRHHTab 
              empleados={empleados}
              onOpenNewEmployee={() => setIsEmployeeModalOpen(true)}
              onPostAiAssistantQuery={handlePostAiAssistantQuery}
              onAddEmployee={(newEmp: Empleado) => {
                setEmpleados(prev => [newEmp, ...prev]);
                appendLog(
                  "Agente de RR.HH.",
                  `Alta corporativa y registro de nómina completados: Colaborador ${newEmp.nombre} añadido al escalafón.`,
                  "Éxito"
                );
              }}
              onUpdateEmployee={(updatedEmp: Empleado) => {
                setEmpleados(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
                appendLog(
                  "Agente de RR.HH.",
                  `Datos del colaborador ${updatedEmp.nombre} actualizados exitosamente.`,
                  "Éxito"
                );
              }}
              onDeleteEmployee={(id: string) => {
                setEmpleados(prev => prev.filter(e => e.id !== id));
                appendLog(
                  "Agente de RR.HH.",
                  `Colaborador con ID ${id} eliminado del sistema.`,
                  "Alerta"
                );
              }}
              transacciones={transacciones}
              onAddTransaction={(newTx: Omit<Transaccion, 'id'>) => {
                const finalTx: Transaccion = {
                  ...newTx,
                  id: `EGR-NOM-${Math.floor(Math.random() * 9000) + 1000}`
                };
                setTransacciones(prev => [finalTx, ...prev]);
                appendLog(
                  "Agente de RR.HH.",
                  `Asiento automático registrado: ${finalTx.descripcion} por valor de ${new Intl.NumberFormat('es-CO', {style: 'currency', currency: 'COP', minimumFractionDigits: 0}).format(finalTx.monto)}.`,
                  "Éxito"
                );
              }}
              activeTab={activeTab}
            />
          )}

          {activeTab.startsWith('documentos') && (
            <DocumentosTab 
              documentos={documentos}
              onOpenNewDocument={() => setIsDocumentModalOpen(true)}
              onPostAiAssistantQuery={handlePostAiAssistantQuery}
              onSancionarVersion={handleSancionarVersion}
              activeTab={activeTab}
              currentUser={currentUser}
              onAddDocument={(newDoc) => {
                setDocumentos(prev => [newDoc, ...prev]);
                appendLog(
                  "Agente de Documentos",
                  `Radicación de archivo ${newDoc.nombre} (${newDoc.id}) completada por ${newDoc.responsable}.`,
                  "Éxito"
                );
              }}
              onUpdateDocument={(updatedDoc) => {
                setDocumentos(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
                appendLog(
                  "Agente de Documentos",
                  `Documento ${updatedDoc.nombre} actualizado a estado '${updatedDoc.estadoVerificacion}'.`,
                  "Éxito"
                );
              }}
              onDeleteDocument={(id) => {
                setDocumentos(prev => prev.filter(d => d.id !== id));
                appendLog(
                  "Agente de Documentos",
                  `Documento con ID ${id} eliminado.`,
                  "Alerta"
                );
              }}
            />
          )}

          {activeTab.startsWith('produccion') && (
            <ProduccionTab 
              onPostAiAssistantQuery={handlePostAiAssistantQuery}
              activeTab={activeTab}
              onAddTransaction={(newTx) => {
                const finalTx: Transaccion = {
                  ...newTx,
                  id: `EGR-LOG-${Math.floor(Math.random() * 9000) + 1000}`
                };
                setTransacciones(prev => [finalTx, ...prev]);
                appendLog(
                  "Agente de Finanzas",
                  `Flete logístico facturado: ${finalTx.descripcion} por valor de $${finalTx.monto.toLocaleString('es-CO')} COP.`,
                  "Éxito"
                );
              }}
            />
          )}

          {activeTab === 'configuracion' && (
            <ConfiguracionTab 
              currentUser={currentUser}
              appendLog={appendLog}
            />
          )}
        </main>

      </div>

      {/* Right Drawer Slide out: Executive AI Assistant Dialogue chatbot */}
      <AiAssistant 
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        clientes={clientes}
        transacciones={transacciones}
        empleados={empleados}
        documentos={documentos}
        currentUser={currentUser}
      />

      {/* Command Center (CTRL + K) - búsqueda global y acciones rápidas */}
      <CommandCenter
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        clientes={clientes}
        empleados={empleados}
        documentos={documentos}
        transacciones={transacciones}
        currentUser={currentUser}
        onNavigate={(tab) => {
          setActiveTab(tab);
          setIsSidebarOpen(false);
        }}
        onOpenNewReceipt={() => setIsReceiptModalOpen(true)}
        onOpenNewEmployee={() => setIsEmployeeModalOpen(true)}
        onOpenNewDocument={() => setIsDocumentModalOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
      />

      {/* 4 Form Modals declarations */}
      
      {/* Modal 1: Generar Recibo de Caja */}
      {isReceiptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-100/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 dark:text-white">Generar Nuevo Recibo de Caja COP</h3>
              <button onClick={() => setIsReceiptModalOpen(false)} className="text-sm font-mono text-slate-400 hover:text-slate-800 dark:hover:text-white border-none bg-transparent cursor-pointer">Cerrar</button>
            </div>
            
            <form onSubmit={handleAddReceipt} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Seleccionar Deudor Co-Asociado</label>
                <select name="clienteId" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                  {clientes.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre} (Deuda: ${c.carteraPendiente.toLocaleString('es-CO')} COP)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Categoría de Ingreso</label>
                <select name="categoria" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                  <option value="Facturación">Facturación Directa</option>
                  <option value="Servicio Técnico">Servicio Técnico/Mantenimiento</option>
                  <option value="Venta de Producto">Venta de Producto</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Monto a Conciliar (Pesos COP)</label>
                <input required type="number" name="monto" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="Valor numérico sin puntos..." />
              </div>

              <button type="submit" className="w-full py-2.5 bg-brand-primary text-white font-display font-bold text-xs uppercase tracking-wide rounded hover:opacity-90 transition-all mt-4 border-none cursor-pointer">
                Sancionar Recibo y Conciliar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Registrar Gasto (Egreso) */}
      {isExpenditureModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-100/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 dark:text-white">Registrar Factura de Gasto (Egreso)</h3>
              <button onClick={() => setIsExpenditureModalOpen(false)} className="text-sm font-mono text-slate-400 hover:text-slate-800 dark:hover:text-white border-none bg-transparent cursor-pointer">Cerrar</button>
            </div>
            
            <form onSubmit={handleAddExpenditure} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Descripción del Gasto</label>
                <input required type="text" name="descripcion" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary" placeholder="Ej: Compra de lubricantes de prensa industrial..." />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Categoría contable</label>
                <select name="categoria" className="w-full bg-slate-550 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                  <option value="Materia Primera">Materia Prima</option>
                  <option value="Infraestructura Cloud">Infraestructura Nube y Datacenter</option>
                  <option value="Servidor Local">Hardware Servidor local</option>
                  <option value="Arrendamiento">Arrendamiento de Oficinas</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Monto Total COP</label>
                <input required type="number" name="monto" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="Valor numérico en pesos..." />
              </div>

              <button type="submit" className="w-full py-2.5 bg-brand-primary text-white font-display font-bold text-xs uppercase tracking-wide rounded hover:opacity-90 transition-all mt-4 border-none cursor-pointer">
                Radicar Egreso Digital
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Vincular Colaborador */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-100/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 dark:text-white">Simular Contrato Laboral Empleado</h3>
              <button onClick={() => setIsEmployeeModalOpen(false)} className="text-sm font-mono text-slate-400 hover:text-slate-800 dark:hover:text-white border-none bg-transparent cursor-pointer">Cerrar</button>
            </div>
            
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Nombre Completo del Colaborador</label>
                <input required type="text" name="nombre" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary" placeholder="Ej: Sonia Bermudez Arismendy" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Cargo a Desempeñar</label>
                  <input required type="text" name="cargo" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary" placeholder="Ej: Jefe de Soldadura" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Área Operativa</label>
                  <select name="area" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                    <option value="Ingeniería">Ingeniería</option>
                    <option value="Logística">Logística / Almacén</option>
                    <option value="RR.HH.">Talento Humano</option>
                    <option value="Administración">Administración</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Email Corporativo</label>
                  <input required type="email" name="email" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="s.bermudez@tapasel.co" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block font-mono">Celular</label>
                  <input required type="text" name="telefono" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="3005551221" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Asignación Salarial COP</label>
                <input required type="number" name="salario" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="Valor pesos, Ej: 4800000" />
              </div>

              <button type="submit" className="w-full py-2.5 bg-brand-primary text-white font-display font-bold text-xs uppercase tracking-wide rounded hover:opacity-90 transition-all mt-4 border-none cursor-pointer">
                Crear Registro e Iniciar Módulo de Firma
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Alta Documento (Escanear OCR neural) */}
      {isDocumentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-100 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col">
            <div className="bg-slate-50 dark:bg-slate-100/50 p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <h3 className="font-display font-bold text-slate-900 dark:text-white">Escanear y Radicar Documento OCR</h3>
              <button onClick={() => setIsDocumentModalOpen(false)} className="text-sm font-mono text-slate-400 hover:text-slate-800 dark:hover:text-white border-none bg-transparent cursor-pointer">Cerrar</button>
            </div>
            
            <form onSubmit={handleAddDocument} className="p-6 space-y-4">
              
              {/* Fake drag and drop zone */}
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-primary/50 p-6 rounded-lg text-center bg-slate-50/50 dark:bg-slate-200/50 transition-colors pointer-events-none">
                <FolderOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold block">Arrastre el PDF aquí o haga clic</span>
                <span className="text-[10px] text-slate-400 block mt-1 font-mono">Archivos soportados: PDF, XLSX, DOCX</span>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Nombre Descriptivo Archivo</label>
                <input required type="text" name="nombre" className="w-full bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white rounded p-2.5 outline-none focus:border-brand-primary font-mono" placeholder="Certificado_Seguros_Renovacion_Planta" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Departamento Destino</label>
                  <select name="departamento" className="w-full bg-slate-550 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                    {currentUser?.rol === 'CFO' ? (
                      <option value="Finanzas">Finanzas y Libros</option>
                    ) : (
                      <>
                        <option value="Finanzas">Finanzas y Libros</option>
                        <option value="RRHH">Talento Humano</option>
                        <option value="Operaciones">Operaciones Planta</option>
                        <option value="Legal">Legal y Contratos</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-brand-primary uppercase font-bold block">Clase Documental</label>
                  <select name="tipoDocumental" className="w-full bg-slate-550 bg-slate-50 dark:bg-slate-200 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-100 rounded p-2.5 outline-none focus:border-brand-primary">
                    {currentUser?.rol === 'CFO' ? (
                      <option value="Financia">Finanzas y Libros</option>
                    ) : (
                      <>
                        <option value="Certificado">Certificado de Cumplimiento</option>
                        <option value="Contrato">Contrato de Trabajo</option>
                        <option value="Incapacidad">Incapacidad Médica</option>
                        <option value="Legal">Documento Constitutivo Legal</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={scanningDocument}
                className="w-full py-3 bg-brand-primary text-white font-display font-bold text-xs uppercase tracking-wide rounded hover:opacity-90 disabled:opacity-50 transition-all mt-4 flex items-center justify-center gap-1.5 border-none cursor-pointer"
              >
                {scanningDocument ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Corriendo OCR Neural (Leyendo PDF...)</span>
                  </>
                ) : (
                  <span>Iniciar Analísis de Integridad y Clasificar</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
