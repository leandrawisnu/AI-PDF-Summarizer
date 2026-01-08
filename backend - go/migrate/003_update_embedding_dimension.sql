-- Migration: Update embedding dimension from 768 to 384
-- Reason: Switching from Gemini embedding-001 to HuggingFace all-MiniLM-L6-v2

-- Drop existing embeddings (they're incompatible with new model)
UPDATE summaries SET embedding = NULL;

-- Alter the column type to use 384 dimensions
ALTER TABLE summaries ALTER COLUMN embedding TYPE vector(384);

-- Note: You'll need to regenerate summaries to get new embeddings
-- The new embeddings will be generated automatically when creating new summaries