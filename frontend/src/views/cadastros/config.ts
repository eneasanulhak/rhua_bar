import type { Component } from 'vue'
import { CreditCard, Tags, Truck } from 'lucide-vue-next'
import { useCategoriasStore, useFormasPagamentoStore, useFornecedoresStore } from '@/stores/resources'

/** Item mínimo de qualquer cadastro auxiliar. */
export interface ItemCadastro {
  id: number
  nome: string
  ativo: boolean
  [campo: string]: unknown
}

/** O que a tela genérica usa dos stores criados com `useCrud`. */
export interface CadastroStore {
  items: ItemCadastro[]
  loading: boolean
  error: string | null
  fetchAll: () => Promise<void>
  create: (input: Record<string, unknown>) => Promise<unknown>
  update: (id: number, input: Record<string, unknown>) => Promise<unknown>
  remove: (id: number) => Promise<void>
}

export interface Campo {
  key: string
  rotulo: string
  tipo: 'texto' | 'email' | 'textarea' | 'marcacao'
  obrigatorio?: boolean
  max?: number
  placeholder?: string
  /** Mostrar como coluna na listagem. */
  coluna?: boolean
}

export interface CadastroConfig {
  titulo: string
  subtitulo: string
  /** Título do formulário ao editar ("Editar …"). */
  singular: string
  /** Botão e título do formulário ao criar. */
  novo: string
  icon: Component
  store: () => CadastroStore
  campos: Campo[]
}

const NOME: Campo = { key: 'nome', rotulo: 'Nome', tipo: 'texto', obrigatorio: true, coluna: true }

export const CADASTROS = {
  categorias: {
    titulo: 'Categorias de Despesa',
    subtitulo: 'Agrupam as despesas no lançamento, nos filtros e no Painel & DRE',
    singular: 'Categoria',
    novo: 'Nova Categoria',
    icon: Tags,
    store: () => useCategoriasStore() as unknown as CadastroStore,
    campos: [{ ...NOME, max: 80 }],
  },
  'formas-pagamento': {
    titulo: 'Formas de Pagamento',
    subtitulo: 'Marque onde cada forma pode ser usada: despesas, diárias de extras ou ambos',
    singular: 'Forma de Pagamento',
    novo: 'Nova Forma de Pagamento',
    icon: CreditCard,
    store: () => useFormasPagamentoStore() as unknown as CadastroStore,
    campos: [
      { ...NOME, max: 60 },
      { key: 'usaDespesas', rotulo: 'Usar em despesas', tipo: 'marcacao', coluna: true },
      { key: 'usaExtras', rotulo: 'Usar em extras', tipo: 'marcacao', coluna: true },
    ],
  },
  fornecedores: {
    titulo: 'Fornecedores',
    subtitulo: 'Também são cadastrados automaticamente ao lançar uma despesa com um nome novo',
    singular: 'Fornecedor',
    novo: 'Novo Fornecedor',
    icon: Truck,
    store: () => useFornecedoresStore() as unknown as CadastroStore,
    campos: [
      { ...NOME, max: 180, placeholder: 'ex: Ambev S.A.' },
      { key: 'documento', rotulo: 'CNPJ / CPF', tipo: 'texto', max: 20, coluna: true },
      { key: 'telefone', rotulo: 'Telefone', tipo: 'texto', max: 30, coluna: true },
      { key: 'email', rotulo: 'E-mail', tipo: 'email', max: 180 },
      { key: 'observacao', rotulo: 'Observação', tipo: 'textarea' },
    ],
  },
} satisfies Record<string, CadastroConfig>

export type TipoCadastro = keyof typeof CADASTROS
