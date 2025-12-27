import { createClient } from './server';
import { createPublicClient } from './public';
import { createAdminClient } from './admin';
import { unstable_cache } from 'next/cache';
import type {
  Category,
  DocPage,
  CategoryWithPages,
  DocPageWithRelations,
  SearchResult,
  Database,
} from '@/types';

// ============================================
// PUBLIC QUERIES (for documentation viewer)
// ============================================

/**
 * Internal function to fetch categories with pages (uncached)
 */
async function _getCategoriesWithPagesInternal(): Promise<CategoryWithPages[]> {
  const supabase = createPublicClient();

  // Fetch categories ordered by order_index
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (categoriesError) {
    throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
  }

  // Fetch all published pages
  const { data: pages, error: pagesError } = await supabase
    .from('doc_pages')
    .select('*')
    .eq('status', 'published')
    .order('order_index', { ascending: true });

  if (pagesError) {
    throw new Error(`Failed to fetch pages: ${pagesError.message}`);
  }

  const pagesList: DocPage[] = (pages || []) as DocPage[];
  const categoriesList: Category[] = (categories || []) as Category[];

  // Group pages by category
  const categoriesWithPages: CategoryWithPages[] = categoriesList.map(
    (category) => ({
      ...category,
      pages: pagesList.filter(
        (page) => page.category_id === category.id && !page.parent_id,
      ),
    }),
  );

  // Build nested page structure
  const buildPageTree = (parentId: string | null): DocPage[] => {
    return pagesList
      .filter((page) => page.parent_id === parentId)
      .map((page) => ({
        ...page,
        children: buildPageTree(page.id),
      })) as DocPage[];
  };

  // Add nested children to pages
  categoriesWithPages.forEach((category) => {
    category.pages = category.pages.map((page) => ({
      ...page,
      children: buildPageTree(page.id),
    })) as DocPage[];
  });

  return categoriesWithPages;
}

/**
 * Get all categories with their published pages, ordered by order_index
 * Cached for 60 seconds to avoid blocking routes
 */
export async function getCategoriesWithPages(): Promise<CategoryWithPages[]> {
  return unstable_cache(
    async () => _getCategoriesWithPagesInternal(),
    ['getCategoriesWithPages'],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ['categories', 'doc-pages'],
    }
  )();
}

/**
 * Get a single page by slug with all relations
 */
export async function getPageBySlug(slug: string): Promise<DocPageWithRelations | null> {
  const supabase = createPublicClient();

  const { data: page, error } = await supabase
    .from('doc_pages')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error || !page) {
    return null;
  }

  const pageData = page as DocPage;

  // Fetch category
  let category: Category | null = null;
  if (pageData.category_id) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', pageData.category_id)
      .single();
    category = data as Category | null;
  }

  // Fetch parent
  let parent: DocPage | null = null;
  if (pageData.parent_id) {
    const { data } = await supabase
      .from('doc_pages')
      .select('*')
      .eq('id', pageData.parent_id)
      .single();
    parent = data as DocPage | null;
  }

  // Fetch tags
  const { data: pageTags } = await supabase
    .from('page_tags')
    .select('tag_id')
    .eq('page_id', pageData.id);

  const tagIds = pageTags?.map((pt: any) => pt.tag_id) || [];
  let tags: any[] = [];
  if (tagIds.length > 0) {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);
    tags = (data || []) as any[];
  }

  return {
    ...pageData,
    category,
    parent,
    tags,
  };
}

/**
 * Internal function to fetch page by slug array (uncached)
 */
