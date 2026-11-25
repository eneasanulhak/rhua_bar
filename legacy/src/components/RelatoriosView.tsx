import React from 'react';
import { FileSpreadsheet, FileText, Download, CheckCircle2, DollarSign } from 'lucide-react';
import { FaturamentoDiario, Despesa, User } from '../types';
import { exportFinancialDataToExcel } from '../services/exportExcel';
import { exportFinancialDataToPdf } from '../services/exportPdf';
import { hasPermission } from '../services/auth';

interface RelatoriosViewProps {
  faturamentos: FaturamentoDiario[];
  despesas: Despesa[];
  currentUser: User;
  selectedMonth: string;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({
  faturamentos,
  despesas,
  currentUser,
  selectedMonth,
}) => {
  const canExport = hasPermission(currentUser.role, 'export_reports');

  const filteredFat = faturamentos.filter(
    (f) => selectedMonth === 'all' || f.data.startsWith(selectedMonth)
  );
  const filteredDesp = despesas.filter(
    (d) => selectedMonth === 'all' || d.dataVencimento.startsWith(selectedMonth)
  );

  const totalReceita = filteredFat.reduce(
    (acc, f) => acc + f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob,
    0
  );
  const totalDespesasPagas = filteredDesp
    .filter((d) => d.status === 'Compensado')
    .reduce((acc, d) => acc + d.valor, 0);
  const totalDespesasPendentes = filteredDesp
    .filter((d) => d.status !== 'Compensado')
    .reduce((acc, d) => acc + d.valor, 0);

  const handleExportExcel = () => {
    const periodName = selectedMonth === 'all' ? 'Todas as Datas' : selectedMonth;
    exportFinancialDataToExcel(filteredFat, filteredDesp, periodName);
  };

  const handleExportPdf = () => {
    const periodName = selectedMonth === 'all' ? 'Todas as Datas' : selectedMonth;
    exportFinancialDataToPdf(filteredFat, filteredDesp, periodName);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-[#8E765F] dark:text-[#EED9C6]" />
          <span>Central de Relatórios & Exportação</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Gere demonstrativos financeiros em Excel (.xlsx) e relatórios em PDF formatados
        </p>
      </div>

      {/* Export Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Excel Export Card */}
        <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs hover:border-[#8E765F] dark:hover:border-[#EED9C6] transition-colors">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Relatório Completo Excel (.XLSX)</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Planilha multi-abas estruturada com Resumo Executivo, Faturamento Diário discriminado por meio de pagamento, Lançamentos de Despesas e Aba exclusiva de Boletos Pendentes.
            </p>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={!canExport}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Planilha Excel (.xlsx)</span>
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-6 rounded-2xl flex flex-col justify-between space-y-4 shadow-xs hover:border-[#8E765F] dark:hover:border-[#EED9C6] transition-colors">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-200 dark:border-rose-800">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Demonstrativo PDF Operacional</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Documento oficial em PDF para impressão ou envio por e-mail com quadros de resumo de lucros, faturamento detalhado e boletos a vencer destacados.
            </p>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={!canExport}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Baixar Documento PDF (.pdf)</span>
          </button>
        </div>
      </div>

      {/* Report Preview Summary Bento Box */}
      <div className="bg-white dark:bg-[#12141a] border border-slate-200 dark:border-slate-800/90 p-5 rounded-2xl shadow-xs space-y-3">
        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Prévia do Período Selecionado ({selectedMonth === 'all' ? 'Todas as Datas' : selectedMonth})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Faturamento Bruto</p>
            <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Despesas Compensadas</p>
            <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
              R$ {totalDespesasPagas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-neutral-900 border border-slate-100 dark:border-slate-800 rounded-xl">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Boletos Pendentes</p>
            <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1">
              R$ {totalDespesasPendentes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
