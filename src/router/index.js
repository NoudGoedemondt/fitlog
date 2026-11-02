import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { watch } from 'vue'
import { getAuthRouteRedirect } from './authRedirect.js'

/**
 * Waits for authStore's initial session check to finish.
 * `isLoading` starts true until App.vue's onMounted calls
 * authStore.init() — without this, the guard below could see
 * `user === null` before we actually know if they're logged in.
 * Resolves immediately if the check already finished.
 */
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
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('../views/VerifyEmailView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/auth/confirm',
      name: 'auth-confirm',
      component: () => import('../views/AuthConfirmView.vue'),
      meta: { authCallback: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('../views/ForgotPasswordView.vue'),
      // Recovery must remain available even if an older session is still active.
      meta: { authPage: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('../views/ResetPasswordView.vue'),
      meta: { authCallback: true },
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

  return getAuthRouteRedirect(router, to, authStore.user)
})

export default router
