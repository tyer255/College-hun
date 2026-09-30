import React from 'react';
import { Subject } from '../../types/index.ts';
import { getSubjectTheme } from '../../utils/subjectTheme.ts';
import { ChevronRight, FlaskConical, FileText, User2 } from 'lucide-react';

interface SubjectCardProps {
  subject: Subject;
  onOpen: (subject: Subject) => void;
}

export const SubjectCard: React.FC<SubjectCardProps> = ({ subject, onOpen }) => {
  const theme = getSubjectTheme(subject.id || subject.code);
  const IconComponent = theme.icon;

  return (
    <div
      onClick={() => onOpen(subject)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(subject);
        }
      }}
      className={`group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-[#131722] border border-neutral-800/90 ${theme.borderHover} hover:shadow-lg transition-all duration-200 cursor-pointer text-left overflow-hidden active:scale-[0.98] select-none`}
    >
      {/* Background Soft Glow Tint */}
      <div className={`absolute top-0 right-0 left-0 h-28 bg-gradient-to-b ${theme.gradientBg} pointer-events-none`} />

      <div className="relative z-10">
        {/* Header: Friendly Subject Icon/Emoji + Semester Badge */}
        <div className="flex items-center justify-between gap-2 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${theme.iconBg} ${theme.iconColor} border border-white/10 shadow-sm shrink-0 group-hover:scale-105 transition-transform`}>
              <span className="text-xl sm:text-2xl leading-none select-none">{theme.emoji}</span>
            </div>
            <div>
              <span className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${theme.badgeBg}`}>
                {subject.code}
              </span>
            </div>
          </div>

          <div className="text-[11px] font-medium text-neutral-400 bg-neutral-900/80 px-2.5 py-1 rounded-full border border-neutral-800/80">
            Semester {subject.semester}
          </div>
        </div>

        {/* Subject Name - Big, Bold, Clean & Legible */}
        <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-white transition-colors leading-tight">
          {subject.name}
        </h3>

        {/* Faculty Name */}
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-2 font-normal">
          <User2 className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="truncate">{subject.facultyName}</span>
        </div>

        {/* Description */}
        {subject.description && (
          <p className="text-xs text-neutral-400/90 mt-2 line-clamp-2 leading-relaxed font-normal">
            {subject.description}
          </p>
        )}
      </div>

      {/* Footer: Practicals & Assignments Count + Clear Action Button */}
      <div className="relative z-10 mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-300 bg-neutral-900/90 px-2.5 py-1 rounded-lg border border-neutral-800">
            <FlaskConical className="w-3 h-3 text-emerald-400" />
            <span>{subject.totalPracticals} Labs</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-medium text-neutral-300 bg-neutral-900/90 px-2.5 py-1 rounded-lg border border-neutral-800">
            <FileText className="w-3 h-3 text-sky-400" />
            <span>{subject.totalAssignments} Asg</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-neutral-200 group-hover:text-white shrink-0 bg-neutral-800/90 group-hover:bg-neutral-700/90 px-2.5 py-1 rounded-lg transition-colors">
          <span>Open</span>
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
