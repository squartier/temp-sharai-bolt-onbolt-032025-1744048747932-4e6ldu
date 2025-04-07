import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Profile } from '../lib/types';
import { Loader2 } from 'lucide-react';

const profileSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  email: z.string().email('Invalid email format').min(1, 'Email is required'),
  current_password: z.string().optional(),
  new_password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least 1 number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least 1 special character')
    .optional(),
  confirm_password: z.string().optional(),
}).refine((data) => {
  if (data.new_password && !data.current_password) {
    return false;
  }
  return true;
}, {
  message: "Current password is required when setting a new password",
  path: ["current_password"],
}).refine((data) => {
  if (data.new_password !== data.confirm_password) {
    return false;
  }
  return true;
}, {
  message: "Passwords don't match",
  path: ["confirm_password"],
});

type ProfileFormData = z.infer<typeof profileSchema>;

export function ProfileSettings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      reset({
        email: data.email,
        company_name: data.company_name || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profile data
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          company_name: data.company_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update password if provided
      if (data.new_password && data.current_password) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: data.new_password,
        });

        if (passwordError) throw passwordError;
      }

      toast.success('Profile updated successfully');
      await fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#BB86FC]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[#E0E0E0] mb-8">Profile Settings</h1>

        <div className="bg-[#1F1F1F] rounded-lg p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                readOnly
                className="w-full px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC] opacity-50 cursor-not-allowed"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                Company Name
              </label>
              <input
                {...register('company_name')}
                type="text"
                className="w-full px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
              />
              {errors.company_name && (
                <p className="mt-1 text-sm text-red-500">{errors.company_name.message}</p>
              )}
            </div>

            <div className="pt-4 border-t border-[#3D3D3D]">
              <h3 className="text-lg font-medium text-[#E0E0E0] mb-4">Change Password</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                    Current Password
                  </label>
                  <input
                    {...register('current_password')}
                    type="password"
                    className="w-full px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
                  />
                  {errors.current_password && (
                    <p className="mt-1 text-sm text-red-500">{errors.current_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                    New Password
                  </label>
                  <input
                    {...register('new_password')}
                    type="password"
                    className="w-full px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
                  />
                  {errors.new_password && (
                    <p className="mt-1 text-sm text-red-500">{errors.new_password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#E0E0E0] mb-2">
                    Confirm New Password
                  </label>
                  <input
                    {...register('confirm_password')}
                    type="password"
                    className="w-full px-4 py-2 bg-[#2C2C2C] text-[#E0E0E0] rounded-lg border border-[#3D3D3D] focus:outline-none focus:ring-2 focus:ring-[#BB86FC]"
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-500">{errors.confirm_password.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-[#BB86FC] text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}