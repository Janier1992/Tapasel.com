import toast from 'react-hot-toast';
import React, { useState, useEffect, useRef } from 'react';
import {  
  Users, 
  Banknote, 
  FileText, 
  FileSpreadsheet, 
  BarChart3,
  UserPlus,
  Lock,
  Printer,
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Briefcase,
  Check,
  AlertCircle,
  Clock,
  PrinterCheck
, Eye, Pencil, Trash, FileDown } from 'lucide-react';
import { exportRecordToPDF, exportTableToPDF } from '../utils/pdfExport';
import toast from 'react-hot-toast';
import { Transaccion, Cliente, CarteraRecord, ProveedorRecord, CotizacionRecord } from '../types';
import { formatCurrencyCOP as formatCurrency } from '../lib/formatters';
import TapaselLogo from './TapaselLogo';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';

interface FinanzasTabProps {
  transacciones: Transaccion[];
  clientes: Cliente[];
  cartera: CarteraRecord[];
  proveedores?: ProveedorRecord[];
  onAddProveedor?: (record: ProveedorRecord) => void;
  onUpdateProveedor?: (record: ProveedorRecord) => void;
  cotizaciones?: CotizacionRecord[];
  onAddCotizacion?: (record: CotizacionRecord) => void;
  onUpdateCotizacion?: (record: CotizacionRecord) => void;
  onDeleteCotizacion?: (id: string) => void;
  onOpenNewReceipt: () => void;
  onOpenNewExpenditure: () => void;
  onPostAiAssistantQuery: (prompt: string) => void;
  activeTab: string;
  onAddTransaction?: (tx: Omit<Transaccion, 'id'>) => void;
  onSettleTransaction?: (id: string) => void;
  onAddCliente?: (client: Cliente) => void;
  onAddCartera?: (record: CarteraRecord) => void;
  onUpdateCartera?: (record: CarteraRecord) => void;
}

// Inline Spanish number-to-words helper for "La suma de..." input field in cash receipts!
function numeroALetras(num: number): string {
  if (!num || isNaN(num)) return '';
  if (num === 0) return 'CERO';
  
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const decenasDiez = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function traducirSegmento(n: number): string {
    let output = '';
    if (n >= 100) {
      if (n === 100) return 'CIEN';
      output += centenas[Math.floor(n / 100)] + ' ';
      n %= 100;
    }
    if (n >= 20) {
      const dec = Math.floor(n / 10);
      const uni = n % 10;
      if (dec === 2 && uni > 0) {
        output += 'VEINTI' + unidades[uni];
      } else {
        output += decenasDiez[dec];
        if (uni > 0) {
          output += ' Y ' + unidades[uni];
        }
      }
    } else if (n >= 10) {
      output += decenas[n - 10];
    } else if (n > 0) {
      output += unidades[n];
    }
    return output.trim();
  }

  let words = '';
  let resto = Math.floor(num);
  
  if (resto >= 1000000) {
    const millones = Math.floor(resto / 1000000);
    resto %= 1000000;
    if (millones === 1) {
      words += 'UN MILLÓN ';
    } else {
      words += traducirSegmento(millones) + ' MILLONES ';
    }
  }

  if (resto >= 1000) {
    const miles = Math.floor(resto / 1000);
    resto %= 1000;
    if (miles === 1) {
      words += 'MIL ';
    } else {
      words += traducirSegmento(miles) + ' MIL ';
    }
  }

  if (resto > 0) {
    words += traducirSegmento(resto);
  }

  return (words.trim() + ' PESOS M/CTE').toUpperCase();
}

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title: string;
}

function SignaturePad({ onSave, onCancel, title }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: any) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3 animate-fade-in max-w-full">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{title}</span>
        <button 
          type="button"
          onClick={handleClear}
          className="text-[10px] text-rose-600 font-bold bg-transparent border-none hover:underline cursor-pointer"
        >
          Borrar Lienzo
        </button>
      </div>
      
      <div className="relative border border-slate-300 rounded-lg overflow-hidden bg-white shadow-inner">
        <canvas
          ref={canvasRef}
          width={360}
          height={140}
          className="w-full h-[140px] cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        <div className="absolute bottom-2 right-2 pointer-events-none text-[8px] font-mono text-slate-400 select-none uppercase tracking-widest">
          Firma Táctil ERP
        </div>
      </div>

      <p className="text-[10px] text-slate-500 leading-snug">
        Use su cursor o pantalla táctil para dibujar su firma dentro del recuadro de arriba.
      </p>

      <div className="flex justify-end gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg border-none cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg border-none cursor-pointer"
        >
          Guardar Firma
        </button>
      </div>
    </div>
  );
}

