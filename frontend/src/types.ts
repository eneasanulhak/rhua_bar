// Espelha os payloads da API Flask (backend/app/models.py, métodos to_dict).

export type Role = 'admin' | 'gerente' | 'operador' | 'auditor'

export type Permission =
  | 'view_dashboard'
  | 'view_faturamento'
  | 'add_faturamento'
  | 'edit_faturamento'
  | 'delete_faturamento'
  | 'view_despesas'
  | 'add_despesas'
  | 'edit_despesas'
  | 'delete_despesas'
  | 'compensar_despesas'
  | 'view_retiradas'
  | 'export_reports'
  | 'manage_users'
  | 'manage_cadastros'

export interface User {
  id: number
  name: string
  email: string
  role: Role
  avatar: string | null
  ativo: boolean
}

export interface UserInput extends Omit<User, 'id'> {
  password?: string
}

export type TransactionStatus = 'Compensado' | 'Pendente' | 'Atrasado'

export interface Faturamento {
  id: number
  data: string // AAAA-MM-DD
  dinheiro: number
  credito: number
  debito: number
  pix: number
  voucher: number
  sicoob: number
  diferencaCaixa: number // falta (-) ou sobra (+)
  observacao: string | null
  registradoPor: string
}

// --- Cadastros auxiliares (menu Cadastros, só administrador) ---------------

export interface Categoria {
  id: number
  nome: string
  /** Retiradas, adiantamentos…: o DRE as mostra abaixo do resultado operacional. */
  foraDoResultado: boolean
  ativo: boolean
}

export interface FormaPagamento {
  id: number
  nome: string
  usaDespesas: boolean
  usaExtras: boolean
  ativo: boolean
}

export interface Fornecedor {
  id: number
  nome: string
  documento: string | null
  telefone: string | null
  email: string | null
  observacao: string | null
  ativo: boolean
}

export interface Despesa {
  id: number
  descricao: string
  fornecedorId: number
  fornecedorOuFavorecido: string
  categoriaId: number
  categoria: string
  formaPagamentoId: number
  formaPagamento: string
  valor: number
  dataEmissao: string
  dataVencimento: string
  dataPagamento: string | null
  status: TransactionStatus
  numeroNF: string | null
  parcela: string | null
  observacao: string | null
  registradoPor: string
}

export interface Setor {
  id: number
  nome: string
  ativo: boolean
}

export interface Funcao {
  id: number
  nome: string
  setorId: number
  setor: string
  ativo: boolean
}

/** Setor, função e valor são padrões que preenchem o lançamento da diária. */
export interface Colaborador {
  id: number
  nome: string
  setorId: number | null
  setor: string | null
  funcaoId: number | null
  funcao: string | null
  valorDiaria: number
  telefone: string | null
  chavePix: string | null
  observacao: string | null
  ativo: boolean
}

export interface Extra {
  id: number
  data: string
  colaboradorId: number
  nome: string
  setorId: number
  setor: string
  funcaoId: number
  funcao: string
  valorAReceber: number
  formaPagamentoId: number
  formaPagamento: string
  status: 'PAGO' | 'PENDENTE'
  observacao: string | null
  registradoPor: string
}

export interface Notificacao {
  id: string
  title: string
  message: string
  date: string
  type: 'urgent' | 'warning' | 'info'
  despesaId: number
}

/** Campos gerados pelo servidor não são enviados ao criar/editar. */
export type Input<T> = Omit<T, 'id' | 'registradoPor'>

/**
 * Despesa enviada à API: categoria e forma vão pelo id; o fornecedor vai pelo nome
 * e é cadastrado automaticamente se ainda não existir.
 */
export type DespesaInput = Omit<Input<Despesa>, 'fornecedorId' | 'categoria' | 'formaPagamento'>

/** Diária enviada à API: o colaborador vai pelo nome (`nome`) e é cadastrado se não existir. */
export type ExtraInput = Omit<Input<Extra>, 'colaboradorId' | 'setor' | 'funcao' | 'formaPagamento'>

// --- DRE (GET /api/relatorios/dre) -------------------------------------------

export interface DreGrupo {
  total: number
  pago: number
  categorias: { categoria: string; total: number; pago: number }[]
}

export interface Dre {
  periodo: string
  faturamento: {
    total: number
    porMeio: Record<'dinheiro' | 'credito' | 'debito' | 'pix' | 'voucher' | 'sicoob', number>
    diferencaCaixa: number
  }
  despesas: DreGrupo
  extras: { total: number; pago: number }
  /** Faturamento − despesas operacionais − extras (tudo que vence no período, pago ou não). */
  resultadoOperacional: number
  /** null para quem não tem `view_retiradas`. */
  retiradas: DreGrupo | null
  resultadoFinal: number | null
  /** Faturamento − o que já foi pago. */
  saldoCaixa: number
  aPagar: number
}
