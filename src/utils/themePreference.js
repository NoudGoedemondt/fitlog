const storageKey = 'fitlog-theme'
const themePreferences = ['light', 'dark', 'system']

export function readThemePreference() {
  try {
    const preference = window.localStorage.getItem(storageKey)
    return themePreferences.includes(preference) ? preference : 'system'
  } catch {
    return 'system'
  }
}

export function saveThemePreference(preference) {
  if (!themePreferences.includes(preference)) return

  try {
    window.localStorage.setItem(storageKey, preference)
  } catch {
    // Theme switching remains available when browser storage is blocked.
  }
}
