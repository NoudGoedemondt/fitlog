import { validDate, validHour, validMinute } from './validationRules.js'

const createCalendarDate = (year, month, day) => {
  const date = new Date(0)
  date.setHours(0, 0, 0, 0)
  date.setFullYear(year, month - 1, day)

  if (
    validDate(date) !== true ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function parseDateInput(value) {
  const match = typeof value === 'string' && /^(\d{2})-(\d{2})-(\d{4})$/.exec(value.trim())
  if (!match) return null
  return createCalendarDate(Number(match[3]), Number(match[2]), Number(match[1]))
}

export function combineToMeasuredAt(date, hour, minute) {
  if (validDate(date) !== true || validHour(hour) !== true || validMinute(minute) !== true) {
    return null
  }

  const pad = (num) => String(num).padStart(2, '0')
  const year = String(date.getFullYear()).padStart(4, '0')
  return `${year}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(hour)}:${pad(minute)}:00`
}

export function splitMeasuredAt(timestampStr) {
  const empty = { date: null, hour: null, minute: null }
  const match =
    typeof timestampStr === 'string' &&
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?$/.exec(timestampStr)
  if (!match) return empty

  const [, year, month, day, hours, minutes, seconds] = match
  const date = createCalendarDate(Number(year), Number(month), Number(day))
  const hour = Number(hours)
  const minute = Number(minutes)

  if (!date || validHour(hour) !== true || validMinute(minute) !== true || Number(seconds) > 59) {
    return empty
  }

  return { date, hour, minute }
}

export function formatMeasuredAt(value) {
  const { date, hour, minute } = splitMeasuredAt(value)
  if (!date) return '—'

  const pad = (number) => String(number).padStart(2, '0')
  const year = String(date.getFullYear()).padStart(4, '0')
  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${year} ${pad(hour)}:${pad(minute)}`
}

export function formatMeasuredTime(value) {
  const { date, hour, minute } = splitMeasuredAt(value)
  if (!date) return '—'
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}
