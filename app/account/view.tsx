"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AccountClient({ sub }: { sub: any }) {
  const onPortal = async () => {
    const res = await fetch('/api/create-portal-session', { method: 'POST' });
    const j = await res.json();
    if (!res.ok) return alert(j.error || 'Erreur');
    window.location.href = j.url;
  };

  const proId = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;
  const basicId = process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC;
  const planLabel = sub?.stripe_price_id ? (sub.stripe_price_id === proId ? 'Pro' : 'Basic') : '—';
  const status = sub?.status ?? '—';
  const limit = sub?.quota_limit ?? 0;
  const used = sub?.quota_used ?? 0;
  const remaining = Math.max(0, limit - used);
  const pct = limit > 0 ? (used / limit) * 100 : 0;
  const renew = sub?.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '—';

  return (
    <div className="container">
      <div className="max-w-2xl mx-auto rounded-2xl border bg-card p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Mon abonnement</h1>
          <Badge variant={status === 'active' ? 'success' : status === 'canceled' ? 'destructive' : 'secondary'}>
            {status}
          </Badge>
        </div>

        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Plan actuel</div>
            <div className="font-medium">{planLabel}</div>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Quota mensuel</div>
            <div className="text-sm text-muted-foreground">{remaining}/{limit} restants</div>
          </div>
          <Progress value={pct} />
          <div className="text-xs text-muted-foreground">Renouvellement le {renew}</div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onPortal}>Gérer la facturation</Button>
          <a className="inline-flex h-10 items-center rounded-md border px-4" href="/pricing">Changer de plan</a>
        </div>
      </div>
    </div>
  );
}
