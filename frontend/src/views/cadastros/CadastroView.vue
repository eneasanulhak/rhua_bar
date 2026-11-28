<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { Pencil, Plus, Search, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { CADASTROS, type CadastroConfig, type ItemCadastro, type TipoCadastro } from './config'

/** Tela genérica dos cadastros auxiliares; o tipo vem da rota. */
const props = defineProps<{ tipo: TipoCadastro }>()

const config = computed<CadastroConfig>(() => CADASTROS[props.tipo])
const store = computed(() => config.value.store())
const colunas = computed(() => config.value.campos.filter((c) => c.coluna))

const busca = ref('')
const mostrarInativos = ref(false)

watch(
  () => props.tipo,
  () => {
    busca.value = ''
    store.value.fetchAll()
  },
  { immediate: true },
)

const filtrados = computed(() => {
  const termo = busca.value.toLowerCase()
  return store.value.items.filter(
    (i) =>
      (mostrarInativos.value || i.ativo) &&
      config.value.campos.some((c) => c.tipo !== 'marcacao' && String(i[c.key] ?? '').toLowerCase().includes(termo)),
  )
})
const qtdInativos = computed(() => store.value.items.filter((i) => !i.ativo).length)

// --- Formulário -----------------------------------------------------------

function vazio(): Record<string, unknown> {
  const valores: Record<string, unknown> = { ativo: true }
  for (const c of config.value.campos) valores[c.key] = c.tipo === 'marcacao' ? c.key === 'usaDespesas' : ''
  return valores
}

const modalAberto = ref(false)
const editandoId = ref<number | null>(null)
const form = reactive<Record<string, unknown>>({})
const salvando = ref(false)
const erroForm = ref('')

function abrir(item?: ItemCadastro) {
  editandoId.value = item?.id ?? null
  for (const key of Object.keys(form)) delete form[key]
  const base = vazio()
  for (const key of Object.keys(base)) form[key] = item?.[key] ?? base[key]
  erroForm.value = ''
  modalAberto.value = true
}

async function salvar() {
  salvando.value = true
  erroForm.value = ''
  try {
    if (editandoId.value) await store.value.update(editandoId.value, { ...form })
    else await store.value.create({ ...form })
    modalAberto.value = false
  } catch (e) {
    erroForm.value = (e as Error).message
  } finally {
    salvando.value = false
  }
}

// --- Ações da linha -------------------------------------------------------

async function alternarAtivo(item: ItemCadastro) {
  try {
    await store.value.update(item.id, { ativo: !item.ativo })
  } catch (e) {
    alert((e as Error).message)
  }
}

async function excluir(item: ItemCadastro) {
  if (!confirm(`Excluir "${item.nome}"?`)) return
  try {
    await store.value.remove(item.id)
  } catch (e) {
    // Em uso em lançamentos: a API recusa e orienta a inativar.
    alert((e as Error).message)
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="card flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
      <div>
        <h2 class="flex items-center gap-2 text-lg font-bold">
          <component :is="config.icon" class="h-5 w-5 text-sand-dark dark:text-sand" />
          {{ config.titulo }}
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{{ config.subtitulo }}</p>
      </div>
      <button class="btn-primary" @click="abrir()"><Plus class="h-4 w-4" /> {{ config.novo }}</button>
    </div>

    <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div class="relative max-w-md flex-1">
        <Search class="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
        <input v-model="busca" type="text" placeholder="Buscar..." class="input !pl-9" />
      </div>
      <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-600 select-none dark:text-slate-300">
        <input v-model="mostrarInativos" type="checkbox" class="h-4 w-4 cursor-pointer accent-black dark:accent-sand" />
        Mostrar inativos ({{ qtdInativos }})
      </label>
    </div>

    <p v-if="store.error" class="card p-4 text-xs text-rose-600">{{ store.error }}</p>

    <div class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800/80 dark:bg-neutral-900 dark:text-slate-500"
          >
            <tr>
              <th v-for="c in colunas" :key="c.key" class="p-3.5">{{ c.rotulo }}</th>
              <th class="p-3.5">Situação</th>
              <th class="p-3.5 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-if="store.loading">
              <td :colspan="colunas.length + 2" class="p-8 text-center text-slate-400">Carregando…</td>
            </tr>
            <tr v-else-if="!filtrados.length">
              <td :colspan="colunas.length + 2" class="p-8 text-center text-slate-400">Nenhum cadastro encontrado.</td>
            </tr>
            <tr
              v-for="item in filtrados"
              v-else
              :key="item.id"
              class="transition-colors hover:bg-slate-50/60 dark:hover:bg-neutral-800/50"
              :class="{ 'opacity-60': !item.ativo }"
            >
              <td v-for="c in colunas" :key="c.key" class="p-3.5" :class="{ 'font-bold text-slate-900 dark:text-slate-100': c.key === 'nome' }">
                <template v-if="c.tipo === 'marcacao'">{{ item[c.key] ? 'Sim' : 'Não' }}</template>
                <template v-else>{{ item[c.key] || '-' }}</template>
              </td>
              <td class="p-3.5">
                <span
                  class="rounded-full border px-2.5 py-0.5 text-[10px] font-bold"
                  :class="
                    item.ativo
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-neutral-800 dark:text-slate-400'
                  "
                >
                  {{ item.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>
              <td class="space-x-1 p-3.5 text-right whitespace-nowrap">
                <button
                  class="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700"
                  @click="alternarAtivo(item)"
                >
                  {{ item.ativo ? 'Inativar' : 'Ativar' }}
                </button>
                <button
                  class="cursor-pointer rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                  title="Editar"
                  @click="abrir(item)"
                >
                  <Pencil class="h-3.5 w-3.5" />
                </button>
                <button
                  class="cursor-pointer rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
                  title="Excluir"
                  @click="excluir(item)"
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
      :title="editandoId ? `Editar ${config.singular}` : config.novo"
      @close="modalAberto = false"
    >
      <form class="space-y-4" @submit.prevent="salvar">
        <template v-for="c in config.campos" :key="c.key">
          <label v-if="c.tipo === 'marcacao'" class="flex cursor-pointer items-center gap-2 text-xs font-semibold select-none">
            <input v-model="form[c.key]" type="checkbox" class="h-4 w-4 cursor-pointer accent-black dark:accent-sand" />
            {{ c.rotulo }}
          </label>
          <div v-else>
            <label class="label" :for="`cad-${c.key}`">{{ c.rotulo }}</label>
            <textarea v-if="c.tipo === 'textarea'" :id="`cad-${c.key}`" v-model="form[c.key] as string" rows="2" class="input" />
            <input
              v-else
              :id="`cad-${c.key}`"
              v-model="form[c.key] as string"
              :type="c.tipo === 'email' ? 'email' : 'text'"
              :required="c.obrigatorio"
              :maxlength="c.max"
              :placeholder="c.placeholder"
              class="input"
            />
          </div>
        </template>
        <label class="flex cursor-pointer items-center gap-2 text-xs font-semibold select-none">
          <input v-model="form.ativo" type="checkbox" class="h-4 w-4 cursor-pointer accent-black dark:accent-sand" />
          Ativo (disponível para novos lançamentos)
        </label>

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
