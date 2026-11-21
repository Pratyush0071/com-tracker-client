import React, { useEffect, useState } from 'react';
import { Save, Shield } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { formatDateTimeIST } from '../../utils/format.ts';

interface AuditItem {
  _id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string;
  createdAt: string;
}

export function AdminSettingsPage() {
  const { refreshMe } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [companyName, setCompanyName] = useState('Commission Tracker');
  const [commissionRatePercent, setCommissionRatePercent] = useState('1');
  const [allowEmployeeEditEntry, setAllowEmployeeEditEntry] = useState(false);
  const [allowEmployeeDeleteEntry, setAllowEmployeeDeleteEntry] = useState(false);
  const [employeeEditWindowHours, setEmployeeEditWindowHours] = useState('24');
  const [withdrawalDayOfMonth, setWithdrawalDayOfMonth] = useState('20');
  const [defaultTargetIncentiveRupees, setDefaultTargetIncentiveRupees] = useState('500');
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);

  useEffect(() => {
    Promise.all([apiClient.get('/admin/settings'), apiClient.get('/admin/audit-logs')])
      .then(([setRes, logRes]) => {
        const s = setRes.data.settings;
        setCompanyName(s.companyName);
        setCommissionRatePercent(String(s.commissionRatePercent));
        setAllowEmployeeEditEntry(Boolean(s.allowEmployeeEditEntry));
        setAllowEmployeeDeleteEntry(Boolean(s.allowEmployeeDeleteEntry));
        setEmployeeEditWindowHours(String(s.employeeEditWindowHours));
        setWithdrawalDayOfMonth(String(s.withdrawalDayOfMonth));
        setDefaultTargetIncentiveRupees(String(s.defaultTargetIncentiveRupees));
        setAuditLogs(logRes.data.logs || []);
      })
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load settings'), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/admin/settings', {
        companyName,
        commissionRatePercent: Number(commissionRatePercent),
        allowEmployeeEditEntry,
        allowEmployeeDeleteEntry,
        employeeEditWindowHours: Number(employeeEditWindowHours),
        withdrawalDayOfMonth: Number(withdrawalDayOfMonth),
        defaultTargetIncentiveRupees: Number(defaultTargetIncentiveRupees),
      });
      await refreshMe();
      showToast(t('Settings saved!', 'सेटिंग्स सेव हो गईं!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to save settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('Settings', 'सेटिंग्स')}
      </h1>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('App / Brand Name', 'ऐप नाम')}
            </label>
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Commission (%)', 'कमीशन (%)')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="50"
              required
              value={commissionRatePercent}
              onChange={(e) => setCommissionRatePercent(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Default Incentive (₹)', 'डिफ़ॉल्ट बोनस (₹)')}
            </label>
            <input
              type="number"
              min="0"
              required
              value={defaultTargetIncentiveRupees}
              onChange={(e) => setDefaultTargetIncentiveRupees(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Cycle Day', 'चक्र दिन')}
            </label>
            <input
              type="number"
              min="1"
              max="28"
              required
              value={withdrawalDayOfMonth}
              onChange={(e) => setWithdrawalDayOfMonth(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Edit Window (Hours)', 'एडिट समय (घंटे)')}
            </label>
            <input
              type="number"
              min="1"
              max="720"
              required
              value={employeeEditWindowHours}
              onChange={(e) => setEmployeeEditWindowHours(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm font-mono"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowEmployeeEditEntry}
              onChange={(e) => setAllowEmployeeEditEntry(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-800">
              {t('Allow employees to edit entries', 'कर्मचारियों को एंट्री बदलने की अनुमति दें')}
            </span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={allowEmployeeDeleteEntry}
              onChange={(e) => setAllowEmployeeDeleteEntry(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300"
            />
            <span className="text-sm font-medium text-slate-800">
              {t('Allow employees to delete entries', 'कर्मचारियों को एंट्री हटाने की अनुमति दें')}
            </span>
          </label>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[42px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('Saving...', 'सेव हो रहा है...') : t('Save', 'सेव करें')}</span>
          </button>
        </div>
      </form>

      {/* Audit Log Viewer */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-2">
          <Shield className="w-4 h-4 text-slate-600" />
          <h2 className="text-base font-bold text-slate-900">
            {t('Audit Logs', 'रिकॉर्ड लॉग')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                <th className="py-2.5 px-4">{t('Time', 'समय')}</th>
                <th className="py-2.5 px-4">{t('User', 'यूज़र')}</th>
                <th className="py-2.5 px-4">{t('Action', 'कार्य')}</th>
                <th className="py-2.5 px-4">{t('Type', 'प्रकार')}</th>
                <th className="py-2.5 px-4">{t('Note', 'नोट')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <tr key={log._id}>
                  <td className="py-2.5 px-4 font-mono text-xs whitespace-nowrap">
                    {formatDateTimeIST(log.createdAt)}
                  </td>
                  <td className="py-2.5 px-4 whitespace-nowrap">
                    {log.actorName}{' '}
                    <span className="text-xs text-slate-400">({log.actorRole})</span>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-xs font-semibold text-slate-800">
                    {log.action}
                  </td>
                  <td className="py-2.5 px-4 text-xs text-slate-600">{log.entityType}</td>
                  <td className="py-2.5 px-4 text-xs text-slate-500">{log.reason || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
