import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Scale,
  AlertCircle,
  Plus,
  ArrowUpRight,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { FaturamentoDiario, Despesa } from '../types';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  faturamentos: FaturamentoDiario[];
  despesas: Despesa[];
  selectedMonth: string;
  onNavigate?: (tab: ActiveTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  faturamentos,
  despesas,
  selectedMonth,
  onNavigate,
}) => {
  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  // Filter based on selected month (YYYY-MM or 'all')
  const filteredFat = faturamentos.filter((f) =>
    selectedMonth === 'all' ? true : f.data.startsWith(selectedMonth)
  );

  const filteredDesp = despesas.filter((d) =>
    selectedMonth === 'all' ? true : d.dataVencimento.startsWith(selectedMonth)
  );

  // 1. Total Receita (Faturamento Bruto)
  const totalReceita = filteredFat.reduce(
    (acc, cur) =>
      acc +
      (cur.dinheiro || 0) +
      (cur.credito || 0) +
      (cur.debito || 0) +
      (cur.pix || 0) +
      (cur.voucher || 0) +
      (cur.sicoob || 0),
    0
  );

  // 2. Total Despesas (Compensadas vs Pendentes)
  const totalDespesasPagas = filteredDesp
    .filter((d) => d.status === 'Compensado')
    .reduce((acc, cur) => acc + cur.valor, 0);

  const totalDespesasPendentes = filteredDesp
    .filter((d) => d.status !== 'Compensado')
    .reduce((acc, cur) => acc + cur.valor, 0);

  // 3. Resultado Operacional (Lucro Realizado)
  const resultadoOperacional = totalReceita - totalDespesasPagas;

  // 4. Payment breakdown pie
  const paymentBreakdown = {
    Pix: filteredFat.reduce((acc, cur) => acc + (cur.pix || 0), 0),
    Crédito: filteredFat.reduce((acc, cur) => acc + (cur.credito || 0), 0),
    Débito: filteredFat.reduce((acc, cur) => acc + (cur.debito || 0), 0),
    Dinheiro: filteredFat.reduce((acc, cur) => acc + (cur.dinheiro || 0), 0),
    Sicoob: filteredFat.reduce((acc, cur) => acc + (cur.sicoob || 0), 0),
    Voucher: filteredFat.reduce((acc, cur) => acc + (cur.voucher || 0), 0),
  };

  const piePaymentData = Object.entries(paymentBreakdown)
    .filter(([_, value]) => value > 0)
    .map(([name, value]) => ({ name, value }));

  const PIE_COLORS = [
    '#10b981',
    '#3b82f6',
    '#8b5cf6',
    '#f59e0b',
    '#ec4899',
    '#06b6d4',
  ];

  // Daily Cash Flow Chart Data
  const dailyFlowMap: Record<string, { data: string; Receita: number; Despesa: number }> = {};

  filteredFat.forEach((f) => {
    const day = f.data;
    if (!dailyFlowMap[day]) {
      dailyFlowMap[day] = { data: day, Receita: 0, Despesa: 0 };
    }
    dailyFlowMap[day].Receita += f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob;
  });

  filteredDesp.forEach((d) => {
    const day = d.dataVencimento;
    if (!dailyFlowMap[day]) {
      dailyFlowMap[day] = { data: day, Receita: 0, Despesa: 0 };
    }
    if (d.status === 'Compensado') {
      dailyFlowMap[day].Despesa += d.valor;
    }
  });

  const dailyChartData = Object.values(dailyFlowMap)
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(-15)
    .map((item) => ({
      ...item,
      displayDate: item.data.split('-').slice(1).reverse().join('/'),
    }));

  // Urgent pending bills preview
  const pendingBoletosList = filteredDesp
    .filter((d) => d.status !== 'Compensado')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
    .slice(0, 4);

  // Recent transactions preview
  const recentFatList = filteredFat
    .sort((a, b) => b.data.localeCompare(a.data))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Top Bento Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bento 1: Saldo / Resultado Operacional */}
        <div className="bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Saldo / Resultado
            </span>
            <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Scale className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3
              className={`text-2xl font-extrabold tracking-tight ${
                resultadoOperacional >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatBRL(resultadoOperacional)}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
              {resultadoOperacional >= 0 ? '+ Lucro no período' : '- Déficit no período'}
            </p>
          </div>
        </div>

        {/* Bento 2: Entradas / Faturamento Bruto */}
        <div className="bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Entradas (Mês)
            </span>
            <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatBRL(totalReceita)}
            </h3>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{filteredFat.length} lançamentos de faturamento</span>
            </p>
          </div>
        </div>

        {/* Bento 3: Saídas / Despesas Pagas */}
        <div className="bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Saídas (Mês)
            </span>
            <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {formatBRL(totalDespesasPagas)}
            </h3>
            <p className="text-xs text-rose-500 dark:text-rose-400 font-medium mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{formatBRL(totalDespesasPendentes)} em boletos a vencer</span>
            </p>
          </div>
        </div>

        {/* Bento 4: Action Card RHUA Style */}
        <div
          onClick={() => onNavigate && onNavigate('faturamento')}
          className="bg-black rounded-2xl p-5 shadow-lg border border-[#8E765F]/30 dark:border-[#EED9C6]/30 flex items-center justify-center hover:bg-neutral-900 transition-all cursor-pointer group text-[#EED9C6]"
        >
          <div className="text-center">
            <div className="w-10 h-10 bg-[#EED9C6]/15 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6 text-[#EED9C6]" />
            </div>
            <p className="font-extrabold text-sm text-[#EED9C6]">Novo Lançamento</p>
            <p className="text-[#DFC7B0] text-[10px] uppercase tracking-widest font-semibold mt-0.5">
              Entrada / Caixa
            </p>
          </div>
        </div>
      </div>

      {/* Middle Bento Row: Main Chart & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento 5: Dynamic Cash Flow Chart */}
        <div className="lg:col-span-8 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Fluxo de Caixa Dinâmico
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Acompanhamento em tempo real das entradas e saídas
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">Entradas</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/60 rounded-full">
                <div className="w-2 h-2 bg-rose-500 rounded-full" />
                <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase">Saídas</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
                <XAxis dataKey="displayDate" stroke="#64748b" fontSize={11} />
                <YAxis
                  stroke="#64748b"
                  fontSize={10}
                  tickFormatter={(v) => `R$ ${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#12141a',
                    borderColor: '#334155',
                    borderRadius: '1rem',
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.3)',
                  }}
                  formatter={(val: any) => [formatBRL(Number(val)), '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="Receita"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorReceita)"
                />
                <Area
                  type="monotone"
                  dataKey="Despesa"
                  stroke="#f43f5e"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorDespesa)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bento 6: Notificações e Boletos Próximos */}
        <div className="lg:col-span-4 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xs flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-neutral-900/50">
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>Contas & Vencimentos</span>
            </h2>
            <span className="bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border border-rose-200 dark:border-rose-800">
              {pendingBoletosList.length} Pendentes
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {pendingBoletosList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                Nenhum boleto pendente neste período!
              </div>
            ) : (
              pendingBoletosList.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 items-start p-3 bg-slate-50 dark:bg-neutral-900 hover:bg-slate-100 dark:hover:bg-neutral-800/80 rounded-xl border border-slate-100 dark:border-slate-800/80 transition-colors"
                >
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-700 dark:text-amber-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.fornecedorOuFavorecido}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Vencimento: {item.dataVencimento.split('-').reverse().join('/')}
                    </p>
                  </div>
                  <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                    {formatBRL(item.valor)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-neutral-900/50 text-center">
            <button
              onClick={() => onNavigate && onNavigate('boletos')}
              className="text-slate-900 dark:text-[#EED9C6] font-bold text-xs hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos os boletos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bento Row: Payment Breakdown & Recent List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bento 7: Payment Methods Pie */}
        <div className="lg:col-span-5 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
              Meios de Pagamento
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Distribuição do faturamento por forma de recebimento
            </p>

            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={piePaymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {piePaymentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#12141a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      color: '#f8fafc',
                    }}
                    formatter={(val: any) => [formatBRL(Number(val)), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
            {piePaymentData.map((item, idx) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                />
                <span className="text-slate-600 dark:text-slate-400 truncate">{item.name}:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {((item.value / (totalReceita || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 8: Recent Faturamento List */}
        <div className="lg:col-span-7 bg-white dark:bg-[#12141a] rounded-2xl border border-slate-200 dark:border-slate-800/90 shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Lançamentos Recentes de Caixa
              </h2>
              <button
                onClick={() => onNavigate && onNavigate('faturamento')}
                className="text-slate-900 dark:text-[#EED9C6] font-bold text-xs hover:underline cursor-pointer"
              >
                Ver todos
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-neutral-900 border-b border-slate-100 dark:border-slate-800/80">
                  <tr className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    <th className="px-6 py-3">Data</th>
                    <th className="px-6 py-3">Pix</th>
                    <th className="px-6 py-3">Cartões</th>
                    <th className="px-6 py-3 text-right">Total Dia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs text-slate-700 dark:text-slate-300">
                  {recentFatList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400">
                        Nenhum lançamento no período.
                      </td>
                    </tr>
                  ) : (
                    recentFatList.map((f) => {
                      const dayTotal =
                        f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob;
                      return (
                        <tr key={f.id} className="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50 transition-colors">
                          <td className="px-6 py-3 font-semibold text-slate-800 dark:text-slate-200">
                            {f.data.split('-').reverse().join('/')}
                          </td>
                          <td className="px-6 py-3 font-medium text-emerald-600 dark:text-emerald-400">
                            {formatBRL(f.pix)}
                          </td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-400">
                            {formatBRL(f.credito + f.debito)}
                          </td>
                          <td className="px-6 py-3 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                            + {formatBRL(dayTotal)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-neutral-900 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              Sincronizado em tempo real
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {filteredFat.length} dias computados
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
