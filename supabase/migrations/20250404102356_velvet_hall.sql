/*
  # Fix Messages RLS Policies

  1. Changes
    - Drop existing INSERT policy for messages table
    - Create new INSERT policy that properly checks conversation ownership
    - Add additional check for valid sender_type

  2. Security
    - Maintains RLS enabled on messages table
    - Ensures users can only insert messages in their own conversations
    - Validates sender_type is either 'user' or 'assistant'
*/

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;

-- Create new INSERT policy with proper checks
CREATE POLICY "Users can insert messages in their conversations"
ON messages
FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = conversation_id 
    AND c.created_by = auth.uid()
  )
  AND
  sender_type IN ('user', 'assistant')
);