import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, CalendarRange, CheckCircle2 } from 'lucide-react';
import { apiClient, downloadExcelFile, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { Modal } from '../../components/common/ConfirmModal.tsx';
import {
  formatDateTimeIST,
  formatINRFromPaise,
  formatISTDateDisplay,
} from '../../utils/format.ts';
import type {
  SalesEntryItem,
  TargetAchievementItem,
  TargetProgressSnapshot,
  WithdrawalItem,
} from '../../types/index.ts';

interface EmployeeDetailResponse {
  employee: {
    userId: string;
    employeeCode: string;
    fullName: string;
    email: string;
    mobile: string;
    joiningDate: string;
    targetCycleDay?: number;
    isActive: boolean;
    totalCommissionPaise: number;
    totalIncentivesPaise: number;
    totalWithdrawnPaise: number;
    availableBalancePaise: number;
  };
  metrics: {
    todaySalesPaise: number;
    monthlySalesPaise: number;
    currentCycleSalesPaise: number;
    lifetimeSalesPaise: number;
    filteredSalesPaise: number;
    filteredEntriesCount: number;
  };
  currentCycle: {
    label: string;
    cycleKey: string;
    startDateIST: string;
    endDateIST: string;
    initialTargetPaise: number;
  };
  targetProgress: TargetProgressSnapshot;
  salesHistory: SalesEntryItem[];
  commissionHistory: Array<{
    _id: string;
    type: string;
    amountPaise: number;
    description: string;
    createdAt: string;
  }>;
  incentiveHistory: Array<{
    _id: string;
    category: string;
    amountPaise: number;
    reason: string;
    authorizedByAdminName: string;
    createdAt: string;
  }>;
  withdrawalHistory: WithdrawalItem[];
  achievements: TargetAchievementItem[];
}

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [data, setData] = useState<EmployeeDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState('lifetime');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState<
    'sales' | 'commissions' | 'incentives' | 'withdrawals' | 'achievements'
  >('sales');

  // Target cycle edit modal
  const [cycleModalOpen, setCycleModalOpen] = useState(false);
  const [editCycleDay, setEditCycleDay] = useState('20');
  const [editCycleStart, setEditCycleStart] = useState('');
  const [editCycleEnd, setEditCycleEnd] = useState('');
  const [editTargetRupees, setEditTargetRupees] = useState('');
  const [savingCycle, setSavingCycle] = useState(false);

  const presets = [
    { id: 'today', label: t('Today', 'आज') },
    { id: 'yesterday', label: t('Yesterday', 'कल') },
    { id: 'this_week', label: t('This Week', 'इस सप्ताह') },
    { id: 'this_month', label: t('This Month', 'इस माह') },
    { id: 'previous_month', label: t('Last Month', 'पिछले माह') },
    { id: 'lifetime', label: t('Entire', 'कुल') },
    { id: 'custom', label: t('Custom', 'कस्टम') },
  ];

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/admin/employees/${id}/details`, {
        params: {
          preset,
          startDate: preset === 'custom' ? startDate || undefined : undefined,
          endDate: preset === 'custom' ? endDate || undefined : undefined,
        },
      });
      setData(res.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load employee details'), 'error');
    } finally {
      setLoading(false);
    }
  }, [id, preset, startDate, endDate, showToast]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleOpenCycleModal = () => {
    if (!data) return;
    setEditCycleDay(String(data.employee.targetCycleDay || 20));
    setEditCycleStart(data.currentCycle.startDateIST);
    setEditCycleEnd(data.currentCycle.endDateIST);
    setEditTargetRupees(String(Math.round((data.currentCycle.initialTargetPaise || 50000000) / 100)));
    setCycleModalOpen(true);
  };

  const handleSaveCycle = async (completeCurrentCycle: boolean) => {
    if (!id) return;
    setSavingCycle(true);
    try {
      await apiClient.put(`/admin/employees/${id}/target-cycle`, {
        targetCycleDay: Number(editCycleDay) || undefined,
        startDateIST: editCycleStart || undefined,
        endDateIST: editCycleEnd || undefined,
        targetAmountRupees: Number(editTargetRupees) || undefined,
        completeCurrentCycle,
      });
      showToast(
        completeCurrentCycle
          ? t('Current cycle completed & new cycle started!', 'चक्र पूरा हुआ और नया चक्र शुरू हो गया!')
          : t('Target cycle updated!', 'लक्ष्य चक्र अपडेट हो गया!'),
        'success'
      );
      setCycleModalOpen(false);
      fetchDetail();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update target cycle'), 'error');
    } finally {
      setSavingCycle(false);
    }
  };

  const handleExport = async () => {
    if (!id || !data) return;
    try {
      await downloadExcelFile(
        `/admin/employees/${id}/export`,
        `${data.employee.employeeCode}-report.xlsx`,
        {
          preset,
          ...(preset === 'custom' && startDate ? { startDate } : {}),
          ...(preset === 'custom' && endDate ? { endDate } : {}),
        }
      );
      showToast(t('Excel downloaded!', 'एक्सेल डाउनलोड हो गया!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to export report'), 'error');
    }
  };

  if (loading && !data) return <LoadingSkeleton rows={6} />;
  if (!data) return null;

  const { employee, metrics, targetProgress } = data;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/employees')}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{employee.fullName}</h1>
              <StatusLabel status={employee.isActive ? 'active' : 'inactive'} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {employee.employeeCode} · {formatISTDateDisplay(employee.joiningDate)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleOpenCycleModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-xl border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 whitespace-nowrap"
          >
            <CalendarRange className="w-4 h-4 text-teal-700" />
            <span>{t('Edit Target Cycle', 'लक्ष्य चक्र बदलें')}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[40px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{t('Export Excel', 'एक्सेल डाउनलोड')}</span>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t('Today Sales', 'आज की बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(metrics.todaySalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Month', 'माह')}: {formatINRFromPaise(metrics.monthlySalesPaise)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t('Cycle Sales', 'चक्र बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
            {formatINRFromPaise(metrics.currentCycleSalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">{data.currentCycle.label}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t('Entire Sales', 'कुल बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(metrics.lifetimeSalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Commission', 'कमीशन')}: {formatINRFromPaise(employee.totalCommissionPaise)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500">{t('Balance', 'बैलेंस')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
            {formatINRFromPaise(employee.availableBalancePaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Bonus', 'बोनस')}: {formatINRFromPaise(employee.totalIncentivesPaise)}
          </p>
        </div>
      </div>

      {/* Current Target Progress */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-bold text-slate-900">
            {t('Target', 'लक्ष्य')} ({targetProgress.activeTargetLabel})
          </h2>
          <span className="font-mono font-bold text-teal-700">
            {targetProgress.percentageCompleted}% · {formatINRFromPaise(targetProgress.dailyRequiredSalesPaise)}/{t('day', 'दिन')} ({targetProgress.remainingDays}d)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-700 rounded-full"
            style={{ width: `${Math.min(100, targetProgress.percentageCompleted)}%` }}
          />
        </div>
      </div>

      {/* Date Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                preset === p.id
                  ? 'bg-slate-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {preset === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
            />
            <span className="text-slate-400 text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
            />
          </div>
        )}
        <p className="text-xs text-slate-500">
          {t('Filtered Total', 'कुल')}:{' '}
          <strong className="font-mono text-slate-900">
            {formatINRFromPaise(metrics.filteredSalesPaise)}
          </strong>{' '}
          ({metrics.filteredEntriesCount})
        </p>
      </div>

      {/* Detail History Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 pt-3 border-b border-slate-200 flex flex-wrap gap-2">
          {[
            { id: 'sales', label: `${t('Sales', 'बिक्री')} (${data.salesHistory.length})` },
            { id: 'commissions', label: `${t('Commissions', 'कमीशन')} (${data.commissionHistory.length})` },
            { id: 'incentives', label: `${t('Incentives', 'बोनस')} (${data.incentiveHistory.length})` },
            { id: 'withdrawals', label: `${t('Withdrawals', 'निकासी')} (${data.withdrawalHistory.length})` },
            { id: 'achievements', label: `${t('Goals', 'लक्ष्य')} (${data.achievements.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-x-auto">
          {activeTab === 'sales' && (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">{t('Date & Time', 'तारीख / समय')}</th>
                  <th className="py-2 px-4">{t('Order / Place', 'ऑर्डर / जगह')}</th>
                  <th className="py-2 px-4">{t('Product', 'सामान')}</th>
                  <th className="py-2 px-4 text-right">{t('Amount', 'राशि')}</th>
                  <th className="py-2 px-4 text-right">{t('Commission', 'कमीशन')}</th>
                  <th className="py-2 pl-4">{t('Status', 'स्थिति')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      {t('No entries.', 'कोई एंट्री नहीं।')}
                    </td>
                  </tr>
                ) : (
                  data.salesHistory.map((s) => (
                    <tr key={s._id}>
                      <td className="py-2.5 pr-4 font-mono text-xs">
                        {formatISTDateDisplay(s.entryDateIST)} · {s.entryTimeIST}
                      </td>
                      <td className="py-2.5 px-4">{s.orderName || '-'}</td>
                      <td className="py-2.5 px-4">{s.productName || '-'}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        {formatINRFromPaise(s.amountPaise)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums text-teal-700">
                        {formatINRFromPaise(s.commissionPaise)}
                      </td>
                      <td className="py-2.5 pl-4">
                        <StatusLabel status={s.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'commissions' && (
            <div className="divide-y divide-slate-100 text-sm">
              {data.commissionHistory.length === 0 ? (
                <p className="py-6 text-center text-slate-400">{t('No records.', 'कोई रिकॉर्ड नहीं।')}</p>
              ) : (
                data.commissionHistory.map((c) => (
                  <div key={c._id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{c.description}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTimeIST(c.createdAt)} · {c.type}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-teal-700">
                      {formatINRFromPaise(c.amountPaise)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'incentives' && (
            <div className="divide-y divide-slate-100 text-sm">
              {data.incentiveHistory.length === 0 ? (
                <p className="py-6 text-center text-slate-400">{t('No incentives.', 'कोई बोनस नहीं।')}</p>
              ) : (
                data.incentiveHistory.map((inc) => (
                  <div key={inc._id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900">{inc.reason}</p>
                      <p className="text-xs text-slate-500">
                        {formatDateTimeIST(inc.createdAt)} · {inc.authorizedByAdminName}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-teal-700">
                      +{formatINRFromPaise(inc.amountPaise)}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="divide-y divide-slate-100 text-sm">
              {data.withdrawalHistory.length === 0 ? (
                <p className="py-6 text-center text-slate-400">{t('No withdrawals.', 'कोई निकासी नहीं।')}</p>
              ) : (
                data.withdrawalHistory.map((w) => (
                  <div key={w._id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold">
                          {formatINRFromPaise(w.amountPaise)}
                        </span>
                        <StatusLabel status={w.status} />
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatISTDateDisplay(w.requestDateIST)}
                        {w.paymentReference ? ` · ${w.paymentReference}` : ''}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="divide-y divide-slate-100 text-sm">
              {data.achievements.length === 0 ? (
                <p className="py-6 text-center text-slate-400">{t('No goals achieved yet.', 'अभी कोई लक्ष्य पूरा नहीं हुआ।')}</p>
              ) : (
                data.achievements.map((a) => (
                  <div key={a._id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {a.milestoneLabel} ({formatINRFromPaise(a.milestoneAmountPaise)})
                      </p>
                      <p className="text-xs text-slate-500">
                        {a.cycleKey} · {formatDateTimeIST(a.achievedAt)}
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
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Target Cycle Modal */}
      <Modal
        open={cycleModalOpen}
        title={`${t('Target Cycle', 'लक्ष्य चक्र')} — ${employee.fullName}`}
        onClose={() => setCycleModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400">{t('Active Cycle', 'वर्तमान चक्र')}:</span>{' '}
            <strong className="text-white">{data.currentCycle.label}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Monthly Reset Day (1–28)', 'मासिक रीसेट दिन (1–28)')}
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={editCycleDay}
                onChange={(e) => setEditCycleDay(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Initial Target (₹)', 'प्रारंभिक लक्ष्य (₹)')}
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={editTargetRupees}
                onChange={(e) => setEditTargetRupees(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Cycle Start Date', 'चक्र शुरू तारीख')}
              </label>
              <input
                type="date"
                value={editCycleStart}
                onChange={(e) => setEditCycleStart(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Cycle End Date', 'चक्र अंतिम तारीख')}
              </label>
              <input
                type="date"
                value={editCycleEnd}
                onChange={(e) => setEditCycleEnd(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-800 text-xs text-amber-200">
            {t(
              'When a cycle is completed, all previous cycle sales, earnings, and alerts are hidden from the employee while remaining saved in Admin reports.',
              'चक्र पूरा होने पर पिछला डेटा कर्मचारी को दिखना बंद हो जाता है, लेकिन एडमिन रिपोर्ट में सुरक्षित रहता है।'
            )}
          </div>

          <div className="flex flex-wrap justify-between gap-2 pt-2">
            <button
              type="button"
              disabled={savingCycle}
              onClick={() => handleSaveCycle(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('Complete Cycle & Start New', 'चक्र पूरा करें और नया शुरू करें')}</span>
            </button>

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setCycleModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                {t('Cancel', 'रद्द')}
              </button>
              <button
                type="button"
                disabled={savingCycle}
                onClick={() => handleSaveCycle(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50"
              >
                {savingCycle ? t('Saving...', 'सेव हो रहा है...') : t('Save Cycle', 'सेव करें')}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
