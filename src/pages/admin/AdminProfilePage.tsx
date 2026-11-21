import React, { useState } from 'react';
import { KeyRound, UserCircle } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';

export function AdminProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post('/auth/change-password', { currentPassword, newPassword });
      showToast(t('Password updated!', 'पासवर्ड अपडेट हो गया!'), 'success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to change password'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-slate-900">
        {t('Profile', 'प्रोफ़ाइल')}
      </h1>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <UserCircle className="w-6 h-6 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">
            {t('Account', 'खाता')}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-slate-500">{t('Name', 'नाम')}</p>
            <p className="font-semibold text-slate-900 mt-0.5">{user?.fullName}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('Username', 'यूज़रनेम')}</p>
            <p className="font-mono text-slate-800 mt-0.5">{user?.username}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">{t('Email', 'ईमेल')}</p>
            <p className="text-slate-800 mt-0.5">{user?.email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <KeyRound className="w-5 h-5 text-slate-700" />
          <h2 className="text-base font-bold text-slate-900">
            {t('Change Password', 'पासवर्ड बदलें')}
          </h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('Current Password', 'पुराना पासवर्ड')}
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t('New Password (min 4 chars)', 'नया पासवर्ड (कम से कम 4 अक्षर)')}
            </label>
            <input
              type="password"
              required
              minLength={4}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 min-h-[42px] rounded-xl bg-teal-700 text-white text-sm font-semibold hover:bg-teal-800 disabled:opacity-60"
          >
            {saving ? t('Updating...', 'अपडेट हो रहा है...') : t('Update Password', 'पासवर्ड अपडेट करें')}
          </button>
        </form>
      </div>
    </div>
  );
}
