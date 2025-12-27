import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
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
    const data = categorySchema.parse(body);

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', data.slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 },
      );
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(category);
  } catch (error: any) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create category' },
      { status: 400 },
    );
  }
}


