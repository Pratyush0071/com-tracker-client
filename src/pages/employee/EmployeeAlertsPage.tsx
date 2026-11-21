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

export function EmployeeAlertsPage() {
  const { setUnreadNotifications } = useAuth();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    apiClient
      .get('/employee/notifications')
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadNotifications(res.data.unreadCount || 0);
      })
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load alerts'), 'error'))
      .finally(() => setLoading(false));
  }, [setUnreadNotifications, showToast]);

  const handleMarkAllRead = async () => {
    try {
      await apiClient.patch('/employee/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadNotifications(0);
      showToast(t('All alerts marked as read.', 'सभी अलर्ट पढ़े गए।'), 'success');
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.patch(`/employee/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      setUnreadNotifications((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  const visible =
    filter === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {t('Alerts', 'अलर्ट')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('Target milestones, incentives, and account updates', 'लक्ष्य, बोनस और खाते की सूचनाएं')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'all' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('All', 'सभी')} ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filter === 'unread' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('Unread', 'नया')} ({notifications.filter((n) => !n.isRead).length})
            </button>
          </div>

          {notifications.some((n) => !n.isRead) && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] rounded-xl border border-slate-200 bg-white text-xs font-semibold text-teal-700 hover:bg-slate-50 whitespace-nowrap"
            >
              <CheckCheck className="w-4 h-4" />
              <span>{t('Mark All Read', 'सभी पढ़ें')}</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
        {visible.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={t('No alerts', 'कोई अलर्ट नहीं')}
            description={t(
              'You are all caught up. Milestone and payout notifications will appear here.',
              'अभी कोई नया अलर्ट नहीं है।'
            )}
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
                  <p className="text-xs text-slate-400 mt-1 tabular-nums">
                    {formatDateTimeIST(n.createdAt)}
                  </p>
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
