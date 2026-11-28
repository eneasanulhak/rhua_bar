<script setup lang="ts">
import { reactive, ref } from 'vue'
import { CheckCircle2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { api } from '@/services/api'
import { ROLE_LABELS, useAuthStore } from '@/stores/auth'

/** "Minha conta": dados do usuário logado e troca da própria senha (PUT /api/auth/me/password). */
const emit = defineEmits<{ close: [] }>()
const auth = useAuthStore()

const form = reactive({ atual: '', nova: '', confirmacao: '' })
const salvando = ref(false)
const erro = ref('')
const sucesso = ref(false)

async function salvar() {
  erro.value = ''
  if (form.nova !== form.confirmacao) {
    erro.value = 'A confirmação não confere com a nova senha.'
    return
  }
  if (form.nova === form.atual) {
    erro.value = 'A nova senha deve ser diferente da atual.'
    return
  }
  salvando.value = true
  try {
    await api.put('/auth/me/password', { currentPassword: form.atual, newPassword: form.nova })
    sucesso.value = true
    Object.assign(form, { atual: '', nova: '', confirmacao: '' })
  } catch (e) {
    erro.value = (e as Error).message
  } finally {
    salvando.value = false
  }
}
</script>

<template>
  <BaseModal title="Minha conta" @close="emit('close')">
    <div v-if="auth.user" class="rounded-xl bg-slate-50 p-3 text-xs dark:bg-neutral-900">
      <p class="font-bold">{{ auth.user.name }}</p>
      <p class="text-slate-500 dark:text-slate-400">{{ auth.user.email }} · {{ ROLE_LABELS[auth.user.role] }}</p>
    </div>

    <div v-if="sucesso" class="space-y-4">
      <p
        class="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
      >
        <CheckCircle2 class="h-4 w-4" /> Senha alterada. Use a nova senha no próximo acesso.
      </p>
      <div class="flex justify-end">
        <button type="button" class="btn-primary" @click="emit('close')">Fechar</button>
      </div>
    </div>

    <form v-else class="space-y-4" @submit.prevent="salvar">
      <h4 class="text-xs font-bold tracking-wider text-slate-500 uppercase">Trocar senha</h4>
      <div>
        <label class="label" for="senha-atual">Senha atual</label>
        <input
          id="senha-atual"
          v-model="form.atual"
          type="password"
          required
          autocomplete="current-password"
          class="input"
        />
      </div>
      <div>
        <label class="label" for="senha-nova">Nova senha</label>
        <input
          id="senha-nova"
          v-model="form.nova"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          class="input"
        />
        <p class="mt-1 text-[10px] text-slate-400">Mínimo de 6 caracteres.</p>
      </div>
      <div>
        <label class="label" for="senha-confirmacao">Confirme a nova senha</label>
        <input
          id="senha-confirmacao"
          v-model="form.confirmacao"
          type="password"
          required
          minlength="6"
          autocomplete="new-password"
          class="input"
        />
      </div>

      <p v-if="erro" class="rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
        {{ erro }}
      </p>

      <div class="flex justify-end gap-2">
        <button type="button" class="btn-ghost" @click="emit('close')">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="salvando">
          {{ salvando ? 'Salvando…' : 'Trocar senha' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
