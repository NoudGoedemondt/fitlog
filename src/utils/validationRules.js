export const required = (v) =>
  (v !== null && v !== undefined && v !== '') || 'This field is required.'

export const isEmail = (v) => /.+@.+\..+/.test(v) || 'Email must be valid.'

export const matchOther = (other, fieldName) => (v) => v === other || `${fieldName} must match.`

export const minLength = (length) => (v) =>
  v.length >= length || `Minimum ${length} characters required.`

export const positiveNumber = (v) => v > 0 || 'Value must be greater than 0.'

export const validWeight = (v) => Number.isFinite(v) || 'Enter a valid weight.'

export const validDate = (v) =>
  (v instanceof Date &&
    Number.isFinite(v.getTime()) &&
    v.getFullYear() >= 1 &&
    v.getFullYear() <= 9999) ||
  'Enter a valid date.'

export const validHour = (v) =>
  (Number.isInteger(v) && v >= 0 && v <= 23) || 'Enter a whole hour from 0 to 23.'

export const validMinute = (v) =>
  (Number.isInteger(v) && v >= 0 && v <= 59) || 'Enter a whole minute from 0 to 59.'
