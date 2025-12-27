import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const pageSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9-/]+$/).optional(),
  description: z.string().optional(),
  content: z.string().min(1).optional(),
  status: z.enum(['draft', 'published']).optional(),
  category_id: z.string().uuid().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  order_index: z.number().min(0).optional(),
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

    const { error } = await supabase.from('doc_pages').delete().eq('id', id);

    if (error) {
      throw error;
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


