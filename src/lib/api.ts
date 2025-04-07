import { supabase } from './supabase';
import toast from 'react-hot-toast';
import { handleApiError, logError } from './error-handling';

interface ApiConfig {
  method: string;
  url: string;
  content_type: string;
}

interface ApiResponse {
  success: boolean;
  data: any;
}

interface TestApiParams {
  workerId: string;
  apiAuthToken: string;
  apiConfig: ApiConfig;
  variables: Record<string, string>;
  workflowId?: string;
}

interface ApiError {
  message: string;
  status?: number;
  details?: unknown;
}

export async function testApi({ workerId, apiAuthToken, apiConfig, variables, workflowId }: TestApiParams) {
  if (!workerId || workerId === 'your-worker-id') {
    throw new ApiError('Worker ID is not configured');
  }

  if (!apiAuthToken || apiAuthToken === 'your-auth-token') {
    throw new ApiError('API authentication token is not configured');
  }

  try {
    // If this is an API test, clear previous test logs
    if (workflowId) {
      await supabase
        .from('workflow_logs')
        .delete()
        .eq('workflow_id', workflowId)
        .eq('message', 'API request successful');
    }

    const response = await fetch(apiConfig.url, {
      method: apiConfig.method,
      headers: {
        'Content-Type': apiConfig.content_type,
        'Authorization': apiAuthToken.startsWith('Bearer ') ? apiAuthToken : `Bearer ${apiAuthToken}`,
      },
      body: JSON.stringify({
        workerId,
        variables
      }),
    });

    const data = await response.json();

    const responseText = data.result || data.responseText || data.response || data.message;

    // Only log if it's an API test or if there's an error
    if (workflowId && (!response.ok || variables.workflow === undefined)) {
      await supabase.from('workflow_logs').insert({
        workflow_id: workflowId,
        level: response.ok ? 'info' : 'error',
        message: response.ok ? 'API request successful' : `API request failed: ${response.statusText}`,
        details: {
          status: response.status,
          response: data,
        }
      });
    }

    if (!response.ok) {
      throw new ApiError(
        data.message || `API request failed: ${response.statusText}`
      );
    }

    return {
      success: true,
      data: {
        response: responseText || data.result || 'No response received'
      }
    };
  } catch (error) {
    logError({ 
      context: { 
        workerId, 
        url: apiConfig.url,
        method: apiConfig.method 
      }, 
      error 
    });
    
    // Only log errors from workflow execution, not API tests
    if (workflowId && variables.workflow !== undefined) {
      await supabase.from('workflow_logs').insert({
        workflow_id: workflowId,
        level: 'error',
        message: error instanceof Error 
          ? error.message 
          : 'Failed to connect to MindStudio API',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
    
    throw error;
  }
}