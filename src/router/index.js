import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { watch } from 'vue'

function waitForAuthReady(authStore) {
  return new Promise((resolve) => {
    if (!authStore.isLoading) {
      resolve()
      return
    }
    const unwatch = watch(
      () => authStore.isLoading,
      (loading) => {
        if (!loading) {
          unwatch()
          resolve()
        }
      },
    )
  })
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/body-profile',
      name: 'body-profile',
      component: () => import('../views/BodyProfileView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/meals',
      name: 'meals',
      component: () => import('../views/MealsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/routines',
      name: 'routines',
      component: () => import('../views/RoutinesView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/weight-logs',
      name: 'weight-logs',
      component: () => import('../views/WeightLogsView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/workouts',
      name: 'workouts',
      component: () => import('../views/WorkoutsView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to, _from) => {
  const authStore = useAuthStore()
  await waitForAuthReady(authStore)

  if (to.meta?.requiresAuth && !authStore.user) {
    return { name: 'login' }
  }
})

export default router
