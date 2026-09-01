export const emailRules = [
  (v) => !!v || 'E-mail is required.',
  (v) => /.+@.+\..+/.test(v) || 'E-mail must be valid.',
]

export const passwordRules = [(v) => !!v || 'Password is required.']
