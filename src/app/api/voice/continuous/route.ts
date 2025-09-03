import { NextRequest, NextResponse } from 'next/server';
import { getOpenAI } from '@/lib/ai/utils';

// Medical consultation system prompt in Spanish
const getSystemPrompt = (step: string) => {
  const basePrompt = `
Eres un asistente médico virtual profesional diseñado para ayudar a pacientes con consultas iniciales en español.

INSTRUCCIONES IMPORTANTES:
- Mantén respuestas CORTAS y CONCISAS (máximo 2-3 frases)
- Sé empático y profesional
- Haz UNA pregunta específica a la vez
- Nunca proporciones diagnósticos definitivos
- Siempre recomienda consultar con un médico para problemas serios
- Habla únicamente en español
- Responde de forma natural y conversacional

RESPONDE DE FORMA BREVE Y NATURAL, como si fueras un doctor real hablando con un paciente.
`;

  switch (step) {
    case 'patient-input':
      return basePrompt + `
PASO ACTUAL: Recopilación de información del paciente
OBJETIVO: Recopilar síntomas, historial médico, medicamentos actuales
PREGUNTAS A HACER:
- Síntomas principales y duración
- Historial médico relevante
- Medicamentos actuales
- Alergias conocidas
- Factores de riesgo (viajes, exposición, etc.)

CUANDO LA INFORMACIÓN ESTÉ COMPLETA, di: "He recopilado toda la información necesaria. Ahora procederé a realizar la evaluación médica."
`;
    case 'doctor-review':
      return basePrompt + `
PASO ACTUAL: Análisis médico por el doctor
OBJETIVO: Analizar la información recopilada y proporcionar evaluación
ACTIVIDADES:
- Revisar síntomas reportados
- Evaluar posibles diagnósticos
- Identificar factores de riesgo
- Determinar urgencia de atención médica

CUANDO LA EVALUACIÓN ESTÉ COMPLETA, di: "He completado la evaluación médica. Ahora procederé a generar las recomendaciones y prescripción."
`;
    case 'prescription':
      return basePrompt + `
PASO ACTUAL: Generación de prescripción médica
OBJETIVO: Proporcionar recomendaciones y prescripción
INCLUIR:
- Diagnóstico preliminar
- Recomendaciones de tratamiento
- Medicamentos sugeridos (si aplica)
- Referencias a especialistas (si necesario)
- Instrucciones de seguimiento

CUANDO LA PRESCRIPCIÓN ESTÉ COMPLETA, di: "He completado la prescripción médica. Su consulta ha terminado."
`;
    default:
      return basePrompt;
  }
};

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Continuous voice processing request received');
    
    const body = await request.json();
    console.log('📋 Request body parsed successfully');
    
    const {
      audioData,
      audioMimeType = 'audio/webm',
      conversationHistory = [],
      consultationStep = 'patient-input',
      isText = false,
      userText = '',
      sessionId
    } = body;
    
    console.log('🎯 Processing parameters:', {
      hasAudioData: !!audioData,
      conversationHistoryLength: conversationHistory.length,
      consultationStep,
      isText,
      hasUserText: !!userText,
      sessionId
    });

    // Convert conversation history to OpenAI format
    const processedHistory = conversationHistory
      .filter((msg: any) => msg && (msg.content || msg.text) && (msg.content?.trim() !== '' || msg.text?.trim() !== ''))
      .map((msg: any) => ({
        role: msg.role === 'agent' ? 'assistant' : msg.role,
        content: msg.content || msg.text || ''
      }));

    let finalUserText = userText;

    // Process audio if provided
    if (audioData && !isText) {
      try {
        console.log('🎤 Processing audio data...');
        
        // Convert base64 audio to buffer
        const audioBuffer = Buffer.from(audioData, 'base64');
        
        // Use the MIME type provided by the frontend
        const audioFile = new Blob([audioBuffer], { type: audioMimeType });
        
        // Convert to File object with appropriate extension
        const fileExtension = audioMimeType.includes('webm') ? 'webm' : 
                             audioMimeType.includes('mp4') ? 'mp4' : 
                             audioMimeType.includes('ogg') ? 'ogg' : 'wav';
        const file = new File([audioFile], `audio.${fileExtension}`, { type: audioMimeType });
        
        // Transcribe using Whisper
        const openai = getOpenAI();
        const transcription = await openai.audio.transcriptions.create({
          file: file,
          model: 'whisper-1',
          language: 'es'
        });
        
        finalUserText = transcription.text;
        console.log('✅ Audio transcription completed:', finalUserText);
      } catch (audioError) {
        console.error('❌ Audio processing error:', audioError);
        return NextResponse.json({
          error: 'Error procesando el audio. Inténtelo de nuevo.',
          success: false
        }, { status: 500 });
      }
    }

    if (!finalUserText.trim()) {
      return NextResponse.json({
        error: 'No se detectó texto en el audio. ¿Puede repetir por favor?',
        success: false
      });
    }

    console.log(`👤 Usuario dijo: ${finalUserText}`);

    // Generate AI response
    console.log('🧠 Generating AI response...');
    
    const messages = [
      { role: 'system', content: getSystemPrompt(consultationStep) },
      ...processedHistory.slice(-8), // Keep last 8 messages for context
      { role: 'user', content: finalUserText }
    ];

    let agentResponse = '';
    try {
      const openai = getOpenAI();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Using faster model for real-time responses
        messages: messages as any,
        max_tokens: 120,
        temperature: 0.7
      });

      agentResponse = completion.choices[0].message?.content || 'Lo siento, no pude procesar su consulta.';
      console.log(`🤖 Agente respondió: ${agentResponse}`);
    } catch (gptError) {
      console.error('❌ GPT API error:', gptError);
      throw gptError;
    }

    // Convert response to speech
    console.log('🔊 Converting response to speech...');
    let audioBase64 = '';
    try {
      const openai = getOpenAI();
      const speechResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: agentResponse
      });

      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      audioBase64 = audioBuffer.toString('base64');
      console.log('✅ TTS conversion completed');
    } catch (ttsError) {
      console.error('❌ TTS API error:', ttsError);
      // Continue without audio if TTS fails
    }

    // Check for step completion
    let stepComplete = false;
    let nextStep = consultationStep;
    let analysisData = null;
    
    const completionKeywords = {
      'patient-input': ['información completa', 'datos suficientes', 'información necesaria', 'recopilación completa', 'procederé a realizar la evaluación médica'],
      'doctor-review': ['evaluación completa', 'análisis terminado', 'revisión completada', 'diagnóstico preliminar', 'procederé a generar las recomendaciones'],
      'prescription': ['prescripción completa', 'recomendaciones finales', 'tratamiento definido', 'consulta terminada', 'consulta ha terminado']
    };
    
    const currentKeywords = completionKeywords[consultationStep as keyof typeof completionKeywords] || [];
    const responseLower = agentResponse.toLowerCase();
    
    if (currentKeywords.some(keyword => responseLower.includes(keyword))) {
      stepComplete = true;
    }
    
    // Generate analysis data when step is complete
    if (stepComplete) {
      try {
        if (consultationStep === 'patient-input') {
          const patientDescription = processedHistory
            .filter((msg: any) => msg.role === 'user')
            .map((msg: any) => msg.content)
            .join(' ');
          
          const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/patient-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientDescription: patientDescription,
              symptoms: extractSymptoms(processedHistory),
              medicalHistory: extractMedicalHistory(processedHistory),
              currentMedications: extractMedications(processedHistory)
            })
          });
          
          if (analysisResponse.ok) {
            const result = await analysisResponse.json();
            if (result.success) {
              analysisData = result.data;
            }
          }
        } else if (consultationStep === 'doctor-review') {
          const doctorNotes = processedHistory
            .filter((msg: any) => msg.role === 'assistant')
            .map((msg: any) => msg.content)
            .join(' ');
          
          const recommendationsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/doctor-recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientAnalysis: '{}', // Will be passed from frontend
              doctorNotes: doctorNotes,
              urgency: 'medium'
            })
          });
          
          if (recommendationsResponse.ok) {
            const result = await recommendationsResponse.json();
            if (result.success) {
              analysisData = result.data;
            }
          }
        }
      } catch (error) {
        console.error('Error generating analysis data:', error);
      }
    }
    
    // Determine next step
    if (stepComplete) {
      if (consultationStep === 'patient-input') {
        nextStep = 'doctor-review';
      } else if (consultationStep === 'doctor-review') {
        nextStep = 'prescription';
      } else if (consultationStep === 'prescription') {
        nextStep = 'prescription';
      }
    }

    return NextResponse.json({
      transcript: finalUserText,
      response: agentResponse,
      audioBase64: audioBase64,
      nextStep: nextStep,
      stepComplete: stepComplete,
      analysisData: analysisData,
      success: true
    });

  } catch (error) {
    console.error('❌ Error in continuous voice processing:', error);
    return NextResponse.json({
      error: 'Error procesando la consulta. Inténtelo de nuevo.',
      success: false
    }, { status: 500 });
  }
}

