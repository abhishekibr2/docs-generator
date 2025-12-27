'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { PageActions } from './page-actions';
import type { DocPageWithRelations, Category } from '@/types';

export function PageList({
  pages,
  categories,
}: {
  pages: DocPageWithRelations[];
  categories: Category[];
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPages = pages.filter((page) => {
    const matchesSearch =
      page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      page.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === 'all' || page.category_id === categoryFilter;
    const matchesStatus =
      statusFilter === 'all' || page.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Input
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg">
        {filteredPages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>No pages found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredPages.map((page) => (
              <div
                key={page.id}
                className="flex items-center justify-between p-4 hover:bg-accent transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/pages/${page.id}/edit`}
                      className="font-medium hover:underline"
                    >
                      {page.title}
                    </Link>
                    <Badge
                      variant={page.status === 'published' ? 'default' : 'secondary'}
                    >
                      {page.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Slug: {page.slug}
                    {page.category && ` • Category: ${page.category.name}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/pages/${page.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                  <PageActions page={page} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


