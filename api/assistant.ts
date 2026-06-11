import { GoogleGenAI } from "@google/genai";

// Fallback logic for offline / no-key simulation
function responderAnalisisSimulado(prompt: string, state: any): string {
  const p = prompt.toLowerCase();
  
  if ((p.includes("clientes") && p.includes("pendientes")) || p.includes("pagos pendientes") || p.includes("cartera")) {
    return `### 📊 Reporte Ejecutivo de Cartera y Clientes con Pagos Pendientes:
De acuerdo con la base de datos interna, identificamos **3 clientes** en estado de **Mora** con montos pendientes significativos:

1. **Apex Manufacturing (ID: C-1200):** Debe **$42.5M COP**. Último pago registrado el 30 de marzo. Plazo vencido hace 14 días.
2. **Industrias Metálicas del Aburrá (ID: C-5582):** Debe **$15.4M COP**. Último pago el 5 de abril.
3. **Titan Corp (ID: C-4410):** Debe **$12.8M COP**. Último de pago el 12 de abril.

**Recomendación:** Activar el flujo de cobranza automatizado del *Agente de Finanzas* para notificar a los contactos de facturación inmediatamente.`;
  }

  if ((p.includes("proceso") && p.includes("retraso")) || p.includes("retrasos") || p.includes(" lento")) {
    return `### ⚠️ Alerta de Eficiencia - Procesos y Cuellos de Botella:
El *Agente Analítico* reporta un retraso crítico:

- **Línea Logística de Acero (Área B - Medellín):** Cuello de botella detectado en el transportador principal. Reduce la eficiencia del área al **82%** temporalmente.
- **Auditorías de Suministros:** 2 compras de materia prima están demoradas por confirmación del director financiero.

**Acción Propuesta:** Re-enrutar la lógica automatizada de despacho o aprobar la orden de compra pendiente del proveedor de acero para liberar el material en 24h.`;
  }

  if ((p.includes("documentos") && p.includes("faltan")) || p.includes("falta") || p.includes("faltantes")) {
    return `### 📁 Auditoría Documental - Archivos Faltantes o Críticos:
El *Agente de Documentos* detecta las siguientes brechas de cumplimiento legal:

1. **Estudio de Impacto Ambiental 2023 (Depto: Operaciones):** Crítico. Plazo de entrega expira en **3 días**.
2. **Renovación de Seguros Laborales (Depto: RR.HH.):** Plazo de radicación expira en **5 días**.
3. **Contrato_Laboral_Estandar_v2.pdf (David Vance):** Firma digital del empleado David Vance sigue pendiente.

**Sugerencia:** Ejecutar la alerta automática desde el panel para solicitar la firma digital y cargar los documentos requeridos.`;
  }

  if (p.includes("indicadores") && p.includes("riesgo")) {
    return `### 🔥 Indicadores de Riesgo Operacional (TAPASEL SAS):
Monitoreo continuo de KPIs:

1. **Tasa de Cartera Vencida (Riesgo Alto):** La deuda morosa acumulada alcanza **$70.7M COP**, liderado por *Apex Manufacturing*.
2. **Cumplimiento Laboral (Riesgo Medio):** 2 empleados activos poseen expedientes incompletos o certificados médicos vencidos en RR.HH.
3. **Asistencia (Riesgo Bajo):** Anomalía puntual en el Área de Ingeniería Física por inasistencia sin justificar de *Liam Foster* hoy.

*Todos los agentes automatizados están ejecutando planes de mitigación en tiempo real.*`;
  }

  if (p.includes("flujo de caja") || p.includes("caja actual") || p.includes("ingresos")) {
    return `### 💰 Análisis de Flujo de Caja Actual (TAPASEL SAS):
El balance actual reporta una salud sólida pero presionada por cartera:

- **Ingresos Totales del Mes:** **$1.24M USD** (+12.4% vs mes anterior).
- **Proyección de Flujo (Q4):** Se estima un excedente de **$1.42M USD** si se concilian las mora pendientes.
- **Último Ingreso Cargado:** **$35.000.000 COP** correspondiente a *Constructora Conconcreto* (Factura #1021) hoy.
- **Egresos Recientes:** Alquiler de Oficina Corporativa ($15M COP) e Infraestructura AWS ($4.25M COP).`;
  }

  if (p.includes("empleados") && p.includes("vencidos")) {
    return `### 👥 Empleados con Documentación Vencida:
Al analizar el registro, los siguientes colaboradores no cumplen los requisitos actuales para operar:

- **Liam Foster (Técnico Logístico):** Certificado de Trabajo en Alturas vencido.
- **Sophia Ramirez (Contadora):** Renovación de tarjeta profesional pendiente.

**Recomendación:** Deshabilitar permisos de acceso a planta para Foster hasta que cargue la renovación validada.`;
  }

  if (p.includes("ausentismo") || p.includes("ausente")) {
    return `### ⏱️ Reporte de Asistencia Diaria:
Hoy se registra una tasa de asistencia del **94%**.

**Área de Riesgo:** Logística y Bodega presentan el nivel más alto de inasistencias. 
*Caso crítico:* Liam Foster no registró "check-in" hoy ni reportó novedad médica al sistema.`;
  }

  return `Entendido. Estoy conectado como Agente Ejecutivo a la matriz de datos de **TAPASEL SAS**. 
Actualmente monitoreamos transacciones, flujo de caja, RR.HH., producción y cumplimiento documental en tiempo real. 

Por favor, realiza una pregunta específica sobre retrasos, cobros o indicadores de riesgo para ejecutar una auditoría.`;
}

