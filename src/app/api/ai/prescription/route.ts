import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConsultationRepository } from '@/repositories/ConsultationRepository';
import { 
  AIErrorHandler, 
  AIResponseFormatter, 
  callOpenAI,
} from '@/lib/ai/utils';
import { 
  PrescriptionRequestSchema,
} from '@/lib/ai/validation';
import { 
  PRESCRIPTION_SYSTEM_PROMPT, 
  PRESCRIPTION_USER_PROMPT,
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(AIResponseFormatter.formatErrorResponse('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }
    // Add role check for 'doctor' here in a real application

    const body = await request.json();
    const validationResult = PrescriptionRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Invalid request data: ' + validationResult.error.issues.map(e => e.message).join(', '),
          'VALIDATION_ERROR'
        ),
        { status: 400 }
      );
    }

    const { consultationId, doctorRecommendations, ...rest } = validationResult.data;

    const consultation = await ConsultationRepository.findByIdWithDetails(consultationId!);
    if (!consultation) {
        return NextResponse.json(AIResponseFormatter.formatErrorResponse('Consultation not found.', 'NOT_FOUND'), { status: 404 });
    }

    const userPrompt = PRESCRIPTION_USER_PROMPT({
        doctorRecommendations,
        ...rest
    });
    
    const aiResponse = await callOpenAI(userPrompt, PRESCRIPTION_SYSTEM_PROMPT);
    
    try {
      const parsedResponse = JSON.parse(aiResponse);
      return NextResponse.json(AIResponseFormatter.formatSuccessResponse(parsedResponse),{ status: 200 });
    } catch (parseError) {
        // If parsing fails, return the raw text with a success wrapper
        return NextResponse.json(AIResponseFormatter.formatSuccessResponse({ rawPrescription: aiResponse }), { status: 200 });
    }

  } catch (error) {
    console.error('Prescription Generation Error:', error);
    const errorResponse = AIErrorHandler.handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Prescription Generation endpoint is running',
    description: 'Generates professional prescription documents based on doctor recommendations',
    requiredFields: [
      'doctorRecommendations (string, min 10 chars)'
    ],
    optionalFields: [
      'patientId (string)',
      'doctorId (string)',
      'consultationId (string)',
      'additionalContext (string)',
      'prescriptionType (medication|examination|referral|lifestyle)'
    ],
    timestamp: new Date().toISOString(),
  });
} 