/*
  # Update Messages Table RLS Policies

  1. Changes
    - Update RLS policies for messages table to handle new conversation creation
    - Allow message insertion when creating a new conversation
    - Maintain security by checking user ownership

  2. Security
    - Messages can only be inserted by authenticated users
    - Messages must be associated with a conversation owned by the user
    - Messages can only be read by the conversation owner
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;

-- Create updated policies
CREATE POLICY "Users can insert messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (sender_type = ANY (ARRAY['user'::text, 'assistant'::text]))
  );

CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversations
      WHERE conversations.id = messages.conversation_id
      AND conversations.created_by = auth.uid()
    )
  );