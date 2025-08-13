import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(request: NextRequest) {
  try {
    const { patientDescription, symptoms, medicalHistory, currentMedications } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        success: false 
      }, { status: 500 });
    }

    console.log('🧠 Starting patient analysis...');

    const analysisPrompt = `
Eres un asistente médico virtual que debe analizar la información del paciente y generar un análisis estructurado.

INFORMACIÓN DEL PACIENTE:
- Descripción: ${patientDescription || 'No proporcionada'}
- Síntomas: ${symptoms?.join(', ') || 'No especificados'}
- Historial médico: ${medicalHistory || 'No proporcionado'}
- Medicamentos actuales: ${currentMedications?.join(', ') || 'No especificados'}

Genera un análisis médico estructurado que incluya:
1. Resumen de la situación
2. Síntomas principales identificados
3. Preocupaciones potenciales
4. Próximos pasos recomendados
5. Nivel de urgencia (emergency, high, medium, low)
6. Notas adicionales
7. Descargo de responsabilidad

Responde en formato JSON con la siguiente estructura:
{
  "summary": "Resumen conciso de la situación",
  "keySymptoms": ["síntoma1", "síntoma2"],
  "potentialConcerns": ["preocupación1", "preocupación2"],
  "recommendedNextSteps": ["paso1", "paso2"],
  "urgency": "medium",
  "notes": "Notas adicionales importantes",
  "disclaimer": "Este análisis es preliminar y no reemplaza la evaluación de un profesional médico."
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Eres un asistente médico virtual experto en análisis preliminar de pacientes.' },
        { role: 'user', content: analysisPrompt }
      ],
      max_tokens: 800,
      temperature: 0.3
    });

    const responseText = completion.choices[0].message?.content || '';
    
    // Try to parse JSON response
    let analysisData;
    try {
      analysisData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      // Fallback to structured response
      analysisData = {
        summary: responseText.substring(0, 200) + '...',
        keySymptoms: symptoms || [],
        potentialConcerns: ['Se requiere evaluación médica profesional'],
        recommendedNextSteps: ['Consultar con un médico'],
        urgency: 'medium',
        notes: 'Análisis automático generado por IA',
        disclaimer: 'Este análisis es preliminar y no reemplaza la evaluación de un profesional médico.'
      };
    }

    console.log('✅ Patient analysis completed');

    return NextResponse.json({
      success: true,
      data: analysisData
    });

  } catch (error: any) {
    console.error('❌ Error in patient analysis:', error);
    
    let errorMessage = 'Error analyzing patient data';
    let statusCode = 500;
    
    if (error.code === 'unavailable' || error.message?.includes('timeout')) {
      errorMessage = 'Service temporarily unavailable. Please try again in a moment.';
      statusCode = 503;
    } else if (error.status === 429) {
      errorMessage = 'Too many requests. Please wait a moment before trying again.';
      statusCode = 429;
    } else if (error.status === 401) {
      errorMessage = 'Authentication error with AI service.';
      statusCode = 401;
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      success: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: statusCode });
  }
}
