import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { api, setUnauthorizedHandler, tokenStorage } from '@/services/api'
import router from '@/router'
import type { Permission, User } from '@/types'

interface SessionPayload {
  user: User
  permissions: Permission[]
}

export const ROLE_LABELS: Record<User['role'], string> = {
  admin: 'Administrador',
  gerente: 'Gerente Financeiro',
  operador: 'Operador de Caixa',
  auditor: 'Auditor / Leitura',
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const permissions = ref<Permission[]>([])
  const token = ref(tokenStorage.get())

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  function can(permission: Permission) {
    return permissions.value.includes(permission)
  }

  function applySession(payload: SessionPayload) {
    user.value = payload.user
    permissions.value = payload.permissions
  }

  async function login(email: string, password: string) {
    const payload = await api.post<SessionPayload & { accessToken: string }>('/auth/login', {
      email,
      password,
    })
    tokenStorage.set(payload.accessToken)
    token.value = payload.accessToken
    applySession(payload)
  }

  /** Recupera a sessão a partir do token salvo (ao recarregar a página). */
  async function restore() {
    if (!token.value || user.value) return
    try {
      applySession(await api.get<SessionPayload>('/auth/me'))
    } catch {
      clear()
    }
  }

  function clear() {
    tokenStorage.clear()
    token.value = null
    user.value = null
    permissions.value = []
  }

  function logout() {
    clear()
    router.push({ name: 'login' })
  }

  setUnauthorizedHandler(logout)

  return { user, permissions, isAuthenticated, can, login, restore, logout }
})
