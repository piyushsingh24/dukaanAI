'use client';

import React from 'react';
import { useAuth } from '@/store/auth';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useRouter } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export function Shell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useSocket();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <Topbar />
      <main className="pl-[280px] pt-[72px]">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
