import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PatientRepository } from '@/repositories/PatientRepository';
import {
  formatSuccessResponse,
  formatErrorResponse,
  parsePaginationParams,
  formatPaginatedResponse,
} from '@/lib/api/transformers';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const CreatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  encryptedData: z.any().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paginationParams = parsePaginationParams(searchParams);

    const { patients, total } = await PatientRepository.findAll(
      paginationParams.page,
      paginationParams.limit
    );

    const response = formatPaginatedResponse(patients, total, paginationParams);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching patients:', error);
    const errorResponse = formatErrorResponse('INTERNAL_ERROR', 'Failed to fetch patients');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(formatErrorResponse('UNAUTHORIZED', 'Authentication required.'), { status: 401 });
    }

    const body = await request.json();
    const validationResult = CreatePatientSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(
        'VALIDATION_ERROR',
        'Invalid patient data',
        validationResult.error.issues
      );
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const newPatient = await PatientRepository.create(validationResult.data, user.id);
    const response = formatSuccessResponse(newPatient, 'Patient created successfully');
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating patient:', error);
    const errorResponse = formatErrorResponse('INTERNAL_ERROR', 'Failed to create patient');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}