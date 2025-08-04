import { Patient, Anamnesis, Consultation } from '@/types'

// Patient data transformers
export function transformPatientForResponse(patient: Patient): Patient {
  return {
    id: patient.id,
    name: patient.name,
    dateOfBirth: patient.dateOfBirth,
    createdAt: patient.createdAt,
    updatedAt: patient.updatedAt,
    // Don't expose encrypted data in responses
    ...(patient.encryptedData && { encryptedData: '[ENCRYPTED]' })
  }
}

export function transformPatientListForResponse(patients: Patient[]): Patient[] {
  return patients.map(transformPatientForResponse)
}

// Request data sanitizers
export function sanitizePatientInput(input: any): Partial<Patient> {
  const sanitized: Partial<Patient> = {}
  
  if (input.name && typeof input.name === 'string') {
    sanitized.name = input.name.trim()
  }
  
  if (input.dateOfBirth && typeof input.dateOfBirth === 'string') {
    sanitized.dateOfBirth = input.dateOfBirth.trim()
  }
  
  if (input.encryptedData) {
    sanitized.encryptedData = input.encryptedData
  }
  
  return sanitized
}

// Response formatters
export function formatSuccessResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, any>
) {
  return {
    success: true,
    data,
    ...(message && { message }),
    ...(meta && { meta })
  }
}

export function formatErrorResponse(
  code: string,
  message: string,
  details?: any
) {
  return {
    error: {
      code,
      message,
      ...(details && { details }),
      timestamp: new Date().toISOString()
    }
  }
}

// Pagination helpers
export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = parseInt(searchParams.get('page') || '1', 10)
  const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 100) // Max 100 items per page
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  
  return {
    page: Math.max(1, page),
    limit: Math.max(1, limit),
    sortBy,
    sortOrder
  }
}

export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
) {
  const { page = 1, limit = 10 } = params
  const totalPages = Math.ceil(total / limit)
  
  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  }
}