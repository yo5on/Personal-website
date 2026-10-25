import { describe, expect, it } from 'vitest'
import { pageFromHash } from './route'

describe('pageFromHash', () => {
  it('maps hashes to pages, and project views and anything else to Work, the landing page', () => {
    expect(pageFromHash('#maker')).toBe('maker')
    expect(pageFromHash('#credentials')).toBe('credentials')
    expect(pageFromHash('#work/some-project')).toBe('work')
    expect(pageFromHash('#work')).toBe('work')
    expect(pageFromHash('')).toBe('work')
    expect(pageFromHash('#top')).toBe('work')
    expect(pageFromHash('#nope')).toBe('work')
  })
})
