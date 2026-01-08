-- Migration: Update embedding dimension to 1024
-- Reason: Using custom embedding API with 1024 dimensions

-- Drop existing embeddings (incompatible with new dimension)
UPDATE summaries SET embedding = NULL;

-- Alter the column type to use 1024 dimensions
ALTER TABLE summaries ALTER COLUMN embedding TYPE vector(1024);

-- Note: You'll need to regenerate summaries to get new embeddings