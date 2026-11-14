import assert from 'node:assert/strict'
import test from 'node:test'
import { createRouter, createMemoryHistory } from 'vue-router'
import {
  getPasswordRecoveryUser,
  getPasswordResetUrl,
  updateRecoveredPassword,
} from '../src/utils/passwordRecovery.js'

const createTestRouter = (base = '/') =>
  createRouter({
    history: createMemoryHistory(base),
    routes: [
      { path: '/', name: 'home', component: {} },
      { path: '/weight', name: 'weights', component: {} },
      { path: '/login', name: 'login', component: {}, meta: { guestOnly: true } },
      {
        path: '/forgot-password',
        name: 'forgot-password',
        component: {},
        meta: { authPage: true },
      },
      {
        path: '/reset-password',
        name: 'reset-password',
        component: {},
        meta: { authCallback: true },
      },
    ],
  })

const createAuth = (overrides = {}) => ({
  initialize: async () => ({ error: null }),
  getUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
  updateUser: async () => ({ data: { user: { id: 'test-user' } }, error: null }),
  ...overrides,
})

test('reset links preserve an internal destination, query and hash', () => {
  const url = new URL(
    getPasswordResetUrl(
      createTestRouter(),
      '/weight?period=month#history',
      'https://fitlog.example',
    ),
  )
  assert.equal(url.origin, 'https://fitlog.example')
  assert.equal(url.pathname, '/reset-password')
  assert.equal(url.searchParams.get('redirect'), '/weight?period=month#history')
  assert.equal(url.hash, '')
})

test('reset links support a frontend base path', () => {
  const url = new URL(
    getPasswordResetUrl(createTestRouter('/fitlog/'), '/weight', 'https://fitlog.example'),
  )
  assert.equal(url.pathname, '/fitlog/reset-password')
})

test('reset links never return to external URLs or authentication pages', () => {
  const router = createTestRouter()
  for (const redirect of [
    'https://example.invalid',
    '//example.invalid',
    '/login',
    '/forgot-password',
    '/reset-password',
  ]) {
    const url = new URL(getPasswordResetUrl(router, redirect, 'https://fitlog.example'))
    assert.equal(url.origin, 'https://fitlog.example')
    assert.equal(url.searchParams.get('redirect'), '/')
  }
})

test('an invalid recovery callback cannot fall back to an older valid session', async () => {
  let userRead = false
  const auth = createAuth({
    initialize: async () => ({ error: { code: 'otp_expired' } }),
    getUser: async () => {
      userRead = true
      return { data: { user: { id: 'older-user' } } }
    },
  })
  await assert.rejects(getPasswordRecoveryUser(auth), /invalid or has expired/)
  assert.equal(userRead, false)
})

test('a missing or expired session is rejected', async () => {
  for (const result of [
    { data: { user: null }, error: null },
    { data: { user: null }, error: { status: 401 } },
  ]) {
    await assert.rejects(
      getPasswordRecoveryUser(createAuth({ getUser: async () => result })),
      /unavailable or has expired/,
    )
  }
})

test('a server-verified authenticated user can set their own password', async () => {
  const user = await getPasswordRecoveryUser(createAuth())
  assert.equal(user.id, 'test-user')
})

test('updating checks the current account and sends only the new password', async () => {
  const calls = []
  await updateRecoveredPassword(
    createAuth({
      getUser: async () => {
        calls.push('getUser')
        return { data: { user: { id: 'test-user' } } }
      },
      updateUser: async (attributes) => {
        calls.push(attributes)
        return { error: null }
      },
    }),
    'example-password',
    'test-user',
  )
  assert.deepEqual(calls, ['getUser', { password: 'example-password' }])
})

test('changing accounts after opening the form prevents updating the other account', async () => {
  let updated = false
  await assert.rejects(
    updateRecoveredPassword(
      createAuth({
        getUser: async () => ({ data: { user: { id: 'different-user' } }, error: null }),
        updateUser: async () => {
          updated = true
          return { error: null }
        },
      }),
      'example-password',
      'test-user',
    ),
    /session has changed/,
  )
  assert.equal(updated, false)
})

test('a missing expected account cannot update a password', async () => {
  await assert.rejects(
    updateRecoveredPassword(createAuth(), 'example-password', null),
    /session has changed/,
  )
})

test('password policy and expiry errors produce actionable messages', async () => {
  for (const [error, message] of [
    [{ code: 'same_password' }, /different from your current/],
    [{ code: 'weak_password' }, /does not meet the account requirements/],
    [{ status: 401 }, /session has expired/],
    [{ code: 'session_not_found' }, /session has expired/],
    [{ status: 500 }, /Unable to update/],
  ]) {
    await assert.rejects(
      updateRecoveredPassword(
        createAuth({ updateUser: async () => ({ error }) }),
        'example-password',
        'test-user',
      ),
      message,
    )
  }
})

test('network failures propagate to the form error handler', async () => {
  await assert.rejects(
    updateRecoveredPassword(
      createAuth({
        updateUser: async () => {
          throw new Error('Network unavailable')
        },
      }),
      'example-password',
      'test-user',
    ),
    /Network unavailable/,
  )
})
