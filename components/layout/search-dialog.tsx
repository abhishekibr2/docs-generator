'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/types';

type SearchResultWithSnippet = SearchResult & { snippet?: string };

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultWithSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      }

      if (!open) return;

      if (e.key === 'Escape') {
        onOpenChange(false);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex].slug);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, onOpenChange]);

  const handleSelect = (slug: string) => {
    router.push(`/docs/${slug}`);
    onOpenChange(false);
    setQuery('');
    setResults([]);
  };

  const highlightText = (text: string, query: string) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-yellow-200 dark:bg-yellow-900">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0">
        <DialogHeader className="sr-only">
          <DialogTitle>Search Documentation</DialogTitle>
          <DialogDescription>
            Search through all documentation pages
          </DialogDescription>
        </DialogHeader>
        <Command className="rounded-lg border-none">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Search documentation..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
              autoFocus
            />
          </div>
          <CommandList>
            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            {!loading && query && results.length === 0 && (
              <CommandEmpty>No results found.</CommandEmpty>
            )}
            {!loading && results.length > 0 && (
              <CommandGroup heading="Results">
                {results.map((result, index) => (
                  <CommandItem
                    key={result.id}
                    value={result.slug}
                    onSelect={() => handleSelect(result.slug)}
                    className={cn(
                      'cursor-pointer',
                      index === selectedIndex && 'bg-accent',
                    )}
                  >
                    <FileText className="mr-2 h-4 w-4 shrink-0" />
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-medium">
                        {highlightText(result.title, query)}
                      </span>
                      {result.description && (
                        <span className="text-xs text-muted-foreground">
                          {highlightText(result.description, query)}
                        </span>
                      )}
                      {result.snippet && (
                        <span className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {highlightText(result.snippet, query)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!query && (
              <CommandEmpty>
                <div className="flex flex-col items-center justify-center py-6 text-sm text-muted-foreground">
                  <Search className="h-8 w-8 mb-2 opacity-50" />
                  <p>Type to search documentation...</p>
                  <p className="mt-2 text-xs">
                    Press <kbd className="px-1.5 py-0.5 rounded border bg-muted">⌘</kbd>
                    <kbd className="px-1.5 py-0.5 rounded border bg-muted ml-1">K</kbd> to open
                  </p>
                </div>
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}


