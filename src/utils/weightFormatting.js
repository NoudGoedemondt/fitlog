const weightFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 2,
})
export const formatWeight = (value) => weightFormatter.format(value)
