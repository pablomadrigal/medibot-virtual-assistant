import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Patient } from '@/types'
import { 
  transformPatientListForResponse, 
  sanitizePatientInput,
  formatSuccessResponse,
  formatErrorResponse,
  parsePaginationParams,
  formatPaginatedResponse
} from '@/lib/api/transformers'

// Validation schemas
const CreatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  encryptedData: z.any().optional()
})

const UpdatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  encryptedData: z.any().optional()
})

// GET /api/patients - Get all patients with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paginationParams = parsePaginationParams(searchParams)
    
    // TODO: Implement database query to get patients with pagination
    // For now, return mock data
    const patients: Patient[] = []
    const total = 0
    
    const transformedPatients = transformPatientListForResponse(patients)
    const response = formatPaginatedResponse(transformedPatients, total, paginationParams)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching patients:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch patients'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// POST /api/patients - Create new patient
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Sanitize input data
    const sanitizedInput = sanitizePatientInput(body)
    
    // Validate request body
    const validationResult = CreatePatientSchema.safeParse(sanitizedInput)
    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(
        'VALIDATION_ERROR',
        'Invalid patient data',
        validationResult.error.issues
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { name, dateOfBirth, encryptedData } = validationResult.data

    // TODO: Implement database insertion
    // For now, create mock patient
    const newPatient: Patient = {
      id: crypto.randomUUID(),
      name,
      dateOfBirth,
      encryptedData,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const response = formatSuccessResponse(newPatient, 'Patient created successfully')
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating patient:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to create patient'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}