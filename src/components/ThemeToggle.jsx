import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import PixelSwap from './reactbits/PixelSwap';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('courseit_theme') || 'dark';
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.classList.remove('light');
        document.documentElement.setAttribute('data-theme', 'dark');
      }
    } catch {}
  }, []);

  const handleThemeChange = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';

    const updateThemeDom = () => {
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
      document.startViewTransition(() => {
        updateThemeDom();
      });
    } else {
      updateThemeDom();
    }
  };

  return (
    <button
      type="button"
      onClick={handleThemeChange}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle Theme"
      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer overflow-hidden shadow-sm active:scale-95 ${
        theme === 'light'
          ? 'bg-amber-100 border-amber-300 text-amber-600 hover:bg-amber-200'
          : 'bg-slate-900/90 border-slate-700/80 text-amber-400 hover:border-amber-400/40 hover:bg-slate-850'
      } ${className}`}
    >
      <div className="w-5 h-5 flex items-center justify-center pointer-events-none">
        <PixelSwap
          firstContent={
            <div className="w-full h-full flex items-center justify-center">
              <Sun className="w-4 h-4 text-amber-500" />
            </div>
          }
          secondContent={
            <div className="w-full h-full flex items-center justify-center">
              <Moon className="w-4 h-4 text-indigo-400" />
            </div>
          }
          pixelSize={8}
          gap={1}
          duration={500}
          pixelDuration={200}
          pattern="diagonal"
          active={theme === 'light'}
          trigger="hover"
        />
      </div>
    </button>
  );
}
