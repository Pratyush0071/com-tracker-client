import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Download,
  Printer,
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  ListOrdered,
} from 'lucide-react';
import { apiClient, downloadExcelFile, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { Modal } from '../../components/common/ConfirmModal.tsx';
import { formatINRFromPaise, formatISTDateDisplay } from '../../utils/format.ts';
import type { SalesEntryItem } from '../../types/index.ts';

export function MyEntriesPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<SalesEntryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [todaySalesPaise, setTodaySalesPaise] = useState(0);
  const [filteredTotalPaise, setFilteredTotalPaise] = useState(0);
  const [cycleLabel, setCycleLabel] = useState('');
  const [permissions, setPermissions] = useState({ allowEdit: false, allowDelete: false });

  const [editingEntry, setEditingEntry] = useState<SalesEntryItem | null>(null);
  const [editOrderName, setEditOrderName] = useState('');
  const [editProductName, setEditProductName] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/employee/sales', {
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          search: search.trim() || undefined,
          page,
          limit: 15,
        },
      });
      setCycleLabel(res.data.cycleLabel || '');
      setEntries(res.data.entries);
      setTotalPages(res.data.pagination.totalPages);
      setTotalItems(res.data.pagination.total);
      setTodaySalesPaise(res.data.todaySalesPaise);
      setFilteredTotalPaise(res.data.filteredTotalPaise);
      setPermissions(res.data.permissions);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to fetch entries'), 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, search, page, showToast]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleExportExcel = async () => {
    try {
      await downloadExcelFile('/employee/sales/export', 'my-sales-entries.xlsx', {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      showToast(t('Excel downloaded!', 'एक्सेल डाउनलोड हो गया!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to export Excel'), 'error');
    }
  };

  const handleOpenEdit = (entry: SalesEntryItem) => {
    setEditingEntry(entry);
    setEditOrderName(entry.orderName);
    setEditProductName(entry.productName);
    setEditAmount(String(entry.amountPaise / 100));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEntry) return;
    setSavingEdit(true);
    try {
      await apiClient.put(`/employee/sales/${editingEntry._id}`, {
        orderName: editOrderName,
        productName: editProductName,
        amount: Number(editAmount),
      });
      showToast(t('Entry updated!', 'एंट्री अपडेट हो गई!'), 'success');
      setEditingEntry(null);
      fetchEntries();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update entry'), 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (entry: SalesEntryItem) => {
    try {
      await apiClient.delete(`/employee/sales/${entry._id}`);
      showToast(t('Entry deleted.', 'एंट्री हटाई गई।'), 'info');
      fetchEntries();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete entry'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('Sales Entries', 'मेरी बिक्री एंट्री')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {cycleLabel
              ? `${t('Current Cycle', 'वर्तमान चक्र')}: ${cycleLabel}`
              : t('Verified transaction records with IST timestamps', 'IST समय के साथ सत्यापित बिक्री रिकॉर्ड')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{t('Export Excel', 'एक्सेल एक्सपोर्ट')}</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 whitespace-nowrap"
          >
            <Printer className="w-4 h-4" />
            <span>{t('Print Report', 'प्रिंट')}</span>
          </button>
          <Link
            to="/employee/add-entry"
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t('New Entry', 'नई एंट्री')}</span>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">{t("Today's Revenue", 'आज की बिक्री')}</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINRFromPaise(todaySalesPaise)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">{t('Total Sales Value', 'कुल बिक्री राशि')}</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
            {formatINRFromPaise(filteredTotalPaise)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-500 font-medium">{t('Transactions', 'कुल एंट्री')}</p>
          <p className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {totalItems}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 no-print">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder={t('Search by client, location, or product...', 'पार्टी, स्थान या सामान से खोजें...')}
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          aria-label="Start Date"
          className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            aria-label="End Date"
            className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
          {(startDate || endDate || search) && (
            <button
              type="button"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSearch('');
                setPage(1);
              }}
              className="px-3 h-11 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              {t('Clear', 'साफ़ करें')}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 text-center text-sm text-slate-500">
            {t('Loading records...', 'रिकॉर्ड लोड हो रहे हैं...')}
          </div>
        ) : entries.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={ListOrdered}
              title={t('No sales transactions found', 'कोई बिक्री एंट्री नहीं मिली')}
              description={t(
                'Record a new sale entry or clear active filters to view transactions.',
                'बिक्री विवरण देखने के लिए नई एंट्री जोड़ें या फ़िल्टर हटाएं।'
              )}
              action={
                <Link
                  to="/employee/add-entry"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t('New Entry', 'नई एंट्री')}</span>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">{t('S.No.', 'क्र.')}</th>
                  <th className="py-3 px-4">{t('Date', 'तारीख')}</th>
                  <th className="py-3 px-4">{t('Time (IST)', 'समय')}</th>
                  <th className="py-3 px-4">{t('Client / Location', 'पार्टी / स्थान')}</th>
                  <th className="py-3 px-4">{t('Product', 'सामान')}</th>
                  <th className="py-3 px-4 text-right">{t('Sale Amount', 'बिक्री राशि')}</th>
                  <th className="py-3 px-4">{t('Status', 'स्थिति')}</th>
                  {(permissions.allowEdit || permissions.allowDelete) && (
                    <th className="py-3 px-4 text-right no-print">{t('Actions', 'कार्य')}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {entries.map((entry, idx) => (
                  <tr key={entry._id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-500">
                      {(page - 1) * 15 + idx + 1}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-800">
                      {formatISTDateDisplay(entry.entryDateIST)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-500">
                      {entry.entryTimeIST}
                    </td>
                    <td className="py-3 px-4 text-slate-800">{entry.orderName || '—'}</td>
                    <td className="py-3 px-4 text-slate-800">{entry.productName || '—'}</td>
                    <td className="py-3 px-4 text-right font-bold font-mono tabular-nums text-slate-900 whitespace-nowrap">
                      {formatINRFromPaise(entry.amountPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel status={entry.status} />
                    </td>
                    {(permissions.allowEdit || permissions.allowDelete) && (
                      <td className="py-3 px-4 text-right whitespace-nowrap no-print">
                        <div className="inline-flex items-center gap-1">
                          {permissions.allowEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(entry)}
                              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                              aria-label="Edit entry"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {permissions.allowDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                              aria-label="Delete entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-sm">
                  <td colSpan={5} className="py-3 px-4 text-slate-700">
                    {t('Total Verified Sales', 'कुल सत्यापित बिक्री')} ({totalItems})
                  </td>
                  <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-700">
                    {formatINRFromPaise(filteredTotalPaise)}
                  </td>
                  <td colSpan={permissions.allowEdit || permissions.allowDelete ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="px-4 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={setPage}
          />
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={Boolean(editingEntry)}
        title={t('Edit Entry', 'एंट्री बदलें')}
        onClose={() => setEditingEntry(null)}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('Order / Place', 'ऑर्डर / जगह')}
            </label>
            <input
              type="text"
              value={editOrderName}
              onChange={(e) => setEditOrderName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('Product', 'सामान')}
            </label>
            <input
              type="text"
              value={editProductName}
              onChange={(e) => setEditProductName(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">
              {t('Amount (₹)', 'राशि (₹)')}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-800 border border-slate-600 text-white text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditingEntry(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द करें')}
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-60"
            >
              {savingEdit ? t('Saving...', 'सेव हो रहा है...') : t('Save', 'सेव करें')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
