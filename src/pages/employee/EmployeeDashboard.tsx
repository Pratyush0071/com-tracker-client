import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  PlusCircle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  IndianRupee,
  Award,
  ArrowRight,
  CalendarDays,
} from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { formatINRFromPaise, formatISTDateDisplay } from '../../utils/format.ts';
import type { SalesEntryItem, TargetAchievementItem, TargetProgressSnapshot } from '../../types/index.ts';

interface DashboardResponse {
  employee: {
    employeeCode: string;
    fullName: string;
  };
  cycle: {
    id: string;
    cycleKey: string;
    label: string;
    startDateIST: string;
    endDateIST: string;
    totalSalesPaise: number;
  };
  todaySalesPaise: number;
  todayEntriesCount: number;
  targetProgress: TargetProgressSnapshot;
  achievements: TargetAchievementItem[];
  earnings: {
    currentCycleCommissionPaise: number;
    currentCycleIncentivesPaise: number;
    totalEarningsPaise: number;
  };
  recentEntries: SalesEntryItem[];
  unreadNotifications: number;
}

export function EmployeeDashboard() {
  const { setUnreadNotifications } = useAuth();
  const { t } = useLanguage();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiClient
      .get('/employee/dashboard')
      .then((res) => {
        if (!active) return;
        setData(res.data);
        setUnreadNotifications(res.data.unreadNotifications || 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(getApiErrorMessage(err, 'Failed to load dashboard'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setUnreadNotifications]);

  if (loading) return <LoadingSkeleton rows={4} />;

  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 text-red-700">
        {error || t('Unable to load dashboard.', 'डैशबोर्ड लोड नहीं हो सका।')}
      </div>
    );
  }

  const { cycle, targetProgress, earnings, achievements, recentEntries } = data;
  const hasAchievement = achievements.length > 0;
  const progressBarColor =
    targetProgress.percentageCompleted >= 100
      ? 'bg-teal-700'
      : targetProgress.percentageCompleted >= 50
        ? 'bg-teal-600'
        : 'bg-amber-600';

  const nextUpcomingMilestone = targetProgress.milestones.find((m) => m.status === 'upcoming');

  return (
    <div className="space-y-5">
      {/* 1. TOP: Target Progress Section + Primary Add Sale CTA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {t('Target Progress', 'लक्ष्य प्रगति')} · {cycle.label}
              </p>
              <div className="flex items-baseline gap-2.5 mt-0.5">
                <h2 className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900">
                  {targetProgress.percentageCompleted}%
                </h2>
                <span className="text-sm font-semibold text-teal-700">
                  {targetProgress.activeTargetLabel}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/employee/add-entry"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 min-h-[52px] rounded-xl bg-teal-700 text-white text-base font-bold hover:bg-teal-800 active:scale-[0.99] transition-all whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-6 h-6" />
            <span>{t('Add Sale', 'बिक्री जोड़ें')}</span>
          </Link>
        </div>

        <div className="mt-4 w-full h-4 bg-slate-200 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, targetProgress.percentageCompleted)}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className={`h-full rounded-full ${progressBarColor}`}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div>
            <p className="text-xs font-medium text-slate-500">{t('Target', 'लक्ष्य')}</p>
            <p className="text-base sm:text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
              {formatINRFromPaise(targetProgress.activeTargetPaise)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t('Done', 'पूरा हुआ')}</p>
            <p className="text-base sm:text-xl font-bold font-mono tabular-nums text-teal-700 mt-1">
              {formatINRFromPaise(targetProgress.cycleSalesPaise)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">{t('Left', 'बाकी')}</p>
            <p className="text-base sm:text-xl font-bold font-mono tabular-nums text-amber-700 mt-1">
              {formatINRFromPaise(targetProgress.remainingForActiveTargetPaise)}
            </p>
          </div>
        </div>
      </div>

      {/* Achievement Celebration Banner (only when milestone hit in current cycle) */}
      {hasAchievement && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-teal-50 border border-teal-200 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-teal-950">
                {achievements[achievements.length - 1].milestoneLabel}{' '}
                {t('Completed!', 'पूरा हुआ!')}
              </h3>
              <p className="text-xs sm:text-sm text-teal-800">
                {targetProgress.allMilestonesCompleted
                  ? t('All goals completed!', 'सभी लक्ष्य पूरे!')
                  : `${t('Next Goal', 'अगला लक्ष्य')}: ${targetProgress.activeTargetLabel}`}
              </p>
            </div>
          </div>
          <Link
            to="/employee/earnings"
            className="inline-flex items-center gap-1 text-sm font-semibold text-teal-800 hover:text-teal-950 whitespace-nowrap"
          >
            <span>{t('Earnings', 'कमाई')}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      )}

      {/* 2. Daily Sales Required + Days Left + Amount to Achieve */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <TrendingUp className="w-4 h-4 text-teal-700" />
            <span>{t('Daily Sales Needed', 'रोज़ ज़रूरी बिक्री')}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {targetProgress.remainingForActiveTargetPaise > 0
              ? formatINRFromPaise(targetProgress.dailyRequiredSalesPaise)
              : '₹0'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {targetProgress.remainingForActiveTargetPaise > 0
              ? t('Per day to hit target', 'लक्ष्य पाने के लिए रोज़')
              : t('Target achieved', 'लक्ष्य पूरा हुआ')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <CalendarDays className="w-4 h-4 text-amber-700" />
            <span>{t('Days Left', 'बाकी दिन')}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {targetProgress.remainingDays}{' '}
            <span className="text-base font-sans font-semibold text-slate-600">
              {t(targetProgress.remainingDays === 1 ? 'Day' : 'Days', 'दिन')}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {t('Ends', 'समाप्त')}: {formatISTDateDisplay(cycle.endDateIST)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <Target className="w-4 h-4 text-teal-700" />
            <span>{t('Amount to Achieve', 'बाकी लक्ष्य राशि')}</span>
          </div>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-amber-700 mt-2">
            {formatINRFromPaise(targetProgress.remainingForActiveTargetPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {nextUpcomingMilestone
              ? `${t('Next Goal', 'अगला')}: ${nextUpcomingMilestone.label}`
              : `${t('Goal', 'लक्ष्य')}: ${targetProgress.activeTargetLabel}`}
          </p>
        </div>
      </div>

      {/* 3. Today's Sales + Cycle Sales + Total Earnings (No %, No previous cycle data) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {t("Today's Sales", 'आज की बिक्री')}
          </p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatINRFromPaise(data.todaySalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1 tabular-nums">
            {data.todayEntriesCount} {t('entries today', 'एंट्री आज')}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {t('Cycle Sales', 'चक्र बिक्री')}
          </p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-teal-700 mt-2">
            {formatINRFromPaise(cycle.totalSalesPaise)}
          </p>
          <p className="text-xs text-slate-500 mt-1 truncate">
            {cycle.label}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <p className="text-xs font-semibold text-slate-500">
            {t('Total Earnings', 'कुल कमाई')}
          </p>
          <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-teal-700 mt-2">
            {formatINRFromPaise(earnings.totalEarningsPaise)}
          </p>
          <Link
            to="/employee/earnings"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-900 mt-1.5"
          >
            <span>{t('View Earnings', 'कमाई देखें')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 4. Milestones + Current Cycle Earnings Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <h3 className="text-base font-bold text-slate-900 mb-3">
            {t('Target Milestones', 'लक्ष्य पड़ाव')}
          </h3>
          <div className="divide-y divide-slate-100">
            {targetProgress.milestones.map((m) => (
              <div key={m.order} className="py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {m.status === 'completed' ? (
                    <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0" />
                  ) : m.status === 'current' ? (
                    <Target className="w-5 h-5 text-amber-600 shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                      {m.label} ·{' '}
                      <span className="font-mono tabular-nums text-sm text-slate-600">
                        {formatINRFromPaise(m.amountPaise)}
                      </span>
                    </p>
                  </div>
                </div>
                <span
                  className={`text-xs font-semibold whitespace-nowrap ${
                    m.status === 'completed'
                      ? 'text-teal-700'
                      : m.status === 'current'
                        ? 'text-amber-700'
                        : 'text-slate-500'
                  }`}
                >
                  {m.status === 'completed'
                    ? t('Done', 'पूरा')
                    : m.status === 'current'
                      ? `${m.percentage}%`
                      : t('Next', 'अगला')}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-3">
              {t('Earnings Summary', 'कमाई विवरण')}
            </h3>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('Sales Commission', 'बिक्री कमीशन')}</span>
                <span className="font-bold font-mono tabular-nums text-teal-700">
                  {formatINRFromPaise(earnings.currentCycleCommissionPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-slate-600">{t('Incentives', 'बोनस')}</span>
                <span className="font-bold font-mono tabular-nums text-slate-900">
                  {formatINRFromPaise(earnings.currentCycleIncentivesPaise)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-slate-900">{t('Total Earnings', 'कुल कमाई')}</span>
                <span className="text-lg font-bold font-mono tabular-nums text-teal-700">
                  {formatINRFromPaise(earnings.totalEarningsPaise)}
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/employee/earnings"
            className="mt-5 w-full flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-xl bg-slate-950 text-white text-sm font-bold hover:bg-slate-800 whitespace-nowrap"
          >
            <IndianRupee className="w-4 h-4" />
            <span>{t('Open Earnings', 'कमाई खोलें')}</span>
          </Link>
        </div>
      </div>

      {/* 5. Recent Entries (Current Cycle Only) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">
            {t('Recent Entries', 'हाल की बिक्री')}
          </h3>
          <Link
            to="/employee/entries"
            className="text-sm font-semibold text-teal-700 hover:text-teal-900 whitespace-nowrap"
          >
            {t('View All', 'सभी देखें')}
          </Link>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-sm text-slate-500 py-3">
            {t('No sales in this cycle yet.', 'इस चक्र में अभी कोई बिक्री नहीं है।')}
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentEntries.map((entry) => (
              <div key={entry._id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {entry.productName || entry.orderName || t('Sale', 'बिक्री')}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {formatISTDateDisplay(entry.entryDateIST)} · {entry.entryTimeIST}
                    {entry.orderName && entry.productName ? ` · ${entry.orderName}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-base font-bold font-mono tabular-nums text-slate-900">
                    {formatINRFromPaise(entry.amountPaise)}
                  </p>
                  <StatusLabel status={entry.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
