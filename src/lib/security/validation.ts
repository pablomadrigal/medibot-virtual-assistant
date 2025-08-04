import { z } from 'zod';

// Common validation schemas
export const commonSchemas = {
  // UUID validation
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Email validation
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
  
  // Password validation (strong password requirements)
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'Password must contain uppercase, lowercase, number, and special character'),
  
  // Name validation (allows letters, spaces, hyphens, apostrophes)
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name contains invalid characters'),
  
  // Date validation
  dateOfBirth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .refine((date) => {
      const parsed = new Date(date);
      const now = new Date();
      const age = now.getFullYear() - parsed.getFullYear();
      return age >= 0 && age <= 150;
    }, 'Invalid date of birth'),
  
  // Medical text validation (allows medical terminology)
  medicalText: z.string()
    .min(1, 'Medical information is required')
    .max(5000, 'Text too long')
    .regex(/^[a-zA-Z0-9\s\-.,;:()\/\n\r]+$/, 'Contains invalid characters'),
  
  // Duration validation (e.g., "2 days", "1 week", "3 months")
  duration: z.string()
    .min(1, 'Duration is required')
    .max(100, 'Duration description too long')
    .regex(/^[a-zA-Z0-9\s\-.,]+$/, 'Duration contains invalid characters'),
  
  // Session ID validation
  sessionId: z.string()
    .min(10, 'Invalid session ID')
    .max(128, 'Session ID too long')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Session ID contains invalid characters'),
  
  // Role validation
  userRole: z.enum(['patient', 'doctor', 'admin']),
  
  // Consultation status validation
  consultationStatus: z.enum(['pending', 'in-progress', 'completed', 'cancelled'])
};

// Patient data validation schemas
export const patientSchemas = {
  createPatient: z.object({
    name: commonSchemas.name,
    dateOfBirth: commonSchemas.dateOfBirth,
    email: commonSchemas.email.optional()
  }),
  
  updatePatient: z.object({
    name: commonSchemas.name.optional(),
    dateOfBirth: commonSchemas.dateOfBirth.optional(),
    email: commonSchemas.email.optional()
  })
};

// Anamnesis validation schemas
export const anamnesisSchemas = {
  createAnamnesis: z.object({
    patientId: commonSchemas.uuid,
    reasonForVisit: commonSchemas.medicalText,
    symptoms: commonSchemas.medicalText,
    duration: commonSchemas.duration
  }),
  
  updateAnamnesis: z.object({
    reasonForVisit: commonSchemas.medicalText.optional(),
    symptoms: commonSchemas.medicalText.optional(),
    duration: commonSchemas.duration.optional(),
    aiSummary: z.string().max(2000, 'AI summary too long').optional(),
    aiRecommendations: z.array(z.string().max(500, 'Recommendation too long')).optional()
  })
};

// Authentication validation schemas
export const authSchemas = {
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required')
  }),
  
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    role: commonSchemas.userRole
  }),
  
  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required')
  })
};

// Conversation validation schemas
export const conversationSchemas = {
  startConversation: z.object({
    sessionId: commonSchemas.sessionId.optional()
  }),
  
  sendMessage: z.object({
    sessionId: commonSchemas.sessionId,
    message: z.string()
      .min(1, 'Message cannot be empty')
      .max(1000, 'Message too long')
      .trim()
  })
};

// Consultation validation schemas
export const consultationSchemas = {
  createConsultation: z.object({
    patientId: commonSchemas.uuid,
    anamnesisId: commonSchemas.uuid
  }),
  
  updateConsultation: z.object({
    status: commonSchemas.consultationStatus.optional(),
    doctorNotes: z.string().max(5000, 'Doctor notes too long').optional()
  }),
  
  addDoctorNotes: z.object({
    notes: z.string()
      .min(1, 'Notes cannot be empty')
      .max(5000, 'Notes too long')
  })
};

// Input sanitization utilities
export class InputSanitizer {
  /**
   * Remove potentially dangerous HTML/script content
   */
  static sanitizeHtml(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  /**
   * Sanitize SQL input (basic protection, use parameterized queries primarily)
   */
  static sanitizeSql(input: string): string {
    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .trim();
  }

  /**
   * Sanitize medical text input
   */
  static sanitizeMedicalText(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Normalize whitespace
   */
  static normalizeWhitespace(input: string): string {
    return input
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Replace multiple newlines with single newline
      .trim();
  }

  /**
   * Sanitize name input
   */
  static sanitizeName(input: string): string {
    return input
      .replace(/[^a-zA-Z\s\-']/g, '') // Only allow letters, spaces, hyphens, apostrophes
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  /**
   * Comprehensive input sanitization
   */
  static sanitizeInput(input: string, type: 'html' | 'sql' | 'medical' | 'name' | 'general' = 'general'): string {
    let sanitized = input;

    // Apply type-specific sanitization
    switch (type) {
      case 'html':
        sanitized = this.sanitizeHtml(sanitized);
        break;
      case 'sql':
        sanitized = this.sanitizeSql(sanitized);
        break;
      case 'medical':
        sanitized = this.sanitizeMedicalText(sanitized);
        break;
      case 'name':
        sanitized = this.sanitizeName(sanitized);
        break;
      case 'general':
      default:
        sanitized = this.sanitizeHtml(sanitized);
        break;
    }

    // Always normalize whitespace
    return this.normalizeWhitespace(sanitized);
  }
}

// Validation middleware helper
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  };
}

// Export all schemas for easy access
export const validationSchemas = {
  common: commonSchemas,
  patient: patientSchemas,
  anamnesis: anamnesisSchemas,
  auth: authSchemas,
  conversation: conversationSchemas,
  consultation: consultationSchemas
};