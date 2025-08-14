import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ConsultationRepository } from '@/repositories/ConsultationRepository';
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
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(AIResponseFormatter.formatErrorResponse('Authentication required.', 'UNAUTHORIZED'), { status: 401 });
    }
    // In a real app, we'd check if the user has a 'doctor' role here.

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

    const { consultationId, doctorNotes, ...rest } = validationResult.data;

    // Fetch consultation to get patient analysis
    const consultation = await ConsultationRepository.findByIdWithDetails(consultationId!);
    if (!consultation) {
        return NextResponse.json(AIResponseFormatter.formatErrorResponse('Consultation not found.', 'NOT_FOUND'), { status: 404 });
    }

    const sanitizedNotes = sanitizeInput(doctorNotes);

    const userPrompt = DOCTOR_RECOMMENDATIONS_USER_PROMPT({
      doctorNotes: sanitizedNotes,
      ...rest,
    });
    
    const aiResponse = await callOpenAI(userPrompt, DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT);
    
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      parsedResponse = { treatmentPlan: 'Could not parse AI response.' };
    }

    // Save doctor notes to the consultation
    await ConsultationRepository.updateStatus(consultationId!, consultation.status, user.id, sanitizedNotes);

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