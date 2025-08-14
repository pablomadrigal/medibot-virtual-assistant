import { createServerSupabaseClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PatientConsultation } from '@/app/consultation/components/PatientConsultation';

export default async function PatientPage() {
  const supabase = createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login'); // Or your login page
  }

  return <PatientConsultation userId={user.id} />;
}