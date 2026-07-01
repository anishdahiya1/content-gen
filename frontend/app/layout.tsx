import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from './components/Sidebar';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CreatorPilot Workspace',
  description: 'Pro SaaS Workspace for Creators',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="flex h-screen overflow-hidden bg-[var(--background)]">
        <Sidebar />
        <main className="flex-1 overflow-hidden flex flex-col relative bg-[var(--background)]">
          {children}
        </main>
      </body>
    </html>
  );
}
