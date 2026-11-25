import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaturamentoDiario, Despesa } from '../types';

export function exportFinancialDataToPdf(
  faturamentos: FaturamentoDiario[],
  despesas: Despesa[],
  periodName: string = 'Relatório Geral'
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const formatCurrency = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Header Banner
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO FINANCEIRO & FLUXO DE CAIXA', 14, 15);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Período: ${periodName} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 23);

  // Key Financial Summary Cards
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

  let y = 42;

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. RESUMO OPERACIONAL', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Métrica Financeira', 'Valor']],
    body: [
      ['Total Faturamento Bruto', formatCurrency(totalReceita)],
      ['Total Despesas Pagas (Compensadas)', formatCurrency(totalDespesasPagas)],
      ['Resultado Operacional (Lucro Líquido)', formatCurrency(saldoOperacional)],
      ['Boletos / Contas Pendentes a Pagar', formatCurrency(totalDespesasPendentes)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  // @ts-expect-error lastAutoTable property on jsPDF
  y = doc.lastAutoTable.finalY + 12;

  // 2. BOLETOS PENDENTES DESTACADOS
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. CONTAS E BOLETOS PENDENTES (A VENCER / ATRASADOS)', 14, y);
  y += 6;

  const pendingDespesas = despesas.filter((d) => d.status !== 'Compensado');

  if (pendingDespesas.length === 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100);
    doc.text('Nenhum boleto ou conta pendente no período selecionado.', 14, y + 2);
    y += 10;
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Fornecedor / Favorecido', 'Descrição', 'Valor', 'Vencimento', 'Status']],
      body: pendingDespesas.map((d) => [
        d.fornecedorOuFavorecido,
        d.descricao,
        formatCurrency(d.valor),
        formatDateBR(d.dataVencimento),
        d.status,
      ]),
      theme: 'striped',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2.5 },
    });

    // @ts-expect-error lastAutoTable
    y = doc.lastAutoTable.finalY + 12;
  }

  // Check page height before adding Faturamento table
  if (y > 220) {
    doc.addPage();
    y = 20;
  }

  // 3. DETALHAMENTO DE FATURAMENTO
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('3. DETALHAMENTO DO FATURAMENTO DIÁRIO', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Dinheiro', 'Cartões (Créd./Déb.)', 'Pix', 'Total Dia', 'Diferença Caixa']],
    body: faturamentos.map((f) => {
      const totalDia = f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob;
      return [
        formatDateBR(f.data),
        formatCurrency(f.dinheiro),
        formatCurrency(f.credito + f.debito),
        formatCurrency(f.pix),
        formatCurrency(totalDia),
        f.diferencaCaixa !== 0 ? formatCurrency(f.diferencaCaixa) : '0,00',
      ];
    }),
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    styles: { fontSize: 8.5, cellPadding: 2 },
  });

  // Footer / Page numbers
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      `Página ${i} de ${pageCount} | Sistema de Fluxo de Caixa Financeiro`,
      105,
      288,
      { align: 'center' }
    );
  }

  doc.save(`Relatorio_Financeiro_${periodName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
