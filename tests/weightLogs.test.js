import assert from 'node:assert/strict'
import test from 'node:test'
import { authStore, loadWeightLogs, mockRequest, mountView } from './helpers/weightLogs.js'

const { useWeightLogs, view } = await loadWeightLogs()
const older = { id: 1, weight_kg: 80, measured_at: '2026-10-01T10:00:00Z' }
const newer = { id: 2, weight_kg: 79, measured_at: '2026-10-02T10:00:00Z' }
const values = { weight_kg: 78, measured_at: '2026-10-03T10:00:00Z' }
const operations = [
  {
    name: 'create',
    run: (logs) => logs.createWeightEntry({ user_id: 'test-user', ...values }),
    data: { id: 3, ...values },
    expected: [{ id: 3, ...values }, newer, older],
    calls: [
      ['from', 'weight_logs'],
      ['insert', { user_id: 'test-user', ...values }],
      ['select'],
      ['single'],
    ],
    fallback: 'Unable to add the weight entry. Please try again.',
  },
  {
    name: 'update',
    run: (logs) => logs.updateWeightEntry(1, values),
    data: { id: 1, ...values },
    expected: [{ id: 1, ...values }, newer],
    calls: [['from', 'weight_logs'], ['update', values], ['eq', 'id', 1], ['select'], ['single']],
    fallback: 'Unable to update the weight entry. Please try again.',
  },
  {
    name: 'delete',
    run: (logs) => logs.deleteWeightEntry(1),
    data: { id: 1 },
    expected: [newer],
    calls: [['from', 'weight_logs'], ['delete'], ['eq', 'id', 1], ['select', 'id'], ['single']],
    fallback: 'Unable to delete the weight entry. Please try again.',
  },
]

for (const operation of operations) {
  test(`${operation.name} returns true, updates local entries and clears the previous mutation error`, async () => {
    const logs = useWeightLogs()
    logs.weightEntries.value = [newer, older]
    logs.fetchError.value = 'Earlier fetch error'
    logs.mutationError.value = 'Earlier mutation error'
    const calls = mockRequest(async () => {
      assert.equal(logs.isMutationLoading.value, true)
      assert.equal(logs.mutationError.value, null)
      return { data: operation.data, error: null }
    })

    assert.equal(await operation.run(logs), true)
    assert.deepEqual(calls, operation.calls)
    assert.deepEqual(logs.weightEntries.value, operation.expected)
    assert.equal(logs.isMutationLoading.value, false)
    assert.equal(logs.mutationError.value, null)
    assert.equal(logs.fetchError.value, 'Earlier fetch error')
  })

  for (const failure of ['database', 'network', 'fallback']) {
    test(`${operation.name} handles ${failure} errors and allows retrying`, async () => {
      const logs = useWeightLogs()
      logs.weightEntries.value = [newer, older]
      logs.fetchError.value = 'Earlier fetch error'
      mockRequest(async () => {
        if (failure === 'network') throw new Error('Network unavailable')
        return {
          data: null,
          error: failure === 'fallback' ? {} : { message: 'Database rejected mutation' },
        }
      })

      assert.equal(await operation.run(logs), false)
      assert.equal(
        logs.mutationError.value,
        failure === 'network'
          ? 'Network unavailable'
          : failure === 'fallback'
            ? operation.fallback
            : 'Database rejected mutation',
      )
      assert.equal(logs.isMutationLoading.value, false)
      assert.deepEqual(logs.weightEntries.value, [newer, older])
      assert.equal(logs.fetchError.value, 'Earlier fetch error')

      mockRequest(async () => ({ data: operation.data, error: null }))
      assert.equal(await operation.run(logs), true)
      assert.equal(logs.mutationError.value, null)
      assert.equal(logs.isMutationLoading.value, false)
    })
  }
}

