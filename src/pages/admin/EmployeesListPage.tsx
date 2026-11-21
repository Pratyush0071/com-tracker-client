import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Eye,
  Edit3,
  KeyRound,
  Trash2,
  Power,
  Users,
  CalendarRange,
  CheckCircle2,
} from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { StatusLabel } from '../../components/common/StatusLabel.tsx';
import { Modal } from '../../components/common/ConfirmModal.tsx';
import { formatINRFromPaise } from '../../utils/format.ts';

interface EmployeeRow {
  id: string;
  employeeCode: string;
  username: string;
  fullName: string;
  email: string;
  mobile: string;
  joiningDate: string;
  department: string;
  designation: string;
  targetCycleDay: number;
  cycleKey: string;
  cycleLabel: string;
  cycleStartDateIST: string;
  cycleEndDateIST: string;
  cycleTargetPaise: number;
  todaySalesPaise: number;
  currentCycleSalesPaise: number;
  lifetimeSalesPaise: number;
  totalCommissionPaise: number;
  isActive: boolean;
}

export function EmployeesListPage() {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [cycleLabel, setCycleLabel] = useState('');
  const [defaultCycleDay, setDefaultCycleDay] = useState(20);
  const [defaultStartDate, setDefaultStartDate] = useState('');
  const [defaultEndDate, setDefaultEndDate] = useState('');
  const [defaultTargetRupees, setDefaultTargetRupees] = useState(500000);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal — Username, Password, and Target Cycle setup
  const [createOpen, setCreateOpen] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCycleDay, setFormCycleDay] = useState('20');
  const [formUseCustomDates, setFormUseCustomDates] = useState(false);
  const [formCycleStart, setFormCycleStart] = useState('');
  const [formCycleEnd, setFormCycleEnd] = useState('');
  const [formTargetRupees, setFormTargetRupees] = useState('500000');
  const [submitting, setSubmitting] = useState(false);

  // Edit Target Cycle Modal
  const [cycleEmp, setCycleEmp] = useState<EmployeeRow | null>(null);
  const [editCycleDay, setEditCycleDay] = useState('20');
  const [editCycleStart, setEditCycleStart] = useState('');
  const [editCycleEnd, setEditCycleEnd] = useState('');
  const [editTargetRupees, setEditTargetRupees] = useState('');

  // Edit Employee Modal
  const [editEmp, setEditEmp] = useState<EmployeeRow | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editJoining, setEditJoining] = useState('');

  // Reset Password Modal
  const [pwdEmp, setPwdEmp] = useState<EmployeeRow | null>(null);
  const [newPwd, setNewPwd] = useState('');

  // Soft Delete Confirm Modal
  const [deleteEmp, setDeleteEmp] = useState<EmployeeRow | null>(null);

  const loadEmployees = useCallback(async () => {
    try {
      const res = await apiClient.get('/admin/employees', {
        params: { search: search.trim() || undefined },
      });
      setEmployees(res.data.employees);
      setCycleLabel(res.data.currentCycleLabel || '');
      if (res.data.defaultCycleDay) setDefaultCycleDay(res.data.defaultCycleDay);
      if (res.data.defaultCycleStartDateIST) setDefaultStartDate(res.data.defaultCycleStartDateIST);
      if (res.data.defaultCycleEndDateIST) setDefaultEndDate(res.data.defaultCycleEndDateIST);
      if (res.data.defaultTargetRupees) setDefaultTargetRupees(res.data.defaultTargetRupees);
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load employees'), 'error');
    } finally {
      setLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  const handleOpenCreate = () => {
    setFormUsername('');
    setFormPassword('');
    setFormCycleDay(String(defaultCycleDay));
    setFormUseCustomDates(false);
    setFormCycleStart(defaultStartDate);
    setFormCycleEnd(defaultEndDate);
    setFormTargetRupees(String(defaultTargetRupees));
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post('/admin/employees', {
        username: formUsername.trim(),
        password: formPassword,
        targetCycleDay: Number(formCycleDay) || defaultCycleDay,
        ...(formUseCustomDates && formCycleStart && formCycleEnd
          ? { cycleStartDate: formCycleStart, cycleEndDate: formCycleEnd }
          : {}),
        ...(formTargetRupees ? { targetAmountRupees: Number(formTargetRupees) } : {}),
      });
      showToast(t('Employee created!', 'कर्मचारी खाता बन गया!'), 'success');
      setCreateOpen(false);
      loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to create employee'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenCycleEdit = (emp: EmployeeRow) => {
    setCycleEmp(emp);
    setEditCycleDay(String(emp.targetCycleDay || defaultCycleDay));
    setEditCycleStart(emp.cycleStartDateIST);
    setEditCycleEnd(emp.cycleEndDateIST);
    setEditTargetRupees(String(Math.round((emp.cycleTargetPaise || 50000000) / 100)));
  };

  const handleSaveTargetCycle = async (completeCurrentCycle: boolean) => {
    if (!cycleEmp) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/admin/employees/${cycleEmp.id}/target-cycle`, {
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
      setCycleEmp(null);
      loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update target cycle'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (emp: EmployeeRow) => {
    setEditEmp(emp);
    setEditName(emp.fullName);
    setEditEmail(emp.email);
    setEditMobile(emp.mobile);
    setEditJoining(emp.joiningDate);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmp) return;
    setSubmitting(true);
    try {
      await apiClient.put(`/admin/employees/${editEmp.id}`, {
        fullName: editName.trim(),
        email: editEmail.trim(),
        mobile: editMobile.trim(),
        joiningDate: editJoining,
      });
      showToast(t('Employee updated.', 'अपडेट हो गया।'), 'success');
      setEditEmp(null);
      loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update employee'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (emp: EmployeeRow) => {
    try {
      await apiClient.patch(`/admin/employees/${emp.id}/status`, { isActive: !emp.isActive });
      showToast(
        !emp.isActive ? t('Activated.', 'सक्रिय किया गया।') : t('Deactivated.', 'निष्क्रिय किया गया।'),
        'info'
      );
      loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Status update failed'), 'error');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdEmp) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/admin/employees/${pwdEmp.id}/reset-password`, { newPassword: newPwd });
      showToast(t('Password reset!', 'पासवर्ड बदल गया!'), 'success');
      setPwdEmp(null);
      setNewPwd('');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to reset password'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSoftDelete = async () => {
    if (!deleteEmp) return;
    setSubmitting(true);
    try {
      await apiClient.delete(`/admin/employees/${deleteEmp.id}`);
      showToast(t('Employee removed.', 'कर्मचारी हटाया गया।'), 'info');
      setDeleteEmp(null);
      loadEmployees();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete employee'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={6} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {t('Employees', 'कर्मचारी')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('Default Cycle', 'डिफ़ॉल्ट चक्र')}: {cycleLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('Add Employee', 'नया कर्मचारी')}</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search username or ID...', 'यूज़रनेम या आईडी खोजें...')}
            className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Users}
              title={t('No employees', 'कोई कर्मचारी नहीं')}
              description={t(
                'Add an employee with username, password, and target cycle.',
                'यूज़रनेम, पासवर्ड और लक्ष्य चक्र के साथ नया कर्मचारी जोड़ें।'
              )}
              action={
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 text-white text-sm font-semibold"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{t('Add Employee', 'नया कर्मचारी')}</span>
                </button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 whitespace-nowrap">
                  <th className="py-3 px-4">{t('ID', 'आईडी')}</th>
                  <th className="py-3 px-4">{t('Username / Name', 'नाम')}</th>
                  <th className="py-3 px-4">{t('Target Cycle', 'लक्ष्य चक्र')}</th>
                  <th className="py-3 px-4 text-right">{t('Today', 'आज')}</th>
                  <th className="py-3 px-4 text-right">{t('Cycle Sales', 'चक्र बिक्री')}</th>
                  <th className="py-3 px-4 text-right">{t('Commission', 'कमीशन')}</th>
                  <th className="py-3 px-4">{t('Status', 'स्थिति')}</th>
                  <th className="py-3 px-4 text-right">{t('Actions', 'कार्य')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 whitespace-nowrap">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {emp.employeeCode}
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/admin/employees/${emp.id}`}
                        className="font-semibold text-slate-900 hover:text-teal-700"
                      >
                        {emp.fullName}
                      </Link>
                      {emp.username !== emp.fullName && (
                        <span className="text-xs text-slate-500 ml-1.5 font-mono">
                          @{emp.username}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleOpenCycleEdit(emp)}
                        className="text-left group hover:text-teal-700"
                        title={t('Edit Target Cycle', 'लक्ष्य चक्र बदलें')}
                      >
                        <p className="text-xs font-semibold text-slate-800 group-hover:text-teal-700">
                          {emp.cycleLabel}
                        </p>
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                          {t('Day', 'दिन')} {emp.targetCycleDay} · {formatINRFromPaise(emp.cycleTargetPaise)}
                        </p>
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINRFromPaise(emp.todaySalesPaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-teal-700">
                      {formatINRFromPaise(emp.currentCycleSalesPaise)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">
                      {formatINRFromPaise(emp.totalCommissionPaise)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusLabel status={emp.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenCycleEdit(emp)}
                          className="p-2 rounded-lg text-teal-700 hover:bg-teal-50"
                          title={t('Edit Target Cycle', 'लक्ष्य चक्र बदलें')}
                        >
                          <CalendarRange className="w-4 h-4" />
                        </button>
                        <Link
                          to={`/admin/employees/${emp.id}`}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                          title={t('View Details', 'विवरण')}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(emp)}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                          title={t('Edit', 'बदलें')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(emp)}
                          className={`p-2 rounded-lg hover:bg-slate-100 ${
                            emp.isActive ? 'text-amber-600' : 'text-teal-700'
                          }`}
                          title={emp.isActive ? t('Deactivate', 'बंद करें') : t('Activate', 'चालू करें')}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPwdEmp(emp);
                            setNewPwd('');
                          }}
                          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
                          title={t('Reset Password', 'पासवर्ड बदलें')}
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteEmp(emp)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                          title={t('Delete', 'हटाएं')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Employee Modal — Dark Theme + Target Cycle Fields */}
      <Modal
        open={createOpen}
        title={t('Add Employee', 'नया कर्मचारी')}
        onClose={() => setCreateOpen(false)}
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              {t('Username', 'यूज़रनेम')} *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              placeholder="rajesh"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-1.5">
              {t('Password (min 4 chars)', 'पासवर्ड (कम से कम 4 अक्षर)')} *
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={formPassword}
              onChange={(e) => setFormPassword(e.target.value)}
              placeholder="••••"
              className="w-full h-11 px-3.5 rounded-xl bg-slate-800 border border-slate-600 text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('Cycle Reset Day (1–28)', 'चक्र तारीख (1–28)')}
              </label>
              <input
                type="number"
                min={1}
                max={28}
                value={formCycleDay}
                onChange={(e) => setFormCycleDay(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('Initial Target (₹)', 'प्रारंभिक लक्ष्य (₹)')}
              </label>
              <input
                type="number"
                min={1000}
                step={1000}
                value={formTargetRupees}
                onChange={(e) => setFormTargetRupees(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={formUseCustomDates}
              onChange={(e) => setFormUseCustomDates(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-teal-600"
            />
            <span>{t('Set custom cycle start & end dates', 'कस्टम चक्र शुरू व अंतिम तारीख चुनें')}</span>
          </label>

          {formUseCustomDates && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('Start Date', 'शुरू तारीख')}
                </label>
                <input
                  type="date"
                  required={formUseCustomDates}
                  value={formCycleStart}
                  onChange={(e) => setFormCycleStart(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t('End Date', 'अंतिम तारीख')}
                </label>
                <input
                  type="date"
                  required={formUseCustomDates}
                  value={formCycleEnd}
                  onChange={(e) => setFormCycleEnd(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-semibold text-slate-200 hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50"
            >
              {submitting ? t('Creating...', 'बन रहा है...') : t('Create', 'बनाएं')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Target Cycle Modal */}
      <Modal
        open={Boolean(cycleEmp)}
        title={`${t('Target Cycle', 'लक्ष्य चक्र')} — ${cycleEmp?.fullName || ''}`}
        onClose={() => setCycleEmp(null)}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
            <span className="text-slate-400">{t('Active Cycle', 'वर्तमान चक्र')}:</span>{' '}
            <strong className="text-white">{cycleEmp?.cycleLabel}</strong>
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
              disabled={submitting}
              onClick={() => handleSaveTargetCycle(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-500 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{t('Complete Cycle & Start New', 'चक्र पूरा करें और नया शुरू करें')}</span>
            </button>

            <div className="flex gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setCycleEmp(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-600 bg-slate-800 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              >
                {t('Cancel', 'रद्द')}
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSaveTargetCycle(false)}
                className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500 disabled:opacity-50"
              >
                {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Save Cycle', 'सेव करें')}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        open={Boolean(editEmp)}
        title={`${t('Edit', 'बदलें')} — ${editEmp?.employeeCode || ''}`}
        onClose={() => setEditEmp(null)}
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Name', 'नाम')}
            </label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('Email', 'ईमेल')}
            </label>
            <input
              type="email"
              required
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Mobile', 'मोबाइल')}
              </label>
              <input
                type="text"
                value={editMobile}
                onChange={(e) => setEditMobile(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                {t('Joining Date', 'तारीख')}
              </label>
              <input
                type="date"
                value={editJoining}
                onChange={(e) => setEditJoining(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditEmp(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Save', 'सेव करें')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={Boolean(pwdEmp)}
        title={`${t('Reset Password', 'पासवर्ड बदलें')} — ${pwdEmp?.fullName || ''}`}
        onClose={() => setPwdEmp(null)}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              {t('New Password (min 4 chars)', 'नया पासवर्ड (कम से कम 4 अक्षर)')}
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••"
              className="w-full h-10 px-3 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPwdEmp(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-teal-600 text-white text-sm font-semibold hover:bg-teal-500"
            >
              {submitting ? t('Saving...', 'सेव हो रहा है...') : t('Reset', 'बदलें')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Soft Delete Confirmation Modal */}
      <Modal
        open={Boolean(deleteEmp)}
        title={t('Remove Employee', 'कर्मचारी हटाएं')}
        onClose={() => setDeleteEmp(null)}
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            {t('Remove', 'हटाएं')}{' '}
            <strong className="text-white">{deleteEmp?.fullName}</strong> (
            {deleteEmp?.employeeCode})?{' '}
            {t('Past sales records remain saved.', 'पुराना बिक्री रिकॉर्ड सुरक्षित रहेगा।')}
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setDeleteEmp(null)}
              className="px-4 py-2 rounded-lg border border-slate-600 bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700"
            >
              {t('Cancel', 'रद्द')}
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSoftDelete}
              className="px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-500"
            >
              {submitting ? t('Removing...', 'हट रहा है...') : t('Remove', 'हटाएं')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
