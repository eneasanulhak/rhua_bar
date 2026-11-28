<script setup lang="ts">
import { ref } from 'vue'
import { Bell, KeyRound, LogOut, Moon, Sun } from 'lucide-vue-next'
import TrocarSenhaModal from '@/components/TrocarSenhaModal.vue'
import { ROLE_LABELS, useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const notificacoes = useNotificacoesStore()
const minhaConta = ref(false)
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-ink/90"
  >
    <div class="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 sm:px-6">
      <div class="flex-1">
        <p class="text-sm font-black tracking-widest">ADM RHUA</p>
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Gestão financeira</p>
      </div>

      <select v-model="ui.mes" class="input w-auto" aria-label="Filtrar por mês">
        <option v-for="m in ui.meses" :key="m.value" :value="m.value">{{ m.label }}</option>
      </select>

      <RouterLink
        v-if="auth.can('view_despesas')"
        :to="{ name: 'boletos' }"
        class="relative rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-neutral-800"
        title="Vencimentos"
      >
        <Bell class="h-4 w-4" />
        <span
          v-if="notificacoes.items.length"
          class="absolute -top-0.5 -right-0.5 rounded-full bg-rose-600 px-1 text-[9px] font-bold text-white"
        >
          {{ notificacoes.items.length }}
        </span>
      </RouterLink>

      <button
        class="cursor-pointer rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-neutral-800"
        :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema escuro'"
        @click="ui.toggleTheme()"
      >
        <Sun v-if="ui.theme === 'dark'" class="h-4 w-4" />
        <Moon v-else class="h-4 w-4" />
      </button>

      <button
        v-if="auth.user"
        class="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1 text-right hover:bg-slate-100 dark:hover:bg-neutral-800"
        title="Minha conta e troca de senha"
        @click="minhaConta = true"
      >
        <span class="hidden sm:block">
          <span class="block text-xs font-bold">{{ auth.user.name }}</span>
          <span class="block text-[10px] text-slate-500 dark:text-slate-400">{{ ROLE_LABELS[auth.user.role] }}</span>
        </span>
        <KeyRound class="h-4 w-4 text-slate-400" />
      </button>

      <button
        class="cursor-pointer rounded-xl p-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50"
        title="Sair"
        @click="auth.logout()"
      >
        <LogOut class="h-4 w-4" />
      </button>
    </div>
    <!-- Fora do header: o backdrop-blur dele prenderia o modal (position: fixed) à caixa do cabeçalho. -->
    <Teleport to="body">
      <TrocarSenhaModal v-if="minhaConta" @close="minhaConta = false" />
    </Teleport>
  </header>
</template>
