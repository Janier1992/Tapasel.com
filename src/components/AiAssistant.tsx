import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { Cliente, Transaccion, Empleado, Documento, Usuario } from '../types';

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  clientes: Cliente[];
  transacciones: Transaccion[];
  empleados: Empleado[];
  documentos: Documento[];
  currentUser: Usuario;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export default function AiAssistant({ 
  isOpen, 
  onClose, 
  clientes, 
  transacciones, 
  empleados, 
  documentos,
  currentUser
}: AiAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "¡Hola! Soy el **Agente Ejecutivo de TAPASEL FLOW AI**. Estoy conectado a la base de datos de TAPASEL SAS en Medellín en tiempo real.\n\nPuedo ayudarte a fiscalizar transacciones, analizar el rendimiento logístico, auditar personal y darte recomendaciones estratégicas basadas en nuestros datos reales.\n\n*Selecciona uno de los accesos rápidos corporativos abajo o escribe tu consulta.*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const predefinedQueries = [
    { label: "💳 Clientes con pagos pendientes", text: "¿Qué clientes tienen pagos pendientes?" },
    { label: "⚙️ Procesos con retrasos", text: "¿Qué procesos presentan retrasos?" },
    { label: "📁 Documentos faltantes", text: "¿Qué documentos faltan de cumplimiento?" },
    { label: "🔥 Indicadores en riesgo", text: "¿Qué indicadores están en riesgo operacional?" },
    { label: "💰 Flujo de caja actual", text: "¿Cuál es el flujo de caja actual?" },
    { label: "👥 Empleados con documentos vencidos", text: "¿Qué empleados tienen documentos vencidos para operar?" },
    { label: "⏱️ Área con más ausentismo", text: "¿Qué área presenta más ausentismo hoy?" },
    { label: "🚛 Proceso logístico lento", text: "¿Qué proceso es el más lento actualmente en planta?" },
  ];

  // Scroll to bottom when messages list updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);

    // Prepare complete state schema to feed into Gemini on the server side (respecting role-based restrictions)
    const dbState = {
      clientes: (currentUser?.rol === 'COO' || currentUser?.rol === 'RRHH') ? [] : clientes,
      transacciones: (currentUser?.rol === 'COO' || currentUser?.rol === 'RRHH') ? [] : transacciones,
      empleados: currentUser?.rol === 'CFO' ? [] : empleados,
      documentos: currentUser?.rol === 'CFO' 
        ? documentos.filter(d => d.departamento === 'Finanzas') 
        : documentos
    };

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: text,
          databaseState: dbState
        })
      });

      if (!response.ok) {
        throw new Error('La llamada al servidor falló.');
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        text: data.text || "No logré procesar una respuesta adecuada.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error: any) {
      console.error("Error consultando al agente:", error);
      
      const assistantMsg: Message = {
        id: `msg-${Date.now()}-ai-error`,
        sender: 'assistant',
        text: "🚨 **Error de conexión regional.** Hubo un problema comunicándome con la neurona Gemini. Por favor asegúrese de que el servidor local esté corriendo.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-full sm:w-[450px] max-w-full bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col pt-4">
      {/* Drawer Header */}
      <div className="px-6 pb-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-900">Agente IA Ejecutivo</h3>
            <span className="text-[10px] text-emerald-600 font-mono tracking-wider flex items-center gap-1 uppercase font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              ORQUESTANDO FLUJOS
            </span>
          </div>
        </div>
        <button 
          onClick={onClose} 
          className="p-1 px-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-all border-none bg-transparent cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Scrollable Area */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 bg-slate-50">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex flex-col max-w-[88%] ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}
          >
            <div 
              className={`p-3.5 rounded-xl text-sm leading-relaxed ${
                msg.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none shadow-sm' 
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none whitespace-pre-line shadow-sm'
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-1 px-1">
              {msg.timestamp}
            </span>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-blue-600 max-w-[85%] bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-xs font-mono text-slate-600">Consolidando libro mayor y analítica...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast-Actions Grid */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
        <label className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-2 px-1 font-bold">
          Preguntas Rápidas de Auditoría:
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {predefinedQueries.map((query, index) => (
            <button
              key={index}
              onClick={() => handleSendMessage(query.text)}
              disabled={loading}
              className="text-left py-1.5 px-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-[11px] font-medium text-blue-600 hover:text-blue-800 rounded border border-slate-200 shadow-sm truncate transition-colors cursor-pointer"
              title={query.text}
            >
              {query.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input Message Form */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(inputVal); }}
          className="flex gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2.5 pl-3 pr-10 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none focus:border-blue-500 transition-all pr-10"
              placeholder="Pregunta sobre finanzas, ausentes o cartera..."
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              <Sparkles className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white disabled:opacity-50 disabled:scale-100 rounded-lg transition-all border-none cursor-pointer flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
