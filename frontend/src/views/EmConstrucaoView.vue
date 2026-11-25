<script setup lang="ts">
import { Hammer } from 'lucide-vue-next'
</script>

<template>
  <div class="card flex flex-col items-center gap-2 p-12 text-center">
    <Hammer class="h-6 w-6 text-sand-dark dark:text-sand" />
    <h2 class="text-lg font-bold">{{ $route.meta.title }}</h2>
    <p class="text-xs text-slate-500 dark:text-slate-400">Tela em migração do sistema antigo.</p>
  </div>
</template>
