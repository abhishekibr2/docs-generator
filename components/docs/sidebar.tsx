import { getCategoriesWithPages } from '@/lib/supabase/queries';
import { CategoryNav } from './category-nav';
import { cn } from '@/lib/utils';

export async function Sidebar({ className }: { className?: string }) {
  const categories = await getCategoriesWithPages();

  return (
    <aside
      className={cn(
        'sticky top-16 h-[calc(100vh-4rem)] w-64 border-r bg-muted/40 overflow-y-auto',
        className,
      )}
    >
      <nav className="p-4 space-y-1">
        {categories.map((category) => (
          <CategoryNav key={category.id} category={category} />
        ))}
      </nav>
    </aside>
  );
}

