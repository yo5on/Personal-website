import { describe, expect, it } from 'vitest'
import { pageFromHash } from './route'

describe('pageFromHash', () => {
  it('maps hashes to pages, and project views and anything else to Origin, the landing page', () => {
    expect(pageFromHash('#origin')).toBe('origin')
    expect(pageFromHash('#maker')).toBe('maker')
    expect(pageFromHash('#credentials')).toBe('credentials')
    expect(pageFromHash('#work/some-project')).toBe('work')
    expect(pageFromHash('#work')).toBe('work')
    expect(pageFromHash('')).toBe('origin')
    expect(pageFromHash('#top')).toBe('origin')
    expect(pageFromHash('#nope')).toBe('origin')
  })
})
