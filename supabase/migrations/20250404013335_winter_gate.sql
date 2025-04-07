/*
  # Add workflow ordering support
  
  1. Changes
    - Add order column to workflows table
    - Create trigger to automatically set order for new workflows
    - Update existing workflows with order values
    
  2. Security
    - Maintain existing RLS policies
*/

-- Add order column
ALTER TABLE workflows 
ADD COLUMN IF NOT EXISTS "order" integer;

-- Create function to get next order number
CREATE OR REPLACE FUNCTION get_next_workflow_order()
RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN COALESCE((SELECT MAX("order") + 1 FROM workflows), 0);
END;
$$;

-- Create trigger to set order on new workflows
CREATE OR REPLACE FUNCTION set_workflow_order()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.order IS NULL THEN
    NEW.order := get_next_workflow_order();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_workflow_order_trigger
  BEFORE INSERT ON workflows
  FOR EACH ROW
  EXECUTE FUNCTION set_workflow_order();

-- Update existing rows with order based on created_at
WITH ordered_workflows AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
  FROM workflows
)
UPDATE workflows w
SET "order" = ow.new_order
FROM ordered_workflows ow
WHERE w.id = ow.id;

-- Make order column not null
ALTER TABLE workflows 
ALTER COLUMN "order" SET NOT NULL;