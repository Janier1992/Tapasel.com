import React, { useState, useEffect } from 'react';
import { 
  Building, 
  ShieldAlert, 
  Users, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Check, 
  Save, 
  Key, 
  BellRing,
  Globe,
  Database,
  Cloud,
  Percent,
  Timer,
  TrendingUp,
  Sliders,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType, doc, getDoc, setDoc } from '../services/backendClient';
import { Usuario } from '../types';

interface ConfiguracionTabProps {
  currentUser: Usuario;
  appendLog: (agente: any, detail: string, nivel: any) => void;
}

export default function ConfiguracionTab({ currentUser, appendLog }: ConfiguracionTabProps) {
  // ERP Simulation States
  const [empresaNombre, setEmpresaNombre] = useState('Tapasel S.A.S.');
  const [nit, setNit] = useState('901.442.108-3');
  const [autoAudit, setAutoAudit] = useState(true);
  const [aiRiskThreshold, setAiRiskThreshold] = useState('75');
  const [notifSound, setNotifSound] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  // Firestore Customizable Alert Threshold States
  const [porcentajeAusentismoMax, setPorcentajeAusentismoMax] = useState(8);
  const [porcentajeMoraMax, setPorcentajeMoraMax] = useState(15);
  const [porcentajeRotacionMax, setPorcentajeRotacionMax] = useState(12);
  const [eficienciaProduccionMin, setEficienciaProduccionMin] = useState(80);
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isCloudStorage, setIsCloudStorage] = useState(false);

  // Load custom thresholds from Firestore (or LocalStorage backup)
  useEffect(() => {
    async function loadAlertThresholds() {
      const user = auth.currentUser;
      if (user) {
        setIsLoadingThresholds(true);
        setIsCloudStorage(true);
        try {
          const docRef = doc(db, 'configuraciones', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setPorcentajeAusentismoMax(data.porcentajeAusentismoMax ?? 8);
            setPorcentajeMoraMax(data.porcentajeMoraMax ?? 15);
            setPorcentajeRotacionMax(data.porcentajeRotacionMax ?? 12);
            setEficienciaProduccionMin(data.eficienciaProduccionMin ?? 80);
          }
        } catch (error) {
          console.error("Error loading thresholds from Firestore:", error);
          // Fallback to localStorage if Firestore fails (permissions, active session config, etc.)
          const local = localStorage.getItem(`tapasel_thresholds_${currentUser.id}`);
          if (local) {
            try {
              const data = JSON.parse(local);
              setPorcentajeAusentismoMax(data.porcentajeAusentismoMax ?? 8);
              setPorcentajeMoraMax(data.porcentajeMoraMax ?? 15);
              setPorcentajeRotacionMax(data.porcentajeRotacionMax ?? 12);
              setEficienciaProduccionMin(data.eficienciaProduccionMin ?? 80);
            } catch (_) {}
          }
        } finally {
          setIsLoadingThresholds(false);
        }
      } else {
        // Fallback or local dev session
        setIsCloudStorage(false);
        const local = localStorage.getItem(`tapasel_thresholds_${currentUser.id}`);
        if (local) {
          try {
            const data = JSON.parse(local);
            setPorcentajeAusentismoMax(data.porcentajeAusentismoMax ?? 8);
            setPorcentajeMoraMax(data.porcentajeMoraMax ?? 15);
            setPorcentajeRotacionMax(data.porcentajeRotacionMax ?? 12);
            setEficienciaProduccionMin(data.eficienciaProduccionMin ?? 80);
          } catch (_) {}
        }
      }
    }
    loadAlertThresholds();
  }, [currentUser.id]);

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingThresholds('saving');
    
    const payload = {
      id: auth.currentUser?.uid || currentUser.id,
      porcentajeAusentismoMax: Number(porcentajeAusentismoMax),
      porcentajeMoraMax: Number(porcentajeMoraMax),
      porcentajeRotacionMax: Number(porcentajeRotacionMax),
      eficienciaProduccionMin: Number(eficienciaProduccionMin),
    };

    // Backup to localStorage
    localStorage.setItem(`tapasel_thresholds_${currentUser.id}`, JSON.stringify(payload));

    const user = auth.currentUser;
    if (user) {
      try {
        await setDoc(doc(db, 'configuraciones', user.uid), payload);
        setSavingThresholds('saved');
        appendLog(
          "Agente de Auditoría",
          `Umbrales de alerta personalizados actualizados en Firestore por ${currentUser.nombre} - Ausentismo: ${porcentajeAusentismoMax}%, Mora: ${porcentajeMoraMax}%, Rotación: ${porcentajeRotacionMax}%, Eficiencia Mín: ${eficienciaProduccionMin}%.`,
          "Éxito"
        );
      } catch (error) {
        console.error("Error saving thresholds to Firestore:", error);
        setSavingThresholds('error');
        try {
          handleFirestoreError(error, OperationType.WRITE, `configuraciones/${user.uid}`);
        } catch (_) {}
      }
    } else {
      // Local demo fallback
      setTimeout(() => {
        setSavingThresholds('saved');
        appendLog(
          "Agente de Auditoría",
          `Umbrales de alerta personalizados actualizados localmente por ${currentUser.nombre} - Ausentismo: ${porcentajeAusentismoMax}%, Mora: ${porcentajeMoraMax}%, Rotación: ${porcentajeRotacionMax}%, Eficiencia Mín: ${eficienciaProduccionMin}%.`,
          "Éxito"
        );
      }, 500);
    }

    setTimeout(() => {
      setSavingThresholds('idle');
    }, 3000);
  };

  const handleSaveConfigs = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    appendLog(
      "Agente de Auditoría",
      `Configuración global modificada por el usuario ${currentUser.nombre}: Parámetros de umbral de riesgo IA ajustado al ${aiRiskThreshold}% y auto-auditoría fijada en [${autoAudit ? 'ACTIVO' : 'INACTIVO'}].`,
      "Éxito"
    );
    setTimeout(() => {
      setIsSaved(false);
    }, 3000);
  };

  const staffRolesInfo = [
    { rol: 'ADMIN', modulo: 'Acceso Total', desc: 'Acceso irrestricto a todos los módulos: Finanzas, RR.HH., Documentos, Producción, Configuraciones.' },
    { rol: 'CFO', modulo: 'Finanzas, Documentos', desc: 'Supervisión de balances, cobros y egresos.' },
    { rol: 'RRHH', modulo: 'RR.HH., Documentos, Config', desc: 'Gestión de personal, asistencia hoy, contratos y certificados.' },
    { rol: 'COO', modulo: 'Producción, Documentos, Config', desc: 'Visualización de contratos operativos, producción de planta y documentos.' }
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Module Title and Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 font-mono font-bold px-2.5 py-1 rounded-full uppercase">
            Módulo de Administración
          </span>
          <h2 className="font-display font-bold text-2xl text-slate-900 mt-2">Configuraciones del Sistema</h2>
          <p className="text-slate-500 text-xs mt-1">
            Personalice los parámetros globales de la compañía, limites de auditorías autónomas del Agente Ejecutivo y consulte roles de acceso.
          </p>
        </div>
      </div>

      <form onSubmit={handleSaveConfigs} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: General and AI Controls */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Section: Company Profile */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Building className="w-4.5 h-4.5 text-blue-600" />
              <h3 className="font-display font-semibold text-slate-800 text-sm">Perfil de la Compañía</h3>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Razón Social</label>
                <input 
                  type="text" 
                  value={empresaNombre}
                  onChange={(e) => setEmpresaNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">NIT (Identificación Tributaria Colombiana)</label>
                <input 
                  type="text" 
                  value={nit}
                  onChange={(e) => setNit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">Moneda Oficial de Reportes</label>
                <select className="w-full bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-blue-500">
                  <option value="COP">COP ($) - Peso Colombiano</option>
                  <option value="USD">USD ($) - Dólar Estadounidense</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600">País de Operación Principal</label>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg p-2.5">
                  <Globe className="w-4 h-4 text-slate-400" />
                  <span>Colombia (Sedes: Medellín y Bogotá)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Custom Alert Thresholds (Firestore Secured) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="font-display font-semibold text-slate-800 text-sm">Umbrales de Alertas Personalizados</h3>
              </div>
              
              <div className="flex items-center gap-1.5">
                {isCloudStorage ? (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                    <Cloud className="w-3.5 h-3.5" /> FIRESTORE NUBE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-mono text-[9px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded border border-amber-200">
                    <Database className="w-3.5 h-3.5" /> LOCAL STORAGE
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-slate-500 text-xs leading-relaxed">
                Configure límites operativos personalizados. Cuando los indicadores del ERP superen o desciendan de estos valores, el Agente Inteligente generará alertas automáticas destacadas en los módulos correspondientes.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Threshold 1: Absentismo max */}
                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-750 text-slate-705 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-slate-500" />
                      Ausentismo Máximo
                    </label>
                    <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                      {porcentajeAusentismoMax}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="30" 
                    value={porcentajeAusentismoMax}
                    onChange={(e) => setPorcentajeAusentismoMax(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Límite máximo de ausentismo permitido antes de activar alerta de RR.HH.
                  </span>
                </div>

                {/* Threshold 2: Mora Max */}
                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-750 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-slate-500" />
                      Mora Máxima de Cartera
                    </label>
                    <span className="font-mono text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                      {porcentajeMoraMax}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="5" 
                    max="50" 
                    value={porcentajeMoraMax}
                    onChange={(e) => setPorcentajeMoraMax(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Umbral para facturas vencidas sobre la cartera total en módulo Financiero.
                  </span>
                </div>

                {/* Threshold 3: Rotacion max */}
                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-750 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-slate-500" />
                      Rotación de Personal Máxima
                    </label>
                    <span className="font-mono text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                      {porcentajeRotacionMax}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="40" 
                    value={porcentajeRotacionMax}
                    onChange={(e) => setPorcentajeRotacionMax(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Tasa de desvinculación laboral límite sugerida para gestión táctica.
                  </span>
                </div>

                {/* Threshold 4: Eficiencia Produccion Min */}
                <div className="space-y-2 p-4 bg-slate-50/50 rounded-xl border border-slate-150">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-750 flex items-center gap-1.5">
                      <Timer className="w-4 h-4 text-slate-500" />
                      Eficiencia de Producción Mínima
                    </label>
                    <span className="font-mono text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      {eficienciaProduccionMin}%
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="50" 
                    max="98" 
                    value={eficienciaProduccionMin}
                    onChange={(e) => setEficienciaProduccionMin(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400 block font-sans">
                    Límite mínimo de rendimiento en planta antes de despacho de alertas de calidad.
                  </span>
                </div>

              </div>

              {isLoadingThresholds && (
                <div className="text-center text-xs text-slate-500 font-mono py-2 animate-pulse">
                  Unificando umbrales con Firestore...
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="button"
                onClick={handleSaveThresholds}
                disabled={savingThresholds === 'saving'}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer border-none shadow-sm shadow-blue-100"
              >
                {savingThresholds === 'saving' && (
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent inline-block" />
                )}
                {savingThresholds === 'saved' && <FileCheck className="w-4.5 h-4.5" />}
                {savingThresholds === 'error' && <AlertTriangle className="w-4.5 h-4.5" />}
                {savingThresholds === 'idle' && <Save className="w-4.5 h-4.5" />}
                
                <span>
                  {savingThresholds === 'saving' ? 'Guardando...' : 
                   savingThresholds === 'saved' ? 'Guardado en Firestore' : 
                   savingThresholds === 'error' ? 'Error al Guardar' : 'Guardar Umbrales'}
                </span>
              </button>
            </div>
          </div>

          {/* Section: Orquestación IA & Forensic Auditing Config */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="font-display font-semibold text-slate-800 text-sm">Control de Agentes & Automatización IA</h3>
              </div>
              <span className="font-mono text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                MODEL: GEMINI-3.5
              </span>
            </div>
            
            <div className="p-6 space-y-6">
              
              {/* Toggle 1 */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-800 block">Detección de Riesgo y Cartera en Segundo Plano</span>
                  <p className="text-slate-500 text-xs">
                    Permite que el Agente de Finanzas y Auditoría revisen los balances conciliados cada hora para identificar oportunamente faltantes y deudas.
                  </p>
                </div>
                <button 
                  type="button"
                  onClick={() => setAutoAudit(!autoAudit)}
                  className="text-blue-600 hover:text-blue-700 bg-transparent border-none cursor-pointer p-1"
                >
                  {autoAudit ? (
                    <ToggleRight className="w-10 h-10 text-blue-600" />
                  ) : (
                    <ToggleLeft className="w-10 h-10 text-slate-300" />
                  )}
                </button>
              </div>

              <hr className="border-slate-250 border-slate-200" />

              {/* Range Input for risk threshold */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Umbral de Sensibilidad para Alertas de Fraude/Mora</span>
                  <span className="font-mono font-bold bg-blue-50 text-blue-750 px-2 py-0.5 rounded border border-blue-200 text-blue-750">
                    {aiRiskThreshold}% Certeza
                  </span>
                </div>
                <input 
                  type="range" 
                  min="50" 
                  max="95" 
                  step="5"
                  value={aiRiskThreshold}
                  onChange={(e) => setAiRiskThreshold(e.target.value)}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>50% (Sugerente / Ruido Alto)</span>
                  <span>75% (Balanceado)</span>
                  <span>95% (Crítico / Solo Seguro)</span>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Section: Notification system preferences */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-850 text-slate-800 flex items-center gap-1.5">
                  <BellRing className="w-4 h-4 text-slate-500" /> Canal de Alertas Prioritarias
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifSound}
                      onChange={() => setNotifSound(!notifSound)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" 
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Notificaciones Sonoras</span>
                      <span className="text-[10px] text-slate-500">Alertas audibles sobre nómina en proceso</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={notifEmail}
                      onChange={() => setNotifEmail(!notifEmail)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" 
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">Correo IA Resumen Diario</span>
                      <span className="text-[10px] text-slate-500">Recibe boletines consolidados por agente</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
              <button 
                type="submit" 
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer border-none shadow-sm shadow-blue-100"
              >
                {isSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSaved ? 'Configuración Guardada' : 'Guardar Ajustes'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Security Information & Active User */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Inside look at currentUser credentials */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Key className="w-4.5 h-4.5 text-blue-600" /> Sesión ERP Activa
            </h3>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg border border-blue-400">
                {currentUser.avatarInitials}
              </div>
              <div>
                <span className="font-display font-bold text-slate-900 block">{currentUser.nombre}</span>
                <span className="text-slate-400 font-mono text-[10px]">{currentUser.email}</span>
              </div>
            </div>

            <div className="space-y-2 mt-4 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Rol Operativo:</span>
                <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{currentUser.rol}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cargo Corporativo:</span>
                <span className="font-semibold text-slate-700 text-right">{currentUser.cargo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Estado de Cuenta:</span>
                <span className="font-bold text-emerald-600">Verificado</span>
              </div>
            </div>
          </div>

          {/* Section: Roles & Permisos corporativos */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-display font-bold text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldAlert className="w-4.5 h-4.5 text-blue-600" /> Esquema de Privacidad
            </h3>
            
            <p className="text-xs text-slate-550 leading-relaxed text-slate-500">
              De acuerdo con las directrices de administración de la compañía, las áreas correspondientes poseen accesos segmentados para mitigar la fuga de información clasificada o modificaciones de carteras.
            </p>

            <div className="space-y-3 pt-2">
              {staffRolesInfo.map((info) => (
                <div key={info.rol} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-900">Rol: {info.rol}</span>
                    <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                      {info.modulo}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">{info.desc}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </form>
    </div>
  );
}
