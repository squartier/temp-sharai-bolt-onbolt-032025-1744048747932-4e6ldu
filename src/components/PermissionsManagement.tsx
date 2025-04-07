import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Save, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Profile, Workflow } from '../lib/types';

interface UserWorkflowPermission {
  userId: string;
  workflowId: string;
}

export function PermissionsManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<UserWorkflowPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('PermissionsManagement: Starting to fetch data...');

      const { data: { user } } = await supabase.auth.getUser();
      console.log('PermissionsManagement: Current user:', user);

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('email');

      console.log('PermissionsManagement: Fetched users:', users);
      if (usersError) throw usersError;

      // Fetch workflows
      const { data: workflows, error: workflowsError } = await supabase
        .from('workflows')
        .select('*')
        .eq('status', 'active')
        .order('name');

      console.log('PermissionsManagement: Fetched workflows:', workflows);
      console.log('PermissionsManagement: Workflows query error:', workflowsError);
      if (workflowsError) throw workflowsError;

      setUsers(users || []);
      setWorkflows(workflows || []);
    } catch (error) {
      console.error('PermissionsManagement: Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPermissions = async (userId: string) => {
    try {
      // Fetch existing permissions
      const { data: permissions, error } = await supabase
        .from('user_workflows')
        .select('workflow_id')
        .eq('user_id', userId);

      if (error) throw error;

      setPermissions(
        permissions.map(p => ({
          userId,
          workflowId: p.workflow_id
        }))
      );
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast.error('Failed to load user permissions');
    }
  };

  const handleUserSelect = async (userId: string) => {
    setSelectedUser(userId);
    await fetchUserPermissions(userId);
  };

  const toggleWorkflowAccess = (workflowId: string) => {
    if (!selectedUser) return;

    setPermissions(prev => {
      const exists = prev.some(p => 
        p.userId === selectedUser && p.workflowId === workflowId
      );

      if (exists) {
        return prev.filter(p => 
          !(p.userId === selectedUser && p.workflowId === workflowId)
        );
      } else {
        return [...prev, { userId: selectedUser, workflowId }];
      }
    });
  };

  const handleSave = async () => {
    if (!selectedUser) return;

    try {
      setSaving(true);

      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_workflows')
        .delete()
        .eq('user_id', selectedUser);

      if (deleteError) throw deleteError;

      // Insert new permissions
      if (permissions.length > 0) {
        const { error: insertError } = await supabase
          .from('user_workflows')
          .insert(
            permissions.map(p => ({
              user_id: p.userId,
              workflow_id: p.workflowId
            }))
          );

        if (insertError) throw insertError;
      }

      toast.success('Permissions saved successfully');
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <RefreshCw className="w-6 h-6 animate-spin text-[#BB86FC]" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#121212] min-h-screen">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#E0E0E0]">Workflow Permissions</h1>
          <button
            onClick={fetchData}
            className="text-[#BB86FC] hover:text-[#E0E0E0] transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-[#1F1F1F] rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-[#E0E0E0]">Manage User Permissions</h2>
          <p className="text-[#757575]">Control which workflows each user can access</p>

          {/* User Selection */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-[#E0E0E0]">
              Select User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#757575] w-5 h-5" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
              />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {users
                .filter(user => 
                  user.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(user => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      selectedUser === user.id
                        ? 'bg-[#BB86FC] text-white'
                        : 'text-[#E0E0E0] hover:bg-[#2C2C2C]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{user.email}</span>
                      <span className={`text-sm px-2 py-0.5 rounded ${
                        user.role === 'admin'
                          ? 'bg-purple-600'
                          : user.role === 'manager'
                          ? 'bg-blue-600'
                          : 'bg-gray-600'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>

          {/* Workflow Permissions */}
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-[#E0E0E0]">
                  Workflow Access
                </h3>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center px-4 py-2 bg-[#BB86FC] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Permissions
                    </>
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {workflows.length === 0 ? (
                  <div className="text-center py-4 text-[#757575]">
                    No workflows available
                  </div>
                ) : (
                  workflows.map(workflow => (
                    <div
                      key={workflow.id}
                      className="flex items-center justify-between p-4 bg-[#2C2C2C] rounded-lg"
                    >
                      <div>
                        <h4 className="text-[#E0E0E0] font-medium">
                          {workflow.name}
                        </h4>
                        {workflow.description && (
                          <p className="text-sm text-[#757575]">
                            {workflow.description}
                          </p>
                        )}
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={permissions.some(p => 
                            p.userId === selectedUser && 
                            p.workflowId === workflow.id
                          )}
                          onChange={() => toggleWorkflowAccess(workflow.id)}
                        />
                        <div className="w-11 h-6 bg-[#3D3D3D] peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#BB86FC] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#BB86FC]"></div>
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}