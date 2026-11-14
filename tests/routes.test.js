import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { authStore } from './helpers/weightLogs.js'

const srcUrl = new URL('../src/', import.meta.url)
const authMockUrl = new URL('./helpers/weightLogs.js', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), srcUrl).href
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url === new URL('stores/auth.js', srcUrl).href) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `import { authStore } from '${authMockUrl}'; export const useAuthStore = () => authStore`,
      }
    }
    if (url.endsWith('.vue')) {
      return { format: 'module', shortCircuit: true, source: 'export default {}' }
    }
    if (url === new URL('router/index.js', srcUrl).href) {
      // Exercise the actual routes and guards with browser history replaced for Node.
      const source = readFileSync(new URL(url), 'utf8')
        .replaceAll('createWebHistory', 'createMemoryHistory')
        .replace('import.meta.env.BASE_URL', "'/'")
      return { format: 'module', shortCircuit: true, source }
    }
    return nextLoad(url, context)
  },
})

try {
  const { default: router } = await import('../src/router/index.js')

  for (const [name, legacy] of [
    ['weight', '/weight-logs'],
    ['nutrition', '/meals'],
  ]) {
    test(`${name} route and legacy URL preserve query, hash and login destination`, async () => {
      try {
        authStore.user = { id: 'test-user' }
        await router.push({ name })
        assert.equal(router.currentRoute.value.path, `/${name}`)
        assert.equal(router.currentRoute.value.meta.requiresAuth, true)
        await router.push(`${legacy}?period=month#history`)
        assert.equal(router.currentRoute.value.name, name)
        assert.equal(router.currentRoute.value.fullPath, `/${name}?period=month#history`)

        authStore.user = null
        await router.push(`${legacy}?period=week#history`)
        assert.equal(router.currentRoute.value.name, 'login')
        assert.equal(router.currentRoute.value.query.redirect, `/${name}?period=week#history`)
        authStore.user = { id: 'test-user' }
        await router.push(router.currentRoute.value.query.redirect)
        assert.equal(router.currentRoute.value.fullPath, `/${name}?period=week#history`)
      } finally {
        authStore.user = { id: 'test-user' }
      }
    })
  }
} finally {
  // Route components are imported lazily, so keep the loader active through the tests.
  test.after(() => hooks.deregister())
}
