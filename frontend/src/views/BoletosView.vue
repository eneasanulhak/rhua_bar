<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertCircle, AlertTriangle, Calendar, Check, Clock } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useDespesasStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import type { Despesa } from '@/types'
import { brl, dateBR, diasAte } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const store = useDespesasStore()

/**
 * Por padrão mostra todos os pendentes, independentemente do mês do topo, para que um boleto
 * atrasado de um mês anterior não suma da tela. O filtro de mês é opcional.
 */
const usarMes = ref(false)
const nomeMes = computed(() => ui.meses.find((m) => m.value === ui.mes)?.label ?? ui.mes)

watch(
  [() => ui.mes, usarMes],
  ([mes, usar]) => store.fetchAll(usar ? mes : undefined),
  { immediate: true },
)

type Filtro = 'todos' | 'atrasados' | 'hoje' | 'semana'
type Boleto = Despesa & { dias: number }

const filtro = ref<Filtro>('todos')

/** Despesas ainda não pagas, das mais antigas para as mais novas. */
const pendentes = computed<Boleto[]>(() =>
  store.items
    .filter((d) => d.status !== 'Compensado')
    .map((d) => ({ ...d, dias: diasAte(d.dataVencimento) }))
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
)

const CRITERIO: Record<Filtro, (b: Boleto) => boolean> = {
  todos: () => true,
  atrasados: (b) => b.dias < 0,
  hoje: (b) => b.dias === 0,
  semana: (b) => b.dias > 0 && b.dias <= 7,
}

function resumo(f: Filtro) {
  const itens = pendentes.value.filter(CRITERIO[f])
  return { qtd: itens.length, total: itens.reduce((soma, b) => soma + b.valor, 0) }
}

const filtrados = computed(() => pendentes.value.filter(CRITERIO[filtro.value]))

const CARDS = [
  {
    filtro: 'atrasados',
    titulo: 'Atrasados',
    dica: 'Requer regularização imediata',
    icon: AlertTriangle,
    cor: 'text-rose-600 dark:text-rose-400',
    ativo: 'border-rose-400 bg-rose-50 ring-2 ring-rose-500/20 dark:border-rose-700 dark:bg-rose-950/40',
    hover: 'hover:border-rose-300 dark:hover:border-rose-800',
  },
  {
    filtro: 'hoje',
    titulo: 'Vencem Hoje',
    dica: 'Data limite de pagamento hoje',
    icon: Clock,
    cor: 'text-amber-600 dark:text-amber-400',
    ativo: 'border-amber-400 bg-amber-50 ring-2 ring-amber-500/20 dark:border-amber-700 dark:bg-amber-950/40',
    hover: 'hover:border-amber-300 dark:hover:border-amber-800',
  },
  {
    filtro: 'semana',
    titulo: 'Próximos 7 Dias',
    dica: 'Previsão para a semana',
    icon: Calendar,
    cor: 'text-blue-600 dark:text-blue-400',
    ativo: 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20 dark:border-blue-700 dark:bg-blue-950/40',
    hover: 'hover:border-blue-300 dark:hover:border-blue-800',
  },
] as const

const ABAS: { filtro: Filtro; rotulo: string; ativo: string }[] = [
  { filtro: 'todos', rotulo: 'Todos os Pendentes', ativo: 'bg-black text-sand dark:bg-sand dark:text-black' },
  { filtro: 'atrasados', rotulo: 'Atrasados', ativo: 'bg-rose-600 text-white' },
  { filtro: 'hoje', rotulo: 'Vencem Hoje', ativo: 'bg-amber-600 text-white' },
  { filtro: 'semana', rotulo: 'Semana', ativo: 'bg-blue-600 text-white' },
]

function alternarCard(f: Filtro) {
  filtro.value = filtro.value === f ? 'todos' : f
}

const compensando = ref<number | null>(null)

