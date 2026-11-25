<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Pencil, Plus, Search, Trash2, TrendingUp } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useFaturamentosStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import type { Faturamento, Input } from '@/types'
import { brl, dateBR, today } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const store = useFaturamentosStore()

watch(() => ui.mes, (mes) => store.fetchAll(mes), { immediate: true })

const busca = ref('')
const filtrados = computed(() => {
  const termo = busca.value.toLowerCase()
  return store.items.filter(
    (f) => f.data.includes(termo) || dateBR(f.data).includes(termo) || f.observacao?.toLowerCase().includes(termo),
  )
})

function total(f: Pick<Faturamento, 'dinheiro' | 'credito' | 'debito' | 'pix' | 'voucher' | 'sicoob'>) {
  return f.dinheiro + f.credito + f.debito + f.pix + f.voucher + f.sicoob
}

const MEIOS = [
  ['dinheiro', 'Dinheiro'],
  ['credito', 'Crédito'],
  ['debito', 'Débito'],
  ['pix', 'Pix'],
  ['voucher', 'Voucher'],
  ['sicoob', 'Sicoob'],
] as const

const vazio = (): Input<Faturamento> => ({
  data: today(),
  dinheiro: 0,
  credito: 0,
  debito: 0,
  pix: 0,
  voucher: 0,
  sicoob: 0,
  diferencaCaixa: 0,
  observacao: '',
})

const modalAberto = ref(false)
const editandoId = ref<number | null>(null)
const form = reactive(vazio())
const salvando = ref(false)
const erroForm = ref('')

function abrir(item?: Faturamento) {
  editandoId.value = item?.id ?? null
  Object.assign(form, vazio(), item ?? {})
  erroForm.value = ''
  modalAberto.value = true
}

async function salvar() {
  salvando.value = true
  erroForm.value = ''
  try {
    if (editandoId.value) await store.update(editandoId.value, { ...form })
    else await store.create({ ...form })
    modalAberto.value = false
  } catch (e) {
    erroForm.value = (e as Error).message
  } finally {
    salvando.value = false
  }
}

async function excluir(item: Faturamento) {
  if (!confirm(`Excluir o faturamento de ${dateBR(item.data)}?`)) return
  try {
    await store.remove(item.id)
  } catch (e) {
    alert((e as Error).message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-bold">
          <TrendingUp class="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          Faturamento Diário & Entradas
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Preenchimento manual de receitas por método de pagamento
        </p>
      </div>
      <button v-if="auth.can('add_faturamento')" class="btn-primary" @click="abrir()">
        <Plus class="h-4 w-4" /> Lançar Faturamento
      </button>
    </div>

    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div class="relative max-w-md flex-1">
        <Search class="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input v-model="busca" type="text" placeholder="Buscar por data ou observação..." class="input !pl-9" />
      </div>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Exibindo <strong class="text-slate-900 dark:text-slate-100">{{ filtrados.length }}</strong> dia(s)
      </p>
    </div>

    <p v-if="store.error" class="card p-4 text-xs text-rose-600">{{ store.error }}</p>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800/80 dark:bg-neutral-900 dark:text-slate-500"
          >
            <tr>
              <th class="p-3.5">Data</th>
              <th class="p-3.5">Dinheiro</th>
              <th class="p-3.5">Crédito</th>
              <th class="p-3.5">Débito</th>
              <th class="p-3.5">Pix</th>
              <th class="p-3.5">Sicoob/Outros</th>
              <th class="p-3.5 text-emerald-600 dark:text-emerald-400">Total Dia</th>
              <th class="p-3.5">Dif. Caixa</th>
              <th class="p-3.5">Observação</th>
              <th class="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-if="store.loading">
              <td colspan="10" class="p-8 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td colspan="10" class="p-8 text-center text-slate-400">Nenhum lançamento de faturamento encontrado.</td>
            </tr>
            <tr
              v-for="f in filtrados"
              v-else
              :key="f.id"
              class="transition-colors hover:bg-slate-50/60 dark:hover:bg-neutral-800/50"
            >
              <td class="p-3.5 font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">{{ dateBR(f.data) }}</td>
              <td class="p-3.5">{{ brl(f.dinheiro) }}</td>
              <td class="p-3.5">{{ brl(f.credito) }}</td>
              <td class="p-3.5">{{ brl(f.debito) }}</td>
              <td class="p-3.5 font-semibold text-emerald-600 dark:text-emerald-400">{{ brl(f.pix) }}</td>
              <td class="p-3.5">{{ brl(f.sicoob + f.voucher) }}</td>
              <td class="p-3.5 text-sm font-extrabold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                {{ brl(total(f)) }}
              </td>
              <td class="p-3.5 whitespace-nowrap">
                <span v-if="f.diferencaCaixa === 0" class="text-slate-400">{{ brl(0) }}</span>
                <span v-else-if="f.diferencaCaixa > 0" class="font-semibold text-emerald-600 dark:text-emerald-400">
                  +{{ brl(f.diferencaCaixa) }} (Sobra)
                </span>
                <span v-else class="font-semibold text-rose-600 dark:text-rose-400">
                  -{{ brl(Math.abs(f.diferencaCaixa)) }} (Falta)
                </span>
              </td>
              <td class="max-w-xs truncate p-3.5 text-slate-500 dark:text-slate-400">{{ f.observacao || '-' }}</td>
              <td class="space-x-1 p-3.5 text-right whitespace-nowrap">
                <button
                  v-if="auth.can('edit_faturamento')"
                  class="cursor-pointer rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  title="Editar"
                  @click="abrir(f)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  v-if="auth.can('delete_faturamento')"
                  class="cursor-pointer rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                  title="Excluir"
                  @click="excluir(f)"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal
      v-if="modalAberto"
      :title="editandoId ? 'Editar Faturamento' : 'Lançar Faturamento do Dia'"
      @close="modalAberto = false"
    >
      <form class="space-y-4" @submit.prevent="salvar">
        <div>
          <label class="label" for="fat-data">Data</label>
          <input id="fat-data" v-model="form.data" type="date" required class="input" />
        </div>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div v-for="[campo, rotulo] in MEIOS" :key="campo">
            <label class="label" :for="`fat-${campo}`">{{ rotulo }}</label>
            <input
              :id="`fat-${campo}`"
              v-model.number="form[campo]"
              type="number"
              step="0.01"
              min="0"
              class="input"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="fat-dif">Diferença de caixa</label>
            <input id="fat-dif" v-model.number="form.diferencaCaixa" type="number" step="0.01" class="input" />
            <p class="mt-1 text-[10px] text-slate-400">Negativo = falta, positivo = sobra</p>
          </div>
          <div class="text-right">
            <span class="label">Total do dia</span>
            <span class="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{{ brl(total(form)) }}</span>
          </div>
        </div>
        <div>
          <label class="label" for="fat-obs">Observação</label>
          <textarea id="fat-obs" v-model="form.observacao" rows="2" class="input" />
        </div>

        <p v-if="erroForm" class="rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {{ erroForm }}
        </p>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-ghost" @click="modalAberto = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="salvando">
            {{ salvando ? 'Salvando…' : 'Salvar' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
