<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Download, FileSpreadsheet, FileText, Lock } from 'lucide-vue-next'
import DreTabela from '@/components/DreTabela.vue'
import { useAuthStore } from '@/stores/auth'
import { useDespesasStore, useDreStore, useExtrasStore, useFaturamentosStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import { nomePeriodo } from '@/utils/dre'

const auth = useAuthStore()
const ui = useUiStore()
const dreStore = useDreStore()
const faturamentos = useFaturamentosStore()
const despesas = useDespesasStore()
const extras = useExtrasStore()

watch(() => ui.mes, (mes) => dreStore.fetch(mes), { immediate: true })

const periodo = computed(() => nomePeriodo(ui.mes))
const podeExportar = computed(() => auth.can('export_reports'))

const gerando = ref<'excel' | 'pdf' | null>(null)
const erro = ref('')

/** Busca os lançamentos do período e gera o arquivo (as bibliotecas só carregam aqui). */
async function exportar(formato: 'excel' | 'pdf') {
  gerando.value = formato
  erro.value = ''
  try {
    const mes = ui.mes
    await Promise.all([dreStore.fetch(mes), faturamentos.fetchAll(mes), despesas.fetchAll(mes), extras.fetchAll(mes)])
    const falha = dreStore.error || faturamentos.error || despesas.error || extras.error
    if (falha || !dreStore.dre) throw new Error(falha || 'Não foi possível carregar os dados do período.')

    const dados = {
      mes,
      dre: dreStore.dre,
      faturamentos: [...faturamentos.items].sort((a, b) => a.data.localeCompare(b.data)),
      despesas: [...despesas.items].sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento)),
      extras: [...extras.items].sort((a, b) => a.data.localeCompare(b.data)),
    }
    const { exportarExcel, exportarPdf } = await import('@/services/exportar')
    if (formato === 'excel') await exportarExcel(dados)
    else exportarPdf(dados)
  } catch (e) {
    erro.value = (e as Error).message
  } finally {
    gerando.value = null
  }
}

const CARDS = [
  {
    formato: 'excel',
    titulo: 'Planilha Excel (.xlsx)',
    texto:
      'Abas de DRE, faturamento diário, despesas, contas pendentes e diárias de extras. ' +
      'Valores como números, prontos para somar e filtrar.',
    botao: 'Baixar planilha Excel',
    icon: FileSpreadsheet,
    cor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    formato: 'pdf',
    titulo: 'Demonstrativo PDF',
    texto:
      'Documento para impressão ou envio por e-mail: DRE do período, contas pendentes em destaque, ' +
      'faturamento diário e diárias de extras.',
    botao: 'Baixar documento PDF',
    icon: FileText,
    cor: 'text-rose-600 dark:text-rose-400',
  },
] as const
</script>

<template>
  <div class="space-y-6">
    <div class="card p-5">
      <h2 class="flex items-center gap-2 text-lg font-bold">
        <FileSpreadsheet class="h-5 w-5 text-sand-dark dark:text-sand" />
        Relatórios & Exportação
      </h2>
      <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
        DRE e demonstrativos do período selecionado no topo ({{ periodo }}), em Excel ou PDF
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-2">
      <div v-for="c in CARDS" :key="c.formato" class="card flex flex-col justify-between gap-4 p-5">
        <div>
          <h3 class="flex items-center gap-2 text-base font-bold">
            <component :is="c.icon" class="h-5 w-5" :class="c.cor" />
            {{ c.titulo }}
          </h3>
          <p class="mt-2 text-xs text-slate-500 dark:text-slate-400">{{ c.texto }}</p>
        </div>
        <button class="btn-primary self-start" :disabled="!podeExportar || gerando !== null" @click="exportar(c.formato)">
          <Download class="h-4 w-4" />
          {{ gerando === c.formato ? 'Gerando…' : c.botao }}
        </button>
      </div>
    </div>

    <p v-if="!podeExportar" class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <Lock class="h-3.5 w-3.5" /> Seu perfil pode ver o DRE, mas não exportar relatórios.
    </p>
    <p v-if="erro" class="card p-4 text-xs text-rose-600">{{ erro }}</p>

    <section class="card p-5">
      <h3 class="mb-4 text-xs font-bold tracking-wider text-slate-500 uppercase">Prévia do DRE · {{ periodo }}</h3>
      <p v-if="dreStore.error" class="text-xs text-rose-600">{{ dreStore.error }}</p>
      <DreTabela v-else-if="dreStore.dre" :dre="dreStore.dre" detalhado />
      <p v-else class="text-xs text-slate-400">Carregando…</p>
    </section>
  </div>
</template>
