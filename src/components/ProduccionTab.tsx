import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Plus, 
  Search, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Activity, 
  Filter, 
  Clock,
  Layers,
  Percent,
  Check,
  Truck,
  Package,
  MapPin,
  Globe,
  Barcode,
  Navigation,
  DollarSign,
  Calendar,
  Compass,
  ArrowUpRight
} from 'lucide-react';
import { OrdenProduccion, Transaccion } from '../types';
import { formatCurrencyCOP as formatCurrency } from '../lib/formatters';
import { ORDENES_PRODUCCION_INICIALES } from '../mockData';

interface EnvioLogistico {
  id: string;
  orderId: string;
  cliente: string; 
  producto: string;
  cantidad: number;
  transportadora: string;
  guiaSeguimiento: string;
  origen: string;
  destino: string;
  costoEnvio: number;
  estadoEnvio: 'En Centro de Acopio' | 'En Tránsito' | 'En Distribución' | 'Entregado' | 'Retenido en Aduana';
  fechaEnvio: string;
  estimadoEntrega: string;
}

interface ProduccionTabProps {
  onPostAiAssistantQuery: (prompt: string) => void;
  activeTab: string;
  onAddTransaction?: (newTx: Omit<Transaccion, 'id'>) => void;
}

export default function ProduccionTab({ onPostAiAssistantQuery, activeTab, onAddTransaction }: ProduccionTabProps) {
  const [orders, setOrders] = useState<OrdenProduccion[]>(() => ORDENES_PRODUCCION_INICIALES);
  
  // Tab control inside the Production & Logistics Module
  const [activeSubTab, setActiveSubTab] = useState<'ordenes' | 'logistica'>('ordenes');

  useEffect(() => {
    const tabMap: Record<string, typeof activeSubTab> = {
      'produccion-ordenes': 'ordenes',
      'produccion-procesos': 'logistica',
    };
    
    if (activeTab in tabMap) {
      setActiveSubTab(tabMap[activeTab]);
    }
  }, [activeTab]);

  // Search & Filter state for production
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  
  // Search & Filter state for logistics
  const [shipmentSearch, setShipmentSearch] = useState('');
  const [shipmentStatusFilter, setShipmentStatusFilter] = useState<string>('All');

  // New Order Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newProducto, setNewProducto] = useState('');
  const [newCantidad, setNewCantidad] = useState(100);
  const [newCliente, setNewCliente] = useState('');
  const [newPrioridad, setNewPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const [newOperador, setNewOperador] = useState('');

  // Selected Order details
  const [selectedOrderId, setSelectedOrderId] = useState<string>('OP-981');
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  // Shipments & Logistics data state
  const [shipments, setShipments] = useState<EnvioLogistico[]>([
    {
      id: "SH-402",
      orderId: "OP-985",
      cliente: "TASA Custom Systems Ltda.",
      producto: "Módulo Amplificador Audio de Alta Fidelidad HIFI",
      cantidad: 400,
      transportadora: "DHL Express",
      guiaSeguimiento: "DHL-984010294",
      origen: "Planta SMT Medellín",
      destino: "Sede Corporativa Bogotá - Calle 93 #12-40",
      costoEnvio: 345000,
      estadoEnvio: 'Entregado',
      fechaEnvio: "2026-05-24",
      estimadoEntrega: "2026-05-26"
    },
    {
      id: "SH-403",
      orderId: "OP-981",
      cliente: "TermoControles Industriales S.A.S.",
      producto: "Tarjeta Controladora de Temperatura IoT T-500",
      cantidad: 1200,
      transportadora: "Servientrega",
      guiaSeguimiento: "SERVI-817293012",
      origen: "Planta SMT Medellín",
      destino: "Planta Industrial Cali - Acopi Bloque D",
      costoEnvio: 580000,
      estadoEnvio: 'En Tránsito',
      fechaEnvio: "2026-05-27",
      estimadoEntrega: "2026-06-01"
    }
  ]);

  // Selected shipment detail state
  const [selectedShipmentId, setSelectedShipmentId] = useState<string>('SH-403');
  const selectedShipment = shipments.find(s => s.id === selectedShipmentId) || shipments[0];

  // New Shipment Form status
  const [isShipmentFormOpen, setIsShipmentFormOpen] = useState(false);
  const [shipFormOrderId, setShipFormOrderId] = useState<string>('');
  const [shipFormCarrier, setShipFormCarrier] = useState<string>('Servientrega');
  const [shipFormTracking, setShipFormTracking] = useState<string>('');
  const [shipFormDest, setShipFormDest] = useState<string>('');
  const [shipFormCost, setShipFormCost] = useState<number>(240000);
  const [shipFormDays, setShipFormDays] = useState<number>(3);

  // Formato de moneda centralizado en src/lib/formatters.ts (evita duplicación).
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProducto || !newCliente) return;

    const newOrder: OrdenProduccion = {
      id: `OP-${Math.floor(Math.random() * 900) + 100}`,
      producto: newProducto,
      cantidad: Number(newCantidad),
      cliente: newCliente,
      fechaCreacion: new Date().toISOString().split('T')[0],
      fechaEntrega: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estado: 'Diseño',
      prioridad: newPrioridad,
      eficienciaEstimada: Math.floor(Math.random() * 10) + 90, // 90-99%
      operadorAsignado: newOperador || 'Operador Asignado Genérico'
    };

    setOrders(prev => [newOrder, ...prev]);
    setSelectedOrderId(newOrder.id);
    setIsFormOpen(false);

    // reset fields
    setNewProducto('');
    setNewCantidad(100);
    setNewCliente('');
    setNewPrioridad('Media');
    setNewOperador('');
    
    alert(`¡Orden de Producción ${newOrder.id} registrada exitosamente!\nFase inicial: Diseño de esquemáticos.`);
  };

  const handleAdvanceProcess = (orderId: string) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const states: Array<OrdenProduccion['estado']> = ['Diseño', 'Ensamble PCB', 'Soldadura', 'Calidad QA', 'Despachado'];
      const currentIndex = states.indexOf(order.estado);
      if (currentIndex === states.length - 1) return order; // already dispatched
      
      const nextState = states[currentIndex + 1];
      return {
        ...order,
        estado: nextState,
        eficienciaEstimada: Math.min(100, Math.max(85, order.eficienciaEstimada + (Math.floor(Math.random() * 5) - 2)))
      };
    }));
  };

  // Dispatch Logistics Trigger Form Submission
  const handleRegisterShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipFormOrderId || !shipFormDest) {
      alert("Por favor seleccione una Orden de Producción activa y especifique la dirección de destino.");
      return;
    }

    const orderAssociated = orders.find(o => o.id === shipFormOrderId);
    if (!orderAssociated) return;

    const trackingCode = shipFormTracking || `${shipFormCarrier.substring(0,4).toUpperCase()}-${Math.floor(Math.random() * 900000) + 100000}`;
    const newShip: EnvioLogistico = {
      id: `SH-${Math.floor(Math.random() * 900) + 100}`,
      orderId: shipFormOrderId,
      cliente: orderAssociated.cliente,
      producto: orderAssociated.producto,
      cantidad: orderAssociated.cantidad,
      transportadora: shipFormCarrier,
      guiaSeguimiento: trackingCode,
      origen: "Planta SMT Medellín",
      destino: shipFormDest,
      costoEnvio: Number(shipFormCost),
      estadoEnvio: 'En Centro de Acopio',
      fechaEnvio: new Date().toISOString().split('T')[0],
      estimadoEntrega: new Date(Date.now() + shipFormDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    // 1. Add Shipment to Log
    setShipments(prev => [newShip, ...prev]);

    // 1.5 Register corresponding Logistics Egreso in Finance ledger
    if (onAddTransaction) {
      onAddTransaction({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: `Flete de despacho ${newShip.id} - ${newShip.transportadora} (${newShip.producto})`,
        tipo: 'Egreso',
        categoria: 'Servicios de Planta',
        monto: newShip.costoEnvio,
        estado: 'Pagado',
        responsable: 'Marcus Chen (CFO)'
      });
    }

    // 2. Mark the associated Production Order as "Despachado"
    setOrders(prev => prev.map(order => {
      if (order.id === shipFormOrderId) {
        return {
          ...order,
          estado: 'Despachado' as const
        };
      }
      return order;
    }));

    setIsShipmentFormOpen(false);
    setSelectedShipmentId(newShip.id);

    // Reset fields
    setShipFormOrderId('');
    setShipFormTracking('');
    setShipFormDest('');
    setShipFormCost(240000);

    alert(`¡Orden de Envío ${newShip.id} registrada exitosamente!\nLa Orden ${shipFormOrderId} ha sido promovida a la fase: Despachado y transferida a la transportadora ${shipFormCarrier}.\nGuía de Seguimiento: ${trackingCode}`);
  };

  // Advance logistics shipment status
  const handleAdvanceLogistics = (shipId: string) => {
    setShipments(prev => prev.map(sh => {
      if (sh.id !== shipId) return sh;

      const states: Array<EnvioLogistico['estadoEnvio']> = ['En Centro de Acopio', 'En Tránsito', 'En Distribución', 'Entregado'];
      const currentIndex = states.indexOf(sh.estadoEnvio);
      if (currentIndex === -1 || currentIndex === states.length - 1) return sh; // already delivered or custom state

      const nextState = states[currentIndex + 1];
      return {
        ...sh,
        estadoEnvio: nextState
      };
    }));
  };

  const getStatusBadgeClass = (status: OrdenProduccion['estado']) => {
    switch (status) {
      case 'Diseño': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'Ensamble PCB': return 'bg-cyan-50 text-cyan-700 border border-cyan-200';
      case 'Soldadura': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'Calidad QA': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Despachado': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    }
  };

  const getLogisticsBadgeClass = (status: EnvioLogistico['estadoEnvio']) => {
    switch (status) {
      case 'En Centro de Acopio': return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'En Tránsito': return 'bg-amber-50 text-amber-700 border border-amber-200';
      case 'En Distribución': return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'Entregado': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      case 'Retenido en Aduana': return 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
    }
  };

  const getPriorityBadgeClass = (priority: OrdenProduccion['prioridad']) => {
    switch (priority) {
      case 'Alta': return 'bg-rose-50 text-rose-700 border border-rose-200 font-bold';
      case 'Media': return 'bg-slate-100 text-slate-700 border border-slate-200';
      case 'Baja': return 'bg-slate-50 border border-slate-200 text-slate-500';
    }
  };

  // Filter calculations
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.operadorAsignado.toLowerCase().includes(searchTerm.toLowerCase());
                          
    const matchesStatus = statusFilter === 'All' || o.estado === statusFilter;
    const matchesPriority = priorityFilter === 'All' || o.prioridad === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = s.cliente.toLowerCase().includes(shipmentSearch.toLowerCase()) || 
                          s.producto.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
                          s.id.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
                          s.orderId.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
                          s.guiaSeguimiento.toLowerCase().includes(shipmentSearch.toLowerCase()) ||
                          s.destino.toLowerCase().includes(shipmentSearch.toLowerCase());

    const matchesStatus = shipmentStatusFilter === 'All' || s.estadoEnvio === shipmentStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in text-slate-800">
      
      {/* Upper Metrics Dashboard connected dynamically */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-505 text-slate-500 tracking-wider block mb-1 font-bold">Órdenes SMT Activas</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-bold text-slate-900 tabular-nums">
              {orders.filter(o => o.estado !== 'Despachado').length}
            </h2>
            <span className="text-slate-500 text-xs">/ {orders.length} total</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-blue-600 h-full rounded-full" style={{ width: `${(orders.filter(o => o.estado !== 'Despachado').length / orders.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-500 tracking-wider block mb-1 font-bold">Despachos & Envíos Activos</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-3xl font-bold text-slate-900 tabular-nums">
              {shipments.filter(s => s.estadoEnvio !== 'Entregado').length}
            </h2>
            <span className="text-emerald-600 text-xs font-semibold">{shipments.filter(s => s.estadoEnvio === 'Entregado').length} entregados</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-amber-500 h-full rounded-full" style={{ width: `${(shipments.filter(s => s.estadoEnvio !== 'Entregado').length / shipments.length) * 100}%` }} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
          <span className="font-mono text-[10px] uppercase text-slate-500 tracking-wider block mb-1 font-bold">Inversión en Fletes / Envíos</span>
          <div className="flex items-baseline gap-2">
            <h2 className="font-display text-2xl font-bold text-slate-900 tabular-nums">
              {formatCurrency(shipments.reduce((sum, s) => sum + s.costoEnvio, 0))}
            </h2>
            <span className="text-slate-500 text-xs">COP</span>
          </div>
          <span className="text-[10px] text-slate-400 block mt-1">Costo logístico total acumulado en fletes</span>
        </div>

        {/* AI Pulso card */}
        <div className="bg-gradient-to-tr from-zinc-950 to-zinc-900 border border-zinc-800/30 p-5 rounded-xl flex flex-col justify-between shadow-sm text-white">
          <div>
            <span className="font-mono text-[10px] uppercase text-blue-400 tracking-widest block mb-1 font-bold">MONITOR LOGÍSTICO IA</span>
            <p className="text-xs text-slate-300 leading-tight">Canales de Servientrega fluídos hoy. No se detectan retrasos geográficos en Antioquia.</p>
          </div>
          <button 
            onClick={() => onPostAiAssistantQuery("Efectuar una simulación de tiempos de despacho de fletes Bogotá-Medellín y detectar demoras operativas.")}
            className="text-[10px] font-mono text-blue-400 hover:text-blue-300 hover:underline font-bold self-start mt-2 block uppercase border-none bg-transparent cursor-pointer"
          >
            Sugerencia Ruta IA
          </button>
        </div>

      </section>

      {/* Corporate Module Navigation Header */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('ordenes')}
          className={`pb-3 font-display font-bold text-xs relative transition-all uppercase tracking-wider border-none bg-transparent cursor-pointer outline-none ${
            activeSubTab === 'ordenes' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4" />
            <span>Control de Fabricación (Órdenes)</span>
          </div>
          {activeSubTab === 'ordenes' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
        <button
          onClick={() => setActiveSubTab('logistica')}
          className={`pb-3 font-display font-bold text-xs relative transition-all uppercase tracking-wider border-none bg-transparent cursor-pointer outline-none ${
            activeSubTab === 'logistica' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4" />
            <span>Proceso Logístico y Despachos (Shipments)</span>
          </div>
          {activeSubTab === 'logistica' && <div className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-600 rounded-full" />}
        </button>
      </div>

      {/* Dynamic Subtab Subdivisions */}

      {/* SUBTAB 1: PRODUCTION CONTROL AND WORK ORDERS */}
      {activeSubTab === 'ordenes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Side: Order List with search & filters (8/12) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-all"
                  placeholder="Buscar por placa, cliente u operador asignado..."
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 outline-none"
                >
                  <option value="All">Fases de Manufactura</option>
                  <option value="Diseño">Diseño</option>
                  <option value="Ensamble PCB">Ensamble PCB</option>
                  <option value="Soldadura">Soldadura</option>
                  <option value="Calidad QA">Calidad QA</option>
                  <option value="Despachado">Despachado</option>
                </select>

                <select 
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 outline-none"
                >
                  <option value="All">Prioridades</option>
                  <option value="Alta">Alta</option>
                  <option value="Media">Media</option>
                  <option value="Baja">Baja</option>
                </select>

                <button 
                  onClick={() => setIsFormOpen(!isFormOpen)}
                  className="p-2 border-none bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nueva OP</span>
                </button>
              </div>

            </div>

            {/* Form to load new operations order if open */}
            {isFormOpen && (
              <form onSubmit={handleCreateOrder} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in text-xs text-slate-700">
                <h4 className="font-semibold text-slate-900 border-b border-slate-205 border-slate-200 pb-2 flex items-center gap-2">
                  <Layers className="w-4.5 h-4.5 text-blue-600" />
                  Registrar Orden de Producción Electrónica (TASA)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Nombre del Producto / Tarjeta:</label>
                    <input 
                      type="text" 
                      required
                      value={newProducto}
                      onChange={(e) => setNewProducto(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Ej. Placa Central SmartIoT v4.2"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Cliente Solicitante:</label>
                    <input 
                      type="text" 
                      required
                      value={newCliente}
                      onChange={(e) => setNewCliente(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Ej. Industrias Electrónicas del Oriente"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Cantidad de Placas:</label>
                    <input 
                      type="number" 
                      required
                      min={10}
                      value={newCantidad}
                      onChange={(e) => setNewCantidad(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Técnico Asignado de Ensamble:</label>
                    <input 
                      type="text" 
                      value={newOperador}
                      onChange={(e) => setNewOperador(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Ej. Carlos Restrepo"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600">Prioridad:</label>
                    <select 
                      value={newPrioridad}
                      onChange={(e: any) => setNewPrioridad(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="Alta">Alta</option>
                      <option value="Media">Media</option>
                      <option value="Baja">Baja</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded border-none cursor-pointer"
                  >
                    Vincular Orden
                  </button>
                </div>
              </form>
            )}

            {/* List display */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                  <tr>
                    <th className="p-4 pl-6">ID Orden</th>
                    <th className="p-4">Tarjeta / Producto</th>
                    <th className="p-4">Cliente Solicitante</th>
                    <th className="p-4">Entrega</th>
                    <th className="p-4 text-center font-bold">Eficiencia</th>
                    <th className="p-4 text-center">Fase / Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {filteredOrders.map((order) => (
                    <tr 
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`hover:bg-slate-55 hover:bg-slate-50 cursor-pointer ${
                        selectedOrderId === order.id ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <td className="p-4 pl-6 font-mono font-bold text-slate-900">{order.id}</td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 leading-none">{order.producto}</div>
                        <span className="text-[10px] text-slate-400 block mt-1">Cant: {order.cantidad} unidades | OP Técnica</span>
                      </td>
                      <td className="p-4">
                        <div className="truncate font-medium">{order.cliente}</div>
                        <span className="text-[9px] text-slate-500 block">Op: {order.operadorAsignado}</span>
                      </td>
                      <td className="p-4 text-slate-505 text-slate-500 font-mono">{order.fechaEntrega}</td>
                      <td className="p-4 text-center font-mono font-bold text-emerald-600">
                        {order.eficienciaEstimada}%
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-mono rounded font-medium ${getStatusBadgeClass(order.estado)}`}>
                          {order.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-550 text-slate-505 text-slate-500">
                        No se encontraron órdenes de fabricación bajo los términos seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right Side: Interactive Progression and Details Panel (4/12) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {selectedOrder ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
                
                <div className="border-b border-slate-100 pb-4">
                  <span className="font-mono text-[9px] uppercase tracking-widest text-blue-600 font-bold block mb-1">Ficha de Proceso Electrónico</span>
                  <span className="text-lg font-bold font-display text-slate-900 block leading-tight">{selectedOrder.producto}</span>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block px-1.5 py-0.5 text-[9px] uppercase font-mono rounded ${getPriorityBadgeClass(selectedOrder.prioridad)}`}>
                      Prioridad {selectedOrder.prioridad}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">ID: {selectedOrder.id}</span>
                  </div>
                </div>

                {/* Stepper Timeline */}
                <div className="space-y-4">
                  <h5 className="text-[11px] font-mono text-slate-500 uppercase tracking-wider font-bold">Historial de Fabricación SMT</h5>
                  
                  <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {/* Step 1: Diseño */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Diseño', 'Ensamble PCB', 'Soldadura', 'Calidad QA', 'Despachado'].indexOf(selectedOrder.estado) >= 0
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-semibold text-slate-850 text-slate-800">1. Diseño de Planos & Esquemáticos</div>
                      <p className="text-[10px] text-slate-400">Esquematizado de circuitería CAD verificado.</p>
                    </div>

                    {/* Step 2: Ensamble PCB */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Ensamble PCB', 'Soldadura', 'Calidad QA', 'Despachado'].indexOf(selectedOrder.estado) >= 1
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-semibold text-slate-850 text-slate-800">2. Montaje y Pick & Place</div>
                      <p className="text-[10px] text-slate-400">Carga de microchips y pasivos electrónicos en el sustrato.</p>
                    </div>

                    {/* Step 3: Soldadura */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Soldadura', 'Calidad QA', 'Despachado'].indexOf(selectedOrder.estado) >= 2
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-semibold text-slate-850 text-slate-800">3. Soldadura de Reflujo</div>
                      <p className="text-[10px] text-slate-400">Fusión en horno de convección bajo perfil térmico.</p>
                    </div>

                    {/* Step 4: Calidad QA */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Calidad QA', 'Despachado'].indexOf(selectedOrder.estado) >= 3
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-semibold text-slate-850 text-slate-800">4. Inspección Óptica & Testeo QA</div>
                      <p className="text-[10px] text-slate-400">Inspección automatizada por cámara (AOI) y firma de calidad.</p>
                    </div>

                    {/* Step 5: Despachado */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Despachado'].indexOf(selectedOrder.estado) >= 4
                          ? 'bg-emerald-600 border-white ring-1 ring-emerald-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-semibold text-slate-850 text-slate-800">5. Despachado / Envío Logístico</div>
                      <p className="text-[10px] text-slate-400">Transferido a bodegas de despacho para distribución.</p>
                    </div>
                  </div>

                </div>

                {/* Control Action box */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-4">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Consola de Control Operacional</span>
                  
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Técnico Asignado:</span>
                      <span className="font-bold text-slate-800">{selectedOrder.operadorAsignado}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unidades Totales:</span>
                      <span className="font-bold font-mono text-slate-800">{selectedOrder.cantidad} Unids</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Eficiencia Operativa:</span>
                      <span className="font-bold font-mono text-emerald-600">{selectedOrder.eficienciaEstimada}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Fecha de Alta:</span>
                      <span className="font-mono text-slate-800">{selectedOrder.fechaCreacion}</span>
                    </div>
                  </div>

                  {selectedOrder.estado !== 'Despachado' ? (
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleAdvanceProcess(selectedOrder.id)}
                        className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 border-none text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase font-display"
                      >
                        <span>Avanzar Proceso SMT</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      {selectedOrder.estado === 'Calidad QA' && (
                        <button 
                          type="button"
                          onClick={() => {
                            setShipFormOrderId(selectedOrder.id);
                            setShipFormDest(`${selectedOrder.cliente} - Sede Principal despacho`);
                            setActiveSubTab('logistica');
                            setIsShipmentFormOpen(true);
                          }}
                          className="w-full text-center py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 border-none text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer uppercase"
                        >
                          <Truck className="w-4 h-4" />
                          <span>Despachar con Flete</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle className="w-4.5 h-4.5" />
                        <span>¡Tarjeta Fabricada y Despachada!</span>
                      </div>
                      
                      {/* Check if linked shipment exists */}
                      {(() => {
                        const linkedShip = shipments.find(s => s.orderId === selectedOrder.id);
                        if (linkedShip) {
                          return (
                            <button
                              onClick={() => {
                                setSelectedShipmentId(linkedShip.id);
                                setActiveSubTab('logistica');
                              }}
                              className="w-full text-center py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer"
                            >
                              <Truck className="w-4 h-4 text-slate-500" />
                              <span>Ver tracking de {linkedShip.id}</span>
                            </button>
                          );
                        } else {
                          return (
                            <button
                              onClick={() => {
                                setShipFormOrderId(selectedOrder.id);
                                setShipFormDest(`${selectedOrder.cliente} - Planta Regional`);
                                setActiveSubTab('logistica');
                                setIsShipmentFormOpen(true);
                              }}
                              className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 border-none text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Generar Guía de Envío</span>
                            </button>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                Selecciona una orden de fabricación para ver su avance paso a paso.
              </div>
            )}

            {/* SMT Inventory List details */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 text-xs">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Activity className="w-4.5 h-4.5 text-blue-600" />
                Inventario de Chips SMT (Materiales)
              </h4>
              <div className="space-y-3 font-mono text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Microcontroladores STM32F4:</span>
                    <span className="font-bold text-slate-900">4,250 unidades (Estable)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Módulos de Radiofrecuencia LoraWAN:</span>
                    <span className="font-bold text-amber-600">320 unidades (Nivel Crítico)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '28%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-slate-700 mb-1">
                    <span>Sustratos de Fibra de Vidrio FR4:</span>
                    <span className="font-bold text-slate-900">12,500 m2 (Óptimo)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '95%' }} />
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* SUBTAB 2: LOGISTICS AND SHIPMENTS PROCESS */}
      {activeSubTab === 'logistica' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left panel: Shipments database and Search list (8/12) */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            
            {/* Action Bar for Logistics */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
              
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={shipmentSearch}
                  onChange={(e) => setShipmentSearch(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-all"
                  placeholder="Buscar envíos por guía, cliente, destino u orden..."
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select 
                  value={shipmentStatusFilter}
                  onChange={(e) => setShipmentStatusFilter(e.target.value)}
                  className="bg-slate-100 border border-slate-200 text-xs text-slate-800 rounded-lg p-2 outline-none"
                >
                  <option value="All">Todos los Estados Logísticos</option>
                  <option value="En Centro de Acopio">En Centro de Acopio</option>
                  <option value="En Tránsito">En Tránsito</option>
                  <option value="En Distribución">En Distribución</option>
                  <option value="Entregado">Entregado</option>
                  <option value="Retenido en Aduana">Retenido en Aduana</option>
                </select>

                <button 
                  onClick={() => setIsShipmentFormOpen(!isShipmentFormOpen)}
                  className="p-2 border-none bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Despacho</span>
                </button>
              </div>

            </div>

            {/* Form to load new ship record if open */}
            {isShipmentFormOpen && (
              <form onSubmit={handleRegisterShipment} className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4 animate-fade-in text-xs text-slate-700">
                <h4 className="font-semibold text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5 text-blue-600" />
                  Registrar Despacho de Mercancías y Guía de Envío (Courier)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Vincular a Orden de Producción: *</label>
                    <select 
                      required
                      value={shipFormOrderId}
                      onChange={(e) => {
                        setShipFormOrderId(e.target.value);
                        const ord = orders.find(o => o.id === e.target.value);
                        if (ord) {
                          setShipFormDest(`${ord.cliente} - Sede Principal`);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="">-- Seleccione una orden fabricada --</option>
                      {orders.map(o => (
                        <option key={o.id} value={o.id}>
                          {o.id} - {o.producto.substring(0, 30)}... ({o.cliente})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Empresa Transportadora:</label>
                    <select 
                      value={shipFormCarrier}
                      onChange={(e) => setShipFormCarrier(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value="Servientrega">Servientrega (Nacional)</option>
                      <option value="DHL Express">DHL Express (Aéreo / Internacional)</option>
                      <option value="Coordinadora">Coordinadora Mercantil</option>
                      <option value="FedEx">FedEx Colombia</option>
                      <option value="Envia Col">Envia Transportadora</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Código / Guía de Seguimiento (Opcional):</label>
                    <input 
                      type="text" 
                      value={shipFormTracking}
                      onChange={(e) => setShipFormTracking(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-850 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Ej. SERVI-812304899 (En blanco para auto-generar)"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Costo de Envío / Guía Comercial (COP):</label>
                    <input 
                      type="number" 
                      min={10000}
                      step={10000}
                      value={shipFormCost}
                      onChange={(e) => setShipFormCost(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-600 block">Días Estimados de Tránsito:</label>
                    <select 
                      value={shipFormDays}
                      onChange={(e) => setShipFormDays(Number(e.target.value))}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-800 outline-none focus:border-blue-500"
                    >
                      <option value={1}>1 Día (Exprés / Urgente)</option>
                      <option value={2}>2 Días (Estándar)</option>
                      <option value={3}>3 Días (Intermunicipal)</option>
                      <option value={5}>5 Días (Planta Remota)</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="font-semibold text-slate-600 block">Dirección de Destino Completa: *</label>
                    <input 
                      type="text" 
                      required
                      value={shipFormDest}
                      onChange={(e) => setShipFormDest(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded p-2 text-slate-850 text-slate-800 outline-none focus:border-blue-500"
                      placeholder="Calle, Avenida, Ciudad y Departamento."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                  <button 
                    type="button" 
                    onClick={() => setIsShipmentFormOpen(false)}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded border-none cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded border-none cursor-pointer flex items-center gap-1"
                  >
                    <Truck className="w-4.5 h-4.5" />
                    <span>Inscribir Envío e Iniciar Ruta</span>
                  </button>
                </div>
              </form>
            )}

            {/* List display */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-mono">
                  <tr>
                    <th className="p-4 pl-6">ID Guía</th>
                    <th className="p-4">Producto Transmitido</th>
                    <th className="p-4">Transportadora</th>
                    <th className="p-4">Destino de Entrega</th>
                    <th className="p-4 text-right">Flete COP</th>
                    <th className="p-4 text-center">Estado del Flete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800 font-sans">
                  {filteredShipments.map((ship) => (
                    <tr 
                      key={ship.id}
                      onClick={() => setSelectedShipmentId(ship.id)}
                      className={`hover:bg-slate-50 cursor-pointer ${
                        selectedShipmentId === ship.id ? 'bg-blue-50/50 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <td className="p-4 pl-6 font-mono">
                        <span className="font-bold text-slate-900 block">{ship.id}</span>
                        <span className="text-[9px] text-slate-400 block font-normal">OP: {ship.orderId}</span>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 leading-tight truncate max-w-[200px]">{ship.producto}</div>
                        <span className="text-[10px] text-slate-400 block mt-1">Cliente: {ship.cliente} | Cant: {ship.cantidad} uds</span>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-slate-800">{ship.transportadora}</span>
                        <span className="text-[9px] text-slate-400 font-mono block">Cod: {ship.guiaSeguimiento}</span>
                      </td>
                      <td className="p-4 text-slate-500 truncate max-w-[150px]" title={ship.destino}>
                        {ship.destino}
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-950">
                        {formatCurrency(ship.costoEnvio)}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-mono rounded font-medium ${getLogisticsBadgeClass(ship.estadoEnvio)}`}>
                          {ship.estadoEnvio}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-500">
                        No se encontraron registros logísticos de fletes para su búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

          {/* Right panel: Courier Visual Tracking progression timeline maps (4/12) */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            
            {selectedShipment ? (
              <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
                
                {/* Visual Map Timeline */}
                <div className="border-b border-slate-105 border-slate-100 pb-3">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-amber-600 font-bold block mb-1">Rastreo e Historial de Envíos</span>
                  <div className="flex justify-between items-start">
                    <h4 className="text-sm font-semibold text-slate-900 leading-tight">{selectedShipment.id} ({selectedShipment.transportadora})</h4>
                    <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono font-bold text-slate-600">{selectedShipment.estadoEnvio}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block mt-1">Guía: {selectedShipment.guiaSeguimiento}</span>
                </div>

                {/* Tracking Progress Node Map */}
                <div className="space-y-4">
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-slate-550 text-slate-500">Ruta de Transporte del Flete</span>
                  
                  <div className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    
                    {/* Node 1: Origin / Acopio */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['En Centro de Acopio', 'En Tránsito', 'En Distribución', 'Entregado'].indexOf(selectedShipment.estadoEnvio) >= 0
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-bold text-slate-800">Centro de Acopio Tapasel</div>
                      <p className="text-[10px] text-slate-400">Planta de salida: Medellín - {selectedShipment.fechaEnvio}</p>
                    </div>

                    {/* Node 2: In Transit */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['En Tránsito', 'En Distribución', 'Entregado'].indexOf(selectedShipment.estadoEnvio) >= 0
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-bold text-slate-800">Transporte Principal / Carretera</div>
                      <p className="text-[10px] text-slate-400">Sello de flete homologado en ruta intermunicipal.</p>
                    </div>

                    {/* Node 3: Local Distribution */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['En Distribución', 'Entregado'].indexOf(selectedShipment.estadoEnvio) >= 0
                          ? 'bg-blue-600 border-white ring-1 ring-blue-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-bold text-slate-800">Bodega de Reparto Local</div>
                      <p className="text-[10px] text-slate-400">Asignado a conductor local de última milla para entrega.</p>
                    </div>

                    {/* Node 4: Delivered */}
                    <div className="relative text-xs">
                      <span className={`absolute -left-5 top-0.5 w-3 h-3 rounded-full border-2 ${
                        ['Entregado'].indexOf(selectedShipment.estadoEnvio) >= 0
                          ? 'bg-emerald-600 border-white ring-1 ring-emerald-600' : 'bg-white border-slate-300'
                      }`} />
                      <div className="font-bold text-slate-800">Entregado a Cliente</div>
                      <p className="text-[10px] text-slate-400">Firma electrónica de satisfacción asentada en sistema - {selectedShipment.estimadoEntrega}</p>
                    </div>

                  </div>
                </div>

                {/* Operations Control Panel */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Logística & Despacho</span>
                  
                  <div className="space-y-1.5 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span>Ref Orden:</span>
                      <span className="font-bold text-slate-900">{selectedShipment.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tarjetas:</span>
                      <span className="font-bold text-slate-900 leading-none truncate max-w-[140px]" title={selectedShipment.producto}>
                        {selectedShipment.producto}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Costo Flete:</span>
                      <span className="font-bold text-blue-600 text-[11px] font-mono">{formatCurrency(selectedShipment.costoEnvio)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Destinaría:</span>
                      <span className="text-[10px] text-slate-600 font-normal truncate max-w-[140px]" title={selectedShipment.destino}>
                        {selectedShipment.destino}
                      </span>
                    </div>
                  </div>

                  {selectedShipment.estadoEnvio !== 'Entregado' ? (
                    <button 
                      onClick={() => handleAdvanceLogistics(selectedShipment.id)}
                      className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded border-none cursor-pointer flex items-center justify-center gap-1.5 uppercase font-display"
                    >
                      <Navigation className="w-4 h-4 translate-y-0.5 animate-pulse" />
                      <span>Cambiar Estado Ruta</span>
                    </button>
                  ) : (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded text-center text-xs text-emerald-700 font-bold flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>¡Mercancía entregada!</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      alert(`IMPRIMIENDO RÓTULO LOGÍSTICO COMPLETO DE TASA S.A.S\n========================================\nEnvío ID: ${selectedShipment.id}\nOrden Relacionada: ${selectedShipment.orderId}\nDestinatario: ${selectedShipment.cliente}\nDirección: ${selectedShipment.destino}\nGuía de flete: ${selectedShipment.guiaSeguimiento}\nSoporte por Tapasel Flow IA`);
                    }}
                    className="w-full text-center py-1.5 bg-white hover:bg-slate-100 border border-slate-205 border-slate-200 text-slate-700 font-semibold text-xs rounded cursor-pointer"
                  >
                    Imprimir Rótulo de Despacho
                  </button>
                </div>

              </div>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-400">
                Seleccione un flete de envío para ver su localización en vivo.
              </div>
            )}

            {/* Tapasel Flow Map Coordinates placeholder */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3.5 text-xs text-slate-700">
              <span className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 block">Nodos Satelitales S.S.L (Medellín)</span>
              
              <div className="relative h-28 bg-slate-100 rounded-lg overflow-hidden flex flex-col justify-end p-2 text-[10px] font-mono text-slate-500 border border-slate-200">
                <div className="absolute inset-0 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:16px_16px] opacity-60 flex items-center justify-center">
                  <div className="p-2 bg-white/90 border border-slate-300 rounded shadow text-center select-all cursor-pointer font-sans text-xs">
                    🗺️ <b className="text-blue-600">GeoLocalización en Vivo (APIs)</b>
                    <div className="text-[9px] font-mono text-slate-400 mt-0.5">Medellín Lat: 6.2442° | Long: -75.5812°</div>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-white/80 backdrop-blur-xs p-1.5 rounded relative border border-slate-200">
                  <span>Tránsito de flotas del oriente:</span>
                  <span className="font-bold text-emerald-600 select-all">NORMAL (API INTEGRATION)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