async function _getPageBySlugArrayInternal(
  slugArray: string[],
): Promise<DocPageWithRelations | null> {
  if (slugArray.length === 0) {
    return null;
  }

  const supabase = createPublicClient();

  // Try to find page with matching slug (could be full path or just last segment)
  const lastSlug = slugArray[slugArray.length - 1];
  const fullSlug = slugArray.join('/');

  // First try full slug
  let page = await getPageBySlug(fullSlug);
  if (page) {
    return page;
  }

  // Then try last segment
  page = await getPageBySlug(lastSlug);
  if (page) {
    return page;
  }

  // Also try querying directly with all possible slug variations
  // This handles cases where the slug might be stored differently
  const { data: pages, error } = await supabase
    .from('doc_pages')
    .select('*')
    .eq('status', 'published')
    .or(`slug.eq.${fullSlug},slug.eq.${lastSlug},slug.ilike.%${lastSlug}%`);

  if (!error && pages && pages.length > 0) {
    // Use the first matching page
    const matchedPage = pages[0] as DocPage;
    
    // Fetch relations
    let category: Category | null = null;
    if (matchedPage.category_id) {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('id', matchedPage.category_id)
        .single();
      category = data as Category | null;
    }

    let parent: DocPage | null = null;
    if (matchedPage.parent_id) {
      const { data } = await supabase
        .from('doc_pages')
        .select('*')
        .eq('id', matchedPage.parent_id)
        .single();
      parent = data as DocPage | null;
    }

    // Fetch tags
    const { data: pageTags } = await supabase
      .from('page_tags')
      .select('tag_id')
      .eq('page_id', matchedPage.id);

    const tagIds = pageTags?.map((pt: any) => pt.tag_id) || [];
    let tags: any[] = [];
    if (tagIds.length > 0) {
      const { data } = await supabase
        .from('tags')
        .select('*')
        .in('id', tagIds);
      tags = (data || []) as any[];
    }

    return {
      ...matchedPage,
      category,
      parent,
      tags,
    };
  }

  return null;
}

/**
 * Get page by slug array (for nested routes like /docs/getting-started/installation)
 * Cached for 60 seconds to avoid blocking routes
 */
export async function getPageBySlugArray(
  slugArray: string[],
): Promise<DocPageWithRelations | null> {
  const cacheKey = `getPageBySlugArray-${slugArray.join('/')}`;
  
  return unstable_cache(
    async () => _getPageBySlugArrayInternal(slugArray),
    [cacheKey],
    {
      revalidate: 60, // Cache for 60 seconds
      tags: ['doc-pages'],
    }
  )();
}

/**
 * Get breadcrumb hierarchy for a page
 */
export async function getPageHierarchy(
  pageId: string,
): Promise<DocPageWithRelations[]> {
  const supabase = createPublicClient();
  const hierarchy: DocPageWithRelations[] = [];

  let currentPageId: string | null = pageId;

  while (currentPageId) {
    const { data: page, error } = await supabase
      .from('doc_pages')
      .select('*')
      .eq('id', currentPageId)
      .single();

    if (error || !page) {
      break;
    }

    const pageData = page as DocPage;

    // Fetch category and parent
    let category: Category | null = null;
    if (pageData.category_id) {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('id', pageData.category_id)
        .single();
      category = data as Category | null;
    }

    let parent: DocPage | null = null;
    if (pageData.parent_id) {
      const { data } = await supabase
        .from('doc_pages')
        .select('*')
        .eq('id', pageData.parent_id)
        .single();
      parent = data as DocPage | null;
    }

    hierarchy.unshift({
      ...pageData,
      category,
      parent,
      tags: [],
    });

    currentPageId = pageData.parent_id;
  }

  return hierarchy;
}

/**
 * Extract a snippet from content around the search query
 */
function extractSnippet(content: string, query: string, maxLength: number = 150): string {
  if (!content || !query) return '';
  
  const lowerContent = content.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const queryIndex = lowerContent.indexOf(lowerQuery);
  
  if (queryIndex === -1) {
    // If exact match not found, return first part of content
    return content.substring(0, maxLength).trim() + (content.length > maxLength ? '...' : '');
  }
  
  // Find a good starting point (try to center the match)
  const start = Math.max(0, queryIndex - Math.floor(maxLength / 2));
  const end = Math.min(content.length, start + maxLength);
  
  let snippet = content.substring(start, end);
  
  // Add ellipsis if needed
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';
  
  return snippet.trim();
}

/**
 * Search pages using full-text search
 */
