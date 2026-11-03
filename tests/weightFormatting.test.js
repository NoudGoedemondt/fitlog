import assert from 'node:assert/strict'
import test from 'node:test'
import { parseWeight } from '../src/utils/weightFormatting.js'
import { positiveNumber } from '../src/utils/validationRules.js'

test('weight input accepts comma and dot decimals and normalizes to a number', () => {
  for (const value of ['75,25', '75.25', ' 75,25 ', 75.25]) {
    assert.equal(parseWeight(value), 75.25)
    assert.equal(positiveNumber(parseWeight(value)), true)
  }
})

test('invalid or non-positive weight input fails validation', () => {
  for (const value of ['', null, 'abc', '75,2.5', '75,2,5', 'Infinity', '0', '-75,25']) {
    assert.notEqual(positiveNumber(parseWeight(value)), true)
  }
})
