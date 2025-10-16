import { NextResponse } from 'next/server';
import { supabaseRoute } from '@/lib/supabaseServer';
import { stripe } from '@/lib/stripe';
import { ensureSubscriptionRow } from '@/lib/subscriptions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = supabaseRoute();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    const { priceId } = await request.json();
    const allowed = [process.env.STRIPE_PRICE_BASIC, process.env.STRIPE_PRICE_PRO].filter(Boolean);
    if (!priceId || !allowed.includes(priceId)) {
      return NextResponse.json({ error: 'Price ID invalide' }, { status: 400 });
    }

    const sub = await ensureSubscriptionRow(supabase, session.user.id);

    let customerId = sub.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { user_id: session.user.id },
      });
      customerId = customer.id;
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('id', sub.id);
    }

    const origin = new URL(request.url).origin;
    const sessionStripe = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: { user_id: session.user.id },
      subscription_data: { metadata: { user_id: session.user.id } },
    });

    return NextResponse.json({ url: sessionStripe.url });
  } catch (err: any) {
    console.error('stripe checkout error', err);
    return NextResponse.json({ error: err?.message || 'Erreur interne' }, { status: 500 });
  }
}

