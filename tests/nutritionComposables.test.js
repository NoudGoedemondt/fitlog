import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import test from 'node:test'
import { mockRequest } from './helpers/weightLogs.js'

// Reuse the existing Supabase mock while importing the real composables.
const supabaseUrl = new URL('../src/plugins/supabase.js', import.meta.url).href
const helperUrl = new URL('./helpers/weightLogs.js', import.meta.url).href
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.endsWith('/plugins/supabase')) specifier += '.js'
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url === supabaseUrl) {
      return {
        format: 'module',
        shortCircuit: true,
        source: `export { supabase } from '${helperUrl}'`,
      }
    }
    return nextLoad(url, context)
  },
})
let useMeals, useDailyNutritionTotals
try {
  ;({ useMeals } = await import('../src/composables/useMeals.js'))
  ;({ useDailyNutritionTotals } = await import('../src/composables/useDailyNutritionTotals.js'))
} finally {
  hooks.deregister()
}

for (const config of [
  {
    use: useMeals,
    table: 'meals',
    entries: 'mealEntries',
    fetch: 'fetchAllMeals',
    entry: 'MealEntry',
    date: 'consumed_at',
    label: 'meal entry',
    plural: 'meal entries',
    fields: { name: 'Lunch', description: null, consumed_at: '2026-11-09T12:30:00' },
  },
  {
    use: useDailyNutritionTotals,
    table: 'daily_nutrition_totals',
    entries: 'dailyNutritionTotals',
    fetch: 'fetchAllDailyNutritionTotals',
    entry: 'DailyNutritionTotal',
    date: 'log_date',
    label: 'daily nutrition total',
    plural: 'daily nutrition totals',
    fields: { notes: null, log_date: '2026-11-09' },
  },
]) {
  const values = { calories_kcal: 0, protein_g: 12.3, carbs_g: 0, fats_g: 4.5, ...config.fields }
  const older = {
    id: 1,
    ...values,
    [config.date]: config.date === 'log_date' ? '2026-11-01' : '2026-11-01T10:00:00',
  }
  const newer = {
    id: 2,
    ...values,
    [config.date]: config.date === 'log_date' ? '2026-11-05' : '2026-11-05T10:00:00',
  }
  const saved = { id: 3, ...values }
  const operations = [
    {
      action: 'create',
      run: (logs) => logs[`create${config.entry}`]({ user_id: 'test-user', ...values, id: 99 }),
      data: saved,
      expected: [saved, newer, older],
      verb: 'add',
      calls: [
        ['from', config.table],
        ['insert', { user_id: 'test-user', ...values }],
        ['select'],
        ['single'],
      ],
    },
    {
      action: 'update',
      run: (logs) =>
        logs[`update${config.entry}`](1, { ...values, user_id: 'another-user', id: 99 }),
      data: { ...saved, id: 1 },
      expected: [{ ...saved, id: 1 }, newer],
      verb: 'update',
      calls: [['from', config.table], ['update', values], ['eq', 'id', 1], ['select'], ['single']],
    },
    {
      action: 'delete',
      run: (logs) => logs[`delete${config.entry}`](1),
      data: { id: 1 },
      expected: [newer],
      verb: 'delete',
      calls: [['from', config.table], ['delete'], ['eq', 'id', 1], ['select', 'id'], ['single']],
    },
  ]

  for (const operation of operations) {
    test(`${config.table}: ${operation.action} sends allowed fields and updates sorted entries`, async () => {
      const logs = config.use()
      logs[config.entries].value = [newer, older]
      logs.fetchError.value = 'Previous fetch error'
      logs.mutationError.value = 'Previous mutation error'
      const calls = mockRequest(async () => {
        assert.equal(logs.isMutationLoading.value, true)
        assert.equal(logs.mutationError.value, null)
        return { data: operation.data, error: null }
      })
      assert.equal(await operation.run(logs), true)
      assert.deepEqual(calls, operation.calls)
      assert.deepEqual(logs[config.entries].value, operation.expected)
      assert.equal(logs.isMutationLoading.value, false)
      assert.equal(logs.fetchError.value, 'Previous fetch error')
    })

    for (const failure of ['database', 'network', 'fallback']) {
      test(`${config.table}: ${operation.action} handles ${failure} errors and retries`, async () => {
        const logs = config.use()
        logs[config.entries].value = [newer, older]
        mockRequest(async () => {
          if (failure === 'network') throw new Error('Network unavailable')
          return { error: failure === 'fallback' ? {} : { message: 'Database rejected mutation' } }
        })
        assert.equal(await operation.run(logs), false)
        assert.deepEqual(logs[config.entries].value, [newer, older])
        assert.equal(
          logs.mutationError.value,
          failure === 'network'
            ? 'Network unavailable'
            : failure === 'fallback'
              ? `Unable to ${operation.verb} the ${config.label}. Please try again.`
              : 'Database rejected mutation',
        )
        assert.equal(logs.isMutationLoading.value, false)
        mockRequest(async () => ({ data: operation.data, error: null }))
        assert.equal(await operation.run(logs), true)
        assert.equal(logs.mutationError.value, null)
      })
    }
  }

  test(`${config.table}: fetch orders entries and keeps mutation errors separate`, async () => {
    const logs = config.use()
    logs.mutationError.value = 'Previous mutation error'
    const calls = mockRequest(async () => {
      assert.equal(logs.isFetchLoading.value, true)
      return { data: [newer, older], error: null }
    })
    await logs[config.fetch]()
    assert.deepEqual(calls, [
      ['from', config.table],
      ['select', '*'],
      ['order', config.date, { ascending: false }],
    ])
    assert.deepEqual(logs[config.entries].value, [newer, older])
    assert.equal(logs.isFetchLoading.value, false)
    assert.equal(logs.mutationError.value, 'Previous mutation error')
  })

  for (const failure of ['database', 'network', 'fallback']) {
    test(`${config.table}: fetch handles ${failure} errors and retries`, async () => {
      const logs = config.use()
      logs[config.entries].value = [older]
      mockRequest(async () => {
        if (failure === 'network') throw new Error('Network unavailable')
        return { error: failure === 'fallback' ? {} : { message: 'Unable to fetch' } }
      })
      await logs[config.fetch]()
      assert.equal(
        logs.fetchError.value,
        failure === 'network'
          ? 'Network unavailable'
          : failure === 'fallback'
            ? `Unable to load ${config.plural}. Please try again.`
            : 'Unable to fetch',
      )
      assert.equal(logs.isFetchLoading.value, false)
      assert.deepEqual(logs[config.entries].value, [older])
      mockRequest(async () => ({ data: [], error: null }))
      await logs[config.fetch]()
      assert.equal(logs.fetchError.value, null)
      assert.deepEqual(logs[config.entries].value, [])
    })
  }

  test(`${config.table}: overlapping mutations are blocked`, async () => {
    const logs = config.use()
    let finish
    const calls = mockRequest(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = operations[0].run(logs)
    const count = calls.length
    for (const operation of operations) assert.equal(await operation.run(logs), false)
    assert.equal(calls.length, count)
    assert.equal(logs.isMutationLoading.value, true)
    finish({ data: saved, error: null })
    assert.equal(await pending, true)
    assert.equal(logs.isMutationLoading.value, false)
  })

  test(`${config.table}: duplicate fetches are blocked and instances have independent state`, async () => {
    const logs = config.use()
    let finish
    const calls = mockRequest(
      () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    )
    const pending = logs[config.fetch]()
    const count = calls.length
    await logs[config.fetch]()
    assert.equal(calls.length, count)
    const separate = config.use()
    assert.equal(separate.isFetchLoading.value, false)
    finish({ data: [saved], error: null })
    await pending
    assert.deepEqual(separate[config.entries].value, [])
  })
}
