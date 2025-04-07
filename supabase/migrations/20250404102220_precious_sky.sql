/*
  # Fix Messages RLS Policies

  1. Changes
    - Drop existing insert policy
    - Create new insert policy with proper conversation ownership check
    
  2. Security
    - Ensures users can only insert messages into conversations they own
    - Maintains existing select policy
*/

-- Drop the existing insert policy
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Create new insert policy with proper check
CREATE POLICY "Users can insert messages in their conversations"
ON messages
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations
    WHERE conversations.id = conversation_id
    AND conversations.created_by = auth.uid()
  )
);