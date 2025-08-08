import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

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
    console.log('🔍 Voice processing request received');
    
    const formData = await request.formData();
    console.log('📋 FormData parsed successfully');
    
    const audioFile = formData.get('audio') as File;
    console.log('🎵 Audio file:', audioFile ? `Type: ${audioFile.type}, Size: ${audioFile.size} bytes` : 'No audio file');
    
    const historyStr = formData.get('history') as string || '[]';
    const rawHistory = JSON.parse(historyStr);
    
    // Convert 'agent' role to 'assistant' for OpenAI API compatibility and filter out invalid messages
    const conversationHistory = rawHistory
      .filter((msg: any) => msg && (msg.content || msg.text) && (msg.content?.trim() !== '' || msg.text?.trim() !== ''))
      .map((msg: any) => ({
        role: msg.role === 'agent' ? 'assistant' : msg.role,
        content: msg.content || msg.text || '' // Handle both 'content' and 'text' fields
      }));
    
    console.log('📝 Conversation history length:', conversationHistory.length);
    
    const consultationStep = formData.get('step') as string || 'saludo';
    const isText = formData.get('isText') === 'true';
    console.log('🎯 Step:', consultationStep, 'IsText:', isText);

    // Helper functions to extract information from conversation
    const extractSymptoms = (history: any[]) => {
      const symptoms: string[] = [];
      const userMessages = history.filter((msg: { role: string; content?: string; text?: string }) => msg.role === 'user').map((msg: { content?: string; text?: string }) => msg.content || msg.text).join(' ');
      const symptomKeywords = ['dolor', 'fiebre', 'tos', 'dolor de cabeza', 'náusea', 'vómito', 'diarrea', 'fatiga', 'mareo'];
      
      for (const keyword of symptomKeywords) {
        if (userMessages.toLowerCase().includes(keyword)) {
          symptoms.push(keyword);
        }
      }
      return symptoms;
    };

    const extractMedicalHistory = (history: any[]) => {
      const userMessages = history.filter((msg: { role: string; content?: string; text?: string }) => msg.role === 'user').map((msg: { content?: string; text?: string }) => msg.content || msg.text).join(' ');
      const historyKeywords = ['historial', 'enfermedad', 'condición', 'diagnóstico', 'tratamiento'];
      
      // Extract sentences that mention medical history
      const sentences = userMessages.split(/[.!?]+/);
      const historySentences = sentences.filter(sentence => 
        historyKeywords.some(keyword => sentence.toLowerCase().includes(keyword))
      );
      
      return historySentences.join('. ');
    };

    const extractMedications = (history: any[]) => {
      const medications: string[] = [];
      const userMessages = history.filter((msg: { role: string; content?: string; text?: string }) => msg.role === 'user').map((msg: { content?: string; text?: string }) => msg.content || msg.text).join(' ');
      const medicationKeywords = ['aspirina', 'paracetamol', 'ibuprofeno', 'melatonina', 'vitaminas', 'medicamento', 'pastilla'];
      
      for (const keyword of medicationKeywords) {
        if (userMessages.toLowerCase().includes(keyword)) {
          medications.push(keyword);
        }
      }
      return medications;
    };

    if (!audioFile) {
      console.log('❌ No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log(isText ? '📝 Processing text input...' : '🎤 Processing voice input...');

    let userText = '';

    if (isText) {
      // 1a. Process text input directly
      userText = await audioFile.text();
    } else {
      // 1b. Convert speech to text using Whisper
      console.log('🎤 Starting Whisper transcription...');
      try {
        const transcription = await openai.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          language: 'es'
        });
        userText = transcription.text;
        console.log('✅ Whisper transcription completed');
      } catch (whisperError) {
        console.error('❌ Whisper API error:', whisperError);
        throw whisperError;
      }
    }

    console.log(`👤 Usuario dijo: ${userText}`);

    if (!userText.trim()) {
      return NextResponse.json({ 
        error: 'No pude escuchar bien. ¿Puede repetir por favor?',
        transcript: '',
        response: 'No pude escuchar bien. ¿Puede repetir por favor?'
      });
    }

    // 2. Generate response using GPT-4
    console.log('🧠 Starting GPT-4 completion...');
    console.log('📝 Raw conversation history:', JSON.stringify(rawHistory, null, 2));
    console.log('🔄 Processed conversation history:', JSON.stringify(conversationHistory, null, 2));
    
    const messages = [
      { role: 'system', content: getSystemPrompt(consultationStep) }, //TODO PM - Aca no esta haciendo nada, pasa un parametro que nada que ver, deberiamos hacer un enum
      ...conversationHistory.slice(-6), //TODO PM -  Deberiamos ver si hay ua mejor manera que solo pasar los ultimos 6 mensajes para el contexto
      { role: 'user', content: userText }
    ];
    
    console.log('📤 Messages being sent to GPT-4:', JSON.stringify(messages, null, 2));

    let agentResponse = '';
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: messages as any,
        max_tokens: 150,
        temperature: 0.7
      });

      agentResponse = completion.choices[0].message?.content || 'Lo siento, no pude procesar su consulta.';
      console.log(`🤖 Agente respondió: ${agentResponse}`);
    } catch (gptError) {
      console.error('❌ GPT-4 API error:', gptError);
      throw gptError;
    }

    // 3. Convert response to speech using TTS
    console.log('🔊 Starting TTS conversion...');
    let audioBase64 = '';
    try {
      const speechResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: agentResponse
      });

      // Convert the audio to base64 for sending to frontend
      const audioBuffer = Buffer.from(await speechResponse.arrayBuffer());
      audioBase64 = audioBuffer.toString('base64');
      console.log('✅ TTS conversion completed');
    } catch (ttsError) {
      console.error('❌ TTS API error:', ttsError);
      throw ttsError;
    }

    // 4. Determine next consultation step and check if step is complete
    let nextStep = consultationStep;
    let stepComplete = false;
    let analysisData = null;
    const userLower = userText.toLowerCase();
    
    // Check if the AI response indicates step completion
    const completionKeywords = {
      'patient-input': ['información completa', 'datos suficientes', 'información necesaria', 'recopilación completa', 'procederé a realizar la evaluación médica'],
      'doctor-review': ['evaluación completa', 'análisis terminado', 'revisión completada', 'diagnóstico preliminar', 'procederé a generar las recomendaciones'],
      'prescription': ['prescripción completa', 'recomendaciones finales', 'tratamiento definido', 'consulta terminada', 'consulta ha terminado']
    };
    
    const currentKeywords = completionKeywords[consultationStep as keyof typeof completionKeywords] || [];
    const responseLower = agentResponse.toLowerCase();
    
    // Check if AI response contains completion keywords
    if (currentKeywords.some(keyword => responseLower.includes(keyword))) {
      stepComplete = true;
    }
    
    // Also check conversation length as backup
    if (consultationStep === 'patient-input' && conversationHistory.length > 8) {
      stepComplete = true;
    } else if (consultationStep === 'doctor-review' && conversationHistory.length > 12) {
      stepComplete = true;
    }
    
    // Generate analysis data when step is complete
    if (stepComplete) {
      try {
        if (consultationStep === 'patient-input') {
          // Call the patient analysis endpoint
          const patientDescription = conversationHistory
            .filter((msg: { role: string; content?: string; text?: string }) => msg.role === 'user')
            .map((msg: { content?: string; text?: string }) => msg.content || msg.text)
            .join(' ');
          
          const analysisResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/patient-analysis`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientDescription: patientDescription,
              symptoms: extractSymptoms(conversationHistory),
              medicalHistory: extractMedicalHistory(conversationHistory),
              currentMedications: extractMedications(conversationHistory)
            })
          });
          
          if (analysisResponse.ok) {
            const result = await analysisResponse.json();
            if (result.success) {
              analysisData = result.data;
            }
          }
                 } else if (consultationStep === 'doctor-review') {
           // Call the doctor recommendations endpoint
           const patientAnalysis = ''; // We'll need to pass this from the frontend
           const doctorNotes = conversationHistory
             .filter((msg: any) => msg.role === 'assistant')
             .map((msg: any) => msg.content || msg.text)
             .join(' ');
          
          const recommendationsResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/ai/doctor-recommendations`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientAnalysis: JSON.stringify(patientAnalysis),
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
        analysisData = null;
      }
    }
    
    // Only advance step if not complete
    if (!stepComplete) {
      if (consultationStep === 'patient-input') {
        // Stay in patient-input until complete
        nextStep = 'patient-input';
      } else if (consultationStep === 'doctor-review') {
        // Stay in doctor-review until complete
        nextStep = 'doctor-review';
      } else if (consultationStep === 'prescription') {
        // Stay in prescription
        nextStep = 'prescription';
      }
    } else {
      // Advance to next step when complete
      if (consultationStep === 'patient-input') {
        nextStep = 'doctor-review';
      } else if (consultationStep === 'doctor-review') {
        nextStep = 'prescription';
      } else if (consultationStep === 'prescription') {
        nextStep = 'prescription'; // Stay in prescription
      }
    }

    return NextResponse.json({
      transcript: userText,
      response: agentResponse,
      audioBase64: audioBase64,
      nextStep: nextStep,
      stepComplete: stepComplete,
      analysisData: analysisData,
      success: true
    });

  } catch (error) {
    console.error('❌ Error processing voice:', error);
    console.error('❌ Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Error procesando la voz. Inténtelo de nuevo.',
      success: false 
    }, { status: 500 });
  }
}