import { afterEach, describe, expect, it, vi } from 'vitest'
import ExcelJS from 'exceljs'
import type { Despesa, Dre, Extra, Faturamento } from '@/types'
import { linhasDre, nomePeriodo } from '@/utils/dre'

const DRE: Dre = {
  periodo: '2026-08',
  faturamento: {
    total: 1000,
    porMeio: { dinheiro: 600, credito: 0, debito: 0, pix: 400, voucher: 0, sicoob: 0 },
    diferencaCaixa: -2,
  },
  despesas: { total: 300, pago: 100, categorias: [{ categoria: 'Compras Bar e Salão', total: 300, pago: 100 }] },
  extras: { total: 150, pago: 50 },
  resultadoOperacional: 550,
  retiradas: { total: 200, pago: 200, categorias: [{ categoria: 'Retirada de Sócios', total: 200, pago: 200 }] },
  resultadoFinal: 350,
  saldoCaixa: 450,
  aPagar: 300,
}

const FAT: Faturamento = {
  id: 1, data: '2026-08-01', dinheiro: 600, credito: 0, debito: 0, pix: 400, voucher: 0, sicoob: 0,
  diferencaCaixa: -2, observacao: null, registradoPor: 'Admin',
}
const DESP: Despesa = {
  id: 1, descricao: 'Bebidas', fornecedorId: 1, fornecedorOuFavorecido: 'Zé Distribuidora', categoriaId: 2,
  categoria: 'Compras Bar e Salão', formaPagamentoId: 6, formaPagamento: 'Boleto', valor: 300,
  dataEmissao: '2026-08-01', dataVencimento: '2026-08-26', dataPagamento: null, status: 'Pendente',
  numeroNF: null, parcela: '1/2', observacao: null, registradoPor: 'Admin',
}
const EXTRA: Extra = {
  id: 1, data: '2026-08-08', colaboradorId: 1, nome: 'Jussara', setorId: 1, setor: 'COZINHA', funcaoId: 1,
  funcao: 'COZINHA', valorAReceber: 150, formaPagamentoId: 1, formaPagamento: 'Dinheiro', status: 'PENDENTE',
  observacao: null, registradoPor: 'Admin',
}
const DADOS = { mes: '2026-08', dre: DRE, faturamentos: [FAT], despesas: [DESP], extras: [EXTRA] }

describe('linhasDre', () => {
  it('monta resultado operacional, retiradas e resultado final nas duas colunas', () => {
    const linhas = linhasDre(DRE)
    expect(linhas.map((l) => l.rotulo)).toEqual([
      'Faturamento bruto',
      '(−) Despesas operacionais',
      '(−) Diárias de extras',
      '= Resultado operacional',
      '(−) Retiradas e adiantamentos',
      '= Resultado final',
    ])
    const op = linhas.find((l) => l.rotulo === '= Resultado operacional')!
    expect([op.competencia, op.caixa]).toEqual([550, 1000 - 100 - 50])
    expect(linhas[linhas.length - 1]).toMatchObject({ competencia: 350, caixa: 450 })
  })

  it('sem permissão de retiradas, para no resultado operacional', () => {
    const linhas = linhasDre({ ...DRE, retiradas: null, resultadoFinal: null })
    expect(linhas[linhas.length - 1]!.rotulo).toBe('= Resultado operacional')
  })

  it('detalhado abre meios de pagamento (só os com valor) e categorias', () => {
    const rotulos = linhasDre(DRE, true).map((l) => l.rotulo)
    expect(rotulos).toContain('Pix')
    expect(rotulos).not.toContain('Crédito')
    expect(rotulos).toContain('Compras Bar e Salão')
    expect(rotulos).toContain('Retirada de Sócios')
  })

  it('nomePeriodo', () => {
    expect(nomePeriodo('2026-08')).toBe('Agosto de 2026')
    expect(nomePeriodo('all')).toBe('Todos os meses')
  })
})

describe('exportação', () => {
  afterEach(() => vi.restoreAllMocks())

  /** Intercepta o download e devolve o Blob gerado. */
  function capturarDownload() {
    const blobs: Blob[] = []
    URL.createObjectURL = vi.fn<(b: Blob) => string>((b) => {
      blobs.push(b)
      return 'blob:teste'
    })
    URL.revokeObjectURL = vi.fn<(url: string) => void>()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    return blobs
  }

  it('Excel: abas esperadas e valores numéricos com formato de moeda', async () => {
    const blobs = capturarDownload()
    const { exportarExcel } = await import('@/services/exportar')
    await exportarExcel(DADOS)

    const wb = new ExcelJS.Workbook()
    await wb.xlsx.load(await blobs[0]!.arrayBuffer())
    expect(wb.worksheets.map((w) => w.name)).toEqual([
      'DRE', 'Faturamento Diário', 'Despesas', 'Contas Pendentes', 'Diárias de Extras',
    ])
    const dre = wb.getWorksheet('DRE')!
    const final = dre.getColumn(1).values.findIndex((v) => v === '= Resultado final')
    expect(dre.getCell(final, 2).value).toBe(350)
    expect(dre.getCell(final, 2).numFmt).toContain('R$')
    expect(wb.getWorksheet('Contas Pendentes')!.getCell('B2').value).toBe('Zé Distribuidora')
    expect(wb.getWorksheet('Diárias de Extras')!.getCell('E2').value).toBe(150)
  })

  it('PDF: gera um documento com as seções e o DRE', async () => {
    const blobs = capturarDownload()
    const { exportarPdf } = await import('@/services/exportar')
    exportarPdf(DADOS)

    expect(blobs).toHaveLength(1)
    const pdf = new TextDecoder('latin1').decode(await blobs[0]!.arrayBuffer())
    expect(pdf.startsWith('%PDF-')).toBe(true)
    for (const trecho of ['1. DRE DO PER', '2. CONTAS PENDENTES', '= Resultado final', 'Jussara', 'Agosto de 2026']) {
      expect(pdf).toContain(trecho)
    }
    // o sinal "−" (fora do Latin-1) foi trocado por hífen; no PDF os parênteses vêm escapados
    expect(pdf).toContain('\\(-\\) Despesas operacionais')
  })
})
