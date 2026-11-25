import ExcelJS from 'exceljs';
import { FaturamentoDiario, Despesa } from '../types';

export async function exportFinancialDataToExcel(
  faturamentos: FaturamentoDiario[],
  despesas: Despesa[],
  periodName: string = 'Relatório Geral'
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sistema de Fluxo de Caixa';
  workbook.created = new Date();

  // Helper for formatting currency in PT-BR
  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // 1. ABA RESUMO EXECUTIVO
  const sheetResumo = workbook.addWorksheet('Resumo Financeiro');

  sheetResumo.columns = [
    { header: 'Métrica / Categoria', key: 'metric', width: 35 },
    { header: 'Valor (R$)', key: 'value', width: 25 },
  ];

  const totalReceita = faturamentos.reduce(
    (acc, f) => acc + f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob,
    0
  );
  const totalDespesasPagas = despesas
    .filter((d) => d.status === 'Compensado')
    .reduce((acc, d) => acc + d.valor, 0);
  const totalDespesasPendentes = despesas
    .filter((d) => d.status !== 'Compensado')
    .reduce((acc, d) => acc + d.valor, 0);
  const saldoOperacional = totalReceita - totalDespesasPagas;

  sheetResumo.addRow({ metric: 'PERÍODO DO RELATÓRIO', value: periodName });
  sheetResumo.addRow({ metric: 'FATURAMENTO BRUTO TOTAL', value: formatCurrency(totalReceita) });
  sheetResumo.addRow({ metric: 'TOTAL DESPESAS COMPENSADAS (PAGAS)', value: formatCurrency(totalDespesasPagas) });
  sheetResumo.addRow({ metric: 'RESULTADO OPERACIONAL (LUCRO/SALDO)', value: formatCurrency(saldoOperacional) });
  sheetResumo.addRow({ metric: 'BOLETOS E CONTAS PENDENTES', value: formatCurrency(totalDespesasPendentes) });

  // Apply styles to header and metrics
  const headerRow = sheetResumo.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' }, size: 12 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '1E293B' }, // Dark Slate
  };

  // 2. ABA FATURAMENTO DIÁRIO
  const sheetFat = workbook.addWorksheet('Faturamento Diário');
  sheetFat.columns = [
    { header: 'Data', key: 'data', width: 15 },
    { header: 'Dinheiro (R$)', key: 'dinheiro', width: 15 },
    { header: 'Crédito (R$)', key: 'credito', width: 15 },
    { header: 'Débito (R$)', key: 'debito', width: 15 },
    { header: 'Pix (R$)', key: 'pix', width: 15 },
    { header: 'Voucher (R$)', key: 'voucher', width: 15 },
    { header: 'Sicoob (R$)', key: 'sicoob', width: 15 },
    { header: 'Total Dia (R$)', key: 'total', width: 18 },
    { header: 'Diferença Caixa', key: 'diferenca', width: 18 },
    { header: 'Observação', key: 'obs', width: 30 },
  ];

  const fatHeader = sheetFat.getRow(1);
  fatHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  fatHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '0F766E' }, // Emerald Teal
  };

  faturamentos.forEach((f) => {
    const totalDia = f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob;
    sheetFat.addRow({
      data: formatDateBR(f.data),
      dinheiro: f.dinheiro,
      credito: f.credito,
      debito: f.debito,
      pix: f.pix,
      voucher: f.voucher,
      sicoob: f.sicoob,
      total: totalDia,
      diferenca: f.diferencaCaixa,
      obs: f.observacao || '',
    });
  });

  // 3. ABA DESPESAS E FORNECEDORES
  const sheetDesp = workbook.addWorksheet('Lançamentos de Despesas');
  sheetDesp.columns = [
    { header: 'Descrição', key: 'desc', width: 35 },
    { header: 'Fornecedor / Favorecido', key: 'fornecedor', width: 28 },
    { header: 'Categoria', key: 'cat', width: 25 },
    { header: 'Forma Pagto', key: 'forma', width: 15 },
    { header: 'Valor (R$)', key: 'valor', width: 16 },
    { header: 'Vencimento', key: 'venc', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Data Pagamento', key: 'pagto', width: 15 },
    { header: 'Parcela / NF', key: 'nf', width: 15 },
  ];

  const despHeader = sheetDesp.getRow(1);
  despHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  despHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: '991B1B' }, // Dark Red
  };

  despesas.forEach((d) => {
    sheetDesp.addRow({
      desc: d.descricao,
      fornecedor: d.fornecedorOuFavorecido,
      cat: d.categoria,
      forma: d.formaPagamento,
      valor: d.valor,
      venc: formatDateBR(d.dataVencimento),
      status: d.status,
      pagto: d.dataPagamento ? formatDateBR(d.dataPagamento) : '-',
      nf: d.parcela ? `${d.parcela} (${d.numeroNF || ''})` : d.numeroNF || '-',
    });
  });

  // 4. ABA BOLETOS PENDENTES
  const sheetBoletos = workbook.addWorksheet('Boletos Pendentes');
  sheetBoletos.columns = [
    { header: 'Fornecedor', key: 'fornecedor', width: 30 },
    { header: 'Descrição', key: 'desc', width: 35 },
    { header: 'Valor (R$)', key: 'valor', width: 18 },
    { header: 'Data Vencimento', key: 'venc', width: 18 },
    { header: 'Forma Pagto', key: 'forma', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
  ];

  const bolHeader = sheetBoletos.getRow(1);
  bolHeader.font = { bold: true, color: { argb: 'FFFFFF' } };
  bolHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D97706' }, // Amber
  };

  const pending = despesas.filter((d) => d.status !== 'Compensado');
  pending.forEach((d) => {
    sheetBoletos.addRow({
      fornecedor: d.fornecedorOuFavorecido,
      desc: d.descricao,
      valor: d.valor,
      venc: formatDateBR(d.dataVencimento),
      forma: d.formaPagamento,
      status: d.status,
    });
  });

  // Generate and download buffer
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `Fluxo_de_Caixa_${periodName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
