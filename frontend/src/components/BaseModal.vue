<script setup lang="ts">
import { X } from 'lucide-vue-next'

defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs"
    @click.self="emit('close')"
    @keydown.esc="emit('close')"
  >
    <div class="card max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto p-6 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <h3 class="text-base font-extrabold">{{ title }}</h3>
        <button class="cursor-pointer rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-neutral-800" @click="emit('close')">
          <X class="h-4 w-4" />
        </button>
      </div>
      <slot />
    </div>
  </div>
</template>
