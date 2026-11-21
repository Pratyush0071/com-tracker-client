import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { ArrowRight, User, X, ExternalLink } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { formatINRFromPaise, formatINRFromRupees } from '../../utils/format.ts';

interface EmployeeQuickItem {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  isActive: boolean;
  todaySalesPaise: number;
  monthSalesPaise: number;
  cycleSalesPaise: number;
  lifetimeSalesPaise: number;
  totalCommissionPaise: number;
  totalIncentivesPaise: number;
  availableBalancePaise: number;
  targetPaise: number;
  remainingPaise: number;
  achievementPercent: number;
  entries: number;
}

interface AdminDashboardData {
  currentCycleLabel: string;
  currentCycleKey: string;
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    todaySalesPaise: number;
    todayEntriesCount: number;
    currentMonthSalesPaise: number;
    currentCycleSalesPaise: number;
    lifetimeSalesPaise: number;
    totalCommissionPaise: number;
    totalIncentivesPaise: number;
    pendingWithdrawalsPaise: number;
    pendingWithdrawalsCount: number;
    completedWithdrawalsPaise: number;
    completedWithdrawalsCount: number;
    totalOutstandingEarningsPaise: number;
  };
  charts: {
    dailySales: Array<{ date: string; salesRupees: number; entries: number }>;
    targetAchievement: Array<{
      name: string;
      fullName: string;
      achievedRupees: number;
      remainingRupees: number;
      achievementPercent: number;
    }>;
  };
  topPerformers: Array<{
    employeeId: string;
    employeeCode: string;
    fullName: string;
    cycleSalesPaise: number;
    targetPaise: number;
    achievementPercent: number;
    entries: number;
  }>;
  employeeQuickList: EmployeeQuickItem[];
  unreadNotifications: number;
}

