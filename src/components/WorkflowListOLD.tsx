import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Search, Settings2, Trash2, RefreshCw, Info, AlertCircle, GripVertical } from 'lucide-react';
import { workflowSchema } from '../lib/types';
import toast from 'react-hot-toast';
import { WorkflowForm } from './WorkflowForm';
import { WorkflowLogs } from './WorkflowLogs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  order: number;
  supports_documents: boolean;
  worker_id: string;
  api_auth_token: string;
  variables: any[];
}

export function WorkflowList() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showWorkflowForm, setShowWorkflowForm] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [showLogs, setShowLogs] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Initial load
  useEffect(() => {
    const initializeData = async () => {
      await checkConnection();
    };
    initializeData();
  }, []);

  // Handle search and pagination
  useEffect(() => {
    if (connectionStatus === 'connected') {
      fetchWorkflows();
    }
  }, [currentPage, searchQuery]);

  async function checkConnection() {
    try {
      setConnectionStatus('checking');
      setConnectionError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw new Error(`Authentication error: ${authError.message}`);
      if (!user) throw new Error('No authenticated user found');

      const { error: pingError } = await supabase
        .from('workflows')
        .select('id')
        .limit(1);
      
      if (pingError) throw new Error(`Database ping failed: ${pingError.message}`);

      setConnectionStatus('connected');
      fetchWorkflows();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to connect to database';
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
      setConnectionError(message);
      toast.error(message);
    }
  }

  async function fetchWorkflows() {
    try {
      setLoading(true);
      setConnectionError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { data, error } = await supabase
        .from('workflows')
        .select('id, name, description, status, created_at, updated_at, order, supports_documents, worker_id, api_auth_token, variables')
        .eq('created_by', user.id)
        .order('order', { ascending: true })
        .ilike('name', `%${searchQuery}%`);
      
      if (error) { 
        console.error('Supabase query error:', error);
        throw new Error('Failed to fetch workflows');
      }

      setWorkflows(data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch workflows';
      setConnectionError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500';
      case 'inactive':
        return 'bg-yellow-500';
      case 'archived':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(workflows);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order of items
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setWorkflows(updatedItems);

    // Update the order in the database
    try {
      const { error } = await supabase
        .from('workflows')
        .upsert(
          updatedItems.map(({ id, order }) => ({
            id,
            order,
          }))
        );

      if (error) throw error;
    } catch (error) {
      toast.error('Failed to update workflow order');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6 bg-[#121212] min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-[#E0E0E0]">Workflows</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className={`inline-flex h-3 w-3 rounded-full ${
                connectionStatus === 'connected' ? 'bg-emerald-500' :
                connectionStatus === 'checking' ? 'bg-yellow-500 animate-pulse' :
                'bg-red-500'
              }`} />
              <span className="text-sm text-[#757575]">
                {connectionStatus === 'connected' ? 'Connected' :
                 connectionStatus === 'checking' ? 'Checking connection...' :
                 'Connection error'}
              </span>
              {connectionStatus === 'error' && (
                <button
                  onClick={checkConnection}
                  className="ml-2 text-[#BB86FC] hover:text-[#E0E0E0] transition-colors"
                  title="Retry connection"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
            onClick={() => setShowWorkflowForm(true)}
            className="flex items-center px-4 py-2 bg-[#BB86FC] text-white rounded-lg hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Workflow
          </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1F1F1F] text-[#E0E0E0] rounded-lg border border-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
            />
          </div>
        </div>

        {/* Workflows Table */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="workflows">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-4"
              >
                {loading ? (
                  <div className="bg-[#1F1F1F] p-8 rounded-lg flex justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-[#E0E0E0]" />
                  </div>
                ) : connectionError ? (
                  <div className="bg-[#1F1F1F] p-8 rounded-lg flex items-center justify-center space-x-3 text-red-500">
                    <AlertCircle className="w-6 h-6" />
                    <span>{connectionError}</span>
                  </div>
                ) : workflows.length === 0 ? (
                  <div className="bg-[#1F1F1F] p-8 rounded-lg text-center text-[#757575]">
                    No workflows found
                  </div>
                ) : (
                  workflows.map((workflow, index) => (
                    <Draggable
                      key={workflow.id}
                      draggableId={workflow.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="bg-[#1F1F1F] rounded-lg border border-[#2D2D2D] p-4 hover:border-[#BB86FC] transition-colors"
                          data-workflow-id={workflow.id}
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-3">
                                <GripVertical className="w-5 h-5 text-[#757575] cursor-move" />
                                <h3 className="text-[#E0E0E0] font-medium">{workflow.name}</h3>
                              </div>
                              {workflow.description && (
                                <p className="text-[#757575] text-sm">{workflow.description}</p>
                              )}
                              <div className="flex items-center space-x-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(workflow.status)} text-white`}>
                                  {workflow.status}
                                </span>
                                <span className="text-[#757575] text-sm">
                                  Created: {new Date(workflow.created_at).toLocaleDateString()}
                                </span>
                                <span className="text-[#757575] text-sm">
                                  Updated: {new Date(workflow.updated_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedWorkflow(workflow);
                                  setShowWorkflowForm(true);
                                }}
                                className="text-[#BB86FC] hover:text-[#E0E0E0] transition-colors"
                              >
                                <Settings2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setShowLogs(showLogs === workflow.id ? null : workflow.id)}
                                className={`text-[#BB86FC] hover:text-[#E0E0E0] transition-colors ${
                                  showLogs === workflow.id ? 'text-[#E0E0E0]' : ''
                                }`}
                              >
                                <Info className="w-5 h-5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm('Are you sure you want to delete this workflow?')) {
                                    const { error } = await supabase
                                      .from('workflows')
                                      .delete()
                                      .eq('id', workflow.id);
                                    
                                    if (error) {
                                      toast.error('Failed to delete workflow');
                                    } else {
                                      toast.success('Workflow deleted');
                                      fetchWorkflows();
                                    }
                                  }
                                }}
                                className="text-red-500 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                          {showLogs === workflow.id && (
                            <div className="mt-4 border-t border-[#2D2D2D] pt-4">
                              <WorkflowLogs workflowId={workflow.id} />
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {/* Pagination */}
        <div className="mt-4 flex justify-between items-center text-[#757575]">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(p => p + 1)}
            disabled={workflows.length < itemsPerPage}
            className="px-4 py-2 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
      {showWorkflowForm && (
        <WorkflowForm
          workflow={selectedWorkflow}
          onClose={() => setShowWorkflowForm(false)}
          onSave={() => {
            setShowWorkflowForm(false);
            setSelectedWorkflow(null);
            fetchWorkflows();
          }}
        />
      )}
    </div>
  );
}