test('overlapping mutations return false without changing the pending request state', async () => {
  const logs = useWeightLogs()
  let finish
  const calls = mockRequest(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = logs.createWeightEntry({ user_id: 'test-user', ...values })
  const pendingCallCount = calls.length
  for (const operation of operations) {
    assert.equal(await operation.run(logs), false)
    assert.equal(logs.isMutationLoading.value, true)
    assert.equal(logs.mutationError.value, null)
    assert.equal(calls.length, pendingCallCount)
  }
  finish({ data: { id: 3, ...values }, error: null })
  assert.equal(await pending, true)
  assert.equal(logs.isMutationLoading.value, false)
})

test('fetch failures and retries keep mutation errors separate', async () => {
  const logs = useWeightLogs()
  logs.weightEntries.value = [older]
  logs.mutationError.value = 'Earlier mutation error'
  mockRequest(async () => ({ error: { message: 'Unable to fetch' } }))
  await logs.fetchAllWeights()
  assert.equal(logs.fetchError.value, 'Unable to fetch')
  assert.equal(logs.isFetchLoading.value, false)
  assert.deepEqual(logs.weightEntries.value, [older])
  mockRequest(async () => ({ data: [newer, older], error: null }))
  await logs.fetchAllWeights()
  assert.equal(logs.fetchError.value, null)
  assert.equal(logs.mutationError.value, 'Earlier mutation error')
  assert.deepEqual(logs.weightEntries.value, [newer, older])
})

for (const operation of operations) {
  test(`${operation.name} keeps its dialog open on failure and closes it after a successful retry`, async (t) => {
    mockRequest(async () => ({ data: [newer, older], error: null }))
    const { state, unmount } = mountView(view)
    t.after(unmount)
    await Promise.resolve()
    if (operation.name === 'delete') state.toggleRemove(1)
    else if (operation.name === 'update') state.edit(1)
    else state.add()
    const isOpen = () =>
      operation.name === 'delete' ? state.deleteDialogIsOpen : state.dialogIsOpen
    const submit = () => (operation.name === 'delete' ? state.remove(1) : state.save(values))

    mockRequest(async () => ({ error: { message: 'Mutation failed' } }))
    await submit()
    assert.equal(isOpen(), true)
    assert.equal(state.weightLogs.mutationError.value, 'Mutation failed')
    assert.equal(state.isBusy, false)

    mockRequest(async () => ({ data: operation.data, error: null }))
    await submit()
    assert.equal(isOpen(), false)
    assert.equal(state.weightLogs.mutationError.value, null)
    assert.equal(state.isBusy, false)
  })

  test(`${operation.name} uses the explicit result even when no mutation error is set`, async (t) => {
    mockRequest(async () => ({ data: [newer, older], error: null }))
    const { state, unmount } = mountView(view)
    t.after(unmount)
    await Promise.resolve()
    state.weightLogs[`${operation.name}WeightEntry`] = async () => false
    if (operation.name === 'delete') {
      state.toggleRemove(1)
      await state.remove(1)
      assert.equal(state.deleteDialogIsOpen, true)
    } else {
      if (operation.name === 'update') state.edit(1)
      else state.add()
      await state.save(values)
      assert.equal(state.dialogIsOpen, true)
    }
    assert.equal(state.weightLogs.mutationError.value, null)
  })
}

test('saving without authentication or a valid target keeps the dialog open without a request', async (t) => {
  mockRequest(async () => ({ data: [], error: null }))
  const { state, unmount } = mountView(view)
  t.after(unmount)
  t.after(() => {
    authStore.user = { id: 'test-user' }
  })
  await Promise.resolve()
  const calls = mockRequest(() => {
    throw new Error('No mutation expected')
  })
  state.add()
  authStore.user = null
  await state.save(values)
  assert.equal(state.formError, 'Please log in again before saving a weight entry.')
  assert.equal(state.dialogIsOpen, true)
  assert.equal(state.isBusy, false)

  authStore.user = { id: 'test-user' }
  state.dialogTarget = false
  await state.save(values)
  assert.equal(state.formError, 'Reopen the weight entry before saving.')
  assert.equal(state.dialogIsOpen, true)
  assert.equal(state.isBusy, false)
  assert.deepEqual(calls, [])
})

test('pending mutations block dialog changes and duplicate submissions', async (t) => {
  mockRequest(async () => ({ data: [older], error: null }))
  const { state, unmount } = mountView(view)
  t.after(unmount)
  await Promise.resolve()
  state.toggleRemove(1)
  let finish
  const calls = mockRequest(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = state.remove(1)
  const pendingCallCount = calls.length
  assert.equal(state.isBusy, true)
  state.deleteDialogIsOpen = false
  state.toggleRemove(1)
  state.add()
  state.edit(1)
  await state.save(values)
  await state.remove(1)
  assert.equal(state.deleteDialogIsOpen, true)
  assert.equal(state.dialogIsOpen, false)
  assert.equal(calls.length, pendingCallCount)
  finish({ error: { message: 'Mutation failed' } })
  await pending
  assert.equal(state.isBusy, false)
  assert.equal(state.deleteDialogIsOpen, true)
})
