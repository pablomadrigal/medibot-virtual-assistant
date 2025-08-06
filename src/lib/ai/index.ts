// AI Library Exports

// Client and configuration
export { openai, AI_CONFIG, RATE_LIMIT_CONFIG, MEDICAL_SAFETY_CONFIG } from './client';

// Validation schemas and types
export {
  PatientAnalysisRequestSchema,
  DoctorRecommendationsRequestSchema,
  PrescriptionRequestSchema,
  AIResponseSchema,
  AIErrorResponseSchema,
  RateLimitErrorSchema,
  type PatientAnalysisRequest,
  type DoctorRecommendationsRequest,
  type PrescriptionRequest,
  type AIResponse,
  type AIErrorResponse,
} from './validation';

// Utility functions and classes
export {
  RateLimiter,
  AIErrorHandler,
  AIResponseFormatter,
  AISafetyChecker,
  generateRequestId,
  sanitizeInput,
  extractIdentifier,
  callOpenAI,
} from './utils';

// Prompt templates
export {
  PATIENT_ANALYSIS_SYSTEM_PROMPT,
  PATIENT_ANALYSIS_USER_PROMPT,
  DOCTOR_RECOMMENDATIONS_SYSTEM_PROMPT,
  DOCTOR_RECOMMENDATIONS_USER_PROMPT,
  PRESCRIPTION_SYSTEM_PROMPT,
  PRESCRIPTION_USER_PROMPT,
  SAFETY_DISCLAIMER,
  EMERGENCY_WARNING,
} from './prompts'; 