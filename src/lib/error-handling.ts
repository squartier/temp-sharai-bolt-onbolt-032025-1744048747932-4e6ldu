import { SupabaseClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

interface ErrorDetails {
  context?: Record<string, unknown>;
  error: unknown;
}

export function logError({ context, error }: ErrorDetails) {
  const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
  const errorStack = error instanceof Error ? error.stack : undefined;
  
  console.error('Error occurred:', {
    message: errorMessage,
    stack: errorStack,
    context
  });
}

export async function logWorkflowError(
  supabase: SupabaseClient,
  workflowId: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  try {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    
    await supabase
      .from('workflow_logs')
      .insert({
        workflow_id: workflowId,
        level: 'error',
        message: errorMessage,
        details: {
          error: errorMessage,
          stack: error instanceof Error ? error.stack : undefined,
          context
        }
      });
  } catch (err) {
    console.error('Failed to log workflow error:', err);
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    if (error.message.includes('401')) {
      toast.error('Authentication failed. Please check your API credentials.');
      throw new Error('Authentication failed');
    }
    
    if (error.message.includes('403')) {
      toast.error('You do not have permission to perform this action.');
      throw new Error('Permission denied');
    }
    
    if (error.message.includes('404')) {
      toast.error('The requested resource was not found.');
      throw new Error('Resource not found');
    }
    
    if (error.message.includes('429')) {
      toast.error('Too many requests. Please try again later.');
      throw new Error('Rate limit exceeded');
    }
    
    if (error.message.includes('500')) {
      toast.error('Server error. Please try again later.');
      throw new Error('Server error');
    }
  }
  
  toast.error('An unexpected error occurred');
  throw new Error('Unknown error occurred');
}