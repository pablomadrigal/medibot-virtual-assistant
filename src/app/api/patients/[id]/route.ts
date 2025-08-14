import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { PatientRepository } from '@/repositories/PatientRepository';
import {
  formatSuccessResponse,
  formatErrorResponse,
} from '@/lib/api/transformers';
import { isValidUUID } from '@/lib/api/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const UpdatePatientSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  encryptedData: z.any().optional(),
});

async function authCheck(id: string) {
  const supabase = createServerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: formatErrorResponse('UNAUTHORIZED', 'Authentication required.') };
  }
  if (user.id !== id) {
    return { error: formatErrorResponse('FORBIDDEN', 'You can only access your own data.') };
  }
  return { user };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid patient ID format'), { status: 400 });
    }

    const { error: authError } = await authCheck(id);
    if (authError) {
      return NextResponse.json(authError, { status: authError.error.code === 'UNAUTHORIZED' ? 401 : 403 });
    }

    const patient = await PatientRepository.findById(id);
    if (!patient) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Patient not found'), { status: 404 });
    }

    return NextResponse.json(formatSuccessResponse(patient));
  } catch (error) {
    console.error('Error fetching patient:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to fetch patient'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid patient ID format'), { status: 400 });
    }

    const { user, error: authError } = await authCheck(id);
    if (authError) {
      return NextResponse.json(authError, { status: authError.error.code === 'UNAUTHORIZED' ? 401 : 403 });
    }

    const body = await request.json();
    const validationResult = UpdatePatientSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(formatErrorResponse('VALIDATION_ERROR', 'Invalid patient data', validationResult.error.issues), { status: 400 });
    }

    const updatedPatient = await PatientRepository.update(id, validationResult.data, user!.id);
    if (!updatedPatient) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Patient not found for update'), { status: 404 });
    }

    return NextResponse.json(formatSuccessResponse(updatedPatient, 'Patient updated successfully'));
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to update patient'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid patient ID format'), { status: 400 });
    }

    const { user, error: authError } = await authCheck(id);
    if (authError) {
      return NextResponse.json(authError, { status: authError.error.code === 'UNAUTHORIZED' ? 401 : 403 });
    }

    const success = await PatientRepository.delete(id, user!.id);
    if (!success) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Patient not found for deletion'), { status: 404 });
    }

    return NextResponse.json(formatSuccessResponse(null, 'Patient deleted successfully'));
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to delete patient'), { status: 500 });
  }
}