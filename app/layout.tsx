export const metadata = {
  title: 'Éditeur d’images IA',
  description: 'Générez des images avec IA — Next.js + Supabase + Replicate',
};

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <span className="logo" aria-hidden>◎</span>
              <span>Studio</span>
            </div>
          </header>
          <main className="app-main">{children}</main>
          <footer className="app-footer">© {new Date().getFullYear()} Studio — propulsé par IA</footer>
        </div>
      </body>
    </html>
  );
}

