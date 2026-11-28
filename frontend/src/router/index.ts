import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Permission } from '@/types'
import AppLayout from '@/layouts/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    permission?: Permission
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      component: AppLayout,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
          meta: { permission: 'view_dashboard', title: 'Painel & DRE' },
        },
        {
          path: 'faturamento',
          name: 'faturamento',
          component: () => import('@/views/FaturamentoView.vue'),
          meta: { permission: 'view_faturamento', title: 'Faturamento Diário' },
        },
        {
          path: 'despesas',
          name: 'despesas',
          component: () => import('@/views/DespesasView.vue'),
          meta: { permission: 'view_despesas', title: 'Despesas & Compras' },
        },
        {
          path: 'boletos',
          name: 'boletos',
          component: () => import('@/views/EmConstrucaoView.vue'),
          meta: { permission: 'view_despesas', title: 'Boletos & Vencimentos' },
        },
        {
          path: 'extras',
          name: 'extras',
          component: () => import('@/views/EmConstrucaoView.vue'),
          meta: { permission: 'view_despesas', title: 'Pagamento de Extras' },
        },
        {
          path: 'relatorios',
          name: 'relatorios',
          component: () => import('@/views/EmConstrucaoView.vue'),
          meta: { permission: 'view_dashboard', title: 'Relatórios & Exportação' },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('@/views/EmConstrucaoView.vue'),
          meta: { permission: 'manage_users', title: 'Usuários & Permissões' },
        },
      ],
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  await auth.restore()

  if (to.meta.public) {
    return auth.isAuthenticated ? { name: 'dashboard' } : true
  }
  if (!auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.meta.permission && !auth.can(to.meta.permission)) {
    return to.name === 'dashboard' ? false : { name: 'dashboard' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · ADM RHUA` : 'ADM RHUA'
})

export default router
