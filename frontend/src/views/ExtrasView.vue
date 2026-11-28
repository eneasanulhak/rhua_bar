<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Pencil, Plus, Search, Trash2, Users } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { useAuthStore } from '@/stores/auth'
import {
  useColaboradoresStore,
  useExtrasStore,
  useFormasPagamentoStore,
  useFuncoesStore,
  useSetoresStore,
} from '@/stores/resources'
import { useUiStore } from '@/stores/ui'
import type { Extra, ExtraInput } from '@/types'
import { brl, dateBR, today } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const store = useExtrasStore()
const setores = useSetoresStore()
const funcoes = useFuncoesStore()
const formas = useFormasPagamentoStore()
const colaboradores = useColaboradoresStore()

watch(() => ui.mes, (mes) => store.fetchAll(mes), { immediate: true })
onMounted(() => Promise.all([setores.fetchAll(), funcoes.fetchAll(), formas.fetchAll(), colaboradores.fetchAll()]))

// --- Listagem -------------------------------------------------------------

const setorSelecionado = ref<number | 'TODOS'>('TODOS')
const busca = ref('')

/** Um card por setor ativo (e por inativo que ainda tenha diárias no período). */
const cardsSetor = computed(() => {
  const usados = new Set(store.items.map((e) => e.setorId))
  const lista = setores.items.filter((s) => s.ativo || usados.has(s.id))
  return [{ id: 'TODOS' as const, nome: 'TODOS' }, ...lista].map((setor) => {
    const registros = setor.id === 'TODOS' ? store.items : store.items.filter((e) => e.setorId === setor.id)
    return { ...setor, qtd: registros.length, total: registros.reduce((soma, e) => soma + e.valorAReceber, 0) }
  })
})

const filtrados = computed(() => {
  const termo = busca.value.toLowerCase()
  return store.items.filter(
    (e) =>
      (setorSelecionado.value === 'TODOS' || e.setorId === setorSelecionado.value) &&
      [e.nome, e.funcao, e.setor].some((campo) => campo.toLowerCase().includes(termo)),
  )
})

const totalPago = computed(() =>
  filtrados.value.filter((e) => e.status === 'PAGO').reduce((soma, e) => soma + e.valorAReceber, 0),
)
const totalPendente = computed(() =>
  filtrados.value.filter((e) => e.status === 'PENDENTE').reduce((soma, e) => soma + e.valorAReceber, 0),
)

// --- Formulário -----------------------------------------------------------

/** Setor, função e forma ficam vazios (null) até serem escolhidos ou vindos do colaborador. */
type FormExtra = Omit<ExtraInput, 'setorId' | 'funcaoId' | 'formaPagamentoId'> & {
  setorId: number | null
  funcaoId: number | null
  formaPagamentoId: number | null
}

const vazio = (): FormExtra => ({
  data: today(),
  nome: '',
  setorId: null,
  funcaoId: null,
  valorAReceber: 0,
  formaPagamentoId: formas.items.find((f) => f.ativo && f.usaExtras && f.nome === 'Dinheiro')?.id ?? null,
  status: 'PAGO',
  observacao: '',
})

const modalAberto = ref(false)
const editandoId = ref<number | null>(null)
const form = reactive(vazio())
const salvando = ref(false)
const erroForm = ref('')

// Nos selects aparecem só os itens ativos (e válidos), mais o já usado pela diária em edição.
const opcoesSetor = computed(() => setores.items.filter((s) => s.ativo || s.id === form.setorId))
const opcoesFuncao = computed(() =>
  funcoes.items.filter((f) => f.id === form.funcaoId || (f.ativo && f.setorId === form.setorId)),
)
const opcoesForma = computed(() =>
  formas.items.filter((f) => (f.ativo && f.usaExtras) || f.id === form.formaPagamentoId),
)
const colaboradoresAtivos = computed(() => colaboradores.items.filter((c) => c.ativo))

const colaboradorEscolhido = computed(() => {
  const nome = form.nome.trim().toLowerCase()
  return nome ? colaboradores.items.find((c) => c.nome.toLowerCase() === nome) : undefined
})
const colaboradorNovo = computed(() => !!form.nome.trim() && !colaboradorEscolhido.value)

/** Ao escolher um colaborador num lançamento novo, preenche setor, função e diária com os padrões dele. */
watch(colaboradorEscolhido, (colab) => {
  if (!colab || editandoId.value) return
  if (colab.setorId) form.setorId = colab.setorId
  if (colab.funcaoId) form.funcaoId = colab.funcaoId
  if (colab.valorDiaria) form.valorAReceber = colab.valorDiaria
})

function trocarSetor() {
  if (!funcoes.items.some((f) => f.id === form.funcaoId && f.setorId === form.setorId)) {
    const doSetor = opcoesFuncao.value.filter((f) => f.setorId === form.setorId)
    form.funcaoId = doSetor.length === 1 ? doSetor[0]!.id : null
  }
}

