import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    const formData = await request.formData();
    const direction = formData.get('direction') as string;

    // Get current category
    const { data: currentCategory, error: fetchError } = await supabase
      .from('categories')
      .select('order_index')
      .eq('id', id)
      .single();

    if (fetchError || !currentCategory) {
      throw new Error('Category not found');
    }

    const currentIndex = currentCategory.order_index;
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    // Find category at new index
    const { data: swapCategory } = await supabase
      .from('categories')
      .select('id, order_index')
      .eq('order_index', newIndex)
      .single();

    if (swapCategory) {
      // Swap order indices
      await supabase
        .from('categories')
        .update({ order_index: currentIndex })
        .eq('id', swapCategory.id);

      await supabase
        .from('categories')
        .update({ order_index: newIndex })
        .eq('id', id);
    } else {
      // Just update current category
      await supabase
        .from('categories')
        .update({ order_index: newIndex })
        .eq('id', id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error reordering category:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to reorder category' },
      { status: 400 },
    );
  }
}


