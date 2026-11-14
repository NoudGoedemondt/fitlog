import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { compileScript, parse } from '@vue/compiler-sfc'
import { createRenderer, h, reactive } from 'vue'

const srcUrl = new URL('../../src/', import.meta.url)
const mockUrl = new URL('./weightLogs.js', import.meta.url).href

export async function loadMealsFrontend() {
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
          source: `export { supabase } from '${mockUrl}'`,
        }
      }
      if (url === new URL('stores/auth.js', srcUrl).href) {
        return {
          format: 'module',
          shortCircuit: true,
          source: `import { authStore } from '${mockUrl}'; export const useAuthStore = () => authStore`,
        }
      }
      if (url.endsWith('.vue')) {
        const { descriptor } = parse(readFileSync(new URL(url), 'utf8'))
        return {
          format: 'module',
          shortCircuit: true,
          source: compileScript(descriptor, { id: 'meals-test' }).content,
        }
      }
      return nextLoad(url, context)
    },
  })
  try {
    const { default: view } = await import('../../src/views/NutritionView.vue')
    const { default: mealDialog } = await import('../../src/components/MealFormDialog.vue')
    const { default: dailyDialog } = await import('../../src/components/DailyNutritionFormDialog.vue')
    const { default: deleteDialog } = await import('../../src/components/DeleteEntryDialog.vue')
    const { default: formDialog } = await import('../../src/components/FormDialog.vue')
    const { default: weightDialog } = await import('../../src/components/WeightMeasurementFormDialog.vue')
    return { view, mealDialog, dailyDialog, deleteDialog, formDialog, weightDialog }
  } finally {
    hooks.deregister()
  }
}

// Exercise real setup functions and Vue reactivity, following the Weight Logs tests.
export function mountDialog(component, initialProps) {
  const props = reactive({ modelValue: false, busy: false, ...initialProps })
  const events = []
  let instance
  const renderer = createRenderer({
    createComment: () => ({}),
    insert: () => {},
    remove: () => {},
    parentNode: () => null,
    nextSibling: () => null,
  })
  const testComponent = { ...component, render: () => null }
  const app = renderer.createApp({
    render: () =>
      h(testComponent, {
        ...props,
        ref: (value) => {
          instance = value
        },
        'onUpdate:modelValue': (value) => {
          props.modelValue = value
        },
        onSave: (value) => events.push(value),
        onConfirm: (value) => events.push(value),
      }),
  })
  app.mount({})
  return {
    props,
    events,
    get state() {
      return instance.$.setupState
    },
    unmount: () => app.unmount(),
  }
}
