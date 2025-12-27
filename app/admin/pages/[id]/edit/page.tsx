import { notFound } from 'next/navigation';
import { getPageById, getAllCategories, getAllPages } from '@/lib/supabase/queries';
import { PageEditor } from '@/components/admin/page-editor';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPagePage({ params }: PageProps) {
  const { id } = await params;
  const page = await getPageById(id);
  const categories = await getAllCategories();
  const pages = await getAllPages();

  if (!page) {
    notFound();
  }

  return <PageEditor page={page} categories={categories} pages={pages} />;
}



