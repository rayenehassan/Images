import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseRoute } from '@/lib/supabaseServer';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = supabaseRoute();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    const { data, error } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', session.user.id)
      .single();
    if (error || !data?.stripe_customer_id) return NextResponse.json({ error: 'Aucun client Stripe' }, { status: 400 });
    const baseUrl = process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;
    const portal = await stripe.billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: `${baseUrl}/account` });
    return NextResponse.json({ url: portal.url });
  } catch (e: any) {
    console.error('create-portal-session', e);
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 });
  }
}

