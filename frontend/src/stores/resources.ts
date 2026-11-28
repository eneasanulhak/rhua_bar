import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useCrud } from './useCrud'
import type {
  Categoria,
  Despesa,
  DespesaInput,
  Extra,
  Faturamento,
  FormaPagamento,
  Fornecedor,
  Input,
  Notificacao,
  TransactionStatus,
  User,
  UserInput,
} from '@/types'

export const useFaturamentosStore = defineStore('faturamentos', () => ({
  ...useCrud<Faturamento, Input<Faturamento>>('faturamentos'),
}))

export const useDespesasStore = defineStore('despesas', () => {
  const crud = useCrud<Despesa, DespesaInput>('despesas')
  const notificacoes = useNotificacoesStore()
  const fornecedores = useFornecedoresStore()

  /**
   * Após cada alteração recarrega o que depende das despesas: os alertas de vencimento
   * (sino e badge do menu) e os fornecedores, que podem ter sido cadastrados no lançamento.
   */
  function comAlertas<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
    return async (...args: A) => {
      const result = await fn(...args)
      notificacoes.fetchAll().catch(() => {})
      fornecedores.fetchAll().catch(() => {})
      return result
    }
  }

  async function setStatus(id: number, status: TransactionStatus, dataPagamento?: string) {
    return crud.replace(await api.patch<Despesa>(`/despesas/${id}/status`, { status, dataPagamento }))
  }

  return {
    ...crud,
    create: comAlertas(crud.create),
    update: comAlertas(crud.update),
    remove: comAlertas(crud.remove),
    setStatus: comAlertas(setStatus),
  }
})

export const useExtrasStore = defineStore('extras', () => ({
  ...useCrud<Extra, Input<Extra>>('extras'),
}))

export const useUsuariosStore = defineStore('usuarios', () => ({
  ...useCrud<User, UserInput>('usuarios'),
}))

export const useNotificacoesStore = defineStore('notificacoes', () => {
  const items = ref<Notificacao[]>([])

  async function fetchAll() {
    items.value = await api.get<Notificacao[]>('/notificacoes')
  }

  return { items, fetchAll }
})

// --- Cadastros auxiliares --------------------------------------------------
// As listas trazem também os inativos; os formulários de lançamento filtram por `ativo`.

export const useCategoriasStore = defineStore('categorias', () => ({
  ...useCrud<Categoria, Input<Categoria>>('categorias'),
}))

export const useFormasPagamentoStore = defineStore('formas-pagamento', () => ({
  ...useCrud<FormaPagamento, Input<FormaPagamento>>('formas-pagamento'),
}))

export const useFornecedoresStore = defineStore('fornecedores', () => ({
  ...useCrud<Fornecedor, Input<Fornecedor>>('fornecedores'),
}))
