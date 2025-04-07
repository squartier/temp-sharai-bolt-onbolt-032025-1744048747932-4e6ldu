/*
  # Update messages table RLS policies

  1. Changes
    - Update RLS policies for messages table to allow proper message insertion
    - Add policy for authenticated users to insert messages in their conversations
    - Ensure users can only insert messages with valid sender_type values
    - Maintain existing policies for message selection

  2. Security
    - Maintain RLS enabled on messages table
    - Update insert policy to properly check conversation ownership
    - Keep existing select policy unchanged
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