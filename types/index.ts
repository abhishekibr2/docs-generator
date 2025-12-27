// Type helpers for database types
// Run: npx supabase gen types typescript --project-id <your-project-id> > types/database.types.ts
// to generate the actual database types

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      doc_pages: {
        Row: {
          id: string;
          title: string;
          slug: string;
          content: string;
          description: string | null;
          status: 'draft' | 'published';
          parent_id: string | null;
          category_id: string | null;
          order_index: number;
          created_by: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          slug: string;
          content: string;
          description?: string | null;
          status?: 'draft' | 'published';
          parent_id?: string | null;
          category_id?: string | null;
          order_index?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          slug?: string;
          content?: string;
          description?: string | null;
          status?: 'draft' | 'published';
          parent_id?: string | null;
          category_id?: string | null;
          order_index?: number;
          created_by?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
        };
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_at?: string;
        };
      };
      page_tags: {
        Row: {
          page_id: string;
          tag_id: string;
          created_at: string;
        };
        Insert: {
          page_id: string;
          tag_id: string;
          created_at?: string;
        };
        Update: {
          page_id?: string;
          tag_id?: string;
          created_at?: string;
        };
      };
    };
    Functions: {
      search_doc_pages: {
        Args: {
          search_query: string;
        };
        Returns: {
          id: string;
          title: string;
          slug: string;
          description: string | null;
          status: string;
          rank: number;
        }[];
      };
    };
  };
};

// Helper types
export type Category = Database['public']['Tables']['categories']['Row'];
export type DocPage = Database['public']['Tables']['doc_pages']['Row'];
export type Tag = Database['public']['Tables']['tags']['Row'];
export type PageTag = Database['public']['Tables']['page_tags']['Row'];

export type CategoryWithPages = Category & {
  pages: DocPage[];
};

export type DocPageWithRelations = DocPage & {
  category: Category | null;
  parent: DocPage | null;
  tags: Tag[];
};

export type SearchResult = Database['public']['Functions']['search_doc_pages']['Returns'][0];


