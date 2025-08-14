import { NextRequest, NextResponse } from 'next/server';
import { 
  AIErrorHandler, 
  AIResponseFormatter, 
  callOpenAI,
  sanitizeInput,
} from '@/lib/ai/utils';
import { 
  PatientAnalysisRequestSchema,
} from '@/lib/ai/validation';
import { 
  PATIENT_ANALYSIS_SYSTEM_PROMPT, 
  PATIENT_ANALYSIS_USER_PROMPT,
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = PatientAnalysisRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Invalid request data: ' + validationResult.error.issues.map(e => e.message).join(', '),
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    const { patientDescription, symptoms, ...rest } = validationResult.data;

    // Sanitize input
    const sanitizedDescription = sanitizeInput(patientDescription);
    const sanitizedSymptoms = Array.isArray(symptoms) ? symptoms.map(s => sanitizeInput(s)) : [];

    // Generate AI prompt
    const userPrompt = PATIENT_ANALYSIS_USER_PROMPT({
      description: sanitizedDescription,
      symptoms: sanitizedSymptoms,
      ...rest
    });
    
    // Call OpenAI
    const aiResponse = await callOpenAI(userPrompt, PATIENT_ANALYSIS_SYSTEM_PROMPT);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      parsedResponse = {
        summary: aiResponse,
        recommendations: []
      };
    }

    return NextResponse.json(
      AIResponseFormatter.formatSuccessResponse(parsedResponse),
      { status: 200 }
    );

  } catch (error) {
    console.error('Patient Analysis Error:', error);
    const errorResponse = AIErrorHandler.handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Patient Analysis endpoint is running',
    description: 'Analyzes patient descriptions and provides preliminary assessments',
    requiredFields: [
      'patientDescription (string, min 10 chars)'
    ],
    optionalFields: [
      'patientAge (number)',
      'patientGender (male|female|other)',
      'symptoms (string[])',
      'medicalHistory (string)',
      'currentMedications (string[])'
    ],
    timestamp: new Date().toISOString(),
  });
} 