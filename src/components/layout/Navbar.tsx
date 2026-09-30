import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Shield,
  GraduationCap,
  BookOpen,
  FlaskConical,
  FileText,
  Bookmark,
  Inbox,
  FolderKanban,
  Upload,
  MessageSquare,
  Settings,
  LogOut,
  UserCheck
} from 'lucide-react';
import { AdminLoginModal } from '../admin/AdminLoginModal.tsx';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, role, switchRole, logout, loading } = useAuth();
  const [adminModalOpen, setAdminModalOpen] = useState(false);

  const studentNavItems = [
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'practicals', label: 'Practicals', icon: FlaskConical },
    { id: 'assignments', label: 'Assignments', icon: FileText },
    { id: 'manuals', label: 'Lab Manuals', icon: Bookmark },
  ];

  const adminNavItems = [
    { id: 'admin-queue', label: 'Review Queue', icon: Inbox },
    { id: 'admin-materials', label: 'Materials', icon: FolderKanban },
    { id: 'admin-upload', label: 'Upload & AI', icon: Upload },
    { id: 'admin-whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'admin-system', label: 'Settings', icon: Settings },
  ];

  const navItems = role === 'admin' ? adminNavItems : studentNavItems;

  const handleAdminTabClick = () => {
    if (role === 'admin') {
      onSelectTab('admin-queue');
    } else {
      setAdminModalOpen(true);
    }
  };

  return (
    <>
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 w-full bg-[#0d1017]/95 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand */}
          <button
            onClick={() => onSelectTab(role === 'admin' ? 'admin-queue' : 'subjects')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <span className="font-bold text-sm sm:text-base tracking-tight text-white block leading-tight">
                College Work Hub
              </span>
              <span className="text-[10px] text-neutral-400 hidden sm:block">
                {role === 'admin' ? 'Faculty & Admin Console' : 'Student Study Portal'}
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#131722] p-1 rounded-xl border border-neutral-800">
            {navItems.map((item) => {
              const isActive = currentTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Role Switcher & Auth Pill */}
          <div className="flex items-center gap-2">
            {role === 'admin' ? (
              <div className="flex items-center gap-1.5">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span className="truncate max-w-[120px]">{user?.name || 'Admin'}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    onSelectTab('subjects');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 text-xs font-bold transition-all active:scale-95"
                  title="Sign out of Admin"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exit Admin</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center bg-[#131722] border border-neutral-800 p-0.5 rounded-xl shadow-inner">
                <button
                  onClick={() => {
                    if (role !== 'student') {
                      switchRole('student');
                      onSelectTab('subjects');
                    }
                  }}
                  disabled={loading}
                  className={`flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 ${
                    role === 'student'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Student</span>
                </button>

                <button
                  onClick={handleAdminTabClick}
                  disabled={loading}
                  className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 text-neutral-400 hover:text-white"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0d1017]/95 backdrop-blur-lg border-t border-neutral-800/90 px-2 py-1.5 shadow-2xl">
        <div className={`grid ${role === 'admin' ? 'grid-cols-5' : 'grid-cols-4'} gap-1 max-w-md mx-auto`}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all active:scale-95 ${
                  isActive
                    ? 'text-indigo-400 bg-indigo-500/10 font-bold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-indigo-400' : 'text-neutral-400'}`} />
                <span className="text-[10px] leading-tight truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Login Dialog Modal */}
      <AdminLoginModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onSuccess={() => onSelectTab('admin-queue')}
      />
    </>
  );
};
