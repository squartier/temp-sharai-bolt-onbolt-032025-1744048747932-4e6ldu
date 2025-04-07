/*
  # Check and create conversation policies

  1. Security Changes
    - Check for existing policies before creating new ones
    - Add RLS policies for conversations table if they don't exist
    - Policies cover:
      - Insert (users can create their own conversations)
      - Select (users can view their own conversations)
      - Update (users can update their own conversations)
      - Delete (users can delete their own conversations)

  Note: This migration safely adds policies only if they don't already exist
*/

DO $$ 
BEGIN
  -- Check and create insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can create their own conversations'
  ) THEN
    CREATE POLICY "Users can create their own conversations"
    ON conversations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);
  END IF;

  -- Check and create select policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can view their own conversations'
  ) THEN
    CREATE POLICY "Users can view their own conversations"
    ON conversations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = created_by);
  END IF;

  -- Check and create update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can update their own conversations'
  ) THEN
    CREATE POLICY "Users can update their own conversations"
    ON conversations
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);
  END IF;

  -- Check and create delete policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'conversations' 
    AND policyname = 'Users can delete their own conversations'
  ) THEN
    CREATE POLICY "Users can delete their own conversations"
    ON conversations
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);
  END IF;
END $$;