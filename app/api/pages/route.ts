import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { revalidateTag, revalidatePath } from 'next/cache';

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/),
  description: z.string().optional(),
  content: z.string().optional(), // Optional - can be empty if API playground mode is enabled
  status: z.enum(['draft', 'published']),
  category_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order_index: z.number().min(0).default(0),
  api_endpoint: z.string().nullable().optional(),
  api_method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).nullable().optional(),
  api_parameters: z.array(z.any()).nullable().optional(),
  api_request_body_schema: z.any().nullable().optional(),
  api_response_example: z.any().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const data = pageSchema.parse(body);

    // Validate: either content or API playground data must be provided
    const hasContent = data.content && data.content.trim().length > 0;
    const hasApiPlayground = data.api_endpoint && data.api_method;
    
    if (!hasContent && !hasApiPlayground) {
      return NextResponse.json(
        { error: 'Either content or API playground configuration (endpoint and method) is required' },
        { status: 400 },
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('doc_pages')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 },
      );
    }

    const { data: page, error } = await supabase
      .from('doc_pages')
      .insert({
        ...data,
        created_by: user.id,
        updated_by: user.id,
      })
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
    
    // If page is published, also revalidate its specific path
    if (page.status === 'published' && page.slug) {
      revalidatePath(`/docs/${page.slug}`, 'page');
    }

    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 400 },
    );
  }
}



