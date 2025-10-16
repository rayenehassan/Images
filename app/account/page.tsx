import { supabaseServerComponent } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import AccountClient from './view';

export default async function AccountPage() {
  const supabase = supabaseServerComponent();
  const { data } = await supabase.auth.getSession();
  if (!data.session) redirect('/login');
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', data.session.user.id)
    .single();
  return <AccountClient sub={sub} />;
}

