import assert from 'node:assert/strict'
import test from 'node:test'
import { readDatabaseTestConfig, testOrigin } from './helpers/database.js'

// These unsigned placeholders exercise local validation only; no requests are made.
const anonKey = (role = 'anon', ref = 'yfupaojunwlqjnthxrlc') =>
  `header.${btoa(JSON.stringify({ role, ref }))}.signature`
const config = {
  FITLOG_TEST_RUN: '1',
  FITLOG_TEST_URL: testOrigin,
  FITLOG_TEST_ANON_KEY: anonKey(),
  FITLOG_TEST_SERVICE_ROLE_KEY: 'fixture-only-placeholder',
}

test('database guard requires explicit opt-in and all dedicated configuration', () => {
  // Missing configuration must fail before fixtures can be created remotely.
  for (const name of Object.keys(config)) {
    const candidate = { ...config }
    delete candidate[name]
    assert.throws(() => readDatabaseTestConfig(candidate))
  }
  assert.equal(readDatabaseTestConfig(config).url, testOrigin)
})

test('database guard rejects production, other projects and modified URLs', () => {
  // Require an exact URL match, including scheme, path, and authority.
  for (const url of [
    'https://uxmvhvtsthukvicjajdw.supabase.co',
    'https://other.supabase.co',
    `${testOrigin}/`,
    `${testOrigin}@example.invalid`,
    testOrigin.replace('https:', 'http:'),
  ]) {
    assert.throws(() => readDatabaseTestConfig({ ...config, FITLOG_TEST_URL: url }))
  }
})

test('database guard rejects privileged, malformed and wrong-project user keys', () => {
  // An admin key in a user client would invalidate every RLS assertion.
  for (const key of [
    anonKey('service_role'),
    anonKey('anon', 'other'),
    'sb_secret_example',
    'bad',
  ]) {
    assert.throws(() => readDatabaseTestConfig({ ...config, FITLOG_TEST_ANON_KEY: key }))
  }
  assert.ok(
    readDatabaseTestConfig({ ...config, FITLOG_TEST_ANON_KEY: 'sb_publishable_example' }).anonKey,
  )
})
