import { Suspense } from 'react';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/docs/sidebar';
import { MobileSidebar } from '@/components/docs/mobile-sidebar';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Suspense
          fallback={
            <aside className="hidden lg:block sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-muted/40">
              <div className="p-4 space-y-2">
                <div className="h-6 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
                <div className="h-4 bg-muted rounded animate-pulse"></div>
              </div>
            </aside>
          }
        >
          <Sidebar className="hidden lg:block" />
        </Suspense>
        <MobileSidebar />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
