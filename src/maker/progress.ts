// Scroll → camera-path position for the Maker chapter. Pure, so it is unit-tested (progress.test.ts).
//
// The chapter is ordinary scrolling content over a sticky stage: nothing is pinned or hijacked. The camera
// position is read from where the timeline cards sit in the viewport, not from page scroll, so it does not
// matter how far down the page the chapter starts.

/** Hold still near each node, move quickly between them. d = share of each half-span to dwell (0–0.49). */
export function dwell(t: number, d: number): number {
  d = Math.min(Math.max(d, 0), 0.49)
  if (d <= 0) return t
  if (t < d) return 0
  if (t > 1 - d) return 1
  const x = (t - d) / (1 - 2 * d)
  return x * x * (3 - 2 * x)
}

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1)

/**
 * Continuous node index s: -1 = the chapter's opening (hero) stop, 0 … M-1 = timeline node k.
 * sectionTop: the chapter's top edge in viewport px. tops: each node anchor's top in viewport px, in order.
 * refLine: the viewport line (px from the top) at which a node locks.
 */
export function nodeIndex(sectionTop: number, tops: number[], refLine: number, d: number): number {
  const M = tops.length
  if (!M) return -1
  if (refLine <= tops[0]) {
    // Opening → node 0 over the scroll from "chapter top at viewport top" to "first card on the line"
    const span = Math.max(1, tops[0] - sectionTop - refLine)
    return -1 + dwell(clamp01(-sectionTop / span), d)
  }
  if (refLine >= tops[M - 1]) return M - 1
  for (let i = 0; i < M - 1; i++) {
    if (refLine <= tops[i + 1]) return i + dwell((refLine - tops[i]) / Math.max(1, tops[i + 1] - tops[i]), d)
  }
  return M - 1
}
