import React, { useState, useEffect } from 'react';
import { Subject, WorkItem, WorkItemType } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Globe,
  Lock,
  FileText,
  CheckCircle2,
  X,
  FolderKanban,
  Check,
  Filter
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal.tsx';

interface MaterialManagerViewProps {
  subjects: Subject[];
  onRefreshSubjects: () => void;
}

export const MaterialManagerView: React.FC<MaterialManagerViewProps> = ({
  subjects,
  onRefreshSubjects,
}) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewItem, setActivePreviewItem] = useState<WorkItem | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // New Work Item Modal
  const [newItemModalOpen, setNewItemModalOpen] = useState(false);
  const [formSubjectId, setFormSubjectId] = useState(subjects[0]?.id || 'sub-cn');
  const [formType, setFormType] = useState<WorkItemType>('practical');
  const [formExpNumber, setFormExpNumber] = useState<number>(1);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPublished, setFormPublished] = useState(true);

  // New Subject Modal
  const [newSubjectModalOpen, setNewSubjectModalOpen] = useState(false);
  const [subCode, setSubCode] = useState('');
  const [subName, setSubName] = useState('');
  const [subFaculty, setSubFaculty] = useState('');
  const [subDescription, setSubDescription] = useState('');

  const loadItems = async () => {
    try {
      setLoading(true);
      const res = await api.getWorkItems({
        subjectId: selectedSubjectId === 'all' ? undefined : selectedSubjectId,
        type: selectedType === 'all' ? undefined : selectedType,
        search: searchQuery || undefined,
      });
      setItems(res.items);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [selectedSubjectId, selectedType, searchQuery]);

  const handleTogglePublish = async (item: WorkItem) => {
    try {
      setActionLoading(item.id);
      const res = await api.togglePublish(item.id, !item.published);
      setNotification(res.message);
      setTimeout(() => setNotification(null), 3000);
      await loadItems();
      onRefreshSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle publish status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteItem = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;

    try {
      setActionLoading(id);
      const res = await api.deleteWorkItem(id);
      setNotification(res.message);
      setTimeout(() => setNotification(null), 3000);
      await loadItems();
      onRefreshSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateWorkItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle) return;

    try {
      setActionLoading('create');
      await api.createWorkItem({
        subjectId: formSubjectId,
        type: formType,
        experimentNumber: formType === 'practical' ? Number(formExpNumber) : undefined,
        title: formTitle,
        description: formDescription,
        published: formPublished,
      });
      setNewItemModalOpen(false);
      setFormTitle('');
      setFormDescription('');
      setNotification('New material published successfully.');
      setTimeout(() => setNotification(null), 3000);
      await loadItems();
      onRefreshSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create work item');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCode || !subName) return;

    try {
      setActionLoading('create-sub');
      await api.createSubject({
        code: subCode.toUpperCase(),
        name: subName,
        facultyName: subFaculty || 'Faculty Lead',
        description: subDescription,
        semester: 6,
        department: 'Computer Science',
      });
      setNewSubjectModalOpen(false);
      setSubCode('');
      setSubName('');
      setSubFaculty('');
      setSubDescription('');
      setNotification('New subject created successfully.');
      setTimeout(() => setNotification(null), 3000);
      onRefreshSubjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5 text-left">
      {/* Clean Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800/80">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Materials & Publish Manager
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage subject materials, publish/unpublish drafts, and organize syllabi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setNewSubjectModalOpen(true)}
            className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 border border-neutral-700 transition-colors"
          >
            + New Subject
          </button>

          <button
            onClick={() => setNewItemModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Material</span>
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

      {/* Search & Mobile Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="sm:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full bg-[#131722] border border-neutral-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full bg-[#131722] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Subjects ({subjects.length})</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.code} - {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-[#131722] border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Types</option>
            <option value="practical">Practicals Only</option>
            <option value="assignment">Assignments Only</option>
            <option value="manual">Lab Manuals Only</option>
          </select>
        </div>
      </div>

      {/* Materials List (Mobile-Friendly Stacked Cards) */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-[#131722] border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center bg-[#131722] border border-neutral-800 rounded-2xl p-6">
          <FolderKanban className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-white">No Materials Found</h3>
          <p className="text-xs text-neutral-400 mt-1">
            Try adjusting your search or add a new material above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#131722] border border-neutral-800/90 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span className="font-bold text-neutral-200 bg-neutral-800 px-2 py-0.5 rounded text-[10px]">
                    {item.subjectCode}
                  </span>
                  <span className="text-neutral-400">{item.subjectName}</span>
                  <span className="text-neutral-600">·</span>
                  <span className="text-neutral-300 font-medium capitalize">
                    {item.type === 'practical' ? `Exp #${item.experimentNumber || 1}` : item.type}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-1">
                  {item.description}
                </p>
              </div>

              {/* Action & Toggle Controls */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
                {/* Publish Toggle */}
                <button
                  onClick={() => handleTogglePublish(item)}
                  disabled={actionLoading === item.id}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                    item.published
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700 hover:text-white'
                  }`}
                >
                  {item.published ? <Globe className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                  <span>{item.published ? 'Published' : 'Draft'}</span>
                </button>

                {/* Preview */}
                <button
                  onClick={() => setActivePreviewItem(item)}
                  className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-700 transition-colors"
                  title="Preview"
                >
                  <Eye className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteItem(item.id, item.title)}
                  disabled={actionLoading === item.id}
                  className="p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/40 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Material Modal */}
      {newItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121622] border border-neutral-800 rounded-2xl p-5 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Add New Subject Material</h3>
              <button onClick={() => setNewItemModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWorkItem} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Subject</label>
                {subjects.length === 0 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center justify-between gap-2">
                    <span>No subjects created yet.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewItemModalOpen(false);
                        setNewSubjectModalOpen(true);
                      }}
                      className="text-white font-bold underline"
                    >
                      + Create Subject First
                    </button>
                  </div>
                ) : (
                  <select
                    value={formSubjectId || subjects[0]?.id}
                    onChange={(e) => setFormSubjectId(e.target.value)}
                    className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.code} - {sub.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-neutral-300 font-medium mb-1">Type</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as WorkItemType)}
                    className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="practical">Practical / Lab</option>
                    <option value="assignment">Assignment</option>
                    <option value="manual">Lab Manual</option>
                  </select>
                </div>

                {formType === 'practical' && (
                  <div>
                    <label className="block text-xs text-neutral-300 font-medium mb-1">Exp Number</label>
                    <input
                      type="number"
                      min={1}
                      value={formExpNumber}
                      onChange={(e) => setFormExpNumber(Number(e.target.value))}
                      className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Socket Programming with TCP / IP"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Summary of objectives and requirements..."
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pub-check"
                  checked={formPublished}
                  onChange={(e) => setFormPublished(e.target.checked)}
                  className="rounded bg-neutral-900 border-neutral-700"
                />
                <label htmlFor="pub-check" className="text-xs text-neutral-300 font-medium">
                  Publish immediately to students
                </label>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewItemModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create'}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  {actionLoading === 'create' ? 'Saving...' : 'Save Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Subject Modal */}
      {newSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#121622] border border-neutral-800 rounded-2xl p-5 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create New Course Subject</h3>
              <button onClick={() => setNewSubjectModalOpen(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Subject Code</label>
                <input
                  type="text"
                  required
                  value={subCode}
                  onChange={(e) => setSubCode(e.target.value)}
                  placeholder="e.g. CS-306"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  placeholder="e.g. Cloud Computing & Microservices"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Faculty Lead</label>
                <input
                  type="text"
                  value={subFaculty}
                  onChange={(e) => setSubFaculty(e.target.value)}
                  placeholder="e.g. Prof. Arvind Gupta"
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs text-neutral-300 font-medium mb-1">Description</label>
                <textarea
                  rows={2}
                  value={subDescription}
                  onChange={(e) => setSubDescription(e.target.value)}
                  placeholder="Course outline and curriculum scope..."
                  className="w-full bg-[#0b0e14] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setNewSubjectModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-neutral-800 text-xs font-semibold text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === 'create-sub'}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white"
                >
                  {actionLoading === 'create-sub' ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {activePreviewItem && (
        <DocumentViewerModal
          item={activePreviewItem}
          onClose={() => setActivePreviewItem(null)}
        />
      )}
    </div>
  );
};
