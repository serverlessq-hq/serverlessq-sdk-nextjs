import { removeLeadingAndTrailingSlashes } from './sanitize-input'
import { expect, test } from 'vitest'

test(removeLeadingAndTrailingSlashes.name, () => {
  expect(removeLeadingAndTrailingSlashes('')).toBe('')
  expect(removeLeadingAndTrailingSlashes('api/queue')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('/api/queue')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('/api/queue')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('///api/queue')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('api/queue/')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('api/queue///')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('/api/queue/')).toBe('api/queue')
  expect(removeLeadingAndTrailingSlashes('///api/queue////')).toBe('api/queue')
})
