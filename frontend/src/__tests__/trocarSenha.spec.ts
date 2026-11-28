import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TrocarSenhaModal from '@/components/TrocarSenhaModal.vue'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/router', () => ({ default: { push: vi.fn<() => void>(), currentRoute: { value: {} } } }))

function montar() {
  const pinia = createPinia()
  setActivePinia(pinia)
  useAuthStore().user = { id: 1, name: 'Ana', email: 'ana@rhua.com', role: 'operador', avatar: null, ativo: true }
  return mount(TrocarSenhaModal, { global: { plugins: [pinia] } })
}

async function preencher(w: ReturnType<typeof montar>, atual: string, nova: string, confirmacao: string) {
  await w.get('#senha-atual').setValue(atual)
  await w.get('#senha-nova').setValue(nova)
  await w.get('#senha-confirmacao').setValue(confirmacao)
  await w.get('form').trigger('submit')
  await flushPromises()
}

describe('TrocarSenhaModal', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('não envia se a confirmação não confere ou se a nova é igual à atual', async () => {
    const put = vi.spyOn(api, 'put')
    const w = montar()
    await preencher(w, 'velha123', 'nova1234', 'outra123')
    expect(w.text()).toContain('A confirmação não confere')
    await preencher(w, 'mesma123', 'mesma123', 'mesma123')
    expect(w.text()).toContain('deve ser diferente da atual')
    expect(put).not.toHaveBeenCalled()
  })

  it('envia senha atual e nova para a API e confirma a troca', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({ message: 'Senha alterada.' })
    const w = montar()
    expect(w.text()).toContain('ana@rhua.com')
    await preencher(w, 'velha123', 'nova1234', 'nova1234')
    expect(put).toHaveBeenCalledWith('/auth/me/password', { currentPassword: 'velha123', newPassword: 'nova1234' })
    expect(w.text()).toContain('Senha alterada')
  })

  it('mostra o erro devolvido pela API', async () => {
    vi.spyOn(api, 'put').mockRejectedValue(new Error('Senha atual incorreta.'))
    const w = montar()
    await preencher(w, 'errada12', 'nova1234', 'nova1234')
    expect(w.text()).toContain('Senha atual incorreta.')
  })
})
