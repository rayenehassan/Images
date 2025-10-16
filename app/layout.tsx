export const metadata = {
  title: 'Éditeur d’images IA',
  description: 'Générez des images avec IA — Next.js + Supabase + Replicate',
};

import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import AppHeader from '@/components/AppHeader';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
        <AuthProvider>
          <div className="app-shell">
            <AppHeader />
            <main className="app-main">{children}</main>
            <footer className="app-footer">© {new Date().getFullYear()} Studio — propulsé par IA</footer>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