export async function searchPages(query: string): Promise<(SearchResult & { snippet?: string })[]> {
  const supabase = createPublicClient();

  if (!query || query.trim().length === 0) {
    return [];
  }

  const { data, error } = await supabase.rpc('search_doc_pages', {
    search_query: query.trim(),
  } as any);

  if (error) {
    console.error('Search error:', error);
    return [];
  }

  // Filter to only published pages
  const results = (data || []) as SearchResult[];
  const publishedResults = results.filter((result) => result.status === 'published');
  
  // Fetch content for each result to extract snippets
  const resultsWithSnippets = await Promise.all(
    publishedResults.map(async (result) => {
      // Fetch the page content to extract snippet
      const { data: pageData } = await supabase
        .from('doc_pages')
        .select('content')
        .eq('id', result.id)
        .single();
      
      const content = pageData && typeof pageData === 'object' && 'content' in pageData
        ? (pageData as { content: string }).content
        : null;
      
      const snippet = content 
        ? extractSnippet(content, query.trim())
        : undefined;
      
      return {
        ...result,
        snippet,
      };
    })
  );
  
  return resultsWithSnippets;
}

// ============================================
// ADMIN QUERIES (require authentication)
// ============================================

/**
 * Get all categories (admin - includes all, not just published)
 */
export async function getAllCategories(): Promise<Category[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all pages (admin - includes drafts)
 */
export async function getAllPages(): Promise<DocPageWithRelations[]> {
  const supabase = await createClient();

  const { data: pages, error } = await supabase
    .from('doc_pages')
    .select('*')
    .order('order_index', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch pages: ${error.message}`);
  }

  // Fetch relations for each page
  const pagesWithRelations: DocPageWithRelations[] = await Promise.all(
    (pages || []).map(async (page) => {
      let category: Category | null = null;
      if (page.category_id) {
        const { data } = await supabase
          .from('categories')
          .select('*')
          .eq('id', page.category_id)
          .single();
        category = data;
      }

      let parent: DocPage | null = null;
      if (page.parent_id) {
        const { data } = await supabase
          .from('doc_pages')
          .select('*')
          .eq('id', page.parent_id)
          .single();
        parent = data;
      }

      // Fetch tags
      const { data: pageTags } = await supabase
        .from('page_tags')
        .select('tag_id')
        .eq('page_id', page.id);

      const tagIds = pageTags?.map((pt) => pt.tag_id) || [];
      let tags: any[] = [];
      if (tagIds.length > 0) {
        const { data } = await supabase
          .from('tags')
          .select('*')
          .in('id', tagIds);
        tags = data || [];
      }

      return {
        ...page,
        category,
        parent,
        tags,
      };
    }),
  );

  return pagesWithRelations;
}

/**
 * Get page by ID (admin - includes drafts)
 */
export async function getPageById(
  id: string,
): Promise<DocPageWithRelations | null> {
  const supabase = await createClient();

  const { data: page, error } = await supabase
    .from('doc_pages')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !page) {
    return null;
  }

  // Fetch relations
  let category: Category | null = null;
  if (page.category_id) {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('id', page.category_id)
      .single();
    category = data;
  }

  let parent: DocPage | null = null;
  if (page.parent_id) {
    const { data } = await supabase
      .from('doc_pages')
      .select('*')
      .eq('id', page.parent_id)
      .single();
    parent = data;
  }

  // Fetch tags
  const { data: pageTags } = await supabase
    .from('page_tags')
    .select('tag_id')
    .eq('page_id', page.id);

  const tagIds = pageTags?.map((pt) => pt.tag_id) || [];
  let tags: any[] = [];
  if (tagIds.length > 0) {
    const { data } = await supabase
      .from('tags')
      .select('*')
      .in('id', tagIds);
    tags = data || [];
  }

  return {
    ...page,
    category,
    parent,
    tags,
  };
}

/**
 * Get all tags
 */
export async function getAllTags() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch tags: ${error.message}`);
  }

  return data || [];
}

/**
 * Get dashboard stats
 */
export async function getDashboardStats() {
  const supabase = await createClient();

  const [pagesResult, categoriesResult, publishedResult, draftsResult] =
    await Promise.all([
      supabase.from('doc_pages').select('id', { count: 'exact', head: true }),
      supabase.from('categories').select('id', { count: 'exact', head: true }),
      supabase
        .from('doc_pages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'published'),
      supabase
        .from('doc_pages')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'draft'),
    ]);

  return {
    totalPages: pagesResult.count || 0,
    totalCategories: categoriesResult.count || 0,
    publishedPages: publishedResult.count || 0,
    draftPages: draftsResult.count || 0,
  };
}

/**
 * Get recent pages (admin)
 */
export async function getRecentPages(limit: number = 10) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('doc_pages')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch recent pages: ${error.message}`);
  }

  return data || [];
}


