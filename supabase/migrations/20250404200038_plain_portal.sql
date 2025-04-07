/*
  # Fix Messages RLS Policies

  1. Changes
    - Drop existing policies on messages table
    - Create new policies for inserting and viewing messages
    - Enable RLS on messages table
    - Add policy for inserting messages with proper conversation ownership check
    - Add policy for viewing messages in owned conversations

  2. Security
    - Ensures users can only insert messages in conversations they own
    - Maintains existing view permissions for messages in owned conversations
*/

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create insert policy that checks conversation ownership
CREATE POLICY "Users can insert messages in their conversations"
ON messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM conversations
    WHERE conversations.id = conversation_id
    AND conversations.created_by = auth.uid()
  )
  AND
  sender_type IN ('user', 'assistant')
);

-- Create select policy for viewing messages
CREATE POLICY "Users can view messages in their conversations"
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