// Helper functions for extracting medical information
function extractSymptoms(history: any[]) {
  const symptoms: string[] = [];
  const userMessages = history
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join(' ');
  
  const symptomKeywords = [
    'dolor', 'fiebre', 'tos', 'dolor de cabeza', 'náusea', 'vómito', 
    'diarrea', 'fatiga', 'mareo', 'inflamación', 'sangrado', 'dificultad para respirar'
  ];
  
  for (const keyword of symptomKeywords) {
    if (userMessages.toLowerCase().includes(keyword)) {
      symptoms.push(keyword);
    }
  }
  return symptoms;
}

function extractMedicalHistory(history: any[]) {
  const userMessages = history
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join(' ');
  
  const historyKeywords = ['historial', 'enfermedad', 'condición', 'diagnóstico', 'tratamiento'];
  const sentences = userMessages.split(/[.!?]+/);
  const historySentences = sentences.filter(sentence => 
    historyKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
  );
  
  return historySentences.join('. ');
}

function extractMedications(history: any[]) {
  const medications: string[] = [];
  const userMessages = history
    .filter((msg: any) => msg.role === 'user')
    .map((msg: any) => msg.content)
    .join(' ');
  
  const medicationKeywords = [
    'aspirina', 'paracetamol', 'ibuprofeno', 'melatonina', 'vitaminas', 
    'medicamento', 'pastilla', 'antibiótico', 'antidepresivo'
  ];
  
  for (const keyword of medicationKeywords) {
    if (userMessages.toLowerCase().includes(keyword)) {
      medications.push(keyword);
    }
  }
  return medications;
}
