import { PropsWithChildren, useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Menu, MessageSquare, Workflow, Users, FileText, Shield, ChevronDown, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Profile } from '../lib/types';
import toast from 'react-hot-toast';

interface LayoutProps extends PropsWithChildren {
  onSignOut?: () => void;
  user?: boolean;
}

export function Layout({ children, onSignOut, user }: LayoutProps) { 
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast.error('Failed to load profile');
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <>
      {user && <nav className="bg-[#0A0A0A] border-b border-[#1F1F1F]">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center space-x-4">
              <h1 className="text-[#E0E0E0] text-xl font-semibold">Sharon AI</h1>
              <p className="text-[#757575] text-sm hidden md:block">Making Your Teams more Productive</p>
            </div>
            
            {/* Desktop menu */}
            <div className="hidden md:flex items-center space-x-1">
              <button 
                onClick={() => navigate('/')} 
                className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#E0E0E0] hover:bg-[#1F1F1F]"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Chat</span>
              </button>
              {profile?.role === 'admin' ? (
                <>
                  <button 
                    onClick={() => navigate('/workflows')} 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] transition-colors"
                  >
                    <Workflow className="w-5 h-5" />
                    <span>Workflows</span>
                  </button>
                  <button 
                    onClick={() => navigate('/users')} 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] transition-colors"
                  >
                    <Users className="w-5 h-5" />
                    <span>Users</span>
                  </button>
                  <button 
                    onClick={() => navigate('/permissions')} 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] transition-colors"
                  >
                    <Shield className="w-5 h-5" />
                    <span>Permissions</span>
                  </button>
                </>
              ) : null}
              
              <div className="relative ml-4">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 px-2 py-1.5 rounded-md hover:bg-[#1F1F1F] transition-colors group"
                >
                  <span className="text-[#E0E0E0]">{profile?.email || 'Loading...'}</span>
                  <span className={`px-2 py-0.5 text-white text-sm rounded ${
                    profile?.role === 'admin' ? 'bg-purple-600' :
                    profile?.role === 'manager' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }`}>
                    {profile?.role || 'Loading...'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-[#757575] group-hover:text-[#E0E0E0]" />
                </button>
                
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[#1F1F1F] rounded-md shadow-lg py-1 border border-[#2D2D2D] z-50">
                    <div className="px-4 py-2 border-b border-[#2D2D2D]">
                      <p className="text-sm font-medium text-[#E0E0E0]">My Account</p>
                    </div>
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center space-x-2 px-4 py-2 text-[#757575] hover:text-[#E0E0E0] hover:bg-[#2D2D2D]">
                      <Settings className="w-4 h-4" />
                      <span>Profile Settings</span>
                    </button>
                    <button
                      onClick={onSignOut}
                      className="w-full flex items-center space-x-2 px-4 py-2 text-[#757575] hover:text-[#E0E0E0] hover:bg-[#2D2D2D]"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-[#757575] hover:text-[#E0E0E0]"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile menu */}
          <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} py-2 space-y-2`}>
            <button onClick={() => navigate('/')} className="w-full flex items-center space-x-2 px-3 py-2 text-[#E0E0E0] bg-[#1F1F1F] rounded-md">
              <MessageSquare className="w-5 h-5" />
              <span>Chat</span>
            </button>
            {profile?.role === 'admin' && (
              <>
                <button 
                  onClick={() => navigate('/workflows')} 
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] transition-colors"
                >
                  <Workflow className="w-5 h-5" />
                  <span>Workflows</span>
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  className="flex items-center space-x-2 px-3 py-2 rounded-md text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] transition-colors"
                >
                  <Users className="w-5 h-5" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => navigate('/permissions')}
                  className="flex items-center space-x-2 px-3 py-2 text-[#757575] hover:text-[#E0E0E0] hover:bg-[#1F1F1F] rounded-md"
                >
                  <Shield className="w-5 h-5" />
                  <span>Permissions</span>
                </button>
              </>
            )}
            <div className="border-t border-[#1F1F1F] pt-2">
              <div className="px-3 py-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[#E0E0E0] text-sm">{profile?.email || 'Loading...'}</span>
                  <span className={`px-2 py-0.5 text-white text-sm rounded ${
                    profile?.role === 'admin' ? 'bg-purple-600' :
                    profile?.role === 'manager' ? 'bg-blue-600' :
                    'bg-gray-600'
                  }`}>
                    {profile?.role || 'Loading...'}
                  </span>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center space-x-2 text-[#757575] hover:text-[#E0E0E0]"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={onSignOut}
                    className="flex items-center space-x-2 text-[#757575] hover:text-[#E0E0E0]"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>}
      {children}
      <Toaster />
    </>
  );
}