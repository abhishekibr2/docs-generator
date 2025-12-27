import { NextResponse } from 'next/server';
import { serializeMDX } from '@/lib/mdx';

export async function POST(request: Request) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 },
      );
    }

    const mdxSource = await serializeMDX(content);
    
    // Return the serialized MDX source (it's already JSON-serializable)
    return NextResponse.json(mdxSource);
  } catch (error: any) {
    console.error('Error serializing MDX:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to serialize MDX' },
      { status: 500 },
    );
  }
}

