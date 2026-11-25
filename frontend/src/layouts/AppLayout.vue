<script setup lang="ts">
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificacoesStore } from '@/stores/resources'
import AppSidebar from '@/components/AppSidebar.vue'
import AppTopbar from '@/components/AppTopbar.vue'

const auth = useAuthStore()
const notificacoes = useNotificacoesStore()

onMounted(() => {
  if (auth.can('view_despesas')) notificacoes.fetchAll().catch(() => {})
})
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <AppTopbar />
    <div class="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6 lg:flex-row">
      <AppSidebar />
      <main class="min-w-0 flex-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
