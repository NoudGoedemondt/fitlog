const weightFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})
export const formatWeight = (value) => weightFormatter.format(value)

export const parseWeight = (value) => {
  const weight = Number(
    String(value ?? '')
      .trim()
      .replace(',', '.'),
  )
  return Number.isFinite(weight) ? weight : NaN
}
