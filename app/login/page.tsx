import AuthForm from '@/components/AuthForm';
import { supabaseServerComponent } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = supabaseServerComponent();
  const { data } = await supabase.auth.getSession();
  if (data.session) redirect('/dashboard');
  return (
    <div className="container">
      <AuthForm mode="login" />
    </div>
  );
}