export default async function handler(req: any, res: any) {
  // Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Método no permitido. Utilice POST." });
  }

  try {
    const { prompt, databaseState } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: "Falta el mensaje (prompt) en la solicitud." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
      console.warn("GEMINI_API_KEY no está configurado. Retornando respuesta analítica simulada.");
      return res.json({
        text: responderAnalisisSimulado(prompt, databaseState),
        simulated: true
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });

    const dbStr = databaseState ? JSON.stringify(databaseState, null, 2) : "No hay datos activos provistos.";
    
    const systemInstruction = `
Eres el "Agente Ejecutivo IA" de la plataforma TAPASEL FLOW AI.
TAPASEL SAS es una empresa industrial metalmecánica ubicada en Medellín, Colombia, dedicada al diseño, fabricación y automatización de tapas, empaques y soluciones industriales.

Tu objetivo es actuar como un ERP inteligente, consultor financiero, gestor de talento humano (RR.HH.) y auditor de procesos.
Debes responder de forma ejecutiva, formal, muy clara, directa y altamente accionable, en español de Colombia/Latinoamérica.

Se te proporcionará el estado actual en tiempo real de la base de datos empresarial del ERP. Utilízala de forma explícita para responder con cifras concretas, nombres de clientes, empleados o rutas con problemas. No inventes datos fuera de la base de datos provista si contradicen los actuales.

Aquí está la Base de Datos actual del Sistema en formato JSON:
${dbStr}

Al responder:
1. Responde de forma resumida, ejecutiva y estructurada (usa viñetas o negritas para resaltar puntos clave).
2. Sé directo y honesto. Si detectas alertas o retrasos, indícalos con urgencia.
3. El usuario puede pedirte cualquiera de las siguientes preguntas críticas; responde con precisión quirúrgica basada en el JSON:
   - ¿Qué clientes tienen pagos pendientes? -> Identifica los de estado 'Mora' o carteraPendiente > 0. Menciona montos.
   - ¿Qué procesos presentan retrasos? -> Identifica transacciones o licencias pendientes, o comentarios de auditorías.
   - ¿Qué documentos faltan? -> Revisa los documentos faltantes o en estado 'Pendiente Verificación'.
   - ¿Qué indicadores están en riesgo? -> Comenta sobre cartera en mora, ausentismo (Liam Foster ausente), o alertas de contratos vencidos en RR.HH.
   - ¿Cuál es el flujo de caja actual? -> Suma los ingresos y egresos recientes cobrados, indica la proyección del mes.
   - ¿Qué empleados tienen documentos vencidos? -> Revisa la lista de empleados y sus "documentosVencidos".
   - ¿Qué área presenta más ausentismo? -> Revisa la asistencia de hoy.
   - ¿Qué proceso es más lento actualmente? -> Analiza los logs o la logística de transporte de acero del Área B.
4. Mantén tus respuestas en un tono corporativo óptimo, elegante y tecnológico.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2
      }
    });

    return res.json({
      text: response.text,
      simulated: false
    });

  } catch (error: any) {
    console.error("Error en endpoint /api/assistant:", error);
    return res.status(500).json({ 
      error: "Ocurrió un error en el procesamiento de la inteligencia artificial.",
      details: error.message 
    });
  }
}
