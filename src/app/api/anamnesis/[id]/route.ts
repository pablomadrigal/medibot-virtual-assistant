import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AnamnesisRepository } from '@/repositories/AnamnesisRepository';
import { 
  formatSuccessResponse,
  formatErrorResponse
} from '@/lib/api/transformers';
import { isValidUUID } from '@/lib/api/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const UpdateAnamnesisSchema = z.object({
  reasonForVisit: z.string().min(1, 'Reason for visit is required').max(1000, 'Reason too long').optional(),
  symptoms: z.string().min(1, 'Symptoms are required').max(2000, 'Symptoms description too long').optional(),
  duration: z.string().min(1, 'Duration is required').max(255, 'Duration description too long').optional(),
  aiSummary: z.string().optional(),
  aiRecommendations: z.any().optional(),
});

async function authCheck(anamnesisId: string) {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    if (authError || !user) {
      return { error: formatErrorResponse('UNAUTHORIZED', 'Authentication required.') };
    }

    const anamnesis = await AnamnesisRepository.findById(anamnesisId);
    if (!anamnesis) {
        return { error: formatErrorResponse('NOT_FOUND', 'Anamnesis record not found.') };
    }

    if (anamnesis.patientId !== user.id) {
        // Here we should also check for 'doctor' or 'admin' role, but for now this is fine
        return { error: formatErrorResponse('FORBIDDEN', 'You can only access your own data.') };
    }
  
    return { user, anamnesis };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isValidUUID(id)) {
      return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid anamnesis ID format'), { status: 400 });
    }

    const { error: authError, anamnesis } = await authCheck(id);
    if (authError) {
      const status = authError.error.code === 'UNAUTHORIZED' ? 401 : (authError.error.code === 'NOT_FOUND' ? 404 : 403);
      return NextResponse.json(authError, { status });
    }

    return NextResponse.json(formatSuccessResponse(anamnesis));

  } catch (error) {
    console.error('Error fetching anamnesis record:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to fetch anamnesis record'), { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!isValidUUID(id)) {
      return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid anamnesis ID format'), { status: 400 });
    }

    const { user, error: authError } = await authCheck(id);
    if (authError) {
        const status = authError.error.code === 'UNAUTHORIZED' ? 401 : (authError.error.code === 'NOT_FOUND' ? 404 : 403);
        return NextResponse.json(authError, { status });
    }

    const body = await request.json();
    const validationResult = UpdateAnamnesisSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(formatErrorResponse('VALIDATION_ERROR', 'Invalid anamnesis data', validationResult.error.issues), { status: 400 });
    }

    const updatedAnamnesis = await AnamnesisRepository.update(id, validationResult.data, user!.id);
    if (!updatedAnamnesis) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Anamnesis record not found for update'), { status: 404 });
    }

    return NextResponse.json(formatSuccessResponse(updatedAnamnesis, 'Anamnesis record updated successfully'));
  } catch (error) {
    console.error('Error updating anamnesis record:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to update anamnesis record'), { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!isValidUUID(id)) {
        return NextResponse.json(formatErrorResponse('INVALID_ID', 'Invalid anamnesis ID format'), { status: 400 });
    }

    const { user, error: authError } = await authCheck(id);
    if (authError) {
        const status = authError.error.code === 'UNAUTHORIZED' ? 401 : (authError.error.code === 'NOT_FOUND' ? 404 : 403);
        return NextResponse.json(authError, { status });
    }

    const success = await AnamnesisRepository.delete(id, user!.id);
    if (!success) {
      return NextResponse.json(formatErrorResponse('NOT_FOUND', 'Anamnesis record not found for deletion'), { status: 404 });
    }

    return NextResponse.json(formatSuccessResponse(null, 'Anamnesis record deleted successfully'));
  } catch (error) {
    console.error('Error deleting anamnesis record:', error);
    return NextResponse.json(formatErrorResponse('INTERNAL_ERROR', 'Failed to delete anamnesis record'), { status: 500 });
  }
}