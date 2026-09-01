export const required = (v) => !!v || 'This field is required.'

export const isEmail = (v) => /.+@.+\..+/.test(v) || 'Email must be valid.'

export const matchOther = (other, fieldName) => (v) => v === other || `${fieldName} must match.`

export const minLength = (length) => (v) =>
  v.length >= length || `Minimum ${length} characters required.`
