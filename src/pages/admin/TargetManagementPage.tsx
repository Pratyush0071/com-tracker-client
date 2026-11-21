import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { formatDateTimeIST, formatINRFromPaise } from '../../utils/format.ts';
import type { TargetAchievementItem } from '../../types/index.ts';

interface MilestoneRow {
  amountRupees: number;
  label: string;
  defaultIncentiveRupees: number;
}

export function TargetManagementPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [initialTargetRupees, setInitialTargetRupees] = useState('500000');
  const [dailyMode, setDailyMode] = useState<'remaining_days' | 'inclusive_today'>('remaining_days');
  const [achievements, setAchievements] = useState<TargetAchievementItem[]>([]);

  useEffect(() => {
    apiClient
      .get('/admin/targets')
      .then((res) => {
        const cfg = res.data.config;
        setMilestones(
          (cfg.milestones || []).map(
            (m: { amountPaise: number; label: string; defaultIncentivePaise: number }) => ({
              amountRupees: m.amountPaise / 100,
              label: m.label,
              defaultIncentiveRupees: (m.defaultIncentivePaise || 50000) / 100,
            })
          )
        );
        setInitialTargetRupees(String((cfg.initialTargetPaise || 50000000) / 100));
        setDailyMode(cfg.dailyCalculationMode || 'remaining_days');
        setAchievements(res.data.achievements || []);
      })
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load targets'), 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const handleAddMilestone = () => {
    const lastAmt = milestones.length > 0 ? milestones[milestones.length - 1].amountRupees : 0;
    const nextAmt = lastAmt + 500000;
    setMilestones([
      ...milestones,
      {
        amountRupees: nextAmt,
        label: `₹${(nextAmt / 100000).toFixed(0)} Lakh`,
        defaultIncentiveRupees: 500,
      },
    ]);
  };

  const handleMove = (idx: number, dir: -1 | 1) => {
    const next = [...milestones];
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= next.length) return;
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setMilestones(next);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.put('/admin/targets', {
        milestones,
        initialTargetRupees: Number(initialTargetRupees),
        dailyCalculationMode: dailyMode,
      });
      showToast(t('Targets saved!', 'लक्ष्य सेव हो गए!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update targets'), 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('Targets', 'लक्ष्य प्रबंधन')}
      </h1>

      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Initial Target (₹)', 'शुरुआती लक्ष्य (₹)')}
            </label>
            <input
              type="number"
              min="100"
              required
              value={initialTargetRupees}
              onChange={(e) => setInitialTargetRupees(e.target.value)}
              className="w-full h-11 px-3 rounded-lg border border-slate-300 text-base font-mono font-bold"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t('Daily Calculation Mode', 'दैनिक गणना')}
            </label>
            <select
              value={dailyMode}
              onChange={(e) =>
                setDailyMode(e.target.value as 'remaining_days' | 'inclusive_today')
              }
              className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm bg-white"
            >
              <option value="remaining_days">{t('Remaining Days Until 20th', '20 तारीख तक बाकी दिन')}</option>
              <option value="inclusive_today">{t('Include Today Until 20th', 'आज सहित 20 तारीख तक')}</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold text-slate-900">
              {t('Milestones', 'लक्ष्य पड़ाव')}
            </h2>
            <button
              type="button"
              onClick={handleAddMilestone}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('Add', 'जोड़ें')}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center p-3 rounded-xl border border-slate-200 bg-slate-50/50"
              >
                <div className="sm:col-span-4">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {t('Label', 'नाम')}
                  </label>
                  <input
                    type="text"
                    required
                    value={m.label}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[idx].label = e.target.value;
                      setMilestones(next);
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm"
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {t('Amount (₹)', 'राशि (₹)')}
                  </label>
                  <input
                    type="number"
                    min="100"
                    required
                    value={m.amountRupees}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[idx].amountRupees = Number(e.target.value);
                      setMilestones(next);
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">
                    {t('Bonus (₹)', 'बोनस (₹)')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={m.defaultIncentiveRupees}
                    onChange={(e) => {
                      const next = [...milestones];
                      next[idx].defaultIncentiveRupees = Number(e.target.value);
                      setMilestones(next);
                    }}
                    className="w-full h-9 px-2.5 rounded-lg border border-slate-300 bg-white text-sm font-mono"
                  />
                </div>
                <div className="sm:col-span-2 flex items-end justify-end gap-1 pt-4">
                  <button
                    type="button"
                    onClick={() => handleMove(idx, -1)}
                    disabled={idx === 0}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(idx, 1)}
                    disabled={idx === milestones.length - 1}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={milestones.length <= 1}
                    onClick={() => setMilestones(milestones.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? t('Saving...', 'सेव हो रहा है...') : t('Save', 'सेव करें')}</span>
          </button>
        </div>
      </form>

      {/* Recent Target Achievements Log */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          {t('Recent Achievements', 'पूर्ण लक्ष्य')}
        </h2>
        {achievements.length === 0 ? (
          <p className="text-sm text-slate-500">
            {t('No achievements yet.', 'अभी कोई लक्ष्य पूरा नहीं हुआ।')}
          </p>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {achievements.map((a) => (
              <div key={a._id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">
                    {a.employeeName} ({a.employeeCode}) — {a.milestoneLabel}
                  </p>
                  <p className="text-xs text-slate-500">
                    {a.cycleKey} · {formatDateTimeIST(a.achievedAt)} ·{' '}
                    {formatINRFromPaise(a.achievedAtSalesPaise)}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold ${
                    a.incentiveGranted ? 'text-teal-700' : 'text-amber-700'
                  }`}
                >
                  {a.incentiveGranted ? t('Credited', 'बोनस मिला') : t('Pending', 'बाकी')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
