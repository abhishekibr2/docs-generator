'use client';

import { useEffect, useState } from 'react';
import { MDXRemote } from 'next-mdx-remote';
import { mdxComponents } from '@/components/docs/mdx-components';
import type { MDXRemoteSerializeResult } from 'next-mdx-remote';

export function MDXPreview({ content }: { content: string }) {
  const [mdxSource, setMdxSource] = useState<MDXRemoteSerializeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!content) {
      setMdxSource(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Debounce the serialization
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/mdx-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Failed to serialize MDX');
        }

        const data = await response.json();
        setMdxSource(data as MDXRemoteSerializeResult);
      } catch (err: any) {
        setError(err.message || 'Failed to load preview');
        setMdxSource(null);
      } finally {
        setIsLoading(false);
      }
    }, 500); // Debounce by 500ms

    return () => clearTimeout(timer);
  }, [content]);

  if (!content) {
    return <p className="text-muted-foreground">No content to preview</p>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-sm text-muted-foreground">Rendering preview...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50 dark:bg-red-900/20">
        <p className="text-sm text-red-600 dark:text-red-400">Error: {error}</p>
      </div>
    );
  }

  if (!mdxSource) {
    return <p className="text-muted-foreground">No content to preview</p>;
  }

  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <MDXRemote {...mdxSource} components={mdxComponents} />
    </div>
  );
}
