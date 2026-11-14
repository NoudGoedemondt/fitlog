import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick } from 'vue'
import { loadMealsFrontend, mountDialog } from './helpers/meals.js'

const { deleteDialog } = await loadMealsFrontend()
const initialProps = {
  modelValue: true,
  title: 'Delete measurement?',
  cancelText: 'Keep measurement',
  entry: { id: 42 },
}

test('delete dialog confirms the selected entry and allows cancellation', (t) => {
  const mounted = mountDialog(deleteDialog, initialProps)
  t.after(mounted.unmount)

  mounted.state.confirm()
  assert.deepEqual(mounted.events, [42])
  mounted.state.updateOpen(false)
  assert.equal(mounted.props.modelValue, false)
})

test('delete dialog blocks confirmation and closing while busy and allows retrying', async (t) => {
  const mounted = mountDialog(deleteDialog, { ...initialProps, busy: true })
  t.after(mounted.unmount)

  mounted.state.confirm()
  mounted.state.updateOpen(false)
  assert.deepEqual(mounted.events, [])
  assert.equal(mounted.props.modelValue, true)

  mounted.props.busy = false
  mounted.props.error = 'Deletion failed'
  await nextTick()
  assert.equal(mounted.props.modelValue, true)
  mounted.state.confirm()
  assert.deepEqual(mounted.events, [42])
})

test('delete dialog cannot confirm without an entry', (t) => {
  const mounted = mountDialog(deleteDialog, { ...initialProps, entry: null })
  t.after(mounted.unmount)

  mounted.state.confirm()
  assert.deepEqual(mounted.events, [])
  mounted.state.updateOpen(false)
  assert.equal(mounted.props.modelValue, false)
})
