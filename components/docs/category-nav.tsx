'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, FileText, Folder } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CategoryWithPages, DocPage } from '@/types';

interface PageWithChildren extends DocPage {
  children?: PageWithChildren[];
}

export function CategoryNav({ category }: { category: CategoryWithPages }) {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-90',
          )}
        />
        <Folder className="h-4 w-4" />
        <span>{category.name}</span>
      </button>
      {isOpen && (
        <div className="ml-4 space-y-1">
          {category.pages.map((page) => (
            <PageNavItem key={page.id} page={page as PageWithChildren} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function PageNavItem({
  page,
  pathname,
  level = 0,
}: {
  page: PageWithChildren;
  pathname: string;
  level?: number;
}) {
  const isActive = pathname === `/docs/${page.slug}`;
  const hasChildren = page.children && page.children.length > 0;

  return (
    <div>
      <Link
        href={`/docs/${page.slug}`}
        className={cn(
          'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground font-medium border-l-4 border-primary'
            : 'text-muted-foreground',
        )}
        style={{ paddingLeft: `${12 + level * 16}px` }}
      >
        <FileText className="h-4 w-4 shrink-0" />
        <span className="truncate">{page.title}</span>
      </Link>
      {hasChildren && (
        <div className="mt-1">
          {page?.children?.map((child) => (
            child && (
              <PageNavItem
                key={child.id}
                page={child}
                pathname={pathname}
                level={level + 1}
              />
            )
          ))}
        </div>
      )}
    </div>
  );
}


