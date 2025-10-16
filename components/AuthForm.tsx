"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email et mot de passe requis.');
      return;
    }
    setLoading(true);
    const action = mode === 'login' ? signIn : signUp;
    const res = await action(email.trim(), password);
    if (res.error) setError(res.error);
    setLoading(false);
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{mode === 'login' ? 'Connexion' : 'Inscription'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Veuillez patienter…' : mode === 'login' ? 'Se connecter' : "S'inscrire"}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-between text-sm text-muted-foreground">
        {mode === 'login' ? (
          <>
            <span>Pas de compte ?</span>
            <Link className="underline" href="/signup">Créer un compte</Link>
          </>
        ) : (
          <>
            <span>Déjà un compte ?</span>
            <Link className="underline" href="/login">Se connecter</Link>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
