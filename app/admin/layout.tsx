import Link from 'next/link';
import { Suspense } from 'react';
import { LayoutDashboard, Folder, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LogoutButton } from '@/components/logout-button';
import { AdminLayoutContent } from './layout-content';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r bg-muted/40 flex flex-col sticky top-0 h-screen">
        <div className="p-4 flex-1 flex flex-col">
          <Link href="/admin" className="flex items-center gap-2 mb-6">
            <LayoutDashboard className="h-6 w-6" />
            <span className="font-bold text-lg">Admin</span>
          </Link>
          <nav className="space-y-1 flex-1">
            <Link
              href="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <Folder className="h-4 w-4" />
              Categories
            </Link>
            <Link
              href="/admin/pages"
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <FileText className="h-4 w-4" />
              Pages
            </Link>
          </nav>
          <div className="mt-auto pt-4">
            <LogoutButton />
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Suspense
          fallback={
            <div className="container mx-auto p-8">
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              </div>
            </div>
          }
        >
          <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
      </main>
    </div>
  );
}
