/**
 * Geração dos relatórios Excel e PDF no navegador.
 * Este módulo é carregado sob demanda (import dinâmico) para não pesar no carregamento do app.
 */
import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Despesa, Dre, Extra, Faturamento } from '@/types'
import { linhasDre, nomePeriodo } from '@/utils/dre'
import { brl, dateBR, today } from '@/utils/format'

export interface DadosRelatorio {
  mes: string
  dre: Dre
  faturamentos: Faturamento[]
  despesas: Despesa[]
  extras: Extra[]
}

const ESCURO = '1E293B' // slate-800, mesmo cabeçalho do relatório antigo
const MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00'

const totalDia = (f: Faturamento) => f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob
const pendentes = (despesas: Despesa[]) =>
  despesas.filter((d) => d.status !== 'Compensado').sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))

function nomeArquivo(mes: string, ext: string) {
  const periodo = mes && mes !== 'all' ? mes : 'todos-os-meses'
  return `Relatorio_RHUA_${periodo}_gerado-${today()}.${ext}`
}

function baixar(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  a.click()
  URL.revokeObjectURL(url)
}

// --- Excel ---------------------------------------------------------------------

type Coluna = { header: string; key: string; width: number; moeda?: boolean }

function aba(wb: ExcelJS.Workbook, nome: string, colunas: Coluna[], linhas: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(nome, { views: [{ state: 'frozen', ySplit: 1 }] })
  ws.columns = colunas.map(({ header, key, width }) => ({ header, key, width }))
  ws.addRows(linhas)
  const cabecalho = ws.getRow(1)
  cabecalho.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  cabecalho.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${ESCURO}` } }
  colunas.forEach((c, i) => {
    if (c.moeda) ws.getColumn(i + 1).numFmt = MOEDA
  })
  if (linhas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } }
  return ws
}

export async function exportarExcel({ mes, dre, faturamentos, despesas, extras }: DadosRelatorio) {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ADM RHUA'
  wb.created = new Date()

  const wsDre = aba(
    wb,
    'DRE',
    [
      { header: `DRE · ${nomePeriodo(mes)}`, key: 'rotulo', width: 40 },
      { header: 'Resultado (competência)', key: 'competencia', width: 24, moeda: true },
      { header: 'Caixa (já pago)', key: 'caixa', width: 20, moeda: true },
    ],
    linhasDre(dre, true).map((l) => ({ ...l, rotulo: l.tipo === 'detalhe' ? `    ${l.rotulo}` : l.rotulo })),
  )
  linhasDre(dre, true).forEach((l, i) => {
    if (l.tipo !== 'detalhe') wsDre.getRow(i + 2).font = { bold: true }
  })
  wsDre.addRow([])
  wsDre.addRow({ rotulo: 'A pagar no período', competencia: dre.aPagar })
  wsDre.addRow({ rotulo: 'Diferença de caixa (não incluída)', competencia: dre.faturamento.diferencaCaixa })
  wsDre.autoFilter = undefined

  aba(
    wb,
    'Faturamento Diário',
    [
      { header: 'Data', key: 'data', width: 12 },
      ...(['Dinheiro', 'Crédito', 'Débito', 'Pix', 'Voucher', 'Sicoob'] as const).map((h) => ({
        header: h,
        key: h,
        width: 14,
        moeda: true,
      })),
      { header: 'Total do dia', key: 'total', width: 16, moeda: true },
      { header: 'Diferença de caixa', key: 'dif', width: 18, moeda: true },
      { header: 'Observação', key: 'obs', width: 35 },
      { header: 'Registrado por', key: 'por', width: 20 },
    ],
    faturamentos.map((f) => ({
      data: dateBR(f.data),
      Dinheiro: f.dinheiro,
      Crédito: f.credito,
      Débito: f.debito,
      Pix: f.pix,
      Voucher: f.voucher,
      Sicoob: f.sicoob,
      total: totalDia(f),
      dif: f.diferencaCaixa,
      obs: f.observacao ?? '',
      por: f.registradoPor,
    })),
  )

  const colunasDespesa: Coluna[] = [
    { header: 'Vencimento', key: 'venc', width: 12 },
    { header: 'Fornecedor / Favorecido', key: 'forn', width: 28 },
    { header: 'Descrição', key: 'desc', width: 35 },
    { header: 'Categoria', key: 'cat', width: 26 },
    { header: 'Forma', key: 'forma', width: 14 },
    { header: 'Valor', key: 'valor', width: 14, moeda: true },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Pagamento', key: 'pagto', width: 12 },
    { header: 'NF', key: 'nf', width: 12 },
    { header: 'Parcela', key: 'parcela', width: 10 },
  ]
  const linhaDespesa = (d: Despesa) => ({
    venc: dateBR(d.dataVencimento),
    forn: d.fornecedorOuFavorecido,
    desc: d.descricao,
    cat: d.categoria,
    forma: d.formaPagamento,
    valor: d.valor,
    status: d.status,
    pagto: d.dataPagamento ? dateBR(d.dataPagamento) : '',
    nf: d.numeroNF ?? '',
    parcela: d.parcela ?? '',
  })
  aba(wb, 'Despesas', colunasDespesa, despesas.map(linhaDespesa))
  aba(wb, 'Contas Pendentes', colunasDespesa, pendentes(despesas).map(linhaDespesa))

  aba(
    wb,
    'Diárias de Extras',
    [
      { header: 'Data', key: 'data', width: 12 },
      { header: 'Colaborador', key: 'nome', width: 24 },
      { header: 'Setor', key: 'setor', width: 14 },
      { header: 'Função', key: 'funcao', width: 14 },
      { header: 'Valor', key: 'valor', width: 14, moeda: true },
      { header: 'Forma', key: 'forma', width: 12 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Observação', key: 'obs', width: 35 },
    ],
    extras.map((e) => ({
      data: dateBR(e.data),
      nome: e.nome,
      setor: e.setor,
      funcao: e.funcao,
      valor: e.valorAReceber,
      forma: e.formaPagamento,
      status: e.status,
      obs: e.observacao ?? '',
    })),
  )

  const buffer = await wb.xlsx.writeBuffer()
  baixar(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    nomeArquivo(mes, 'xlsx'),
  )
}

// --- PDF -----------------------------------------------------------------------

export function exportarPdf({ mes, dre, faturamentos, despesas, extras }: DadosRelatorio) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const cabecalho = { fillColor: [30, 41, 59] as [number, number, number], textColor: 255, fontStyle: 'bold' as const }
  const estilo = { fontSize: 8.5, cellPadding: 1.8 }
  let y = 42

  doc.setFillColor(30, 41, 59)
  doc.rect(0, 0, 210, 32, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(17)
  doc.text('RHUA BAR · RELATÓRIO FINANCEIRO', 14, 15)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(`Período: ${nomePeriodo(mes)}  |  Gerado em: ${dateBR(today())}`, 14, 23)

  /** Título de seção; quebra a página se faltar espaço. */
  function secao(titulo: string) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(titulo, 14, y)
    y += 4
  }
  const fimTabela = () => {
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
  }

  secao('1. DRE DO PERÍODO')
  const linhas = linhasDre(dre, true)
  autoTable(doc, {
    startY: y,
    head: [['', 'Resultado (competência)', 'Caixa (já pago)']],
    body: [
      // As fontes padrão do jsPDF são Latin-1: o sinal "−" (U+2212) vira hífen.
      ...linhas.map((l) => [
        (l.tipo === 'detalhe' ? `   ${l.rotulo}` : l.rotulo).replace(/\u2212/g, '-'),
        brl(l.competencia),
        brl(l.caixa),
      ]),
      ['A pagar no período', brl(dre.aPagar), ''],
    ],
    theme: 'grid',
    headStyles: cabecalho,
    styles: estilo,
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    didParseCell: (c) => {
      const l = linhas[c.row.index]
      if (c.section !== 'body' || !l) return
      if (l.tipo === 'detalhe') c.cell.styles.textColor = [100, 116, 139]
      else c.cell.styles.fontStyle = 'bold'
      if (l.tipo === 'subtotal') c.cell.styles.fillColor = [241, 245, 249]
    },
  })
  fimTabela()

  secao('2. CONTAS PENDENTES (A VENCER / ATRASADAS)')
  const abertas = pendentes(despesas)
  if (!abertas.length) {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Nenhuma conta pendente no período.', 14, y + 3)
    y += 12
  } else {
    autoTable(doc, {
      startY: y,
      head: [['Vencimento', 'Fornecedor / Favorecido', 'Descrição', 'Valor', 'Status']],
      body: abertas.map((d) => [dateBR(d.dataVencimento), d.fornecedorOuFavorecido, d.descricao, brl(d.valor), d.status]),
      theme: 'grid',
      headStyles: { ...cabecalho, fillColor: [190, 18, 60] },
      styles: estilo,
      columnStyles: { 3: { halign: 'right' } },
    })
    fimTabela()
  }

  secao('3. FATURAMENTO DIÁRIO')
  autoTable(doc, {
    startY: y,
    head: [['Data', 'Dinheiro', 'Cartões', 'Pix', 'Voucher/Sicoob', 'Total do dia', 'Dif. caixa']],
    body: faturamentos.map((f) => [
      dateBR(f.data),
      brl(f.dinheiro),
      brl(f.credito + f.debito),
      brl(f.pix),
      brl(f.voucher + f.sicoob),
      brl(totalDia(f)),
      brl(f.diferencaCaixa),
    ]),
    theme: 'grid',
    headStyles: cabecalho,
    styles: estilo,
    columnStyles: Object.fromEntries([1, 2, 3, 4, 5, 6].map((i) => [i, { halign: 'right' as const }])),
  })
  fimTabela()

  secao('4. DIÁRIAS DE EXTRAS')
  autoTable(doc, {
    startY: y,
    head: [['Data', 'Colaborador', 'Setor', 'Função', 'Valor', 'Forma', 'Status']],
    body: extras.map((e) => [dateBR(e.data), e.nome, e.setor, e.funcao, brl(e.valorAReceber), e.formaPagamento, e.status]),
    theme: 'grid',
    headStyles: cabecalho,
    styles: estilo,
    columnStyles: { 4: { halign: 'right' } },
  })

  const paginas = doc.getNumberOfPages()
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(148, 163, 184)
    doc.text(`Página ${i} de ${paginas} · ADM RHUA`, 105, 288, { align: 'center' })
  }

  baixar(doc.output('blob'), nomeArquivo(mes, 'pdf'))
}
