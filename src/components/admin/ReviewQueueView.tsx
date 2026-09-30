import React, { useState, useEffect } from 'react';
import { IncomingFileItem, Subject, WorkItemType } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Check,
  X,
  AlertTriangle,
  Upload,
  FileText,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Inbox
} from 'lucide-react';

interface ReviewQueueViewProps {
  subjects: Subject[];
  onMaterialPublished?: () => void;
}

export const ReviewQueueView: React.FC<ReviewQueueViewProps> = ({ subjects, onMaterialPublished }) => {
  const [queue, setQueue] = useState<IncomingFileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [correctedForms, setCorrectedForms] = useState<Record<string, {
    subjectId: string;
    type: WorkItemType;
    experimentNumber: number | string;
    title: string;
    description: string;
  }>>({});
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadSnippet, setUploadSnippet] = useState('');
  const [uploadSender, setUploadSender] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const res = await api.getIncomingQueue();
      setQueue(res.queue);

      const forms: typeof correctedForms = {};
      res.queue.forEach((item) => {
        forms[item.id] = {
          subjectId: item.detection.detectedSubjectId,
          type: item.detection.detectedType,
          experimentNumber: item.detection.detectedExperimentNumber || 1,
          title: item.detection.suggestedTitle,
          description: item.detection.summary,
        };
      });
      setCorrectedForms(forms);
    } catch (err) {
      console.error('Failed to load review queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleDecision = async (id: string, action: 'approve_publish' | 'save_draft' | 'reject') => {
    try {
      setActionInProgress(id);
      const corrected = correctedForms[id];
      const payload = corrected
        ? {
            ...corrected,
            experimentNumber: corrected.experimentNumber ? Number(corrected.experimentNumber) : undefined,
          }
        : undefined;
      const res = await api.processReviewDecision(id, action, payload);
      setNotification(res.message);
      setTimeout(() => setNotification(null), 3000);
      await loadQueue();
      if (onMaterialPublished) onMaterialPublished();
    } catch (err: any) {
      alert(err.message || 'Action failed');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleEnqueueNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;

    try {
      setActionInProgress('new-upload');
      await api.enqueueFile({
        fileName: uploadFileName,
        rawSnippet: uploadSnippet,
        senderName: uploadSender || 'Faculty Upload',
        source: 'direct_upload',
      });
      setUploadModalOpen(false);
      setUploadFileName('');
      setUploadSnippet('');
      setUploadSender('');
      await loadQueue();
      setNotification('Document uploaded into review queue.');
      setTimeout(() => setNotification(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to upload document');
    } finally {
      setActionInProgress(null);
    }
  };

  const pendingItems = queue.filter((q) => q.status === 'pending_review');

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* Clean Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Incoming Review Queue
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            {pendingItems.length} documents awaiting faculty review & publish approval
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadQueue}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 rounded-xl border border-neutral-800 bg-[#131722] hover:bg-neutral-800 text-xs font-semibold text-neutral-300 transition-all flex items-center gap-1.5"
            title="Refresh queue"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setUploadModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload New Document</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Queue Items List (Mobile-Optimized Cards) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-[#131722] border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : pendingItems.length === 0 ? (
        <div className="py-14 text-center bg-[#131722] border border-neutral-800 rounded-2xl p-6">
          <Inbox className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">Review Queue is Empty</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
            All submitted documents have been reviewed and published.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {pendingItems.map((item) => {
            const form = correctedForms[item.id] || {
              subjectId: item.detection.detectedSubjectId,
              type: item.detection.detectedType,
              experimentNumber: item.detection.detectedExperimentNumber || 1,
              title: item.detection.suggestedTitle,
              description: item.detection.summary,
            };
            const isExpanded = expandedItemId === item.id;
            const isProcessing = actionInProgress === item.id;

            return (
              <div
                key={item.id}
                className="p-4 sm:p-5 rounded-2xl bg-[#131722] border border-neutral-800/90 shadow-sm space-y-3"
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
                        {item.detection.detectedSubjectName || 'Detected Subject'}
                      </span>
                      <span className="text-neutral-500">·</span>
                      <span className="text-neutral-300 font-medium capitalize">
                        {item.detection.detectedType}
                      </span>
                      {item.detection.confidenceScore && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                          {Math.round(item.detection.confidenceScore * 100)}% match
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug pt-0.5">
                      {item.detection.suggestedTitle || item.fileName}
                    </h3>

                    <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                      <span>File: <strong className="text-neutral-200 font-mono text-[11px]">{item.fileName}</strong></span>
                      <span>·</span>
                      <span>From: {item.sender?.name || 'Faculty'}</span>
                    </div>
                  </div>
                </div>

                {/* AI Summary Quote */}
                {item.detection.summary && (
                  <p className="text-xs text-neutral-400 bg-[#0c0e14] border border-neutral-800/80 rounded-xl p-3 leading-relaxed">
                    {item.detection.summary}
                  </p>
                )}

                {/* Duplicate warning if any */}
                {item.detection.isDuplicate && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>
                      Potential duplicate detected: Similar to existing file ({item.detection.duplicateMatch?.existingTitle}).
                    </span>
                  </div>
                )}

                {/* Collapsible Edit Panel */}
                {isExpanded && (
                  <div className="mt-3 p-3.5 sm:p-4 rounded-xl bg-[#0e111a] border border-neutral-800 space-y-3 animate-in fade-in">
                    <h4 className="text-xs font-bold text-white">Edit Document Metadata Before Publishing</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Target Subject</label>
                        <select
                          value={form.subjectId}
                          onChange={(e) =>
                            setCorrectedForms((prev) => ({
                              ...prev,
                              [item.id]: { ...form, subjectId: e.target.value },
                            }))
                          }
                          className="w-full bg-[#161a26] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          {subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} ({sub.code})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-neutral-400 mb-1">Document Type</label>
                        <select
                          value={form.type}
                          onChange={(e) =>
                            setCorrectedForms((prev) => ({
                              ...prev,
                              [item.id]: { ...form, type: e.target.value as WorkItemType },
                            }))
                          }
                          className="w-full bg-[#161a26] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="practical">Lab Practical / Experiment</option>
                          <option value="assignment">Assignment</option>
                          <option value="manual">Lab Manual</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] text-neutral-400 mb-1">Document Title</label>
                        <input
                          type="text"
                          value={form.title}
                          onChange={(e) =>
                            setCorrectedForms((prev) => ({
                              ...prev,
                              [item.id]: { ...form, title: e.target.value },
                            }))
                          }
                          className="w-full bg-[#161a26] border border-neutral-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons (Clean & Non-Cluttered on Mobile) */}
                <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="text-xs font-semibold text-neutral-300 hover:text-white py-1.5 px-2 rounded-lg bg-neutral-800/80 flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide Details' : '✏️ Edit Info'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDecision(item.id, 'reject')}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-semibold text-rose-300 transition-colors"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleDecision(item.id, 'approve_publish')}
                      disabled={isProcessing}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve & Publish</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload New File Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121622] border border-neutral-800 rounded-2xl p-5 sm:p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Upload Syllabus Document</h3>
              <button onClick={() => setUploadModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEnqueueNew} className="space-y-3.5">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">File Name</label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. Exp6_Distributed_Database_Replication.pdf"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Sender / Faculty Name</label>
                <input
                  type="text"
                  value={uploadSender}
                  onChange={(e) => setUploadSender(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Sharma"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Document Content / Snippet</label>
                <textarea
                  rows={3}
                  value={uploadSnippet}
                  onChange={(e) => setUploadSnippet(e.target.value)}
                  placeholder="Paste experiment objective, procedure, or lab tasks..."
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionInProgress === 'new-upload'}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  {actionInProgress === 'new-upload' ? 'Uploading...' : 'Submit to Queue'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
