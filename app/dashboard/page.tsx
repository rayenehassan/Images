import { supabaseServerComponent } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import DashboardClient from './view';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = supabaseServerComponent();
  const { data } = await supabase.auth.getSession();
  if (!data.session) redirect('/login');
  return (
    <div className="container">
      <DashboardClient />
    </div>
  );
}

