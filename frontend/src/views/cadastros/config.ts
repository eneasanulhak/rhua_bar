import type { Component } from 'vue'
import { Briefcase, CreditCard, LayoutGrid, Tags, Truck, UserRound } from 'lucide-vue-next'
import {
  useCategoriasStore,
  useColaboradoresStore,
  useFormasPagamentoStore,
  useFornecedoresStore,
  useFuncoesStore,
  useSetoresStore,
} from '@/stores/resources'

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
  tipo: 'texto' | 'email' | 'textarea' | 'marcacao' | 'dinheiro' | 'selecao'
  obrigatorio?: boolean
  max?: number
  placeholder?: string
  dica?: string
  /** Mostrar como coluna na listagem. */
  coluna?: boolean
  /** Seleção: cadastro de onde vêm as opções (id gravado em `key`). */
  opcoes?: () => CadastroStore
  /** Seleção: campo do item com o nome a exibir na listagem (ex.: `setor` para `setorId`). */
  exibir?: string
  /** Seleção: restringe as opções conforme o formulário (ex.: funções do setor escolhido). */
  filtrar?: (opcao: ItemCadastro, form: Record<string, unknown>) => boolean
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
    campos: [
      { ...NOME, max: 80 },
      {
        key: 'foraDoResultado', rotulo: 'Fora do resultado operacional', tipo: 'marcacao', coluna: true,
        dica: 'Para retiradas de sócios, adiantamentos e similares: o DRE as mostra depois do resultado.',
      },
    ],
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
  setores: {
    titulo: 'Setores',
    subtitulo: 'Áreas de trabalho da equipe extra; agrupam as diárias na tela de Extras',
    singular: 'Setor',
    novo: 'Novo Setor',
    icon: LayoutGrid,
    store: () => useSetoresStore() as unknown as CadastroStore,
    campos: [{ ...NOME, max: 60 }],
  },
  funcoes: {
    titulo: 'Funções',
    subtitulo: 'Cada função pertence a um setor; no lançamento a lista é filtrada pelo setor escolhido',
    singular: 'Função',
    novo: 'Nova Função',
    icon: Briefcase,
    store: () => useFuncoesStore() as unknown as CadastroStore,
    campos: [
      { ...NOME, max: 60 },
      {
        key: 'setorId', rotulo: 'Setor', tipo: 'selecao', obrigatorio: true, coluna: true,
        opcoes: () => useSetoresStore() as unknown as CadastroStore, exibir: 'setor',
      },
    ],
  },
  colaboradores: {
    titulo: 'Colaboradores',
    subtitulo: 'Equipe extra. Setor, função e diária preenchem o lançamento; novos nomes são cadastrados ao lançar',
    singular: 'Colaborador',
    novo: 'Novo Colaborador',
    icon: UserRound,
    store: () => useColaboradoresStore() as unknown as CadastroStore,
    campos: [
      { ...NOME, max: 120 },
      {
        key: 'setorId', rotulo: 'Setor padrão', tipo: 'selecao', coluna: true,
        opcoes: () => useSetoresStore() as unknown as CadastroStore, exibir: 'setor',
      },
      {
        key: 'funcaoId', rotulo: 'Função padrão', tipo: 'selecao', coluna: true,
        opcoes: () => useFuncoesStore() as unknown as CadastroStore, exibir: 'funcao',
        filtrar: (funcao, form) => funcao.setorId === form.setorId,
      },
      { key: 'valorDiaria', rotulo: 'Diária padrão (R$)', tipo: 'dinheiro', coluna: true, dica: '0 = sem valor padrão' },
      { key: 'telefone', rotulo: 'Telefone', tipo: 'texto', max: 30, coluna: true },
      { key: 'chavePix', rotulo: 'Chave Pix', tipo: 'texto', max: 120 },
      { key: 'observacao', rotulo: 'Observação', tipo: 'textarea' },
    ],
  },
} satisfies Record<string, CadastroConfig>

export type TipoCadastro = keyof typeof CADASTROS
