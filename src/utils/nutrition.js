import { combineToMeasuredAt, splitMeasuredAt } from './measuredAtFormatting.js'

export const nutritionFields = [
  { key: 'calories_kcal', label: 'Calories', unit: 'kcal' },
  { key: 'protein_g', label: 'Protein', unit: 'g' },
  { key: 'carbs_g', label: 'Carbs', unit: 'g' },
  { key: 'fats_g', label: 'Fat', unit: 'g' },
]

export function parseNutrition(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return NaN
  const text = String(value).trim()
  if (!/^\d+(?:[.,]\d)?$/.test(text)) return NaN
  const number = Number(text.replace(',', '.'))
  return number <= 99999.9 ? number : NaN
}

export const validNutrition = (value) =>
  Number.isFinite(parseNutrition(value)) ||
  'Enter a value from 0 to 99999.9 with at most one decimal.'

export const emptyNutrition = () => Object.fromEntries(nutritionFields.map(({ key }) => [key, '']))
export const nutritionValues = (values) =>
  Object.fromEntries(nutritionFields.map(({ key }) => [key, parseNutrition(values[key])]))

const formatter = new Intl.NumberFormat('en-GB', { maximumFractionDigits: 1 })
export const formatNutrition = (value) => formatter.format(value)

export const toCalendarDate = (date) => combineToMeasuredAt(date, 0, 0)?.slice(0, 10) ?? null
export const fromCalendarDate = (value) => splitMeasuredAt(`${value}T00:00:00`).date
export const formatCalendarDate = (value) =>
  fromCalendarDate(value) ? value.split('-').reverse().join('-') : '—'

export function mealsForDate(meals, date) {
  return meals
    .filter((meal) => meal.consumed_at.slice(0, 10) === date)
    .sort((a, b) => b.consumed_at.localeCompare(a.consumed_at) || b.id - a.id)
}

// A manual total replaces the meal sum, including when all manual values are zero.
export function dailyNutritionSummary(date, meals, dailyTotals) {
  const manual = dailyTotals.find((entry) => entry.log_date === date)
  if (manual) return { source: 'manual', values: nutritionValues(manual) }
  const entries = mealsForDate(meals, date)
  if (!entries.length) return null
  return {
    source: 'calculated',
    values: Object.fromEntries(
      nutritionFields.map(({ key }) => [
        key,
        entries.reduce((sum, entry) => sum + Math.round(Number(entry[key]) * 10), 0) / 10,
      ]),
    ),
  }
}
