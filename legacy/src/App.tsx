import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { FaturamentoView } from './components/FaturamentoView';
import { DespesasView } from './components/DespesasView';
import { BoletosView } from './components/BoletosView';
import { FolhaPagamentoView } from './components/FolhaPagamentoView';
import { RelatoriosView } from './components/RelatoriosView';
import { UserManagementView } from './components/UserManagementView';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthScreen } from './components/AuthScreen';
import {
  getFaturamentoList,
  getDespesasList,
  getUsersList,
  getCurrentUser,
  setCurrentUser,
  subscribeToStore,
  isAuthSessionActive,
  setAuthSessionActive,
  logoutUser,
  getThemePreference,
  setThemePreference,
  ThemeMode,
} from './services/storage';
import { calculatePendingNotifications } from './services/notifications';
import { FaturamentoDiario, Despesa, User, NotificationItem } from './types';
import { isCloudConfigured, supabase } from './services/supabase';

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>(() => getThemePreference());
  const [currentUserState, setCurrentUserState] = useState<User>(getCurrentUser());
  const [usersList, setUsersList] = useState<User[]>(getUsersList());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [faturamentos, setFaturamentos] = useState<FaturamentoDiario[]>(getFaturamentoList());
  const [despesas, setDespesas] = useState<Despesa[]>(getDespesasList());
  const [notifications, setNotifications] = useState<NotificationItem[]>(calculatePendingNotifications());
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Apply theme to document html & body
  useEffect(() => {
    const isDark = theme === 'dark';
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
    }
  }, [theme]);

  const handleToggleTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setThemePreference(newTheme);
  };

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !isCloudConfigured && isAuthSessionActive();
  });
  const [showAuthPortal, setShowAuthPortal] = useState(false);

  useEffect(() => {
    if (!isCloudConfigured || !supabase) return;
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active || !data.session?.user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role, avatar_url')
        .eq('id', data.session.user.id)
        .single();
      if (!active || !profile) return;
      const user: User = {
        id: data.session.user.id,
        name: profile.name,
        email: data.session.user.email ?? '',
        role: profile.role,
        avatar: profile.avatar_url ?? undefined,
      };
      setCurrentUser(user);
      setCurrentUserState(user);
      setAuthSessionActive(true);
      setIsAuthenticated(true);
    });
    return () => { active = false; };
  }, []);

  const refreshData = () => {
    setFaturamentos(getFaturamentoList());
    setDespesas(getDespesasList());
    setUsersList(getUsersList());
    setCurrentUserState(getCurrentUser());
    setNotifications(calculatePendingNotifications());
    setIsAuthenticated(isAuthSessionActive());
    setTheme(getThemePreference());
  };

  useEffect(() => {
    const unsubscribe = subscribeToStore(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const handleUserChange = (newUser: User) => {
    setCurrentUser(newUser);
    setCurrentUserState(newUser);
    setAuthSessionActive(true);
    setIsAuthenticated(true);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUserState(user);
    setIsAuthenticated(true);
    setShowAuthPortal(false);
  };

  const handleLogout = () => {
    void supabase?.auth.signOut();
    logoutUser();
    setIsAuthenticated(false);
    setShowAuthPortal(true);
  };

  // Pending bills count for sidebar badge
  const pendingBillsCount = despesas.filter(
    (d) => d.status !== 'Compensado' && (selectedMonth === 'all' || d.dataVencimento.startsWith(selectedMonth))
  ).length;

  // Render Auth Portal if unauthenticated or explicitly requested
  if (!isAuthenticated || showAuthPortal) {
    return (
      <div className={theme === 'dark' ? 'dark' : ''}>
        <AuthScreen
          onLoginSuccess={handleLoginSuccess}
          theme={theme}
          onToggleTheme={handleToggleTheme}
        />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''} bg-[#f8fafc] dark:bg-[#080a0f] text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200`}>
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUserState}
        onUserChange={handleUserChange}
        usersList={usersList}
        notificationCount={notifications.length}
        onOpenNotifications={() => setIsNotificationOpen(true)}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        onOpenAuthScreen={() => setShowAuthPortal(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Nav */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          currentUser={currentUserState}
          pendingBillsCount={pendingBillsCount}
        />

        {/* View Viewport */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <Dashboard
              faturamentos={faturamentos}
              despesas={despesas}
              selectedMonth={selectedMonth}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'faturamento' && (
            <FaturamentoView
              faturamentos={faturamentos}
              currentUser={currentUserState}
              onDataChange={refreshData}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'despesas' && (
            <DespesasView
              despesas={despesas}
              currentUser={currentUserState}
              onDataChange={refreshData}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'boletos' && (
            <BoletosView
              despesas={despesas}
              currentUser={currentUserState}
              onDataChange={refreshData}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'extras' && (
            <FolhaPagamentoView
              currentUser={currentUserState}
              selectedMonth={selectedMonth}
              onDataChange={refreshData}
            />
          )}

          {activeTab === 'relatorios' && (
            <RelatoriosView
              faturamentos={faturamentos}
              despesas={despesas}
              currentUser={currentUserState}
              onDataChange={refreshData}
              selectedMonth={selectedMonth}
            />
          )}

          {activeTab === 'usuarios' && (
            <UserManagementView
              currentUser={currentUserState}
              onDataChange={refreshData}
            />
          )}
        </main>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        notifications={notifications}
        onDataChange={refreshData}
      />
    </div>
  );
}
