-- Add metadata column to messages table for storing reply relationships and conversation mode
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add an index on metadata for better query performance on reply relationships
CREATE INDEX IF NOT EXISTS idx_messages_metadata_gin ON messages USING gin(metadata);

-- Add a comment to document the column usage
COMMENT ON COLUMN messages.metadata IS 'Stores reply relationships and conversation mode information as JSON';