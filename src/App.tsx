/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/layout/Navbar.tsx';
import { StudentPortal } from './components/student/StudentPortal.tsx';
import { AdminPortal } from './components/admin/AdminPortal.tsx';

function AppContent() {
  const { role, user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('subjects');

  // Sync tab with active role
  useEffect(() => {
    if (role === 'admin') {
      if (!currentTab.startsWith('admin-')) {
        setCurrentTab('admin-queue');
      }
    } else {
      if (currentTab.startsWith('admin-')) {
        setCurrentTab('subjects');
      }
    }
  }, [role]);

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0f17] text-neutral-100 antialiased font-sans">
      {/* Top Bar Navigation */}
      <Navbar currentTab={currentTab} onSelectTab={setCurrentTab} />

      {/* Main Viewport Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {loading ? (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-center space-y-2">
              <div className="w-7 h-7 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-neutral-400">Loading your college portal...</p>
            </div>
          </div>
        ) : role === 'admin' ? (
          <AdminPortal currentTab={currentTab} />
        ) : (
          <StudentPortal currentTab={currentTab} />
        )}
      </main>

      {/* Clean Friendly Footer */}
      <footer className="border-t border-neutral-800/80 bg-[#080a0f] py-6 px-4 sm:px-6 pb-20 md:pb-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-neutral-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-200">College Work Hub</span>
            <span aria-hidden="true">·</span>
            <span>Department of Computer Science & Engineering</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-neutral-400">
            <span>Academic Year 2026-2027</span>
            <span aria-hidden="true">·</span>
            <span>Semester 6</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
