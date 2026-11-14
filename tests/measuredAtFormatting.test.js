import assert from 'node:assert/strict'
import test from 'node:test'
import { formatMeasuredTime } from '../src/utils/measuredAtFormatting.js'

test('measurement times show only padded hours and minutes without timezone conversion', () => {
  for (const [timestamp, expected] of [
    ['2026-11-10T09:05:00', '09:05'],
    ['2026-11-10T00:00:00', '00:00'],
    ['2026-11-10T23:59:59.123', '23:59'],
    ['2026-10-25T02:30:00', '02:30'],
  ]) {
    assert.equal(formatMeasuredTime(timestamp), expected)
  }
})

test('invalid or missing measurement times show a placeholder', () => {
  for (const timestamp of [
    null,
    undefined,
    '',
    'invalid',
    '2026-02-31T12:00:00',
    '2026-11-10T24:00:00',
  ]) {
    assert.equal(formatMeasuredTime(timestamp), '—')
  }
})
