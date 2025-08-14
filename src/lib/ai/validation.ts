import { z } from 'zod';

// Base AI request schema
export const BaseAIRequestSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  timestamp: z.string().optional(),
});

// Patient analysis request schema
export const PatientAnalysisRequestSchema = BaseAIRequestSchema.extend({
  anamnesisId: z.string().uuid().optional(),
  patientDescription: z.string().min(10, 'Patient description must be at least 10 characters').max(2000, 'Patient description too long'),
  symptoms: z.array(z.string()).optional(),
  duration: z.string().optional(),
  patientAge: z.number().min(0).max(120).optional(),
  patientGender: z.enum(['male', 'female', 'other']).optional(),
  medicalHistory: z.string().optional(),
  currentMedications: z.array(z.string()).optional(),
});

// Doctor recommendations request schema
export const DoctorRecommendationsRequestSchema = BaseAIRequestSchema.extend({
  patientAnalysis: z.string().min(10, 'Patient analysis must be at least 10 characters'),
  doctorNotes: z.string().min(5, 'Doctor notes must be at least 5 characters').max(1000, 'Doctor notes too long'),
  patientId: z.string().optional(),
  consultationId: z.string().optional(),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).optional(),
});

// Prescription generation request schema
export const PrescriptionRequestSchema = BaseAIRequestSchema.extend({
  doctorRecommendations: z.string().min(10, 'Doctor recommendations must be at least 10 characters'),
  patientId: z.string().optional(),
  doctorId: z.string().optional(),
  consultationId: z.string().optional(),
  additionalContext: z.string().optional(),
  prescriptionType: z.enum(['medication', 'examination', 'referral', 'lifestyle']).optional(),
});

// AI response schema
export const AIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  error: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string().optional(),
  disclaimer: z.string().optional(),
});

// Error response schema
export const AIErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.string().optional(),
  timestamp: z.string(),
  requestId: z.string().optional(),
});

// Rate limit error schema
export const RateLimitErrorSchema = z.object({
  success: z.literal(false),
  error: z.literal('Rate limit exceeded'),
  retryAfter: z.number(),
  timestamp: z.string(),
});

// Type exports
export type PatientAnalysisRequest = z.infer<typeof PatientAnalysisRequestSchema>;
export type DoctorRecommendationsRequest = z.infer<typeof DoctorRecommendationsRequestSchema>;
export type PrescriptionRequest = z.infer<typeof PrescriptionRequestSchema>;
export type AIResponse = z.infer<typeof AIResponseSchema>;
export type AIErrorResponse = z.infer<typeof AIErrorResponseSchema>; 