import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getServiceRoleKey } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

async function createProfileForUser(supabase: SupabaseClient, userId: string) {
  const { error } = await supabase.from('profiles').insert({ user_id: userId, role: 'patient' });
  if (error) {
    console.error(`Failed to create profile for user ${userId}:`, error);
    throw new Error('Failed to create user profile.');
  }
}

async function createPatientForUser(supabase: SupabaseClient, userId: string, email: string) {
    const { error } = await supabase.from('patients').insert({
      id: userId,
      name: email.split('@')[0], // Default name from email
      date_of_birth: '1900-01-01', // Placeholder
    });
  
    if (error) {
      console.error(`Failed to create patient record for user ${userId}:`, error);
      throw new Error('Failed to create patient record.');
    }
  }

export async function POST(request: NextRequest) {
    const supabaseService = new SupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        getServiceRoleKey()
      );

  const { type, record: user } = await request.json();

  if (type === 'INSERT' && user?.id) {
    try {
      await createProfileForUser(supabaseService, user.id);
      await createPatientForUser(supabaseService, user.id, user.email);
      return NextResponse.json({ message: 'User processed successfully' }, { status: 200 });
    } catch (error: any) {
      console.error('Error processing new user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
}
