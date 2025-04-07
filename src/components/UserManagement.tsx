import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '../lib/supabase';
import { userSchema, type UserFormData, type Profile } from '../lib/types';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<keyof Profile>('email');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<Profile | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      company_name: '',
      role: 'user'
    }
  });

  useEffect(() => {
    if (editingUser) {
      setValue('email', editingUser.email);
      setValue('company_name', editingUser.company_name);
      setValue('role', editingUser.role);
    }
  }, [editingUser, setValue]);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, sortField, sortDirection, searchQuery]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*')
        .order(sortField, { ascending: sortDirection === 'asc' })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (searchQuery) {
        query = query.or(`email.ilike.%${searchQuery}%,company_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: keyof Profile) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUsers(checked ? users.map(user => user.id) : []);
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    setSelectedUsers(prev =>
      checked ? [...prev, userId] : prev.filter(id => id !== userId)
    );
  };

  const handleBulkAction = async (action: 'delete' | 'activate' | 'deactivate') => {
    if (!selectedUsers.length) return;

    try {
      switch (action) {
        case 'delete':
          if (!confirm('Are you sure you want to delete the selected users?')) return;
          await supabase.from('profiles').delete().in('id', selectedUsers);
          break;
        case 'activate':
        case 'deactivate':
          await supabase
            .from('profiles')
            .update({ status: action === 'activate' })
            .in('id', selectedUsers);
          break;
      }
      
      toast.success(`Successfully ${action}d selected users`);
      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      toast.error(`Failed to ${action} users`);
      console.error('Error:', error);
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            company_name: data.company_name,
            role: data.role,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id);

        if (updateError) throw updateError;
        toast.success('User updated successfully');
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password!
        });

        if (signUpError) throw signUpError;
        toast.success('User created successfully');
      }

      await fetchUsers();
      setShowUserModal(false);
      reset();
    } catch (error) {
      toast.error(error.message || 'Failed to save user');
      console.error('Error:', error);
    }
  };

  return (
    <div className="p-6 bg-[#121212] min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <button
            onClick={() => {
              setEditingUser(null);
              setShowUserModal(true);
            }}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New User
          </button>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1F1F1F] text-white rounded-lg border border-[#2D2D2D] focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('activate')}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition-colors"
              >
                Activate
              </button>
              <button
                onClick={() => handleBulkAction('deactivate')}
                className="px-3 py-1.5 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Deactivate
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto rounded-lg border border-[#2D2D2D]">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#1F1F1F]">
                <th className="p-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === users.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                {['email', 'company_name', 'role', 'last_login', 'status'].map((field) => (
                  <th
                    key={field}
                    onClick={() => handleSort(field as keyof Profile)}
                    className="p-4 text-left text-gray-400 font-medium cursor-pointer"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{field.replace('_', ' ').toUpperCase()}</span>
                      {sortField === field && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                ))}
                <th className="p-4 text-left text-gray-400 font-medium">ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-[#2D2D2D] hover:bg-[#1A1A1A]">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        className="rounded border-gray-400 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="p-4 text-white">{user.email}</td>
                    <td className="p-4 text-white">{user.company_name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-sm ${
                        user.role === 'admin' ? 'bg-purple-600' :
                        user.role === 'manager' ? 'bg-blue-600' :
                        'bg-gray-600'
                      } text-white`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(user.last_login).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <button
                        onClick={async () => {
                          try {
                            await supabase
                              .from('profiles')
                              .update({ status: !user.status })
                              .eq('id', user.id);
                            await fetchUsers();
                          } catch (error) {
                            toast.error('Failed to update user status');
                          }
                        }}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          user.status ? 'bg-emerald-600' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.status ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setShowUserModal(true);
                          }}
                          className="p-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to delete this user?')) {
                              try {
                                await supabase
                                  .from('profiles')
                                  .delete()
                                  .eq('id', user.id);
                                await fetchUsers();
                                toast.success('User deleted successfully');
                              } catch (error) {
                                toast.error('Failed to delete user');
                              }
                            }
                          }}
                          className="p-1 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center">
          <div className="text-gray-400">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, users.length)} of {users.length} users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-[#1F1F1F] text-white rounded disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-white">Page {currentPage}</span>
            <button
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={users.length < itemsPerPage}
              className="px-3 py-1 bg-[#1F1F1F] text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-[#1F1F1F] rounded-lg w-full max-w-md">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white">
                    {editingUser ? 'Edit User' : 'Add New User'}
                  </h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Email Address
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      disabled={!!editingUser}
                      className="w-full px-4 py-2 bg-[#2D2D2D] text-white rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                      placeholder="Enter email address"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                    )}
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">
                        Password
                      </label>
                      <input
                        {...register('password')}
                        type="password"
                        className="w-full px-4 py-2 bg-[#2D2D2D] text-white rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Enter password"
                      />
                      {errors.password && (
                        <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Company Name
                    </label>
                    <input
                      {...register('company_name')}
                      type="text"
                      className="w-full px-4 py-2 bg-[#2D2D2D] text-white rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Enter company name"
                    />
                    {errors.company_name && (
                      <p className="mt-1 text-sm text-red-400">{errors.company_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">
                      Role
                    </label>
                    <select
                      {...register('role')}
                      className="w-full px-4 py-2 bg-[#2D2D2D] text-white rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="user">User</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowUserModal(false)}
                      className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          Saving...
                        </>
                      ) : (
                        'Save User'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}