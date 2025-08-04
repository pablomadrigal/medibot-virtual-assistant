import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Anamnesis } from '@/types'
import { 
  formatSuccessResponse,
  formatErrorResponse,
  parsePaginationParams,
  formatPaginatedResponse
} from '@/lib/api/transformers'

// Validation schemas
const CreateAnamnesisSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(1000, 'Reason too long'),
  symptoms: z.string().min(1, 'Symptoms are required').max(2000, 'Symptoms description too long'),
  duration: z.string().min(1, 'Duration is required').max(255, 'Duration description too long'),
  aiSummary: z.string().optional(),
  aiRecommendations: z.array(z.string()).optional()
})

// GET /api/anamnesis - Get all anamnesis records with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paginationParams = parsePaginationParams(searchParams)
    const patientId = searchParams.get('patientId')
    
    // Validate patientId if provided
    if (patientId && !z.string().uuid().safeParse(patientId).success) {
      const errorResponse = formatErrorResponse(
        'INVALID_PATIENT_ID',
        'Invalid patient ID format'
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }
    
    // TODO: Implement database query to get anamnesis records with pagination
    // Filter by patientId if provided
    // For now, return mock data
    const anamnesisRecords: Anamnesis[] = []
    const total = 0
    
    const response = formatPaginatedResponse(anamnesisRecords, total, paginationParams)
    
    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching anamnesis records:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to fetch anamnesis records'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

// POST /api/anamnesis - Create new anamnesis record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request body
    const validationResult = CreateAnamnesisSchema.safeParse(body)
    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(
        'VALIDATION_ERROR',
        'Invalid anamnesis data',
        validationResult.error.issues
      )
      return NextResponse.json(errorResponse, { status: 400 })
    }

    const { patientId, reasonForVisit, symptoms, duration, aiSummary, aiRecommendations } = validationResult.data

    // TODO: Verify that patient exists before creating anamnesis
    // TODO: Implement database insertion
    // For now, create mock anamnesis record
    const newAnamnesis: Anamnesis = {
      id: crypto.randomUUID(),
      patientId,
      reasonForVisit,
      symptoms,
      duration,
      aiSummary,
      aiRecommendations,
      createdAt: new Date()
    }

    const response = formatSuccessResponse(newAnamnesis, 'Anamnesis record created successfully')
    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Error creating anamnesis record:', error)
    const errorResponse = formatErrorResponse(
      'INTERNAL_ERROR',
      'Failed to create anamnesis record'
    )
    return NextResponse.json(errorResponse, { status: 500 })
  }
}