import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'COMEX IA — Equipe de Direction',
  description: 'Votre comite de direction IA : CEO, CFO, CTO, Marketing, Artistique, Communication',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
