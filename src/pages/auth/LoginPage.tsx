import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, AlertCircle, Languages } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { apiClient, getApiErrorMessage, storeAuthSession } from '../../api/client.ts';

export function LoginPage() {
  const { user, login, refreshMe } = useAuth();
  const { showToast } = useToast();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [needsSetup, setNeedsSetup] = useState(false);
  const [setupUsername, setSetupUsername] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard', {
        replace: true,
      });
    }
  }, [user, navigate]);

  useEffect(() => {
    apiClient
      .get('/auth/setup-status')
      .then((res) => {
        setNeedsSetup(Boolean(res.data.needsAdminSetup));
      })
      .catch(() => {});
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identifier.trim() || password.length < 4) {
      setErrorMsg(
        t(
          'Enter username and password (min 4 characters).',
          'यूज़रनेम और पासवर्ड (कम से कम 4 अक्षर) दर्ज करें।'
        )
      );
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(identifier.trim(), password, remember);
      showToast(t(`Welcome, ${loggedUser.fullName}`, `स्वागत है, ${loggedUser.fullName}`), 'success');
      navigate(loggedUser.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard', {
        replace: true,
      });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, t('Invalid username or password.', 'गलत यूज़रनेम या पासवर्ड।')));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!setupUsername.trim() || !setupEmail.trim() || setupPassword.length < 4) {
      setErrorMsg(
        t(
          'Username, email, and password (min 4 chars) required.',
          'यूज़रनेम, ईमेल और पासवर्ड (कम से कम 4 अक्षर) ज़रूरी हैं।'
        )
      );
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiClient.post('/auth/setup-admin', {
        fullName: setupUsername.trim(),
        username: setupUsername.trim(),
        email: setupEmail.trim(),
        password: setupPassword,
      });
      storeAuthSession(res.data.token, JSON.stringify(res.data.user), true);
      await refreshMe();
      showToast(t('Admin account created.', 'एडमिन अकाउंट बन गया।'), 'success');
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(getApiErrorMessage(err, 'Setup failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            {needsSetup ? t('Admin Setup', 'एडमिन सेटअप') : t('Login', 'लॉगिन')}
          </h1>
          <button
            type="button"
            onClick={toggleLang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
          </button>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {needsSetup ? (
          <form onSubmit={handleSetupAdmin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('Username', 'यूज़रनेम')}
              </label>
              <input
                type="text"
                required
                value={setupUsername}
                onChange={(e) => setSetupUsername(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('Email', 'ईमेल')}
              </label>
              <input
                type="email"
                required
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t('Password', 'पासवर्ड')}
              </label>
              <input
                type="password"
                required
                minLength={4}
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-700"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-teal-700 text-white text-base font-semibold hover:bg-teal-800 disabled:opacity-60"
            >
              {submitting ? t('Creating...', 'बन रहा है...') : t('Create Admin', 'एडमिन बनाएं')}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login-identifier"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {t('Username', 'यूज़रनेम')}
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={t('Enter username', 'यूज़रनेम लिखें')}
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-slate-700 mb-1.5"
              >
                {t('Password', 'पासवर्ड')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={4}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('Enter password', 'पासवर्ड लिखें')}
                  className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-300 text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-500 hover:text-slate-800"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none min-h-[36px]">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-700"
              />
              <span>{t('Remember me', 'लॉगिन याद रखें')}</span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 rounded-xl bg-teal-700 text-white text-base font-bold hover:bg-teal-800 disabled:opacity-60 transition-colors"
            >
              {submitting ? t('Signing in...', 'लॉगिन हो रहा है...') : t('Login', 'लॉगिन करें')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
