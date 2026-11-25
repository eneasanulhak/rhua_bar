<script setup lang="ts">
import { useUiStore } from '@/stores/ui'

// Instancia o store cedo para aplicar o tema salvo antes da primeira tela.
useUiStore()
</script>

<template>
  <RouterView />
</template>
