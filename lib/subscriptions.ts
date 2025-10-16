import { createClient } from '@supabase/supabase-js';

export type Subscription = {
  id: string;
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  status: string | null;
  quota_limit: number;
  quota_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
};

export function getQuotaForPriceId(priceId?: string | null) {
  const basic = process.env.STRIPE_PRICE_BASIC;
  const pro = process.env.STRIPE_PRICE_PRO;
  if (priceId && pro && priceId === pro) return 200;
  if (priceId && basic && priceId === basic) return 50;
  return 0;
}

export async function ensureSubscriptionRow(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (!data) {
    const ins = await supabase.from('subscriptions').insert({ user_id: userId }).select().single();
    if (ins.error) throw ins.error;
    return ins.data as Subscription;
  }
  if (error && error.code !== 'PGRST116') throw error;
  return data as Subscription;
}

