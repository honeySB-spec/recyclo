'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from './ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './ui/card';
import { UserProfile } from './AuthModal';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

interface AuthScreenProps {
  onAuthenticated: (user: UserProfile) => void;
}

export default function AuthScreen({ onAuthenticated }: AuthScreenProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'generator' | 'collector'>('generator');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role,
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          const newUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: fullName || email.split('@')[0],
            role: role,
            contact_info: email,
            green_points: 0,
          };
          localStorage.setItem('recyclo_user', JSON.stringify(newUser));
          onAuthenticated(newUser);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        if (data.user) {
          const userMeta = data.user.user_metadata || {};
          const loggedUser: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            full_name: userMeta.full_name || email.split('@')[0],
            role: userMeta.role || 'generator',
            contact_info: userMeta.contact_info || email,
            green_points: userMeta.green_points || 0,
          };
          localStorage.setItem('recyclo_user', JSON.stringify(loggedUser));
          onAuthenticated(loggedUser);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      // Helpful fallback message if user doesn't have an account or invalid credentials
      setErrorMsg(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Clean, minimal brand logo */}
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-white font-bold text-xl mb-3 shadow-sm">
          ♻
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Recyclo
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Waste-to-Resource & Circular Marketplace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Card className="border border-slate-200 bg-white shadow-sm p-6 sm:p-8 rounded-2xl">
          <CardHeader className="p-0 pb-6 text-center">
            <CardTitle className="text-lg font-bold text-slate-900">
              {isSignUp ? 'Create your account' : 'Sign in to your account'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 mt-1">
              {isSignUp
                ? 'Enter your details below to get started'
                : 'Enter your email and password to access the platform'}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 space-y-4">
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-slate-700">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 pl-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-xs font-medium text-slate-700">Account Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('generator')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          role === 'generator'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Waste Generator
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('collector')}
                        className={`py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                          role === 'collector'
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Scrap Collector
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 pl-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-xs font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-200 focus:border-slate-900 rounded-lg px-3 py-2 pl-9 pr-9 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs text-left">
                  {errorMsg}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium py-2 rounded-lg transition-colors mt-2"
              >
                {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMsg(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-900 transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
