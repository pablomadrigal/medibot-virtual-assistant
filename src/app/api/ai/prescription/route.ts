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
  PrescriptionRequestSchema,
  type PrescriptionRequest 
} from '@/lib/ai/validation';
import { 
  PRESCRIPTION_SYSTEM_PROMPT, 
  PRESCRIPTION_USER_PROMPT,
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

    const validatedData = validationResult.data;

    // Sanitize input
    const sanitizedData = {
      ...validatedData,
      doctorRecommendations: sanitizeInput(validatedData.doctorRecommendations),
      additionalContext: validatedData.additionalContext ? sanitizeInput(validatedData.additionalContext) : undefined,
    };

    // Safety check for doctor recommendations and additional context
    const recommendationsSafety = AISafetyChecker.checkMedicalSafety(sanitizedData.doctorRecommendations);
    const contextSafety = sanitizedData.additionalContext ? 
      AISafetyChecker.checkMedicalSafety(sanitizedData.additionalContext) : 
      { safe: true, warnings: [] };
    
    if (!recommendationsSafety.safe || !contextSafety.safe) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse(
          'Content contains potentially concerning keywords. Please review your input.',
          'SAFETY_VIOLATION'
        ),
        { status: 400 }
      );
    }

    // Generate AI prompt
    const userPrompt = PRESCRIPTION_USER_PROMPT(sanitizedData);
    
    // Call OpenAI
    const aiResponse = await callOpenAI(userPrompt, PRESCRIPTION_SYSTEM_PROMPT);
    
    // Parse AI response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      // If JSON parsing fails, return the raw response with a warning
      parsedResponse = {
        prescription: {
          header: {
            doctorName: 'Dr. [Name]',
            licenseNumber: 'LIC-XXXXX',
            date: new Date().toISOString().split('T')[0],
            patientId: sanitizedData.patientId || 'N/A',
            doctorId: sanitizedData.doctorId || 'N/A'
          },
          medications: [],
          instructions: aiResponse,
          warnings: ['AI response could not be parsed as JSON. Please review manually.'],
          followUp: 'Please review this prescription manually.',
          signature: 'Digital signature placeholder'
        },
        disclaimer: SAFETY_DISCLAIMER,
        notes: 'AI response could not be parsed as JSON. Please review manually.',
        rawResponse: aiResponse
      };
    }

    // Add safety disclaimer and warnings
    const finalResponse = {
      ...parsedResponse,
      disclaimer: SAFETY_DISCLAIMER,
      warnings: [
        ...recommendationsSafety.warnings,
        ...contextSafety.warnings
      ],
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(
      AIResponseFormatter.formatSuccessResponse(finalResponse),
      { status: 200 }
    );

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