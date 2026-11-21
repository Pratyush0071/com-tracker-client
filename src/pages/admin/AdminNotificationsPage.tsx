import { useEffect, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { apiClient, getApiErrorMessage } from '../../api/client.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { formatDateTimeIST } from '../../utils/format.ts';
import type { NotificationItem } from '../../types/index.ts';

export function AdminNotificationsPage() {
  const { setUnreadNotifications } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    apiClient
      .get('/admin/notifications')
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      })
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load notifications'), 'error'))
      .finally(() => setLoading(false));
  }, [setUnreadNotifications, showToast]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/admin/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
      showToast(t('Marked all read.', 'सभी पढ़ा हुआ चिह्नित।'), 'success');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Action failed'), 'error');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/admin/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadNotifications((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">
          {t('Alerts', 'सूचनाएं')}
        </h1>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                filter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {t('All', 'सभी')} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                filter === 'unread' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              {t('Unread', 'नया')} ({notifications.filter((n) => !n.isRead).length})
            </button>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('Mark Read', 'सभी पढ़ें')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('No alerts', 'कोई सूचना नहीं')}
            description={t('No alerts right now.', 'अभी कोई नई सूचना नहीं है।')}
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {visible.map((n) => (
              <div
                key={n._id}
                onClick={() => !n.isRead && handleMarkRead(n._id)}
                className={`py-4 flex items-start justify-between gap-4 cursor-pointer ${
                  n.isRead ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                  <p className="text-sm text-slate-600 mt-0.5">{n.message}</p>
                  <p className="text-xs text-slate-400 mt-1">{formatDateTimeIST(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <span className="text-xs font-semibold text-amber-700 shrink-0">
                    {t('New', 'नया')}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
