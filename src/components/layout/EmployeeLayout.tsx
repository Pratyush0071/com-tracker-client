import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  PlusCircle,
  ListOrdered,
  IndianRupee,
  LogOut,
  Bell,
  Menu,
  X,
  Languages,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { user, companyName, unreadNotifications, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { to: '/employee/dashboard', label: t('Home', 'होम'), icon: LayoutDashboard },
    { to: '/employee/add-entry', label: t('Add Sale', 'नई बिक्री'), icon: PlusCircle },
    { to: '/employee/entries', label: t('Entries', 'एंट्री'), icon: ListOrdered },
    { to: '/employee/earnings', label: t('Earnings', 'कमाई'), icon: IndianRupee },
    { to: '/employee/alerts', label: t('Alerts', 'अलर्ट'), icon: Bell },
  ];

  const currentPage = navItems.find((item) => location.pathname.startsWith(item.to));

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col lg:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-[240px] lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 z-30 no-print">
        <div className="h-16 px-5 flex items-center border-b border-slate-200">
          <span className="text-lg font-bold tracking-tight text-slate-900 truncate">
            {companyName}
          </span>
        </div>

        <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{user?.employeeCode}</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 min-h-[48px] rounded-xl text-base font-semibold transition-colors ${
                    isActive
                      ? 'bg-teal-950 text-white shadow-sm ring-1 ring-teal-900'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3.5">
                  <Icon className="w-6 h-6 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </div>
                {item.to === '/employee/alerts' && unreadNotifications > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-amber-600 text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 min-h-[48px] rounded-xl text-base font-semibold text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
          >
            <LogOut className="w-6 h-6 shrink-0" />
            <span>{t('Logout', 'लॉगआउट')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-[240px] flex flex-col min-h-screen">
        {/* Top Bar with EN/HI Toggle */}
        <header className="sticky top-0 z-30 h-[54px] lg:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[40px] min-w-[40px] -ml-1.5 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-base lg:text-lg font-bold text-slate-900 truncate">
              {currentPage ? currentPage.label : companyName}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Hindi / English Toggle */}
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
              onClick={() => navigate('/employee/alerts')}
              className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Alerts"
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
              onClick={() => navigate('/employee/add-entry')}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-xl bg-teal-700 text-white text-sm font-bold hover:bg-teal-800 transition-colors whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('Add Sale', 'नई बिक्री')}</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 lg:px-8 lg:py-7 pb-24 lg:pb-10 max-w-6xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Tab Bar — Bigger Labour-Friendly Icons, Dark Active State */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-[66px] bg-white/95 backdrop-blur-md border-t border-slate-200 grid grid-cols-5 items-center no-print"
        aria-label="Mobile Navigation"
      >
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isAdd = tab.to === '/employee/add-entry';
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full min-h-[48px] transition-colors ${
                  isActive
                    ? 'bg-teal-950 text-white font-bold'
                    : isAdd
                      ? 'text-teal-700 font-semibold'
                      : 'text-slate-500 font-medium'
                }`
              }
            >
              <Icon className="w-6 h-6 shrink-0" />
              <span className="text-[11px] mt-1 tracking-tight whitespace-nowrap">{tab.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Mobile Drawer — Dark Popup Theme */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-100 border-r border-slate-700 h-full flex flex-col z-10 shadow-2xl">
            <div className="h-14 px-5 flex items-center justify-between bg-slate-950 border-b border-slate-800">
              <span className="font-bold text-white">{companyName}</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/50">
              <p className="font-semibold text-white">{user?.fullName}</p>
              <p className="text-xs text-slate-400 font-mono">{user?.employeeCode}</p>
            </div>
            <nav className="flex-1 p-3 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3.5 px-3.5 py-3 min-h-[48px] rounded-xl text-base font-semibold transition-colors ${
                        isActive
                          ? 'bg-teal-950 text-white ring-1 ring-teal-700'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`
                    }
                  >
                    <Icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
            <div className="p-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-3.5 px-3.5 py-3 min-h-[48px] rounded-xl text-base font-semibold text-red-400 hover:bg-red-950/60"
              >
                <LogOut className="w-6 h-6" />
                <span>{t('Logout', 'लॉगआउट')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
