<script setup lang="ts">
import { computed } from 'vue'
import type { Dre } from '@/types'
import { linhasDre, type LinhaDre } from '@/utils/dre'
import { brl } from '@/utils/format'

/**
 * DRE simplificado em duas colunas: competência (tudo que vence no período) e caixa (só o pago).
 * `detalhado` abre faturamento por meio e despesas por categoria.
 */
const props = defineProps<{ dre: Dre; detalhado?: boolean }>()

const linhas = computed(() => linhasDre(props.dre, props.detalhado))

const corValor = (l: LinhaDre, v: number) =>
  l.tipo === 'subtotal'
    ? v >= 0
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-rose-600 dark:text-rose-400'
    : l.tipo === 'custo'
      ? 'text-rose-600 dark:text-rose-400'
      : ''
</script>

<template>
  <div class="overflow-x-auto">
    <table class="w-full text-left text-xs">
      <thead class="border-b border-slate-100 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800">
        <tr>
          <th class="py-2 pr-3"></th>
          <th class="px-3 py-2 text-right" title="Tudo que vence no período, pago ou não">Resultado (competência)</th>
          <th class="py-2 pl-3 text-right" title="Somente o que já foi pago">Caixa (já pago)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(l, i) in linhas"
          :key="i"
          :class="{
            'border-t border-slate-200 font-extrabold dark:border-slate-700': l.tipo === 'subtotal',
            'font-bold': l.tipo === 'receita' || l.tipo === 'custo',
            'text-slate-500 dark:text-slate-400': l.tipo === 'detalhe',
          }"
        >
          <td class="py-1.5 pr-3" :class="{ 'pl-4': l.tipo === 'detalhe' }">{{ l.rotulo }}</td>
          <td class="px-3 py-1.5 text-right whitespace-nowrap" :class="corValor(l, l.competencia)">{{ brl(l.competencia) }}</td>
          <td class="py-1.5 pl-3 text-right whitespace-nowrap" :class="corValor(l, l.caixa)">{{ brl(l.caixa) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="mt-3 text-[10px] text-slate-400">
      Competência considera despesas pelo vencimento e diárias pela data do trabalho, pagas ou não.
      <template v-if="dre.faturamento.diferencaCaixa">
        Diferença de caixa no período: {{ brl(dre.faturamento.diferencaCaixa) }} (não incluída no faturamento).
      </template>
    </p>
  </div>
</template>
