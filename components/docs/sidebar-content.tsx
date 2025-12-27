import { getCategoriesWithPages } from '@/lib/supabase/queries';
import { CategoryNav } from './category-nav';

export async function SidebarContent() {
  const categories = await getCategoriesWithPages();

  return (
    <nav className="p-4 space-y-1">
      {categories.map((category) => (
        <CategoryNav key={category.id} category={category} />
      ))}
    </nav>
  );
}


