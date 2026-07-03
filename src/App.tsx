import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase, isSupabaseConnected } from './lib/database';

// Import Views
import Dashboard from './views/Dashboard';
import DocumentList from './views/DocumentList';
import CustomerList from './views/CustomerList';
import ServiceList from './views/ServiceList';
import Settings from './views/Settings';
import Auth from './views/Auth';

// Import Components
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/DocumentEditor';
import DocumentDetail from './views/DocumentDetail';

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [userSession, setUserSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Initialize theme from system preference or local storage
  useEffect(() => {
    const savedTheme = localStorage.getItem('dg_theme') as 'light' | 'dark';
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  const handleSetTheme = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    localStorage.setItem('dg_theme', nextTheme);
  };

  // Auth session initialization
  useEffect(() => {
    async function initAuth() {
      const supabaseActive = isSupabaseConnected();
      
      if (supabaseActive && supabase) {
        // Real Supabase Session Fetching
        try {
          const { data: { session } } = await supabase.auth.getSession();
          setUserSession(session);

          const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserSession(session);
          });

          return () => {
            authListener.subscription.unsubscribe();
          };
        } catch (err) {
          console.error('Failed to get Supabase session:', err);
        } finally {
          setAuthLoading(false);
        }
      } else {
        // Local Storage Session Fallback
        const localUser = localStorage.getItem('dg_user');
        if (localUser) {
          try {
            setUserSession(JSON.parse(localUser));
          } catch (e) {
            localStorage.removeItem('dg_user');
          }
        }
        setAuthLoading(false);
      }
    }
    initAuth();
  }, []);

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem('dg_user');
    if (isSupabaseConnected() && supabase) {
      supabase.auth.signOut();
    }
  };

  if (authLoading) {
    return (
      <div className="min-screen h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-200">
        <div className="w-12 h-12 rounded-xl bg-blue-600 animate-bounce flex items-center justify-center text-white font-black text-2xl shadow-lg">
          DG
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Loading System Context...</p>
      </div>
    );
  }

  const userEmail = userSession?.user?.email;

  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-150">
        
        {/* Persistent App Navigation Sidebar */}
        <Sidebar 
          theme={theme} 
          setTheme={handleSetTheme} 
          userEmail={userEmail} 
          onLogout={handleLogout} 
        />

        {/* Core Screen Route mounting */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/documents" element={<DocumentList />} />
            <Route path="/documents/new" element={<DocumentEditor />} />
            <Route path="/documents/:id" element={<DocumentDetail />} />
            <Route path="/documents/:id/edit" element={<DocumentEditor />} />
            <Route path="/customers" element={<CustomerList />} />
            <Route path="/services" element={<ServiceList />} />
            <Route path="/settings" element={<Settings />} />
            <Route 
              path="/auth" 
              element={<Auth userSession={userSession} setUserSession={setUserSession} />} 
            />
            {/* Catch-all redirect to Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
