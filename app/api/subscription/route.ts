import { NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function GET() {
  const supabase = supabaseRoute();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || null);
}

