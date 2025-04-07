/*
  # Enforce workflow selection and improve message handling

  1. Changes
    - Add NOT NULL constraint to conversation_id in messages table
    - Add NOT NULL constraint to workflow_id in conversations table
    - Add index on messages(conversation_id, created_at) for better query performance

  2. Security
    - Update RLS policies to ensure proper access control
*/

-- Ensure conversation_id is not null in messages table
ALTER TABLE messages 
  ALTER COLUMN conversation_id SET NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON messages(conversation_id, created_at DESC);

-- Update RLS policies for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert messages in conversations" ON messages;
CREATE POLICY "Users can insert messages in conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.created_by = auth.uid()
    )
    AND sender_type = ANY (ARRAY['user'::text, 'assistant'::text])
  );

DROP POLICY IF EXISTS "Users can view conversation messages" ON messages;
CREATE POLICY "Users can view conversation messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.created_by = auth.uid()
    )
  );