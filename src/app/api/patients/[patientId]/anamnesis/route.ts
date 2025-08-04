import { NextRequest, NextResponse } from 'next/server'
import { Anamnesis } from '@/types'
import { 
  formatSuccessResponse,
  formatErrorResponse,
  parsePaginationParams,
  formatPaginatedResponse
} from '@/lib/api/transformers'
import { isValidUUID } from '@/lib/api/middleware'

// GET /api/patients/[patientId]/anamnesis - Get all anamnesis records for a specific patient
export async function GET(
  request: NextRequest,
  { params }: { params: { patientId: string } }
) {
  try {
    const { patientId } = params
    const { searchParams } = new URL(request.url)
    const paginationParams = parsePaginationParams(searchParams)

    // Validate UUID format
    if (!isValidUUID(patientId)) {
      const errorResponse = formatErrorResponse(
        'INVALID_PATIENT_ID',
        'Invalid patient ID format'
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // TODO: Verify that patient exists
    // TODO: Implement database query to get anamnesis records for specific patient
    // For now, return mock data
    const anamnesisRecords: Anamnesis[] = []
    const total = 0
    
    const response = formatPaginatedResponse(anamnesisRecords, total, paginationParams)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching patient anamnesis records:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch patient anamnesis records'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}