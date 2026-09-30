import React, { useState, useEffect } from 'react';
import { WhatsAppPlatformConfig } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import {
  Copy,
  Check,
  Send,
  CheckCircle2,
  Share2,
  MessageCircle,
  ExternalLink,
  Shield,
  Zap,
  Bot
} from 'lucide-react';

interface WhatsAppIntegrationViewProps {
  onDocumentSimulated?: () => void;
}

export const WhatsAppIntegrationView: React.FC<WhatsAppIntegrationViewProps> = ({
  onDocumentSimulated,
}) => {
  const [config, setConfig] = useState<WhatsAppPlatformConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedShareMsg, setCopiedShareMsg] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const [phoneId, setPhoneId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [verifyToken, setVerifyToken] = useState('');

  // Simulator for Teacher's Unnamed PDF + WhatsApp Message
  const [simFacultyPhone, setSimFacultyPhone] = useState('+91 98765 43210');
  const [simFacultyName, setSimFacultyName] = useState('Course Instructor');
  const [simFileName, setSimFileName] = useState('20_45.pdf');
  const [simSnippet, setSimSnippet] = useState('EMI lab practical ex- 7');
  const [autoPublishDirect, setAutoPublishDirect] = useState(true);
  const [simulating, setSimulating] = useState(false);

  // App live share URL
  const portalUrl = window.location.origin;
  const shareText = `📚 *College Work Hub - Student Study Portal*\n\nAccess all semester practical lab manuals, experiment codes, and assignment questions:\n👉 ${portalUrl}\n\n(Open link in browser and tap 'Add to Home Screen' for instant access!)`;

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getWhatsAppStatus();
      setConfig(res.config);
      setVerifyToken(res.config.verifyToken);
    } catch (err) {
      console.error('Failed to load WhatsApp config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneId || !wabaId) {
      alert('Phone Number ID and WABA ID are required.');
      return;
    }

    try {
      setSaving(true);
      const res = await api.updateWhatsAppConfig({
        phoneNumberId: phoneId,
        wabaId: wabaId,
        verifyToken: verifyToken || undefined,
      });
      setConfig(res.config);
      setNotification('WhatsApp API credentials saved successfully.');
      setTimeout(() => setNotification(null), 3000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update credentials');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      const res = await api.simulateWhatsAppIncoming({
        senderPhone: simFacultyPhone,
        senderName: simFacultyName,
        fileName: simFileName,
        topicSnippet: simSnippet,
        autoPublishToSubject: autoPublishDirect,
      });

      setNotification(res.message);
      setTimeout(() => setNotification(null), 4500);
      if (onDocumentSimulated) onDocumentSimulated();
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const setPresetExample = (file: string, msg: string) => {
    setSimFileName(file);
    setSimSnippet(msg);
  };

  const copyWebhookUrl = () => {
    if (config?.webhookUrl) {
      navigator.clipboard.writeText(config.webhookUrl);
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    }
  };

  const copyShareMessage = () => {
    navigator.clipboard.writeText(shareText);
    setCopiedShareMsg(true);
    setTimeout(() => setCopiedShareMsg(false), 2000);
  };

  const openWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-5 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-800">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>WhatsApp Group Integration</span>
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Auto-detect teacher messages (e.g. "ex- 7") + raw scanner PDFs (e.g. "20_45.pdf")
          </p>
        </div>

        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full border self-start sm:self-auto ${
            config?.isConfigured
              ? 'border-emerald-500/30 bg-emerald-500/15 text-emerald-300'
              : 'border-neutral-700 bg-neutral-800 text-neutral-300'
          }`}
        >
          {config?.isConfigured ? '🟢 Meta Cloud API Active' : '⚪ Bot Engine Ready'}
        </span>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{notification}</span>
        </div>
      )}

      {/* How it works simple banner */}
      <div className="bg-[#121622] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              How the Parser Handles Unnamed PDFs ("20_45.pdf")
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
              When faculty sends scanner files without proper names and types a message like "ex- 7", the bot reads both the message and file to determine the subject, experiment number, and creates a clean title.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-xs">
          <div className="p-3 bg-[#0a0c12] border border-neutral-800 rounded-xl">
            <div className="text-amber-400 font-semibold mb-1">1. Teacher WhatsApp Input</div>
            <p className="text-neutral-400 text-[11px]">
              File: <code className="text-white">20_45.pdf</code><br />
              Text: <code className="text-amber-300">"EMI ex- 7"</code>
            </p>
          </div>

          <div className="p-3 bg-[#0a0c12] border border-neutral-800 rounded-xl">
            <div className="text-indigo-400 font-semibold mb-1">2. Auto Classification</div>
            <p className="text-neutral-400 text-[11px]">
              Subject: <strong>EMI</strong><br />
              Type: <strong>Experiment #7</strong>
            </p>
          </div>

          <div className="p-3 bg-[#0a0c12] border border-neutral-800 rounded-xl">
            <div className="text-emerald-400 font-semibold mb-1">3. Appended to Portal</div>
            <p className="text-neutral-400 text-[11px]">
              Title: <strong>EMI - Experiment 07</strong><br />
              Published directly to subject card
            </p>
          </div>
        </div>
      </div>

      {/* 1. Test Ingestion Simulator */}
      <div className="bg-[#121622] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Test Teacher Message & PDF Parser</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Simulate raw files with instructor message text:
            </p>
          </div>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              type="button"
              onClick={() => setPresetExample('20_45.pdf', 'EMI practical ex- 7')}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-[11px] font-medium"
            >
              20_45.pdf + "EMI ex- 7"
            </button>
            <button
              type="button"
              onClick={() => setPresetExample('Scan_003.pdf', 'EPG lab experiment 3')}
              className="px-2.5 py-1 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-200 hover:text-white text-[11px] font-medium"
            >
              Scan_003.pdf + "EPG exp 3"
            </button>
          </div>
        </div>

        <form onSubmit={handleSimulateWebhook} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Raw PDF File Name (Scanner Name)
              </label>
              <input
                type="text"
                required
                value={simFileName}
                onChange={(e) => setSimFileName(e.target.value)}
                placeholder="e.g. 20_45.pdf"
                className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-neutral-300 font-medium mb-1">
                Sender Name / Phone
              </label>
              <input
                type="text"
                value={simFacultyName}
                onChange={(e) => setSimFacultyName(e.target.value)}
                placeholder="e.g. Course Faculty"
                className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-neutral-300 font-medium mb-1">
              Teacher's WhatsApp Message (Caption or Text)
            </label>
            <input
              type="text"
              required
              value={simSnippet}
              onChange={(e) => setSimSnippet(e.target.value)}
              placeholder="e.g. EMI lab practical ex- 7"
              className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs text-white font-mono"
            />
          </div>

          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="checkbox"
              id="auto-pub-check"
              checked={autoPublishDirect}
              onChange={(e) => setAutoPublishDirect(e.target.checked)}
              className="rounded bg-neutral-900 border-neutral-700 text-indigo-600"
            />
            <label htmlFor="auto-pub-check" className="text-xs text-neutral-300 font-medium cursor-pointer">
              Publish directly to student subject card (skip manual review)
            </label>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={simulating}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{simulating ? 'Processing...' : 'Parse & Upload to Subject Card'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Share with Students in WhatsApp Group */}
      <div className="bg-[#121622] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-white">
              Share Portal Link in College WhatsApp Group
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Share the student link in your college WhatsApp group for instant student access on mobile:
            </p>
          </div>
        </div>

        <div className="bg-[#0a0c12] border border-neutral-800 rounded-xl p-3 text-xs font-mono text-neutral-300 whitespace-pre-wrap leading-relaxed select-all">
          {shareText}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            onClick={openWhatsAppShare}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Open WhatsApp to Share</span>
          </button>

          <button
            onClick={copyShareMessage}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
          >
            {copiedShareMsg ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedShareMsg ? 'Copied' : 'Copy Message Text'}</span>
          </button>
        </div>
      </div>

      {/* 3. Official Meta Webhook Configuration */}
      <div className="bg-[#121622] border border-neutral-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              Official Meta Cloud API Configuration (Optional)
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Connect your official Meta WhatsApp Business Cloud Webhook:
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Webhook Callback URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={config?.webhookUrl || `${portalUrl}/api/webhooks/whatsapp`}
              className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs font-mono text-neutral-300 select-all"
            />
            <button
              onClick={copyWebhookUrl}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors shrink-0"
            >
              {copiedWebhook ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedWebhook ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveConfig} className="space-y-3 pt-2 border-t border-neutral-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-neutral-300 font-medium mb-1">
                Phone Number ID
              </label>
              <input
                type="text"
                placeholder={config?.phoneNumberId || 'e.g. 109283748291029'}
                value={phoneId}
                onChange={(e) => setPhoneId(e.target.value)}
                className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-300 font-medium mb-1">
                WABA ID
              </label>
              <input
                type="text"
                placeholder={config?.wabaId || 'e.g. 293847102938475'}
                value={wabaId}
                onChange={(e) => setWabaId(e.target.value)}
                className="w-full bg-[#0a0c12] border border-neutral-700 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-xs font-medium text-white transition-colors"
            >
              {saving ? 'Saving...' : 'Save Meta Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
