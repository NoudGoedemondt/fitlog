import assert from 'node:assert/strict'
import test from 'node:test'
import process from 'node:process'
import {
  dailyNutritionSummary,
  mealsForDate,
  parseNutrition,
  validNutrition,
  nutritionValues,
  toCalendarDate,
  fromCalendarDate,
} from '../src/utils/nutrition.js'
import { combineToMeasuredAt, splitMeasuredAt } from '../src/utils/measuredAtFormatting.js'

const date = '2026-11-10'
const values = { calories_kcal: 100.1, protein_g: 0, carbs_g: 20.2, fats_g: 2.3 }
const meal = { id: 1, consumed_at: `${date}T12:30:00`, ...values }

test('manual totals replace meals, including explicit zero totals', () => {
  for (const calories of [0, 500]) {
    const manual = { ...values, calories_kcal: calories, log_date: date }
    assert.deepEqual(dailyNutritionSummary(date, [meal], [manual]), {
      source: 'manual',
      values: { ...values, calories_kcal: calories },
    })
  }
})

test('calculated totals include only selected day and avoid floating point drift', () => {
  const meals = [meal, { ...meal, id: 2 }, { ...meal, consumed_at: '2026-11-09T23:59:00' }]
  assert.deepEqual(dailyNutritionSummary(date, meals, []), {
    source: 'calculated',
    values: { calories_kcal: 200.2, protein_g: 0, carbs_g: 40.4, fats_g: 4.6 },
  })
})

test('missing records are empty; a recorded all-zero meal is calculated', () => {
  assert.equal(dailyNutritionSummary(date, [], []), null)
  assert.equal(
    dailyNutritionSummary(date, [meal], [{ ...values, log_date: '2026-11-09' }]).source,
    'calculated',
  )
  const zero = { ...meal, calories_kcal: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
  assert.deepEqual(dailyNutritionSummary(date, [zero], []).values, nutritionValues(zero))
})

test('removing a manual total restores meal totals or an empty state', () => {
  const totals = [{ ...values, calories_kcal: 999, log_date: date }]
  assert.equal(dailyNutritionSummary(date, [meal], totals).source, 'manual')
  totals.splice(0, 1)
  assert.deepEqual(dailyNutritionSummary(date, [meal], totals), { source: 'calculated', values })
  assert.equal(dailyNutritionSummary(date, [], totals), null)
})

test('meals are filtered by local calendar date and ordered newest first without mutation', () => {
  const later = { ...meal, id: 2, consumed_at: `${date}T23:59:00` }
  const otherDay = { ...meal, id: 3, consumed_at: '2026-11-11T00:00:00' }
  const entries = [meal, later, otherDay]
  assert.deepEqual(mealsForDate(entries, date), [later, meal])
  assert.deepEqual(entries, [meal, later, otherDay])
})

test('nutrition accepts comma or dot, explicit zero, and numeric(6,1) boundaries', () => {
  for (const [input, expected] of [
    ['12,3', 12.3],
    ['12.3', 12.3],
    [' 0 ', 0],
    [0, 0],
    ['99999.9', 99999.9],
  ]) {
    assert.equal(parseNutrition(input), expected)
    assert.equal(validNutrition(input), true)
  }
})

test('nutrition rejects missing, negative, malformed, excessive precision and overflow', () => {
  for (const input of [
    '',
    ' ',
    null,
    undefined,
    false,
    {},
    [],
    '-1',
    '1.23',
    '100000',
    '99999.99',
    '1e2',
    'NaN',
    Infinity,
    '12g',
    '1,2.3',
    '.5',
  ]) {
    assert.equal(Number.isNaN(parseNutrition(input)), true, String(input))
    assert.notEqual(validNutrition(input), true)
  }
})

test('calendar dates validate leap days without normalization', () => {
  assert.equal(toCalendarDate(fromCalendarDate('2028-02-29')), '2028-02-29')
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-11-10Z', '']) {
    assert.equal(fromCalendarDate(value), null)
  }
})

test('local dates and entered hours and minutes roundtrip across timezones and DST', (t) => {
  const originalTimezone = process.env.TZ
  t.after(() => {
    if (originalTimezone === undefined) delete process.env.TZ
    else process.env.TZ = originalTimezone
  })
  for (const timezone of ['UTC', 'Europe/Amsterdam', 'America/Los_Angeles', 'Pacific/Auckland']) {
    process.env.TZ = timezone
    for (const date of ['2026-03-29', '2026-10-25', '2026-11-10']) {
      assert.equal(toCalendarDate(fromCalendarDate(date)), date)
      for (const [hour, minute] of [
        [0, 0],
        [2, 30],
        [23, 59],
      ]) {
        const timestamp = combineToMeasuredAt(fromCalendarDate(date), hour, minute)
        const split = splitMeasuredAt(timestamp)
        assert.equal(toCalendarDate(split.date), date)
        assert.equal(split.hour, hour)
        assert.equal(split.minute, minute)
        assert.equal(timestamp.endsWith('Z'), false)
      }
    }
  }
})