export function AdminDashboard() {
  const { setUnreadNotifications } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get('/admin/dashboard')
      .then((res) => {
        setData(res.data);
        setUnreadNotifications(res.data.unreadNotifications || 0);
      })
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load admin dashboard')))
      .finally(() => setLoading(false));
  }, [setUnreadNotifications]);

  if (loading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-xl p-6 text-red-700">
        {error || t('Unable to load dashboard.', 'डैशबोर्ड लोड नहीं हो सका।')}
      </div>
    );
  }

  const { summary, charts, topPerformers, employeeQuickList } = data;
  const selectedEmp = employeeQuickList.find((e) => e.employeeId === selectedEmpId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('Dashboard', 'डैशबोर्ड')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('Cycle', 'चक्र')}: <span className="font-semibold text-slate-700">{data.currentCycleLabel}</span>
          </p>
        </div>
      </div>

      {/* TOP SECTION: Employee Quick-Select Buttons */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
            {t('Employees', 'कर्मचारी')} ({employeeQuickList.length})
          </h2>
          <Link
            to="/admin/employees"
            className="text-xs font-semibold text-teal-700 hover:text-teal-900 whitespace-nowrap"
          >
            {t('+ Add / Manage', '+ जोड़ें / प्रबंधन')}
          </Link>
        </div>

        {employeeQuickList.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            {t('No employees yet. Create one in Employees.', 'अभी कोई कर्मचारी नहीं है।')}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2.5">
            {employeeQuickList.map((emp) => {
              const isSelected = selectedEmpId === emp.employeeId;
              return (
                <button
                  key={emp.employeeId}
                  type="button"
                  onClick={() =>
                    setSelectedEmpId((prev) => (prev === emp.employeeId ? null : emp.employeeId))
                  }
                  className={`inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-slate-950 text-white border-slate-950 shadow-sm'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>{emp.fullName}</span>
                  <span
                    className={`text-xs font-mono ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {emp.employeeCode}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Employee Details Panel */}
        {selectedEmp && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedEmp.fullName}{' '}
                  <span className="text-sm font-mono font-normal text-slate-500">
                    · {selectedEmp.employeeCode}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedEmp.isActive ? t('Active', 'सक्रिय') : t('Inactive', 'निष्क्रिय')} ·{' '}
                  {selectedEmp.entries} {t('cycle entries', 'एंट्री')} ·{' '}
                  {t('Target Progress', 'लक्ष्य')}: {selectedEmp.achievementPercent}%
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/employees/${selectedEmp.employeeId}`}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 whitespace-nowrap"
                >
                  <span>{t('Full Details', 'पूरा विवरण')}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedEmpId(null)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">{t('Today Sales', 'आज की बिक्री')}</p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.todaySalesPaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">{t('Month Sales', 'इस माह की बिक्री')}</p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.monthSalesPaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">{t('Cycle Sales', 'चक्र बिक्री')}</p>
                <p className="text-lg font-bold font-mono tabular-nums text-teal-700 mt-1">
                  {formatINRFromPaise(selectedEmp.cycleSalesPaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-xs text-slate-500">{t('Entire Sales', 'कुल बिक्री')}</p>
                <p className="text-lg font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.lifetimeSalesPaise)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">{t('Commission', 'कमीशन')}</p>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.totalCommissionPaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">{t('Incentives', 'बोनस')}</p>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.totalIncentivesPaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">{t('Balance', 'बैलेंस')}</p>
                <p className="text-base font-bold font-mono tabular-nums text-teal-700 mt-1">
                  {formatINRFromPaise(selectedEmp.availableBalancePaise)}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                <p className="text-xs text-slate-500">{t('Active Target', 'लक्ष्य')}</p>
                <p className="text-base font-bold font-mono tabular-nums text-slate-900 mt-1">
                  {formatINRFromPaise(selectedEmp.targetPaise)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">{t('Today Sales', 'आज की बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(summary.todaySalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {summary.todayEntriesCount} {t('entries', 'एंट्री')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">{t('Cycle Sales', 'चक्र बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
            {formatINRFromPaise(summary.currentCycleSalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {t('Month', 'माह')}: {formatINRFromPaise(summary.currentMonthSalesPaise)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">{t('Entire Sales', 'कुल बिक्री')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(summary.lifetimeSalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {summary.activeEmployees} / {summary.totalEmployees} {t('active', 'सक्रिय')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500">{t('Commission', 'कुल कमीशन')}</p>
          <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(summary.totalCommissionPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Pending Payouts', 'बाकी भुगतान')}: {formatINRFromPaise(summary.pendingWithdrawalsPaise)}
          </p>
        </div>
      </div>

      {/* Target Achievement Chart & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            {t('Target Progress', 'लक्ष्य प्रगति')}
          </h2>
          <div className="h-64">
            {charts.targetAchievement.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-slate-400">
                {t('No employee data yet.', 'अभी कोई डेटा नहीं है।')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.targetAchievement}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v) => `₹${(v / 100000).toFixed(1)}L`}
                  />
                  <Tooltip formatter={(val) => formatINRFromRupees(Number(val || 0))} />
                  <Legend />
                  <Bar
                    dataKey="achievedRupees"
                    name={t('Achieved', 'पूरा')}
                    stackId="a"
                    fill="#0f766e"
                  />
                  <Bar
                    dataKey="remainingRupees"
                    name={t('Remaining', 'बाकी')}
                    stackId="a"
                    fill="#cbd5e1"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">
              {t('Top Performers', 'शीर्ष कर्मचारी')}
            </h2>
            <Link
              to="/admin/employees"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900"
            >
              <span>{t('Manage', 'प्रबंधन')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topPerformers.length === 0 ? (
            <p className="text-sm text-slate-500">{t('No employees yet.', 'कोई कर्मचारी नहीं।')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500">
                    <th className="py-2 pr-3">#</th>
                    <th className="py-2 px-3">{t('Name', 'नाम')}</th>
                    <th className="py-2 px-3 text-right">{t('Cycle Sales', 'बिक्री')}</th>
                    <th className="py-2 pl-3 text-right">{t('Goal', 'लक्ष्य')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topPerformers.map((emp, idx) => (
                    <tr key={emp.employeeId} className="hover:bg-slate-50">
                      <td className="py-2.5 pr-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <Link
                          to={`/admin/employees/${emp.employeeId}`}
                          className="font-semibold text-slate-900 hover:text-teal-700"
                        >
                          {emp.fullName}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums font-bold text-teal-700">
                        {formatINRFromPaise(emp.cycleSalesPaise)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono tabular-nums font-semibold">
                        {emp.achievementPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* LAST SECTION: Daily Sales Trend (Last 30 Days / 1 Month) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">
          {t('Daily Sales Trend (Last 1 Month)', 'दैनिक बिक्री (पिछले 1 महीने)')}
        </h2>
        <div className="h-72">
          {charts.dailySales.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-400">
              {t('No sales recorded yet.', 'अभी कोई बिक्री दर्ज नहीं है।')}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.dailySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip formatter={(val) => [formatINRFromRupees(Number(val || 0)), t('Sales', 'बिक्री')]} />
                <Area
                  type="monotone"
                  dataKey="salesRupees"
                  stroke="#0f766e"
                  fill="#ccfbf1"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
