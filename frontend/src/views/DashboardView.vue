<script setup lang="ts">
import { computed, watch } from 'vue'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDespesasStore, useFaturamentosStore, useNotificacoesStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import { brl, dateBR } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const faturamentos = useFaturamentosStore()
const despesas = useDespesasStore()
const notificacoes = useNotificacoesStore()

watch(
  () => ui.mes,
  (mes) => {
    if (auth.can('view_faturamento')) faturamentos.fetchAll(mes)
    if (auth.can('view_despesas')) despesas.fetchAll(mes)
  },
  { immediate: true },
)

const receita = computed(() =>
  faturamentos.items.reduce((s, f) => s + f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob, 0),
)
const totalDespesas = computed(() => despesas.items.reduce((s, d) => s + d.valor, 0))
const aPagar = computed(() =>
  despesas.items.filter((d) => d.status !== 'Compensado').reduce((s, d) => s + d.valor, 0),
)
const resultado = computed(() => receita.value - totalDespesas.value)

const porCategoria = computed(() => {
  const mapa = new Map<string, number>()
  for (const d of despesas.items) mapa.set(d.categoria, (mapa.get(d.categoria) ?? 0) + d.valor)
  const linhas = [...mapa].map(([categoria, valor]) => ({ categoria, valor })).sort((a, b) => b.valor - a.valor)
  const max = linhas[0]?.valor ?? 1
  return linhas.map((l) => ({ ...l, pct: (l.valor / max) * 100 }))
})

const kpis = computed(() => [
  { rotulo: 'Faturamento', valor: receita.value, icone: ArrowUpRight, cor: 'text-emerald-600 dark:text-emerald-400' },
  { rotulo: 'Despesas', valor: totalDespesas.value, icone: ArrowDownRight, cor: 'text-rose-600 dark:text-rose-400' },
  {
    rotulo: 'Resultado',
    valor: resultado.value,
    icone: Wallet,
    cor: resultado.value >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
  },
  { rotulo: 'A pagar', valor: aPagar.value, icone: AlertTriangle, cor: 'text-amber-600 dark:text-amber-400' },
])
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div v-for="k in kpis" :key="k.rotulo" class="card p-5">
        <div class="flex items-center justify-between">
          <span class="label !mb-0">{{ k.rotulo }}</span>
          <component :is="k.icone" class="h-4 w-4" :class="k.cor" />
        </div>
        <p class="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl" :class="k.cor">{{ brl(k.valor) }}</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="card p-5">
        <h2 class="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Despesas por categoria</h2>
        <p v-if="!porCategoria.length" class="text-xs text-slate-400">Sem despesas no período.</p>
        <ul class="space-y-3">
          <li v-for="c in porCategoria" :key="c.categoria">
            <div class="mb-1 flex justify-between text-xs">
              <span>{{ c.categoria }}</span>
              <span class="font-bold">{{ brl(c.valor) }}</span>
            </div>
            <div class="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800">
              <div class="h-1.5 rounded-full bg-sand-dark dark:bg-sand" :style="{ width: `${c.pct}%` }" />
            </div>
          </li>
        </ul>
      </section>

      <section class="card p-5">
        <h2 class="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Vencimentos (próximos 7 dias e atrasados)</h2>
        <p v-if="!notificacoes.items.length" class="text-xs text-slate-400">Nenhum vencimento pendente.</p>
        <ul class="space-y-2">
          <li
            v-for="n in notificacoes.items"
            :key="n.id"
            class="rounded-xl border-l-4 bg-slate-50 p-3 text-xs dark:bg-neutral-900"
            :class="{
              'border-rose-500': n.type === 'urgent',
              'border-amber-500': n.type === 'warning',
              'border-sky-500': n.type === 'info',
            }"
          >
            <p class="font-bold">{{ n.title }} · {{ dateBR(n.date) }}</p>
            <p class="text-slate-500 dark:text-slate-400">{{ n.message }}</p>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
