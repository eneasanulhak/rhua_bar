<script setup lang="ts">
import { computed, watch } from 'vue'
import { AlertTriangle, ArrowUpRight, Landmark, Wallet } from 'lucide-vue-next'
import DreTabela from '@/components/DreTabela.vue'
import { useDreStore, useNotificacoesStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import { brl, dateBR } from '@/utils/format'

const ui = useUiStore()
const dreStore = useDreStore()
const notificacoes = useNotificacoesStore()

// O DRE é calculado no servidor (GET /api/relatorios/dre), o mesmo usado nos relatórios.
watch(() => ui.mes, (mes) => dreStore.fetch(mes), { immediate: true })

const dre = computed(() => dreStore.dre)

const porCategoria = computed(() => {
  const linhas = dre.value?.despesas.categorias ?? []
  const max = linhas[0]?.total || 1
  return linhas.map((l) => ({ ...l, pct: (l.total / max) * 100 }))
})

const cor = (v: number) => (v >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')

const kpis = computed(() => {
  const d = dre.value
  if (!d) return []
  const resultado = d.resultadoFinal ?? d.resultadoOperacional
  return [
    { rotulo: 'Faturamento', valor: d.faturamento.total, icone: ArrowUpRight, cor: cor(1) },
    {
      rotulo: d.resultadoFinal === null ? 'Resultado operacional' : 'Resultado do período',
      dica: 'Faturamento − tudo que vence no período, pago ou não',
      valor: resultado,
      icone: Wallet,
      cor: cor(resultado),
    },
    {
      rotulo: 'Saldo de caixa',
      dica: 'Faturamento − o que já foi pago',
      valor: d.saldoCaixa,
      icone: Landmark,
      cor: cor(d.saldoCaixa),
    },
    { rotulo: 'A pagar', valor: d.aPagar, icone: AlertTriangle, cor: 'text-amber-600 dark:text-amber-400' },
  ]
})
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
      <div v-for="k in kpis" :key="k.rotulo" class="card p-5" :title="'dica' in k ? k.dica : undefined">
        <div class="flex items-center justify-between">
          <span class="label !mb-0">{{ k.rotulo }}</span>
          <component :is="k.icone" class="h-4 w-4" :class="k.cor" />
        </div>
        <p class="mt-2 text-xl font-extrabold tracking-tight sm:text-2xl" :class="k.cor">{{ brl(k.valor) }}</p>
      </div>
    </div>

    <p v-if="dreStore.error" class="card p-4 text-xs text-rose-600">{{ dreStore.error }}</p>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="card p-5">
        <h2 class="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">DRE do período</h2>
        <DreTabela v-if="dre" :dre="dre" />
        <p v-else class="text-xs text-slate-400">Carregando…</p>
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

    <section class="card p-5">
      <h2 class="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Despesas operacionais por categoria</h2>
      <p v-if="!porCategoria.length" class="text-xs text-slate-400">Sem despesas no período.</p>
      <ul class="grid gap-x-8 gap-y-3 md:grid-cols-2">
        <li v-for="c in porCategoria" :key="c.categoria">
          <div class="mb-1 flex justify-between text-xs">
            <span>{{ c.categoria }}</span>
            <span class="font-bold">{{ brl(c.total) }}</span>
          </div>
          <div class="h-1.5 rounded-full bg-slate-100 dark:bg-neutral-800">
            <div class="h-1.5 rounded-full bg-sand-dark dark:bg-sand" :style="{ width: `${c.pct}%` }" />
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>
