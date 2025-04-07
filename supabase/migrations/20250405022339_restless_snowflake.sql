/*
  # Delete Specific Workflow
  
  1. Changes
    - Executes safe deletion of workflow with ID 6f0e329d-37ab-46b4-8e4d-b5cc490fe385
    - Uses existing delete_workflow_safely function
    - Maintains referential integrity by deleting related data in correct order
    
  2. Security
    - Uses SECURITY DEFINER function
    - Maintains proper deletion order
    - Verifies workflow existence before deletion
*/

-- Execute the function for the specific workflow
SELECT delete_workflow_safely('6f0e329d-37ab-46b4-8e4d-b5cc490fe385');