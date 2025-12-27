import { getCategoriesWithPages } from '@/lib/supabase/queries';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Folder } from 'lucide-react';

export default async function ApiReferencePage() {
  const categories = await getCategoriesWithPages();
  
  // Find the API Reference category (case-insensitive match)
  const apiReferenceCategory = categories.find(
    (cat) => cat.name.toLowerCase().includes('api reference') || cat.slug?.toLowerCase().includes('api-reference')
  );

  // If no API Reference category found, show all categories
  const displayCategories = apiReferenceCategory ? [apiReferenceCategory] : categories;

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="flex gap-8 lg:gap-12 xl:gap-16">
          <main className="flex-1 min-w-0 py-8 lg:py-12 px-6 md:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">API Reference</h1>
                <p className="text-xl text-muted-foreground">
                  Complete API documentation and examples
                </p>
              </div>
              
              {apiReferenceCategory && apiReferenceCategory.pages.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {apiReferenceCategory.pages.map((page) => (
                    <Card key={page.id} className="flex flex-col h-full">
                      <CardHeader className="flex-1">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <CardTitle>{page.title}</CardTitle>
                        </div>
                        {page.description && (
                          <CardDescription>{page.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="mt-auto">
                        <Link
                          href={`/api-reference/${page.slug}`}
                          className="text-sm text-primary hover:underline"
                        >
                          View Documentation →
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
                  <p className="text-yellow-800 dark:text-yellow-200">
                    No API Reference pages found. Please create pages in the API Reference category.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

