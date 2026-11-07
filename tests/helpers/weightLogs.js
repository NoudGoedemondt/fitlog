import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createRenderer } from 'vue'

export const authStore = { user: { id: 'test-user' } }
export const supabase = {
  from: () => {
    throw new Error('Unexpected Supabase request')
  },
}

const helperUrl = import.meta.url
const srcUrl = new URL('../../src/', helperUrl).href

// Compile the real view setup without requiring a browser or a new test framework.
export const loadWeightLogs = async () => {
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith('@/')) specifier = new URL(specifier.slice(2), srcUrl).href
      if (specifier.endsWith('/plugins/supabase')) specifier += '.js'
      return nextResolve(specifier, context)
    },
    load(url, context, nextLoad) {
      if (url === new URL('plugins/supabase.js', srcUrl).href) {
        return {
          format: 'module',
          shortCircuit: true,
          source: `export { supabase } from '${helperUrl}'`,
        }
      }
      if (url === new URL('stores/auth.js', srcUrl).href) {
        return {
          format: 'module',
          shortCircuit: true,
          source: `import { authStore } from '${helperUrl}'; export const useAuthStore = () => authStore`,
        }
      }
      if (url.endsWith('.vue')) {
        const source = url.endsWith('/WeightLogsView.vue')
          ? compileScript(parse(readFileSync(new URL(url), 'utf8')).descriptor, {
              id: 'weight-logs-test',
            }).content
          : 'export default {}'
        return { format: 'module', shortCircuit: true, source }
      }
      return nextLoad(url, context)
    },
  })
  try {
    const { useWeightLogs } = await import('../../src/composables/useWeightLogs.js')
    const { default: view } = await import('../../src/views/WeightLogsView.vue')
    return { useWeightLogs, view }
  } finally {
    hooks.deregister()
  }
}

export const mountView = (view) => {
  const renderer = createRenderer({
    createComment: () => ({}),
    insert: () => {},
    remove: () => {},
    parentNode: () => null,
    nextSibling: () => null,
  })
  const app = renderer.createApp({ ...view, render: () => null })
  const instance = app.mount({})
  return { state: instance.$.setupState, unmount: () => app.unmount() }
}

export const mockRequest = (respond) => {
  const calls = []
  const query = {}
  for (const method of ['from', 'insert', 'update', 'delete', 'eq', 'select', 'single', 'order']) {
    query[method] = (...args) => {
      calls.push([method, ...args])
      return method === 'single' || method === 'order' ? respond() : query
    }
  }
  supabase.from = query.from
  return calls
}
