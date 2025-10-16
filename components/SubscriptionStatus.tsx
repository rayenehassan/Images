"use client";

type Props = {
  planLabel: string;
  quotaLimit: number;
  quotaUsed: number;
};

export default function SubscriptionStatus({ planLabel, quotaLimit, quotaUsed }: Props) {
  const remaining = Math.max(0, quotaLimit - quotaUsed);
  return (
    <div className="rounded-lg border bg-card p-4 flex items-center justify-between">
      <div>
        <div className="text-sm text-muted-foreground">Abonnement</div>
        <div className="font-medium">{planLabel}</div>
      </div>
      <div className="text-sm text-muted-foreground">
        {remaining}/{quotaLimit} générations restantes ce mois
      </div>
    </div>
  );
}

