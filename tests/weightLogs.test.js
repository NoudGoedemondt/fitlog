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
    if (operation.name === 'delete') state.confirmDeleteWeight(older)
    else if (operation.name === 'update') state.openWeight(older)
    else state.openWeight()
    const isOpen = () =>
      operation.name === 'delete' ? state.deleteWeightIsOpen : state.weightDialogIsOpen
    const submit = () => (operation.name === 'delete' ? state.removeWeight(1) : state.saveWeight(values))

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
      state.confirmDeleteWeight(older)
      await state.removeWeight(1)
      assert.equal(state.deleteWeightIsOpen, true)
    } else {
      if (operation.name === 'update') state.openWeight(older)
      else state.openWeight()
      await state.saveWeight(values)
      assert.equal(state.weightDialogIsOpen, true)
    }
    assert.equal(state.weightLogs.mutationError.value, null)
  })
}

test('saving without authentication keeps the dialog open without a request', async (t) => {
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
  state.openWeight()
  authStore.user = null
  await state.saveWeight(values)
  assert.equal(state.formError, 'Please log in again before saving a weight entry.')
  assert.equal(state.weightDialogIsOpen, true)
  assert.equal(state.isBusy, false)

  authStore.user = { id: 'test-user' }
  state.weightDialogIsOpen = false
  await state.saveWeight(values)
  assert.equal(state.weightDialogIsOpen, false)
  assert.equal(state.isBusy, false)
  assert.deepEqual(calls, [])
})

test('pending mutations block dialog changes and duplicate submissions', async (t) => {
  mockRequest(async () => ({ data: [older], error: null }))
  const { state, unmount } = mountView(view)
  t.after(unmount)
  await Promise.resolve()
  state.confirmDeleteWeight(older)
  let finish
  const calls = mockRequest(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = state.removeWeight(1)
  const pendingCallCount = calls.length
  assert.equal(state.isBusy, true)
  state.deleteWeightIsOpen = false
  state.confirmDeleteWeight(older)
  state.openWeight()
  state.openWeight(older)
  await state.saveWeight(values)
  await state.removeWeight(1)
  assert.equal(state.deleteWeightIsOpen, true)
  assert.equal(state.weightDialogIsOpen, false)
  assert.equal(calls.length, pendingCallCount)
  finish({ error: { message: 'Mutation failed' } })
  await pending
  assert.equal(state.isBusy, false)
  assert.equal(state.deleteWeightIsOpen, true)
})

test('opening a new measurement after editing clears the selection and previous errors', async (t) => {
  mockRequest(async () => ({ data: [newer, older], error: null }))
  const { state, unmount } = mountView(view)
  t.after(unmount)
  await Promise.resolve()

  state.openWeight(older)
  assert.deepEqual(state.editingWeight, older)
  state.weightDialogIsOpen = false
  state.formError = 'Earlier form error'
  state.weightLogs.mutationError.value = 'Earlier mutation error'
  state.openWeight()
  assert.equal(state.weightDialogIsOpen, true)
  assert.equal(state.editingWeight, null)
  assert.equal(state.formError, null)
  assert.equal(state.weightLogs.mutationError.value, null)

  const calls = mockRequest(async () => ({ data: { id: 3, ...values }, error: null }))
  await state.saveWeight(values)
  assert.deepEqual(calls, operations[0].calls)
  assert.equal(state.weightDialogIsOpen, false)
  assert.deepEqual(state.weightLogs.weightEntries.value, [{ id: 3, ...values }, newer, older])
})

test('closed dialogs and mismatched delete confirmations send no mutation request', async (t) => {
  mockRequest(async () => ({ data: [newer, older], error: null }))
  const { state, unmount } = mountView(view)
  t.after(unmount)
  await Promise.resolve()
  const calls = mockRequest(() => {
    throw new Error('No mutation expected')
  })

  await state.saveWeight(values)
  await state.removeWeight(older.id)
  state.confirmDeleteWeight(older)
  await state.removeWeight(newer.id)
  assert.equal(state.deleteWeightIsOpen, true)
  assert.deepEqual(state.deletingWeight, older)
  state.deleteWeightIsOpen = false
  assert.equal(state.deletingWeight, null)
  await state.removeWeight(older.id)
  assert.deepEqual(calls, [])
})
