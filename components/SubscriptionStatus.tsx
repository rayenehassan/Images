"use client";

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

type Props = {
  planLabel: string;
  quotaLimit: number;
  quotaUsed: number;
  onManage?: () => void;
  onUpgrade?: () => void;
};

export default function SubscriptionStatus({ planLabel, quotaLimit, quotaUsed, onManage, onUpgrade }: Props) {
  const remaining = Math.max(0, quotaLimit - quotaUsed);
  const pct = quotaLimit > 0 ? (quotaUsed / quotaLimit) * 100 : 0;
  const low = quotaLimit > 0 && remaining <= Math.ceil(quotaLimit * 0.2);
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={planLabel === 'Pro' ? 'success' : planLabel === 'Basic' ? 'secondary' : 'muted'}>
            {planLabel || '—'}
          </Badge>
          <span className="text-sm text-muted-foreground">{remaining}/{quotaLimit} générations restantes</span>
        </div>
        <div className="flex items-center gap-2">
          {onManage && <Button variant="outline" onClick={onManage}>Gérer</Button>}
          {onUpgrade && <Button onClick={onUpgrade}>Upgrade</Button>}
        </div>
      </div>
      <div className="mt-3">
        <Progress value={pct} />
        {low && <div className="mt-2 text-xs text-amber-400">Il reste peu de crédits — pensez à passer au plan Pro.</div>}
      </div>
    </div>
  );
}
