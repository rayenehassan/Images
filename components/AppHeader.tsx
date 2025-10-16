"use client";

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

export default function AppHeader() {
  const { user, signOut } = useAuth();
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="inline-grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground">◎</span>
          <span>Studio</span>
        </Link>
        <nav className="flex items-center gap-2">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
              <Link href="/dashboard"><Button variant="outline">Mon espace</Button></Link>
              <Button onClick={() => signOut()}>Déconnexion</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button variant="outline">Se connecter</Button></Link>
              <Link href="/signup"><Button>Créer un compte</Button></Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
