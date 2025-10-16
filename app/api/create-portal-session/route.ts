import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseRoute } from '@/lib/supabaseServer';
import { ensureSubscriptionRow } from '@/lib/subscriptions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const supabase = supabaseRoute();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    // S'assurer qu'une ligne existe et créer un client Stripe si manquant
    const row = await ensureSubscriptionRow(supabase, session.user.id);
    let customerId = row?.stripe_customer_id as string | null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        metadata: { user_id: session.user.id },
      });
      customerId = customer.id;
      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('id', row.id);
    }
    const baseUrl = process.env.NEXT_PUBLIC_URL || new URL(request.url).origin;
    const portal = await stripe.billingPortal.sessions.create({ customer: customerId!, return_url: `${baseUrl}/account` });
    return NextResponse.json({ url: portal.url });
  } catch (e: any) {
    console.error('create-portal-session', e);
    return NextResponse.json({ error: e?.message || 'Erreur' }, { status: 500 });
  }
}
