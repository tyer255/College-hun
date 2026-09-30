import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Subject } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { ReviewQueueView } from './ReviewQueueView.tsx';
import { MaterialManagerView } from './MaterialManagerView.tsx';
import { UploadAndDetectView } from './UploadAndDetectView.tsx';
import { WhatsAppIntegrationView } from './WhatsAppIntegrationView.tsx';
import { SystemConfigView } from './SystemConfigView.tsx';
import { ShieldAlert, Shield, Lock, ArrowRight } from 'lucide-react';
import { AdminLoginModal } from './AdminLoginModal.tsx';

interface AdminPortalProps {
  currentTab: string;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ currentTab }) => {
  const { role, user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.getSubjects();
      setSubjects(res.subjects);
    } catch (err) {
      console.error('Failed to load admin subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') {
      fetchSubjects();
    }
  }, [role]);

  // Strict Frontend Role-Based Gate
  if (role !== 'admin') {
    return (
      <>
        <div className="max-w-md mx-auto my-8 sm:my-16 p-6 sm:p-8 bg-[#121622] border border-neutral-800 rounded-2xl text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Administrator Authentication Required
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed max-w-sm mx-auto">
            This area contains unpublished drafts, incoming review queues, and department configurations. Authorized faculty and administrators must enter their credentials to proceed.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setLoginModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-md active:scale-98"
            >
              <Shield className="w-4 h-4" />
              <span>Enter Admin Email & Password</span>
            </button>
          </div>
        </div>

        <AdminLoginModal
          isOpen={loginModalOpen}
          onClose={() => setLoginModalOpen(false)}
          onSuccess={fetchSubjects}
        />
      </>
    );
  }

  return (
    <div className="space-y-6 pb-16 sm:pb-8">
      {currentTab === 'admin-queue' && (
        <ReviewQueueView
          subjects={subjects}
          onMaterialPublished={fetchSubjects}
        />
      )}

      {currentTab === 'admin-materials' && (
        <MaterialManagerView
          subjects={subjects}
          onRefreshSubjects={fetchSubjects}
        />
      )}

      {currentTab === 'admin-upload' && (
        <UploadAndDetectView
          subjects={subjects}
          onMaterialCreated={fetchSubjects}
        />
      )}

      {currentTab === 'admin-whatsapp' && (
        <WhatsAppIntegrationView
          onDocumentSimulated={fetchSubjects}
        />
      )}

      {currentTab === 'admin-system' && (
        <SystemConfigView />
      )}
    </div>
  );
};
