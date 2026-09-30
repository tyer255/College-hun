import React, { useState } from 'react';
import { WorkItem, Attachment } from '../../types/index.ts';
import {
  X,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Check,
  ZoomIn,
  ZoomOut,
  GraduationCap,
  ShieldCheck,
  Printer
} from 'lucide-react';

interface DocumentViewerModalProps {
  item: WorkItem;
  attachment?: Attachment;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  item,
  attachment,
  onClose,
}) => {
  const currentAttachment = attachment || item.attachments[0] || {
    id: 'default-att',
    name: `${item.title.replace(/\s+/g, '_').substring(0, 32)}.pdf`,
    fileType: 'pdf' as const,
    sizeBytes: 460000,
    pageCount: 4,
    url: '#',
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    previewContent: item.description,
  };

  const totalPages = currentAttachment.pageCount || 4;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [downloaded, setDownloaded] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const handleDownload = () => {
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const content = `=============================================================================
             COLLEGE OF ENGINEERING & TECHNOLOGY
        DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
=============================================================================

COURSE:       ${item.subjectName} (${item.subjectCode})
DOCUMENT:     ${item.type.toUpperCase()} ${item.experimentNumber ? `#${item.experimentNumber}` : ''}
TITLE:        ${item.title}
VERIFIED BY:  Department Faculty & Academic Council
DATE:         ${formattedDate}
STATUS:       OFFICIALLY VERIFIED SYLLABUS DOCUMENT

-----------------------------------------------------------------------------
1. OBJECTIVE & PROBLEM STATEMENT
-----------------------------------------------------------------------------
${item.objective || item.description}

-----------------------------------------------------------------------------
2. THEORY & IMPLEMENTATION DETAILS
-----------------------------------------------------------------------------
${currentAttachment.previewContent || item.description}

-----------------------------------------------------------------------------
3. LAB ENVIRONMENT & HARDWARE REQUIREMENTS
-----------------------------------------------------------------------------
- Operating System: Ubuntu 24.04 LTS / Debian Linux
- Runtime / Tools: GCC 13.x / Python 3.12+ / OpenSSL / PostgreSQL 16
- Academic Compliance: AICTE & University Curriculum Standards 2026-2027

-----------------------------------------------------------------------------
4. VIVA VOCE QUESTIONS & CONCEPTS
-----------------------------------------------------------------------------
Q1: Explain the primary algorithm/protocol used in this practical.
Q2: What are the edge cases and computational complexity involved?
Q3: How does this implementation ensure transactional integrity / data safety?

=============================================================================
           [VERIFIED & PUBLISHED VIA COLLEGE WORK HUB]
=============================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = currentAttachment.name.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_Verified_CollegeWorkHub.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="flex flex-col w-full max-w-4xl h-full sm:h-[92vh] bg-[#0e111a] sm:border border-neutral-800 rounded-none sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Top PDF Reader Toolbar */}
        <div className="flex items-center justify-between px-3.5 py-3 bg-[#141824] border-b border-neutral-800 shrink-0 gap-2">
          {/* File Information */}
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 font-bold text-xs">
              PDF
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 flex-wrap">
                <span className="font-semibold text-neutral-200">{item.subjectCode}</span>
                <span>·</span>
                <span className="capitalize">{item.type} {item.experimentNumber ? `#${item.experimentNumber}` : ''}</span>
                <span className="hidden sm:inline">·</span>
                <span className="hidden sm:inline text-neutral-400">Page {currentPage} of {totalPages}</span>
              </div>
              <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                {currentAttachment.name || item.title}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Zoom Controls (Desktop) */}
            <div className="hidden md:flex items-center bg-[#0e111a] border border-neutral-800 rounded-lg p-0.5 text-xs text-neutral-300">
              <button
                onClick={() => setZoomLevel((z) => Math.max(80, z - 10))}
                className="p-1 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px]">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
                className="p-1 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* High-Visibility Download Button */}
            <button
              onClick={handleDownload}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 ${
                downloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {downloaded ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloaded ? 'Downloaded!' : 'Download PDF'}</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Canvas */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-[#0a0c12] flex justify-center items-start">
          {/* Realistic A4 Printed Document Sheet */}
          <div
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            className="w-full max-w-2xl bg-[#ffffff] text-[#1a1f2c] rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-10 my-2 transition-transform duration-150 border border-neutral-300 select-text"
          >
            {/* Official University / Department Header */}
            <div className="border-b-2 border-[#1a1f2c] pb-4 mb-6 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-1">
                <GraduationCap className="w-6 h-6 text-[#1a1f2c]" />
                <span className="text-xs sm:text-sm font-extrabold tracking-wider uppercase text-[#1a1f2c]">
                  College of Engineering & Technology
                </span>
              </div>
              <p className="text-[11px] font-semibold tracking-wide text-neutral-700 uppercase">
                Department of Computer Science & Engineering
              </p>
              <div className="mt-2 inline-block bg-neutral-100 border border-neutral-300 px-3 py-0.5 rounded text-[11px] font-bold text-neutral-800">
                Academic Year 2026-2027 · Semester 6
              </div>
            </div>

            {/* Subject & Experiment Title Banner */}
            <div className="bg-neutral-50 border border-neutral-300 rounded-lg p-3.5 mb-5">
              <div className="flex items-center justify-between gap-2 text-xs font-bold text-neutral-700 mb-1">
                <span>Course: {item.subjectName} ({item.subjectCode})</span>
                <span className="text-emerald-700 font-mono">
                  {item.type === 'practical' ? `EXP NO. 0${item.experimentNumber || 1}` : item.type.toUpperCase()}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-black text-[#0f172a] leading-tight">
                {item.title}
              </h1>
            </div>

            {/* Page 1: Problem Statement, Objective & Implementation */}
            {currentPage === 1 && (
              <div className="space-y-5 text-xs sm:text-sm leading-relaxed text-neutral-800">
                {/* 1. Aim & Objective */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    1. Aim & Objective
                  </h3>
                  <p className="text-neutral-700 leading-relaxed font-serif">
                    {item.objective || item.description}
                  </p>
                </div>

                {/* 2. Problem Statement */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    2. Problem Statement & Scope
                  </h3>
                  <p className="text-neutral-700 leading-relaxed font-serif">
                    {item.description}
                  </p>
                </div>

                {/* 3. Implementation Code / Procedure */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    3. Code Snippet & Lab Procedure
                  </h3>
                  <div className="bg-[#1a1f2c] text-emerald-300 rounded-lg p-3.5 font-mono text-[11px] sm:text-xs overflow-x-auto leading-relaxed shadow-inner">
                    {currentAttachment.previewContent || `// ${item.title}\n// Department of Computer Science & Engineering\n\n#include <stdio.h>\n#include <stdlib.h>\n#include <unistd.h>\n\nint main(int argc, char *argv[]) {\n    printf("[+] Initializing ${item.subjectName} Lab Routine...\\n");\n    printf("[+] Executing ${item.title}\\n");\n    printf("[+] Status: Verification OK\\n");\n    return 0;\n}`}
                  </div>
                </div>

                {/* Student Signature & Verification Box */}
                <div className="pt-6 mt-6 border-t border-neutral-300 grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-neutral-500 font-mono text-[10px] block">Student Signature</span>
                    <div className="mt-4 border-b border-dotted border-neutral-400 w-32" />
                  </div>
                  <div className="text-right">
                    <span className="text-neutral-500 font-mono text-[10px] block">Faculty In-Charge Evaluation</span>
                    <div className="mt-4 border-b border-dotted border-neutral-400 w-32 ml-auto" />
                  </div>
                </div>
              </div>
            )}

            {/* Page 2: Environment & Rubric */}
            {currentPage === 2 && (
              <div className="space-y-5 text-xs sm:text-sm text-neutral-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    4. Software & Hardware Environment
                  </h3>
                  <ul className="list-disc list-inside space-y-1.5 text-neutral-700 font-serif">
                    <li>Operating System: Ubuntu 24.04 LTS (64-bit Kernel)</li>
                    <li>Compilers / Environments: GCC, Python 3.12, PostgreSQL 16</li>
                    <li>Network Tools: Wireshark, Netcat, GDB Debugger</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    5. Grading Rubric (Max: 100 Marks)
                  </h3>
                  <div className="border border-neutral-300 rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-neutral-100 font-bold p-2 border-b border-neutral-300 text-neutral-800">
                      <span>Evaluation Criterion</span>
                      <span className="text-center">Weightage</span>
                      <span className="text-right">Max Marks</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-neutral-200">
                      <span>Pre-Lab Concept & Viva</span>
                      <span className="text-center font-mono">20%</span>
                      <span className="text-right font-mono">20</span>
                    </div>
                    <div className="grid grid-cols-3 p-2 border-b border-neutral-200">
                      <span>Code Execution & Accuracy</span>
                      <span className="text-center font-mono">50%</span>
                      <span className="text-right font-mono">50</span>
                    </div>
                    <div className="grid grid-cols-3 p-2">
                      <span>Lab Record & Observations</span>
                      <span className="text-center font-mono">30%</span>
                      <span className="text-right font-mono">30</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Page 3: Output & Viva Voce */}
            {currentPage === 3 && (
              <div className="space-y-5 text-xs sm:text-sm text-neutral-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    6. Expected Execution Trace
                  </h3>
                  <div className="bg-neutral-900 text-neutral-100 rounded-lg p-3 font-mono text-[11px] space-y-1">
                    <p className="text-emerald-400">$ gcc -Wall -O2 solution.c -o solution</p>
                    <p className="text-emerald-400">$ ./solution</p>
                    <p>[INFO] Initialization complete ... [OK]</p>
                    <p>[PASS] All 5 test vectors executed with 0 assertions failed.</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    7. Standard Viva Questions
                  </h3>
                  <ol className="list-decimal list-inside space-y-2 text-neutral-700 font-serif">
                    <li>State the time and space complexity of your implementation.</li>
                    <li>What happens if abnormal inputs or buffer boundaries are exceeded?</li>
                    <li>How does this experiment correlate with real-world industry architecture?</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Page 4: Certificate & Compliance */}
            {currentPage === 4 && (
              <div className="space-y-5 text-xs sm:text-sm text-neutral-800">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 border-b border-neutral-300 pb-1 mb-2">
                    8. Department Verification Stamp
                  </h3>
                  <div className="p-4 border-2 border-dashed border-emerald-600 rounded-xl bg-emerald-50 text-emerald-900 space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <ShieldCheck className="w-5 h-5 text-emerald-700" />
                      <span>OFFICIALLY VERIFIED ACADEMIC SYLLABUS</span>
                    </div>
                    <p className="text-xs leading-relaxed">
                      This material has been vetted and approved by the Faculty Academic Board of Computer Science & Engineering.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Document Footer */}
            <div className="mt-8 pt-4 border-t border-neutral-300 flex items-center justify-between text-[10px] text-neutral-500 font-mono">
              <span>Verified Document · College Work Hub</span>
              <span>Page {currentPage} of {totalPages}</span>
            </div>
          </div>
        </div>

        {/* Bottom Pagination Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#141824] border-t border-neutral-800 shrink-0">
          <span className="text-xs text-neutral-400 font-medium">
            Page <strong className="text-white">{currentPage}</strong> of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 active:scale-95"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