async function compensar(b: Boleto) {
  if (!confirm(`Confirmar o pagamento de ${brl(b.valor)} para "${b.fornecedorOuFavorecido}"?`)) return
  compensando.value = b.id
  try {
    await store.setStatus(b.id, 'Compensado')
  } catch (e) {
    alert((e as Error).message)
  } finally {
    compensando.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-bold">
          <AlertCircle class="h-5 w-5 text-amber-500 dark:text-amber-400" />
          Controle de Boletos & Contas a Vencer
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Acompanhamento centralizado de obrigações com alerta de prazos de pagamento
        </p>
      </div>
      <label
        v-if="ui.mes !== 'all'"
        class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600 select-none dark:text-slate-300"
      >
        <input v-model="usarMes" type="checkbox" class="h-4 w-4 cursor-pointer accent-black dark:accent-sand" />
        Somente vencimentos de {{ nomeMes }}
      </label>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <button
        v-for="c in CARDS"
        :key="c.filtro"
        class="card cursor-pointer p-5 text-left transition-all"
        :class="filtro === c.filtro ? c.ativo : c.hover"
        :aria-pressed="filtro === c.filtro"
        @click="alternarCard(c.filtro)"
      >
        <span class="flex items-center gap-1.5 text-xs font-bold" :class="c.cor">
          <component :is="c.icon" class="h-4 w-4" />
          {{ c.titulo }} ({{ resumo(c.filtro).qtd }})
        </span>
        <p class="mt-2 text-2xl font-black text-slate-900 dark:text-white">{{ brl(resumo(c.filtro).total) }}</p>
        <p class="mt-1 text-[10px] font-semibold" :class="c.cor">{{ c.dica }}</p>
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
      <button
        v-for="a in ABAS"
        :key="a.filtro"
        class="cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-colors"
        :class="
          filtro === a.filtro
            ? a.ativo
            : 'bg-slate-100 text-slate-600 hover:text-slate-900 dark:bg-neutral-800 dark:text-slate-400 dark:hover:text-white'
        "
        @click="filtro = a.filtro"
      >
        {{ a.rotulo }} ({{ resumo(a.filtro).qtd }})
      </button>
    </div>

    <p v-if="store.error" class="card p-4 text-xs text-rose-600">{{ store.error }}</p>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800/80 dark:bg-neutral-900 dark:text-slate-500"
          >
            <tr>
              <th class="p-3.5">Fornecedor / Favorecido</th>
              <th class="p-3.5">Descrição</th>
              <th class="p-3.5">Categoria</th>
              <th class="p-3.5 text-rose-600 dark:text-rose-400">Valor</th>
              <th class="p-3.5">Vencimento</th>
              <th class="p-3.5">Prazo / Alerta</th>
              <th class="p-3.5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-if="store.loading">
              <td colspan="7" class="p-8 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td colspan="7" class="p-8 text-center text-slate-400">Nenhum boleto encontrado para este filtro.</td>
            </tr>
            <tr
              v-for="b in filtrados"
              v-else
              :key="b.id"
              class="transition-colors hover:bg-slate-50/60 dark:hover:bg-neutral-800/50"
            >
              <td class="p-3.5 font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">
                {{ b.fornecedorOuFavorecido }}
                <span
                  v-if="b.parcela"
                  class="ml-2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-neutral-800 dark:text-slate-400"
                >
                  {{ b.parcela }}
                </span>
              </td>
              <td class="max-w-xs truncate p-3.5 text-slate-600 dark:text-slate-400">{{ b.descricao }}</td>
              <td class="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{{ b.categoria }}</td>
              <td class="p-3.5 text-sm font-extrabold whitespace-nowrap text-rose-600 dark:text-rose-400">
                {{ brl(b.valor) }}
              </td>
              <td class="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">{{ dateBR(b.dataVencimento) }}</td>
              <td class="p-3.5 whitespace-nowrap">
                <span
                  v-if="b.dias < 0"
                  class="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  <AlertTriangle class="h-3 w-3" /> Venceu há {{ -b.dias }} dia(s)
                </span>
                <span
                  v-else-if="b.dias === 0"
                  class="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                >
                  <Clock class="h-3 w-3" /> Vence hoje
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:bg-neutral-800 dark:text-slate-400"
                >
                  <Calendar class="h-3 w-3" /> Em {{ b.dias }} dia(s)
                </span>
              </td>
              <td class="p-3.5 text-right whitespace-nowrap">
                <button
                  v-if="auth.can('compensar_despesas')"
                  class="ml-auto flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-500 active:scale-95 disabled:opacity-50"
                  :disabled="compensando === b.id"
                  @click="compensar(b)"
                >
                  <Check class="h-3.5 w-3.5" /> Compensar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
