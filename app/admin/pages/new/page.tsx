import { getAllCategories, getAllPages } from '@/lib/supabase/queries';
import { PageEditor } from '@/components/admin/page-editor';

export default async function NewPagePage() {
  const categories = await getAllCategories();
  const pages = await getAllPages();

  return <PageEditor categories={categories} pages={pages} />;
}



