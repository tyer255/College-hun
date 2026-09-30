import React, { useState, useEffect } from 'react';
import { SystemConfig, AuditLog } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Save, CheckCircle2 } from 'lucide-react';

export const SystemConfigView: React.FC = () => {
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await api.getSystemConfig();
      setConfig(res.config);
      setAuditLogs(res.auditLogs);
    } catch (err) {
      console.error('Failed to load system config:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;

    try {
      setSaving(true);
      const res = await api.updateSystemConfig(config);
      setConfig(res.config);
      setNotification('System settings saved.');
      setTimeout(() => setNotification(null), 3000);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Header */}
      <div className="pb-2 border-b border-neutral-800/80">
        <h1 className="text-xl font-semibold text-white tracking-tight">System Settings & Audit Log</h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Academic terms, file parameters, and timestamped administrator actions
        </p>
      </div>

      {notification && (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Config Form */}
      {config && (
        <div className="bg-[#12151f] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3.5">
          <h3 className="text-xs font-medium text-white">General Parameters</h3>

          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-neutral-400 mb-1">Academic Year</label>
                <input
                  type="text"
                  value={config.academicYear}
                  onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                  className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Current Semester</label>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={config.currentSemester}
                  onChange={(e) => setConfig({ ...config, currentSemester: Number(e.target.value) })}
                  className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Max Upload (MB)</label>
                <input
                  type="number"
                  min="5"
                  max="200"
                  value={config.maxUploadSizeMb}
                  onChange={(e) => setConfig({ ...config, maxUploadSizeMb: Number(e.target.value) })}
                  className="w-full bg-[#0d0f16] border border-neutral-700 rounded-lg p-2 text-neutral-200 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-white text-xs font-medium text-neutral-900 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Audit Log Table */}
      <div className="bg-[#12151f] border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3">
        <h3 className="text-xs font-medium text-white">Recent Audit Trail</h3>

        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-neutral-500 font-mono">No audit logs recorded.</div>
        ) : (
          <div className="overflow-x-auto border border-neutral-800 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0e1017] text-neutral-400 border-b border-neutral-800">
                <tr>
                  <th className="py-2 px-3 font-mono">Time</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px]">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-900/40">
                    <td className="py-2 px-3 text-neutral-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-2 px-3 text-neutral-200 whitespace-nowrap">{log.action}</td>
                    <td className="py-2 px-3 text-neutral-300 whitespace-nowrap">{log.actorName}</td>
                    <td className="py-2 px-3 text-neutral-400 font-sans text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
