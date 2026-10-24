'use client';

import React, { useState, useEffect } from 'react';
import Scanner from '@/components/Scanner';
import MarketplaceFeed from '@/components/MarketplaceFeed';
import UserDashboard from '@/components/UserDashboard';
import VoiceAgentModal from '@/components/VoiceAgentModal';
import AuthScreen from '@/components/AuthScreen';
import { UserProfile } from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import {
  Camera,
  ShoppingBag,
  LayoutDashboard,
  Mic,
  LogOut,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'marketplace' | 'dashboard'>('marketplace');
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState<boolean>(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState<boolean>(false);

  // Check saved session from localStorage on initial load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('recyclo_user');
      if (saved) {
        setCurrentUser(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to parse saved user:', e);
    }
  }, []);

  const handleAuthenticated = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('recyclo_user', JSON.stringify(user));
    } catch (e) {}
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setProfileDropdownOpen(false);
    try {
      localStorage.removeItem('recyclo_user');
    } catch (e) {}
  };

  // If not logged in, render clean minimal Auth Screen
  if (!currentUser) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar - Minimal, white with clean border */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Logo Brand */}
          <div
            onClick={() => setActiveTab('marketplace')}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold">
              ♻
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-sm block leading-none">
                Recyclo
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Waste-to-Resource
              </span>
            </div>
          </div>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'scanner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'marketplace'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Marketplace</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </nav>

          {/* Right Profile & Actions */}
          <div className="flex items-center gap-2">
            {/* Inbound Voice Agent Hotline Trigger */}
            <Button
              onClick={() => setIsVoiceModalOpen(true)}
              variant="outline"
              size="sm"
              className="text-xs font-medium gap-1.5 border-slate-200"
            >
              <Mic className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Voice Agent</span>
            </Button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-1.5 p-1 pl-2 pr-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 hover:bg-slate-50 transition-colors"
              >
                <div className="w-5 h-5 rounded-md bg-slate-900 text-white flex items-center justify-center text-[10px] font-bold">
                  {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline truncate max-w-[100px]">{currentUser.full_name}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 p-2 z-50 text-xs">
                  <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                    <p className="font-semibold text-slate-900 truncate">{currentUser.full_name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <span className="inline-block mt-1 text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded capitalize">
                      {currentUser.role}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('dashboard');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Dashboard</span>
                  </button>

                  <div className="pt-1 mt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-2.5 py-1.5 rounded hover:bg-red-50 text-red-600 flex items-center gap-2 font-medium transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden max-w-5xl mx-auto mt-2.5">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'scanner'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('marketplace')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'marketplace'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Market</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {activeTab === 'scanner' && <Scanner />}

        {activeTab === 'marketplace' && (
          <MarketplaceFeed
            currentUser={currentUser}
            onNavigateToDashboard={() => setActiveTab('dashboard')}
            onNavigateToScan={() => setActiveTab('scanner')}
          />
        )}

        {activeTab === 'dashboard' && (
          <UserDashboard
            user={currentUser}
            onNavigateToScan={() => setActiveTab('scanner')}
            onNavigateToMarketplace={() => setActiveTab('marketplace')}
          />
        )}
      </main>

      {/* Voice Agent Modal */}
      <VoiceAgentModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        role={currentUser.role === 'collector' ? 'collector' : 'generator'}
      />
    </div>
  );
}
