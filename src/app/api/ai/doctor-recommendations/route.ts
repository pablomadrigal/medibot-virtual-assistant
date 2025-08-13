import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || ''
});

export async function POST(request: NextRequest) {
  try {
    const { patientAnalysis, doctorNotes, urgency } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY not configured');
      return NextResponse.json({ 
        error: 'OpenAI API key not configured',
        success: false 
      }, { status: 500 });
    }

    console.log('🧠 Starting doctor recommendations generation...');

    const recommendationsPrompt = `
Eres un asistente médico virtual que debe generar recomendaciones de tratamiento basadas en el análisis del paciente.

INFORMACIÓN DISPONIBLE:
- Análisis del paciente: ${patientAnalysis || 'No disponible'}
- Notas del doctor: ${doctorNotes || 'No disponibles'}
- Nivel de urgencia: ${urgency || 'medium'}

Genera recomendaciones de tratamiento estructuradas que incluyan:
1. Plan de tratamiento principal
2. Medicamentos sugeridos (si aplica)
3. Recomendaciones de estilo de vida
4. Seguimiento recomendado
5. Advertencias importantes

Responde en formato JSON con la siguiente estructura:
{
  "treatmentPlan": {
    "primaryRecommendations": ["recomendación1", "recomendación2"]
  },
  "medications": [
    {
      "name": "Nombre del medicamento",
      "dosage": "Dosis recomendada",
      "frequency": "Frecuencia",
      "duration": "Duración del tratamiento",
      "notes": "Notas adicionales"
    }
  ],
  "lifestyleRecommendations": ["recomendación1", "recomendación2"],
  "followUp": "Instrucciones de seguimiento",
  "warnings": ["advertencia1", "advertencia2"]
}
`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'Eres un asistente médico virtual experto en generar recomendaciones de tratamiento.' },
        { role: 'user', content: recommendationsPrompt }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const responseText = completion.choices[0].message?.content || '';
    
    // Try to parse JSON response
    let recommendationsData;
    try {
      recommendationsData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing AI response as JSON:', parseError);
      // Fallback to structured response
      recommendationsData = {
        treatmentPlan: {
          primaryRecommendations: ['Consultar con un médico para evaluación completa']
        },
        medications: [],
        lifestyleRecommendations: ['Mantener un estilo de vida saludable'],
        followUp: 'Programar cita de seguimiento según recomendación médica',
        warnings: ['Este es un análisis preliminar y no reemplaza la evaluación de un profesional médico']
      };
    }

    console.log('✅ Doctor recommendations completed');

    return NextResponse.json({
      success: true,
      data: recommendationsData
    });

  } catch (error: any) {
    console.error('❌ Error in doctor recommendations:', error);
    
    let errorMessage = 'Error generating doctor recommendations';
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
