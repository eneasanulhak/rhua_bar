import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Receipt,
  AlertCircle,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { User } from '../types';
import { hasPermission } from '../services/auth';

export type ActiveTab = 
  | 'dashboard' 
  | 'faturamento' 
  | 'despesas' 
  | 'boletos' 
  | 'extras' 
  | 'relatorios' 
  | 'usuarios';

interface MenuItem {
  id: ActiveTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentUser: User;
  pendingBillsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  currentUser,
  pendingBillsCount,
}) => {
  const canManageUsers = hasPermission(currentUser.role, 'manage_users');

  const menuSections: MenuSection[] = [
    {
      title: 'Visão Geral',
      items: [
        {
          id: 'dashboard',
          label: 'Painel & DRE',
          sublabel: 'Fluxo de caixa e indicadores',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'Financeiro & Caixa',
      items: [
        {
          id: 'faturamento',
          label: 'Faturamento Diário',
          sublabel: 'Entradas por meio de pagamento',
          icon: TrendingUp,
        },
        {
          id: 'despesas',
          label: 'Despesas & Compras',
          sublabel: 'Contas, fornecedores e custos',
          icon: Receipt,
        },
        {
          id: 'boletos',
          label: 'Boletos & Vencimentos',
          sublabel: 'Controle de pagamentos',
          icon: AlertCircle,
          badge: pendingBillsCount > 0 ? pendingBillsCount : undefined,
          badgeColor: 'amber',
        },
      ],
    },
    {
      title: 'Operação',
      items: [
        {
          id: 'extras',
          label: 'Pagamento de Extras',
          sublabel: 'Diárias da equipe de apoio',
          icon: Users,
        },
      ],
    },
    {
      title: 'Gestão & Documentos',
      items: [
        {
          id: 'relatorios',
          label: 'Relatórios & Exportação',
          sublabel: 'Gerador Excel e PDF',
          icon: FileSpreadsheet,
        },
        ...(canManageUsers
          ? [
              {
                id: 'usuarios' as ActiveTab,
                label: 'Usuários & Permissões',
                sublabel: 'Níveis de acesso e segurança',
                icon: ShieldCheck,
              },
            ]
          : []),
      ],
    },
  ];

  return (
    <aside className="w-full lg:w-68 bg-white dark:bg-[#0e1015] rounded-2xl border border-slate-200/90 dark:border-slate-800/90 text-slate-800 dark:text-slate-100 flex-shrink-0 flex flex-col justify-between shadow-xs p-3.5 gap-6 transition-colors duration-200">
      {/* Structured Navigation Groups */}
      <div className="space-y-5">
        {menuSections.map((section, secIdx) => (
          <div key={secIdx} className="space-y-1.5">
            <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center justify-between">
              <span>{section.title}</span>
            </div>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    onClick={() => onTabChange(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all cursor-pointer group text-left ${
                      isActive
                        ? 'bg-black text-[#EED9C6] dark:bg-[#181a20] dark:text-[#EED9C6] font-bold shadow-sm border border-[#8E765F]/40 dark:border-[#EED9C6]/30'
                        : 'hover:bg-slate-100 dark:hover:bg-neutral-800/60 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 transition-all ${
                          isActive
                            ? 'bg-[#EED9C6] text-black shadow-xs font-black'
                            : 'bg-slate-100 dark:bg-neutral-800/80 text-slate-500 dark:text-slate-400 group-hover:text-black dark:group-hover:text-[#EED9C6] group-hover:bg-slate-200 dark:group-hover:bg-neutral-700'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 pr-1">
                        <p className="text-xs font-bold leading-tight truncate">
                          {item.label}
                        </p>
                        <p
                          className={`text-[10px] leading-tight truncate mt-0.5 ${
                            isActive
                              ? 'text-[#DFC7B0] dark:text-[#EED9C6]/80 font-medium'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {item.sublabel}
                        </p>
                      </div>
                    </div>

                    {item.badge !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                          isActive
                            ? 'bg-amber-400 text-black shadow-xs'
                            : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700/80'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Clean, Non-Duplicated Sidebar Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="p-3 bg-slate-50 dark:bg-neutral-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-none truncate">
                ADM RHUA Online
              </p>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                Sincronizado • v2.4
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#8E765F]/10 dark:bg-[#EED9C6]/10 text-[#8E765F] dark:text-[#EED9C6] border border-[#8E765F]/20 dark:border-[#EED9C6]/20">
            PRO
          </span>
        </div>
      </div>
    </aside>
  );
};
