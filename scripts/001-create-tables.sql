-- Create sites table (websites being tracked)
CREATE TABLE sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, domain)
);

-- Create page_views table (individual page view events)
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  city TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  device TEXT,
  browser TEXT,
  os TEXT,
  screen_width INTEGER,
  screen_height INTEGER,
  duration INTEGER DEFAULT 0,
  lcp DOUBLE PRECISION,
  inp DOUBLE PRECISION,
  cls DOUBLE PRECISION,
  fcp DOUBLE PRECISION,
  ttfb DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sessions table (visitor sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  page_count INTEGER DEFAULT 1,
  bounced BOOLEAN DEFAULT TRUE
);

-- Create index for faster queries
CREATE INDEX idx_page_views_site_id ON page_views(site_id);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX idx_sessions_site_id ON sessions(site_id);
CREATE INDEX idx_sessions_started_at ON sessions(started_at);

-- Enable Row Level Security
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for sites (users can only access their own sites)
CREATE POLICY "Users can view their own sites" ON sites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own sites" ON sites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sites" ON sites FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sites" ON sites FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for page_views (users can view data for their sites)
CREATE POLICY "Users can view page_views for their sites" ON page_views FOR SELECT 
  USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- RLS policies for sessions (users can view sessions for their sites)
CREATE POLICY "Users can view sessions for their sites" ON sessions FOR SELECT 
  USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- Public insert policies for tracking (no auth required for tracking script)
CREATE POLICY "Anyone can insert page_views" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can insert sessions" ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON sessions FOR UPDATE USING (true);
