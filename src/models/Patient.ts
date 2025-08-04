import { z } from 'zod'
import { PoolClient } from 'pg'
import { withDatabase, withTransaction } from '../lib/database'
import { encryptPatientData, decryptPatientData } from '../lib/encryption'

// Validation schemas
export const PatientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Name is required').max(255),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  encryptedData: z.any().optional(),
})

export const CreatePatientSchema = PatientSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

export type Patient = z.infer<typeof PatientSchema>
export type CreatePatientData = z.infer<typeof CreatePatientSchema>

export class PatientModel {
  // Validate patient data
  static validate(data: unknown): Patient {
    return PatientSchema.parse(data)
  }

  static validateCreate(data: unknown): CreatePatientData {
    return CreatePatientSchema.parse(data)
  }

  // Convert database row to Patient object
  static fromDatabaseRow(row: any): Patient {
    return {
      id: row.id,
      name: row.name,
      dateOfBirth: row.date_of_birth,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      encryptedData: row.encrypted_data ? decryptPatientData(row.encrypted_data) : null,
    }
  }

  // Convert Patient object to database format
  static toDatabaseRow(patient: CreatePatientData & { encryptedData?: any }) {
    return {
      name: patient.name,
      date_of_birth: patient.dateOfBirth,
      encrypted_data: patient.encryptedData ? encryptPatientData(patient.encryptedData) : null,
    }
  }

  // Validate date of birth
  static validateDateOfBirth(dateOfBirth: string): boolean {
    // Check format first (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(dateOfBirth)) {
      return false
    }
    
    const date = new Date(dateOfBirth)
    const now = new Date()
    
    // Check if date is valid and not in the future
    return !isNaN(date.getTime()) && date <= now
  }

  // Calculate age from date of birth
  static calculateAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    
    return age
  }
}