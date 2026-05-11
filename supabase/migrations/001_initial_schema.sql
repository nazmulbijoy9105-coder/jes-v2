-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge chunks table with embeddings (384-dim for MiniLM)
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    area TEXT NOT NULL CHECK (area IN (
        'constitutional', 'criminal', 'property', 'family', 
        'labour', 'company', 'tax', 'contract', 'nrb', 'general'
    )),
    sub_area TEXT,
    religion TEXT CHECK (religion IN ('muslim', 'hindu', 'christian', 'adibashi', 'general')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    legal_basis TEXT,
    procedure TEXT,
    conclusion TEXT,
    act_name TEXT,
    section_numbers TEXT[],
    year_enacted INTEGER,
    last_verified DATE,
    verified_by TEXT,
    is_active BOOLEAN DEFAULT true,
    embedding VECTOR(384),
    trigger_keywords TEXT[],
    confidence_score FLOAT DEFAULT 0.0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    version INTEGER DEFAULT 1
);

CREATE INDEX idx_knowledge_embedding ON knowledge_chunks 
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX idx_knowledge_keywords ON knowledge_chunks USING GIN(trigger_keywords);
CREATE INDEX idx_knowledge_area ON knowledge_chunks(area);
CREATE INDEX idx_knowledge_religion ON knowledge_chunks(religion) WHERE religion IS NOT NULL;

-- Safety incidents log
CREATE TABLE safety_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    query_text TEXT NOT NULL,
    detected_keywords TEXT[],
    severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    action_taken TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversations with full audit trail
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    area TEXT,
    religion TEXT,
    messages JSONB NOT NULL DEFAULT '[]',
    retrieved_chunks UUID[],
    retrieval_confidence FLOAT,
    llm_used TEXT,
    safety_flags JSONB,
    query_count INTEGER DEFAULT 0,
    is_paid BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles with religion preference
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    email TEXT,
    phone TEXT,
    religion TEXT CHECK (religion IN ('muslim', 'hindu', 'christian', 'adibashi', 'prefer_not_say', null)),
    preferred_language TEXT DEFAULT 'english',
    is_paid BOOLEAN DEFAULT false,
    queries_today INTEGER DEFAULT 0,
    last_query_date DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Update triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_knowledge_chunks_updated
    BEFORE UPDATE ON knowledge_chunks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_conversations_updated
    BEFORE UPDATE ON conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_user_profiles_updated
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Vector search function (384-dim)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding VECTOR(384),
  match_threshold FLOAT,
  match_count INT
)
RETURNS TABLE(
  id UUID,
  area TEXT,
  sub_area TEXT,
  religion TEXT,
  question TEXT,
  answer TEXT,
  legal_basis TEXT,
  procedure TEXT,
  conclusion TEXT,
  act_name TEXT,
  section_numbers TEXT[],
  trigger_keywords TEXT[],
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id, area, sub_area, religion, question, answer, legal_basis, procedure, conclusion,
    act_name, section_numbers, trigger_keywords,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks
  WHERE is_active = true
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Keyword search function
CREATE OR REPLACE FUNCTION keyword_search_chunks(
  search_query TEXT,
  search_area TEXT DEFAULT NULL,
  search_religion TEXT DEFAULT NULL,
  match_count INT DEFAULT 10
)
RETURNS TABLE(
  id UUID,
  area TEXT,
  question TEXT,
  answer TEXT,
  legal_basis TEXT,
  keyword_score FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id, area, question, answer, legal_basis,
    ts_rank(to_tsvector('english', question || ' ' || answer), plainto_tsquery('english', search_query)) AS keyword_score
  FROM knowledge_chunks
  WHERE is_active = true
    AND (search_area IS NULL OR area = search_area)
    AND (search_religion IS NULL OR religion = search_religion OR religion = 'general')
    AND to_tsvector('english', question || ' ' || answer || ' ' || COALESCE(array_to_string(trigger_keywords, ' '), '')) 
        @@ plainto_tsquery('english', search_query)
  ORDER BY keyword_score DESC
  LIMIT match_count;
$$;