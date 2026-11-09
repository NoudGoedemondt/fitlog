import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'

// Keep the target independent of frontend configuration to exclude production.
export const testOrigin = 'https://yfupaojunwlqjnthxrlc.supabase.co'

export function readDatabaseTestConfig(env) {
  // Validate explicit opt-in and the exact project URL before any network request.
  assert.equal(env.FITLOG_TEST_RUN, '1', 'Database tests require FITLOG_TEST_RUN=1')
  assert.equal(env.FITLOG_TEST_URL, testOrigin, 'Only the exact FitlogDB-test URL is allowed')
  assert.ok(env.FITLOG_TEST_ANON_KEY, 'FITLOG_TEST_ANON_KEY is required')
  assert.ok(
    env.FITLOG_TEST_SERVICE_ROLE_KEY,
    'FITLOG_TEST_SERVICE_ROLE_KEY is required for fixtures',
  )
  const key = env.FITLOG_TEST_ANON_KEY
  // Ordinary user sessions must never inherit a service-role key's RLS bypass.
  // Publishable keys are opaque; Supabase validates their project on each request.
  if (!key.startsWith('sb_publishable_')) {
    let claims
    try {
      claims = JSON.parse(atob(key.split('.')[1]))
    } catch {
      assert.fail('FITLOG_TEST_ANON_KEY must be a public anon JWT or publishable key')
    }
    assert.equal(claims.role, 'anon', 'User clients must use an anon key, never a service-role key')
    assert.equal(claims.ref, 'yfupaojunwlqjnthxrlc', 'Anon key must belong to FitlogDB-test')
  }
  return { url: testOrigin, anonKey: key, adminKey: env.FITLOG_TEST_SERVICE_ROLE_KEY }
}

export function databaseClient(config, key = config.anonKey) {
  // Use the public key by default; admin clients are explicitly requested for fixtures.
  return createClient(config.url, key, {
    // Each test user has an independent, in-memory session without refresh timers.
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, options) => {
        // Check every destination and refuse redirects, including Auth requests.
        const url = new URL(typeof input === 'string' ? input : (input.url ?? input.href))
        assert.equal(url.origin, testOrigin, 'Database test request left FitlogDB-test')
        return fetch(input, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) })
      },
    },
  })
}

export function success(result) {
  // Report database codes only, avoiding credentials and tokens in failure output.
  assert.ok(!result.error, `Database request failed (${result.error?.code ?? 'no error code'})`)
  return result.data
}

export function rejected(result, code) {
  // Match SQLSTATE codes so unrelated failures cannot satisfy constraint tests.
  assert.equal(result.error?.code, code)
}
