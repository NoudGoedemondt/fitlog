import assert from 'node:assert/strict'
import test from 'node:test'
import { nextTick } from 'vue'
import { authStore, mockRequest, mountView } from './helpers/weightLogs.js'
import { loadMealsFrontend, mountDialog } from './helpers/meals.js'
import { toCalendarDate } from '../src/utils/nutrition.js'

const { view, mealDialog, dailyDialog } = await loadMealsFrontend()
const date = '2026-11-10'
const values = { calories_kcal: 300.5, protein_g: 20, carbs_g: 40.1, fats_g: 6.2 }
const meal = {
  id: 1,
  name: 'Lunch',
  description: 'Soup',
  consumed_at: `${date}T12:30:00`,
  ...values,
}
const daily = { id: 2, log_date: date, notes: 'Daily note', ...values }

async function mountMeals(t) {
  mockRequest(async () => ({ data: [], error: null }))
  const mounted = mountView(view)
  t.after(mounted.unmount)
  await Promise.resolve()
  await nextTick()
  mounted.state.selectedDate = new Date(2026, 10, 10)
  mounted.state.meals.mealEntries.value = [meal]
  mounted.state.dailyTotals.dailyNutritionTotals.value = [daily]
  return mounted.state
}

for (const kind of ['meal', 'daily']) {
  for (const operation of ['create', 'update', 'delete']) {
    test(`${kind} ${operation}: failure keeps target open; retry updates summary and closes`, async (t) => {
      const state = await mountMeals(t)
      const isMeal = kind === 'meal'
      const record = isMeal ? meal : daily
      if (operation === 'create') {
        if (isMeal) state.openMeal()
        else {
          state.dailyTotals.dailyNutritionTotals.value = []
          state.openDaily()
        }
      } else if (operation === 'update') {
        if (isMeal) state.openMeal(meal)
        else state.openDaily()
      } else {
        if (isMeal) state.confirmDeleteMeal(meal)
        else state.confirmDeleteDaily()
      }
      const open = () =>
        operation === 'delete'
          ? isMeal
            ? state.deleteMealIsOpen
            : state.deleteDailyIsOpen
          : isMeal
            ? state.mealDialogIsOpen
            : state.dailyDialogIsOpen
      const submit = () =>
        operation === 'delete'
          ? isMeal
            ? state.removeMeal(record.id)
            : state.removeDaily(record.id)
          : isMeal
            ? state.saveMeal({ ...meal, ...values })
            : state.saveDaily({ ...daily, ...values })
      const logs = isMeal ? state.meals : state.dailyTotals
      mockRequest(async () => ({ error: { message: 'Database rejected mutation' } }))
      await submit()
      assert.equal(open(), true)
      assert.equal(logs.mutationError.value, 'Database rejected mutation')
      assert.equal(state.isBusy, false)
      mockRequest(async () => ({
        data: operation === 'create' ? { ...record, id: 3 } : record,
        error: null,
      }))
      await submit()
      assert.equal(open(), false)
      assert.equal(logs.mutationError.value, null)
      if (!isMeal && operation === 'delete') {
        assert.equal(state.summary.source, 'calculated')
        assert.deepEqual(state.summary.values, values)
        assert.deepEqual(state.dayMeals, [meal])
      }
    })
  }
}

test('a daily total takes precedence while meals remain visible after edits and deletion', async (t) => {
  const state = await mountMeals(t)
  assert.equal(state.summary.source, 'manual')
  state.openMeal(meal)
  mockRequest(async () => ({ data: { ...meal, calories_kcal: 999 }, error: null }))
  await state.saveMeal({ ...meal, calories_kcal: 999 })
  assert.equal(state.summary.values.calories_kcal, daily.calories_kcal)
  assert.equal(state.dayMeals[0].calories_kcal, 999)
  state.confirmDeleteMeal(state.dayMeals[0])
  mockRequest(async () => ({ data: { id: meal.id }, error: null }))
  await state.removeMeal(meal.id)
  assert.equal(state.summary.source, 'manual')
  assert.deepEqual(state.dayMeals, [])
  state.confirmDeleteDaily()
  mockRequest(async () => ({ data: { id: daily.id }, error: null }))
  await state.removeDaily(daily.id)
  assert.equal(state.summary, null)
})

test('incomplete loads and invalid dates suppress summary and prevent new dialogs', async (t) => {
  const state = await mountMeals(t)
  for (const logs of [state.meals, state.dailyTotals]) {
    logs.fetchError.value = 'Fetch failed'
    assert.equal(state.summary, null)
    state.openMeal()
    state.openDaily()
    assert.equal(state.mealDialogIsOpen, false)
    assert.equal(state.dailyDialogIsOpen, false)
    logs.fetchError.value = null
    logs.isFetchLoading.value = true
    assert.equal(state.summary, null)
    logs.isFetchLoading.value = false
  }
  state.dateInputText = '31-02-2026'
  assert.equal(state.calendarDate, null)
  assert.equal(state.summary, null)
  assert.deepEqual(state.dayMeals, [])
})

