import React, { useCallback, useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { formatDateTimeIST, formatINRFromPaise } from '../../utils/format.ts';
import type { TargetAchievementItem } from '../../types/index.ts';

interface IncentiveRecord {
  _id: string;
  employeeCode: string;
  employeeName: string;
  category: 'target_completion' | 'other';
  amountPaise: number;
  reason: string;
  authorizedByAdminName: string;
  cycleKey?: string;
  createdAt: string;
}

interface IncentivesResponse {
  incentives: IncentiveRecord[];
  achievements: TargetAchievementItem[];
  defaultTargetIncentivePaise: number;
  employees: Array<{ id: string; employeeCode: string; fullName: string }>;
}

export function IncentiveManagementPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [data, setData] = useState<IncentivesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState('');
  const [category, setCategory] = useState<'target_completion' | 'other'>('other');
  const [amount, setAmount] = useState('500');
  const [reason, setReason] = useState('');
  const [achievementId, setAchievementId] = useState('');
  const [allowDuplicateOverride, setAllowDuplicateOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/incentives');
      setData(res.data);
      if (res.data.defaultTargetIncentivePaise) {
        setAmount(String(res.data.defaultTargetIncentivePaise / 100));
      }
      if (!employeeId && res.data.employees?.length > 0) {
        setEmployeeId(res.data.employees[0].id);
      }
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load incentives'), 'error');
    } finally {
      setLoading(false);
    }
  }, [employeeId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId) return;
    setSubmitting(true);
    try {
      await apiClient.post('/admin/incentives', {
        employeeId,
        category,
        amount: Number(amount),
        reason,
        achievementId: achievementId || undefined,
        allowDuplicateOverride,
      });
      showToast(t('Incentive credited!', 'बोनस जोड़ दिया गया!'), 'success');
      setReason('');
      setAchievementId('');
      setAllowDuplicateOverride(false);
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to credit incentive'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;
  if (!data) return null;

  const unrewarded = data.achievements.filter((a) => !a.incentiveGranted);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('Incentives', 'बोनस प्रबंधन')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Grant Incentive Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {t('Add Incentive', 'नया बोनस')}
          </h2>
          <form onSubmit={handleGrant} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Employee', 'कर्मचारी')} *
              </label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="" disabled>
                  {t('Select', 'चुनें')}
                </option>
                {data.employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Category', 'प्रकार')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'target_completion' | 'other')}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm bg-white"
              >
                <option value="target_completion">{t('Target Bonus', 'लक्ष्य बोनस')}</option>
                <option value="other">{t('Other Bonus', 'अन्य बोनस')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Amount (₹)', 'राशि (₹)')} *
              </label>
              <input
                type="number"
                min="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-base font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('Reason', 'कारण')} *
              </label>
              <input
                type="text"
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('e.g. Monthly target completed', 'जैसे: लक्ष्य पूरा')}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !employeeId}
              className="w-full h-11 rounded-xl bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 disabled:opacity-50"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Credit Incentive', 'बोनस जोड़ें')}
            </button>
          </form>
        </div>

        {/* Unrewarded Target Completions */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {t('Pending Target Bonuses', 'बाकी लक्ष्य बोनस')} ({unrewarded.length})
          </h2>
          {unrewarded.length === 0 ? (
            <p className="text-sm text-slate-500">
              {t('All completed goals reviewed.', 'सभी लक्ष्य बोनस जांचे जा चुके हैं।')}
            </p>
          ) : (
            <div className="divide-y divide-slate-100">
              {unrewarded.map((ach) => (
                <div key={ach._id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {ach.employeeName} ({ach.employeeCode}) — {ach.milestoneLabel}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ach.cycleKey} · {formatINRFromPaise(ach.achievedAtSalesPaise)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEmployeeId(ach.employeeId);
                      setCategory('target_completion');
                      setAchievementId(ach._id);
                      setAmount(String(data.defaultTargetIncentivePaise / 100));
                      setReason(`Target Bonus — ${ach.milestoneLabel} (${ach.cycleKey})`);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
                  >
                    <Award className="w-3.5 h-3.5" />
                    <span>{t('Select', 'चुनें')}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Incentive History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t('History', 'बोनस इतिहास')}
          </h2>
        </div>
        {data.incentives.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">
            {t('No incentives yet.', 'अभी कोई बोनस नहीं।')}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                  <th className="py-3 px-4">{t('Date', 'तारीख')}</th>
                  <th className="py-3 px-4">{t('Employee', 'कर्मचारी')}</th>
                  <th className="py-3 px-4">{t('Reason', 'कारण')}</th>
                  <th className="py-3 px-4 text-right">{t('Amount', 'राशि')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.incentives.map((inc) => (
                  <tr key={inc._id}>
                    <td className="py-3 px-4 text-xs font-mono whitespace-nowrap">
                      {formatDateTimeIST(inc.createdAt)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold">
                      {inc.employeeName}{' '}
                      <span className="text-xs font-mono text-slate-500">{inc.employeeCode}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{inc.reason}</td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-teal-700">
                      +{formatINRFromPaise(inc.amountPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
