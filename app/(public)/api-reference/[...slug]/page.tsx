import { Suspense } from 'react';
import { MDXRemote } from 'next-mdx-remote/rsc';
import remarkGfm from 'remark-gfm';
import { getPageBySlugArray } from '@/lib/supabase/queries';
import { DocBreadcrumb } from '@/components/docs/breadcrumb';
import { TableOfContents } from '@/components/docs/toc';
import { mdxComponents } from '@/components/docs/mdx-components';
import { ApiPlayground } from '@/components/api-playground/api-playground';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

async function PageContent({ params }: { params: Promise<{ slug: string[] }> }) {
  const resolvedParams = await params;
  
  // If slug is empty, redirect to index page
  if (resolvedParams.slug.length === 0) {
    return (
      <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-6">
        <p className="text-blue-800 dark:text-blue-200">
          Redirecting to API Reference index...
        </p>
      </div>
    );
  }
  
  const page = await getPageBySlugArray(resolvedParams.slug);

  if (!page) {
    return (
      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
        <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
          Page Not Found
        </h2>
        <p className="text-red-800 dark:text-red-200">
          Could not find page with slug:{' '}
          <code className="bg-red-100 dark:bg-red-900 rounded text-sm">
            {resolvedParams.slug.join('/')}
          </code>
        </p>
      </div>
    );
  }

  // Check if this is an API Reference category page with API playground data
  const isApiReferenceCategory = page.category?.slug?.toLowerCase().includes('api-reference') || 
                                  page.category?.name?.toLowerCase().includes('api reference');
  const hasApiPlaygroundData = page.api_endpoint && page.api_method;
  const hasContent = page.content && page.content.trim().length > 0;

  // If it's an API Reference page with playground data, render the playground
  // Also show content if it exists (above the playground)
  // Note: ApiPlayground component already renders title and description, so we don't duplicate them here
  if (isApiReferenceCategory && hasApiPlaygroundData) {
    return (
      <>
        <DocBreadcrumb page={page} />

        {hasContent && (
          <div className="mt-12 pb-8">
            <article
              className="prose prose-slate dark:prose-invert max-w-none
              prose-headings:scroll-mt-24
              prose-headings:font-bold
              prose-h1:text-4xl prose-h1:tracking-tight prose-h1:mt-16 prose-h1:mb-6
              prose-h2:text-3xl prose-h2:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b
              prose-h3:text-2xl prose-h3:tracking-tight prose-h3:mt-10 prose-h3:mb-4
              prose-h4:text-xl prose-h4:tracking-tight prose-h4:mt-8 prose-h4:mb-3
              prose-p:text-base prose-p:leading-7 prose-p:my-6
              prose-ul:my-6 prose-ul:leading-7
              prose-ol:my-6 prose-ol:leading-7
              prose-li:my-2
              prose-code:text-sm prose-code:bg-muted prose-code:border prose-code:rounded prose-code:font-mono prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:rounded-lg prose-pre:my-8  prose-pre:overflow-x-auto
              prose-strong:font-semibold prose-strong:text-foreground
              prose-em:italic
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r prose-blockquote:my-8 prose-blockquote:not-italic
              prose-img:rounded-lg prose-img:shadow-lg prose-img:my-10
              prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:transition-colors hover:prose-a:underline hover:prose-a:text-primary/80
              prose-table:w-full prose-table:my-16 prose-table:border-collapse
              prose-thead:border-b-2
              prose-th:bg-muted/50 prose-th:font-semibold prose-th:text-left prose-th:py-4 prose-th:px-6 prose-th:text-sm
              prose-td:border-t prose-td:py-4 prose-td:px-6 prose-td:text-sm
              prose-hr:my-16 prose-hr:border-border"
            >
              <MDXRemote
                source={page.content}
                components={mdxComponents}
                options={{
                  parseFrontmatter: false,
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                  },
                }}
              />
            </article>
          </div>
        )}

        <div className={hasContent ? 'mt-12 pb-16' : 'mt-12 pb-16'}>
          <ApiPlayground page={page as any} />
        </div>
      </>
    );
  }

  // For API Reference pages without playground data, show content if it exists
  if (isApiReferenceCategory && !hasApiPlaygroundData) {
    if (!hasContent) {
      return (
        <>
          <DocBreadcrumb page={page} />
          <div className="mt-12 space-y-4">
            <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
              {page.title}
            </h1>
            {page.description && (
              <p className="text-xl text-muted-foreground">{page.description}</p>
            )}
          </div>
          <div className="mt-8 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              This page exists but has no content yet. Add content or configure API Playground settings.
            </p>
          </div>
        </>
      );
    }
    // Fall through to render content below
  }

  // For non-API Reference pages or API Reference pages without playground data but with content
  if (!hasContent) {
    return (
      <>
        <DocBreadcrumb page={page} />
        <div className="mt-12 space-y-4">
          <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
            {page.title}
          </h1>
          {page.description && (
            <p className="text-xl text-muted-foreground">{page.description}</p>
          )}
        </div>
        <div className="mt-8 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            This page exists but has no content yet.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <DocBreadcrumb page={page} />

      <div className="mt-12 space-y-4">
        <h1 className="scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl">
          {page.title}
        </h1>
        {page.description && (
          <p className="text-xl text-muted-foreground leading-relaxed">
            {page.description}
          </p>
        )}
      </div>

      <div className="mt-12 pb-16">
        <article
          className="prose prose-slate dark:prose-invert max-w-none
          prose-headings:scroll-mt-24
          prose-headings:font-bold
          prose-h1:text-4xl prose-h1:tracking-tight prose-h1:mt-16 prose-h1:mb-6
          prose-h2:text-3xl prose-h2:tracking-tight prose-h2:mt-14 prose-h2:mb-5 prose-h2:pb-3 prose-h2:border-b
          prose-h3:text-2xl prose-h3:tracking-tight prose-h3:mt-10 prose-h3:mb-4
          prose-h4:text-xl prose-h4:tracking-tight prose-h4:mt-8 prose-h4:mb-3
          prose-p:text-base prose-p:leading-7 prose-p:my-6
          prose-ul:my-6 prose-ul:leading-7
          prose-ol:my-6 prose-ol:leading-7
          prose-li:my-2
          prose-code:text-sm prose-code:bg-muted prose-code:border prose-code:rounded prose-code:font-mono prose-code:font-semibold prose-code:before:content-[''] prose-code:after:content-['']
          prose-pre:bg-slate-900 dark:prose-pre:bg-slate-950 prose-pre:border prose-pre:rounded-lg prose-pre:my-8  prose-pre:overflow-x-auto
          prose-strong:font-semibold prose-strong:text-foreground
          prose-em:italic
          prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r prose-blockquote:my-8 prose-blockquote:not-italic
          prose-img:rounded-lg prose-img:shadow-lg prose-img:my-10
          prose-a:text-primary prose-a:font-medium prose-a:no-underline prose-a:transition-colors hover:prose-a:underline hover:prose-a:text-primary/80
          prose-table:w-full prose-table:my-16 prose-table:border-collapse
          prose-thead:border-b-2
          prose-th:bg-muted/50 prose-th:font-semibold prose-th:text-left prose-th:py-4 prose-th:px-6 prose-th:text-sm
          prose-td:border-t prose-td:py-4 prose-td:px-6 prose-td:text-sm
          prose-hr:my-16 prose-hr:border-border"
        >
          <MDXRemote
            source={page.content}
            components={mdxComponents}
            options={{
              parseFrontmatter: false,
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>
      </div>
    </>
  );
  

}

export default function DocPage({ params }: PageProps) {
  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-screen-2xl">
        <div className="flex gap-8 lg:gap-12 xl:gap-16">
          <main className="flex-1 min-w-0 py-8 lg:py-12 px-6 md:px-10 lg:px-16">
            <div className="mx-auto w-full max-w-4xl">
              <Suspense fallback={<PageSkeleton />}>
                <PageContent params={params} />
              </Suspense>
            </div>
          </main>

          <aside className="hidden xl:block w-96 shrink-0 pr-8">
            <div className="sticky top-20 max-h-[calc(100vh-5rem)] overflow-y-auto py-8 lg:py-12 overscroll-contain">
              <TableOfContents />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}


function PageSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="space-y-4">
        <div className="h-10 bg-muted rounded w-3/4"></div>
        <div className="h-6 bg-muted rounded w-1/2"></div>
      </div>
      <div className="space-y-4 pt-8">
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-full"></div>
        <div className="h-4 bg-muted rounded w-4/5"></div>
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return [{ slug: ['tire-api'] }];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const page = await getPageBySlugArray(resolvedParams.slug);

    if (!page) {
      return { title: 'Page Not Found' };
    }

    return {
      title: `${page.title} - Documentation`,
      description: page.description || page.title,
    };
  } catch {
    return {
      title: 'Documentation',
    };
  }
}
