import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter, createMemoryHistory } from 'vue-router'
import { getAuthRedirect, getAuthRouteRedirect } from '../src/router/authRedirect.js'

const createTestRouter = (user = null) => {
  const auth = { user }
  const component = { render: () => null }
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/login', name: 'login', component, meta: { guestOnly: true } },
      { path: '/register', name: 'register', component, meta: { guestOnly: true } },
      { path: '/verify-email', name: 'verify-email', component, meta: { guestOnly: true } },
      { path: '/auth/confirm', name: 'auth-confirm', component, meta: { authCallback: true } },
      { path: '/forgot-password', name: 'forgot-password', component, meta: { authPage: true } },
      { path: '/reset-password', name: 'reset-password', component, meta: { authCallback: true } },
      { path: '/weight-logs', name: 'weight-logs', component, meta: { requiresAuth: true } },
    ],
  })
  router.beforeEach((to) => getAuthRouteRedirect(router, to, auth.user))
  return { router, auth }
}

test('returns to the originally requested page with query and hash after login', async () => {
  const { router, auth } = createTestRouter()
  await router.push('/weight-logs?period=month#history')
  assert.equal(router.currentRoute.value.name, 'login')
  assert.equal(router.currentRoute.value.query.redirect, '/weight-logs?period=month#history')

  const destination = getAuthRedirect(router, router.currentRoute.value.query.redirect)
  auth.user = { id: 'test-user' }
  await router.replace(destination)
  assert.equal(router.currentRoute.value.fullPath, '/weight-logs?period=month#history')
})

test('preserves the return destination when switching between login and registration', async () => {
  const { router } = createTestRouter()
  await router.push('/weight-logs?period=month#history')
  await router.push({
    name: 'register',
    query: { redirect: router.currentRoute.value.query.redirect },
  })
  assert.equal(router.currentRoute.value.name, 'register')
  await router.push({
    name: 'login',
    query: { redirect: router.currentRoute.value.query.redirect },
  })
  assert.equal(router.currentRoute.value.query.redirect, '/weight-logs?period=month#history')
})

test('signed-in users cannot stay on login or registration', async () => {
  const { router } = createTestRouter({ id: 'test-user' })
  for (const name of ['login', 'register', 'verify-email']) {
    await router.push({ name })
    assert.equal(router.currentRoute.value.name, 'home')
    await router.push({ name, query: { redirect: '/weight-logs?period=month#history' } })
    assert.equal(router.currentRoute.value.fullPath, '/weight-logs?period=month#history')
  }
})

test('session loss redirects to login and remembers the current protected page', async () => {
  const { router, auth } = createTestRouter({ id: 'test-user' })
  await router.push('/weight-logs?period=month#history')
  auth.user = null
  const redirect = getAuthRouteRedirect(router, router.currentRoute.value, auth.user)
  await router.replace(redirect)
  assert.equal(router.currentRoute.value.name, 'login')
  assert.equal(router.currentRoute.value.query.redirect, '/weight-logs?period=month#history')
})

test('rejects external, malformed, repeated and guest-only return destinations', () => {
  const { router } = createTestRouter()
  const invalid = [
    undefined,
    null,
    '',
    ['/', '/weight-logs'],
    'https://example.invalid',
    '//example.invalid',
    '/\\example.invalid',
    'javascript:alert(1)',
    '/weight-logs\n',
    '/login',
    '/register?redirect=/login',
    '/verify-email',
    '/auth/confirm',
    '/forgot-password',
    '/reset-password',
    '/auth/confirm?redirect=/login#provider-parameters',
  ]
  for (const value of invalid) {
    assert.deepEqual(getAuthRedirect(router, value), { name: 'home' })
  }
})

test('rejects unknown routes and catches route resolution errors', () => {
  const { router } = createTestRouter()
  assert.deepEqual(getAuthRedirect(router, '/missing'), { name: 'home' })
  assert.deepEqual(
    getAuthRedirect(
      {
        resolve: () => {
          throw new Error('Invalid route')
        },
      },
      '/weight-logs',
    ),
    { name: 'home' },
  )
})

test('public routes remain accessible to both guests and signed-in users', async () => {
  for (const user of [null, { id: 'test-user' }]) {
    const { router } = createTestRouter(user)
    await router.push('/')
    assert.equal(router.currentRoute.value.name, 'home')
    assert.equal(getAuthRouteRedirect(router, router.currentRoute.value, user), undefined)
  }
})

test('the confirmation callback remains accessible even with an existing session', async () => {
  const { router } = createTestRouter({ id: 'test-user' })
  await router.push('/auth/confirm?redirect=/weight-logs#error=access_denied')
  assert.equal(router.currentRoute.value.name, 'auth-confirm')
})

test('password recovery pages remain accessible during an existing session', async () => {
  const { router } = createTestRouter({ id: 'test-user' })
  for (const path of ['/forgot-password', '/reset-password']) {
    await router.push(path)
    assert.equal(router.currentRoute.value.path, path)
  }
})
