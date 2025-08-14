import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AnamnesisRepository } from '@/repositories/AnamnesisRepository';
import { PatientRepository } from '@/repositories/PatientRepository';
import { 
  formatSuccessResponse,
  formatErrorResponse,
} from '@/lib/api/transformers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const CreateAnamnesisSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID format'),
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(1000, 'Reason too long'),
  symptoms: z.string().min(1, 'Symptoms are required').max(2000, 'Symptoms description too long'),
  duration: z.string().min(1, 'Duration is required').max(255, 'Duration description too long'),
  aiSummary: z.string().optional(),
  aiRecommendations: z.any().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(formatErrorResponse('UNAUTHORIZED', 'Authentication required.'), { status: 401 });
    }

    const body = await request.json();
    
    const validationResult = CreateAnamnesisSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(formatErrorResponse('VALIDATION_ERROR', 'Invalid anamnesis data', validationResult.error.issues), { status: 400 });
    }

    const { patientId } = validationResult.data;

    // A patient can only create an anamnesis for themselves.
    if (user.id !== patientId) {
        return NextResponse.json(formatErrorResponse('FORBIDDEN', 'You can only create an anamnesis for yourself.'), { status: 403 });
    }

    // Verify patient exists
    const patientExists = await PatientRepository.exists(patientId);
    if (!patientExists) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Patient not found.'), { status: 404 });
    }

    const newAnamnesis = await AnamnesisRepository.create(validationResult.data, user.id);

    return NextResponse.json(formatSuccessResponse(newAnamnesis, 'Anamnesis record created successfully'), { status: 201 });

  } catch (error) {
    console.error('Error creating anamnesis record:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to create anamnesis record'), { status: 500 });
  }
}