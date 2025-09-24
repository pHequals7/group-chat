-- Setup authentication for group-chat application
-- This migration adds user authentication support and creates proper RLS policies

-- 1. Add user_id column to messages table to track message ownership (nullable for now)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS user_id UUID;

-- Note: Create admin user manually through Supabase Dashboard -> Authentication -> Users
-- Email: admin@email.com, Password: admin123
-- After creating the user, get their UUID and update existing messages

-- 2. Add foreign key constraint (will be enforced after user creation)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_user_id_fkey'
  ) THEN
    ALTER TABLE messages
    ADD CONSTRAINT messages_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id);
  END IF;
END $$;

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);

-- 5. Enable RLS (Row Level Security) on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_ai_models ENABLE ROW LEVEL SECURITY;

-- 6. Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Users can view their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON conversations;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can create messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON messages;

DROP POLICY IF EXISTS "Authenticated users can view AI models" ON ai_models;

DROP POLICY IF EXISTS "Users can view AI models in their conversations" ON conversation_ai_models;
DROP POLICY IF EXISTS "Users can manage AI models in their conversations" ON conversation_ai_models;

-- 7. Conversations RLS policies
CREATE POLICY "Users can view their own conversations" ON conversations
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own conversations" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
FOR DELETE USING (created_by = auth.uid());

-- 8. Messages RLS policies
-- Users can view messages in conversations they own
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  user_id = auth.uid() OR
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

-- Users can create messages in their own conversations
CREATE POLICY "Users can create messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (user_id = auth.uid());

-- 9. AI Models RLS policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view AI models" ON ai_models
FOR SELECT USING (auth.role() = 'authenticated');

-- 10. Conversation AI Models RLS policies
CREATE POLICY "Users can view AI models in their conversations" ON conversation_ai_models
FOR SELECT USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage AI models in their conversations" ON conversation_ai_models
FOR ALL USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

-- 11. Create a function to automatically set user_id on new messages
CREATE OR REPLACE FUNCTION public.set_user_id_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set user_id to the current authenticated user
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create trigger to automatically set user_id
DROP TRIGGER IF EXISTS trigger_set_user_id_on_message ON messages;
CREATE TRIGGER trigger_set_user_id_on_message
  BEFORE INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_id_on_message();

-- 13. Create a function to automatically set created_by on new conversations
CREATE OR REPLACE FUNCTION public.set_created_by_on_conversation()
RETURNS TRIGGER AS $$
BEGIN
  -- Automatically set created_by to the current authenticated user
  NEW.created_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Create trigger to automatically set created_by
DROP TRIGGER IF EXISTS trigger_set_created_by_on_conversation ON conversations;
CREATE TRIGGER trigger_set_created_by_on_conversation
  BEFORE INSERT ON conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_created_by_on_conversation();