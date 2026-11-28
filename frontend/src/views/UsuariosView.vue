<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { CheckCircle2, Lock, Pencil, Plus, ShieldCheck, Trash2 } from 'lucide-vue-next'
import BaseModal from '@/components/BaseModal.vue'
import { ROLE_LABELS, useAuthStore } from '@/stores/auth'
import { useUsuariosStore } from '@/stores/resources'
import type { Permission, Role, User, UserInput } from '@/types'

const auth = useAuthStore()
const store = useUsuariosStore()

onMounted(() => Promise.all([store.fetchAll(), store.fetchPermissoes()]))

const PERFIS: { role: Role; descricao: string }[] = [
  { role: 'admin', descricao: 'Acesso total' },
  { role: 'gerente', descricao: 'Aprovações e lançamentos' },
  { role: 'operador', descricao: 'Lançamentos diários' },
  { role: 'auditor', descricao: 'Somente leitura' },
]

const BADGE: Record<Role, string> = {
  admin: 'border-sand-dark bg-sand/40 text-slate-900 dark:text-sand',
  gerente: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
  operador:
    'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
  auditor: 'border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-neutral-800 dark:text-slate-300',
}

/** Linhas da matriz, na ordem do menu. O que cada perfil pode vem do servidor. */
const PERMISSOES: { perm: Permission; nome: string }[] = [
  { perm: 'view_dashboard', nome: 'Ver Painel & DRE e relatórios' },
  { perm: 'view_faturamento', nome: 'Ver faturamento' },
  { perm: 'add_faturamento', nome: 'Lançar faturamento' },
  { perm: 'edit_faturamento', nome: 'Editar faturamento' },
  { perm: 'delete_faturamento', nome: 'Excluir faturamento' },
  { perm: 'view_despesas', nome: 'Ver despesas, boletos e extras' },
  { perm: 'add_despesas', nome: 'Lançar despesas e diárias de extras' },
  { perm: 'edit_despesas', nome: 'Editar despesas e diárias de extras' },
  { perm: 'delete_despesas', nome: 'Excluir despesas e diárias de extras' },
  { perm: 'compensar_despesas', nome: 'Compensar (pagar) despesas e boletos' },
  { perm: 'view_retiradas', nome: 'Ver retirada de sócios' },
  { perm: 'export_reports', nome: 'Exportar relatórios' },
  { perm: 'manage_cadastros', nome: 'Gerenciar cadastros' },
  { perm: 'manage_users', nome: 'Gerenciar usuários e permissões' },
]

const pode = (role: Role, perm: Permission) => !!store.permissoesPorPerfil[role]?.includes(perm)

const usuarios = computed(() =>
  [...store.items].sort((a, b) => Number(b.ativo) - Number(a.ativo) || a.name.localeCompare(b.name)),
)

const iniciais = (nome: string) =>
  nome
    .split(/\s+/)
    .filter((p) => /^[\p{L}]/u.test(p))
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

// --- Formulário -----------------------------------------------------------

const vazio = (): UserInput => ({ name: '', email: '', role: 'operador', avatar: null, ativo: true, password: '' })

const modalAberto = ref(false)
const editando = ref<User | null>(null)
const form = reactive(vazio())
const salvando = ref(false)
const erroForm = ref('')

const editandoASiMesmo = computed(() => editando.value?.id === auth.user?.id)

function abrir(item?: User) {
  editando.value = item ?? null
  Object.assign(form, vazio(), item ?? {}, { password: '' })
  erroForm.value = ''
  modalAberto.value = true
}

async function salvar() {
  salvando.value = true
  erroForm.value = ''
  try {
    // Na edição, senha em branco mantém a atual.
    const { password, ...dados } = form
    const payload: UserInput = password ? { ...dados, password } : dados
    if (editando.value) {
      const salvo = await store.update(editando.value.id, payload)
      // Mantém nome/e-mail do cabeçalho em dia quando o admin edita a si mesmo.
      if (editandoASiMesmo.value && auth.user) Object.assign(auth.user, salvo)
    } else {
      await store.create(payload)
    }
    modalAberto.value = false
  } catch (e) {
    erroForm.value = (e as Error).message
  } finally {
    salvando.value = false
  }
}

// --- Ações do card --------------------------------------------------------

async function alternarAtivo(u: User) {
  if (u.ativo && !confirm(`Desativar ${u.name}? O acesso ao sistema é bloqueado na hora.`)) return
  try {
    await store.update(u.id, { ativo: !u.ativo })
  } catch (e) {
    alert((e as Error).message)
  }
}

