import { z } from 'zod'

// Validation schemas
export const ConsultationStatusSchema = z.enum(['pending', 'in-progress', 'completed', 'cancelled'])

export const ConsultationSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid('Invalid patient ID'),
  anamnesisId: z.string().uuid('Invalid anamnesis ID'),
  status: ConsultationStatusSchema.default('pending'),
  doctorNotes: z.string().max(5000).optional(),
  reviewedAt: z.date().optional(),
  createdAt: z.date().optional(),
})

export const CreateConsultationSchema = ConsultationSchema.omit({ 
  id: true, 
  createdAt: true,
  reviewedAt: true
})

export type ConsultationStatus = z.infer<typeof ConsultationStatusSchema>
export type Consultation = z.infer<typeof ConsultationSchema>
export type CreateConsultationData = z.infer<typeof CreateConsultationSchema>

export class ConsultationModel {
  // Validate consultation data
  static validate(data: unknown): Consultation {
    return ConsultationSchema.parse(data)
  }

  static validateCreate(data: unknown): CreateConsultationData {
    return CreateConsultationSchema.parse(data)
  }

  // Convert database row to Consultation object
  static fromDatabaseRow(row: any): Consultation {
    return {
      id: row.id,
      patientId: row.patient_id,
      anamnesisId: row.anamnesis_id,
      status: row.status as ConsultationStatus,
      doctorNotes: row.doctor_notes,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
    }
  }

  // Convert Consultation object to database format
  static toDatabaseRow(consultation: CreateConsultationData) {
    return {
      patient_id: consultation.patientId,
      anamnesis_id: consultation.anamnesisId,
      status: consultation.status,
      doctor_notes: consultation.doctorNotes,
    }
  }

  // Check if status transition is valid
  static isValidStatusTransition(currentStatus: ConsultationStatus, newStatus: ConsultationStatus): boolean {
    const validTransitions: Record<ConsultationStatus, ConsultationStatus[]> = {
      'pending': ['in-progress', 'cancelled'],
      'in-progress': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': [], // No transitions from cancelled
    }

    return validTransitions[currentStatus].includes(newStatus)
  }

  // Get status priority for sorting (higher number = higher priority)
  static getStatusPriority(status: ConsultationStatus): number {
    const priorities = {
      'pending': 3,
      'in-progress': 4,
      'completed': 1,
      'cancelled': 0,
    }
    return priorities[status]
  }

  // Check if consultation requires immediate attention
  static requiresImmediateAttention(consultation: Consultation, anamnesisSymptoms?: string): boolean {
    // High priority if in-progress for too long
    if (consultation.status === 'in-progress' && consultation.createdAt) {
      const hoursSinceCreated = (Date.now() - consultation.createdAt.getTime()) / (1000 * 60 * 60)
      if (hoursSinceCreated > 24) {
        return true
      }
    }

    // High priority based on symptoms
    if (anamnesisSymptoms) {
      const urgentKeywords = [
        'chest pain', 'difficulty breathing', 'severe pain', 'bleeding',
        'unconscious', 'emergency', 'urgent', 'critical'
      ]
      
      const lowerSymptoms = anamnesisSymptoms.toLowerCase()
      return urgentKeywords.some(keyword => lowerSymptoms.includes(keyword))
    }

    return false
  }

  // Calculate consultation duration
  static calculateDuration(consultation: Consultation): number | null {
    if (!consultation.createdAt) return null
    
    const endTime = consultation.reviewedAt || new Date()
    return Math.round((endTime.getTime() - consultation.createdAt.getTime()) / (1000 * 60)) // Duration in minutes
  }

  // Validate doctor notes
  static validateDoctorNotes(notes: string): boolean {
    if (!notes || notes.trim().length === 0) {
      return false
    }

    // Check for minimum meaningful content
    const wordCount = notes.trim().split(/\s+/).length
    return wordCount >= 5 // At least 5 words
  }
}