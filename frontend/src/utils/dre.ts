import type { Dre } from '@/types'

/** Uma linha do DRE em duas colunas: competência (tudo que vence no período) e caixa (só o pago). */
export interface LinhaDre {
  rotulo: string
  competencia: number
  caixa: number
  tipo: 'receita' | 'custo' | 'subtotal' | 'detalhe'
}

const MEIOS: [keyof Dre['faturamento']['porMeio'], string][] = [
  ['dinheiro', 'Dinheiro'],
  ['credito', 'Crédito'],
  ['debito', 'Débito'],
  ['pix', 'Pix'],
  ['voucher', 'Voucher'],
  ['sicoob', 'Sicoob'],
]

/**
 * Linhas do DRE, usadas na tela (DreTabela) e nas exportações Excel/PDF.
 * `detalhado` abre o faturamento por meio e as despesas por categoria.
 */
export function linhasDre(d: Dre, detalhado = false): LinhaDre[] {
  const fat = d.faturamento.total
  const opCaixa = fat - d.despesas.pago - d.extras.pago
  const out: LinhaDre[] = [{ rotulo: 'Faturamento bruto', competencia: fat, caixa: fat, tipo: 'receita' }]
  if (detalhado) {
    for (const [k, rotulo] of MEIOS) {
      const v = d.faturamento.porMeio[k]
      if (v) out.push({ rotulo, competencia: v, caixa: v, tipo: 'detalhe' })
    }
  }

  out.push({ rotulo: '(−) Despesas operacionais', competencia: d.despesas.total, caixa: d.despesas.pago, tipo: 'custo' })
  if (detalhado) {
    for (const c of d.despesas.categorias) out.push({ rotulo: c.categoria, competencia: c.total, caixa: c.pago, tipo: 'detalhe' })
  }
  out.push(
    { rotulo: '(−) Diárias de extras', competencia: d.extras.total, caixa: d.extras.pago, tipo: 'custo' },
    { rotulo: '= Resultado operacional', competencia: d.resultadoOperacional, caixa: opCaixa, tipo: 'subtotal' },
  )

  if (d.retiradas && d.resultadoFinal !== null) {
    out.push({ rotulo: '(−) Retiradas e adiantamentos', competencia: d.retiradas.total, caixa: d.retiradas.pago, tipo: 'custo' })
    if (detalhado) {
      for (const c of d.retiradas.categorias) out.push({ rotulo: c.categoria, competencia: c.total, caixa: c.pago, tipo: 'detalhe' })
    }
    out.push({ rotulo: '= Resultado final', competencia: d.resultadoFinal, caixa: d.saldoCaixa, tipo: 'subtotal' })
  }
  return out
}

/** 'AAAA-MM' -> 'Agosto de 2026'; 'all' -> 'Todos os meses'. */
export function nomePeriodo(mes: string) {
  if (!mes || mes === 'all') return 'Todos os meses'
  const [ano, m] = mes.split('-').map(Number)
  const nome = new Date(ano!, m! - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}
