/*
  # Safe Workflow Deletion Migration

  1. Changes
    - Creates a function to safely delete a workflow and all related data
    - Handles deletion in the correct order:
      1. Messages linked to conversations of the workflow
      2. Conversations linked to the workflow
      3. The workflow itself
    
  2. Security
    - Maintains referential integrity
    - Uses transaction to ensure atomic operation
    - Verifies workflow existence before deletion
*/

-- Create a function to safely delete a workflow and all related data
CREATE OR REPLACE FUNCTION delete_workflow_safely(p_workflow_id uuid)
RETURNS void AS $$
BEGIN
  -- Check if workflow exists
  IF NOT EXISTS (SELECT 1 FROM workflows WHERE id = p_workflow_id) THEN
    RAISE EXCEPTION 'Workflow with ID % does not exist', p_workflow_id;
  END IF;

  -- Delete messages from conversations linked to this workflow
  DELETE FROM messages
  WHERE conversation_id IN (
    SELECT id FROM conversations
    WHERE workflow_id = p_workflow_id
  );

  -- Delete conversations linked to this workflow
  DELETE FROM conversations
  WHERE workflow_id = p_workflow_id;

  -- Delete the workflow itself
  DELETE FROM workflows
  WHERE id = p_workflow_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the function for the specific workflow
SELECT delete_workflow_safely('0006dd3f-ae4a-40ea-9287-c00d44e79d6b');