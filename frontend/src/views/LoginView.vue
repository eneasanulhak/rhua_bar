<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogIn } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
  } catch (e) {
    error.value = (e as Error).message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-sand p-4">
    <form class="w-full max-w-sm space-y-4 rounded-3xl bg-white/40 p-8 text-black shadow-xl" @submit.prevent="submit">
      <div>
        <h1 class="text-2xl font-black tracking-widest">ADM RHUA</h1>
        <p class="text-xs text-black/60">Gestão financeira do RHUA Bar</p>
      </div>

      <div>
        <label class="label !text-black/60" for="email">E-mail</label>
        <input id="email" v-model="email" type="email" required autocomplete="username" class="input !bg-white/70 !text-black" />
      </div>
      <div>
        <label class="label !text-black/60" for="password">Senha</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="input !bg-white/70 !text-black"
        />
      </div>

      <p v-if="error" class="rounded-xl bg-rose-100 p-2 text-xs text-rose-700">{{ error }}</p>

      <button type="submit" class="btn-primary w-full !bg-black !text-sand" :disabled="loading">
        <LogIn class="h-4 w-4" />
        {{ loading ? 'Entrando…' : 'Entrar' }}
      </button>
    </form>
  </div>
</template>
