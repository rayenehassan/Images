import { NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { stripe } from '@/lib/stripe';

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
    if (error || !data?.stripe_customer_id) {
      return NextResponse.json({ error: 'Aucun client Stripe lié.' }, { status: 400 });
    }

    const origin = new URL(request.url).origin;
    const portal = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${origin}/account`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (err: any) {
    console.error('stripe portal error', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

