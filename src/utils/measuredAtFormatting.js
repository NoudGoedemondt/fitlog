export function combineToMeasuredAt(date, hour, minute) {
  if (!(date instanceof Date) || isNaN(date)) {
    console.error('combineToMeasuredAt: Parameter date not a Date object or is NaN')
    return null
  }

  const pad = (num) => String(num).padStart(2, '0')

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(hour)
  const minutes = pad(minute)

  return `${year}-${month}-${day}T${hours}:${minutes}:00`
}

export function splitMeasuredAt(timestampStr) {
  if (!timestampStr || typeof timestampStr !== 'string') {
    console.error('splitMeasuredAt: Parameter timestampStr is null or not a string')
    return null
  }

  // Split the "YYYY-MM-DD" and "hh:mm:ss" parts
  const [datePart, timePart] = timestampStr.split('T')
  if (!datePart || !timePart) return null

  // Extract year, month, day
  const [year, month, day] = datePart.split('-').map(Number)

  // Extract hour and minute
  const [hour, minute] = timePart.split(':').map(Number)

  // Reconstruct a standard JavaScript Date object set to midnight for the "date" property
  // Note: month - 1 converts calendar month (1-12) back to JS month (0-11)
  const dateObj = new Date(year, month - 1, day)

  return {
    date: dateObj,
    hour: hour,
    minute: minute,
  }
}
