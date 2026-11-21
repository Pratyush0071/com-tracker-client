import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, IndianRupee, ArrowLeft } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { formatINRFromRupees } from '../../utils/format.ts';

function generateClientRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function AddEntryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [amount, setAmount] = useState('');
  const [orderName, setOrderName] = useState('');
  const [productName, setProductName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [clientRequestId] = useState(generateClientRequestId);

  const numericAmount = useMemo(() => {
    const val = Number(amount);
    return Number.isFinite(val) && val > 0 ? val : 0;
  }, [amount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMsg('');

    if (!numericAmount || numericAmount <= 0) {
      setErrorMsg(t('Enter sale amount.', 'कृपया बिक्री राशि दर्ज करें।'));
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiClient.post('/employee/sales', {
        orderName: orderName.trim(),
        productName: productName.trim(),
        amount: numericAmount,
        clientRequestId,
      });

      const milestones = res.data.newlyCompletedMilestones || [];
      if (milestones.length > 0) {
        showToast(
          `${milestones[milestones.length - 1].label} ${t('Target Completed!', 'लक्ष्य पूरा!')}`,
          'success'
        );
      } else {
        showToast(t('Sale saved!', 'बिक्री सेव हो गई!'), 'success');
      }

      navigate('/employee/entries', { replace: true });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, t('Failed to save sale.', 'बिक्री सेव नहीं हो सकी।')));
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/employee/dashboard')}
          className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('New Sale Entry', 'नई बिक्री एंट्री')}
          </h2>
          <p className="text-xs text-slate-500">
            {t(
              'Date and time are recorded automatically.',
              'तारीख और समय अपने आप दर्ज होगा।'
            )}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
            {errorMsg}
          </div>
        )}

        {/* TOP: Prominent Amount Card without suggestion chips */}
        <div className="bg-teal-700 rounded-2xl p-5 sm:p-6 text-white">
          <div className="flex items-center justify-between gap-2 mb-2">
            <label
              htmlFor="sale-amount"
              className="block text-sm font-semibold text-teal-100"
            >
              {t('Sale Amount (₹)', 'बिक्री राशि (₹)')} *
            </label>
            {numericAmount > 0 && (
              <span className="text-sm font-mono font-bold text-teal-50 tabular-nums">
                {formatINRFromRupees(numericAmount)}
              </span>
            )}
          </div>
          <div className="relative">
            <IndianRupee className="w-7 h-7 text-teal-700 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              id="sale-amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="1"
              required
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full h-16 pl-13 pr-4 rounded-xl bg-white text-3xl font-bold font-mono tabular-nums text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
            />
          </div>
        </div>

        {/* Short Optional Fields */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div>
            <label
              htmlFor="order-name"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              {t('Client / Order Location', 'पार्टी / ऑर्डर स्थान')}
            </label>
            <input
              id="order-name"
              type="text"
              value={orderName}
              onChange={(e) => setOrderName(e.target.value)}
              placeholder={t('e.g. Sharma Traders, Jaipur', 'जैसे: शर्मा ट्रेडर्स, जयपुर')}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <div>
            <label
              htmlFor="product-name"
              className="block text-sm font-semibold text-slate-800 mb-1.5"
            >
              {t('Product / Item', 'सामान / उत्पाद')}
            </label>
            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder={t('e.g. Steel Pipes Bundle', 'जैसे: स्टील पाइप बंडल')}
              className="w-full h-12 px-4 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-14 rounded-xl bg-teal-700 text-white text-lg font-bold hover:bg-teal-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2.5"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span>
              {submitting
                ? t('Submitting...', 'सेव हो रहा है...')
                : t('Submit Sale Entry', 'बिक्री एंट्री सेव करें')}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
