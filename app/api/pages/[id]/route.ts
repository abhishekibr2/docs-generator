import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';

const pageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/).optional(),
  description: z.string().optional(),
  content: z.string().optional(), // Optional - can be empty if API playground mode is enabled
  status: z.enum(['draft', 'published']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order_index: z.number().min(0).optional(),
  api_endpoint: z.string().nullable().optional(),
  api_method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).nullable().optional(),
  api_parameters: z.array(z.any()).nullable().optional(),
  api_request_body_schema: z.any().nullable().optional(),
  api_response_example: z.any().nullable().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = pageSchema.parse(body);

    // Get the current page to check for slug changes
    const { data: currentPage } = await supabase
      .from('doc_pages')
      .select('slug, status')
      .eq('id', id)
      .single();

    // If slug is being updated, check if it already exists
    if (data.slug) {
      const { data: existing } = await supabase
        .from('doc_pages')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 },
        );
      }
    }

    const { data: page, error } = await supabase
      .from('doc_pages')
      .update({
        ...data,
        updated_by: user.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Revalidate cache tags and paths to update the sidebar and pages list
    // @ts-expect-error - Next.js 16 type definitions may be incorrect
    revalidateTag('categories');
    // @ts-expect-error - Next.js 16 type definitions may be incorrect
    revalidateTag('doc-pages');
    revalidatePath('/docs', 'page');
    revalidatePath('/admin/pages', 'page');
    revalidatePath('/api-reference', 'page');
    
    // Revalidate old path if slug changed
    if (currentPage?.slug && data.slug && currentPage.slug !== data.slug) {
      revalidatePath(`/docs/${currentPage.slug}`, 'page');
    }
    
    // Revalidate new/current page path if published
    const finalStatus = data.status || currentPage?.status;
    const finalSlug = data.slug || currentPage?.slug;
    if (finalStatus === 'published' && finalSlug) {
      revalidatePath(`/docs/${finalSlug}`, 'page');
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Error updating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update page' },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the page data before deleting to revalidate its path
    const { data: pageToDelete } = await supabase
      .from('doc_pages')
      .select('slug, status')
      .eq('id', id)
      .single();

    const { error } = await supabase.from('doc_pages').delete().eq('id', id);

    if (error) {
      throw error;
    }

    // Revalidate cache tags and paths to update the sidebar and pages list
    // @ts-expect-error - Next.js 16 type definitions may be incorrect
    revalidateTag('categories');
    // @ts-expect-error - Next.js 16 type definitions may be incorrect
    revalidateTag('doc-pages');
    revalidatePath('/docs', 'page');
    revalidatePath('/admin/pages', 'page');
    revalidatePath('/api-reference', 'page');
    
    // Revalidate the deleted page's path if it was published
    if (pageToDelete?.status === 'published' && pageToDelete?.slug) {
      revalidatePath(`/docs/${pageToDelete.slug}`, 'page');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete page' },
      { status: 400 },
    );
  }
}



