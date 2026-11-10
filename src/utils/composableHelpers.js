// Mutates the entries array in place.
export const sortDescending = (entries, dateField) => {
  entries.sort((a, b) => new Date(b[dateField]) - new Date(a[dateField]))
}

export const errorMessage = (error, fallback) => error?.message || fallback
