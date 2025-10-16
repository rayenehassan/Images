"use client";

import { useEffect, useState } from 'react';
import SubscriptionStatus from '@/components/SubscriptionStatus';

type Project = {
  id: string;
  input_image_url: string;
  output_image_url: string | null;
  prompt: string;
  created_at: string;
};

export default function DashboardClient() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [sub, setSub] = useState<any | null>(null);

  const refresh = async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      setProjects(await res.json());
    }
  };

  useEffect(() => {
    refresh();
    (async () => {
      const r = await fetch('/api/subscription');
      if (r.ok) setSub(await r.json());
    })();
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResultUrl(null);
    setPreviewUrl(f ? URL.createObjectURL(f) : null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    if (!file) return setError('Veuillez sélectionner une image.');
    if (!prompt.trim()) return setError('Veuillez saisir un prompt.');
    if (sub && typeof sub.quota_limit === 'number' && typeof sub.quota_used === 'number' && sub.quota_used >= sub.quota_limit) {
      return setError('Quota atteint, passez au plan Pro.');
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('prompt', prompt);
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const msg = ct.includes('json') ? (await res.json()).error : await res.text();
        throw new Error(msg || `Erreur ${res.status}`);
      }
      const data = await res.json();
      setResultUrl(data.outputImageUrl);
      setPrompt('');
      setFile(null);
      setPreviewUrl(null);
      await refresh();
      const r = await fetch('/api/subscription');
      if (r.ok) setSub(await r.json());
    } catch (err: any) {
      setError(err?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm('Supprimer ce projet ?')) return;
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    if (res.ok) {
      await refresh();
    }
  };

  const planLabel = sub?.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO ? 'Pro' : sub?.stripe_price_id ? 'Basic' : '—';
  const quotaLimit = typeof sub?.quota_limit === 'number' ? sub.quota_limit : 0;
  const quotaUsed = typeof sub?.quota_used === 'number' ? sub.quota_used : 0;
  const quotaReached = quotaLimit > 0 && quotaUsed >= quotaLimit;

  return (
    <div className="space-y-6">
      <SubscriptionStatus
        planLabel={planLabel}
        quotaLimit={quotaLimit}
        quotaUsed={quotaUsed}
        onManage={async () => {
          const r = await fetch('/api/create-portal-session', { method: 'POST' });
          const j = await r.json();
          if (r.ok) window.location.href = j.url; else alert(j.error || 'Erreur');
        }}
        onUpgrade={() => { window.location.href = '/pricing'; }}
      />
      <div className="rounded-xl border bg-card">
        <div className="p-6 border-b"><h1 className="text-2xl font-semibold">Mon tableau de bord</h1><p className="text-sm text-muted-foreground">Générez et gérez vos projets.</p></div>
        <form className="p-6 space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Image à transformer</label>
              <input className="block w-full rounded-md border border-input bg-background px-3 py-2 text-sm" type="file" accept="image/*" onChange={onFileChange} />
              <span className="text-xs text-muted-foreground">Formats: PNG, JPG, WEBP…</span>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Prompt</label>
              <textarea className="min-h-[110px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ex: natural style, add a teddy bear in the center…" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-primary-foreground" disabled={loading || quotaReached}>
              {loading ? 'Génération…' : 'Générer'}
            </button>
            {quotaReached && <span className="text-sm text-muted-foreground">Quota atteint, passez au plan Pro</span>}
            {resultUrl && (
              <a className="inline-flex h-10 items-center rounded-md border px-5" href={resultUrl} target="_blank" rel="noreferrer">Voir le résultat</a>
            )}
          </div>
          {error && <div className="text-sm text-red-400">{error}</div>}
        </form>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h2 className="text-xl font-semibold mb-4">Mes projets</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <div key={p.id} className="space-y-2 rounded-lg border bg-background p-3">
              <div className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString()}</div>
              <div className="grid grid-cols-2 gap-2">
                <img src={p.input_image_url} alt="input" className="rounded" />
                {p.output_image_url ? <img src={p.output_image_url} alt="output" className="rounded" /> : <span className="text-sm text-muted-foreground grid place-items-center">En cours…</span>}
              </div>
              <div className="text-xs text-muted-foreground">{p.prompt}</div>
              <div className="flex gap-2">
                {p.output_image_url && <a className="inline-flex h-9 items-center rounded-md border px-4" href={p.output_image_url} target="_blank">Ouvrir</a>}
                <button className="inline-flex h-9 items-center rounded-md bg-destructive px-4 text-destructive-foreground" onClick={() => onDelete(p.id)}>Supprimer</button>
              </div>
            </div>
          ))}
          {projects.length === 0 && <span className="text-sm text-muted-foreground">Aucun projet pour l’instant.</span>}
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <strong className="block mb-2">Entrée</strong>
          <div className="grid place-items-center min-h-[200px]">
            {previewUrl ? <img src={previewUrl} alt="apercu" className="rounded" /> : <span className="text-sm text-muted-foreground">Aperçu à venir</span>}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <strong className="block mb-2">Résultat</strong>
          <div className="grid place-items-center min-h-[200px]">
            {loading ? <span className="text-sm text-muted-foreground">Génération en cours…</span> : resultUrl ? <img src={resultUrl} alt="result" className="rounded" /> : <span className="text-sm text-muted-foreground">—</span>}
          </div>
        </div>
      </section>
    </div>
  );
}
