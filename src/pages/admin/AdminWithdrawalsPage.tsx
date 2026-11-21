import React, { useCallback, useEffect, useState } from 'react';
import { Award, CheckCircle2, Ban, Banknote } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { Modal } from '../../components/common/ConfirmModal.tsx';
import { formatINRFromPaise, formatISTDateDisplay } from '../../utils/format.ts';
import type { TargetAchievementItem, WithdrawalItem } from '../../types/index.ts';

interface SummaryRow {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  upiId: string;
  cycleLabel?: string;
  monthlyCycleSalesPaise: number;
  commissionEarnedPaise: number;
  cycleCommissionPaise: number;
  targetIncentivePaise: number;
  otherIncentivePaise: number;
  totalEarningsPaise: number;
  previouslyWithdrawnPaise: number;
  approvedUnpaidPaise: number;
  pendingWithdrawalPaise: number;
  availableBalancePaise: number;
  isPaid: boolean;
  withdrawalStatus: string;
  completedTargetsCount: number;
  latestAchievement: TargetAchievementItem | null;
  unrewardedAchievements: TargetAchievementItem[];
}

interface WithdrawalsAdminResponse {
  selectedCycleKey: string;
  currentCycleLabel: string;
  defaultTargetIncentivePaise: number;
  availableCycles: string[];
  summaryRows: SummaryRow[];
  requests: WithdrawalItem[];
  employees: Array<{ id: string; employeeCode: string; fullName: string }>;
}