function abrir(item?: Extra) {
  editandoId.value = item?.id ?? null
  Object.assign(form, vazio(), item ?? {})
  erroForm.value = ''
  modalAberto.value = true
}

async function salvar() {
  const { setorId, funcaoId, formaPagamentoId } = form
  if (!setorId || !funcaoId || !formaPagamentoId) {
    erroForm.value = 'Escolha o setor, a função e a forma de pagamento.'
    return
  }
  salvando.value = true
  erroForm.value = ''
  try {
    const payload: ExtraInput = { ...form, setorId, funcaoId, formaPagamentoId }
    if (editandoId.value) await store.update(editandoId.value, payload)
    else await store.create(payload)
    modalAberto.value = false
  } catch (e) {
    erroForm.value = (e as Error).message
  } finally {
    salvando.value = false
  }
}

// --- Ações da linha -------------------------------------------------------

const alternando = ref<number | null>(null)

async function alternarPagamento(item: Extra) {
  alternando.value = item.id
  try {
    await store.update(item.id, { status: item.status === 'PAGO' ? 'PENDENTE' : 'PAGO' })
  } catch (e) {
    alert((e as Error).message)
  } finally {
    alternando.value = null
  }
}

async function excluir(item: Extra) {
  if (!confirm(`Excluir a diária de ${item.nome} em ${dateBR(item.data)}?`)) return
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
          <Users class="h-5 w-5 text-sand-dark dark:text-sand" />
          Operacional – Pagamento de Extras
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Gestão diária da equipe extra de salão, bar, cozinha, limpeza e segurança
        </p>
      </div>
      <button v-if="auth.can('add_despesas')" class="btn-primary" @click="abrir()">
        <Plus class="h-4 w-4" /> Lançar Diária Extra
      </button>
    </div>

    <div class="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
      <button
        v-for="c in cardsSetor"
        :key="c.id"
        type="button"
        class="cursor-pointer rounded-2xl border p-3 text-left transition-all"
        :class="
          setorSelecionado === c.id
            ? 'border-sand-dark bg-sand text-slate-950 shadow-md'
            : 'border-slate-200 bg-white text-slate-700 hover:border-sand-dark dark:border-slate-800 dark:bg-panel dark:text-slate-200'
        "
        :aria-pressed="setorSelecionado === c.id"
        @click="setorSelecionado = c.id"
      >
        <div class="truncate text-[10px] font-black tracking-wider">{{ c.nome }}</div>
        <div class="mt-1 text-lg font-black">{{ c.qtd }}</div>
        <div class="text-[10px]" :class="setorSelecionado === c.id ? 'text-slate-700' : 'text-slate-500'">
          {{ brl(c.total) }}
        </div>
      </button>
    </div>

    <div class="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
      <div class="card flex items-center justify-between p-4">
        <span class="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">Diárias pagas</span>
        <span class="text-xl font-black text-emerald-600 dark:text-emerald-400">{{ brl(totalPago) }}</span>
      </div>
      <div class="card flex items-center justify-between p-4">
        <span class="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">A pagar</span>
        <span class="text-xl font-black text-amber-600 dark:text-amber-400">{{ brl(totalPendente) }}</span>
      </div>
    </div>

    <p v-if="store.error" class="card p-4 text-xs text-rose-600">{{ store.error }}</p>

    <div class="card overflow-hidden">
      <div
        class="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800/80 dark:bg-neutral-900/50"
      >
        <div class="relative w-full max-w-xs">
          <Search class="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input v-model="busca" type="text" placeholder="Buscar por nome, setor ou função..." class="input !pl-9" />
        </div>
        <span class="text-xs font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
          {{ filtrados.length }} registro(s)
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800/80 dark:bg-neutral-900 dark:text-slate-500"
          >
            <tr>
              <th class="p-3.5">Data</th>
              <th class="p-3.5">Colaborador</th>
              <th class="p-3.5">Setor</th>
              <th class="p-3.5">Função</th>
              <th class="p-3.5">Valor</th>
              <th class="p-3.5">Pagamento</th>
              <th class="p-3.5">Status</th>
              <th class="p-3.5">Observação</th>
              <th class="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-if="store.loading">
              <td colspan="9" class="p-8 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td colspan="9" class="p-8 text-center text-slate-400">Nenhum registro de extra encontrado.</td>
            </tr>
            <tr
              v-for="e in filtrados"
              v-else
              :key="e.id"
              class="transition-colors hover:bg-slate-50/60 dark:hover:bg-neutral-800/50"
            >
              <td class="p-3.5 font-semibold whitespace-nowrap text-slate-800 dark:text-slate-100">{{ dateBR(e.data) }}</td>
              <td class="p-3.5 font-bold text-slate-900 dark:text-white">{{ e.nome }}</td>
              <td class="p-3.5">
                <span
                  class="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {{ e.setor }}
                </span>
              </td>
              <td class="p-3.5">
                <span
                  class="rounded border border-sand/50 bg-sand/30 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:text-sand"
                >
                  {{ e.funcao }}
                </span>
              </td>
              <td class="p-3.5 font-bold whitespace-nowrap text-emerald-600 dark:text-emerald-400">
                {{ brl(e.valorAReceber) }}
              </td>
              <td class="p-3.5 text-slate-600 dark:text-slate-400">{{ e.formaPagamento }}</td>
              <td class="p-3.5">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold"
                  :class="
                    e.status === 'PAGO'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  "
                >
                  {{ e.status }}
                </span>
              </td>
              <td class="max-w-xs truncate p-3.5 text-slate-500 dark:text-slate-400">{{ e.observacao || '-' }}</td>
              <td class="space-x-1 p-3.5 text-right whitespace-nowrap">
                <button
                  v-if="auth.can('edit_despesas')"
                  class="cursor-pointer rounded-lg px-2.5 py-1 text-[10px] font-bold transition-all disabled:opacity-50"
                  :class="
                    e.status === 'PAGO'
                      ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-400 dark:hover:bg-neutral-700'
                      : 'bg-emerald-600 text-white shadow-xs hover:bg-emerald-500'
                  "
                  :title="e.status === 'PAGO' ? 'Marcar como Pendente' : 'Marcar como Pago'"
                  :disabled="alternando === e.id"
                  @click="alternarPagamento(e)"
                >
                  {{ e.status === 'PAGO' ? 'Desfazer' : 'Pagar' }}
                </button>
                <button
                  v-if="auth.can('edit_despesas')"
                  class="cursor-pointer rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  title="Editar"
                  @click="abrir(e)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  v-if="auth.can('delete_despesas')"
                  class="cursor-pointer rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                  title="Excluir"
                  @click="excluir(e)"
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
      :title="editandoId ? 'Editar Diária de Extra' : 'Lançar Diária de Extra'"
      @close="modalAberto = false"
    >
      <form class="space-y-4" @submit.prevent="salvar">
        <div>
          <label class="label" for="ext-nome">Colaborador</label>
          <input
            id="ext-nome"
            v-model="form.nome"
            type="text"
            required
            maxlength="120"
            list="ext-colaboradores"
            autocomplete="off"
            placeholder="Digite para buscar ou cadastrar"
            class="input"
          />
          <datalist id="ext-colaboradores">
            <option v-for="c in colaboradoresAtivos" :key="c.id" :value="c.nome" />
          </datalist>
          <p v-if="colaboradorNovo" class="mt-1 text-[10px] font-semibold text-sand-dark dark:text-sand">
            Novo colaborador: será cadastrado ao salvar, com este setor, função e valor como padrão.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="ext-data">Data do trabalho</label>
            <input id="ext-data" v-model="form.data" type="date" required class="input" />
          </div>
          <div>
            <label class="label" for="ext-valor">Valor a receber (R$)</label>
            <input
              id="ext-valor"
              v-model.number="form.valorAReceber"
              type="number"
              step="0.01"
              min="0"
              required
              class="input"
            />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="ext-setor">Setor</label>
            <select id="ext-setor" v-model="form.setorId" required class="input" @change="trocarSetor">
              <option :value="null" disabled>Selecione…</option>
              <option v-for="s in opcoesSetor" :key="s.id" :value="s.id">
                {{ s.nome }}{{ s.ativo ? '' : ' (inativo)' }}
              </option>
            </select>
          </div>
          <div>
            <label class="label" for="ext-funcao">Função</label>
            <select id="ext-funcao" v-model="form.funcaoId" required class="input" :disabled="!form.setorId">
              <option :value="null" disabled>{{ form.setorId ? 'Selecione…' : 'Escolha o setor' }}</option>
              <option v-for="f in opcoesFuncao" :key="f.id" :value="f.id">
                {{ f.nome }}{{ f.ativo ? '' : ' (inativa)' }}
              </option>
            </select>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label" for="ext-forma">Forma de pagamento</label>
            <select id="ext-forma" v-model="form.formaPagamentoId" required class="input">
              <option :value="null" disabled>Selecione…</option>
              <option v-for="f in opcoesForma" :key="f.id" :value="f.id">
                {{ f.nome }}{{ f.ativo && f.usaExtras ? '' : ' (inativa)' }}
              </option>
            </select>
          </div>
          <div>
            <label class="label" for="ext-status">Status</label>
            <select id="ext-status" v-model="form.status" class="input">
              <option value="PAGO">PAGO</option>
              <option value="PENDENTE">PENDENTE</option>
            </select>
          </div>
        </div>
        <div>
          <label class="label" for="ext-obs">Observações / hora extra</label>
          <input
            id="ext-obs"
            v-model="form.observacao"
            type="text"
            placeholder="ex: Hora extra pré-abertura"
            class="input"
          />
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
