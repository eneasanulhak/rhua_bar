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

export const SETORES = ['COZINHA', 'SEGURANÇA', 'BAR', 'SALÃO', 'RECEPÇÃO', 'LIMPEZA'] as const
export const FUNCOES_EXTRA = [
  'COZINHA',
  'BAR',
  'SALÃO',
  'LÍDER',
  'SEGURANÇA',
  'RECEPÇÃO',
  'LIMPEZA',
  'CUMIM',
] as const

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

export interface Extra {
  id: number
  data: string
  nome: string
  setor: (typeof SETORES)[number]
  funcao: (typeof FUNCOES_EXTRA)[number]
  valorAReceber: number
  formaPagamento: 'Dinheiro' | 'Pix'
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
