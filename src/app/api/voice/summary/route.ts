import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/ai/utils';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getSummaryPrompt = (step: string, conversationHistory: any[]) => {
  const basePrompt = `
Eres un asistente médico virtual que debe generar un resumen de la información recopilada para el siguiente paso de la consulta.

INSTRUCCIONES:
- Analiza la conversación y extrae la información médica relevante
- Genera un resumen conciso y profesional
- Incluye síntomas, historial médico, medicamentos, alergias, factores de riesgo
- Habla en español
- Sé empático y profesional
`;

  switch (step) {
    case 'doctor-review':
      return basePrompt + `
OBJETIVO: Generar resumen para evaluación médica
FORMATO: "Basándome en la información recopilada, procedo a realizar la evaluación médica. [RESUMEN DE SÍNTOMAS E HISTORIAL]. ¿Desea que proceda con el análisis médico?"
`;
    case 'prescription':
      return basePrompt + `
OBJETIVO: Generar resumen para prescripción médica
FORMATO: "Basándome en la evaluación médica realizada, procedo a generar las recomendaciones y prescripción médica. [RESUMEN DE DIAGNÓSTICO]. ¿Desea que proceda con la prescripción?"
`;
    default:
      return basePrompt;
  }
};

async function retryOpenAIRequest<T>(
  requestFn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await requestFn();
  } catch (error: any) {
    if (retries > 0 && (
      error.code === 'unavailable' || 
      error.message?.includes('timeout') ||
      error.status === 503 ||
      error.status === 429
    )) {
      console.log(`🔄 Retrying OpenAI request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY);
      return retryOpenAIRequest(requestFn, retries - 1);
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { step, conversationHistory } = await request.json();

    if (!step || !conversationHistory) {
      return NextResponse.json({ error: 'Missing step or conversation history' }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        success: false 
      }, { status: 500 });
    }

    console.log(`📋 Generating summary for step: ${step}`);
    console.log(`📝 Conversation history length: ${conversationHistory.length}`);

    // Process conversation history for GPT
    const processedHistory = conversationHistory.map((msg: any) => ({
      role: msg.role,
      content: msg.text || msg.content
    }));

    const messages = [
      { role: 'system', content: getSummaryPrompt(step, conversationHistory) },
      ...processedHistory.slice(-10), // Last 10 messages for context
    ];

    console.log('🧠 Starting GPT-4 summary generation...');

    const openai = getOpenAI();
    const completion = await retryOpenAIRequest(() => 
      openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 300,
        temperature: 0.7
      })
    );

    const summary = completion.choices[0].message?.content || 'Error generando resumen.';
    console.log(`✅ Summary generated: ${summary.substring(0, 100)}...`);

    // Generate TTS for the summary
    console.log('🔊 Starting TTS for summary...');
    const speechResponse = await retryOpenAIRequest(() =>
      openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: summary
      })
    );

    const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
    const audioBase64 = audioBuffer.toString('base64');
    console.log('✅ TTS for summary completed');

    return NextResponse.json({
      summary: summary,
      audioBase64: audioBase64,
      success: true
    });

  } catch (error: any) {
    console.error('❌ Error generating summary:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Error generando resumen';
    let statusCode = 500;
    
    if (error.code === 'unavailable' || error.message?.includes('timeout')) {
      errorMessage = 'Servicio temporalmente no disponible. Por favor, inténtelo de nuevo en unos momentos.';
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage = 'Demasiadas solicitudes. Por favor, espere un momento antes de intentar de nuevo.';
      statusCode = 429;
    } else if (error.status === 401) {
      errorMessage = 'Error de autenticación con el servicio de IA.';
      statusCode = 401;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
} 