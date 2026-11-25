import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  Calendar,
  RotateCcw,
  CheckCircle2,
  LogOut,
  UserPlus,
  Sun,
  Moon,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { User } from '../types';
import { getRoleBadgeClass, getRoleLabel } from '../services/auth';
import { resetDataToSeed, ThemeMode } from '../services/storage';
import { RhuaLogo } from './RhuaLogo';
import { isCloudConfigured } from '../services/supabase';

const UserAvatar: React.FC<{ user: User; className: string }> = ({ user, className }) => {
  if (user.avatar) {
    return <img src={user.avatar} alt={user.name} className={className} />;
  }

  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <span className={`${className} grid place-items-center bg-[#EED9C6] text-black font-black`} aria-label={user.name}>
      {initials || 'RH'}
    </span>
  );
};

interface NavbarProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  usersList: User[];
  notificationCount: number;
  onOpenNotifications: () => void;
  selectedMonth: string; // YYYY-MM or 'all'
  onMonthChange: (monthStr: string) => void;
  onOpenAuthScreen: () => void;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: (theme: ThemeMode) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onUserChange,
  usersList,
  notificationCount,
  onOpenNotifications,
  selectedMonth,
  onMonthChange,
  onOpenAuthScreen,
  onLogout,
  theme,
  onToggleTheme,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResetData = () => {
    if (window.confirm('Deseja restaurar os dados de demonstração iniciais do sistema?')) {
      resetDataToSeed();
      window.location.reload();
    }
  };

  // Month selector options
  const months = [
    { value: 'all', label: 'Todas as Datas' },
    { value: '2026-08', label: 'Agosto / 2026' },
    { value: '2026-07', label: 'Julho / 2026' },
    { value: '2026-06', label: 'Junho / 2026' },
    { value: '2026-05', label: 'Maio / 2026' },
    { value: '2026-04', label: 'Abril / 2026' },
    { value: '2026-03', label: 'Março / 2026' },
    { value: '2026-02', label: 'Fevereiro / 2026' },
    { value: '2026-01', label: 'Janeiro / 2026' },
  ];

  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-[#0a0b0e]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 text-slate-800 dark:text-white shadow-xs transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name - ADM RHUA */}
          <div className="flex items-center space-x-3 select-none">
            <div className="w-10 h-10 rounded-xl bg-black border border-[#8E765F]/40 dark:border-[#EED9C6]/40 flex items-center justify-center shadow-md text-[#EED9C6] shrink-0">
              <RhuaLogo variant="symbol" colorMode="sand" size="sm" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg sm:text-xl tracking-tight text-slate-950 dark:text-[#EED9C6] font-serif">
                  ADM RHUA
                </span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#8E765F]/10 dark:bg-[#EED9C6]/15 text-slate-900 dark:text-[#EED9C6] border border-[#8E765F]/30 dark:border-[#EED9C6]/30 font-bold uppercase tracking-wider hidden sm:inline-block">
                  RHUA BAR
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans tracking-wide hidden sm:block">
                Fluxo de Caixa & Gestão Financeira
              </p>
            </div>
          </div>

          {/* Unified Navbar Controls */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5">
            {/* Filter by Month */}
            <div className="relative flex items-center">
              <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 pointer-events-none" />
              <select
                id="period-select"
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className="bg-slate-100 dark:bg-[#14171e] hover:bg-slate-200/70 dark:hover:bg-[#1a1d26] text-slate-800 dark:text-slate-200 text-xs sm:text-sm pl-8.5 pr-8 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-[#8E765F] dark:focus:ring-[#EED9C6] cursor-pointer font-bold transition-all appearance-none"
              >
                {months.map((m) => (
                  <option
                    key={m.value}
                    value={m.value}
                    className="bg-white dark:bg-neutral-900 text-slate-900 dark:text-white"
                  >
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none" />
            </div>

            {/* Centralized Theme Switcher: Branco / Preto */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#14171e] border border-slate-200 dark:border-slate-800 shadow-inner">
              <button
                type="button"
                id="theme-btn-light"
                onClick={() => onToggleTheme('light')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  !isDark
                    ? 'bg-white text-slate-950 shadow-xs border border-slate-200 font-extrabold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Ativar Layout Branco"
              >
                <Sun className={`w-3.5 h-3.5 ${!isDark ? 'text-amber-500 fill-amber-500' : ''}`} />
                <span className="hidden md:inline">Branco</span>
              </button>

              <button
                type="button"
                id="theme-btn-dark"
                onClick={() => onToggleTheme('dark')}
                className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isDark
                    ? 'bg-black text-[#EED9C6] shadow-xs border border-[#EED9C6]/30 font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Ativar Layout Preto"
              >
                <Moon className={`w-3.5 h-3.5 ${isDark ? 'text-[#EED9C6] fill-[#EED9C6]' : ''}`} />
                <span className="hidden md:inline">Preto</span>
              </button>
            </div>

            {/* Notification Bell with Badge */}
            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-[#14171e] hover:bg-slate-200/70 dark:hover:bg-[#1a1d26] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
              title="Notificações & Vencimentos"
            >
              <Bell className="w-4 h-4" />
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
                  {notificationCount}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                id="user-profile-menu-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center space-x-2 p-1.5 rounded-xl bg-slate-100 dark:bg-[#14171e] hover:bg-slate-200/70 dark:hover:bg-[#1a1d26] border border-slate-200 dark:border-slate-800 transition-all cursor-pointer"
              >
                <UserAvatar user={currentUser} className="w-7 h-7 rounded-lg object-cover ring-2 ring-[#8E765F]/30 dark:ring-[#EED9C6]/30 text-[10px]" />
                <div className="text-left hidden lg:block pr-1">
                  <p className="text-xs font-bold leading-none text-slate-900 dark:text-slate-100">
                    {currentUser.name}
                  </p>
                  <span className="text-[10px] text-[#8E765F] dark:text-[#EED9C6] font-semibold leading-tight">
                    {getRoleLabel(currentUser.role)}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 hidden sm:block" />
              </button>

              {/* Enhanced Dropdown Menu */}
              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-slate-800 dark:text-slate-200">
                  <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center space-x-2.5">
                      <UserAvatar user={currentUser} className="w-9 h-9 rounded-xl object-cover ring-2 ring-[#8E765F]/30 dark:ring-[#EED9C6]/30 text-xs shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                          {currentUser.email}
                        </p>
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold border ${getRoleBadgeClass(
                            currentUser.role
                          )}`}
                        >
                          {getRoleLabel(currentUser.role)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isCloudConfigured && <div className="px-4 pt-2.5 pb-1">
                    <p className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Alternar Perfil Ativo
                    </p>
                  </div>}

                  {!isCloudConfigured && <div className="py-1 max-h-48 overflow-y-auto">
                    {usersList.map((usr) => (
                      <button
                        key={usr.id}
                        onClick={() => {
                          onUserChange(usr);
                          setShowUserDropdown(false);
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center space-x-3 hover:bg-slate-50 dark:hover:bg-neutral-800/60 transition-colors cursor-pointer ${
                          usr.id === currentUser.id
                            ? 'bg-slate-100 dark:bg-neutral-800/80 font-bold border-l-2 border-slate-900 dark:border-[#EED9C6]'
                            : ''
                        }`}
                      >
                        <img
                          src={usr.avatar}
                          alt={usr.name}
                          className="w-6 h-6 rounded-md object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-900 dark:text-slate-100 truncate">
                            {usr.name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                            {getRoleLabel(usr.role)}
                          </p>
                        </div>
                        {usr.id === currentUser.id && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-900 dark:text-[#EED9C6]" />
                        )}
                      </button>
                    ))}
                  </div>}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 px-3 space-y-1.5">
                    {!isCloudConfigured && <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onOpenAuthScreen();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-100 dark:bg-neutral-800/70 hover:bg-slate-200 dark:hover:bg-neutral-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/60"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Tela de Login / Cadastro</span>
                    </button>}

                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors cursor-pointer border border-rose-200 dark:border-rose-800/40"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sair do Sistema</span>
                    </button>

                    {!isCloudConfigured && <button
                      onClick={handleResetData}
                      className="w-full py-1.5 px-3 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-[10px] flex items-center justify-center space-x-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Restaurar Dados Iniciais</span>
                    </button>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
