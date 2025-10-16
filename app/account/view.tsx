"use client";

import { Button } from '@/components/ui/button';

export default function AccountClient({ sub }: { sub: any }) {
  const onPortal = async () => {
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const j = await res.json();
    if (!res.ok) return alert(j.error || 'Erreur');
    window.location.href = j.url;
  };
  return (
    <div className="container">
      <div className="rounded-xl border bg-card p-6 space-y-2">
        <h1 className="text-2xl font-semibold">Mon abonnement</h1>
        <div className="text-sm text-muted-foreground">Statut: {sub?.status ?? '—'}</div>
        <div className="text-sm text-muted-foreground">Plan: {sub?.stripe_price_id ?? '—'}</div>
        <div className="text-sm text-muted-foreground">Quota: {sub?.quota_used ?? 0} / {sub?.quota_limit ?? 0}</div>
        <div className="pt-2">
          <Button onClick={onPortal}>Gérer la facturation</Button>
        </div>
      </div>
    </div>
  );
}

