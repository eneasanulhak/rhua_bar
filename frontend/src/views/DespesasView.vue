<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AlertTriangle, CheckCircle2, Clock, Pencil, Plus, Receipt, Search, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useDespesasStore } from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, type Despesa, type Input, type TransactionStatus } from '@/types'
import { brl, dateBR, today } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const store = useDespesasStore()

watch(() => ui.mes, (mes) => store.fetchAll(mes), { immediate: true })

const STATUS: { value: TransactionStatus; label: string }[] = [
  { value: 'Pendente', label: 'Pendente' },
  { value: 'Atrasado', label: 'Atrasado' },
  { value: 'Compensado', label: 'Compensado (Pago)' },
]

const busca = ref('')
const filtroCategoria = ref('')
const filtroStatus = ref('')

const filtrados = computed(() => {
  const termo = busca.value.toLowerCase()
  return store.items.filter(
    (d) =>
      (!filtroCategoria.value || d.categoria === filtroCategoria.value) &&
      (!filtroStatus.value || d.status === filtroStatus.value) &&
      (d.descricao.toLowerCase().includes(termo) || d.fornecedorOuFavorecido.toLowerCase().includes(termo)),
  )
})

const totalFiltrado = computed(() => filtrados.value.reduce((soma, d) => soma + d.valor, 0))

const vazio = (): Input<Despesa> => ({
  descricao: '',
  fornecedorOuFavorecido: '',
  categoria: 'Compras Bar e Salão',
  formaPagamento: 'Boleto',
  valor: 0,
  dataEmissao: today(),
  dataVencimento: today(),
  dataPagamento: null,
  status: 'Pendente',
  numeroNF: '',
  parcela: '',
  observacao: '',
})

const modalAberto = ref(false)
const editandoId = ref<number | null>(null)
const form = reactive(vazio())
const salvando = ref(false)
const erroForm = ref('')

