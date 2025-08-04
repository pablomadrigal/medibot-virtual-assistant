import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Patient } from '@/types'
import {
  transformPatientForResponse,
  sanitizePatientInput,
  formatSuccessResponse,
  formatErrorResponse
} from '@/lib/api/transformers'
import { isValidUUID } from '@/lib/api/middleware'

// Validation schemas
const UpdatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  encryptedData: z.any().optional()
})

// GET /api/patients/[id] - Get patient by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format
    if (!isValidUUID(id)) {
      const errorResponse = formatErrorResponse(
        'INVALID_ID',
        'Invalid patient ID format'
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // TODO: Implement database query to get patient by ID
    // For now, return mock data or not found
    const patient: Patient | null = null

    if (!patient) {
      const errorResponse = formatErrorResponse(
        'NOT_FOUND',
        'Patient not found'
      )
      return NextResponse.json(errorResponse, { status: 404 })
    }

    const transformedPatient = transformPatientForResponse(patient)
    const response = formatSuccessResponse(transformedPatient)
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching patient:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch patient'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// PUT /api/patients/[id] - Update patient by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Validate UUID format
    if (!isValidUUID(id)) {
      const errorResponse = formatErrorResponse(
        'INVALID_ID',
        'Invalid patient ID format'
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // Sanitize input data
    const sanitizedInput = sanitizePatientInput(body)

    // Validate request body
    const validationResult = UpdatePatientSchema.safeParse(sanitizedInput)
    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(
        'VALIDATION_ERROR',
        'Invalid patient data',
        validationResult.error.issues
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // TODO: Implement database update
    // For now, return mock updated patient
    const updatedPatient: Patient = {
      id,
      name: validationResult.data.name || 'Mock Patient',
      dateOfBirth: validationResult.data.dateOfBirth || '1990-01-01',
      encryptedData: validationResult.data.encryptedData,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date()
    }

    const transformedPatient = transformPatientForResponse(updatedPatient)
    const response = formatSuccessResponse(transformedPatient, 'Patient updated successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error updating patient:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to update patient'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// DELETE /api/patients/[id] - Delete patient by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Validate UUID format
    if (!isValidUUID(id)) {
      const errorResponse = formatErrorResponse(
        'INVALID_ID',
        'Invalid patient ID format'
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // TODO: Implement database deletion
    // For now, simulate successful deletion

    const response = formatSuccessResponse(null, 'Patient deleted successfully')
    return NextResponse.json(response)

  } catch (error) {
    console.error('Error deleting patient:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to delete patient'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}