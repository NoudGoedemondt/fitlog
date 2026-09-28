export const required = (v) =>
  (v !== null && v !== undefined && v !== '') || 'This field is required.'

export const isEmail = (v) => /.+@.+\..+/.test(v) || 'Email must be valid.'

export const matchOther = (other, fieldName) => (v) => v === other || `${fieldName} must match.`

export const minLength = (length) => (v) =>
  v.length >= length || `Minimum ${length} characters required.`

export const positiveNumber = (v) => v > 0 || 'Value must be greater than 0.'
