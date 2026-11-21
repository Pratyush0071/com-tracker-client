import React, { useCallback, useEffect, useState } from 'react';
import { Download, Edit3, Trash2, BarChart3, AlertTriangle } from 'lucide-react';
import { apiClient, downloadExcelFile, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { Modal } from '../../components/common/ConfirmModal.tsx';
import { formatINRFromPaise, formatISTDateDisplay } from '../../utils/format.ts';
import type { SalesEntryItem } from '../../types/index.ts';

interface ReportsResponse {
  entries: SalesEntryItem[];
  pagination: { page: number; totalPages: number; total: number };
  summary: {
    totalEntries: number;
    totalSalesPaise: number;
    totalCommissionPaise: number;
    averageSalePaise: number;
  };
  employeeTotals: Array<{
    _id: string;
    employeeCode: string;
    employeeName: string;
    entries: number;
    totalSalesPaise: number;
  }>;
  dailyTotals: Array<{ _id: string; entries: number; totalSalesPaise: number }>;
  monthlyTotals: Array<{ _id: string; entries: number; totalSalesPaise: number }>;
  employees: Array<{ id: string; employeeCode: string; fullName: string }>;
}

export function SalesReportsPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [employeeId, setEmployeeId] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productName, setProductName] = useState('');
  const [orderName, setOrderName] = useState('');
  const [page, setPage] = useState(1);

  const [breakdownTab, setBreakdownTab] = useState<'entries' | 'employees' | 'daily' | 'monthly'>(
    'entries'
  );

  // Edit entry modal
  const [editing, setEditing] = useState<SalesEntryItem | null>(null);
  const [editOrder, setEditOrder] = useState('');
  const [editProduct, setEditProduct] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [saving, setSaving] = useState(false);

  // Selective Delete Data Modal (Date Range / Employee / All Data)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<'date_range' | 'employee' | 'all_data'>('date_range');
  const [delEmployeeId, setDelEmployeeId] = useState('all');
  const [delFromDate, setDelFromDate] = useState('');
  const [delToDate, setDelToDate] = useState('');
  const [delAlsoAccount, setDelAlsoAccount] = useState(false);
  const [delAllAccounts, setDelAllAccounts] = useState(false);
  const [deletingData, setDeletingData] = useState(false);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/admin/sales-reports', {
        params: {
          employeeId,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          productName: productName.trim() || undefined,
          orderName: orderName.trim() || undefined,
          page,
          limit: 20,
        },
      });
      setData(res.data);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load sales reports'), 'error');
    } finally {
      setLoading(false);
    }
  }, [employeeId, startDate, endDate, productName, orderName, page, showToast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleOpenDeleteModal = () => {
    const firstEmpId = data?.employees[0]?.id || '';
    setDelFromDate(startDate || '');
    setDelToDate(endDate || '');
    if (employeeId !== 'all') {
      setDeleteMode('employee');
      setDelEmployeeId(employeeId);
    } else {
      setDeleteMode('date_range');
      setDelEmployeeId(firstEmpId ? 'all' : '');
    }
    setDelAlsoAccount(false);
    setDelAllAccounts(false);
    setDeleteModalOpen(true);
  };

  const handleConfirmSelectiveDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteMode === 'employee' && (!delEmployeeId || delEmployeeId === 'all')) {
      showToast(t('Please select an employee.', 'कृपया कर्मचारी चुनें।'), 'error');
      return;
    }
    if (deleteMode === 'date_range' && (!delFromDate || !delToDate)) {
      showToast(t('Please select From and To dates.', 'कृपया शुरू और अंतिम तारीख चुनें।'), 'error');
      return;
    }

    setDeletingData(true);
    try {
      const res = await apiClient.post('/admin/data/delete-selective', {
        mode: deleteMode,
        employeeId:
          deleteMode === 'employee'
            ? delEmployeeId
            : deleteMode === 'date_range' && delEmployeeId !== 'all'
              ? delEmployeeId
              : undefined,
        fromDate: deleteMode === 'date_range' ? delFromDate : undefined,
        toDate: deleteMode === 'date_range' ? delToDate : undefined,
        alsoDeleteAccount: deleteMode === 'employee' ? delAlsoAccount : false,
        alsoDeleteEmployeeAccounts: deleteMode === 'all_data' ? delAllAccounts : false,
      });

      showToast(res.data.message || t('Data deleted.', 'डेटा हटाया गया।'), 'success');
      setDeleteModalOpen(false);
      if (
        (deleteMode === 'employee' && delAlsoAccount) ||
        (deleteMode === 'all_data' && delAllAccounts)
      ) {
        setEmployeeId('all');
      }
      setPage(1);
      fetchReports();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete data'), 'error');
    } finally {
      setDeletingData(false);
    }
  };

  const handleExport = async () => {
    try {
      await downloadExcelFile('/admin/sales-reports/export', 'sales-report.xlsx', {
        employeeId,
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
        ...(productName.trim() ? { productName: productName.trim() } : {}),
        ...(orderName.trim() ? { orderName: orderName.trim() } : {}),
      });
      showToast(t('Excel downloaded!', 'एक्सेल डाउनलोड हो गया!'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Export failed'), 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/sales/${editing._id}`, {
        orderName: editOrder,
        productName: editProduct,
        amount: Number(editAmount),
      });
      showToast(t('Entry updated.', 'एंट्री अपडेट हो गई।'), 'success');
      setEditing(null);
      fetchReports();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update entry'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await apiClient.delete(`/admin/sales/${entryId}`);
      showToast(t('Entry deleted.', 'एंट्री हटाई गई।'), 'info');
      fetchReports();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete entry'), 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('Sales Entries', 'बिक्री विवरण')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('Verified company sales ledger with IST timestamps', 'IST समय के साथ सत्यापित कंपनी बिक्री रिकॉर्ड')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenDeleteModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-red-700 text-white text-sm font-semibold hover:bg-red-800 whitespace-nowrap"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('Delete Data', 'डेटा हटाएं')}</span>
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 min-h-[42px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>{t('Export Excel', 'एक्सेल एक्सपोर्ट')}</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <select
          value={employeeId}
          onChange={(e) => {
            setEmployeeId(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
        >
          <option value="all">{t('All Employees', 'सभी कर्मचारी')}</option>
          {data?.employees.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.fullName} ({emp.employeeCode})
            </option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setPage(1);
          }}
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="text"
          value={productName}
          onChange={(e) => {
            setProductName(e.target.value);
            setPage(1);
          }}
          placeholder={t('Filter by product...', 'सामान से खोजें...')}
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
        />
        <input
          type="text"
          value={orderName}
          onChange={(e) => {
            setOrderName(e.target.value);
            setPage(1);
          }}
          placeholder={t('Filter by client / location...', 'पार्टी / स्थान से खोजें...')}
          className="h-10 px-3 rounded-lg border border-slate-200 text-sm"
        />
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{t('Transactions', 'कुल एंट्री')}</p>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1">
              {data.summary.totalEntries}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{t('Total Sales Value', 'कुल बिक्री राशि')}</p>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-teal-700 mt-1">
              {formatINRFromPaise(data.summary.totalSalesPaise)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{t('Average Order Value', 'औसत बिक्री')}</p>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1">
              {formatINRFromPaise(data.summary.averageSalePaise)}
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500">{t('Commission Generated', 'कुल कमीशन')}</p>
            <p className="text-xl sm:text-2xl font-bold font-mono tabular-nums mt-1">
              {formatINRFromPaise(data.summary.totalCommissionPaise)}
            </p>
          </div>
        </div>
      )}

      {/* Report Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-4 pt-3 border-b border-slate-200 flex flex-wrap gap-2">
          {[
            { id: 'entries', label: t('Transactions', 'एंट्री') },
            { id: 'employees', label: t('By Employee', 'कर्मचारी अनुसार') },
            { id: 'daily', label: t('Daily Summary', 'दैनिक') },
            { id: 'monthly', label: t('Monthly Summary', 'मासिक') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setBreakdownTab(tab.id as typeof breakdownTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-colors whitespace-nowrap ${
                breakdownTab === tab.id
                  ? 'bg-slate-950 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading || !data ? (
          <div className="p-6 text-center text-sm text-slate-500">
            {t('Loading records...', 'रिकॉर्ड लोड हो रहे हैं...')}
          </div>
        ) : breakdownTab === 'entries' ? (
          data.entries.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={BarChart3}
                title={t('No matching transactions', 'कोई एंट्री नहीं मिली')}
                description={t('Adjust your filters to view sales records.', 'अन्य बिक्री देखने के लिए फ़िल्टर बदलें।')}
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                      <th className="py-3 px-4">{t('Date & Time (IST)', 'तारीख / समय')}</th>
                      <th className="py-3 px-4">{t('Employee', 'कर्मचारी')}</th>
                      <th className="py-3 px-4">{t('Client / Location', 'पार्टी / स्थान')}</th>
                      <th className="py-3 px-4">{t('Product / Item', 'सामान')}</th>
                      <th className="py-3 px-4 text-right">{t('Sale Amount', 'बिक्री राशि')}</th>
                      <th className="py-3 px-4 text-right">{t('Commission', 'कमीशन')}</th>
                      <th className="py-3 px-4">{t('Status', 'स्थिति')}</th>
                      <th className="py-3 px-4 text-right">{t('Actions', 'कार्य')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.entries.map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono text-xs whitespace-nowrap">
                          {formatISTDateDisplay(e.entryDateIST)} · {e.entryTimeIST}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-900">{e.employeeName}</span>{' '}
                          <span className="text-xs font-mono text-slate-500">{e.employeeCode}</span>
                        </td>
                        <td className="py-3 px-4">{e.orderName || '—'}</td>
                        <td className="py-3 px-4">{e.productName || '—'}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums font-bold">
                          {formatINRFromPaise(e.amountPaise)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-teal-700">
                          {formatINRFromPaise(e.commissionPaise)}
                        </td>
                        <td className="py-3 px-4">
                          <StatusLabel status={e.status} />
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(e);
                              setEditOrder(e.orderName);
                              setEditProduct(e.productName);
                              setEditAmount(String(e.amountPaise / 100));
                            }}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                            title={t('Edit', 'बदलें')}
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(e._id)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 ml-1"
                            title={t('Delete', 'हटाएं')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 pb-4">
                <Pagination
                  page={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  totalItems={data.pagination.total}
                  onPageChange={setPage}
                />
              </div>
            </>
          )
        ) : breakdownTab === 'employees' ? (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">{t('ID', 'आईडी')}</th>
                  <th className="py-2 px-4">{t('Employee', 'कर्मचारी')}</th>
                  <th className="py-2 px-4 text-right">{t('Entries', 'एंट्री')}</th>
                  <th className="py-2 pl-4 text-right">{t('Sales', 'बिक्री')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.employeeTotals.map((row) => (
                  <tr key={row._id}>
                    <td className="py-2.5 pr-4 font-mono">{row.employeeCode}</td>
                    <td className="py-2.5 px-4 font-semibold">{row.employeeName}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.entries}</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-bold text-teal-700">
                      {formatINRFromPaise(row.totalSalesPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : breakdownTab === 'daily' ? (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">{t('Date', 'तारीख')}</th>
                  <th className="py-2 px-4 text-right">{t('Entries', 'एंट्री')}</th>
                  <th className="py-2 pl-4 text-right">{t('Sales', 'बिक्री')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.dailyTotals.map((row) => (
                  <tr key={row._id}>
                    <td className="py-2.5 pr-4 font-mono">{formatISTDateDisplay(row._id)}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.entries}</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-bold">
                      {formatINRFromPaise(row.totalSalesPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 pr-4">{t('Month', 'माह')}</th>
                  <th className="py-2 px-4 text-right">{t('Entries', 'एंट्री')}</th>
                  <th className="py-2 pl-4 text-right">{t('Sales', 'बिक्री')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.monthlyTotals.map((row) => (
                  <tr key={row._id}>
                    <td className="py-2.5 pr-4 font-mono">{row._id}</td>
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums">{row.entries}</td>
                    <td className="py-2.5 pl-4 text-right font-mono tabular-nums font-bold">
                      {formatINRFromPaise(row.totalSalesPaise)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal — Dark Theme */}
      <Modal
        open={Boolean(editing)}
        title={t('Edit Entry', 'एंट्री बदलें')}
        onClose={() => setEditing(null)}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Order / Place', 'ऑर्डर / जगह')}
            </label>
            <input
              type="text"
              value={editOrder}
              onChange={(e) => setEditOrder(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Product', 'सामान')}
            </label>
            <input
              type="text"
              value={editProduct}
              onChange={(e) => setEditProduct(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Amount (₹)', 'राशि (₹)')}
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-base font-mono font-bold"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              {saving ? t('Saving...', 'सेव हो रहा है...') : t('Save', 'सेव करें')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Selective Delete Data Modal — From/To, Employee Data, or All Data */}
      <Modal
        open={deleteModalOpen}
        title={t('Delete Data Selectively', 'चुनकर डेटा हटाएं')}
        onClose={() => setDeleteModalOpen(false)}
      >
        <form onSubmit={handleConfirmSelectiveDelete} className="space-y-4">
          <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteMode('date_range')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                deleteMode === 'date_range'
                  ? 'bg-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t('From → To Dates', 'तारीख से तारीख')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteMode('employee');
                if (delEmployeeId === 'all' && data?.employees[0]?.id) {
                  setDelEmployeeId(data.employees[0].id);
                }
              }}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                deleteMode === 'employee'
                  ? 'bg-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t('Employee Data', 'एक कर्मचारी')}
            </button>
            <button
              type="button"
              onClick={() => setDeleteMode('all_data')}
              className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors ${
                deleteMode === 'all_data'
                  ? 'bg-red-700 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {t('All Data', 'सारा डेटा')}
            </button>
          </div>

          {deleteMode === 'date_range' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  {t('Employee Scope', 'कर्मचारी चुनें')}
                </label>
                <select
                  value={delEmployeeId || 'all'}
                  onChange={(e) => setDelEmployeeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                >
                  <option value="all">{t('All Employees', 'सभी कर्मचारी')}</option>
                  {data?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    {t('From Date', 'शुरू तारीख')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={delFromDate}
                    onChange={(e) => setDelFromDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-200 mb-1">
                    {t('To Date', 'अंतिम तारीख')} *
                  </label>
                  <input
                    type="date"
                    required
                    value={delToDate}
                    onChange={(e) => setDelToDate(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {deleteMode === 'employee' && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1">
                  {t('Select Employee', 'कर्मचारी चुनें')} *
                </label>
                <select
                  required
                  value={delEmployeeId === 'all' ? '' : delEmployeeId}
                  onChange={(e) => setDelEmployeeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                >
                  <option value="">{t('-- Select Employee --', '-- कर्मचारी चुनें --')}</option>
                  {data?.employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={delAlsoAccount}
                  onChange={(e) => setDelAlsoAccount(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-red-600"
                />
                <span>
                  {t(
                    'Also remove employee login account',
                    'कर्मचारी का लॉगिन खाता भी हटाएं'
                  )}
                </span>
              </label>
            </div>
          )}

          {deleteMode === 'all_data' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                {t(
                  'This will permanently erase all sales entries, commissions, target achievements, bonuses, cycles, and payout records across the entire company.',
                  'यह पूरी कंपनी की सभी बिक्री एंट्री, कमीशन, लक्ष्य रिकॉर्ड, बोनस, चक्र और भुगतान डेटा को स्थायी रूप से हटा देगा।'
                )}
              </p>
              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={delAllAccounts}
                  onChange={(e) => setDelAllAccounts(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-red-600"
                />
                <span>
                  {t(
                    'Also delete all employee login accounts (keeps Admin)',
                    'सभी कर्मचारी लॉगिन खाते भी हटाएं (एडमिन सुरक्षित रहेगा)'
                  )}
                </span>
              </label>
            </div>
          )}

          <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 flex items-start gap-2.5 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>
              {t(
                'Warning: Deleted records cannot be undone. Affected totals and cycles will be automatically recalculated.',
                'चेतावनी: हटाया गया डेटा वापस नहीं लाया जा सकता।'
              )}
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={deletingData}
              className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-500 disabled:opacity-50"
            >
              {deletingData
                ? t('Deleting...', 'हटाया जा रहा है...')
                : t('Confirm Delete', 'स्थायी रूप से हटाएं')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
