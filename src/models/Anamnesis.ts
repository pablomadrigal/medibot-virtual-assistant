import { z } from 'zod'

// Validation schemas
export const AnamnesisSchema = z.object({
  id: z.string().uuid().optional(),
  patientId: z.string().uuid('Invalid patient ID'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(1000),
  symptoms: z.string().min(1, 'Symptoms are required').max(2000),
  duration: z.string().min(1, 'Duration is required').max(255),
  aiSummary: z.string().max(2000).optional(),
  aiRecommendations: z.array(z.string()).optional(),
  createdAt: z.date().optional(),
})

export const CreateAnamnesisSchema = AnamnesisSchema.omit({ 
  id: true, 
  createdAt: true 
})

export type Anamnesis = z.infer<typeof AnamnesisSchema>
export type CreateAnamnesisData = z.infer<typeof CreateAnamnesisSchema>

export class AnamnesisModel {
  // Validate anamnesis data
  static validate(data: unknown): Anamnesis {
    return AnamnesisSchema.parse(data)
  }

  static validateCreate(data: unknown): CreateAnamnesisData {
    return CreateAnamnesisSchema.parse(data)
  }

  // Convert database row to Anamnesis object
  static fromDatabaseRow(row: any): Anamnesis {
    return {
      id: row.id,
      patientId: row.patient_id,
      reasonForVisit: row.reason_for_visit,
      symptoms: row.symptoms,
      duration: row.duration,
      aiSummary: row.ai_summary,
      aiRecommendations: row.ai_recommendations || [],
      createdAt: row.created_at,
    }
  }

  // Convert Anamnesis object to database format
  static toDatabaseRow(anamnesis: CreateAnamnesisData) {
    return {
      patient_id: anamnesis.patientId,
      reason_for_visit: anamnesis.reasonForVisit,
      symptoms: anamnesis.symptoms,
      duration: anamnesis.duration,
      ai_summary: anamnesis.aiSummary,
      ai_recommendations: anamnesis.aiRecommendations ? JSON.stringify(anamnesis.aiRecommendations) : null,
    }
  }

  // Validate medical data format
  static validateMedicalData(data: {
    reasonForVisit: string
    symptoms: string
    duration: string
  }): boolean {
    try {
      // Check for minimum required information
      if (!data.reasonForVisit.trim() || !data.symptoms.trim() || !data.duration.trim()) {
        return false
      }

      // Basic validation for duration format (should contain time indicators)
      const durationPattern = /(day|week|month|year|hour|minute)s?/i
      if (!durationPattern.test(data.duration)) {
        return false
      }

      return true
    } catch {
      return false
    }
  }

  // Extract key medical terms from symptoms
  static extractMedicalTerms(symptoms: string): string[] {
    const medicalTerms = [
      'headache', 'fever', 'cough', 'nausea', 'vomiting', 'diarrhea',
      'fatigue', 'dizziness', 'chest pain', 'shortness of breath',
      'abdominal pain', 'back pain', 'joint pain', 'muscle pain',
      'rash', 'swelling', 'bleeding', 'numbness', 'tingling'
    ]

    const foundTerms: string[] = []
    const lowerSymptoms = symptoms.toLowerCase()

    medicalTerms.forEach(term => {
      if (lowerSymptoms.includes(term)) {
        foundTerms.push(term)
      }
    })

    return foundTerms
  }

  // Generate severity assessment based on symptoms
  static assessSeverity(symptoms: string): 'low' | 'medium' | 'high' {
    const highSeverityKeywords = [
      'severe', 'intense', 'unbearable', 'excruciating', 'emergency',
      'chest pain', 'difficulty breathing', 'unconscious', 'bleeding heavily'
    ]
    
    const mediumSeverityKeywords = [
      'moderate', 'persistent', 'worsening', 'recurring', 'chronic'
    ]

    const lowerSymptoms = symptoms.toLowerCase()

    if (highSeverityKeywords.some(keyword => lowerSymptoms.includes(keyword))) {
      return 'high'
    }

    if (mediumSeverityKeywords.some(keyword => lowerSymptoms.includes(keyword))) {
      return 'medium'
    }

    return 'low'
  }
}