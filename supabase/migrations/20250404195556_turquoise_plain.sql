/*
  # Fix Messages RLS Policy

  1. Changes
    - Drop existing insert policy for messages table
    - Create new policy that allows:
      - Users to insert messages in their conversations
      - Both 'user' and 'assistant' sender types
      - Proper conversation ownership verification

  2. Security
    - Maintains RLS enabled
    - Verifies conversation ownership through auth.uid()
    - Validates sender_type values
*/

-- Drop existing insert policy
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Create new insert policy with proper checks
CREATE POLICY "Users can insert messages in their conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE 
      conversations.id = conversation_id 
      AND conversations.created_by = auth.uid()
  )
  AND
  sender_type IN ('user', 'assistant')
);

-- Ensure RLS is enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;