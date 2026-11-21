import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Wallet,
  Target,
  Award,
  Bell,
  Settings,
  UserCircle,
  LogOut,
  Menu,
  X,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, companyName, unreadNotifications, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const primaryBottomNav = [
    { to: '/admin/dashboard', label: t('Dashboard', 'डैशबोर्ड'), icon: LayoutDashboard },
    { to: '/admin/sales-reports', label: t('Entries', 'एंट्री'), icon: BarChart3 },
    { to: '/admin/employees', label: t('Employees', 'कर्मचारी'), icon: Users },
    { to: '/admin/withdrawals', label: t('Withdraw', 'निकासी'), icon: Wallet },
    { to: '/admin/notifications', label: t('Alerts', 'सूचना'), icon: Bell },
  ];

  const secondaryNav = [
    { to: '/admin/targets', label: t('Targets', 'लक्ष्य'), icon: Target },
    { to: '/admin/incentives', label: t('Incentives', 'बोनस'), icon: Award },
    { to: '/admin/settings', label: t('Settings', 'सेटिंग्स'), icon: Settings },
    { to: '/admin/profile', label: t('Profile', 'प्रोफ़ाइल'), icon: UserCircle },
  ];

  const allNavItems = [...primaryBottomNav, ...secondaryNav];
  const activeItem = allNavItems.find((item) => location.pathname.startsWith(item.to));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const renderNavLinks = (darkTheme = false, onClick?: () => void) => (
    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      {allNavItems.map((item) => {
        const Icon = item.icon;
        const showBadge = item.to === '/admin/notifications' && unreadNotifications > 0;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClick}
            className={({ isActive }) =>
              `flex items-center justify-between px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? darkTheme
                    ? 'bg-slate-950 text-white ring-1 ring-slate-700'
                    : 'bg-slate-950 text-white shadow-sm'
                  : darkTheme
                    ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <span className="flex items-center gap-3 whitespace-nowrap truncate">
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </span>
            {showBadge && (
              <span className="px-1.5 py-0.5 text-[11px] font-bold bg-amber-600 text-white rounded tabular-nums">
                {unreadNotifications}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 no-print">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
            {companyName}
          </span>
        </div>

        {renderNavLinks(false)}

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <span>{t('Logout', 'लॉगआउट')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:pl-[240px] flex flex-col min-w-0">
        <header className="sticky top-0 z-20 h-[54px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden min-h-[40px] min-w-[40px] -ml-1.5 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-slate-900 truncate text-base lg:text-lg">
              {activeItem ? activeItem.label : t('Employee Details', 'कर्मचारी विवरण')}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 whitespace-nowrap"
              aria-label="Switch language"
            >
              <Languages className="w-4 h-4 text-teal-700" />
              <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/notifications')}
              className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('/admin/profile')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-medium text-slate-700 whitespace-nowrap"
            >
              <UserCircle className="w-4 h-4 text-slate-500" />
              <span>{user?.fullName || 'Admin'}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7 pb-24 lg:pb-10 max-w-[1400px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Admin Mobile Bottom Button Nav (Dashboard, Entries, Employees, Withdraw, Alerts) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[66px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center no-print"
        aria-label="Admin Mobile Navigation"
      >
        {primaryBottomNav.map((tab) => {
          const Icon = tab.icon;
          const showBadge = tab.to === '/admin/notifications' && unreadNotifications > 0;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
                  isActive ? 'bg-slate-950 text-white font-bold' : 'text-slate-500 font-medium'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-6 h-6 shrink-0" />
                {showBadge && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 rounded-full bg-amber-600 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight whitespace-nowrap">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Drawer — Dark Theme */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-100 border-r border-slate-700 h-full flex flex-col z-10 shadow-2xl">
            <div className="h-14 px-5 flex items-center justify-between bg-slate-950 border-b border-slate-800">
              <span className="font-bold text-white">{companyName}</span>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavLinks(true, () => setSidebarOpen(false))}
            <div className="p-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3.5 py-3 min-h-[48px] rounded-xl text-base font-semibold text-red-400 hover:bg-red-950/60"
              >
                <LogOut className="w-5 h-5" />
                <span>{t('Logout', 'लॉगआउट')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
