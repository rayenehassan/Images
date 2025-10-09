"use client";

import { useState } from "react";

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setResultUrl(null);
    if (f) setPreviewUrl(URL.createObjectURL(f));
    else setPreviewUrl(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResultUrl(null);
    if (!file) {
      setError("Veuillez sélectionner une image.");
      return;
    }
    if (!prompt.trim()) {
      setError("Veuillez saisir un prompt de transformation.");
      return;
    }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("image", file);
      fd.append("prompt", prompt);
      const res = await fetch("/api/generate", { method: "POST", body: fd });
      if (!res.ok) {
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/json")) {
          const j = await res.json();
          const msg = (j && (j.error || j.message)) || JSON.stringify(j);
          throw new Error(msg || `Erreur serveur (${res.status})`);
        } else {
          const t = await res.text();
          throw new Error(t || `Erreur serveur (${res.status})`);
        }
      }
      const data = (await res.json()) as { outputImageUrl: string };
      setResultUrl(data.outputImageUrl);
    } catch (err: any) {
      setError(err?.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="stack" style={{ gap: 24 }}>
        <section className="card">
          <h1 style={{ margin: 0, fontSize: 28 }}>Éditeur d’images avec IA</h1>
          <p className="helper" style={{ marginTop: 8 }}>
            Uploadez une image, décrivez la transformation, puis générez.
          </p>

          <form className="stack" onSubmit={onSubmit}>
            <div className="row">
              <div className="stack">
                <label>Image à transformer</label>
                <input className="field" type="file" accept="image/*" onChange={onFileChange} />
                <span className="helper">Formats courants acceptés (PNG, JPG, WEBP).</span>
              </div>
              <div className="stack">
                <label>Prompt</label>
                <textarea
                  className="field"
                  placeholder="Ex: style cinématique, lumière douce, haute résolution…"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
            </div>

            <div className="actions">
              <button className="btn" disabled={loading} type="submit">
                {loading ? (
                  <span style={{ display: "inline-flex", gap: 10, alignItems: "center" }}>
                    <span className="loader" /> Génération en cours…
                  </span>
                ) : (
                  "Générer"
                )}
              </button>
              {resultUrl && (
                <a className="btn ghost" href={resultUrl} target="_blank" rel="noreferrer">
                  Ouvrir l’image générée
                </a>
              )}
            </div>

            {error && (
              <div className="card" style={{ background: "#2a1113", borderColor: "#5b1b21" }}>
                <strong>Erreur</strong>
                <div className="helper">{error}</div>
              </div>
            )}
          </form>
        </section>

        <section className="thumbs">
          <div className="thumb">
            <strong>Entrée</strong>
            <div className="center" style={{ minHeight: 200 }}>
              {previewUrl ? (
                <img src={previewUrl} alt="Aperçu de l’image d’entrée" />
              ) : (
                <span className="helper">Aucune image d’entrée pour le moment</span>
              )}
            </div>
          </div>
          <div className="thumb">
            <strong>Résultat</strong>
            <div className="center" style={{ minHeight: 200 }}>
              {loading ? (
                <span className="helper">Génération en cours, merci de patienter…</span>
              ) : resultUrl ? (
                <img src={resultUrl} alt="Image générée" />
              ) : (
                <span className="helper">Le résultat s’affichera ici</span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

