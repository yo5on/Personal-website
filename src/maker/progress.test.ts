import { describe, expect, it } from 'vitest'
import { dwell, nodeIndex } from './progress'

describe('dwell', () => {
  it('holds at both ends and is monotonic', () => {
    expect(dwell(0.1, 0.35)).toBe(0)
    expect(dwell(0.9, 0.35)).toBe(1)
    expect(dwell(0.5, 0.35)).toBeCloseTo(0.5)
    let prev = 0
    for (let t = 0; t <= 1; t += 0.05) { const v = dwell(t, 0.35); expect(v).toBeGreaterThanOrEqual(prev); prev = v }
  })
})

describe('nodeIndex', () => {
  const vh = 1000, line = 300
  // chapter top at `top`; intro is one screen tall, then cards every 900 px
  const at = (top: number) => nodeIndex(top, [0, 1, 2, 3, 4].map(k => top + 1000 + k * 900), line, 0.35)

  it('stays on the opening stop until the chapter reaches the viewport top', () => {
    expect(at(vh * 3)).toBe(-1) // chapter still below the fold
    expect(at(0)).toBe(-1)
  })
  it('reaches node 0 when the first card hits the line, and each node in turn', () => {
    expect(at(-(1000 - line))).toBe(0)
    expect(at(-(1000 - line) - 900 * 2)).toBe(2)
    expect(at(-(1000 - line) - 900 * 4)).toBe(4)
  })
  it('holds the last node after the timeline, and never leaves [-1, M-1]', () => {
    expect(at(-20000)).toBe(4)
    for (let top = 3000; top > -8000; top -= 37) {
      const s = at(top)
      expect(s).toBeGreaterThanOrEqual(-1)
      expect(s).toBeLessThanOrEqual(4)
    }
  })
})
