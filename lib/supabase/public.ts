import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types';

/**
 * Public client for reading published content (no cookies needed)
 * Use this for cached queries that don't require authentication
 */
export function createPublicClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}


