import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import supabaseAdmin from '@/lib/supabaseAdmin';
import { getQuotaForPriceId } from '@/lib/subscriptions';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET as string;
  if (!whSecret) return NextResponse.json({ error: 'Webhook non configuré' }, { status: 500 });
  const sig = request.headers.get('stripe-signature') as string;
  const raw = await request.text();
  let event: any;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, whSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message);
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const customerId = session.customer as string;
        const userId = session.metadata?.user_id as string | undefined;
        if (userId && customerId) {
          await supabaseAdmin
            .from('subscriptions')
            .upsert({ user_id: userId, stripe_customer_id: customerId }, { onConflict: 'user_id' });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as any;
        const customerId = sub.customer as string;
        const priceId: string | undefined = sub.items?.data?.[0]?.price?.id;
        const userId = sub.metadata?.user_id as string | undefined;
        const status = sub.status as string;
        const currentStart = sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null;
        const currentEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null;
        const quota = getQuotaForPriceId(priceId);
        const payload: any = {
          stripe_customer_id: customerId,
          stripe_subscription_id: sub.id,
          stripe_price_id: priceId || null,
          status,
          current_period_start: currentStart,
          current_period_end: currentEnd,
          quota_limit: quota > 0 ? quota : undefined,
        };
        if (userId) payload.user_id = userId;
        await supabaseAdmin.from('subscriptions').upsert(payload, { onConflict: 'stripe_customer_id' });
        break;
      }
      case 'customer.subscription.deleted': {
        const sub = event.data.object as any;
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error', err);
    return NextResponse.json({ received: true, error: 'handler' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

