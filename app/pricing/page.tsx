"use client";

import PricingCard from '@/components/PricingCard';
import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const startCheckout = async (priceId: string) => {
    try {
      setLoading(priceId);
      const res = await fetch('/api/create-subscription-checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ priceId }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || 'Erreur');
      window.location.href = j.url;
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(null);
    }
  };

  const basic = process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC;
  const pro = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO;

  return (
    <div className="container">
      <div className="grid gap-6 md:grid-cols-2">
        <PricingCard title="Basic" price="9€ / mois" quota={50} priceId={basic} onSubscribe={startCheckout} />
        <PricingCard title="Pro" price="19€ / mois" quota={200} priceId={pro} onSubscribe={startCheckout} />
      </div>
    </div>
  );
}
