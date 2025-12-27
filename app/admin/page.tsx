import Link from 'next/link';
import { getDashboardStats, getRecentPages } from '@/lib/supabase/queries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Folder, Eye, FileQuestion, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default async function AdminDashboard() {
  const stats = await getDashboardStats();
  const recentPages = await getRecentPages(5);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your documentation
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/admin/pages/new">
              <Plus className="h-4 w-4 mr-2" />
              New Page
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/categories">
              <Plus className="h-4 w-4 mr-2" />
              New Category
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pages</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPages}</div>
            <p className="text-xs text-muted-foreground">
              All documentation pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPages}</div>
            <p className="text-xs text-muted-foreground">
              Live pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <FileQuestion className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.draftPages}</div>
            <p className="text-xs text-muted-foreground">
              Unpublished pages
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
            <p className="text-xs text-muted-foreground">
              Documentation categories
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Pages</CardTitle>
          <CardDescription>
            Pages that were recently updated
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentPages.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No pages yet. Create your first page to get started.
            </p>
          ) : (
            <div className="space-y-4">
              {recentPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/pages/${page.id}/edit`}
                        className="font-medium hover:underline"
                      >
                        {page.title}
                      </Link>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        }`}
                      >
                        {page.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Updated{' '}
                      {formatDistanceToNow(new Date(page.updated_at), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/pages/${page.id}/edit`}>Edit</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


