-- Supabase Documentation App Database Migration
-- This migration creates tables for a documentation app with MDX support

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for ordering
CREATE INDEX idx_categories_order ON categories(order_index);

-- ============================================
-- DOCUMENTATION PAGES TABLE
-- ============================================
CREATE TABLE doc_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  content TEXT NOT NULL, -- MDX content
  description TEXT, -- Meta description for SEO
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  
  -- Hierarchy
  parent_id UUID REFERENCES doc_pages(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Ordering
  order_index INTEGER NOT NULL DEFAULT 0,
  
  -- User tracking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_doc_pages_status ON doc_pages(status);
CREATE INDEX idx_doc_pages_parent ON doc_pages(parent_id);
CREATE INDEX idx_doc_pages_category ON doc_pages(category_id);
CREATE INDEX idx_doc_pages_order ON doc_pages(order_index);
CREATE INDEX idx_doc_pages_created_by ON doc_pages(created_by);
CREATE INDEX idx_doc_pages_slug ON doc_pages(slug);

-- Full-text search index
CREATE INDEX idx_doc_pages_search ON doc_pages USING GIN (
  to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || content)
);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for tag lookup
CREATE INDEX idx_tags_slug ON tags(slug);

-- ============================================
-- PAGE TAGS JOIN TABLE (Many-to-Many)
-- ============================================
CREATE TABLE page_tags (
  page_id UUID NOT NULL REFERENCES doc_pages(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (page_id, tag_id)
);

-- Indexes for efficient querying
CREATE INDEX idx_page_tags_page ON page_tags(page_id);
CREATE INDEX idx_page_tags_tag ON page_tags(tag_id);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for doc_pages
CREATE TRIGGER update_doc_pages_updated_at
  BEFORE UPDATE ON doc_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status != 'published' OR OLD.published_at IS NULL) THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set published_at
CREATE TRIGGER set_doc_pages_published_at
  BEFORE INSERT OR UPDATE ON doc_pages
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE doc_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_tags ENABLE ROW LEVEL SECURITY;

-- Categories Policies
-- Authenticated users (admins) can do everything
CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can view categories
CREATE POLICY "Public can view categories"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

-- Doc Pages Policies
-- Authenticated users (admins) can do everything
CREATE POLICY "Authenticated users can manage doc pages"
  ON doc_pages
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can only view published pages
CREATE POLICY "Public can view published pages"
  ON doc_pages
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Tags Policies
-- Authenticated users can manage tags
CREATE POLICY "Authenticated users can manage tags"
  ON tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can view tags
CREATE POLICY "Public can view tags"
  ON tags
  FOR SELECT
  TO anon
  USING (true);

-- Page Tags Policies
-- Authenticated users can manage page tags
CREATE POLICY "Authenticated users can manage page tags"
  ON page_tags
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can view page tags for published pages
CREATE POLICY "Public can view page tags for published pages"
  ON page_tags
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM doc_pages
      WHERE doc_pages.id = page_tags.page_id
      AND doc_pages.status = 'published'
    )
  );

-- ============================================
-- HELPER FUNCTIONS FOR SEARCH
-- ============================================

-- Function for full-text search on documentation pages
CREATE OR REPLACE FUNCTION search_doc_pages(search_query TEXT)
RETURNS TABLE (
  id UUID,
  title VARCHAR(500),
  slug VARCHAR(500),
  description TEXT,
  status VARCHAR(20),
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dp.id,
    dp.title,
    dp.slug,
    dp.description,
    dp.status,
    ts_rank(
      to_tsvector('english', dp.title || ' ' || COALESCE(dp.description, '') || ' ' || dp.content),
      plainto_tsquery('english', search_query)
    ) AS rank
  FROM doc_pages dp
  WHERE to_tsvector('english', dp.title || ' ' || COALESCE(dp.description, '') || ' ' || dp.content) @@ plainto_tsquery('english', search_query)
  ORDER BY rank DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SAMPLE DATA (Optional - Remove in production)
-- ============================================

-- Insert sample category
INSERT INTO categories (name, slug, description, order_index) 
VALUES 
  ('Getting Started', 'getting-started', 'Essential guides to get you up and running', 1),
  ('API Reference', 'api-reference', 'Complete API documentation', 2),
  ('Tutorials', 'tutorials', 'Step-by-step tutorials', 3);

-- Insert sample tags
INSERT INTO tags (name, slug) 
VALUES 
  ('Beginner', 'beginner'),
  ('Advanced', 'advanced'),
  ('API', 'api'),
  ('Tutorial', 'tutorial');

  -- Migration for the doc_pages table
  -- Migration: Add API Playground fields to doc_pages table
-- This migration adds fields to support interactive API playground functionality

-- Add API playground columns to doc_pages table
ALTER TABLE doc_pages
ADD COLUMN IF NOT EXISTS api_endpoint VARCHAR(500),
ADD COLUMN IF NOT EXISTS api_method VARCHAR(10) CHECK (api_method IN ('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS')),
ADD COLUMN IF NOT EXISTS api_parameters JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS api_request_body_schema JSONB,
ADD COLUMN IF NOT EXISTS api_response_example JSONB;

-- Add index for API endpoint lookups
CREATE INDEX IF NOT EXISTS idx_doc_pages_api_endpoint ON doc_pages(api_endpoint) WHERE api_endpoint IS NOT NULL;

-- Add comment to explain the structure
COMMENT ON COLUMN doc_pages.api_parameters IS 'Array of parameter definitions. Each parameter has: name, type, description, location (query/path/header/body), required (boolean), default (optional)';
COMMENT ON COLUMN doc_pages.api_request_body_schema IS 'JSON schema for request body validation and form generation';
COMMENT ON COLUMN doc_pages.api_response_example IS 'Example response JSON for documentation purposes';

