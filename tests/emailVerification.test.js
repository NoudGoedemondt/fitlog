import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter, createMemoryHistory } from 'vue-router'
import { confirmEmailSession, getEmailConfirmationUrl } from '../src/utils/emailVerification.js'

const createTestRouter = (base = '/') => {
  const component = { render: () => null }
  return createRouter({
    history: createMemoryHistory(base),
    routes: [
      { path: '/', name: 'home', component },
      { path: '/login', name: 'login', component, meta: { guestOnly: true } },
      { path: '/verify-email', name: 'verify-email', component, meta: { guestOnly: true } },
      { path: '/auth/confirm', name: 'auth-confirm', component, meta: { authCallback: true } },
      { path: '/weight', name: 'weights', component, meta: { requiresAuth: true } },
    ],
  })
}

test('confirmation URL keeps the original internal destination, including query and hash', () => {
  const url = new URL(
    getEmailConfirmationUrl(
      createTestRouter(),
      '/weight?period=month#history',
      'https://fitlog.example',
    ),
  )
  assert.equal(url.origin, 'https://fitlog.example')
  assert.equal(url.pathname, '/auth/confirm')
  assert.equal(url.searchParams.get('redirect'), '/weight?period=month#history')
  assert.equal(url.hash, '')
})

test('confirmation URLs support a frontend deployed under a base path', () => {
  const url = new URL(
    getEmailConfirmationUrl(createTestRouter('/fitlog/'), '/weight', 'https://fitlog.example'),
  )
  assert.equal(url.pathname, '/fitlog/auth/confirm')
  assert.equal(url.searchParams.get('redirect'), '/weight')
})

test('confirmation URLs reject external and authentication destinations', () => {
  const router = createTestRouter()
  for (const redirect of [
    'https://example.invalid',
    '//example.invalid',
    '/login',
    '/verify-email',
    '/auth/confirm',
  ]) {
    const url = new URL(getEmailConfirmationUrl(router, redirect, 'https://fitlog.example'))
    assert.equal(url.origin, 'https://fitlog.example')
    assert.equal(url.searchParams.get('redirect'), '/')
  }
})

test('a verified user is accepted only after successful client initialization', async () => {
  const calls = []
  const user = { id: 'test-user', email_confirmed_at: '2026-11-02T12:00:00Z' }
  const result = await confirmEmailSession({
    initialize: async () => {
      calls.push('initialize')
      return { error: null }
    },
    getUser: async () => {
      calls.push('getUser')
      return { data: { user }, error: null }
    },
  })
  assert.equal(result, user)
  assert.deepEqual(calls, ['initialize', 'getUser'])
})

test('invalid or expired links cannot succeed using an older logged-in session', async () => {
  let userRequested = false
  await assert.rejects(
    confirmEmailSession({
      initialize: async () => ({ error: { code: 'otp_expired' } }),
      getUser: async () => {
        userRequested = true
        return { data: { user: { email_confirmed_at: 'earlier' } } }
      },
    }),
    /invalid or has expired/,
  )
  assert.equal(userRequested, false)
})

test('a missing or unconfirmed session is never reported as verified', async () => {
  for (const user of [null, { id: 'test-user' }, { id: 'test-user', email_confirmed_at: null }]) {
    await assert.rejects(
      confirmEmailSession({
        initialize: async () => ({ error: null }),
        getUser: async () => ({ data: { user }, error: null }),
      }),
      /No verified session/,
    )
  }
})

test('server user-verification errors are not treated as successful confirmation', async () => {
  await assert.rejects(
    confirmEmailSession({
      initialize: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: { message: 'Session expired' } }),
    }),
    /No verified session/,
  )
})

test('network exceptions propagate so the callback can show an error', async () => {
  await assert.rejects(
    confirmEmailSession({
      initialize: async () => {
        throw new Error('Network unavailable')
      },
    }),
    /Network unavailable/,
  )
})
