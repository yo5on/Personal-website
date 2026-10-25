import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { removeCatchlight, removeIris } from './eyeTracking'

// A 128² brown iris (r = 50) with a dark pupil, a bright catchlight upper-right and a fainter light disc on the
// far side of the pupil.
const S = 128
function eye() {
  const px = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const i = 4 * (y * S + x)
    const d = Math.hypot(x - 64, y - 64)
    let c = d < 50 ? [110, 70, 50] : [235, 225, 215]
    if (d < 20) c = [25, 20, 20]
    if (Math.hypot(x - 88, y - 88) < 7) c = [240, 240, 235]
    if (Math.hypot(x - 40, y - 72) < 6) c = [170, 150, 145]
    px.set([...c, 255], i)
  }
  return px
}
const at = (px: Uint8Array, x: number, y: number) => Array.from(px.subarray(4 * (y * S + x), 4 * (y * S + x) + 4))

describe('removeCatchlight', () => {
  const iris = new THREE.Vector3(64.5 / S, 64.5 / S, 50 / S)
  const px = eye()
  const out = removeCatchlight(px, iris, S)

  it('fills the catchlight with the iris colour', () => {
    const [r, g, b, a] = at(out, 88, 88)
    expect(Math.abs(r - 110)).toBeLessThan(12)
    expect(Math.abs(g - 70)).toBeLessThan(12)
    expect(Math.abs(b - 50)).toBeLessThan(12)
    expect(a).toBe(255)
  })

  it('keeps the pupil, the separate light disc, the sclera and the input', () => {
    expect(at(out, 64, 64)).toEqual([25, 20, 20, 255])
    expect(at(out, 40, 72)).toEqual([170, 150, 145, 255])
    expect(at(out, 2, 2)).toEqual([235, 225, 215, 255])
    expect(at(px, 88, 88)).toEqual([240, 240, 235, 255])
  })
})

describe('removeIris', () => {
  // An opening (alpha 255) inside skin (alpha 0) with a sclera shaded left to right, and a dark iris in the middle.
  const px = new Uint8Array(S * S * 4)
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const inside = Math.hypot((x - 64) / 60, (y - 64) / 40) < 1
    const sclera = 160 + x / 2
    const c = !inside ? [200, 120, 90] : Math.hypot(x - 64, y - 64) < 25 ? [60, 40, 30] : [sclera, sclera, sclera]
    px.set([...c, inside ? 255 : 0], 4 * (y * S + x))
  }
  const out = removeIris(px, new THREE.Vector3(64.5 / S, 64.5 / S, 25 / S), S)

  it('fills the iris with the sclera shading around it', () => {
    const [r, g, b, a] = at(out, 64, 64)
    expect(Math.abs(r - 192)).toBeLessThan(6)
    expect(Math.abs(g - 192)).toBeLessThan(6)
    expect(Math.abs(b - 192)).toBeLessThan(6)
    expect(a).toBe(255)
  })

  it('keeps the skin, the sclera outside the iris and the input', () => {
    expect(at(out, 64, 10)).toEqual([200, 120, 90, 0])
    expect(at(out, 20, 64)).toEqual(at(px, 20, 64))
    expect(at(px, 64, 64)).toEqual([60, 40, 30, 255])
  })
})
