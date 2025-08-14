import { NextRequest, NextResponse } from 'next/server';
import { 
  AIErrorHandler, 
  AIResponseFormatter, 
  callOpenAI,
  sanitizeInput,
} from '@/lib/ai/utils';
import { 
  DoctorRecommendationsRequestSchema,
} from '@/lib/ai/validation';
import { 
  DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT, 
  DOCTOR_RECOMMENDATIONS_USER_PROMPT,
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = DoctorRecommendationsRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Invalid request data: ' + validationResult.error.issues.map(e => e.message).join(', '),
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    const { patientAnalysis, doctorNotes, urgency, ...rest } = validationResult.data;

    // Parse patient analysis if it's a string
    let parsedPatientAnalysis;
    if (typeof patientAnalysis === 'string') {
      try {
        parsedPatientAnalysis = JSON.parse(patientAnalysis);
      } catch (parseError) {
        parsedPatientAnalysis = { summary: patientAnalysis };
      }
    } else {
      parsedPatientAnalysis = patientAnalysis;
    }

    const sanitizedNotes = sanitizeInput(doctorNotes);

    const userPrompt = DOCTOR_RECOMMENDATIONS_USER_PROMPT({
      patientAnalysis: parsedPatientAnalysis,
      doctorNotes: sanitizedNotes,
      urgency,
      ...rest,
    });
    
    const aiResponse = await callOpenAI(userPrompt, DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      parsedResponse = { treatmentPlan: 'Could not parse AI response.' };
    }

    return NextResponse.json(
      AIResponseFormatter.formatSuccessResponse(parsedResponse),
      { status: 200 }
    );

  } catch (error) {
    console.error('Doctor Recommendations Error:', error);
    const errorResponse = AIErrorHandler.handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Doctor Recommendations endpoint is running',
    description: 'Generates comprehensive treatment recommendations based on patient analysis and doctor notes',
    requiredFields: [
      'patientAnalysis (string, min 10 chars)',
      'doctorNotes (string, min 5 chars, max 1000 chars)'
    ],
    optionalFields: [
      'patientId (string)',
      'consultationId (string)',
      'urgency (low|medium|high|emergency)'
    ],
    timestamp: new Date().toISOString(),
  });
}
