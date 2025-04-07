/*
  # Fix Messages Table RLS Policies

  1. Changes
    - Drop existing RLS policies for messages table
    - Create new comprehensive RLS policies
    - Add explicit check for conversation ownership
    - Ensure proper handling of both user and assistant messages

  2. Security
    - Enable RLS on messages table
    - Add policies for:
      - Message insertion (users can only insert into their conversations)
      - Message viewing (users can only view messages in their conversations)
    - Enforce sender_type validation
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can insert messages" ON messages;

-- Make sure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create insert policy with explicit conversation ownership check
CREATE POLICY "Users can insert messages in conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- Verify conversation ownership
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.created_by = auth.uid()
    )
  )
  AND
  -- Validate sender type
  sender_type IN ('user', 'assistant')
);

-- Create select policy for viewing messages
CREATE POLICY "Users can view conversation messages"
ON messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = conversation_id
    AND conversations.created_by = auth.uid()
  )
);

-- Grant necessary permissions
GRANT ALL ON messages TO authenticated;