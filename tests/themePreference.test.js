import assert from 'node:assert/strict'
import { afterEach, beforeEach, test } from 'node:test'
import { readThemePreference, saveThemePreference } from '../src/utils/themePreference.js'

let storedPreference
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')

beforeEach(() => {
  storedPreference = null
  globalThis.window = {
    localStorage: {
      getItem(key) {
        assert.equal(key, 'fitlog-theme')
        return storedPreference
      },
      setItem(key, value) {
        assert.equal(key, 'fitlog-theme')
        storedPreference = value
      },
    },
  }
})

afterEach(() => {
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow)
  } else {
    delete globalThis.window
  }
})

test('uses the system theme when no valid preference is stored', () => {
  for (const value of [null, '', 'invalid', 'DARK']) {
    storedPreference = value
    assert.equal(readThemePreference(), 'system')
  }
})

test('remembers and restores each supported theme preference', () => {
  for (const preference of ['light', 'dark', 'system']) {
    saveThemePreference(preference)
    assert.equal(storedPreference, preference)
    assert.equal(readThemePreference(), preference)
  }
})

test('does not overwrite a saved preference with an invalid value', () => {
  saveThemePreference('dark')
  saveThemePreference('invalid')
  assert.equal(readThemePreference(), 'dark')
})

test('falls back to system and allows switching when storage is inaccessible', () => {
  Object.defineProperty(window, 'localStorage', {
    get() {
      throw new Error('Storage is blocked')
    },
  })

  assert.equal(readThemePreference(), 'system')
  assert.doesNotThrow(() => saveThemePreference('dark'))
})

test('handles storage write failures without interrupting the app', () => {
  window.localStorage.setItem = () => {
    throw new Error('Storage quota exceeded')
  }

  assert.doesNotThrow(() => saveThemePreference('light'))
})
