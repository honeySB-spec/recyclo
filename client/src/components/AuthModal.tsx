'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface UserProfile {
  id: string;
  email: string;
  role: 'generator' | 'collector' | 'upcycler';
  full_name: string;
  contact_info: string;
  green_points: number;
}

export const DEMO_USERS: Record<string, UserProfile> = {
  generator: {
    id: '00000000-0000-0000-0000-000000000001',
    email: 'sarah.home@example.com',
    role: 'generator',
    full_name: 'Sarah Jenkins (Household)',
    contact_info: '+1 (555) 234-5678',
    green_points: 145,
  },
  collector: {
    id: '00000000-0000-0000-0000-000000000002',
    email: 'dave.scrap@apexmetals.com',
    role: 'collector',
    full_name: 'Dave Miller (Apex Scrap Collector)',
    contact_info: '+1 (555) 382-9011',
    green_points: 410,
  },
  upcycler: {
    id: '00000000-0000-0000-0000-000000000003',
    email: 'elena.artisan@woodcraft.org',
    role: 'upcycler',
    full_name: 'Elena Rostova (Artisan Upcycler)',
    contact_info: '+1 (555) 912-4422',
    green_points: 280,
  },
};

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'generator' | 'collector'>('generator');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDemoSelect = (personaKey: 'generator' | 'collector' | 'upcycler') => {
    onLoginSuccess(DEMO_USERS[personaKey]);
    onClose();
  };

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
            full_name: fullName || 'Eco Citizen',
            role: role,
            contact_info: 'contact@example.com',
            green_points: 50,
          };
          onLoginSuccess(newUser);
          onClose();
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
            full_name: userMeta.full_name || 'Logged User',
            role: userMeta.role || 'generator',
            contact_info: userMeta.contact_info || '',
            green_points: 100,
          };
          onLoginSuccess(loggedUser);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg p-2"
        >
          ✕
        </button>

        {currentUser ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-3xl mx-auto mb-3 font-bold">
              {currentUser.full_name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold text-slate-900">{currentUser.full_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
            <div className="inline-block mt-3 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold border border-emerald-200">
              Role: <span className="capitalize">{currentUser.role}</span> • {currentUser.green_points} Green Points
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex gap-2">
              <button
                type="button"
                onClick={onLogout}
                className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors"
              >
                Sign Out
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="text-center mb-5">
              <span className="text-3xl block mb-1">🌱</span>
              <h3 className="text-xl font-bold text-slate-900">
                {isSignUp ? 'Join the Circular Marketplace' : 'Welcome to Recyclo'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {isSignUp
                  ? 'Start listing waste items or sourcing local scrap'
                  : 'Log in to track your items, earnings, and green points'}
              </p>
            </div>

            {/* Quick Demo Login Personas */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                ⚡ Instant One-Click Demo Personas:
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleDemoSelect('generator')}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">🏠 Sarah (Household)</span>
                    <span className="text-[10px] text-slate-500">Waste Generator with old furniture & appliances</span>
                  </div>
                  <span className="text-xs text-emerald-600 font-bold">Select →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoSelect('collector')}
                  className="w-full text-left px-3 py-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">🚚 Dave (Scrap Collector)</span>
                    <span className="text-[10px] text-slate-500">Sources metals, cardboard & e-waste for cash</span>
                  </div>
                  <span className="text-xs text-blue-600 font-bold">Select →</span>
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-2 text-[10px] uppercase font-bold text-slate-400">
                Or Supabase Email Login
              </span>
            </div>

            {/* Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-3">
              {isSignUp && (
                <>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Your Primary Role
                    </label>
                    <select
                      value={role}
                      onChange={(e: any) => setRole(e.target.value)}
                      className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="generator">Household Waste Generator</option>
                      <option value="collector">Scrap Collector / Buyer</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              {errorMsg && (
                <div className="p-2 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-50 mt-2"
              >
                {loading ? 'Processing...' : isSignUp ? 'Create Free Account' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-slate-500 hover:text-emerald-600"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
