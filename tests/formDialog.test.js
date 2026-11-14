import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick } from 'vue'
import { loadMealsFrontend, mountDialog } from './helpers/meals.js'

const { formDialog, weightDialog } = await loadMealsFrontend()
const initialProps = {
  modelValue: true,
  title: 'Add measurement',
  icon: 'mdi-scale-bathroom',
  saveText: 'Save measurement',
}

test('form dialog requests a save and allows cancellation', async (t) => {
  const mounted = mountDialog(formDialog, initialProps)
  t.after(mounted.unmount)

  mounted.state.save()
  assert.equal(mounted.events.length, 1)
  assert.equal(mounted.props.modelValue, true)
  mounted.state.updateOpen(false)
  assert.equal(mounted.props.modelValue, false)
  await nextTick()
  mounted.state.save()
  assert.equal(mounted.events.length, 1)
})

test('form dialog blocks saving and closing while busy and allows retrying after an error', async (t) => {
  const mounted = mountDialog(formDialog, { ...initialProps, busy: true })
  t.after(mounted.unmount)

  mounted.state.save()
  mounted.state.updateOpen(false)
  assert.deepEqual(mounted.events, [])
  assert.equal(mounted.props.modelValue, true)

  mounted.props.busy = false
  mounted.props.error = 'Saving failed'
  await nextTick()
  assert.equal(mounted.props.modelValue, true)
  mounted.state.save()
  assert.equal(mounted.events.length, 1)
  mounted.state.updateOpen(false)
  assert.equal(mounted.props.modelValue, false)
})

test('weight dialog preserves edit values, blocks duplicate validation, and resets new measurements', async (t) => {
  const entry = { weight_kg: 80, measured_at: '2026-11-10T12:30:00' }
  const mounted = mountDialog(weightDialog, { entry })
  t.after(mounted.unmount)
  mounted.props.modelValue = true
  await nextTick()
  await nextTick()
  const state = mounted.state
  assert.equal(state.formModel.weight_kg, 80)
  assert.equal(state.formModel.hour, 12)
  assert.equal(state.formModel.minute, 30)
  state.formModel.weight_kg = '79,5'

  let finish
  state.weightEntryForm = {
    resetValidation: () => {},
    validate: () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  }
  const pending = state.submit()
  assert.equal(state.isBusy, true)
  await state.submit()
  assert.deepEqual(mounted.events, [])
  finish({ valid: false })
  await pending
  assert.equal(state.isBusy, false)

  mounted.props.error = 'Saving failed'
  await nextTick()
  assert.equal(state.formModel.weight_kg, '79,5')
  assert.equal(entry.weight_kg, 80)
  state.weightEntryForm.validate = async () => ({ valid: true })
  await state.submit()
  assert.deepEqual(mounted.events, [{ weight_kg: 79.5, measured_at: entry.measured_at }])

  mounted.props.modelValue = false
  await nextTick()
  mounted.props.entry = null
  mounted.props.modelValue = true
  await nextTick()
  assert.equal(state.formModel.weight_kg, null)
})
