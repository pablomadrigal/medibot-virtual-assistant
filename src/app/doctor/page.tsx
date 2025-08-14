import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DoctorDashboard } from '@/app/consultation/components/DoctorDashboard';

async function getUserRole(supabase: any, userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    console.error('Error fetching user role:', error);
    return null;
  }

  return data.role;
}

export default async function DoctorPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/login');
  }

  const userRole = await getUserRole(supabase, user.id);

  if (userRole !== 'doctor') {
    return redirect('/'); // Or a specific "unauthorized" page
  }

  return <DoctorDashboard userId={user.id} />;
}