export function AdminWithdrawalsPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [data, setData] = useState<WithdrawalsAdminResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [cycleKey, setCycleKey] = useState('active');
  const [employeeId, setEmployeeId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Direct Approve Pay Modal (just to mark & see employee pay as Paid)
  const [approvePayRow, setApprovePayRow] = useState<SummaryRow | null>(null);
  const [approvePayNote, setApprovePayNote] = useState('');

  const [rejectTarget, setRejectTarget] = useState<WithdrawalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [payTarget, setPayTarget] = useState<WithdrawalItem | null>(null);
  const [payMethod, setPayMethod] = useState('UPI / Bank');
  const [payReference, setPayReference] = useState('');
  const [payNotes, setPayNotes] = useState('');

  const [incentiveRow, setIncentiveRow] = useState<SummaryRow | null>(null);
  const [incAchievementId, setIncAchievementId] = useState('');
  const [incCategory, setIncCategory] = useState<'target_completion' | 'other'>('target_completion');
  const [incAmount, setIncAmount] = useState('500');
  const [incReason, setIncReason] = useState('');
  const [incAllowDup, setIncAllowDup] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/withdrawals', {
        params: {
          cycleKey: cycleKey || 'active',
          employeeId,
          status: statusFilter,
        },
      });
      setData(res.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load withdrawal data'), 'error');
    } finally {
      setLoading(false);
    }
  }, [cycleKey, employeeId, statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleConfirmDirectPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvePayRow) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/employees/${approvePayRow.employeeId}/mark-paid`, {
        note: approvePayNote.trim() || undefined,
      });
      showToast(t('Payment approved & marked Paid!', 'भुगतान मंजूर और दर्ज हो गया!'), 'success');
      setApprovePayRow(null);
      setApprovePayNote('');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to mark payout as paid'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (w: WithdrawalItem) => {
    try {
      await apiClient.post(`/admin/withdrawals/${w._id}/approve`);
      showToast(t('Approved!', 'मंजूर हो गया!'), 'success');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Approval failed'), 'error');
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectTarget) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/withdrawals/${rejectTarget._id}/reject`, {
        reason: rejectReason,
      });
      showToast(t('Rejected.', 'अस्वीकृत।'), 'info');
      setRejectTarget(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Rejection failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkPaid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/withdrawals/${payTarget._id}/pay`, {
        paymentMethod: payMethod,
        paymentReference: payReference,
        paymentNotes: payNotes,
      });
      showToast(t('Marked as Paid!', 'भुगतान दर्ज हो गया!'), 'success');
      setPayTarget(null);
      setPayReference('');
      setPayNotes('');
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Payment confirmation failed'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openIncentiveModal = (row: SummaryRow) => {
    const defaultRupees = data ? String(data.defaultTargetIncentivePaise / 100) : '500';
    const unrewarded = row.unrewardedAchievements[0];
    setIncentiveRow(row);
    setIncAmount(defaultRupees);
    setIncAllowDup(false);

    if (unrewarded) {
      setIncCategory('target_completion');
      setIncAchievementId(unrewarded._id);
      setIncReason(`Target Incentive — ${unrewarded.milestoneLabel} (${unrewarded.cycleKey})`);
    } else if (row.latestAchievement) {
      setIncCategory('target_completion');
      setIncAchievementId(row.latestAchievement._id);
      setIncReason(`Target Incentive — ${row.latestAchievement.milestoneLabel}`);
    } else {
      setIncCategory('other');
      setIncAchievementId('');
      setIncReason('Bonus Incentive');
    }
  };

  const handleGrantIncentive = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incentiveRow) return;
    setSubmitting(true);
    try {
      await apiClient.post('/admin/incentives', {
        employeeId: incentiveRow.employeeId,
        category: incCategory,
        amount: Number(incAmount),
        reason: incReason,
        achievementId: incAchievementId || undefined,
        allowDuplicateOverride: incAllowDup,
      });
      showToast(t('Incentive added!', 'बोनस जोड़ा गया!'), 'success');
      setIncentiveRow(null);
      loadData();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to add incentive'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) return <LoadingSkeleton rows={6} />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('Withdrawals & Payouts', 'निकासी और भुगतान')}
      </h1>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('Cycle', 'चक्र')}
          </label>
          <select
            value={cycleKey}
            onChange={(e) => setCycleKey(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="active">{t('Active Employee Cycles', 'वर्तमान सक्रिय चक्र')}</option>
            {data.availableCycles.map((c) => (
              <option key={c} value={c}>
                {c.replace('_to_', ' → ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('Employee', 'कर्मचारी')}
          </label>
          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="all">{t('All Employees', 'सभी कर्मचारी')}</option>
            {data.employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.fullName} ({e.employeeCode})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            {t('Status', 'स्थिति')}
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
          >
            <option value="all">{t('All', 'सभी')}</option>
            <option value="pending">{t('Pending', 'लंबित')}</option>
            <option value="approved">{t('Approved', 'मंजूर')}</option>
            <option value="paid">{t('Paid', 'भुगतान हुआ')}</option>
            <option value="rejected">{t('Rejected', 'अस्वीकृत')}</option>
          </select>
        </div>
      </div>

      {/* Employee-wise Payout Summary */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t('Payout Summary', 'भुगतान सारांश')} (
            {cycleKey === 'active' ? t('Active Cycles', 'सक्रिय चक्र') : cycleKey.replace('_to_', ' – ')})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap">
                <th className="py-3 px-3">{t('Employee', 'कर्मचारी')}</th>
                <th className="py-3 px-3 text-right">{t('Cycle Sales', 'बिक्री')}</th>
                <th className="py-3 px-3 text-right">{t('Commission', 'कमीशन')}</th>
                <th className="py-3 px-3 text-right">{t('Incentives', 'बोनस')}</th>
                <th className="py-3 px-3 text-right">{t('Paid', 'भुगतान')}</th>
                <th className="py-3 px-3 text-right">{t('Balance', 'बैलेंस')}</th>
                <th className="py-3 px-3">{t('Pay Status', 'स्थिति')}</th>
                <th className="py-3 px-3 text-right">{t('Action', 'कार्य')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.summaryRows.map((row) => (
                <tr key={row.employeeId} className="hover:bg-slate-50 whitespace-nowrap">
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-900">{row.fullName}</span>
                    <span className="text-xs font-mono text-slate-500 ml-1.5">
                      {row.employeeCode}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {formatINRFromPaise(row.monthlyCycleSalesPaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {formatINRFromPaise(row.commissionEarnedPaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    {formatINRFromPaise(row.targetIncentivePaise + row.otherIncentivePaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700">
                    {formatINRFromPaise(row.previouslyWithdrawnPaise)}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                    {formatINRFromPaise(row.availableBalancePaise)}
                  </td>
                  <td className="py-3 px-3">
                    {row.isPaid ? (
                      <StatusLabel status="paid" />
                    ) : row.availableBalancePaise > 0 ? (
                      <StatusLabel status="pending" />
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {row.availableBalancePaise > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setApprovePayRow(row);
                            setApprovePayNote('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 text-white text-xs font-semibold hover:bg-slate-800"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{t('Approve Pay', 'भुगतान मंजूर करें')}</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openIncentiveModal(row)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                          row.unrewardedAchievements.length > 0
                            ? 'bg-teal-700 text-white hover:bg-teal-800'
                            : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{t('Add Bonus', 'बोनस जोड़ें')}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout & Withdrawal History */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200">
          <h2 className="text-base font-bold text-slate-900">
            {t('Payout History', 'भुगतान रिकॉर्ड')} ({data.requests.length})
          </h2>
        </div>
        {data.requests.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {t('No payout records found.', 'कोई भुगतान रिकॉर्ड नहीं मिला।')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap">
                  <th className="py-3 px-4">{t('Date', 'तारीख')}</th>
                  <th className="py-3 px-4">{t('Employee', 'कर्मचारी')}</th>
                  <th className="py-3 px-4 text-right">{t('Amount', 'राशि')}</th>
                  <th className="py-3 px-4">{t('Status', 'स्थिति')}</th>
                  <th className="py-3 px-4">{t('Info', 'विवरण')}</th>
                  <th className="py-3 px-4 text-right">{t('Action', 'कार्य')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.requests.map((w) => (
                  <tr key={w._id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                      {formatISTDateDisplay(w.requestDateIST)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{w.employeeName}</span>{' '}
                      <span className="text-xs font-mono text-slate-500">{w.employeeCode}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                      {formatINRFromPaise(w.amountPaise)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusLabel status={w.status} />
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      {w.employeeNote && <p>{w.employeeNote}</p>}
                      {w.status === 'rejected' && w.rejectionReason && (
                        <p className="text-red-600">{w.rejectionReason}</p>
                      )}
                      {w.status === 'paid' && (
                        <p className="text-teal-700">
                          {w.paymentMethod} {w.paymentReference ? `· ${w.paymentReference}` : ''}
                          {w.paymentNotes ? ` · ${w.paymentNotes}` : ''}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {w.status === 'pending' && (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(w)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('Approve', 'मंजूर')}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectTarget(w);
                              setRejectReason('');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>{t('Reject', 'अस्वीकार')}</span>
                          </button>
                        </div>
                      )}
                      {w.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => {
                            setPayTarget(w);
                            setPayReference('');
                            setPayNotes('');
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          <span>{t('Mark Paid', 'भुगतान करें')}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve Pay Modal (Simple confirmation just to mark & record data as Paid) */}
      <Modal
        open={Boolean(approvePayRow)}
        title={`${t('Approve Pay', 'भुगतान मंजूर करें')} — ${approvePayRow?.fullName || ''}`}
        onClose={() => setApprovePayRow(null)}
      >
        <form onSubmit={handleConfirmDirectPay} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              {t('Unpaid Balance', 'बाकी भुगतान')}
            </span>
            <span className="text-2xl font-bold font-mono tabular-nums text-teal-400">
              {approvePayRow ? formatINRFromPaise(approvePayRow.availableBalancePaise) : ''}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Note (Optional)', 'नोट (वैकल्पिक)')}
            </label>
            <input
              type="text"
              value={approvePayNote}
              onChange={(e) => setApprovePayNote(e.target.value)}
              placeholder={t('e.g. Paid via Cash / UPI', 'जैसे: नकद / UPI से भुगतान')}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setApprovePayRow(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Mark as Paid', 'भुगतान दर्ज करें')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Modal */}
      <Modal
        open={Boolean(rejectTarget)}
        title={`${t('Reject', 'अस्वीकार')} — ${rejectTarget?.employeeName || ''}`}
        onClose={() => setRejectTarget(null)}
      >
        <form onSubmit={handleReject} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Reason', 'कारण')} *
            </label>
            <input
              type="text"
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectTarget(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Reject', 'अस्वीकार')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Mark Paid Modal */}
      <Modal
        open={Boolean(payTarget)}
        title={`${t('Confirm Payment', 'भुगतान पुष्टि')} — ${payTarget?.employeeName || ''}`}
        onClose={() => setPayTarget(null)}
      >
        <form onSubmit={handleMarkPaid} className="space-y-4">
          <p className="text-sm text-slate-300">
            <strong className="font-mono text-teal-400">
              {payTarget ? formatINRFromPaise(payTarget.amountPaise) : ''}
            </strong>
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Method', 'माध्यम')} *
            </label>
            <input
              type="text"
              required
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Reference / UTR', 'रेफ़रेंस / UTR')}
            </label>
            <input
              type="text"
              value={payReference}
              onChange={(e) => setPayReference(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Notes', 'नोट')}
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPayTarget(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Mark Paid', 'भुगतान करें')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Incentive Modal */}
      <Modal
        open={Boolean(incentiveRow)}
        title={`${t('Add Bonus', 'बोनस जोड़ें')} — ${incentiveRow?.fullName || ''}`}
        onClose={() => setIncentiveRow(null)}
      >
        <form onSubmit={handleGrantIncentive} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Category', 'प्रकार')}
            </label>
            <select
              value={incCategory}
              onChange={(e) => setIncCategory(e.target.value as 'target_completion' | 'other')}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            >
              <option value="target_completion">{t('Target Bonus', 'लक्ष्य बोनस')}</option>
              <option value="other">{t('Other Bonus', 'अन्य बोनस')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Amount (₹)', 'राशि (₹)')} *
            </label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={incAmount}
              onChange={(e) => setIncAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-base font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Reason', 'कारण')} *
            </label>
            <input
              type="text"
              required
              value={incReason}
              onChange={(e) => setIncReason(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>

          {incAchievementId &&
            incentiveRow &&
            incentiveRow.unrewardedAchievements.every((a) => a._id !== incAchievementId) && (
              <label className="flex items-start gap-2 text-xs text-amber-200 bg-amber-950/60 p-3 rounded-lg border border-amber-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={incAllowDup}
                  onChange={(e) => setIncAllowDup(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {t(
                    'Bonus already added for this goal. Allow extra bonus?',
                    'इस लक्ष्य का बोनस पहले दिया जा चुका है। अतिरिक्त बोनस जोड़ें?'
                  )}
                </span>
              </label>
            )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIncentiveRow(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Add Bonus', 'बोनस जोड़ें')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
