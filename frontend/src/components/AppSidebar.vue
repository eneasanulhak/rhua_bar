<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  BarChart3,
  ChevronDown,
  FolderCog,
  FileSpreadsheet,
  Receipt,
  ShieldCheck,
  TrendingUp,
  Users,
  CalendarClock,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/resources'
import type { Permission } from '@/types'
import { CADASTROS, type TipoCadastro } from '@/views/cadastros/config'

const auth = useAuthStore()
const notificacoes = useNotificacoesStore()
const route = useRoute()

const items = computed(() =>
  (
    [
      { to: 'dashboard', label: 'Painel & DRE', sub: 'Fluxo de caixa e indicadores', icon: BarChart3, perm: 'view_dashboard' },
      { to: 'faturamento', label: 'Faturamento Diário', sub: 'Entradas por meio de pagamento', icon: TrendingUp, perm: 'view_faturamento' },
      { to: 'despesas', label: 'Despesas & Compras', sub: 'Contas, fornecedores e custos', icon: Receipt, perm: 'view_despesas' },
      { to: 'boletos', label: 'Boletos & Vencimentos', sub: 'Controle de pagamentos', icon: CalendarClock, perm: 'view_despesas', badge: notificacoes.items.length },
      { to: 'extras', label: 'Pagamento de Extras', sub: 'Diárias da equipe de apoio', icon: Users, perm: 'view_despesas' },
      { to: 'relatorios', label: 'Relatórios & Exportação', sub: 'Gerador Excel e PDF', icon: FileSpreadsheet, perm: 'view_dashboard' },
      { to: 'usuarios', label: 'Usuários & Permissões', sub: 'Níveis de acesso e segurança', icon: ShieldCheck, perm: 'manage_users' },
    ] as const
  ).filter((item) => auth.can(item.perm as Permission)),
)

// Menu Cadastros (só administrador): grupo com um submenu por cadastro auxiliar.
const cadastros = (Object.keys(CADASTROS) as TipoCadastro[]).map((tipo) => ({
  to: `cadastro-${tipo}`,
  label: CADASTROS[tipo].titulo,
  icon: CADASTROS[tipo].icon,
}))
const emCadastro = computed(() => String(route.name ?? '').startsWith('cadastro-'))
const cadastrosAberto = ref(emCadastro.value)
watch(emCadastro, (dentro) => {
  if (dentro) cadastrosAberto.value = true
})
</script>

<template>
  <aside class="card w-full shrink-0 p-3 lg:w-72 lg:self-start">
    <nav class="flex gap-1 overflow-x-auto lg:flex-col">
      <RouterLink
        v-for="item in items"
        :key="item.to"
        :to="{ name: item.to }"
        class="group flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-100 dark:hover:bg-neutral-800/70"
        exact-active-class="!bg-black text-sand dark:!bg-sand dark:text-black"
      >
        <component :is="item.icon" class="h-4 w-4 shrink-0" />
        <span class="min-w-0 flex-1">
          <span class="block text-xs font-bold">{{ item.label }}</span>
          <span class="hidden truncate text-[10px] opacity-60 lg:block">{{ item.sub }}</span>
        </span>
        <span
          v-if="'badge' in item && item.badge"
          class="rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
        >
          {{ item.badge }}
        </span>
      </RouterLink>

      <template v-if="auth.can('manage_cadastros')">
        <button
          type="button"
          class="flex shrink-0 cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-100 dark:hover:bg-neutral-800/70"
          :class="{ 'text-sand-dark dark:text-sand': emCadastro }"
          :aria-expanded="cadastrosAberto"
          @click="cadastrosAberto = !cadastrosAberto"
        >
          <FolderCog class="h-4 w-4 shrink-0" />
          <span class="min-w-0 flex-1">
            <span class="block text-xs font-bold">Cadastros</span>
            <span class="hidden truncate text-[10px] opacity-60 lg:block">Tabelas auxiliares dos lançamentos</span>
          </span>
          <ChevronDown class="h-4 w-4 shrink-0 transition-transform" :class="{ 'rotate-180': cadastrosAberto }" />
        </button>
        <template v-if="cadastrosAberto">
          <RouterLink
            v-for="sub in cadastros"
            :key="sub.to"
            :to="{ name: sub.to }"
            class="flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 transition hover:bg-slate-100 lg:ml-5 dark:hover:bg-neutral-800/70"
            exact-active-class="!bg-black text-sand dark:!bg-sand dark:text-black"
          >
            <component :is="sub.icon" class="h-3.5 w-3.5 shrink-0" />
            <span class="text-xs font-semibold">{{ sub.label }}</span>
          </RouterLink>
        </template>
      </template>
    </nav>
  </aside>
</template>
