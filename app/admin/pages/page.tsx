import { getAllPages, getAllCategories } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import { PageList } from '@/components/admin/page-list';
import { PageActions } from '@/components/admin/page-actions';

export default async function PagesPage() {
  const pages = await getAllPages();
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground">
            Manage documentation pages
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pages/new">
            <Plus className="h-4 w-4 mr-2" />
            New Page
          </Link>
        </Button>
      </div>

      <PageList pages={pages} categories={categories} />
    </div>
  );
}



