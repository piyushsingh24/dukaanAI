import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/store/auth';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DukaanAI - Business Dashboard',
  description: 'AI-powered business assistant for Indian MSMEs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
