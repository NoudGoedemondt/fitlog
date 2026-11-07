import assert from 'node:assert/strict'
import test from 'node:test'
import { parseWeight } from '../src/utils/weightFormatting.js'
import { positiveNumber, validWeight } from '../src/utils/validationRules.js'

test('weight input accepts comma and dot decimals and normalizes to a number', () => {
  for (const value of ['75,25', '75.25', ' 75,25 ', 75.25]) {
    assert.equal(parseWeight(value), 75.25)
    assert.equal(validWeight(parseWeight(value)), true)
    assert.equal(positiveNumber(parseWeight(value)), true)
  }
})

test('text and malformed weights receive a valid weight error', () => {
  for (const value of ['abc', '75kg', '75,2.5', '75,2,5', 'Infinity', 'NaN']) {
    assert.equal(validWeight(parseWeight(value)), 'Enter a valid weight.')
  }
})

test('zero and negative weights pass number validation but fail positivity validation', () => {
  for (const value of ['0', '-75,25']) {
    const weight = parseWeight(value)
    assert.equal(validWeight(weight), true)
    assert.equal(positiveNumber(weight), 'Value must be greater than 0.')
  }
})

test('invalid or non-positive weight input fails validation', () => {
  for (const value of ['', null, 'abc', '75,2.5', '75,2,5', 'Infinity', '0', '-75,25']) {
    assert.notEqual(positiveNumber(parseWeight(value)), true)
  }
})
