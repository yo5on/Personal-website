/*
 * Crimson silk ribbons drawn around the moth.
 *
 * Each ribbon is a smooth Catmull-Rom → Bezier centreline through hand-placed
 * points. It is rendered as a filled outline whose width swells and pinches to a
 * hairline as the ribbon "twists", which reads as a flat silk strip rather than a
 * stroked line. `front` ranges (0–1 along the ribbon) are drawn above the moth;
 * everything else sits behind it.
 *
 * Coordinates live in the art box viewBox (1600 × 1100). The moth image occupies
 * x 200–1400, y 168–931 of that box.
 */

export const VIEW = { w: 1600, h: 1100 }
export const MOTH = { x: 200, y: 168, w: 1200, h: 763 }

const RIBBONS = [
  {
    // Upper ribbon: rises from behind the headline, crosses in front of the head
    // and right forewing, then follows the wing tip closely and tucks under its
    // lower edge, so it reads as wrapping the wing rather than a detached loop.
    width: 18, twists: 3.4, phase: 0.3,
    points: [[290, 262], [400, 222], [520, 192], [700, 174], [830, 170], [950, 128], [1030, 116], [1044, 178], [960, 214], [860, 230], [860, 330], [960, 380], [1100, 320], [1225, 322], [1320, 370], [1378, 445], [1420, 530], [1405, 580], [1350, 590], [1280, 565]],
    front: [[0.5, 0.72]],
  },
  {
    // Lower ribbon: emerges from behind the left forewing, loops out to the left,
    // crosses in front of the left hindwing, dips through the gap between the
    // lobes, runs beneath them and finishes with a tapered tail in open space.
    width: 16, twists: 2.6, phase: 1.1,
    points: [[330, 560], [250, 640], [205, 750], [250, 860], [370, 915], [520, 905], [650, 860], [760, 815], [812, 830], [812, 910], [770, 965], [820, 1000], [930, 985], [1040, 965], [1140, 915], [1220, 850], [1270, 790]],
    front: [[0.383, 1]],
  },
  {
    // Thin echo beneath the hindwings; both ends start hidden behind the lobes.
    width: 5, twists: 1.2, phase: 0.4,
    points: [[660, 905], [640, 970], [720, 1030], [880, 1045], [1010, 1010], [1020, 950], [975, 860]],
    front: [],
  },
]

function catmullRom(points, steps = 28) {
  const out = []
  const n = points.length
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)], p1 = points[i], p2 = points[i + 1], p3 = points[Math.min(i + 2, n - 1)]
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t
      out.push([0, 1].map(k => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)))
    }
  }
  out.push(points[n - 1])
  return out
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }

function outline(samples, from, to) {
  const left = [], right = []
  for (let i = from; i <= to; i++) {
    const { p, n, w } = samples[i]
    left.push(`${(p[0] + n[0] * w).toFixed(1)} ${(p[1] + n[1] * w).toFixed(1)}`)
    right.push(`${(p[0] - n[0] * w).toFixed(1)} ${(p[1] - n[1] * w).toFixed(1)}`)
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}

function build({ points, width, twists, phase, front }) {
  const line = catmullRom(points)
  // arc-length parameter so twists are evenly spaced along the ribbon
  const len = [0]
  for (let i = 1; i < line.length; i++) len.push(len[i - 1] + Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1]))
  const total = len[len.length - 1]
  const samples = line.map((p, i) => {
    const a = line[Math.max(i - 1, 0)], b = line[Math.min(i + 1, line.length - 1)]
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1
    const t = len[i] / total
    const twist = 0.24 + 0.76 * Math.abs(Math.cos(twists * Math.PI * t + phase))
    const w = (width / 2) * twist * smooth(0, 0.06, t) * smooth(1, 0.9, t) + 0.45
    return { p, n: [-dy / d, dx / d], w, t }
  })
  const isFront = t => front.some(([a, b]) => t >= a && t <= b)
  const back = [], fore = []
  let start = 0
  for (let i = 1; i <= samples.length; i++) {
    const end = i === samples.length || isFront(samples[i].t) !== isFront(samples[start].t)
    if (!end) continue
    // Overlap neighbouring pieces by a few samples so each piece's cut edge sits on
    // solid ribbon from the other layer, leaving no anti-aliased seam.
    const from = Math.max(start - 3, 0), to = Math.min(i + 3, samples.length - 1)
    ;(isFront(samples[start].t) ? fore : back).push(outline(samples, from, to))
    start = i
  }
  return { back, fore }
}

const BUILT = RIBBONS.map(build)

export function RibbonLayer({ layer, className }) {
  return (
    <svg className={className} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">
      <g fill="#D21319">
        {BUILT.map((r, i) => (r[layer] || []).map((d, j) => <path key={`${i}-${j}`} d={d} />))}
      </g>
    </svg>
  )
}
