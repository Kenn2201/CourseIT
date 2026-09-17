import React, { useState, useEffect } from 'react';
import { LayoutDashboard, History, User, Settings, HelpCircle, Sparkles, LogOut, ExternalLink, ShieldCheck, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUserCredits } from '../context/CreditContext';

export default function DashboardSidebar({ activeTab, onTabChange, authState, historyCount = 0 }) {
  const [theme, setTheme] = useState('dark');
  const { credits, formatCredits } = useUserCredits();

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('courseit_theme') || 'dark';
      setTheme(savedTheme);
    } catch {}

    const handleThemeChange = () => {
      const current = localStorage.getItem('courseit_theme') || 'dark';
      setTheme(current);
    };

    window.addEventListener('courseit_theme_changed', handleThemeChange);
    return () => window.removeEventListener('courseit_theme_changed', handleThemeChange);
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    const updateDom = () => {
      if (newTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
      setTheme(newTheme);
      try {
        localStorage.setItem('courseit_theme', newTheme);
        window.dispatchEvent(new Event('courseit_theme_changed'));
      } catch {}
    };

    if (typeof document !== 'undefined' && document.startViewTransition) {
      document.startViewTransition(() => updateDom());
    } else {
      updateDom();
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Studio & Courses', icon: LayoutDashboard },
    { id: 'history', label: 'History & Uploads', icon: History, badge: historyCount > 0 ? historyCount : null },
    { id: 'profile', label: 'My Account', icon: User },
    { id: 'settings', label: 'Preferences', icon: Settings },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle }
  ];

  return (
    <aside className="w-full md:w-64 md:min-h-[calc(100vh-4rem)] bg-slate-950/90 border-b md:border-b-0 md:border-r border-slate-800/80 p-3 sm:p-4 flex flex-col justify-between shrink-0 transition-colors duration-200">
      <div className="space-y-6">
        {/* Workspace Brand Pill */}
        <div className="hidden md:flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">ADHD Action-First Workspace</span>
        </div>

        {/* Navigation items (Horizontal on mobile, Vertical on desktop) */}
        <nav className="flex md:flex-col gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900/90'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== null && (
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-indigo-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Sidebar User Summary, Theme Switch & Admin Link */}
      <div className="pt-4 border-t border-slate-800/80 space-y-3">
        {/* Theme Switch Control */}
        <button
          type="button"
          onClick={handleToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          <div className="flex items-center gap-2">
            {theme === 'light' ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
            <span>Theme: {theme === 'light' ? 'Light Mode' : 'Dark Mode'}</span>
          </div>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
            {theme === 'light' ? 'Light' : 'Dark'}
          </span>
        </button>

        {authState?.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-between p-2.5 rounded-xl bg-violet-600/15 border border-violet-500/30 text-violet-300 hover:bg-violet-600/25 text-xs font-semibold transition-all group"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              <span>Admin Operations</span>
            </div>
            <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        )}

        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
              {authState?.user?.name?.[0]?.toUpperCase() || 'G'}
            </div>
            <div className="truncate">
              <p className="font-semibold text-white truncate text-xs">
                {authState?.isAuthenticated ? (authState?.user?.name || 'User') : 'Guest Session'}
              </p>
              <p className="text-[11px] font-mono text-indigo-400">
                {authState?.isAuthenticated
                  ? `${formatCredits(credits)} Credits`
                  : `${authState?.quota?.remaining ?? 3}/3 Trial`}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