async function excluir(u: User) {
  const msg =
    `Excluir ${u.name} definitivamente?\n\n` +
    'Os lançamentos feitos por esse usuário continuam, mas deixam de mostrar quem registrou. ' +
    'Para só bloquear o acesso, use "Desativar".'
  if (!confirm(msg)) return
  try {
    await store.remove(u.id)
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
          <ShieldCheck class="h-5 w-5 text-sand-dark dark:text-sand" />
          Gestão de Usuários & Níveis de Permissão
        </h2>
        <p class="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Controle de acesso para múltiplos usuários com restrições por perfil
        </p>
      </div>
      <button class="btn-primary" @click="abrir()"><Plus class="h-4 w-4" /> Cadastrar Novo Usuário</button>
    </div>

    <p v-if="store.error" class="card p-4 text-xs text-rose-600">{{ store.error }}</p>
    <p v-if="store.loading" class="text-xs text-slate-400">Carregando…</p>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div
        v-for="u in usuarios"
        :key="u.id"
        class="card flex items-center justify-between gap-3 p-4"
        :class="{ 'opacity-60': !u.ativo }"
      >
        <div class="flex min-w-0 items-center gap-3">
          <img v-if="u.avatar" :src="u.avatar" :alt="u.name" class="h-10 w-10 shrink-0 rounded-xl object-cover" />
          <div
            v-else
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black text-xs font-black text-sand dark:bg-sand dark:text-black"
          >
            {{ iniciais(u.name) }}
          </div>
          <div class="min-w-0">
            <h4 class="truncate text-sm font-bold">
              {{ u.name }}
              <span v-if="u.id === auth.user?.id" class="text-[10px] font-semibold text-slate-400">(você)</span>
            </h4>
            <p class="truncate text-xs text-slate-500 dark:text-slate-400">{{ u.email }}</p>
            <div class="mt-1 flex flex-wrap gap-1">
              <span class="rounded border px-2 py-0.5 text-[10px] font-bold" :class="BADGE[u.role]">
                {{ ROLE_LABELS[u.role] }}
              </span>
              <span
                v-if="!u.ativo"
                class="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-300"
              >
                Desativado
              </span>
            </div>
          </div>
        </div>
        <div class="flex shrink-0 items-center gap-1">
          <button
            v-if="u.id !== auth.user?.id"
            class="cursor-pointer rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 hover:bg-slate-200 dark:bg-neutral-800 dark:text-slate-300 dark:hover:bg-neutral-700"
            @click="alternarAtivo(u)"
          >
            {{ u.ativo ? 'Desativar' : 'Ativar' }}
          </button>
          <button
            class="cursor-pointer rounded-lg bg-slate-100 p-1.5 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            title="Editar"
            @click="abrir(u)"
          >
            <Pencil class="h-3.5 w-3.5" />
          </button>
          <button
            v-if="u.id !== auth.user?.id"
            class="cursor-pointer rounded-lg bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400"
            title="Excluir"
            @click="excluir(u)"
          >
            <Trash2 class="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>

    <div class="card space-y-3 overflow-hidden p-5">
      <h3 class="flex items-center gap-2 text-sm font-bold">
        <Lock class="h-4 w-4 text-sand-dark dark:text-sand" />
        Matriz de Permissões de Acesso
      </h3>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs">
          <thead
            class="border-b border-slate-100 bg-slate-50 text-[10px] font-bold tracking-widest text-slate-400 uppercase dark:border-slate-800/80 dark:bg-neutral-900 dark:text-slate-500"
          >
            <tr>
              <th class="p-3">Funcionalidade</th>
              <th v-for="p in PERFIS" :key="p.role" class="p-3 text-center">{{ ROLE_LABELS[p.role] }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800/80 dark:text-slate-300">
            <tr v-for="linha in PERMISSOES" :key="linha.perm" class="hover:bg-slate-50/60 dark:hover:bg-neutral-800/50">
              <td class="p-3 font-semibold">{{ linha.nome }}</td>
              <td v-for="p in PERFIS" :key="p.role" class="p-3 text-center">
                <CheckCircle2
                  v-if="pode(p.role, linha.perm)"
                  class="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400"
                  :aria-label="`${ROLE_LABELS[p.role]}: sim`"
                />
                <span v-else class="text-slate-300 dark:text-slate-600" :aria-label="`${ROLE_LABELS[p.role]}: não`">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <BaseModal v-if="modalAberto" :title="editando ? 'Editar Usuário' : 'Novo Usuário'" @close="modalAberto = false">
      <form class="space-y-4" @submit.prevent="salvar">
        <div>
          <label class="label" for="usr-nome">Nome completo</label>
          <input id="usr-nome" v-model="form.name" type="text" required maxlength="120" class="input" />
        </div>
        <div>
          <label class="label" for="usr-email">E-mail (login)</label>
          <input id="usr-email" v-model="form.email" type="email" required maxlength="180" class="input" />
        </div>
        <div>
          <label class="label" for="usr-perfil">Perfil de acesso</label>
          <select id="usr-perfil" v-model="form.role" class="input" :disabled="editandoASiMesmo">
            <option v-for="p in PERFIS" :key="p.role" :value="p.role">
              {{ ROLE_LABELS[p.role] }} ({{ p.descricao }})
            </option>
          </select>
          <p v-if="editandoASiMesmo" class="mt-1 text-[10px] text-slate-400">Você não pode alterar o próprio perfil.</p>
        </div>
        <div>
          <label class="label" for="usr-senha">{{ editando ? 'Nova senha' : 'Senha' }}</label>
          <input
            id="usr-senha"
            v-model="form.password"
            type="password"
            :required="!editando"
            minlength="6"
            autocomplete="new-password"
            class="input"
          />
          <p class="mt-1 text-[10px] text-slate-400">
            Mínimo de 6 caracteres.{{ editando ? ' Em branco mantém a senha atual.' : '' }}
          </p>
        </div>

        <p v-if="erroForm" class="rounded-xl bg-rose-50 p-2 text-xs text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
          {{ erroForm }}
        </p>

        <div class="flex justify-end gap-2">
          <button type="button" class="btn-ghost" @click="modalAberto = false">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="salvando">
            {{ salvando ? 'Salvando…' : 'Salvar Usuário' }}
          </button>
        </div>
      </form>
    </BaseModal>
  </div>
</template>
