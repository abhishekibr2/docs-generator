import { getCategoriesWithPages } from '@/lib/supabase/queries';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Folder } from 'lucide-react';

export default async function DocsPage() {
  const categories = await getCategoriesWithPages();

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-(--breakpoint-2xl)">
        <div className="flex gap-8 lg:gap-12 xl:gap-16">
          <main className="flex-1 min-w-0 py-8 lg:py-12 px-6 md:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-4xl">
              <div className="mb-12">
                <h1 className="text-4xl font-bold mb-4">Documentation</h1>
                <p className="text-xl text-muted-foreground">
                  Browse our documentation to get started
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Card key={category.id} className="flex flex-col h-full">
                    <CardHeader className="flex-1">
                      <div className="flex items-center gap-2">
                        <Folder className="h-5 w-5 text-muted-foreground" />
                        <CardTitle>{category.name}</CardTitle>
                      </div>
                      {category.description && (
                        <CardDescription>{category.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="mt-auto">
                      <ul className="space-y-2">
                        {category.pages.map((page) => (
                          <li key={page.id}>
                            <Link
                              href={`/docs/${page.slug}`}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <FileText className="h-4 w-4" />
                              {page.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


