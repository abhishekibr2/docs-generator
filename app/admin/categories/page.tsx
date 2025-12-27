import { getAllCategories } from '@/lib/supabase/queries';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import Link from 'next/link';
import { CategoryManager } from '@/components/admin/category-manager';
import { CategoryActions } from '@/components/admin/category-actions';

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">
            Manage documentation categories
          </p>
        </div>
        <CategoryManager />
      </div>

      <div className="border rounded-lg">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No categories yet. Create your first category to get started.</p>
          </div>
        ) : (
          <div className="divide-y">
            {categories.map((category, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex flex-col items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === 0}
                      asChild
                    >
                      <form action={`/api/categories/${category.id}/reorder`} method="POST">
                        <input type="hidden" name="direction" value="up" />
                        <button type="submit">
                          <ArrowUp className="h-4 w-4" />
                        </button>
                      </form>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      disabled={index === categories.length - 1}
                      asChild
                    >
                      <form action={`/api/categories/${category.id}/reorder`} method="POST">
                        <input type="hidden" name="direction" value="down" />
                        <button type="submit">
                          <ArrowDown className="h-4 w-4" />
                        </button>
                      </form>
                    </Button>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Slug: {category.slug} • Order: {category.order_index}
                    </p>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CategoryManager category={category} />
                  <CategoryActions categoryId={category.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



