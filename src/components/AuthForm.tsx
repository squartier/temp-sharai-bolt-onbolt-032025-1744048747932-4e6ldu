import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Mail, Lock, Loader2, Building } from 'lucide-react';
import { SignUpInput, SignInInput, signUpSchema, signInSchema } from '../lib/types';
import { supabase } from '../lib/supabase';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [bgLoaded, setBgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = 'https://n-remote.com/sdc/public/sharon/cmodern_office_invironment_in_the_background-2.png';
    img.onload = () => setBgLoaded(true);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<SignUpInput | SignInInput>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: SignUpInput | SignInInput) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
      
      if (error) throw error;
      toast.success('Successfully signed in');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  return (
    <div 
      className={`min-h-screen w-full flex items-center justify-center bg-cover bg-center transition-opacity duration-1000 ${bgLoaded ? 'opacity-100' : 'opacity-0'}`}
      style={{ 
        backgroundImage: 'url(https://n-remote.com/sdc/public/sharon/cmodern_office_invironment_in_the_background-2.png)',
        backgroundColor: '#121212'
      }}
    >
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl">
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://n-remote.com/sdc/public/logos/N-Remote295x95.png" 
            alt="N-Remote Logo" 
            className="h-12 mb-6"
          />
          <h2 className="text-2xl font-bold text-center">
            Welcome to Sharon AI
          </h2>
        </div>
      
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              {...register('email')}
              type="email"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              {...register('password')}
              type="password"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            'Sign In'
          )}
        </button>
      </form>
      </div>
    </div>
  );
}