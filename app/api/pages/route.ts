import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const pageSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/),
  description: z.string().optional(),
  content: z.string().min(1),
  status: z.enum(['draft', 'published']),
  category_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order_index: z.number().min(0).default(0),
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

    return NextResponse.json(page);
  } catch (error: any) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create page' },
      { status: 400 },
    );
  }
}


