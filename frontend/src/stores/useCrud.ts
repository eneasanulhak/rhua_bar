import { ref, type Ref } from 'vue'
import { api } from '@/services/api'

/**
 * Estado e ações CRUD reaproveitados pelos stores de recursos da API.
 * Usar dentro de um setup store: `defineStore('x', () => ({ ...useCrud<X, In>('x') }))`.
 */
export function useCrud<T extends { id: number }, In = unknown>(resource: string) {
  const items = ref([]) as Ref<T[]>
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll(mes?: string) {
    loading.value = true
    error.value = null
    try {
      const query = mes && mes !== 'all' ? `?mes=${mes}` : ''
      items.value = await api.get<T[]>(`/${resource}${query}`)
    } catch (e) {
      error.value = (e as Error).message
    } finally {
      loading.value = false
    }
  }

  function replace(item: T) {
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx === -1) items.value.unshift(item)
    else items.value[idx] = item
    return item
  }

  async function create(input: In) {
    return replace(await api.post<T>(`/${resource}`, input))
  }

  async function update(id: number, input: Partial<In>) {
    return replace(await api.put<T>(`/${resource}/${id}`, input))
  }

  async function remove(id: number) {
    await api.delete(`/${resource}/${id}`)
    items.value = items.value.filter((i) => i.id !== id)
  }

  return { items, loading, error, fetchAll, create, update, remove, replace }
}
