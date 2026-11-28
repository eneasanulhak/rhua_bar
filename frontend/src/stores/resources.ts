import { ref } from 'vue'
import { defineStore } from 'pinia'
import { api } from '@/services/api'
import { useCrud } from './useCrud'
import type {
  Despesa,
  Extra,
  Faturamento,
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
  const crud = useCrud<Despesa, Input<Despesa>>('despesas')
  const notificacoes = useNotificacoesStore()

  /** Os alertas de vencimento (sino e badge do menu) dependem das despesas: recarrega após cada alteração. */
  function comAlertas<A extends unknown[], R>(fn: (...args: A) => Promise<R>) {
    return async (...args: A) => {
      const result = await fn(...args)
      notificacoes.fetchAll().catch(() => {})
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
