import React, { useState, useEffect } from 'react';
import { Subject, WorkItem } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { SubjectCard } from './SubjectCard.tsx';
import { SubjectDetailView } from './SubjectDetailView.tsx';
import { getSubjectTheme } from '../../utils/subjectTheme.ts';
import {
  Search,
  BookOpen,
  FlaskConical,
  FileText,
  Bookmark,
  Eye,
  Download,
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  GraduationCap
} from 'lucide-react';
import { DocumentViewerModal } from '../common/DocumentViewerModal.tsx';

interface StudentPortalProps {
  currentTab: string;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ currentTab }) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allWorkItems, setAllWorkItems] = useState<WorkItem[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePreviewItem, setActivePreviewItem] = useState<WorkItem | null>(null);
  const [activeQuickFilter, setActiveQuickFilter] = useState<'all' | 'practical' | 'assignment' | 'manual'>('all');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [subRes, workRes] = await Promise.all([
          api.getSubjects(),
          api.getWorkItems({
            type:
              currentTab === 'practicals'
                ? 'practical'
                : currentTab === 'assignments'
                ? 'assignment'
                : currentTab === 'manuals'
                ? 'manual'
                : undefined,
          }),
        ]);
        setSubjects(subRes.subjects);
        setAllWorkItems(workRes.items);
      } catch (err) {
        console.error('Error loading student portal data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentTab]);

  if (selectedSubject) {
    return (
      <SubjectDetailView
        subject={selectedSubject}
        onBack={() => setSelectedSubject(null)}
      />
    );
  }

  const isCategoryView = currentTab === 'practicals' || currentTab === 'assignments' || currentTab === 'manuals';

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDirectItems = allWorkItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (activeQuickFilter === 'all') return true;
    return item.type === activeQuickFilter;
  });

  const practicalsCount = allWorkItems.filter((i) => i.type === 'practical').length;
  const assignmentsCount = allWorkItems.filter((i) => i.type === 'assignment').length;
  const manualsCount = allWorkItems.filter((i) => i.type === 'manual').length;

  return (
    <div className="space-y-4 sm:space-y-6 text-left pb-16 sm:pb-8">
      {/* Friendly Welcome Banner (Student-First, Zero Complex Jargon) */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#171d2d] via-[#141824] to-[#1a1829] border border-neutral-800/90 p-4 sm:p-6 overflow-hidden shadow-sm">
        {/* Soft Ambient Light */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Semester 6 · Computer Science</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight pt-1">
              Welcome to Your Study Hub 👋
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Browse subject materials, download practical experiments, and view assignments easily.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-2 bg-[#0e111a]/80 border border-neutral-800 p-2 rounded-xl shrink-0">
            <div className="text-center px-3 py-1">
              <div className="text-base sm:text-lg font-bold text-white leading-none">
                {subjects.length}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Subjects</div>
            </div>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="text-center px-3 py-1">
              <div className="text-base sm:text-lg font-bold text-emerald-400 leading-none">
                {practicalsCount}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Practicals</div>
            </div>
            <div className="h-6 w-px bg-neutral-800" />
            <div className="text-center px-3 py-1">
              <div className="text-base sm:text-lg font-bold text-sky-400 leading-none">
                {assignmentsCount}
              </div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Assignments</div>
            </div>
          </div>
        </div>

        {/* Global Live Search Bar */}
        <div className="relative w-full mt-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search subjects, practical topics, assignments, or keywords..."
            className="w-full bg-[#0b0e14]/90 border border-neutral-700/80 hover:border-neutral-600 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-all shadow-inner"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 hover:text-white px-2 py-0.5 rounded bg-neutral-800"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-[#131722] border border-neutral-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isCategoryView ? (
        /* Direct List for Practicals / Assignments / Manuals */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white">
              {currentTab === 'practicals'
                ? '🔬 All Lab Practicals'
                : currentTab === 'assignments'
                ? '📝 Course Assignments'
                : '📖 Official Lab Manuals'}
            </h2>
            <span className="text-xs text-neutral-400">
              {filteredDirectItems.length} available
            </span>
          </div>

          {filteredDirectItems.length === 0 ? (
            <div className="py-14 text-center bg-[#131722] border border-neutral-800 rounded-2xl p-6">
              <BookOpen className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
              <div className="text-sm font-semibold text-neutral-300">No documents found</div>
              <p className="text-xs text-neutral-500 mt-1">Try searching with different words.</p>
            </div>
          ) : (
            filteredDirectItems.map((item) => {
              const theme = getSubjectTheme(item.subjectId || item.subjectCode);
              return (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-[#131722] border border-neutral-800/90 hover:border-neutral-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                        {item.subjectCode}
                      </span>
                      <span className="text-neutral-300 font-medium">{item.subjectName}</span>
                      <span className="text-neutral-500">·</span>
                      {item.type === 'practical' ? (
                        <span className="text-emerald-400 font-semibold text-xs">
                          Practical #{item.experimentNumber || 1}
                        </span>
                      ) : item.type === 'assignment' ? (
                        <span className="text-sky-400 font-semibold text-xs">
                          Assignment
                        </span>
                      ) : (
                        <span className="text-violet-400 font-semibold text-xs">
                          Lab Manual
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed font-normal">
                      {item.description}
                    </p>
                  </div>

                  {/* Mobile-Friendly Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
                    <button
                      onClick={() => setActivePreviewItem(item)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-neutral-200 transition-colors active:scale-95 border border-neutral-700"
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
              );
            })
          )}
        </div>
      ) : (
        /* Course Grid with Distinct, Colorful, Student-Friendly Subject Cards */
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>📚 Your Enrolled Subjects</span>
            </h2>
            <span className="text-xs text-neutral-400">
              Tap any subject to view all materials
            </span>
          </div>

          {filteredSubjects.length === 0 ? (
            <div className="py-14 text-center bg-[#131722] border border-neutral-800 rounded-2xl p-6 sm:p-8 space-y-2">
              <Layers className="w-10 h-10 text-neutral-600 mx-auto mb-1" />
              <div className="text-base font-bold text-white">
                {searchQuery ? `No subject found for "${searchQuery}"` : 'No Subjects Published Yet'}
              </div>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try searching with different keywords or clear the search bar.'
                  : 'Your college portal is ready. Faculty and administrators can add courses and publish materials using the Admin panel.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredSubjects.map((sub) => (
                <SubjectCard key={sub.id} subject={sub} onOpen={(s) => setSelectedSubject(s)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Document Viewer Modal */}
      {activePreviewItem && (
        <DocumentViewerModal item={activePreviewItem} onClose={() => setActivePreviewItem(null)} />
      )}
    </div>
  );
};
