"use client";

import { useState } from "react";

export default function HomePage() {
  return (
    <div className="container">
      <section className="rounded-2xl border bg-gradient-to-b from-slate-900/40 to-slate-900/10 p-10 md:p-16 text-center">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Studio — Éditeur d’images IA
        </h1>
        <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
          Créez et transformez vos images avec une expérience moderne et épurée.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-primary-foreground" href="/signup">Commencer gratuitement</a>
          <a className="inline-flex h-10 items-center rounded-md border px-5" href="/login">J’ai déjà un compte</a>
        </div>
      </section>
    </div>
  );
}
