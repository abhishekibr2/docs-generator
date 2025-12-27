'use client';

import Link from 'next/link';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchDialog } from './search-dialog';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { useState } from 'react';

export function Header() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl">Docs</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Home
              </Link>
              <Link
                href="/docs"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Documentation
              </Link>
              <Link
                href="/api-reference"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                API Reference
              </Link>
              <Link
                href="/changelog"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Changelog
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Search</span>
              <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                <span className="text-xs">⌘</span>K
              </kbd>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeSwitcher />
            <Button variant="outline" size="sm" className="hidden md:flex">
              Ask
            </Button>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}


