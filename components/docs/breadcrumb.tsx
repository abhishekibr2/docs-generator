import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { DocPageWithRelations } from '@/types';

export function DocBreadcrumb({ page }: { page: DocPageWithRelations }) {
  const items = [];

  // Add home
  items.push(
    <BreadcrumbItem key="home">
      <BreadcrumbLink asChild>
        <Link href="/">
          <Home className="h-4 w-4" />
        </Link>
      </BreadcrumbLink>
    </BreadcrumbItem>,
  );

  // Add category if exists
  if (page.category) {
    items.push(
      <BreadcrumbSeparator key="sep-category" />,
      <BreadcrumbItem key="category">
        <BreadcrumbLink asChild>
          <Link href={`/docs?category=${page.category.slug}`}>
            {page.category.name}
          </Link>
        </BreadcrumbLink>
      </BreadcrumbItem>,
    );
  }

  // Add parent pages if they exist
  let currentParent = page.parent;
  const parentPages: DocPageWithRelations[] = [];
  while (currentParent) {
    parentPages.unshift(currentParent as DocPageWithRelations);
    // Note: We'd need to fetch full parent hierarchy, but for now we'll just show the direct parent
    break;
  }

  parentPages.forEach((parent) => {
    items.push(
      <BreadcrumbSeparator key={`sep-${parent.id}`} />,
      <BreadcrumbItem key={parent.id}>
        <BreadcrumbLink asChild>
          <Link href={`/docs/${parent.slug}`}>{parent.title}</Link>
        </BreadcrumbLink>
      </BreadcrumbItem>,
    );
  });

  // Add current page
  items.push(
    <BreadcrumbSeparator key="sep-current" />,
    <BreadcrumbItem key="current">
      <BreadcrumbPage>{page.title}</BreadcrumbPage>
    </BreadcrumbItem>,
  );

  return (
    <Breadcrumb className="mb-6">
      <BreadcrumbList>{items}</BreadcrumbList>
    </Breadcrumb>
  );
}


