-- Setup authentication for group-chat application
-- Run this in Supabase SQL Editor

-- 1. Add user_id column to messages table to track message ownership
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT '00000000-0000-0000-0000-000000000001';

-- 2. Set a default user_id for existing messages (we'll create admin user separately)
UPDATE messages
SET user_id = '00000000-0000-0000-0000-000000000001'
WHERE user_id IS NULL;

-- 3. Make user_id NOT NULL after setting defaults
ALTER TABLE messages
ALTER COLUMN user_id SET NOT NULL;

-- 4. Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_ai_models ENABLE ROW LEVEL SECURITY;

-- 5. Conversations RLS policies
CREATE POLICY "Users can view their own conversations" ON conversations
FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create their own conversations" ON conversations
FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own conversations" ON conversations
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own conversations" ON conversations
FOR DELETE USING (created_by = auth.uid());

-- 6. Messages RLS policies
CREATE POLICY "Users can view messages in their conversations" ON messages
FOR SELECT USING (
  user_id = auth.uid() OR
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can create messages in their conversations" ON messages
FOR INSERT WITH CHECK (
  user_id = auth.uid() AND
  conversation_id IN (
    SELECT id FROM conversations WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can update their own messages" ON messages
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own messages" ON messages
FOR DELETE USING (user_id = auth.uid());

-- 7. AI Models RLS policies (readable by all authenticated users)
CREATE POLICY "Authenticated users can view AI models" ON ai_models
FOR SELECT USING (auth.role() = 'authenticated');

-- 8. Conversation AI Models RLS policies
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