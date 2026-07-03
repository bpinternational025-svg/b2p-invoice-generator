import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Briefcase, 
  Settings, 
  ShieldAlert, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Database,
  Power,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { isSupabaseConnected } from '../lib/database';

interface SidebarProps {
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  userEmail?: string;
  onLogout: () => void;
}

export default function Sidebar({ theme, setTheme, userEmail, onLogout }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const supabaseActive = isSupabaseConnected();

  const links = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/documents', label: 'Documents', icon: FileText },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/services', label: 'Services', icon: Briefcase },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 h-16 sticky top-0 z-40 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-2" id="mobile-logo-section">
          <div className="w-9 h-9 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            D
          </div>
          <span className="font-bold text-lg text-slate-800 dark:text-slate-100">DocGen</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle mobile */}
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col transition-all duration-300 md:sticky md:h-screen
          ${collapsed ? 'w-20' : 'w-64'} 
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="cursor-pointer flex items-center gap-3 overflow-hidden" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-black text-xl shadow-md shrink-0">
              DG
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-lg leading-tight">DocGenerator</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase leading-none">Enterprise</span>
              </div>
            )}
          </div>
          
          {/* Collapse Button (Desktop only) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 transition"
          >
            {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Database Status Indicator */}
        {!collapsed ? (
          <div className="mx-4 mt-4 px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${supabaseActive ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {supabaseActive ? 'Supabase Connected' : 'Local Storage Mode'}
              </span>
            </div>
            <Database size={14} className={supabaseActive ? 'text-emerald-500' : 'text-blue-500'} />
          </div>
        ) : (
          <div className="flex justify-center mt-4">
            <div 
              className={`w-3 h-3 rounded-full ${supabaseActive ? 'bg-emerald-500' : 'bg-blue-500'}`} 
              title={supabaseActive ? 'Supabase Cloud Connected' : 'Local Storage Mode'}
            />
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100/20' 
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200'
                }
              `}
            >
              <link.icon 
                size={20} 
                className={`shrink-0 transition-transform duration-150 group-hover:scale-105`} 
              />
              {!collapsed && <span>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Footer Area */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {!collapsed ? (
            <div className="space-y-3">
              {/* Profile Details */}
              {userEmail ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">Account</span>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{userEmail}</span>
                  </div>
                  <button 
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20 transition shrink-0"
                    title="Log Out"
                  >
                    <Power size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => navigate('/auth')}
                  className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/10 transition"
                >
                  <Sparkles size={14} />
                  <span>Connect Supabase Auth</span>
                </button>
              )}

              {/* Theme toggle desktop */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                <span>Theme</span>
                <button 
                  onClick={toggleTheme}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon size={12} className="text-blue-500" />
                      <span>Dark</span>
                    </>
                  ) : (
                    <>
                      <Sun size={12} className="text-amber-500" />
                      <span>Light</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 items-center">
              <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition"
                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
              >
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </button>
              {userEmail && (
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/20 transition"
                  title="Log Out"
                >
                  <Power size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
