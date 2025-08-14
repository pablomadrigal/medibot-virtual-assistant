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
  PatientAnalysisRequestSchema,
  type PatientAnalysisRequest 
} from '@/lib/ai/validation';
import { 
  PATIENT_ANALYSIS_SYSTEM_PROMPT, 
  PATIENT_ANALYSIS_USER_PROMPT,
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

    const validatedData = validationResult.data;

    // Sanitize input
    const sanitizedData = {
      ...validatedData,
      patientDescription: sanitizeInput(validatedData.patientDescription),
      medicalHistory: validatedData.medicalHistory ? sanitizeInput(validatedData.medicalHistory) : undefined,
    };

    // Safety check
    const safetyCheck = AISafetyChecker.checkMedicalSafety(sanitizedData.patientDescription);
    if (!safetyCheck.safe) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Content contains potentially concerning keywords. Please review your input.',
          'SAFETY_VIOLATION'
        ),
        { status: 400 }
      );
    }

    // Generate AI prompt
    const userPrompt = PATIENT_ANALYSIS_USER_PROMPT({
      description: sanitizedData.patientDescription,
      age: sanitizedData.patientAge,
      gender: sanitizedData.patientGender,
      symptoms: sanitizedData.symptoms,
      medicalHistory: sanitizedData.medicalHistory,
      currentMedications: sanitizedData.currentMedications,
    });
    
    // Call OpenAI
    const aiResponse = await callOpenAI(userPrompt, PATIENT_ANALYSIS_SYSTEM_PROMPT);
    
    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, return the raw response with a warning
      parsedResponse = {
        summary: aiResponse,
        keySymptoms: [],
        potentialConcerns: [],
        recommendedNextSteps: [],
        urgency: 'medium',
        notes: 'AI response could not be parsed as JSON. Please review manually.',
        rawResponse: aiResponse
      };
    }

    // Add safety disclaimer
    const finalResponse = {
      ...parsedResponse,
      disclaimer: SAFETY_DISCLAIMER,
      warnings: safetyCheck.warnings,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      AIResponseFormatter.formatSuccessResponse(finalResponse),
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
