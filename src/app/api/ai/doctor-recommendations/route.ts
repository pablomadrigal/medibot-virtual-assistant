import { NextRequest, NextResponse } from 'next/server';
import { 
  RateLimiter, 
  AIErrorHandler, 
  AIResponseFormatter, 
  extractIdentifier,
  callOpenAI,
  sanitizeInput,
  AISafetyChecker
} from '@/lib/ai/utils';
import { 
  DoctorRecommendationsRequestSchema,
  type DoctorRecommendationsRequest 
} from '@/lib/ai/validation';
import { 
  DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT, 
  DOCTOR_RECOMMENDATIONS_USER_PROMPT,
  SAFETY_DISCLAIMER 
} from '@/lib/ai/prompts';

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = extractIdentifier(request);
    const rateLimitCheck = RateLimiter.checkRateLimit(identifier);
    
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: rateLimitCheck.retryAfter,
          timestamp: new Date().toISOString(),
        },
        { status: 429 }
      );
    }

    // Parse and validate request body
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

    const validatedData = validationResult.data;

    // Sanitize input
    const sanitizedData = {
      ...validatedData,
      patientAnalysis: sanitizeInput(validatedData.patientAnalysis),
      doctorNotes: sanitizeInput(validatedData.doctorNotes),
    };

    // Safety check for both patient analysis and doctor notes
    const patientAnalysisSafety = AISafetyChecker.checkMedicalSafety(sanitizedData.patientAnalysis);
    const doctorNotesSafety = AISafetyChecker.checkMedicalSafety(sanitizedData.doctorNotes);
    
    if (!patientAnalysisSafety.safe || !doctorNotesSafety.safe) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Content contains potentially concerning keywords. Please review your input.',
          'SAFETY_VIOLATION'
        ),
        { status: 400 }
      );
    }

    // Generate AI prompt
    const userPrompt = DOCTOR_RECOMMENDATIONS_USER_PROMPT(sanitizedData);
    
    // Call OpenAI
    const aiResponse = await callOpenAI(userPrompt, DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT);
    
    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, return the raw response with a warning
      parsedResponse = {
        treatmentPlan: {
          primaryRecommendations: [],
          medications: [],
          examinations: [],
          lifestyleRecommendations: [],
          followUp: aiResponse
        },
        safetyConsiderations: [],
        contraindications: [],
        notes: 'AI response could not be parsed as JSON. Please review manually.',
        rawResponse: aiResponse
      };
    }

    // Add safety disclaimer and warnings
    const finalResponse = {
      ...parsedResponse,
      disclaimer: SAFETY_DISCLAIMER,
      warnings: [
        ...patientAnalysisSafety.warnings,
        ...doctorNotesSafety.warnings
      ],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      AIResponseFormatter.formatSuccessResponse(finalResponse),
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