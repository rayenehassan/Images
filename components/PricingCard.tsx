"use client";

import { Button } from '@/components/ui/button';

type Props = {
  title: string;
  price: string;
  quota: number;
  priceId: string | undefined;
  onSubscribe: (priceId: string) => void;
};

export default function PricingCard({ title, price, quota, priceId, onSubscribe }: Props) {
  return (
    <div className="rounded-xl border bg-card p-6 flex flex-col gap-3">
      <div className="text-xl font-semibold">{title}</div>
      <div className="text-muted-foreground">{price} • {quota} générations / mois</div>
      <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
        <li>Accès au générateur d’images</li>
        <li>Historique des projets</li>
        <li>Annulable à tout moment</li>
      </ul>
      <div className="pt-2">
        <Button disabled={!priceId} onClick={() => priceId && onSubscribe(priceId)}>
          S’abonner
        </Button>
        {!priceId && <p className="text-xs text-muted-foreground mt-2">Price ID non configuré.</p>}
      </div>
    </div>
  );
}

