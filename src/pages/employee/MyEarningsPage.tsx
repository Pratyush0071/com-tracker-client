import { useEffect, useState } from 'react';
import { IndianRupee, Award, Wallet } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { formatINRFromPaise } from '../../utils/format.ts';

interface EarningsResponse {
  cycleLabel: string;
  summary: {
    salesCommissionPaise: number;
    targetIncentivesPaise: number;
    otherIncentivesPaise: number;
    totalIncentivesPaise: number;
    totalEarningsPaise: number;
  };
}

export function MyEarningsPage() {
  const { t } = useLanguage();
  const [data, setData] = useState<EarningsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiClient
      .get('/employee/earnings')
      .then((res) => setData(res.data))
      .catch((err) => setError(getApiErrorMessage(err, 'Failed to load earnings')))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;
  if (error || !data) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-6 text-red-700">
        {error || t('Unable to load earnings.', 'कमाई लोड नहीं हो सकी।')}
      </div>
    );
  }

  const { summary, cycleLabel } = data;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">
          {t('My Earnings', 'मेरी कमाई')}
        </h2>
        <p className="text-sm text-slate-500 mt-0.5">
          {t('Current Cycle', 'वर्तमान चक्र')}: {cycleLabel}
        </p>
      </div>

      {/* Hero Total Earnings Card (No ledger, no %) */}
      <div className="bg-teal-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">
            {t('Total Earnings This Cycle', 'इस चक्र की कुल कमाई')}
          </p>
          <p className="text-3xl sm:text-4xl font-bold font-mono tabular-nums mt-2">
            {formatINRFromPaise(summary.totalEarningsPaise)}
          </p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-teal-950 border border-teal-700 flex items-center justify-center shrink-0">
          <Wallet className="w-7 h-7 text-teal-200" />
        </div>
      </div>

      {/* Summary Cards Only — No Ledger & No Percentages */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('Sales Commission', 'बिक्री कमीशन')}</span>
            <IndianRupee className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatINRFromPaise(summary.salesCommissionPaise)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('Target Bonus', 'लक्ष्य बोनस')}</span>
            <Award className="w-4 h-4 text-teal-700" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatINRFromPaise(summary.targetIncentivesPaise)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>{t('Other Incentives', 'अन्य बोनस')}</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-2">
            {formatINRFromPaise(summary.otherIncentivesPaise)}
          </p>
        </div>
      </div>
    </div>
  );
}
