import { NextRequest } from 'next/server';
import { POST, GET } from '../patient-analysis/route';

// Mock NextRequest
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((url, init) => ({
    url,
    method: init?.method || 'GET',
    headers: new Map(Object.entries(init?.headers || {})),
    json: jest.fn().mockResolvedValue({}),
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      json: jest.fn().mockResolvedValue(data),
    })),
  },
}));

// Mock the AI utilities
jest.mock('@/lib/ai/utils', () => ({
  RateLimiter: {
    checkRateLimit: jest.fn().mockReturnValue({ allowed: true })
  },
  AIErrorHandler: {
    handleOpenAIError: jest.fn().mockReturnValue({
      success: false,
      error: 'AI service error',
      code: 'SERVICE_ERROR',
      timestamp: new Date().toISOString()
    })
  },
  AIResponseFormatter: {
    formatSuccessResponse: jest.fn().mockReturnValue({
      success: true,
      data: {},
      timestamp: new Date().toISOString()
    }),
    formatErrorResponse: jest.fn().mockReturnValue({
      success: false,
      error: 'Test error',
      code: 'TEST_ERROR',
      timestamp: new Date().toISOString()
    })
  },
  extractIdentifier: jest.fn().mockReturnValue('test-identifier'),
  callOpenAI: jest.fn().mockResolvedValue('{"summary": "Test analysis"}'),
  sanitizeInput: jest.fn().mockImplementation((input) => input),
  AISafetyChecker: {
    checkMedicalSafety: jest.fn().mockReturnValue({ safe: true, warnings: [] })
  }
}));

// Mock the validation schemas
jest.mock('@/lib/ai/validation', () => ({
  PatientAnalysisRequestSchema: {
    safeParse: jest.fn().mockReturnValue({
      success: true,
      data: {
        patientDescription: 'Test description',
        patientAge: 35,
        patientGender: 'female'
      }
    })
  }
}));

// Mock the prompts
jest.mock('@/lib/ai/prompts', () => ({
  PATIENT_ANALYSIS_SYSTEM_PROMPT: 'Test system prompt',
  PATIENT_ANALYSIS_USER_PROMPT: jest.fn().mockReturnValue('Test user prompt'),
  SAFETY_DISCLAIMER: 'Test disclaimer'
}));

describe('Patient Analysis Endpoint', () => {
  let mockRequest: NextRequest;

  beforeEach(() => {
    mockRequest = new NextRequest('http://localhost:3000/api/ai/patient-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  });

  describe('POST /api/ai/patient-analysis', () => {
    it('should return 200 for valid request', async () => {
      const body = {
        patientDescription: 'Patient has been experiencing headaches for the past week',
        patientAge: 35,
        patientGender: 'female'
      };

      mockRequest = new NextRequest('http://localhost:3000/api/ai/patient-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should return 400 for invalid request', async () => {
      const { PatientAnalysisRequestSchema } = require('@/lib/ai/validation');
      PatientAnalysisRequestSchema.safeParse.mockReturnValue({
        success: false,
        error: {
          errors: [{ message: 'Patient description must be at least 10 characters' }]
        }
      });

      const body = {
        patientDescription: 'Too short' // Less than 10 characters
      };

      mockRequest = new NextRequest('http://localhost:3000/api/ai/patient-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });

    it('should return 429 for rate limit exceeded', async () => {
      const { RateLimiter } = require('@/lib/ai/utils');
      RateLimiter.checkRateLimit.mockReturnValue({ 
        allowed: false, 
        retryAfter: 60 
      });

      const body = {
        patientDescription: 'Patient has been experiencing headaches for the past week'
      };

      mockRequest = new NextRequest('http://localhost:3000/api/ai/patient-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const response = await POST(mockRequest);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toBe('Rate limit exceeded');
    });
  });

  describe('GET /api/ai/patient-analysis', () => {
    it('should return endpoint information', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Patient Analysis endpoint is running');
      expect(data.requiredFields).toContain('patientDescription (string, min 10 chars)');
    });
  });
}); 