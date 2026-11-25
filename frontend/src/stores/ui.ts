import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

type Theme = 'light' | 'dark'
const THEME_KEY = 'rhua_theme'

function monthOptions(count = 12) {
  const now = new Date()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return { value, label: label.charAt(0).toUpperCase() + label.slice(1) }
  })
}

export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>(localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark')
  /** Filtro global de mês: 'all' ou 'AAAA-MM'. */
  const mes = ref('all')
  const meses = [{ value: 'all', label: 'Todos os meses' }, ...monthOptions()]

  watch(
    theme,
    (value) => {
      document.documentElement.classList.toggle('dark', value === 'dark')
      localStorage.setItem(THEME_KEY, value)
    },
    { immediate: true },
  )

  function toggleTheme() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  return { theme, mes, meses, toggleTheme }
})
