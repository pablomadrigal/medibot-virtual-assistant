import { NextRequest, NextResponse } from 'next/server';
import { AnamnesisRepository } from '@/repositories/AnamnesisRepository';
import {
  formatSuccessResponse,
  formatErrorResponse,
} from '@/lib/api/transformers';
import { isValidUUID } from '@/lib/api/middleware';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function authCheck(patientId: string) {
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
  
    if (authError || !user) {
      return { error: formatErrorResponse('UNAUTHORIZED', 'Authentication required.') };
    }
    // A doctor/admin should be able to see any patient's anamnesis. A patient can only see their own.
    // This logic should be handled by RLS, but we can double-check here.
    // For now, we'll rely on RLS and just check for a valid session.
    
    return { user };
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: patientId } = params;

    if (!isValidUUID(patientId)) {
      return NextResponse.json(formatErrorResponse('INVALID_PATIENT_ID','Invalid patient ID format'), { status: 400 });
    }

    const { error: authError } = await authCheck(patientId);
    if (authError) {
        return NextResponse.json(authError, { status: 401 });
    }

    const anamnesisRecords = await AnamnesisRepository.findByPatientId(patientId);
    
    return NextResponse.json(formatSuccessResponse(anamnesisRecords));
  } catch (error) {
    console.error('Error fetching patient anamnesis records:', error);
    const errorResponse = formatErrorResponse('INTERNAL_ERROR', 'Failed to fetch patient anamnesis records');
    return NextResponse.json(errorResponse, { status: 500 });
  }
}