export default function FinanzasTab({
  transacciones,
  clientes,
  cartera,
  proveedores = [],
  onAddProveedor,
  onUpdateProveedor,
  cotizaciones = [],
  onAddCotizacion,
  onUpdateCotizacion,
  onDeleteCotizacion,
  onOpenNewReceipt,
  onOpenNewExpenditure,
  onPostAiAssistantQuery,
  activeTab,
  onAddTransaction,
  onSettleTransaction,
  onAddCliente,
  onAddCartera,
  onUpdateCartera
}: FinanzasTabProps) {
  
  // High-performance State defining which financial subprocess is selected (Image 1)
  const [activeProcessTab, setActiveProcessTab] = useState<'clientes' | 'recibos' | 'cuentas_por_pagar' | 'otros_egresos' | 'cartera' | 'reportes' | 'proveedores' | 'cotizaciones'>('recibos');

  // Collapsible forms visibility states
  const [showCliForm, setShowCliForm] = useState(false);
  const [showRcForm, setShowRcForm] = useState(false);
  const [showCppForm, setShowCppForm] = useState(false);
  const [showOthForm, setShowOthForm] = useState(false);
  const [showCartForm, setShowCartForm] = useState(false);
  const [showProvForm, setShowProvForm] = useState(false);
  const [showCotForm, setShowCotForm] = useState(false);

  // Proveedor Form State
  const [editingProvId, setEditingProvId] = useState<string | null>(null);
  const [provFecha, setProvFecha] = useState(new Date().toISOString().split('T')[0]);
  const [provNombre, setProvNombre] = useState('');
  const [provFactura, setProvFactura] = useState('');
  const [provValorMerc, setProvValorMerc] = useState('');
  const [provComprobanteEgreso, setProvComprobanteEgreso] = useState('');
  const [provChequeNo, setProvChequeNo] = useState('');
  const [provFechaCancelado, setProvFechaCancelado] = useState('');
  const [provEstado, setProvEstado] = useState<'Pendiente' | 'Cancelado'>('Pendiente');
  const [provApplyRet, setProvApplyRet] = useState(true); // 2.5% Retención
  const [provSearchTerm, setProvSearchTerm] = useState('');
  const [provEstadoFilter, setProvEstadoFilter] = useState<'Todos' | 'Pendiente' | 'Cancelado'>('Todos');

  // Proveedor Cancel / Payments State
  const [updatingProvId, setUpdatingProvId] = useState<string | null>(null);
  const [provEgresoInput, setProvEgresoInput] = useState('');
  const [provChequeInput, setProvChequeInput] = useState('');
  const [provFechaCancelInput, setProvFechaCancelInput] = useState(new Date().toISOString().split('T')[0]);

  // Cotizaciones Form State
  const [editingCotId, setEditingCotId] = useState<string | null>(null);
  const [cotFecha, setCotFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cotNo, setCotNo] = useState(`COT-${Math.floor(Math.random() * 8000) + 1000}`);
  const [cotEmpresa, setCotEmpresa] = useState('Tapasel S.A.S.');
  const [cotClienteNombre, setCotClienteNombre] = useState('');
  const [cotIngeniero, setCotIngeniero] = useState('');
  const [cotReferenciaObra, setCotReferenciaObra] = useState('');
  const [cotDireccion, setCotDireccion] = useState('Carrera 40 # 43- 50 Medellín');
  const [cotSearchTerm, setCotSearchTerm] = useState('');

  // Item addition state
  const [itemRef, setItemRef] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const [itemUn, setItemUn] = useState('un');
  const [itemCant, setItemCant] = useState('1');
  const [itemValUnit, setItemValUnit] = useState('');

  // Items lists
  const [tempCotItems, setTempCotItems] = useState<any[]>([]);
  const [selectedCotizacion, setSelectedCotizacion] = useState<any | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState<'representante' | 'cliente' | null>(null);

  // Cartera Form State
  const [cartFecha, setCartFecha] = useState(new Date().toISOString().split('T')[0]);
  const [cartClienteId, setCartClienteId] = useState('');
  const [cartFactura, setCartFactura] = useState('');
  const [cartValorMercancia, setCartValorMercancia] = useState('');
  const [cartAbono, setCartAbono] = useState('');
  const [cartRcAbono, setCartRcAbono] = useState('');
  const [cartRcCancelacion, setCartRcCancelacion] = useState('');
  const [cartFechaPago, setCartFechaPago] = useState('');
  const [cartMedioPago, setCartMedioPago] = useState('TRANSFERENCIA');
  const [cartSearchTerm, setCartSearchTerm] = useState('');
  const [cartStatusFilter, setCartStatusFilter] = useState<'Todos' | 'Pendiente' | 'Abonado' | 'Liquidado'>('Todos');

  // Liquidate Record State
  const [liquidatingRecordId, setLiquidatingRecordId] = useState<string | null>(null);
  const [liqRcCancelacion, setLiqRcCancelacion] = useState('');
  const [liqFechaPago, setLiqFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [liqMedioPago, setLiqMedioPago] = useState('TRANSFERENCIA');


  // Search filter for lists inside panels
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'All' | 'Ingreso' | 'Egreso'>('All');
  
  // Custom Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // 1. Clientes Form State (Image 2)
  const [cliNombre, setCliNombre] = useState('');
  const [cliNit, setCliNit] = useState('');
  const [cliDireccion, setCliDireccion] = useState('');
  const [cliTelefono, setCliTelefono] = useState('');
  const [cliCiudad, setCliCiudad] = useState('');
  const [cliObra, setCliObra] = useState('');

  // 2. Recibo de Caja Form State (Image 3)
  const [rcNumero, setRcNumero] = useState(`RC-${Math.floor(Math.random() * 8000) + 1000}`);
  const [rcFecha, setRcFecha] = useState(new Date().toISOString().split('T')[0]);
  const [rcClienteId, setRcClienteId] = useState('');
  const [rcCedula, setRcCedula] = useState('');
  const [rcValor, setRcValor] = useState('');
  const [rcSumaDe, setRcSumaDe] = useState('');
  const [rcConcepto, setRcConcepto] = useState('');
  const [rcFormaPago, setRcFormaPago] = useState('');
  const [rcDetalle, setRcDetalle] = useState('');

  // 3. Cuentas por Pagar Form State
  const [cppCodigo, setCppCodigo] = useState(`FCP-${Math.floor(Math.random() * 8000) + 1000}`);
  const [cppProveedor, setCppProveedor] = useState('');
  const [cppFechaEmision, setCppFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [cppFechaVencimiento, setCppFechaVencimiento] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15); // 15 days default terms
    return d.toISOString().split('T')[0];
  });
  const [cppConcepto, setCppConcepto] = useState('');
  const [cppCategoria, setCppCategoria] = useState('Materia Prima');
  const [cppMonto, setCppMonto] = useState('');
  const [cppResponsable, setCppResponsable] = useState('Alex Mercer');

  // 4. Otros Egresos Form State
  const [othConcepto, setOthConcepto] = useState('');
  const [othBeneficiario, setOthBeneficiario] = useState('');
  const [othForma, setOthForma] = useState('Caja Menor');
  const [othMonto, setOthMonto] = useState('');
  const [othDetalle, setOthDetalle] = useState('');

  // Print/Detailed Inspection Modals
  const [printedReceiptData, setPrintedReceiptData] = useState<any | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaccion | null>(null);

  // Sync client details whenever client dropdown selection changes in Recibos de Caja
  useEffect(() => {
    if (rcClienteId) {
      const selected = clientes.find(c => c.id === rcClienteId);
      if (selected) {
        setRcCedula(selected.id);
        if (!rcConcepto) {
          setRcConcepto(`Suministro operacional según obra: ${selected.contacto || 'Medellín Planta'}`);
        }
      }
    } else {
      setRcCedula('');
    }
  }, [rcClienteId, clientes]);

  // Sync auto-calculated text whenever currency number changes in Recibos de Caja
  useEffect(() => {
    const val = Number(rcValor);
    if (val > 0) {
      setRcSumaDe(numeroALetras(val));
    } else {
      setRcSumaDe('');
    }
  }, [rcValor]);

  // Synchronize activeProcessTab with the outer sidebar clicks (e.g. from main dashboard)
  useEffect(() => {
    if (activeTab === 'finanzas-clientes') {
      setActiveProcessTab('clientes');
    } else if (activeTab === 'finanzas-recibos') {
      setActiveProcessTab('recibos');
    } else if (activeTab === 'finanzas-cartera') {
      setActiveProcessTab('cartera');
    } else if (activeTab === 'finanzas-proveedores') {
      setActiveProcessTab('proveedores');
    } else if (activeTab === 'finanzas-cotizaciones') {
      setActiveProcessTab('cotizaciones');
    } else if (activeTab === 'finanzas-porpagar') {
      setActiveProcessTab('cuentas_por_pagar');
    } else if (activeTab === 'finanzas-otros') {
      setActiveProcessTab('otros_egresos');
    } else if (activeTab === 'finanzas-reportes') {
      setActiveProcessTab('reportes');
    }
  }, [activeTab]);

  // Automatically contract form modules when switching activeProcessTab
  useEffect(() => {
    setShowCliForm(false);
    setShowRcForm(false);
    setShowCppForm(false);
    setShowOthForm(false);
    setShowCartForm(false);
    setShowProvForm(false);
    setShowCotForm(false);
  }, [activeProcessTab]);

  // Cartera Form Submit Handler
  const [cartApplyRef, setCartApplyRef] = useState(true);

  const handleSaveCartera = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cartClienteId || !cartFactura || !cartValorMercancia) {
      toast.error("Por favor complete los campos obligatorios: Cliente, Factura y Valor de Mercancía.");
      return;
    }

    const valorMerc = Number(cartValorMercancia);
    const clientSelected = clientes.find(c => c.id === cartClienteId);

    const cree = valorMerc * 0.012;
    const iva = valorMerc * 0.19;
    const ret = cartApplyRef ? (valorMerc * 0.025) : 0;
    const totalAPagar = valorMerc + iva - ret;

    const abVal = cartAbono ? Number(cartAbono) : 0;

    // Define correct status: if Cancelled contains a value, mark as Liquidado
    const status = cartRcCancelacion ? 'Liquidado' : (abVal > 0 ? 'Abonado' : 'Pendiente');

    const newRecord: CarteraRecord = {
      id: `CAR-${Math.floor(Math.random() * 8000) + 1000}`,
      fecha: cartFecha,
      clienteId: cartClienteId,
      clienteNombre: clientSelected?.nombre || "Cliente General",
      factura: cartFactura,
      cree,
      valorMercancia: valorMerc,
      iva,
      retencion: ret,
      totalAPagar,
      abono: abVal,
      rcAbono: cartRcAbono,
      rcCancelacion: cartRcCancelacion,
      fechaPago: cartFechaPago || (cartRcCancelacion ? cartFecha : ""),
      medioPago: cartMedioPago,
      estado: status
    };

    if (onAddCartera) {
      onAddCartera(newRecord);
      toast.success(`¡Registro de Cartera para Factura #${cartFactura} creado positivamente!`);
      // Reset State
      setCartFactura('');
      setCartValorMercancia('');
      setCartAbono('');
      setCartRcAbono('');
      setCartRcCancelacion('');
      setCartFechaPago('');
      setCartMedioPago('TRANSFERENCIA');
      setShowCartForm(false);
    }
  };

  const handleSaveProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!provNombre || !provFactura || !provValorMerc) {
      toast.error("Por favor complete los campos obligatorios: Proveedor, Factura y Valor de Mercancía.");
      return;
    }

    const valorMerc = Number(provValorMerc);
    const iva = valorMerc * 0.19;
    const ret = provApplyRet ? (valorMerc * 0.025) : 0;
    const totalAPagar = valorMerc + iva - ret;

    if (editingProvId) {
      const existing = proveedores?.find(p => p.id === editingProvId);
      if (existing && onUpdateProveedor) {
        onUpdateProveedor({
          ...existing,
          fecha: provFecha,
          proveedorNombre: provNombre,
          factura: provFactura,
          valorMercancia: valorMerc,
          iva,
          retencion: ret,
          totalAPagar,
          estado: provEstado
        });
        toast.success(`¡Proveedor ${provNombre} actualizado!`);
        setEditingProvId(null);
        setShowProvForm(false);
        setProvNombre('');
        setProvFactura('');
        setProvValorMerc('');
      }
      return;
    }

    const newProv: ProveedorRecord = {
      id: `PROV-${Math.floor(Math.random() * 8000) + 1000}`,
      fecha: provFecha,
      proveedorNombre: provNombre,
      factura: provFactura,
      valorMercancia: valorMerc,
      iva,
      retencion: ret,
      totalAPagar,
      comprobanteEgreso: provComprobanteEgreso,
      chequeNo: provChequeNo,
      fechaCancelado: provFechaCancelado || (provComprobanteEgreso ? provFecha : ""),
      estado: provEstado
    };

    if (onAddProveedor) {
      onAddProveedor(newProv);
      toast.success(`¡Proveedor / Cuenta por Pagar de ${provNombre} guardado con éxito!`);
      // Reset State
      setProvNombre('');
      setProvFactura('');
      setProvValorMerc('');
      setProvComprobanteEgreso('');
      setProvChequeNo('');
      setProvFechaCancelado('');
      setProvEstado('Pendiente');
      setShowProvForm(false);
    }
  };

  const handleSaveCotizacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cotClienteNombre || !cotReferenciaObra || tempCotItems.length === 0) {
      toast.error("Por favor complete los campos obligatorios: Cliente (Señor/a), Obra/Referencia y agregue al menos un producto.");
      return;
    }

    const subtotal = tempCotItems.reduce((acc, curr) => acc + curr.valorTotal, 0);
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    if (editingCotId) {
      const existing = cotizaciones.find(c => c.id === editingCotId);
      const updatedCot: CotizacionRecord = {
        id: editingCotId,
        fecha: cotFecha,
        cotizacionNo: cotNo,
        empresa: cotEmpresa,
        clienteNombre: cotClienteNombre,
        ingeniero: cotIngeniero || "Andrés Delgado",
        referenciaObra: cotReferenciaObra,
        direccion: cotDireccion,
        items: tempCotItems,
        subtotal,
        iva,
        total,
        firmaDigitalRepresentante: existing?.firmaDigitalRepresentante || "Andrés Delgado",
        firmaDigitalCliente: existing?.firmaDigitalCliente || "",
        fechaFirmaRepresentante: existing?.fechaFirmaRepresentante || cotFecha,
        fechaFirmaCliente: existing?.fechaFirmaCliente
      };

      if (onUpdateCotizacion) {
        onUpdateCotizacion(updatedCot);
        toast.success(`¡Cotización No. ${cotNo} actualizada exitosamente!`);
        
        // Reset State
        setEditingCotId(null);
        setCotNo(`COT-${Math.floor(Math.random() * 8000) + 1000}`);
        setCotClienteNombre('');
        setCotIngeniero('');
        setCotReferenciaObra('');
        setCotDireccion('Carrera 40 # 43- 50 Medellín');
        setTempCotItems([]);
        setShowCotForm(false);
      }
      return;
    }

    const newCot: CotizacionRecord = {
      id: `COT-${Math.floor(Math.random() * 8000) + 1000}`,
      fecha: cotFecha,
      cotizacionNo: cotNo,
      empresa: cotEmpresa,
      clienteNombre: cotClienteNombre,
      ingeniero: cotIngeniero || "Andrés Delgado",
      referenciaObra: cotReferenciaObra,
      direccion: cotDireccion,
      items: tempCotItems,
      subtotal,
      iva,
      total,
      firmaDigitalRepresentante: "Andrés Delgado",
      firmaDigitalCliente: "",
      fechaFirmaRepresentante: cotFecha
    };

    if (onAddCotizacion) {
      onAddCotizacion(newCot);
      toast.success(`¡Cotización No. ${cotNo} generada exitosamente!`);
      
      // Reset State
      setCotNo(`COT-${Math.floor(Math.random() * 8000) + 1000}`);
      setCotClienteNombre('');
      setCotIngeniero('');
      setCotReferenciaObra('');
      setCotDireccion('Carrera 40 # 43- 50 Medellín');
      setTempCotItems([]);
      setShowCotForm(false);
    }
  };

  const handleUpdatePaymentProveedor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingProvId || !provEgresoInput) {
      toast.error("Por favor ingrese el Comprobante de Egreso.");
      return;
    }

    const targetProv = proveedores.find(p => p.id === updatingProvId);
    if (!targetProv) return;

    const updatedProv: ProveedorRecord = {
      ...targetProv,
      comprobanteEgreso: provEgresoInput,
      chequeNo: provChequeInput,
      fechaCancelado: provFechaCancelInput || new Date().toISOString().split('T')[0],
      estado: 'Cancelado'
    };

    if (onUpdateProveedor) {
      onUpdateProveedor(updatedProv);
      toast.success("¡Registro de Proveedor actualizado a estado 'Cancelado' exitosamente!");
      setUpdatingProvId(null);
      setProvEgresoInput('');
      setProvChequeInput('');
    }
  };

  const handleSavePayment = (recordId: string) => {
    const record = cartera.find(r => r.id === recordId);
    if (!record) return;

    if (!liqRcCancelacion) {
      toast.error("Por favor ingrese el número de Recibo de Caja de cancelación (RC CANCELAC).");
      return;
    }

    const updatedRecord: CarteraRecord = {
      ...record,
      rcCancelacion: liqRcCancelacion,
      fechaPago: liqFechaPago,
      medioPago: liqMedioPago,
      estado: 'Liquidado'
    };

    if (onUpdateCartera) {
      onUpdateCartera(updatedRecord);
      toast.success(`¡Factura #${record.factura} liquidada / saldada con éxito en la plataforma!`);
      // Reset State
      setLiquidatingRecordId(null);
      setLiqRcCancelacion('');
      setLiqFechaPago(new Date().toISOString().split('T')[0]);
      setLiqMedioPago('TRANSFERENCIA');
    }
  };

  // Form Submission Handlers
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliNombre || !cliNit) {
      toast.error("Por favor complete los campos obligatorios: Nombre Completo y NIT o CC.");
      return;
    }

    const newCli: Cliente = {
      id: cliNit,
      nombre: cliNombre,
      contacto: cliObra || 'N/D',
      email: `${cliNombre.toLowerCase().replace(/\s+/g, '')}@tapasel-cliente.co`,
      telefono: cliTelefono || 'N/D',
      carteraPendiente: 0,
      totalComprado: 0,
      estado: 'Al día',
      ultimoPago: new Date().toISOString().split('T')[0]
    };

    if (onAddCliente) {
      onAddCliente(newCli);
      toast.success(`¡Cliente "${cliNombre}" guardado con éxito en la base de datos de TAPASEL S.A.S!`);
      
      // Reset Client Form
      setCliNombre('');
      setCliNit('');
      setCliDireccion('');
      setCliTelefono('');
      setCliCiudad('');
      setCliObra('');
      setShowCliForm(false);
    } else {
      toast.error("Error: No se encontró el asignador de base de datos.");
    }
  };

  const handleSaveReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rcValor || !rcClienteId) {
      toast.error("Por favor, seleccione un Cliente y digite el Valor.");
      return;
    }

    const val = Number(rcValor);
    const clientObj = clientes.find(c => c.id === rcClienteId);

    if (onAddTransaction) {
      onAddTransaction({
        fecha: rcFecha,
        descripcion: `${rcNumero} • ${rcConcepto || 'Recibo de Caja'} • ${clientObj?.nombre || 'Cliente General'}`,
        tipo: 'Ingreso',
        categoria: 'Facturación Recibo',
        monto: val,
        estado: 'Pagado',
        clienteId: rcClienteId,
        responsable: 'Alex Mercer'
      });

      toast.success(`¡Recibo de Caja ${rcNumero} registrado positivamente en contabilidad!`);

      // Reset
      setRcNumero(`RC-${Math.floor(Math.random() * 8000) + 1000}`);
      setRcValor('');
      setRcSumaDe('');
      setRcConcepto('');
      setRcDetalle('');
      setShowRcForm(false);
    }
  };

  const handlePrintReceipt = () => {
    const clientObj = clientes.find(c => c.id === rcClienteId);
    if (!rcClienteId || !rcValor) {
      toast.error("Diligencie el recibo de caja seleccionando un cliente y valor antes de imprimir.");
      return;
    }
    setPrintedReceiptData({
      numeral: rcNumero,
      fecha: rcFecha,
      cliente: clientObj?.nombre || 'Sinasignar',
      cedula: rcCedula || clientObj?.id || '---',
      valor: Number(rcValor),
      sumaDe: rcSumaDe,
      concepto: rcConcepto || 'Suministros varios',
      formaPago: rcFormaPago || 'Efectivo',
      detalle: rcDetalle || 'Operaciones ordinarias de planta'
    });
  };

  const handleSaveCuentaPorPagar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cppProveedor || !cppMonto || !cppConcepto) {
      toast.error("Por favor complete los campos obligatorios: Proveedor, Valor y Detalle/Concepto.");
      return;
    }

    if (onAddTransaction) {
      onAddTransaction({
        fecha: cppFechaEmision,
        descripcion: `CP-${cppCodigo} • [CXP] ${cppProveedor} • Vence: ${cppFechaVencimiento} • ${cppConcepto}`,
        tipo: 'Egreso',
        categoria: cppCategoria,
        monto: Number(cppMonto),
        estado: 'Pendiente',
        responsable: cppResponsable
      });

      toast.success(`¡Cuenta por Pagar ${cppCodigo} registrada con éxito para "${cppProveedor}"!`);

      // Reset
      setCppCodigo(`FCP-${Math.floor(Math.random() * 8000) + 1000}`);
      setCppProveedor('');
      setCppConcepto('');
      setCppMonto('');
      setShowCppForm(false);
    }
  };

  const handleSaveOtherExpenditure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!othConcepto || !othMonto) {
      toast.error("Por favor defina el Concepto Complementario y el Monto.");
      return;
    }

    if (onAddTransaction) {
      onAddTransaction({
        fecha: new Date().toISOString().split('T')[0],
        descripcion: `EGR-EXT • Otros Egresos • [${othForma}] ${othConcepto} - Beneficiario: ${othBeneficiario || 'Diversos'}`,
        tipo: 'Egreso',
        categoria: 'Otros Egresos Complementarios',
        monto: Number(othMonto),
        estado: 'Pagado',
        responsable: 'Alex Mercer'
      });

      toast.success(`¡Otros Egresos / Ajuste registrado!`);

      // Reset
      setOthConcepto('');
      setOthBeneficiario('');
      setOthMonto('');
      setOthDetalle('');
      setShowOthForm(false);
    }
  };

  // Calculations for Reports screen
  const totalIngresos = transacciones
    .filter(t => t.tipo === 'Ingreso' && t.estado === 'Pagado')
    .reduce((sum, t) => sum + t.monto, 0);

  const totalEgresos = transacciones
    .filter(t => t.tipo === 'Egreso' && t.estado === 'Pagado')
    .reduce((sum, t) => sum + t.monto, 0);

  const netoCaja = totalIngresos - totalEgresos;

  // Filtered transactions for the ledger
  const filteredTxs = transacciones.filter(t => {
    const matchesSearch = t.descripcion.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
                          t.id.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
                          t.responsable.toLowerCase().includes(txSearchTerm.toLowerCase());
    
    const matchesType = txTypeFilter === 'All' || t.tipo === txTypeFilter;
    return matchesSearch && matchesType;
  });

  const paginatedTxs = filteredTxs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage) || 1;

  // Formato de moneda centralizado en src/lib/formatters.ts (evita duplicación).
  const translateDateToLongSpanish = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);
        const dateObj = new Date(year, month, day);
        const options: Intl.DateTimeFormatOptions = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        };
        return dateObj.toLocaleDateString('es-CO', options);
      }
      return dateStr;
    } catch (e) {
      return dateStr;
    }
  };

  const getMonthlyStats = () => {
    const base: Record<string, { label: string; ingresos: number; egresos: number; order: number }> = {
      '01': { label: 'Ene', ingresos: 120500000, egresos: 82300000, order: 1 },
      '02': { label: 'Feb', ingresos: 135000000, egresos: 91400000, order: 2 },
      '03': { label: 'Mar', ingresos: 142800000, egresos: 94600000, order: 3 },
      '04': { label: 'Abr', ingresos: 155000000, egresos: 110200000, order: 4 },
      '05': { label: 'May', ingresos: 85000000, egresos: 48000000, order: 5 },
      '06': { label: 'Jun', ingresos: 110000000, egresos: 62000000, order: 6 },
    };

    transacciones.forEach(t => {
      const parts = t.fecha.split('-');
      if (parts.length >= 2) {
        const mm = parts[1];
        if (base[mm]) {
          if (t.tipo === 'Ingreso' && t.estado === 'Pagado') {
            base[mm].ingresos += t.monto;
          } else if (t.tipo === 'Egreso' && t.estado === 'Pagado') {
            base[mm].egresos += t.monto;
          }
        }
      }
    });

    return Object.values(base).sort((a, b) => a.order - b.order);
  };

  const chartData = getMonthlyStats();

  return (
    <div className="space-y-6 animate-fade-in relative text-slate-800 w-full">
      <div className="space-y-6 w-full">
          
          {/* 1. SECCIÓN CLIENTES (Image 2) */}
          {activeProcessTab === 'clientes' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Base de Datos de Clientes
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Control unificado de clientes y proyectos de planta TAPASEL S.A.S</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showCliForm;
                    setShowCliForm(nextVal);
                    if (nextVal) {
                      setShowRcForm(false);
                      setShowCppForm(false);
                      setShowOthForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showCliForm ? 'Ocultar Formulario ' : 'Registrar Nuevo Cliente'}</span>
                </button>
              </div>

              {/* Form Card (Collapsible) */}
              {showCliForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Formulario de Ingreso de Clientes
                    </h3>
                  </div>

                  <form onSubmit={handleSaveClient} className="space-y-5">
                    {/* Grid Layout conforming to Image 2 (3 columns) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Nombre Completo */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Nombre Completo <b className="text-red-500 font-bold">*</b>
                        </label>
                        <input 
                          type="text"
                          value={cliNombre}
                          onChange={(e) => setCliNombre(e.target.value)}
                          placeholder="Nombre del cliente"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                          required
                        />
                      </div>

                      {/* NIT o CC */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          NIT o CC <b className="text-red-500 font-bold">*</b>
                        </label>
                        <input 
                          type="text"
                          value={cliNit}
                          onChange={(e) => setCliNit(e.target.value)}
                          placeholder="Documento"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                          required
                        />
                      </div>

                      {/* Dirección */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 font-medium">
                          Dirección
                        </label>
                        <input 
                          type="text"
                          value={cliDireccion}
                          onChange={(e) => setCliDireccion(e.target.value)}
                          placeholder="Dirección de la obra/oficina"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                        />
                      </div>

                      {/* Teléfono */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 font-medium">
                          Teléfono
                        </label>
                        <input 
                          type="text"
                          value={cliTelefono}
                          onChange={(e) => setCliTelefono(e.target.value)}
                          placeholder="Celular o fijo"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                        />
                      </div>

                      {/* Ciudad */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 font-medium">
                          Ciudad
                        </label>
                        <input 
                          type="text"
                          value={cliCiudad}
                          onChange={(e) => setCliCiudad(e.target.value)}
                          placeholder="Ciudad"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                        />
                      </div>

                      {/* Obra */}
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700 font-medium">
                          Obra
                        </label>
                        <input 
                          type="text"
                          value={cliObra}
                          onChange={(e) => setCliObra(e.target.value)}
                          placeholder="Nombre del proyecto"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 focus:bg-white focus:border-brand-primary outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Submit Button matching Image 2 exactly with green theme & Lock icon */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 border-none cursor-pointer flex items-center justify-center gap-2 font-display font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-99"
                      >
                        <Lock className="w-4.5 h-4.5" />
                        <span>Guardar en Base de Datos</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Excel-style table listing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between flex-wrap gap-4 bg-slate-50">
                  <div>
                    <h3 className="font-display font-semibold text-xs text-slate-800 uppercase tracking-wider">
                      HOJA DE REGISTRO DE CLIENTES (ESTILO EXCEL)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Fila de Cabecera A-F • Rejilla de Datos</p>
                  </div>
                  <div className="relative w-full max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                      type="text"
                      className="w-full bg-white border border-slate-200 rounded-lg py-1.5 pl-8 pr-3 text-[11px] text-slate-850 outline-none"
                      placeholder="Filtrar clientes..."
                      value={clientSearchTerm}
                      onChange={(e) => setClientSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto p-4 bg-white">
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-700 font-bold font-mono">
                        <th className="border border-slate-200 px-3 py-2 text-center text-[10px] w-12 bg-slate-150 text-slate-400 font-normal">#</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">NIT / CC (Identificación)</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Nombre Completo del Cliente</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Correo de Contacto</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Celular / Teléfono</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Obra Registrada</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {clientes
                        .filter(c => c.nombre.toLowerCase().includes(clientSearchTerm.toLowerCase()) || c.id.includes(clientSearchTerm))
                        .map((c, index) => (
                          <tr key={c.id} className="hover:bg-blue-50/20 odd:bg-white even:bg-slate-50/70 transition-colors">
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-700 bg-slate-50/20">{c.id}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-900 font-medium">{c.nombre}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-500 font-mono">{c.email}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-600 font-mono">{c.telefono}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-brand-primary font-bold">{c.contacto}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. SECCIÓN RECIBOS DE CAJA (Image 3) */}
          {activeProcessTab === 'recibos' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm">
                    <Banknote className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Recibos de Caja
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Historial y emisión de comprobantes de ingreso a tesorería</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showRcForm;
                    setShowRcForm(nextVal);
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowCppForm(false);
                      setShowOthForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-red-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showRcForm ? 'Ocultar Formulario' : 'Crear Recibo de Caja'}</span>
                </button>
              </div>

              {/* Form Card (Collapsible) */}
              {showRcForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Nuevo Registro de Soporte de Ingreso
                    </h3>
                  </div>

                  <form onSubmit={handleSaveReceipt} className="space-y-5 text-xs text-slate-800">
                    
                    {/* Row-based Layout inspired by Image 3 */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      
                      {/* Numeral RC */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">Numeral RC</label>
                        <input 
                          type="text" 
                          value={rcNumero}
                          onChange={(e) => setRcNumero(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none font-mono font-bold"
                          required
                        />
                      </div>

                      {/* Fecha */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">Fecha</label>
                        <input 
                          type="date"
                          value={rcFecha}
                          onChange={(e) => setRcFecha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 focus:bg-white outline-none font-mono text-xs"
                          required
                        />
                      </div>

                      {/* Cliente */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">Cliente</label>
                        <select
                          value={rcClienteId}
                          onChange={(e) => setRcClienteId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                          required
                        >
                          <option value="">-- Seleccionar --</option>
                          {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} ({c.contacto})</option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

                      {/* Cédula */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium font-bold">Cédula / NIT</label>
                        <input 
                          type="text"
                          value={rcCedula}
                          onChange={(e) => setRcCedula(e.target.value)}
                          placeholder="Documento"
                          className="w-full bg-slate-100 border border-slate-200 rounded p-2 focus:bg-white outline-none font-mono text-xs text-slate-600"
                        />
                      </div>

                      {/* Valor */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium font-bold text-rose-600">Valor ($ COP)</label>
                        <input 
                          type="number"
                          value={rcValor}
                          onChange={(e) => setRcValor(e.target.value)}
                          placeholder="Monto monetario"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none font-mono font-bold text-xs text-emerald-700"
                          required
                        />
                      </div>

                      {/* La suma de */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">La suma de</label>
                        <input 
                          type="text"
                          value={rcSumaDe}
                          onChange={(e) => setRcSumaDe(e.target.value)}
                          placeholder="Monto en letras (se auto-calcula)"
                          className="w-full bg-slate-150 border border-slate-200 rounded p-2 text-slate-600 focus:bg-white outline-none font-semibold text-[10px]"
                        />
                      </div>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">

                      {/* Concepto */}
                      <div className="sm:col-span-6 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">Concepto</label>
                        <input 
                          type="text"
                          value={rcConcepto}
                          onChange={(e) => setRcConcepto(e.target.value)}
                          placeholder="Por concepto de..."
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                      {/* Forma de pago */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">Forma de pago</label>
                        <select
                          value={rcFormaPago}
                          onChange={(e) => setRcFormaPago(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        >
                          <option value="">-- Seleccionar --</option>
                          <option value="Efectivo">Efectivo</option>
                          <option value="Transferencia Bancaria">Transferencia Bancaria (Bancolombia)</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                        </select>
                      </div>

                      {/* Detalle */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700 font-medium">Detalle</label>
                        <input 
                          type="text"
                          value={rcDetalle}
                          onChange={(e) => setRcDetalle(e.target.value)}
                          placeholder="Detalle de cartera"
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                    </div>

                    {/* Buttons Row matching Image 3 with specific spacing */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-4">
                      
                      {/* Customer Register Link */}
                      <button
                        type="button"
                        onClick={() => setActiveProcessTab('clientes')}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border-none font-bold cursor-pointer flex items-center gap-1.5 transition-all text-[11px]"
                      >
                        <Plus className="w-4 h-4 text-slate-500" />
                        <span>Agregar cliente</span>
                      </button>

                      <div className="flex items-center gap-2.5">
                        {/* Action 1: Print Preview */}
                        <button
                          type="button"
                          onClick={handlePrintReceipt}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded border-none font-extrabold cursor-pointer flex items-center gap-1.5 transition-all uppercase tracking-wide inline-flex text-[11px]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Imprimir</span>
                        </button>

                        {/* Action 2: Save Receipt */}
                        <button
                          type="submit"
                          className="px-6 py-2 bg-brand-primary hover:bg-brand-primary-container text-white font-extrabold rounded border-none cursor-pointer flex items-center gap-1.5 transition-all uppercase tracking-wide text-[11px]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                      </div>

                    </div>
                  </form>
                </div>
              )}

              {/* Excel-style table listing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <div>
                    <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-slate-800">
                      HOJA DE ANÁLISIS DE INGRESOS - RECIBOS DE CAJA (ESTILO EXCEL)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Fila de Cabecera A-G • Rejilla de Datos</p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded font-bold">
                    CONCILE S.A.S
                  </span>
                </div>

                <div className="overflow-x-auto p-4 bg-white">
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-700 font-bold font-mono">
                        <th className="border border-slate-200 px-3 py-2 text-center text-[10px] w-12 bg-slate-150 text-slate-400 font-normal">#</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Comprobante ID</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Fecha Recepción</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Detalle / Cliente de Obra</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Responsable</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Monto COP</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Estado</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Impresión</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {transacciones
                        .filter(t => t.tipo === 'Ingreso')
                        .map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50/20 odd:bg-white even:bg-slate-50/70 transition-colors">
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">{item.id}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-500">{item.fecha}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-700">{item.descripcion}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-500">{item.responsable}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-900 font-bold font-sans">{formatCurrency(item.monto)}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-250 rounded px-1.5 py-0.5 font-bold uppercase font-mono">
                                {item.estado}
                              </span>
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <button
                                onClick={() => {
                                  const matchObj = clientes.find(c => c.id === item.clienteId) || clientes[0];
                                  setPrintedReceiptData({
                                    numeral: item.id,
                                    fecha: item.fecha,
                                    cliente: matchObj?.nombre || 'Construcciones S.A.',
                                    cedula: item.clienteId || 'C-9002',
                                    valor: item.monto,
                                    sumaDe: numeroALetras(item.monto),
                                    concepto: item.descripcion.replace(/^REC-\d+\s•\s/, ''),
                                    formaPago: 'Transferencia Bancaria',
                                    detalle: 'Asimilación tributaria ordinaria'
                                  });
                                }}
                                className="px-2 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded cursor-pointer transition-colors shadow-sm inline-flex items-center gap-1 text-[10px] font-bold"
                              >
                                <Printer className="w-3 h-3 text-slate-500" />
                                <span>Ver</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2.5. SECCIÓN CARTERA (Portfolio tracking) */}
          {activeProcessTab === 'cartera' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Administración de Cartera (Seguimiento)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium font-semibold">Módulo de Seguimiento de Cuentas por Cobrar • Autoretención CREE 1.2% • IVA 19%</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showCartForm;
                    setShowCartForm(nextVal);
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowRcForm(false);
                      setShowCppForm(false);
                      setShowOthForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-600/15"
                >
                  <Plus className="w-4 h-4" />
                  <span>{showCartForm ? 'Ocultar Formulario' : 'Crear Registro de Cartera'}</span>
                </button>
              </div>

              {/* Form Card (Collapsible) */}
              {showCartForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Nuevo Registro de Cuenta por Cobrar
                    </h3>
                  </div>

                  <form onSubmit={handleSaveCartera} className="space-y-5 text-xs text-slate-800">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      
                      {/* Fecha */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">FECHA FACTURA</label>
                        <input 
                          type="date"
                          value={cartFecha}
                          onChange={(e) => setCartFecha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      {/* Cliente */}
                      <div className="sm:col-span-5 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">CLIENTE</label>
                        <select 
                          value={cartClienteId}
                          onChange={(e) => setCartClienteId(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                          required
                        >
                          <option value="">-- Seleccionar Cliente --</option>
                          {clientes.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre} (NIT: {c.id})</option>
                          ))}
                        </select>
                      </div>

                      {/* Factura Cod */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">FACTURA # (N° CONSECUTIVO)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 4949"
                          value={cartFactura}
                          onChange={(e) => setCartFactura(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      {/* Valor Mercancia */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">VALOR JABÓN/MER. ($ COP)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 560000"
                          value={cartValorMercancia}
                          onChange={(e) => setCartValorMercancia(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      {/* CREE Readonly */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400">CREE 1.20% (AUTO-CALCULADO)</label>
                        <div className="w-full bg-slate-100 text-slate-500 font-mono rounded p-2 text-xs border border-slate-200 select-none">
                          ${((Number(cartValorMercancia) || 0) * 0.012).toLocaleString('es-CO', { minimumFractionDigits: 1 })}
                        </div>
                      </div>

                      {/* IVA Readonly */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-400">IVA 19% (AUTO-CALCULADO)</label>
                        <div className="w-full bg-slate-100 text-slate-500 font-mono rounded p-2 text-xs border border-slate-200 select-none">
                          ${((Number(cartValorMercancia) || 0) * 0.19).toLocaleString('es-CO', { minimumFractionDigits: 1 })}
                        </div>
                      </div>

                      {/* REF Checkbox */}
                      <div className="sm:col-span-3 flex flex-col justify-end pb-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-bold mb-1">
                          <input 
                            type="checkbox"
                            checked={cartApplyRef}
                            onChange={(e) => setCartApplyRef(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
                          <span>Aplicar REF 2.5%</span>
                        </label>
                        <div className="text-[10px] text-slate-500">
                          {cartApplyRef 
                            ? `Retención: $${((Number(cartValorMercancia) || 0) * 0.025).toLocaleString('es-CO', { minimumFractionDigits: 1 })}` 
                            : 'Exento de retención'}
                        </div>
                      </div>

                      {/* Total calculated Readonly */}
                      <div className="sm:col-span-12 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex justify-between items-center">
                        <span className="font-semibold text-xs text-indigo-900">VALOR TOTAL CONSOLIDADO A PAGAR:</span>
                        <span className="font-mono text-base font-black text-indigo-700">
                          ${(
                            (Number(cartValorMercancia) || 0) + 
                            ((Number(cartValorMercancia) || 0) * 0.19) - 
                            (cartApplyRef ? ((Number(cartValorMercancia) || 0) * 0.025) : 0)
                          ).toLocaleString('es-CO', { minimumFractionDigits: 0 })} COP
                        </span>
                      </div>

                      {/* Payment fields (Optional for pending/new registers) */}
                      <div className="col-span-12 pt-3 border-t border-slate-100">
                        <h4 className="font-mono text-[10px] uppercase text-indigo-800 tracking-wider font-extrabold mb-3">
                          Información de Pago (Opcional - Completar si ya está cancelada o abonada)
                        </h4>
                      </div>

                      {/* Abono */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">VALOR ABONO ($ COP)</label>
                        <input 
                          type="number"
                          placeholder="e.g. 150000"
                          value={cartAbono}
                          onChange={(e) => setCartAbono(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                      {/* RC Abono */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">RECIBO CAJA ABONO (RC ABONO)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 22401"
                          value={cartRcAbono}
                          onChange={(e) => setCartRcAbono(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                      {/* RC Cancelac */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">RECIBO CAJA TOTAL (RC CANCELAC)</label>
                        <input 
                          type="text"
                          placeholder="e.g. 22638"
                          value={cartRcCancelacion}
                          onChange={(e) => setCartRcCancelacion(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                      {/* Fecha de Pago */}
                      <div className="sm:col-span-3 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">FECHA DE PAGO</label>
                        <input 
                          type="date"
                          value={cartFechaPago}
                          onChange={(e) => setCartFechaPago(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        />
                      </div>

                      {/* Medio de Pago */}
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[11px] font-bold text-slate-700">MEDIO DE PAGO</label>
                        <select 
                          value={cartMedioPago}
                          onChange={(e) => setCartMedioPago(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-2 focus:bg-white outline-none"
                        >
                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                          <option value="EFECTIVO">EFECTIVO</option>
                          <option value="CHEQUE">CHEQUE</option>
                        </select>
                      </div>

                    </div>

                    <div className="pt-3 border-t border-slate-100 flex justify-end gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => setShowCartForm(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border-none font-bold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded border-none cursor-pointer flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar Registro</span>
                      </button>
                    </div>

                  </form>
                </div>
              )}

              {/* KPI Summary Rows */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cartera por Cobrar</span>
                  <span className="text-xl font-bold font-mono text-red-600 mt-2">
                    ${cartera.filter(r => r.estado !== 'Liquidado')
                      .reduce((acc, r) => acc + (r.totalAPagar - r.abono), 0)
                      .toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">
                    {cartera.filter(r => r.estado !== 'Liquidado').length} facturas pendientes
                  </span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Retenciones Totales</span>
                  <span className="text-xl font-bold font-mono text-slate-700 mt-2">
                    ${cartera.reduce((acc, r) => acc + r.cree + r.retencion, 0).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">CREE 1.20% + REF 2.5% retenido</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Recaudo Consolidado</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 mt-2">
                    ${(
                      cartera.reduce((acc, r) => acc + r.abono, 0) +
                      cartera.filter(r => r.estado === 'Liquidado').reduce((acc, r) => acc + r.totalAPagar, 0)
                    ).toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">Abonos + Liquidaciones de caja</span>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Clientes Historial</span>
                  <span className="text-xl font-bold font-mono text-indigo-600 mt-2">
                    {new Set(cartera.map(r => r.clienteId)).size} Clientes
                  </span>
                  <span className="text-[9px] text-slate-500 font-medium mt-1">Con facturas en el portafolio</span>
                </div>
              </div>

              {/* Data Search and Filter Panel (Excel/Spreadsheet design) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                    <div className="relative w-full">
                      <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar por cliente, factura o medio de pago..."
                        value={cartSearchTerm}
                        onChange={(e) => setCartSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:bg-white outline-none shadow-xs transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 bg-slate-100/50 p-1.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-extrabold text-slate-500 uppercase px-1">Filtrar Estado:</span>
                    <div className="inline-flex rounded bg-white p-0.5 border border-slate-200">
                      {(['Todos', 'Pendiente', 'Abonado', 'Liquidado'] as const).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setCartStatusFilter(f)}
                          className={`px-3 py-1 text-[11px] font-extrabold rounded border-none cursor-pointer transition-all ${
                            cartStatusFilter === f 
                              ? 'bg-indigo-600 text-white shadow-xs' 
                              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-slate-700 min-w-[1240px]">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200 font-mono text-[10px] text-slate-500 uppercase">
                        <th className="p-3 pl-5 font-bold">Fecha Fact.</th>
                        <th className="p-3 font-bold">Cliente</th>
                        <th className="p-3 text-center font-bold">Fact.</th>
                        <th className="p-3 text-right font-bold">V/Mer.</th>
                        <th className="p-3 text-right bg-indigo-50/40 text-slate-600 font-bold">CREE 1.20%</th>
                        <th className="p-3 text-right font-bold">IVA 19%</th>
                        <th className="p-3 text-right text-slate-600 font-bold">REF 2.5%</th>
                        <th className="p-3 text-right font-black text-indigo-900 bg-indigo-50/50">Total A Pagar</th>
                        <th className="p-3 text-right font-semibold text-blue-600">Abono</th>
                        <th className="p-3 text-center font-bold">RC Abono</th>
                        <th className="p-3 text-center font-bold">RC Cancelac</th>
                        <th className="p-3 text-center font-bold">Fecha Pago</th>
                        <th className="p-3 font-bold">Medio Pago</th>
                        <th className="p-3 text-center font-bold font-bold">Estado</th>
                        <th className="p-3 text-center pr-5 font-bold">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {cartera
                        .filter(item => {
                          const matchesSearch = 
                            item.clienteNombre.toLowerCase().includes(cartSearchTerm.toLowerCase()) ||
                            item.factura.includes(cartSearchTerm) ||
                            item.medioPago.toLowerCase().includes(cartSearchTerm.toLowerCase());
                          
                          const matchesFilter = 
                            cartStatusFilter === 'Todos' || 
                            item.estado === cartStatusFilter;

                          return matchesSearch && matchesFilter;
                        })
                        .map(item => (
                          <React.Fragment key={item.id}>
                            <tr className={`hover:bg-slate-50/85 transition-colors ${item.estado === 'Liquidado' ? 'bg-emerald-50/15' : ''}`}>
                              <td className="p-3 pl-5 font-mono text-slate-500">
                                {item.fecha}
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-900">{item.clienteNombre}</div>
                                <div className="text-[10px] font-mono text-slate-400">NIT: {item.clienteId}</div>
                              </td>
                              <td className="p-3 text-center font-bold font-mono text-slate-800">
                                #{item.factura}
                              </td>
                              <td className="p-3 text-right font-mono font-medium text-slate-850">
                                ${item.valorMercancia.toLocaleString('es-CO')}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-500 bg-indigo-50/20">
                                ${item.cree.toLocaleString('es-CO', { maximumFractionDigits: 1 })}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-500">
                                ${item.iva.toLocaleString('es-CO')}
                              </td>
                              <td className="p-3 text-right font-mono text-slate-500">
                                {item.retencion > 0 ? `${item.retencion.toLocaleString('es-CO', { maximumFractionDigits: 1 })}` : '$ -'}
                              </td>
                              <td className="p-3 text-right font-mono font-black text-indigo-900 bg-indigo-50/20">
                                ${item.totalAPagar.toLocaleString('es-CO')}
                              </td>
                              <td className="p-3 text-right font-mono font-bold text-blue-600">
                                {item.abono > 0 ? `${item.abono.toLocaleString('es-CO')}` : '$ -'}
                              </td>
                              <td className="p-3 text-center font-mono text-slate-600">
                                {item.rcAbono ? `#${item.rcAbono}` : '-'}
                              </td>
                              <td className="p-3 text-center font-mono font-bold text-emerald-750">
                                {item.rcCancelacion ? `#${item.rcCancelacion}` : '-'}
                              </td>
                              <td className="p-3 text-center font-mono text-slate-500">
                                {item.fechaPago || '-'}
                              </td>
                              <td className="p-3">
                                <span className="font-mono text-[10px] tracking-wide bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase">
                                  {item.medioPago}
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  item.estado === 'Liquidado' 
                                    ? 'bg-emerald-100 text-emerald-850' 
                                    : item.estado === 'Abonado' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {item.estado}
                                </span>
                              </td>
                              <td className="p-3 text-center pr-5">
                                {item.estado !== 'Liquidado' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setLiquidatingRecordId(item.id);
                                      setLiqRcCancelacion('');
                                    }}
                                    className="px-2 py-1 bg-brand-primary hover:bg-brand-primary-container text-white rounded font-bold border-none cursor-pointer transition-all text-[10px] uppercase shadow-xs flex items-center gap-1 mx-auto"
                                  >
                                    <Check className="w-3 h-3 text-white" />
                                    <span>Liquidar</span>
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1">
                                    <PrinterCheck className="w-3.5 h-3.5" />
                                    <span>Liquidado</span>
                                  </span>
                                )}
                              </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>

                            {/* Inline Payment Settler Panel */}
                            {liquidatingRecordId === item.id && (
                              <tr className="bg-red-50/20">
                                <td colSpan={15} className="p-4 bg-slate-50 border-y border-slate-200">
                                  <div className="max-w-2xl mx-auto space-y-3.5 text-xs">
                                    <div className="flex items-center gap-2 text-brand-primary">
                                      <FileText className="w-4 h-4 animate-bounce" />
                                      <span className="font-bold">Liquidar Factura #{item.factura} de {item.clienteNombre}</span>
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-medium">Asiente el recibo de tesorería y fije la fecha para reajustar los balances comerciales.</p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                      {/* RC Cancelación */}
                                      <div className="space-y-1">
                                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase">RC CANCELACIÓN (NÚMERO DE COMPROBANTE)</label>
                                        <input 
                                          type="text"
                                          placeholder="e.g. 22638"
                                          value={liqRcCancelacion}
                                          onChange={(e) => setLiqRcCancelacion(e.target.value)}
                                          className="w-full bg-white border border-slate-300 rounded p-1.5 outline-none font-mono focus:border-red-500"
                                        />
                                      </div>

                                      {/* Fecha de Pago */}
                                      <div className="space-y-1">
                                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase">FECHA DE PAGO</label>
                                        <input 
                                          type="date"
                                          value={liqFechaPago}
                                          onChange={(e) => setLiqFechaPago(e.target.value)}
                                          className="w-full bg-white border border-slate-300 rounded p-1.5 outline-none font-mono focus:border-red-500"
                                        />
                                      </div>

                                      {/* Medio de Pago */}
                                      <div className="space-y-1">
                                        <label className="block text-[10px] font-extrabold text-slate-600 uppercase">MEDIO DE PAGO</label>
                                        <select 
                                          value={liqMedioPago}
                                          onChange={(e) => setLiqMedioPago(e.target.value)}
                                          className="w-full bg-white border border-slate-300 rounded p-1.5 outline-none focus:border-red-500"
                                        >
                                          <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                          <option value="EFECTIVO">EFECTIVO</option>
                                          <option value="CHEQUE">CHEQUE</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                                      <button
                                        type="button"
                                        onClick={() => setLiquidatingRecordId(null)}
                                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded border-none font-bold cursor-pointer text-[11px]"
                                      >
                                        Cancelar
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSavePayment(item.id)}
                                        className="px-4 py-1.5 bg-brand-primary hover:bg-brand-primary-container text-white rounded border-none font-bold cursor-pointer text-[11px]"
                                      >
                                        Confirmar Recibo y Cerrar
                                      </button>
                                    </div>
                                  </div>
                                </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                            )}
                          </React.Fragment>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Empty check */}
                {cartera.length === 0 && (
                  <div className="p-8 text-center text-slate-400 font-medium">
                    No hay registros de cartera configurados. Use el botón superior para crear uno.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. SECCIÓN CUENTAS POR PAGAR (Accounts Payable) */}
          {activeProcessTab === 'cuentas_por_pagar' && (
            <div className="space-y-6">
              
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20 shadow-sm">
                    <FileText className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Cuentas por Pagar (CXP)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Control unificado de compromisos financieros y facturación de proveedores</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showCppForm;
                    setShowCppForm(nextVal);
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowRcForm(false);
                      setShowOthForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-red-600 hover:bg-red-750 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-red-600/15"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>{showCppForm ? 'Ocultar Formulario' : 'Cargar CXP'}</span>
                </button>
              </div>

              {/* Form Card (Collapsible) */}
              {showCppForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Creación de Registro Obligatorio de Pasivo
                    </h3>
                  </div>

                  <form onSubmit={handleSaveCuentaPorPagar} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Código de Obligación / CXP</label>
                        <input 
                          type="text" 
                          value={cppCodigo}
                          onChange={(e) => setCppCodigo(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold outline-none focus:bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Fecha de Emisión</label>
                        <input 
                          type="date" 
                          value={cppFechaEmision}
                          onChange={(e) => setCppFechaEmision(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Fecha de Vencimiento</label>
                        <input 
                          type="date" 
                          value={cppFechaVencimiento}
                          onChange={(e) => setCppFechaVencimiento(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Proveedor / Beneficiario</label>
                        <select
                          value={cppProveedor}
                          onChange={(e) => setCppProveedor(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                          required
                        >
                          <option value="">-- Seleccionar Proveedor --</option>
                          <option value="Aceros Bogotá S.A.">Aceros Bogotá S.A.</option>
                          <option value="Siderúrgica del Pacífico S.A.">Siderúrgica del Pacífico S.A.</option>
                          <option value="Distribuidora de Químicos Tapasel">Distribuidora de Químicos Tapasel</option>
                          <option value="Energía EPM Medellín">Energía EPM Medellín</option>
                          <option value="Arrendamientos del Norte Ltda.">Arrendamientos del Norte Ltda.</option>
                          <option value="Servicios Integrados de Carga S.A.S.">Servicios Integrados de Carga S.A.S.</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Categoría del Gasto</label>
                        <select
                          value={cppCategoria}
                          onChange={(e) => setCppCategoria(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none"
                        >
                          <option value="Materia Prima">Materia Prima</option>
                          <option value="Repuestos e Insumos">Repuestos e Insumos</option>
                          <option value="Servicios Públicos">Servicios Públicos</option>
                          <option value="Infraestructura y Planta">Infraestructura y Planta</option>
                          <option value="Honorarios y Consultoría">Honorarios y Consultoría</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-8 space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Concepto / Detalle de la Obligación</label>
                        <input 
                          type="text"
                          value={cppConcepto}
                          onChange={(e) => setCppConcepto(e.target.value)}
                          placeholder="Ej. Suministro Bobinas de Acero Inoxidable - Factura N° 8593"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="md:col-span-4 space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Valor Obligación ($ COP)</label>
                        <input 
                          type="number"
                          value={cppMonto}
                          onChange={(e) => setCppMonto(e.target.value)}
                          placeholder="Ej. 12500000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold outline-none text-brand-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-lg border-none font-bold text-xs uppercase tracking-widest cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
                      >
                        <Check className="w-4 h-4 text-emerald-500" />
                        <span>Cargar en Cuentas por Pagar</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Excel-style table listing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-display font-semibold text-xs uppercase text-slate-800 tracking-wider">
                      HOJA DE ANÁLISIS DE CUENTAS POR PAGAR (ESTILO EXCEL)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Fila de Cabecera A-I • Rejilla de Pasivos y Compromisos Activos</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-mono uppercase font-bold">
                    PASIVOS TAPASEL S.A.S
                  </span>
                </div>

                <div className="overflow-x-auto p-4 bg-white">
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-700 font-bold font-mono">
                        <th className="border border-slate-200 px-3 py-2 text-center text-[10px] w-12 bg-slate-150 text-slate-400 font-normal">#</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">CXP ID</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Emisión</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Vence</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Proveedor / Acreedor</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Detalle Obligación</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Categoría</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Monto COP</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Estado</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {transacciones
                        .filter(t => t.tipo === 'Egreso' && t.descripcion.includes('[CXP]'))
                        .map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50/20 odd:bg-white even:bg-slate-50/70 transition-colors">
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">{item.id}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-500">{item.fecha}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-500">
                              {item.descripcion.match(/Vence:\s*([^\s•]+)/) ? item.descripcion.match(/Vence:\s*([^\s•]+)/)![1] : item.fecha}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-900">
                              {item.descripcion.match(/\[CXP\]\s*([^•]+)/) ? item.descripcion.match(/\[CXP\]\s*([^•]+)/)![1].trim() : 'Proveedor Planta'}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-600">
                              {item.descripcion.split('•').slice(3).join('•').trim() || item.descripcion}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5">
                              <span className="text-[10px] bg-slate-200/50 px-2 py-0.5 rounded text-slate-700 font-mono">
                                {item.categoria}
                              </span>
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-rose-600 font-bold font-sans">
                              -{formatCurrency(item.monto)}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              {item.estado === 'Pendiente' ? (
                                <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5 font-bold font-mono">
                                  POR PAGAR
                                </span>
                              ) : (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-250 rounded px-1.5 py-0.5 font-bold font-mono">
                                  PAGADO
                                </span>
                              )}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              {item.estado === 'Pendiente' && onSettleTransaction ? (
                                <button
                                  onClick={() => {
                                    onSettleTransaction(item.id);
                                    toast.success(`¡Cuenta por Pagar ${item.id} pagada y conciliada exitosamente en bancos!`);
                                  }}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded border-none font-bold cursor-pointer transition-colors text-[10px] shadow-sm shadow-emerald-600/10"
                                >
                                  Pagar/Sellar
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-slate-400 font-bold text-center block">Saldado</span>
                              )}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {transacciones.filter(t => t.tipo === 'Egreso' && t.descripcion.includes('[CXP]')).length === 0 && (
                        <tr>
                          <td colSpan={10} className="border border-slate-200 p-6 text-center text-slate-400 text-xs italic bg-white">
                            Ninguna obligación de Cuenta por Pagar registrada todavía.
                          </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 4. SECCIÓN OTROS EGRESOS */}
          {activeProcessTab === 'otros_egresos' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Otros Egresos y Caja Menor
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Registro ágil de gastos de caja menor, viáticos y desembolsos complementarios</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showOthForm;
                    setShowOthForm(nextVal);
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowRcForm(false);
                      setShowCppForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <Plus className="w-4 h-4 text-orange-400" />
                  <span>{showOthForm ? 'Ocultar Formulario' : 'Registrar Gasto'}</span>
                </button>
              </div>

              {/* Form Card (Collapsible) */}
              {showOthForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Nuevo Registro de Gasto Complementario
                    </h3>
                  </div>

                  <form onSubmit={handleSaveOtherExpenditure} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Concepto Complementario</label>
                        <input 
                          type="text"
                          value={othConcepto}
                          onChange={(e) => setOthConcepto(e.target.value)}
                          placeholder="Ej. Viáticos técnicos de empalme o papelería Medellín"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Beneficiario / Contratista</label>
                        <input 
                          type="text"
                          value={othBeneficiario}
                          onChange={(e) => setOthBeneficiario(e.target.value)}
                          placeholder="Ej. Juan Pérez o Proveedor Común"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Origen / Forma del Egreso</label>
                        <select
                          value={othForma}
                          onChange={(e) => setOthForma(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                        >
                          <option value="Caja Menor">Caja Menor</option>
                          <option value="Transferencia Directa">Transferencia Directa</option>
                          <option value="Cheque de Gerencia">Cheque de Gerencia</option>
                          <option value="Imprevistos de Planta">Imprevistos de Planta</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Monto COP</label>
                        <input 
                          type="number"
                          value={othMonto}
                          onChange={(e) => setOthMonto(e.target.value)}
                          placeholder="Ej. 180000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold outline-none focus:bg-white text-rose-700"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Detalle Adicional</label>
                        <input 
                          type="text"
                          value={othDetalle}
                          onChange={(e) => setOthDetalle(e.target.value)}
                          placeholder="Uso inmediato operario"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full bg-slate-900 hover:bg-slate-950 text-white py-3 rounded-lg border-none font-bold text-xs uppercase tracking-wider cursor-pointer shadow-md transition-all"
                      >
                        Registrar Gasto de Caja Menor
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Excel-style table listing */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-slate-50/50">
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <div>
                    <h3 className="font-display font-semibold text-xs uppercase text-slate-800 tracking-wider">
                      HOJA DE REGISTRO DE MENORES Y CAJA CHICA (ESTILO EXCEL)
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">Fila de Cabecera A-G • Cuadre de Caja Diaria</p>
                  </div>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-mono uppercase font-bold">
                    CAJA AUXILIAR
                  </span>
                </div>

                <div className="overflow-x-auto p-4 bg-white">
                  <table className="w-full border-collapse border border-slate-200 text-left text-xs bg-white">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-250 text-slate-700 font-bold font-mono">
                        <th className="border border-slate-200 px-3 py-2 text-center text-[10px] w-12 bg-slate-150 text-slate-400 font-normal">#</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Comprobante ID</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Fecha Movimiento</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Beneficiario / Responsable</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Descripción / Concepto Técnico</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Método Origen</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight">Monto COP</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px]">
                      {transacciones
                        .filter(t => t.tipo === 'Egreso' && (t.descripcion.match(/otros egresos|egr-ext|caja menor|gastos extra/i) || t.categoria === 'Caja Menor'))
                        .map((item, index) => (
                          <tr key={item.id} className="hover:bg-blue-50/20 odd:bg-white even:bg-slate-50/70 transition-colors">
                            <td className="border border-slate-200 px-3 py-1.5 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">{index + 1}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">{item.id}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-500">{item.fecha}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-900">{item.responsable}</td>
                            <td className="border border-slate-200 px-3 py-1.5 text-slate-650">{item.descripcion}</td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-slate-500">
                              {item.categoria || 'Caja Menor'}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 font-mono text-rose-600 font-bold font-sans">
                              -{formatCurrency(item.monto)}
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      {transacciones.filter(t => t.tipo === 'Egreso' && (t.descripcion.match(/otros egresos|egr-ext|caja menor|gastos extra/i) || t.categoria === 'Caja Menor')).length === 0 && (
                        <tr>
                          <td colSpan={7} className="border border-slate-200 p-6 text-center text-slate-400 text-xs italic bg-white">
                            Ningún egreso menor registrado hoy.
                          </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 5. SECCIÓN REPORTES */}
          {activeProcessTab === 'reportes' && (
            <div className="space-y-6">
              
              {/* Executive Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Entradas de Capital (Ingresos)
                  </span>
                  <h4 className="text-lg font-bold font-display text-emerald-600">
                    {formatCurrency(totalIngresos)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Facturas asimiladas positivamente
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Salidas Totales (Egresos)
                  </span>
                  <h4 className="text-lg font-bold font-display text-rose-600">
                    {formatCurrency(totalEgresos)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Proveedores y caja menor
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Caja Neta Consolidada
                  </span>
                  <h4 className={`text-lg font-bold font-display ${netoCaja >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatCurrency(netoCaja)}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Saldo inmediato en bancos
                  </p>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    EBITDA Operativo
                  </span>
                  <h4 className="text-lg font-bold font-display text-brand-primary">
                    +34.2 %
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Rendimiento financiero de planta
                  </p>
                </div>
              </div>

              {/* Chart container */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 pb-3 mb-4">
                  <div>
                    <h3 className="font-display font-semibold text-slate-900 text-xs flex items-center gap-2 uppercase tracking-wide">
                      <TrendingUp className="w-4 h-4 text-brand-primary" />
                      Comparativo Mensual: Ingresos vs Egresos
                    </h3>
                  </div>
                  <div className="flex gap-1.5 text-[9px] font-bold">
                    <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded text-emerald-700 uppercase">
                      Ingresos
                    </span>
                    <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 rounded text-rose-600 uppercase">
                      Egresos
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      barGap={6}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-slate-200)" />
                      <XAxis 
                        dataKey="label" 
                        stroke="var(--color-slate-500)" 
                        fontSize={10} 
                        tickLine={false}
                        axisLine={false}
                        dy={8} 
                      />
                      <YAxis 
                        stroke="var(--color-slate-500)" 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        dx={-8}
                        tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`}
                      />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-xl text-[10px] font-mono text-slate-800">
                                <p className="font-bold border-b border-slate-200 pb-1 mb-1">{label}</p>
                                <p className="text-emerald-600 dark:text-emerald-400">Ingresos: {formatCurrency(payload[0].value as number)}</p>
                                <p className="text-rose-600 dark:text-rose-450 dark:text-rose-400">Egresos: {formatCurrency(payload[1].value as number)}</p>
                              </div>
                            );
                          }
                          return null;
                        }} 
                      />
                      <Bar 
                        dataKey="ingresos" 
                        fill="var(--color-chart-ingresos)" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={24}
                      />
                      <Bar 
                        dataKey="egresos" 
                        fill="var(--color-chart-egresos)" 
                        radius={[4, 4, 0, 0]} 
                        maxBarSize={24}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Libro Diario General Logs */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
                
                <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-slate-50">
                  <span className="font-display font-bold text-xs uppercase tracking-wider text-slate-800">
                    Libro Diario General (Ledger Completo)
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <select
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px]"
                      value={txTypeFilter}
                      onChange={(e: any) => { setTxTypeFilter(e.target.value); setCurrentPage(1); }}
                    >
                      <option value="All">Todos los Tipos</option>
                      <option value="Ingreso">Solo Ingresos</option>
                      <option value="Egreso">Solo Egresos</option>
                    </select>

                    <input 
                      type="text"
                      className="bg-white border border-slate-200 rounded p-1.5 text-[11px]"
                      placeholder="Buscar en libro diario..."
                      value={txSearchTerm}
                      onChange={(e) => { setTxSearchTerm(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <th className="px-5 py-4">Fecha</th>
                        <th className="px-5 py-4">Descripción / ID</th>
                        <th className="px-5 py-4">Monto COP</th>
                        <th className="px-5 py-4">Estado</th>
                        <th className="border border-slate-200 px-3 py-2 text-[10px] uppercase font-bold tracking-tight text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {paginatedTxs.map((item) => (
                        <tr 
                          key={item.id} 
                          className="hover:bg-slate-50/50 cursor-pointer"
                          onClick={() => setSelectedTransaction(item)}
                        >
                          <td className="px-5 py-3 font-mono text-slate-500">{item.fecha}</td>
                          <td className="px-5 py-3 text-slate-800 font-semibold">
                            <div>{item.descripcion}</div>
                            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">{item.id} • Responsable: {item.responsable}</span>
                          </td>
                          <td className="px-5 py-3 font-mono font-bold">
                            <div className="flex items-center gap-1.5">
                              {item.tipo === 'Ingreso' ? (
                                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-650" />
                              ) : (
                                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-500" />
                              )}
                              <span>{formatCurrency(item.monto)}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-bold tracking-wider ${
                              item.estado === 'Pagado'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {item.estado}
                            </span>
                          </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      ))}
                      {paginatedTxs.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center py-6 text-slate-500 text-xs italic">
                            No se encontraron transacciones en base a los términos indicados.
                          </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-[11px] font-mono text-slate-500 rounded-b-lg">
                  <span>Mostrando {paginatedTxs.length} de {filteredTxs.length} registros</span>
                  <div className="flex gap-2">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      className="p-1 px-3 bg-white border border-slate-200 disabled:opacity-30 rounded hover:text-slate-800 transition-all cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="px-3 py-1 bg-slate-900 text-white rounded font-bold">
                      {currentPage} de {totalPages}
                    </span>
                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      className="p-1 px-3 bg-white border border-slate-200 disabled:opacity-30 rounded hover:text-slate-800 transition-all cursor-pointer"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* 6. MÓDULO DE PROVEEDORES (Image 1 Columns) */}
          {activeProcessTab === 'proveedores' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-650 border border-emerald-100 shadow-sm">
                    <Briefcase className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Registro de Proveedores (Ingreso)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Control de facturación, retenciones (2.5%), IVA y fechas de cancelación de deudas</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showProvForm;
                    setShowProvForm(nextVal);
                    setEditingProvId(null);
                    setProvNombre('');
                    setProvFactura('');
                    setProvValorMerc('');
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowRcForm(false);
                      setShowCppForm(false);
                      setShowOthForm(false);
                      setShowCartForm(false);
                      setShowCotForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/15"
                >
                  <Plus className="w-4 h-4 text-emerald-300" />
                  <span>{showProvForm ? 'Ocultar Formulario' : 'Ingresar Registro'}</span>
                </button>
              </div>

              {/* Master Totals Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Valor Mercancía (Bruto)
                  </span>
                  <h4 className="text-base font-bold font-display text-slate-800">
                    {formatCurrency(proveedores.reduce((sum, p) => sum + p.valorMercancia, 0))}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Suma acumulada antes de impuestos</p>
                </div>
                
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    IVA 19% Generado
                  </span>
                  <h4 className="text-base font-bold font-display text-teal-600">
                    {formatCurrency(proveedores.reduce((sum, p) => sum + p.iva, 0))}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Impuesto a las ventas declarado</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Retenciones 2.5% Aplicadas
                  </span>
                  <h4 className="text-base font-bold font-display text-amber-600">
                    {formatCurrency(proveedores.reduce((sum, p) => sum + p.retencion, 0))}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Retención en la fuente practicada</p>
                </div>

                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm">
                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-wider block font-bold mb-1">
                    Total Neto a Pagar
                  </span>
                  <h4 className="text-base font-bold font-display text-emerald-600">
                    {formatCurrency(proveedores.reduce((sum, p) => sum + p.totalAPagar, 0))}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1">Monto definitivo pendiente y saldado</p>
                </div>
              </div>

              {/* Form Card (Collapsible) */}
              {showProvForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in text-xs">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-5">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      {editingProvId ? 'Editar Registro de Proveedor' : 'Creación de Registro de Facturación de Proveedores (Ingreso)'}
                    </h3>
                  </div>

                  <form onSubmit={handleSaveProveedor} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Fecha de Operación</label>
                        <input 
                          type="date" 
                          value={provFecha}
                          onChange={(e) => setProvFecha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-700">Nombre del Proveedor</label>
                        <input 
                          type="text" 
                          value={provNombre}
                          onChange={(e) => setProvNombre(e.target.value)}
                          placeholder="p. ej. Sebastián Urrego / GOMEC COLOMBIA ESP"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">N° Factura</label>
                        <input 
                          type="text" 
                          value={provFactura}
                          onChange={(e) => setProvFactura(e.target.value)}
                          placeholder="Escribe el nro de factura"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Valor Mercancía ($ COP)</label>
                        <input 
                          type="number" 
                          value={provValorMerc}
                          onChange={(e) => setProvValorMerc(e.target.value)}
                          placeholder="Ingresa el valor bruto"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 pt-6">
                        <input 
                          type="checkbox" 
                          id="provApplyRet"
                          checked={provApplyRet}
                          onChange={(e) => setProvApplyRet(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="provApplyRet" className="text-xs font-semibold text-slate-700 cursor-pointer">
                          Aplicar Retención en Fuente (2.5%)
                        </label>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Estado de Factura</label>
                        <select
                          value={provEstado}
                          onChange={(e: any) => setProvEstado(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white cursor-pointer"
                        >
                          <option value="Pendiente">❌ Pendiente de Pago</option>
                          <option value="Cancelado">✅ Cancelado / Liquidado</option>
                        </select>
                      </div>

                    </div>

                    {/* Quick Payment Details (Conditional on 'Cancelado') */}
                    {provEstado === 'Cancelado' && (
                      <div className="bg-emerald-50/50 p-4 border border-emerald-150 rounded-xl space-y-3 animate-fade-in">
                        <h4 className="font-bold text-xs text-emerald-800">Detalles de Cancelación de Egreso</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-emerald-700">Comprobante de Egreso (C.E.) *</label>
                            <input 
                              type="text" 
                              value={provComprobanteEgreso}
                              onChange={(e) => setProvComprobanteEgreso(e.target.value)}
                              placeholder="CE-XXXX"
                              className="w-full bg-white border border-emerald-200 rounded p-2 text-xs"
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-emerald-700">Cheque N° / Referencia Banco</label>
                            <input 
                              type="text" 
                              value={provChequeNo}
                              onChange={(e) => setProvChequeNo(e.target.value)}
                              placeholder="CH-XXXX o Ref de click"
                              className="w-full bg-white border border-emerald-200 rounded p-2 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-emerald-700">Fecha de Cancelación</label>
                            <input 
                              type="date" 
                              value={provFechaCancelado}
                              onChange={(e) => setProvFechaCancelado(e.target.value)}
                              className="w-full bg-white border border-emerald-200 rounded p-2 text-xs"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Automatic calculation preview */}
                    {Number(provValorMerc) > 0 && (
                      <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200/60 max-w-md space-y-2">
                        <span className="text-[10px] uppercase font-mono font-bold text-slate-400">Arqueo de Totales Sugeridos</span>
                        <div className="space-y-1 text-slate-600 font-mono text-[11px]">
                          <div className="flex justify-between">
                            <span>Valor mercancía:</span>
                            <span>{formatCurrency(Number(provValorMerc))}</span>
                          </div>
                          <div className="flex justify-between text-teal-650">
                            <span>+ IVA 19%:</span>
                            <span>{formatCurrency(Number(provValorMerc) * 0.19)}</span>
                          </div>
                          {provApplyRet && (
                            <div className="flex justify-between text-amber-650 font-bold">
                              <span>- Rte Fuente 2.5%:</span>
                              <span>{formatCurrency(Number(provValorMerc) * 0.025)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-slate-900 font-bold border-t border-slate-200 pt-1 text-xs">
                            <span>Total Neto a Pagar:</span>
                            <span>{formatCurrency(Number(provValorMerc) + (Number(provValorMerc) * 0.19) - (provApplyRet ? (Number(provValorMerc) * 0.025) : 0))}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProvForm(false)}
                        className="px-4 py-2 border-none bg-slate-250 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 border-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Guardar en Base de Datos</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Providers Search & Filter Drawer */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre Proveedor o N° de factura..."
                    value={provSearchTerm}
                    onChange={(e) => setProvSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-9 text-xs outline-none focus:bg-white"
                  />
                </div>
                <div className="w-full sm:w-48">
                  <select
                    value={provEstadoFilter}
                    onChange={(e: any) => setProvEstadoFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs outline-none focus:bg-white cursor-pointer"
                  >
                    <option value="Todos">Filtro: Todos los estados</option>
                    <option value="Pendiente">❌ Solo Pendientes</option>
                    <option value="Cancelado">✅ Solo Cancelados</option>
                  </select>
                </div>
              </div>

              {/* Settlement Mini Form Modal for Suppliers */}
              {updatingProvId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                  <form onSubmit={handleUpdatePaymentProveedor} className="bg-white border border-slate-200 w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-fade-in text-slate-800 text-xs text-left">
                    <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
                      <h3 className="font-display font-bold text-slate-900 text-xs uppercase flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-emerald-650" />
                        Registrar Cancelación de Factura
                      </h3>
                      <button 
                        type="button" 
                        onClick={() => setUpdatingProvId(null)}
                        className="text-xs bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="p-5 space-y-4">
                      <p className="text-[11px] text-slate-500 leading-snug">
                        Ingrese los códigos de caja y comprobantes emitidos físicamente o transferencia electrónica para finiquitar esta obligación de pago.
                      </p>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Comprobante de Egreso (C.E.) *</label>
                          <input 
                            type="text" 
                            required
                            value={provEgresoInput}
                            onChange={(e) => setProvEgresoInput(e.target.value)}
                            placeholder="p. ej. CE-1054"
                            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Cheque N° / Referencia Transferencia</label>
                          <input 
                            type="text" 
                            value={provChequeInput}
                            onChange={(e) => setProvChequeInput(e.target.value)}
                            placeholder="p. ej. CH-0421 o Bancolombia Ref"
                            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-slate-700">Fecha de Cancelación</label>
                          <input 
                            type="date" 
                            required
                            value={provFechaCancelInput}
                            onChange={(e) => setProvFechaCancelInput(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 rounded p-2 text-xs font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs font-bold">
                      <button 
                        type="button"
                        onClick={() => setUpdatingProvId(null)}
                        className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg cursor-pointer border-none"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg cursor-pointer border-none"
                      >
                        Liquidar Obligación
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Suppliers Interactive Table (Image 1 Structure) */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <th className="px-4 py-4 font-bold">Fecha</th>
                        <th className="px-4 py-4 font-bold">Proveedor</th>
                        <th className="px-4 py-4 font-bold">Factura</th>
                        <th className="px-4 py-4 font-bold text-right">V/Merc.</th>
                        <th className="px-4 py-4 font-bold text-right">IVA 19%</th>
                        <th className="px-4 py-4 font-bold text-right">Ret. 2.5%</th>
                        <th className="px-4 py-4 font-bold text-right">Total a pagar</th>
                        <th className="px-4 py-4 font-bold">Compr. Egreso</th>
                        <th className="px-4 py-4 font-bold">Cheque E N°</th>
                        <th className="px-4 py-4 font-bold">Fecha Cancelado</th>
                        <th className="px-4 py-4 font-bold">Estado</th>
                        <th className="px-4 py-4 font-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {proveedores
                        .filter(p => {
                          const matchesSearch = p.proveedorNombre.toLowerCase().includes(provSearchTerm.toLowerCase()) || p.factura.toLowerCase().includes(provSearchTerm.toLowerCase());
                          const matchesEstado = provEstadoFilter === 'Todos' || p.estado === provEstadoFilter;
                          return matchesSearch && matchesEstado;
                        })
                        .map((prov) => (
                          <tr key={prov.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{prov.fecha}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{prov.proveedorNombre}</td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700">{prov.factura}</td>
                            <td className="px-4 py-3 text-right font-mono text-slate-600">{formatCurrency(prov.valorMercancia)}</td>
                            <td className="px-4 py-3 text-right font-mono text-teal-600">{formatCurrency(prov.iva)}</td>
                            <td className="px-4 py-3 text-right font-mono text-amber-600 font-medium">-{formatCurrency(prov.retencion)}</td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(prov.totalAPagar)}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{prov.comprobanteEgreso || <span className="text-slate-350 italic">-</span>}</td>
                            <td className="px-4 py-3 font-mono text-slate-700">{prov.chequeNo || <span className="text-slate-350 italic">-</span>}</td>
                            <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">{prov.fechaCancelado || <span className="text-amber-500 font-bold">Pendiente</span>}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase whitespace-nowrap ${
                                prov.estado === 'Cancelado'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-red-50 text-red-650 border border-red-150 animate-pulse'
                              }`}>
                                {prov.estado}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex gap-1 justify-center">
                                <button
                                  onClick={() => {
                                    setEditingProvId(prov.id);
                                    setProvFecha(prov.fecha);
                                    setProvNombre(prov.proveedorNombre);
                                    setProvFactura(prov.factura);
                                    setProvValorMerc(prov.valorMercancia.toString());
                                    setProvEstado(prov.estado);
                                    setShowProvForm(true);
                                  }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded font-bold border-none cursor-pointer text-[10px] transition-all whitespace-nowrap"
                                >
                                  Editar
                                </button>
                                {prov.estado === 'Pendiente' ? (
                                  <button
                                    onClick={() => {
                                      setUpdatingProvId(prov.id);
                                      setProvEgresoInput(`CE-${Math.floor(Math.random() * 800) + 1000}`);
                                      setProvChequeInput('');
                                    }}
                                    className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold border-none cursor-pointer text-[10px] transition-all whitespace-nowrap"
                                  >
                                    Pagar Factura
                                  </button>
                                ) : (
                                  <span className="text-emerald-600 font-bold text-[10px] block font-mono self-center">PAGADA 💰</span>
                                )}
                              </div>
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                    }
                    {proveedores.filter(p => {
                      const matchesSearch = p.proveedorNombre.toLowerCase().includes(provSearchTerm.toLowerCase()) || p.factura.toLowerCase().includes(provSearchTerm.toLowerCase());
                      const matchesEstado = provEstadoFilter === 'Todos' || p.estado === provEstadoFilter;
                      return matchesSearch && matchesEstado;
                    }).length === 0 && (
                      <tr>
                        <td colSpan={12} className="text-center py-6 text-slate-500 text-xs italic">
                          No se encontraron registros de proveedores con los filtros indicados.
                        </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                    )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* 7. MÓDULO DE COTIZACIONES (Image 2 Sheet Format) */}
          {activeProcessTab === 'cotizaciones' && (
            <div className="space-y-6">
              
              {/* Header Panel with Toggle Button */}
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100 shadow-sm">
                    <FileSpreadsheet className="w-5 h-5 shadow-sm" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-base text-slate-900 tracking-tight">
                      Módulo de Cotiza (Cotizaciones)
                    </h2>
                    <p className="text-[11px] text-slate-500 font-medium">Formulación de cotizaciones comerciales para clientes y pasarela de firmas digitales</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !showCotForm;
                    setShowCotForm(nextVal);
                    setTempCotItems([]);
                    setEditingCotId(null);
                    setCotNo(`COT-${Math.floor(Math.random() * 8000) + 1000}`);
                    setCotClienteNombre('');
                    setCotIngeniero('');
                    setCotReferenciaObra('');
                    setCotDireccion('Carrera 40 # 43- 50 Medellín');
                    if (nextVal) {
                      setShowCliForm(false);
                      setShowRcForm(false);
                      setShowCppForm(false);
                      setShowOthForm(false);
                      setShowCartForm(false);
                      setShowProvForm(false);
                    }
                  }}
                  className="px-4 py-2 border-none bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-sm shadow-teal-650/15"
                >
                  <Plus className="w-4 h-4 text-teal-300" />
                  <span>{showCotForm ? 'Ver Cotizaciones' : 'Generar Nueva Cotización'}</span>
                </button>
              </div>

              {/* Form Card for generating Quote (Collapsible) */}
              {showCotForm && (
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm animate-fade-in text-xs space-y-5">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="font-display font-bold text-sm text-slate-900">
                      Creación y Configuración de Cotización de Productos / Servicios
                    </h3>
                  </div>

                  <form onSubmit={handleSaveCotizacion} className="space-y-6">
                    
                    {/* Header values mapping Image 2 details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Código Cotización (No.)</label>
                        <input 
                          type="text" 
                          value={cotNo}
                          onChange={(e) => setCotNo(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono font-bold outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Fecha de Emisión</label>
                        <input 
                          type="date" 
                          value={cotFecha}
                          onChange={(e) => setCotFecha(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-mono outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Compañía Emisora (Tapasel)</label>
                        <input 
                          type="text" 
                          value={cotEmpresa}
                          onChange={(e) => setCotEmpresa(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white font-semibold"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Señores (Cliente) *</label>
                        <input 
                          type="text" 
                          value={cotClienteNombre}
                          onChange={(e) => setCotClienteNombre(e.target.value)}
                          placeholder="p. ej. Sebastián Urrego / GOMEC COLOMBIA"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Ingeniero Técnico Encargado</label>
                        <input 
                          type="text" 
                          value={cotIngeniero}
                          onChange={(e) => setCotIngeniero(e.target.value)}
                          placeholder="p. ej. Andrés Delgado"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-semibold text-slate-700">Referencia de Obra / Proyecto *</label>
                        <input 
                          type="text" 
                          value={cotReferenciaObra}
                          onChange={(e) => setCotReferenciaObra(e.target.value)}
                          placeholder="p. ej. Tap tapas rústicas niqueladas"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1 md:col-span-3">
                        <label className="block text-xs font-semibold text-slate-700">Dirección de Despacho de Obra</label>
                        <input 
                          type="text" 
                          value={cotDireccion}
                          onChange={(e) => setCotDireccion(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs outline-none focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Interactive Product List Builder section */}
                    <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide flex items-center gap-1">
                        <span>📦 Agregar Producto / Item a la Cotización</span>
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div className="col-span-12 md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Referencia</label>
                          <input 
                            type="text" 
                            placeholder="Ref-01" 
                            value={itemRef} 
                            onChange={(e) => setItemRef(e.target.value)}
                            className="w-full bg-white border border-slate-250 p-2 text-xs rounded"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-4">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Descripción de Tapas / Materiales</label>
                          <input 
                            type="text" 
                            placeholder="Descripción detallada del transformador/tapas" 
                            value={itemDesc} 
                            onChange={(e) => setItemDesc(e.target.value)}
                            className="w-full bg-white border border-slate-250 p-2 text-xs rounded"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-1.5">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Unidad</label>
                          <input 
                            type="text" 
                            placeholder="un" 
                            value={itemUn} 
                            onChange={(e) => setItemUn(e.target.value)}
                            className="w-full bg-white text-center border border-slate-250 p-2 text-xs rounded"
                          />
                        </div>
                        <div className="col-span-6 md:col-span-1.5">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Cantidad</label>
                          <input 
                            type="number" 
                            placeholder="1" 
                            value={itemCant} 
                            onChange={(e) => setItemCant(e.target.value)}
                            className="w-full bg-white text-center border border-slate-250 p-2 text-xs rounded animate-pulse-once"
                          />
                        </div>
                        <div className="col-span-12 md:col-span-3">
                          <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Valor Unit ($ COP)</label>
                          <input 
                            type="number" 
                            placeholder="Monto unitario" 
                            value={itemValUnit} 
                            onChange={(e) => setItemValUnit(e.target.value)}
                            className="w-full bg-white border border-slate-250 p-2 text-xs rounded"
                          />
                        </div>
                      </div>

                      <div className="flex justify-start">
                        <button
                          type="button"
                          onClick={() => {
                            if (!itemDesc || !itemCant || !itemValUnit) {
                              toast.error("Defina descripción, cantidad y valor unitario del producto.");
                              return;
                            }
                            const newItem = {
                              itemNo: tempCotItems.length + 1,
                              referencia: itemRef || "General",
                              descripcion: itemDesc,
                              unidad: itemUn || "un",
                              cantidad: Number(itemCant),
                              valorUnitario: Number(itemValUnit),
                              valorTotal: Number(itemCant) * Number(itemValUnit)
                            };
                            setTempCotItems([...tempCotItems, newItem]);
                            // Clear inputs
                            setItemRef('');
                            setItemDesc('');
                            setItemUn('un');
                            setItemCant('1');
                            setItemValUnit('');
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded text-[11px] font-bold cursor-pointer hover:bg-slate-800 transition-all flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-450" />
                          Agregar a Tabla de Productos
                        </button>
                      </div>

                      {/* Temp items table preview */}
                      {tempCotItems.length > 0 && (
                        <div className="bg-white rounded border border-slate-200 overflow-hidden mt-2">
                          <table className="w-full text-left text-[11px] border-collapse">
                            <thead>
                              <tr className="bg-slate-100 text-[9px] font-mono uppercase text-slate-500 font-bold border-b border-slate-200">
                                <th className="p-2 border-r border-slate-200 text-center">It.</th>
                                <th className="p-2 border-r border-slate-200">Referencia</th>
                                <th className="p-2 border-r border-slate-200">Descripción de Productos</th>
                                <th className="p-2 border-r border-slate-200 text-center">UN</th>
                                <th className="p-2 border-r border-slate-200 text-center">CANT</th>
                                <th className="p-2 border-r border-slate-200 text-right">VALOR UNIT.</th>
                                <th className="p-2 border-r border-slate-200 text-right">VALOR TOTAL</th>
                                <th className="p-2 text-center">Borrar</th>
                              </tr>
                            </thead>
                            <tbody>
                              {tempCotItems.map((it, idx) => (
                                <tr key={idx} className="border-b border-slate-100 last:border-0">
                                  <td className="p-2 border-r border-slate-100 text-center font-mono font-bold">{it.itemNo}</td>
                                  <td className="p-2 border-r border-slate-100 font-mono text-slate-500">{it.referencia}</td>
                                  <td className="p-2 border-r border-slate-100 text-slate-900 font-medium">{it.descripcion}</td>
                                  <td className="p-2 border-r border-slate-100 text-center font-mono">{it.unidad}</td>
                                  <td className="p-2 border-r border-slate-100 text-center font-mono font-bold text-slate-800">{it.cantidad}</td>
                                  <td className="p-2 border-r border-slate-100 text-right font-mono">{formatCurrency(it.valorUnitario)}</td>
                                  <td className="p-2 border-r border-slate-100 text-right font-mono font-bold">{formatCurrency(it.valorTotal)}</td>
                                  <td className="p-2 text-center">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const nextList = tempCotItems.filter((_, i) => i !== idx).map((item, i) => ({
                                          ...item,
                                          itemNo: i + 1
                                        }));
                                        setTempCotItems(nextList);
                                      }}
                                      className="p-1 bg-transparent border-none text-red-600 hover:text-red-800 cursor-pointer text-xs"
                                    >
                                      ✕
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Automatically computed financials totals container */}
                    {tempCotItems.length > 0 && (
                      <div className="p-4 bg-teal-50/40 rounded-xl border border-teal-150 max-w-sm ml-auto space-y-1 text-slate-700 font-mono text-xs">
                        <div className="flex justify-between">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(tempCotItems.reduce((sum, curr) => sum + curr.valorTotal, 0))}</span>
                        </div>
                        <div className="flex justify-between text-teal-650">
                          <span>+ IVA (19%):</span>
                          <span>{formatCurrency(tempCotItems.reduce((sum, curr) => sum + curr.valorTotal, 0) * 0.19)}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 font-bold border-t border-teal-200 pt-1 text-sm">
                          <span>Total General:</span>
                          <span>{formatCurrency(tempCotItems.reduce((sum, curr) => sum + curr.valorTotal, 0) * 1.19)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setTempCotItems([]);
                          setEditingCotId(null);
                          setShowCotForm(false);
                        }}
                        className="px-4 py-2 border-none bg-slate-250 hover:bg-slate-350 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 border-none bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Generar y Firmar Cotización</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Quotations Interactive List & Filters */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 text-xs">
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por Nombre Señor/a o Obra de Proyecto..."
                    value={cotSearchTerm}
                    onChange={(e) => setCotSearchTerm(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 pl-9 text-xs outline-none focus:bg-white"
                  />
                </div>
              </div>

              {/* Table of Quotations */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-500 uppercase tracking-wider font-mono">
                        <th className="px-4 py-4 font-bold">Código/No.</th>
                        <th className="px-4 py-4 font-bold">Fecha</th>
                        <th className="px-4 py-4 font-bold">Cliente / Empresa</th>
                        <th className="px-4 py-4 font-bold">Obra / Proyecto</th>
                        <th className="px-4 py-4 font-bold">Ingeniero Encargado</th>
                        <th className="px-4 py-4 font-bold text-right">Valor Cotizado</th>
                        <th className="px-4 py-4 font-bold">Estado Firma</th>
                        <th className="px-4 py-4 font-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {cotizaciones
                        .filter(c => {
                          return c.clienteNombre.toLowerCase().includes(cotSearchTerm.toLowerCase()) || 
                                 c.referenciaObra.toLowerCase().includes(cotSearchTerm.toLowerCase()) ||
                                 c.cotizacionNo.toLowerCase().includes(cotSearchTerm.toLowerCase());
                        })
                        .map((cot) => (
                          <tr key={cot.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                              {cot.cotizacionNo}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                              {cot.fecha}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-800">{cot.clienteNombre}</div>
                              {cot.empresa && <div className="text-[9px] text-slate-400 font-mono uppercase">{cot.empresa}</div>}
                            </td>
                            <td className="px-4 py-3 text-slate-700 max-w-[200px] truncate" title={cot.referenciaObra}>
                              {cot.referenciaObra}
                            </td>
                            <td className="px-4 py-3 text-slate-650">
                              {cot.ingeniero}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                              {formatCurrency(cot.total)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                                cot.firmaDigitalCliente
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}>
                                {cot.firmaDigitalCliente ? 'Firmado / Autorizado' : 'Falta Firma Cliente'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setSelectedCotizacion(cot)}
                                  className="px-2.5 py-1 bg-red-650 hover:bg-slate-900 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Ver / Firmar Cotización"
                                >
                                  <FileText className="w-3 h-3" />
                                  <span>Ver / Firmar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingCotId(cot.id);
                                    setCotNo(cot.cotizacionNo);
                                    setCotFecha(cot.fecha);
                                    setCotEmpresa(cot.empresa);
                                    setCotClienteNombre(cot.clienteNombre);
                                    setCotIngeniero(cot.ingeniero);
                                    setCotReferenciaObra(cot.referenciaObra);
                                    setCotDireccion(cot.direccion);
                                    setTempCotItems(cot.items);
                                    setShowCotForm(true);
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Editar Cotización"
                                >
                                  <span>Editar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    toast.success(`Simulando exportación de cotización ${cot.cotizacionNo} como archivo Tapasel...`);
                                  }}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Exportar Cotización"
                                >
                                  <span>Exportar</span>
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Está seguro de que desea eliminar la cotización ${cot.cotizacionNo}?`)) {
                                      if (onDeleteCotizacion) {
                                        onDeleteCotizacion(cot.id);
                                        toast.success(`Cotización ${cot.cotizacionNo} eliminada con éxito.`);
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-[10px] transition-all border-none cursor-pointer flex items-center gap-1 shadow-sm"
                                  title="Eliminar Cotización"
                                >
                                  <span>Eliminar</span>
                                </button>
                              </div>
                            </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      }
                      {cotizaciones.filter(c => {
                        return c.clienteNombre.toLowerCase().includes(cotSearchTerm.toLowerCase()) || 
                               c.referenciaObra.toLowerCase().includes(cotSearchTerm.toLowerCase()) ||
                               c.cotizacionNo.toLowerCase().includes(cotSearchTerm.toLowerCase());
                      }).length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-6 text-slate-500 text-xs italic">
                            No se encontraron cotizaciones registradas para los términos de búsqueda indicados.
                          </td>
                            <td className="border border-slate-200 px-3 py-1.5 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Vista detallada cargada'); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Ver">
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Modo edición activado'); }} className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Editar">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Registro eliminado'); }} className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={(e) => { e.preventDefault(); toast.success('Exportando a PDF...'); }} className="p-1 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors" title="Exportar a PDF">
                                  <FileDown className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* IMMERSIVE QUOTATION PREVIEW MODAL & ELECTRONIC DIGITAL SIGNATURE SYSTEM */}
              {selectedCotizacion && (
                  <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-start justify-center overflow-y-auto p-4 md:p-8">
                    <div className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-fade-in text-xs animate-scale-up">
                      
                      {/* Modal Bar Controllers */}
                      <div className="bg-slate-100 p-4 border-b border-slate-200 flex justify-between items-center print:hidden text-xs">
                        <h3 className="font-display font-extrabold text-slate-900 uppercase flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-rose-600" />
                          Visor Transaccional de Cotiza (Formato Imagen Comercial)
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              const originalTitle = document.title;
                              document.title = "Tapasel";
                              window.print();
                              document.title = originalTitle;
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded font-bold border-none cursor-pointer flex items-center gap-1 text-[11px]"
                          >
                            <PrinterCheck className="w-3.5 h-3.5" />
                            Imprimir PDF
                          </button>
                          <button 
                            type="button" 
                            onClick={() => {
                              setSelectedCotizacion(null);
                              setShowSignaturePad(null);
                            }}
                            className="text-xs bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 font-bold"
                          >
                            Cerrar ✕
                          </button>
                        </div>
                      </div>

                      {/* Official PDF Document Body (Replicates Image 2 Template details) */}
                      <div className="p-8 md:p-12 space-y-6 print:p-0 select-none print:shadow-none font-sans min-h-[1100px] bg-white text-[11.5px] leading-relaxed relative">
                        
                        {/* Decorative watermark / subtle grid or print tag */}
                        <div className="absolute top-2 right-4 text-[9px] font-mono text-slate-350 uppercase select-none print:hidden">
                          Documento Digital Seguro Verificado por Tapasel ERP
                        </div>

                        {/* Top Letterhead info block */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 p-4 rounded-lg bg-slate-50/50">
                          
                          {/* Left Panel: Client meta details */}
                          <div className="space-y-1">
                            <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px] mb-1">Datos De Obra / Cliente</p>
                            <div>
                              <span className="font-semibold text-slate-500">Señor (es):</span>{' '}
                              <span className="font-bold text-slate-800 uppercase">{selectedCotizacion.clienteNombre}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Empresa:</span>{' '}
                              <span className="font-bold text-slate-700 uppercase">{selectedCotizacion.empresa}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Ingeniero:</span>{' '}
                              <span className="font-medium text-slate-800">{selectedCotizacion.ingeniero}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Referencia:</span>{' '}
                              <span className="font-bold text-brand-primary uppercase">{selectedCotizacion.referenciaObra}</span>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-500">Dirección:</span>{' '}
                              <span className="text-slate-700 font-medium">{selectedCotizacion.direccion}</span>
                            </div>
                          </div>

                          {/* Right Panel: Co head header */}
                          <div className="text-right flex flex-col justify-between items-end">
                            <div className="space-y-1 flex flex-col items-end">
                              <TapaselLogo className="h-11 w-auto" isDarkTheme={false} />
                              <p className="text-[9px] text-slate-500 font-semibold uppercase font-mono">
                                Nit. 901.432.128-1 • Medellín
                              </p>
                              <p className="text-[10px] text-slate-600">
                                Dirección: Carrera 40 # 43- 50 Medellín<br />
                                Teléfono: (604) 4441802 - 310 517 62 63<br />
                                Correo: <span className="font-bold select-all text-slate-700">tapaselsas@gmail.com</span>
                              </p>
                            </div>
                            <div className="pt-2 border-t border-dashed border-slate-250">
                              <span className="text-[10px] font-mono text-slate-500 lowercase font-bold tracking-wide">
                                {translateDateToLongSpanish(selectedCotizacion.fecha)}
                              </span>
                            </div>
                          </div>

                        </div>

                        {/* Official corporate cover greeting */}
                        <div className="space-y-2 border-l-2 border-red-600 pl-4">
                          <p className="font-bold text-slate-900">Apreciados Señores:</p>
                          <p className="text-slate-600 text-justify text-[11px]">
                            Mediante el presente documento nos permitimos presentar a ustedes la propuesta comercial y técnica para el suministro y fabricación de tapas de cámaras de inspección, transformadores u obra metálica en referencia, alineada con las más estrictas tolerancias y estándares de niquelado / galvanizados.
                          </p>
                        </div>

                        {/* Central Products Grid Table (Image 2 Sheet Format) */}
                        <div className="space-y-2">
                          <div className="bg-slate-900 text-white font-display uppercase tracking-wider p-2 px-3 text-[10px] font-bold rounded-t flex justify-between">
                            <span>Tabla Oficial de Productos y Suministros</span>
                            <span className="font-mono text-[9px]">{selectedCotizacion.cotizacionNo}</span>
                          </div>

                          <table className="w-full text-left text-[11.5px] border-collapse border border-slate-300">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-300 font-mono text-[9.5px] text-slate-550 font-bold uppercase">
                                <th className="p-2 border-r border-slate-300 text-center w-12">Item</th>
                                <th className="p-2 border-r border-slate-300 w-24">Referencia</th>
                                <th className="p-2 border-r border-slate-300">Descripción General de Productos</th>
                                <th className="p-2 border-r border-slate-300 text-center w-14">Un.</th>
                                <th className="p-2 border-r border-slate-300 text-center w-14">Cant.</th>
                                <th className="p-2 border-r border-slate-300 text-right w-28">Val. Unitario</th>
                                <th className="p-2 text-right w-32">Val. Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {selectedCotizacion.items.map((it: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-500">{it.itemNo || idx + 1}</td>
                                  <td className="p-2.5 border-r border-slate-200 font-mono text-slate-600">{it.referencia}</td>
                                  <td className="p-2.5 border-r border-slate-200 font-semibold text-slate-800 leading-normal">{it.descripcion}</td>
                                  <td className="p-2.5 border-r border-slate-200 text-center font-mono text-slate-600 uppercase">{it.unidad}</td>
                                  <td className="p-2.5 border-r border-slate-200 text-center font-mono font-bold text-slate-800">{it.cantidad}</td>
                                  <td className="p-2.5 border-r border-slate-200 text-right font-mono">{formatCurrency(it.valorUnitario)}</td>
                                  <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatCurrency(it.valorTotal)}</td>
                                </tr>
                              ))}
                              
                              {/* Empty item safe buffer */}
                              {(!selectedCotizacion.items || selectedCotizacion.items.length === 0) && (
                                <tr>
                                  <td colSpan={7} className="text-center py-6 text-slate-400 italic">No hay productos agregados en el documento.</td>
                                </tr>
                              )}

                              {/* Math columns matching Image 2 totals table align */}
                              <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold font-mono">
                                <td colSpan={5} className="p-2.5 border-r border-slate-300 text-right text-[10px] uppercase text-slate-500">Monto Subtotal:</td>
                                <td colSpan={2} className="p-2.5 text-right text-slate-900 font-mono">{formatCurrency(selectedCotizacion.subtotal)}</td>
                              </tr>
                              <tr className="bg-slate-50 font-bold font-mono">
                                <td colSpan={5} className="p-2.5 border-r border-slate-300 text-right text-[10px] uppercase text-slate-500">IVA Aplicable (19%):</td>
                                <td colSpan={2} className="p-2.5 text-right text-teal-650 font-mono">{formatCurrency(selectedCotizacion.iva)}</td>
                              </tr>
                              <tr className="bg-slate-100 font-bold font-mono text-xs border-t border-slate-300">
                                <td colSpan={5} className="p-2.5 border-r border-slate-300 text-right text-[10px] uppercase text-slate-800 tracking-wider">Valor Comercial Neto (COP):</td>
                                <td colSpan={2} className="p-2.5 text-right text-brand-primary font-mono text-[12px]">{formatCurrency(selectedCotizacion.total)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Commercial Terms description */}
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded text-[10px] text-slate-500 leading-snug space-y-1">
                          <p className="font-bold text-slate-700">Términos Especiales y Notas Comerciales:</p>
                          <ul className="list-disc pl-4 space-y-0.5">
                            <li><strong>Forma de pago:</strong> Anticipo del 50% para firma de orden de producción, saldo contra entrega o despacho.</li>
                            <li><strong>Tiempo de entrega:</strong> 15 a 20 días hábiles de manufactura a partir de la confirmación técnica.</li>
                            <li><strong>Garantía:</strong> Cobertura de 12 meses por defectos estructurales o de soldadura de planta.</li>
                          </ul>
                        </div>

                        {/* CORPORATE DIGITAL SIGNATURE CORE SECTION */}
                        <div className="space-y-4 pt-6 border-t border-slate-200">
                          <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2 text-center">
                            Aceptación del Presupuesto y Registro de Firmas Digitalizados (Tratamiento Seguro de Datos)
                          </h4>

                          <div className="grid grid-cols-2 gap-8 text-center pt-2">
                            
                            {/* Left Box: Representative Signature */}
                            <div className="space-y-2 flex flex-col justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                              
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
                                Firma Representante Tapasel (Ing.)
                              </span>
                              
                              <div className="h-20 flex items-center justify-center w-full relative">
                                {selectedCotizacion.firmaDigitalRepresentante ? (
                                  selectedCotizacion.firmaDigitalRepresentante.startsWith('data:') ? (
                                    <div className="relative group">
                                      <img 
                                        src={selectedCotizacion.firmaDigitalRepresentante} 
                                        alt="Firma Andrés" 
                                        className="h-16 object-contain pointer-events-none filter drop-shadow-sm"
                                        referrerPolicy="no-referrer"
                                      />
                                      {/* Cert stamp */}
                                      <div className="absolute -bottom-1 -right-2 font-mono text-[7px] bg-green-100 text-green-700 border border-green-200 px-1 rounded uppercase tracking-widest select-none">
                                        CERTIFICADO 🛡️
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="text-center font-serif text-sm italic font-extrabold text-slate-800 border-none select-none select-handwriting uppercase tracking-wider">
                                      {selectedCotizacion.firmaDigitalRepresentante}
                                      <div className="text-[8px] font-mono text-slate-400 not-italic block uppercase">Digitalizado Autorizado</div>
                                    </div>
                                  )
                                ) : (
                                  <span className="text-[10px] text-slate-400 italic">Firma del Director de planta ausente</span>
                                )}
                              </div>

                              <div className="w-full border-t border-slate-350 pt-2 text-[10px] text-slate-600">
                                <p className="font-bold uppercase text-slate-700">{selectedCotizacion.firmaDigitalRepresentante || 'Andrés Delgado'}</p>
                                <p className="text-[9px] text-slate-400 font-mono uppercase font-bold">Gerente de Ingeniería • Tapasel</p>
                                
                                {/* Print action drawer to draw */}
                                {!selectedCotizacion.firmaDigitalRepresentante && (
                                  <button
                                    type="button"
                                    onClick={() => setShowSignaturePad('representante')}
                                    className="mt-2 px-3 py-1 bg-slate-900 text-white rounded text-[10px] font-bold border-none cursor-pointer flex items-center gap-1 mx-auto"
                                  >
                                    🔒 Estampar Firma
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Right Box: Customer Acceptance Signature */}
                            <div className="space-y-2 flex flex-col justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                              
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest block">
                                Firma Autorizada Cliente / Aceptación
                              </span>
                              
                              <div className="h-20 flex items-center justify-center w-full relative">
                                {selectedCotizacion.firmaDigitalCliente ? (
                                  <div className="relative group">
                                    <img 
                                      src={selectedCotizacion.firmaDigitalCliente} 
                                      alt="Firma Cliente" 
                                      className="h-16 object-contain pointer-events-none filter drop-shadow-sm"
                                      referrerPolicy="no-referrer"
                                    />
                                    {/* Cert stamp */}
                                    <div className="absolute -bottom-1 -right-2 font-mono text-[7px] bg-green-100 text-green-700 border border-green-200 px-1 rounded uppercase tracking-widest select-none">
                                      AUTORIZADO 🖊️
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-center">
                                    <span className="text-[10px] text-rose-600 block font-bold uppercase animate-pulse">
                                      Pendiente de Firma para Despacho
                                    </span>
                                    <div className="text-[8px] font-mono text-slate-450 mt-1 block">Aceptación y Tratamiento Jurídico Ley 1581</div>
                                  </div>
                                )}
                              </div>

                              <div className="w-full border-t border-slate-350 pt-2 text-[10px] text-slate-600">
                                <p className="font-bold uppercase text-slate-705 text-slate-800">{selectedCotizacion.firmaDigitalCliente ? selectedCotizacion.clienteNombre : 'Representante Compras Obra'}</p>
                                <p className="text-[9px] text-slate-405 text-slate-400 font-mono uppercase font-bold">Cliente / Aceptación Contrato</p>
                                
                                {/* Trigger drawing canvas */}
                                <button
                                  type="button"
                                  onClick={() => setShowSignaturePad('cliente')}
                                  className="mt-2 px-3 py-1 bg-brand-primary hover:bg-brand-primary-container text-white rounded text-[10px] font-bold border-none cursor-pointer flex items-center gap-1 mx-auto"
                                >
                                  🖊️ Dibujar Firma Digital
                                </button>
                              </div>
                            </div>

                          </div>

                          {/* Conditional Signature Draw Pad Overlay */}
                          {showSignaturePad && (
                            <div className="mt-4 pt-4 border-t border-slate-200 print:hidden max-w-md mx-auto">
                              <SignaturePad
                                title={showSignaturePad === 'representante' ? 'Firma Tapasel Representante Técnico' : 'Firma de Aceptación Autorizada del Cliente'}
                                onCancel={() => setShowSignaturePad(null)}
                                onSave={(imgBase64) => {
                                  // Update the active item
                                  const updatedCot: CotizacionRecord = {
                                    ...selectedCotizacion,
                                    firmaDigitalRepresentante: showSignaturePad === 'representante' ? imgBase64 : selectedCotizacion.firmaDigitalRepresentante,
                                    firmaDigitalCliente: showSignaturePad === 'cliente' ? imgBase64 : selectedCotizacion.firmaDigitalCliente,
                                    fechaFirmaCliente: showSignaturePad === 'cliente' ? new Date().toISOString().split('T')[0] : selectedCotizacion.fechaFirmaCliente
                                  };
                                  if (onUpdateCotizacion) {
                                    onUpdateCotizacion(updatedCot);
                                  }
                                  setSelectedCotizacion(updatedCot);
                                  setShowSignaturePad(null);
                                  toast.success("¡Firma Electrónica estampada positivamente en el ERP!");
                                }}
                              />
                            </div>
                          )}

                        </div>

                      </div>

                      {/* Modal Bar Footer print blocker */}
                      <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end gap-2 print:hidden text-xs">
                        <button 
                          onClick={() => setSelectedCotizacion(null)}
                          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer border-none"
                        >
                          Cerrar Vista Comercial
                        </button>
                      </div>

                    </div>
                  </div>
                )}

            </div>
          )}

      {/* MODAL / PRINT VIEW OF THE CASH RECEIPT (RECIBO DE CAJA) - Image 3 Printable representation */}
      {printedReceiptData && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-slate-300 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-fade-in text-xs font-serif p-8 relative">
            
            {/* Stamp/Watermark */}
            <div className="absolute right-8 top-8 w-24 h-24 border-4 border-emerald-600/25 rounded-full flex items-center justify-center rotate-12 pointer-events-none">
              <span className="text-[10px] text-emerald-600/35 font-mono font-black text-center leading-none">
                PAGADO<br/>TAPASEL S.A.S
              </span>
            </div>

            {/* Official Title */}
            <div className="flex justify-between items-start border-b-2 border-black pb-4 mb-4">
              <div>
                <h1 className="text-xl font-bold font-sans uppercase tracking-wide text-slate-900">
                  TAPASEL S.A.S.
                </h1>
                <p className="font-mono text-[9px] text-slate-500 uppercase not-italic">
                  NIT: 900.245.882-1 • MEDELLÍN - COLOMBIA
                </p>
                <p className="font-sans text-[10px] text-slate-600">
                  Dirección Planta: Calle 29 Sur # 43-20
                </p>
              </div>
              <div className="text-right">
                <span className="bg-slate-100 px-3 py-1 text-md font-sans font-bold border border-slate-300 rounded block uppercase text-[12px]">
                  RECIBO DE CAJA
                </span>
                <span className="text-lg font-mono font-bold text-brand-primary tracking-tight block mt-1.5">
                  N° {printedReceiptData.numeral}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-y-3.5 text-xs text-slate-850">
              
              {/* Row 1 */}
              <div className="col-span-4 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Ciudad</span>
                <span className="font-sans text-xs">Medellín</span>
              </div>

              <div className="col-span-4 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Fecha</span>
                <span className="font-mono text-xs">{printedReceiptData.fecha}</span>
              </div>

              <div className="col-span-4 border-b border-slate-300 pb-1 bg-slate-50/50 pl-2">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block text-brand-primary">Valor Recibido</span>
                <span className="font-mono font-bold text-sm text-emerald-700">{formatCurrency(printedReceiptData.valor)}</span>
              </div>

              {/* Row 2 */}
              <div className="col-span-8 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Recibido de</span>
                <span className="font-sans font-bold text-xs text-slate-900">{printedReceiptData.cliente}</span>
              </div>

              <div className="col-span-4 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Cédula / NIT</span>
                <span className="font-mono text-xs">{printedReceiptData.cedula}</span>
              </div>

              {/* Row 3 */}
              <div className="col-span-12 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">La suma de (Letras)</span>
                <span className="font-sans font-bold text-[10px] text-slate-700 italic">*** {printedReceiptData.sumaDe} ***</span>
              </div>

              {/* Row 4 */}
              <div className="col-span-12 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Por concepto de</span>
                <span className="font-sans text-xs text-slate-800">{printedReceiptData.concepto}</span>
              </div>

              {/* Row 5 */}
              <div className="col-span-6 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Forma de pago</span>
                <span className="font-sans text-xs text-slate-800">{printedReceiptData.formaPago}</span>
              </div>

              <div className="col-span-6 border-b border-slate-300 pb-1">
                <span className="text-[10px] font-sans font-bold text-slate-500 uppercase tracking-widest block">Detalle de Cartera</span>
                <span className="font-sans text-xs text-slate-800">{printedReceiptData.detalle}</span>
              </div>

            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 mt-14 pt-4 border-t border-slate-100">
              <div className="space-y-1">
                <div className="h-10 border-b border-black"></div>
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">Firma del Cajero Recibidor</span>
                <span className="text-[9px] text-brand-primary font-mono">Auditoría Financiera Inteligente</span>
              </div>
              <div className="space-y-1">
                <div className="h-10 border-b border-black"></div>
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">Firma y Sello del Solicitante / Cliente</span>
              </div>
            </div>

            {/* Print action bottom overlay */}
            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end gap-3 font-sans print:hidden">
              <button
                onClick={() => setPrintedReceiptData(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg border-none cursor-pointer"
              >
                Cerrar Comprobante
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg border-none cursor-pointer flex items-center gap-1"
              >
                <PrinterCheck className="w-4 h-4" />
                <span>Imprimir Físico (PDF)</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LEDGER LOG DETAILED DIALOG MODAL */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-xl overflow-hidden shadow-2xl flex flex-col text-slate-800 animate-fade-in text-xs">
            <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-display font-semibold text-slate-900 text-xs uppercase flex items-center gap-1.5 font-bold">
                <Clock className="w-4 h-4 text-brand-primary" />
                Asiento Libro Diario del ERP
              </h3>
              <button 
                onClick={() => setSelectedTransaction(null)} 
                className="text-xs bg-transparent border-none cursor-pointer text-slate-400 hover:text-slate-600 font-bold font-mono"
              >
                Cerrar ✕
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg space-y-2">
                <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-400 block pb-1 border-b border-slate-250">
                  Concepto Contable
                </span>
                <span className="text-xs font-bold text-slate-900 block leading-snug">{selectedTransaction.descripcion}</span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Monto total de operación:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">{formatCurrency(selectedTransaction.monto)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tipo de transación:</span>
                  <span className={`font-mono font-bold ${selectedTransaction.tipo === 'Ingreso' ? 'text-emerald-700' : 'text-rose-600'}`}>{selectedTransaction.tipo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Fecha de Certificación:</span>
                  <span className="font-mono text-slate-700">{selectedTransaction.fecha}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Auditor Responsable:</span>
                  <span className="font-semibold text-slate-705 text-slate-700">{selectedTransaction.responsable}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded cursor-pointer border-none"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
}
