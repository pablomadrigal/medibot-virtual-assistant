import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, AIErrorHandler, AIResponseFormatter, extractIdentifier } from '@/lib/ai/utils';
import { AIErrorResponseSchema } from '@/lib/ai/validation';

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

    // Parse request body
    const body = await request.json();
    
    // Basic validation
    if (!body.endpoint) {
      return NextResponse.json(
        AIResponseFormatter.formatErrorResponse('Endpoint parameter is required', 'MISSING_ENDPOINT'),
        { status: 400 }
      );
    }

    // Route to appropriate endpoint
    switch (body.endpoint) {
      case 'patient-analysis':
        return await handlePatientAnalysis(request);
      case 'doctor-recommendations':
        return await handleDoctorRecommendations(request);
      case 'prescription':
        return await handlePrescription(request);
      default:
        return NextResponse.json(
          AIResponseFormatter.formatErrorResponse('Invalid endpoint', 'INVALID_ENDPOINT'),
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('AI Controller Error:', error);
    
    const errorResponse = AIErrorHandler.handleOpenAIError(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

async function handlePatientAnalysis(request: NextRequest) {
  // This will be implemented in the patient-analysis route
  return NextResponse.json(
    AIResponseFormatter.formatErrorResponse('Patient analysis endpoint not implemented yet', 'NOT_IMPLEMENTED'),
    { status: 501 }
  );
}

async function handleDoctorRecommendations(request: NextRequest) {
  // This will be implemented in the doctor-recommendations route
  return NextResponse.json(
    AIResponseFormatter.formatErrorResponse('Doctor recommendations endpoint not implemented yet', 'NOT_IMPLEMENTED'),
    { status: 501 }
  );
}

async function handlePrescription(request: NextRequest) {
  // This will be implemented in the prescription route
  return NextResponse.json(
    AIResponseFormatter.formatErrorResponse('Prescription endpoint not implemented yet', 'NOT_IMPLEMENTED'),
    { status: 501 }
  );
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'AI Controller is running',
    endpoints: [
      'patient-analysis',
      'doctor-recommendations', 
      'prescription'
    ],
    timestamp: new Date().toISOString(),
  });
} 