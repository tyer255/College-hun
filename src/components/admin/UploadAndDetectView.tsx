import React, { useState } from 'react';
import { Subject, WorkItemType } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Upload, AlertTriangle, Check, CheckCircle2, ArrowRight } from 'lucide-react';

interface UploadAndDetectViewProps {
  subjects: Subject[];
  onMaterialCreated: () => void;
}

export const UploadAndDetectView: React.FC<UploadAndDetectViewProps> = ({ subjects, onMaterialCreated }) => {
  const [fileName, setFileName] = useState('');
  const [textSnippet, setTextSnippet] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [detectionResult, setDetectionResult] = useState<{
    detectedSubjectId: string;
    detectedSubjectName: string;
    detectedType: WorkItemType;
    detectedExperimentNumber?: number;
    suggestedTitle: string;
    extractedKeywords: string[];
    summary: string;
    confidenceScore: number;
    isDuplicate: boolean;
    duplicateMatch?: any;
    engine?: string;
  } | null>(null);

  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedType, setSelectedType] = useState<WorkItemType>('practical');
  const [expNumber, setExpNumber] = useState<number>(1);
  const [finalTitle, setFinalTitle] = useState('');
  const [finalDescription, setFinalDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const handleRunDetection = async () => {
    try {
      setAnalyzing(true);
      setDetectionResult(null);
      const res = await api.detectDocument({ fileName, textSnippet });

      setDetectionResult(res);
      setSelectedSubjectId(res.detectedSubjectId);
      setSelectedType(res.detectedType);
      if (res.detectedExperimentNumber) setExpNumber(res.detectedExperimentNumber);
      setFinalTitle(res.suggestedTitle);
      setFinalDescription(res.summary);
    } catch (err: any) {
      alert(err.message || 'Detection failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePublish = async (publishImmediate: boolean) => {
    try {
      setSaving(true);
      await api.createWorkItem({
        subjectId: selectedSubjectId || subjects[0]?.id,
        type: selectedType,
        experimentNumber: selectedType === 'practical' ? expNumber : undefined,
        title: finalTitle,
        description: finalDescription,
        published: publishImmediate,
        tags: detectionResult?.extractedKeywords || ['Lab', 'Verified'],
      });

      setNotification(`Document ${publishImmediate ? 'published to students' : 'saved to drafts'}.`);
      setTimeout(() => setNotification(null), 3000);
      onMaterialCreated();
      setDetectionResult(null);
    } catch (err: any) {
      alert(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800/80">
        <h1 className="text-xl font-semibold text-white tracking-tight">Upload & AI Detection</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Automatically detect subject, experiment number, and document category using Gemini
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Input Box */}
      <div className="bg-[#12151f] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">File Name (Scanner / Raw Name)</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="e.g. 20_45.pdf or Scan_Doc1.pdf"
              className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none font-mono"
            />
          </div>

          <div className="flex items-end gap-1.5 text-xs flex-wrap">
            <span className="text-neutral-500 text-[11px]">Teacher Quick Test:</span>
            <button
              onClick={() => {
                setFileName('20_45.pdf');
                setTextSnippet('EMI blaa blaa ex- 7');
              }}
              className="px-2 py-1 rounded border border-emerald-800/80 bg-emerald-950/30 text-[11px] text-emerald-300 hover:bg-emerald-900/50"
            >
              20_45.pdf + ex-7
            </button>
            <button
              onClick={() => {
                setFileName('Doc_883.pdf');
                setTextSnippet('EPG power systems lab practical 3');
              }}
              className="px-2 py-1 rounded border border-amber-800/80 bg-amber-950/30 text-[11px] text-amber-300 hover:bg-amber-900/50"
            >
              EPG Exp 3
            </button>
            <button
              onClick={() => {
                setFileName('CAM_09.pdf');
                setTextSnippet('ETC circuits assignment 1 questions');
              }}
              className="px-2 py-1 rounded border border-sky-800/80 bg-sky-950/30 text-[11px] text-sky-300 hover:bg-sky-900/50"
            >
              ETC Asg 1
            </button>
          </div>
        </div>

        <div>
          <label className="block text-[11px] text-neutral-400 mb-1">
            Teacher's WhatsApp Message / Caption Text
          </label>
          <textarea
            rows={2}
            value={textSnippet}
            onChange={(e) => setTextSnippet(e.target.value)}
            placeholder="e.g. blaa blaa ex- 7 or EMI lab exp 4 submit on Friday"
            className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none font-mono text-[11px]"
          />
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleRunDetection}
            disabled={analyzing || !fileName}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-xs font-medium text-neutral-900 transition-colors disabled:opacity-50"
          >
            <span>{analyzing ? 'Detecting...' : 'Detect Course & Experiment'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Detection Results */}
      {detectionResult && (
        <div className="bg-[#12151f] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
            <span className="text-xs font-medium text-white">Detection Result</span>
            <span className="text-[11px] font-mono text-neutral-400">
              Confidence: {(detectionResult.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          {detectionResult.isDuplicate && (
            <div className="flex items-center gap-2 p-2.5 bg-amber-950/20 border border-amber-900/40 rounded-lg text-xs text-amber-300">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
              <span>Duplicate detected: Matches existing published material.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Type</label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as WorkItemType)}
                className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none"
              >
                <option value="practical">Practical</option>
                <option value="assignment">Assignment</option>
                <option value="manual">Lab Manual</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Experiment #</label>
              <input
                type="number"
                value={expNumber}
                disabled={selectedType !== 'practical'}
                onChange={(e) => setExpNumber(Number(e.target.value))}
                className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 focus:outline-none disabled:opacity-40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-neutral-400 mb-1">Title</label>
            <input
              type="text"
              value={finalTitle}
              onChange={(e) => setFinalTitle(e.target.value)}
              className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-xs text-neutral-200 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              onClick={() => handlePublish(false)}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg border border-neutral-700 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Save to Drafts
            </button>
            <button
              onClick={() => handlePublish(true)}
              disabled={saving || !finalTitle}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-xs font-medium text-neutral-900 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Approve & Publish to Students</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