test('selected date filters both registration methods immediately', async (t) => {
  const state = await mountMeals(t)
  state.selectedDate = new Date(2026, 10, 11)
  assert.equal(state.summary, null)
  assert.equal(state.dailyTotal, null)
  assert.deepEqual(state.dayMeals, [])
})

test('pending requests block duplicate submissions, dialog changes, and cross-method mutations', async (t) => {
  const state = await mountMeals(t)
  state.openMeal(meal)
  let finish
  const calls = mockRequest(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const pending = state.saveMeal(meal)
  const count = calls.length
  assert.equal(state.isBusy, true)
  state.openDaily()
  state.confirmDeleteMeal(meal)
  state.confirmDeleteDaily()
  await state.saveMeal(meal)
  await state.saveDaily(daily)
  assert.equal(state.dailyDialogIsOpen, false)
  assert.equal(state.deleteMealIsOpen, false)
  assert.equal(state.deleteDailyIsOpen, false)
  assert.equal(calls.length, count)
  finish({ data: meal, error: null })
  await pending
  assert.equal(state.mealDialogIsOpen, false)
})

test('saving without authentication preserves dialogs and sends no request', async (t) => {
  const state = await mountMeals(t)
  t.after(() => {
    authStore.user = { id: 'test-user' }
  })
  state.openMeal()
  authStore.user = null
  const calls = mockRequest(() => {
    throw new Error('Unexpected mutation')
  })
  await state.saveMeal(meal)
  assert.equal(state.mealDialogIsOpen, true)
  assert.match(state.formError, /log in again/)
  state.mealDialogIsOpen = false
  state.openDaily()
  await state.saveDaily(daily)
  assert.equal(state.dailyDialogIsOpen, true)
  assert.match(state.formError, /log in again/)
  assert.deepEqual(calls, [])
})

for (const [name, component, record] of [
  ['meal', mealDialog, meal],
  ['daily', dailyDialog, daily],
]) {
  test(`${name} dialog populates edits, preserves values on errors, and resets new entries`, async (t) => {
    const mounted = mountDialog(component, { date, entry: record })
    t.after(mounted.unmount)
    mounted.props.modelValue = true
    await nextTick()
    await nextTick()
    const state = mounted.state
    assert.equal(state.values.calories_kcal, values.calories_kcal)
    if (name === 'meal') {
      assert.equal(state.values.name, meal.name)
      assert.equal(toCalendarDate(state.values.date), date)
      assert.equal(state.values.hour, 12)
      assert.equal(state.values.minute, 30)
    } else assert.equal(state.values.notes, daily.notes)
    state.values.calories_kcal = '456,7'
    mounted.props.error = 'Database unavailable'
    mounted.props.busy = true
    await nextTick()
    state.updateOpen(false)
    await state.submit()
    assert.equal(mounted.props.modelValue, true)
    assert.equal(mounted.events.length, 0)
    mounted.props.busy = false
    await nextTick()
    assert.equal(state.values.calories_kcal, '456,7')
    assert.equal(record.calories_kcal, values.calories_kcal)
    state.form = { resetValidation: () => {}, validate: async () => ({ valid: true }) }
    await state.submit()
    assert.equal(mounted.events.length, 1)
    assert.equal(mounted.events[0].calories_kcal, 456.7)
    if (name === 'meal') assert.equal(mounted.events[0].consumed_at, `${date}T12:30:00`)
    else assert.equal(mounted.events[0].log_date, date)
    mounted.props.modelValue = false
    await nextTick()
    mounted.props.entry = null
    mounted.props.modelValue = true
    await nextTick()
    assert.equal(state.values.calories_kcal, '')
  })

  test(`${name} dialog blocks invalid forms and duplicate submissions during validation`, async (t) => {
    const mounted = mountDialog(component, { date, entry: record })
    t.after(mounted.unmount)
    mounted.props.modelValue = true
    await nextTick()
    await nextTick()
    let finish
    mounted.state.form = {
      resetValidation: () => {},
      validate: () =>
        new Promise((resolve) => {
          finish = resolve
        }),
    }
    const pending = mounted.state.submit()
    assert.equal(mounted.state.isBusy, true)
    await mounted.state.submit()
    mounted.state.updateOpen(false)
    assert.equal(mounted.props.modelValue, true)
    finish({ valid: false })
    await pending
    assert.deepEqual(mounted.events, [])
    assert.equal(mounted.state.isBusy, false)
  })
}

test('meal dialog rejects invalid typed dates and preserves local times without conversion', async (t) => {
  const mounted = mountDialog(mealDialog, { date, entry: meal })
  t.after(mounted.unmount)
  mounted.props.modelValue = true
  await nextTick()
  await nextTick()
  const state = mounted.state
  state.form = { resetValidation: () => {}, validate: async () => ({ valid: true }) }
  state.dateInputText = '31-02-2026'
  await state.submit()
  assert.deepEqual(mounted.events, [])
  assert.match(state.validationError, /valid date and time/)
  state.dateInputText = '25-10-2026'
  state.values.hour = 2
  state.values.minute = 30
  await state.submit()
  assert.equal(mounted.events[0].consumed_at, '2026-10-25T02:30:00')
  state.updateDate(new Date(2026, 10, 11))
  assert.equal(state.values.hour, null)
  assert.equal(state.values.minute, null)
})
