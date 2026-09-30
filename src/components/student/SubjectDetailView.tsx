import React, { useState, useEffect } from 'react';
import { Subject, WorkItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { getSubjectTheme } from '../../utils/subjectTheme.ts';
import {
  ArrowLeft,
  Search,
  Eye,
  Download,
  BookOpen,
  FlaskConical,
  FileText,
  Bookmark,
  User2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal.tsx';

interface SubjectDetailViewProps {
  subject: Subject;
  onBack: () => void;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subject, onBack }) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewItem, setActivePreviewItem] = useState<WorkItem | null>(null);

  const theme = getSubjectTheme(subject.id || subject.code);

  useEffect(() => {
    async function loadSubjectItems() {
      try {
        setLoading(true);
        const res = await api.getWorkItems({
          subjectId: subject.id,
          type: selectedType === 'all' ? undefined : selectedType,
          search: searchQuery || undefined,
        });
        setItems(res.items);
      } catch (err) {
        console.error('Failed to load items:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSubjectItems();
  }, [subject.id, selectedType, searchQuery]);

  const practicalCount = items.filter((i) => i.type === 'practical').length;
  const assignmentCount = items.filter((i) => i.type === 'assignment').length;
  const manualCount = items.filter((i) => i.type === 'manual').length;

  return (
    <div className="space-y-4 sm:space-y-5 text-left animate-in fade-in duration-150 pb-16 sm:pb-8">
      {/* Subject Header Card */}
      <div className="relative rounded-2xl bg-[#131722] border border-neutral-800/90 p-4 sm:p-6 overflow-hidden shadow-sm">
        {/* Colorful Glow */}
        <div className={`absolute top-0 right-0 left-0 h-32 bg-gradient-to-b ${theme.gradientBg} pointer-events-none`} />

        <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-200 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 px-3 py-1.5 rounded-xl transition-all active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>← Back to Subjects</span>
          </button>

          <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
            {subject.code}
          </span>
        </div>

        <div className="relative z-10 flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor} border border-white/10 shadow-sm shrink-0 mt-0.5`}>
            <span className="text-2xl select-none">{theme.emoji}</span>
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
              {subject.name}
            </h1>
            <div className="flex items-center gap-2.5 text-xs text-neutral-400 mt-1.5 flex-wrap">
              <span className="flex items-center gap-1 text-neutral-300">
                <User2 className="w-3.5 h-3.5 text-neutral-400" />
                <span>{subject.facultyName}</span>
              </span>
              <span className="text-neutral-600">·</span>
              <span>Semester {subject.semester}</span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-200 font-medium">{items.length} Files Ready</span>
            </div>
          </div>
        </div>

        {subject.description && (
          <p className="relative z-10 text-xs sm:text-sm text-neutral-300/90 mt-3 pt-3 border-t border-neutral-800/80 leading-relaxed font-normal">
            {subject.description}
          </p>
        )}
      </div>

      {/* Search & Filter Tabs */}
      <div className="space-y-2.5">
        {/* Search input */}
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search within ${subject.name}...`}
            className="w-full bg-[#131722] border border-neutral-800 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'all', label: 'All Files', icon: BookOpen, count: items.length },
            { id: 'practical', label: 'Practicals', icon: FlaskConical, count: practicalCount },
            { id: 'assignment', label: 'Assignments', icon: FileText, count: assignmentCount },
            { id: 'manual', label: 'Manuals', icon: Bookmark, count: manualCount },
          ].map((tab) => {
            const isActive = selectedType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#131722] text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="space-y-2.5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 bg-[#131722] border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center bg-[#131722] border border-neutral-800 rounded-2xl p-6">
          <BookOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-neutral-200">No documents found</h3>
          <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No files matching "${searchQuery}". Try different keywords.`
              : 'No published files in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-[#131722] border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
                  {item.type === 'practical' ? (
                    <span className="font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      Practical #{item.experimentNumber || 1}
                    </span>
                  ) : item.type === 'assignment' ? (
                    <span className="font-semibold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                      Assignment
                    </span>
                  ) : (
                    <span className="font-semibold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-md">
                      Lab Manual
                    </span>
                  )}

                  {item.dueDate && (
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Due: {item.dueDate}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {item.title}
                </h3>

                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-normal">
                  {item.description}
                </p>

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-md">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: Mobile Touch-Friendly */}
              <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
                <button
                  onClick={() => setActivePreviewItem(item)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={() => setActivePreviewItem(item)}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white transition-colors active:scale-95 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Viewer Modal */}
      {activePreviewItem && (
        <DocumentViewerModal item={activePreviewItem} onClose={() => setActivePreviewItem(null)} />
      )}
    </div>
  );
};
