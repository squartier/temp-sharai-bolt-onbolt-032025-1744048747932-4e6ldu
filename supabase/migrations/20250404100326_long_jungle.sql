/*
  # Add conversations and messages tables

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key): Unique identifier for the conversation
      - `created_at` (timestamptz): When the conversation was created
      - `created_by` (uuid): User who created the conversation
      - `workflow_id` (uuid): Associated workflow
      - `title` (text): Title of the conversation (first question asked)
      - `updated_at` (timestamptz): Last update timestamp
      
    - `messages`
      - `id` (uuid, primary key): Unique identifier for the message
      - `conversation_id` (uuid): Conversation this message belongs to
      - `created_at` (timestamptz): When the message was sent
      - `sender_type` (text): Either 'user' or 'assistant'
      - `text` (text): Message content
      - `details` (jsonb): Additional message details (API response, error details, etc.)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to:
      - Create conversations and messages
      - Read their own conversations and associated messages
      - Update their own conversations
      - Delete their own conversations (which cascades to messages)

  3. Relationships
    - Messages are deleted when their conversation is deleted (ON DELETE CASCADE)
    - Conversations are linked to workflows and users
*/

-- Create the updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    workflow_id UUID REFERENCES public.workflows(id) NOT NULL,
    title TEXT NOT NULL
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    sender_type TEXT CHECK (sender_type IN ('user', 'assistant')) NOT NULL,
    text TEXT NOT NULL,
    details JSONB
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies for conversations
CREATE POLICY "Users can create their own conversations"
    ON public.conversations
    FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view their own conversations"
    ON public.conversations
    FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Users can update their own conversations"
    ON public.conversations
    FOR UPDATE
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own conversations"
    ON public.conversations
    FOR DELETE
    USING (auth.uid() = created_by);

-- Policies for messages
CREATE POLICY "Users can insert messages in their conversations"
    ON public.messages
    FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE conversations.id = conversation_id
        AND conversations.created_by = auth.uid()
    ));

CREATE POLICY "Users can view messages in their conversations"
    ON public.messages
    FOR SELECT
    USING (EXISTS (
        SELECT 1
        FROM public.conversations
        WHERE conversations.id = conversation_id
        AND conversations.created_by = auth.uid()
    ));

-- Add updated_at trigger to conversations
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON public.conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX idx_conversations_created_by ON public.conversations(created_by);
CREATE INDEX idx_conversations_workflow_id ON public.conversations(workflow_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);