function abrir(item?: Despesa) {
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

const alternando = ref<number | null>(null)

async function alternarPagamento(item: Despesa) {
  alternando.value = item.id
  try {
    // O servidor define a data de pagamento ao compensar e a limpa ao desfazer.
    await store.setStatus(item.id, item.status === 'Compensado' ? 'Pendente' : 'Compensado')
  } catch (e) {
    alert((e as Error).message)
  } finally {
    alternando.value = null
  }
}

async function excluir(item: Despesa) {
  if (!confirm(`Excluir a despesa "${item.descricao}" (${item.fornecedorOuFavorecido})?`)) return
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
          <Receipt class="h-5 w-5 text-rose-600 dark:text-rose-400" />
          Despesas & Contas de Fornecedores
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Lançamento e controle de despesas operacionais, fixas e boletos
        </p>
      </div>
      <button v-if="auth.can('add_despesas')" class="btn-primary" @click="abrir()">
        <Plus class="h-4 w-4" /> Nova Despesa
      </button>
    </div>

    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div class="relative">
        <Search class="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input v-model="busca" type="text" placeholder="Buscar por fornecedor ou descrição..." class="input !pl-9" />
      </div>
      <select v-model="filtroCategoria" class="input cursor-pointer" aria-label="Filtrar por categoria">
        <option value="">Todas as Categorias</option>
        <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
      </select>
      <select v-model="filtroStatus" class="input cursor-pointer" aria-label="Filtrar por status">
        <option value="">Todos os Status</option>
        <option v-for="s in STATUS" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
    </div>

    <p class="text-right text-xs text-slate-500 dark:text-slate-400">
      Exibindo <strong class="text-slate-900 dark:text-slate-100">{{ filtrados.length }}</strong> despesa(s) ·
      Total <strong class="text-rose-600 dark:text-rose-400">{{ brl(totalFiltrado) }}</strong>
    </p>

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
              <th class="p-3.5">Forma</th>
              <th class="p-3.5 text-rose-600 dark:text-rose-400">Valor</th>
              <th class="p-3.5">Vencimento</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-if="store.loading">
              <td colspan="8" class="p-8 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td colspan="8" class="p-8 text-center text-slate-400">
                Nenhuma despesa encontrada para os filtros selecionados.
              </td>
            </tr>
            <tr
              v-for="d in filtrados"
              v-else
              :key="d.id"
              class="transition-colors hover:bg-slate-50/60 dark:hover:bg-neutral-800/50"
            >
              <td class="p-3.5 font-bold whitespace-nowrap text-slate-900 dark:text-slate-100">
                {{ d.fornecedorOuFavorecido }}
                <span
                  v-if="d.parcela"
                  class="ml-2 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-500 dark:border-slate-700 dark:bg-neutral-800 dark:text-slate-400"
                >
                  {{ d.parcela }}
                </span>
              </td>
              <td class="max-w-xs truncate p-3.5 text-slate-600 dark:text-slate-400" :title="d.observacao ?? undefined">
                {{ d.descricao }}
              </td>
              <td class="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400">{{ d.categoria }}</td>
              <td class="p-3.5 font-medium whitespace-nowrap">{{ d.formaPagamento }}</td>
              <td class="p-3.5 text-sm font-extrabold whitespace-nowrap text-rose-600 dark:text-rose-400">
                {{ brl(d.valor) }}
              </td>
              <td class="p-3.5 whitespace-nowrap text-slate-600 dark:text-slate-400">{{ dateBR(d.dataVencimento) }}</td>
              <td class="p-3.5 whitespace-nowrap">
                <span
                  v-if="d.status === 'Compensado'"
                  class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                  :title="d.dataPagamento ? `Pago em ${dateBR(d.dataPagamento)}` : undefined"
                >
                  <CheckCircle2 class="h-3 w-3" /> Compensado
                </span>
                <span
                  v-else-if="d.status === 'Atrasado'"
                  class="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
                >
                  <AlertTriangle class="h-3 w-3" /> Atrasado
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
                >
                  <Clock class="h-3 w-3" /> Pendente
                </span>
              </td>
              <td class="space-x-1 p-3.5 text-right whitespace-nowrap">
                <button
                  v-if="auth.can('compensar_despesas')"
                  class="cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all disabled:opacity-50"
                  :class="
                    d.status === 'Compensado'
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-400 dark:hover:bg-neutral-700'
                      : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500'
                  "
                  :title="d.status === 'Compensado' ? 'Marcar como Pendente' : 'Marcar como Pago'"
                  :disabled="alternando === d.id"
                  @click="alternarPagamento(d)"
                >
                  {{ d.status === 'Compensado' ? 'Desfazer' : 'Pagar' }}
                </button>
                <button
                  v-if="auth.can('edit_despesas')"
                  class="cursor-pointer rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  title="Editar"
                  @click="abrir(d)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  v-if="auth.can('delete_despesas')"
                  class="cursor-pointer rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                  title="Excluir"
                  @click="excluir(d)"
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
      :title="editandoId ? 'Editar Despesa' : 'Novo Lançamento de Despesa'"
      @close="modalAberto = false"
    >
      <form class="space-y-4" @submit.prevent="salvar">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="desp-fornecedor">Fornecedor / Favorecido</label>
            <input
              id="desp-fornecedor"
              v-model="form.fornecedorOuFavorecido"
              type="text"
              required
              maxlength="180"
              placeholder="ex: Zé Distribuidora, Ambev, Celesc"
              class="input"
            />
          </div>
          <div>
            <label class="label" for="desp-valor">Valor (R$)</label>
            <input
              id="desp-valor"
              v-model.number="form.valor"
              type="number"
              step="0.01"
              min="0"
              required
              class="input"
            />
          </div>
        </div>
        <div>
          <label class="label" for="desp-descricao">Descrição do lançamento</label>
          <input
            id="desp-descricao"
            v-model="form.descricao"
            type="text"
            required
            maxlength="255"
            placeholder="ex: Fornecimento de refrigerantes e latas"
            class="input"
          />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="desp-categoria">Categoria</label>
            <select id="desp-categoria" v-model="form.categoria" class="input">
              <option v-for="cat in EXPENSE_CATEGORIES" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div>
            <label class="label" for="desp-forma">Forma de pagamento</label>
            <select id="desp-forma" v-model="form.formaPagamento" class="input">
              <option v-for="p in PAYMENT_METHODS" :key="p" :value="p">{{ p }}</option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="desp-emissao">Data de emissão</label>
            <input id="desp-emissao" v-model="form.dataEmissao" type="date" required class="input" />
          </div>
          <div>
            <label class="label" for="desp-vencimento">Data de vencimento</label>
            <input id="desp-vencimento" v-model="form.dataVencimento" type="date" required class="input" />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div>
            <label class="label" for="desp-status">Status</label>
            <select id="desp-status" v-model="form.status" class="input">
              <option v-for="s in STATUS" :key="s.value" :value="s.value">{{ s.value }}</option>
            </select>
          </div>
          <div>
            <label class="label" for="desp-nf">Número NF</label>
            <input id="desp-nf" v-model="form.numeroNF" type="text" maxlength="60" placeholder="NF-1234" class="input" />
          </div>
          <div>
            <label class="label" for="desp-parcela">Parcela</label>
            <input id="desp-parcela" v-model="form.parcela" type="text" maxlength="20" placeholder="1/3" class="input" />
          </div>
        </div>
        <div v-if="form.status === 'Compensado'">
          <label class="label" for="desp-pagamento">Data de pagamento</label>
          <input id="desp-pagamento" v-model="form.dataPagamento" type="date" class="input" />
          <p class="mt-1 text-[10px] text-slate-400">Em branco = hoje</p>
        </div>
        <div>
          <label class="label" for="desp-obs">Observação</label>
          <textarea id="desp-obs" v-model="form.observacao" rows="2" class="input" />
        </div>

        <p v-if="erroForm" class="rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {{ erroForm }}
        </p>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-ghost" @click="modalAberto = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="salvando">
            {{ salvando ? 'Salvando…' : 'Salvar Despesa' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
