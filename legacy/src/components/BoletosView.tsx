import React, { useState } from 'react';
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Filter,
  Check,
} from 'lucide-react';
import { Despesa, User } from '../types';
import { toggleStatusDespesa } from '../services/storage';
import { hasPermission } from '../services/auth';

interface BoletosViewProps {
  despesas: Despesa[];
  currentUser: User;
  onDataChange: () => void;
  selectedMonth: string;
}

export const BoletosView: React.FC<BoletosViewProps> = ({
  despesas,
  currentUser,
  onDataChange,
  selectedMonth,
}) => {
  const [filterType, setFilterStatusType] = useState<'all' | 'overdue' | 'today' | 'upcoming'>('all');
  const canCompensar = hasPermission(currentUser.role, 'compensar_despesas');

  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date(todayStr);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Filter pending bills
  const pendingBills = despesas
    .filter((d) => selectedMonth === 'all' || d.dataVencimento.startsWith(selectedMonth))
    .filter((d) => d.status !== 'Compensado')
    .map((d) => {
      const vencDate = new Date(d.dataVencimento);
      const diffTime = vencDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...d, diffDays };
    })
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

  const overdueBills = pendingBills.filter((b) => b.diffDays < 0);
  const todayBills = pendingBills.filter((b) => b.diffDays === 0);
  const upcomingBills = pendingBills.filter((b) => b.diffDays > 0 && b.diffDays <= 7);

  const filtered = pendingBills.filter((b) => {
    if (filterType === 'overdue') return b.diffDays < 0;
    if (filterType === 'today') return b.diffDays === 0;
    if (filterType === 'upcoming') return b.diffDays > 0 && b.diffDays <= 7;
    return true;
  });

  const totalOverdueVal = overdueBills.reduce((acc, b) => acc + b.valor, 0);
  const totalTodayVal = todayBills.reduce((acc, b) => acc + b.valor, 0);
  const totalUpcomingVal = upcomingBills.reduce((acc, b) => acc + b.valor, 0);

  const handlePay = (id: string) => {
    toggleStatusDespesa(id, 'Compensado');
    onDataChange();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400" />
          <span>Controle de Boletos & Contas A Vencer</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Acompanhamento centralizado de obrigações com alerta de prazos de pagamento
        </p>
      </div>

      {/* KPI Interactive Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Atrasados */}
        <button
          onClick={() => setFilterStatusType(filterType === 'overdue' ? 'all' : 'overdue')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterType === 'overdue'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-400 dark:border-rose-700 ring-2 ring-rose-500/20 shadow-md'
              : 'bg-white dark:bg-[#12141a] border-slate-200 dark:border-slate-800/90 hover:border-rose-300 dark:hover:border-rose-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Atrasados ({overdueBills.length})</span>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatBRL(totalOverdueVal)}
          </p>
          <p className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold mt-1">
            Requer regularização imediata
          </p>
        </button>

        {/* Vencem Hoje */}
        <button
          onClick={() => setFilterStatusType(filterType === 'today' ? 'all' : 'today')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterType === 'today'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-700 ring-2 ring-amber-500/20 shadow-md'
              : 'bg-white dark:bg-[#12141a] border-slate-200 dark:border-slate-800/90 hover:border-amber-300 dark:hover:border-amber-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>Vencem Hoje ({todayBills.length})</span>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatBRL(totalTodayVal)}
          </p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-1">
            Data limite de pagamento hoje
          </p>
        </button>

        {/* Próximos 7 Dias */}
        <button
          onClick={() => setFilterStatusType(filterType === 'upcoming' ? 'all' : 'upcoming')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            filterType === 'upcoming'
              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20 shadow-md'
              : 'bg-white dark:bg-[#12141a] border-slate-200 dark:border-slate-800/90 hover:border-blue-300 dark:hover:border-blue-800 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              <span>Próximos 7 Dias ({upcomingBills.length})</span>
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {formatBRL(totalUpcomingVal)}
          </p>
          <p className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold mt-1">
            Previsão para a semana
          </p>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilterStatusType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'all'
              ? 'bg-black text-[#EED9C6] dark:bg-[#EED9C6] dark:text-black'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Todos os Pendentes ({pendingBills.length})
        </button>
        <button
          onClick={() => setFilterStatusType('overdue')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'overdue'
              ? 'bg-rose-600 text-white'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Atrasados ({overdueBills.length})
        </button>
        <button
          onClick={() => setFilterStatusType('today')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'today'
              ? 'bg-amber-600 text-white'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Vencem Hoje ({todayBills.length})
        </button>
        <button
          onClick={() => setFilterStatusType('upcoming')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            filterType === 'upcoming'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Semana ({upcomingBills.length})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 font-bold uppercase text-[10px] tracking-widest border-b border-slate-100 dark:border-slate-800/80">
              <tr>
                <th className="p-3.5">Fornecedor / Favorecido</th>
                <th className="p-3.5">Descrição</th>
                <th className="p-3.5">Categoria</th>
                <th className="p-3.5 font-bold text-rose-600 dark:text-rose-400">Valor (R$)</th>
                <th className="p-3.5">Vencimento</th>
                <th className="p-3.5">Prazo / Alerta</th>
                <th className="p-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum boleto encontrado para este filtro.
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const isLate = b.diffDays < 0;
                  const isDueToday = b.diffDays === 0;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {b.fornecedorOuFavorecido}
                        {b.parcela && (
                          <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-neutral-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            {b.parcela}
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {b.descricao}
                      </td>
                      <td className="p-3.5 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {b.categoria}
                      </td>
                      <td className="p-3.5 font-extrabold text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                        {formatBRL(b.valor)}
                      </td>
                      <td className="p-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {b.dataVencimento.split('-').reverse().join('/')}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        {isLate ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                            <span>Venceu há {Math.abs(b.diffDays)} dia(s)</span>
                          </span>
                        ) : isDueToday ? (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Vence Hoje</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Em {b.diffDays} dia(s)</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {canCompensar && (
                          <button
                            onClick={() => handlePay(b.id)}
                            className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all cursor-pointer active:scale-95 flex items-center space-x-1 ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Compensar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
