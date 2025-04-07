/*
  # Add document support
  
  1. Changes
    - Add document_url column to messages table
    - Enable storage for documents
    
  2. Security
    - Create storage bucket with RLS enabled
    - Add storage policies for authenticated users
*/

-- Create documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on the bucket
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to upload files
CREATE POLICY "Users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create policy to allow users to read their own files
CREATE POLICY "Users can read own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Add document_url column to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS document_url text;