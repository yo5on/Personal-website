import { motion, useReducedMotion } from 'motion/react'

/*
 * Line-drawn scientific plates — one per project. Strokes draw themselves in
 * when the plate enters view; crimson is reserved for a single point of focus.
 */

const ease = [0.22, 1, 0.36, 1]

function useDraw() {
  const reduced = useReducedMotion()
  return (i = 0, accent = false) => ({
    initial: reduced ? false : { pathLength: 0, opacity: 0 },
    whileInView: { pathLength: 1, opacity: 1 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: reduced ? 0 : 1.6, delay: reduced ? 0 : 0.15 + i * 0.045, ease },
    className: accent ? 'ink-accent' : undefined,
  })
}
function useFade() {
  const reduced = useReducedMotion()
  return (i = 0) => ({
    initial: reduced ? false : { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true, amount: 0.3 },
    transition: { duration: reduced ? 0 : 1.2, delay: reduced ? 0 : 0.6 + i * 0.05 },
  })
}

function Dial() {
  const d = useDraw(), f = useFade()
  const cx = 240, cy = 250
  const arc = (r, a0, a1) => { const p = a => [cx + r * Math.cos(a), cy - r * Math.sin(a)]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0} ${y0} A${r} ${r} 0 ${a0 - a1 > Math.PI ? 1 : 0} 1 ${x1} ${y1}` }
  return <>
    {[70, 110, 150].map((r, i) => <motion.path key={r} d={arc(r, Math.PI, 0)} {...d(i)} />)}
    {Array.from({ length: 25 }, (_, i) => { const a = Math.PI - (i / 24) * Math.PI, r0 = i % 6 ? 160 : 156; return <motion.line key={i} x1={cx + r0 * Math.cos(a)} y1={cy - r0 * Math.sin(a)} x2={cx + 168 * Math.cos(a)} y2={cy - 168 * Math.sin(a)} {...d(3 + i * 0.3)} /> })}
    <motion.path d={arc(130, 2.6, 2.05)} strokeWidth="5" strokeOpacity=".5" {...d(10)} />
    <motion.path d={arc(130, 1.7, 1.25)} strokeWidth="5" strokeOpacity=".5" {...d(11)} />
    <motion.path d={arc(130, 0.9, 0.55)} strokeWidth="5" {...d(12, true)} />
    <motion.line x1={cx} y1={cy} x2={cx + 150 * Math.cos(0.72)} y2={cy - 150 * Math.sin(0.72)} {...d(13)} />
    <motion.line x1="40" y1={cy} x2="440" y2={cy} {...d(1)} />
    <motion.text x="62" y={cy + 22} {...f(1)}>06:00</motion.text>
    <motion.text x="388" y={cy + 22} {...f(2)}>22:00</motion.text>
  </>
}

function Track() {
  const d = useDraw(), f = useFade()
  return <>
    <motion.path d="M30 310 C 140 310 150 130 250 140 S 390 280 450 70" strokeWidth="14" strokeOpacity=".16" {...d(0)} />
    <motion.path d="M30 310 C 140 310 150 130 250 140 S 390 280 450 70" {...d(1)} />
    <g transform="translate(250 140) rotate(8)">
      <motion.rect x="-40" y="-26" width="80" height="52" rx="3" {...d(3)} />
      <motion.rect x="-30" y="-36" width="22" height="9" {...d(4)} />
      <motion.rect x="-30" y="27" width="22" height="9" {...d(5)} />
      {Array.from({ length: 8 }, (_, i) => <motion.circle key={i} cx="52" cy={-21 + i * 6} r="2.2" {...d(6 + i * 0.4, i === 4)} />)}
      <motion.line x1="40" y1="-24" x2="52" y2="-24" {...d(8)} />
      <motion.line x1="40" y1="24" x2="52" y2="24" {...d(8)} />
    </g>
    <motion.path d="M40 70 C 52 30 64 30 76 70 S 100 104 112 70 S 132 48 144 70 S 162 84 174 70 S 190 64 204 70 L 236 70" {...d(9)} />
    <motion.line x1="40" y1="70" x2="240" y2="70" strokeDasharray="2 4" {...f(1)} />
    <motion.text x="40" y="112" {...f(2)}>e(t) → 0</motion.text>
  </>
}

function Arm() {
  const d = useDraw(), f = useFade()
  return <>
    <motion.line x1="50" y1="312" x2="430" y2="312" {...d(0)} />
    <motion.rect x="104" y="294" width="92" height="18" {...d(1)} />
    <motion.line x1="150" y1="294" x2="214" y2="178" strokeWidth="2" {...d(2)} />
    <motion.line x1="214" y1="178" x2="330" y2="144" strokeWidth="2" {...d(3)} />
    <motion.line x1="330" y1="144" x2="366" y2="190" strokeWidth="2" {...d(4)} />
    {[[150, 294, 11], [214, 178, 8], [330, 144, 7]].map(([x, y, r], i) => <motion.circle key={i} cx={x} cy={y} r={r} {...d(5 + i)} />)}
    <motion.path d="M366 190 l -12 18 M366 190 l 14 14" {...d(8)} />
    <motion.circle cx="366" cy="190" r="3" {...d(9, true)} />
    <motion.path d="M150 74 A 220 220 0 0 1 368 284" strokeDasharray="3 6" {...f(1)} />
    <motion.rect x="352" y="238" width="72" height="44" rx="4" {...d(10)} />
    <motion.rect x="370" y="252" width="10" height="14" rx="5" {...d(11)} />
    <motion.rect x="396" y="252" width="10" height="14" rx="5" {...d(11)} />
    <motion.text x="352" y="300" {...f(2)}>OLED / SPARKY</motion.text>
  </>
}

const PLATES = { dial: Dial, track: Track, arm: Arm }

function Photo({ image }) {
  // every photo fills the same frame (object-fit: cover); object-position only where the subject needs it
  const cls = ['plate-photo', image.fit === 'contain' && 'is-contain', image.pixel && 'is-pixel', image.oled && 'is-oled'].filter(Boolean).join(' ')
  return (
    <picture className={cls}>
      {image.still && <source srcSet={image.still} media="(prefers-reduced-motion: reduce)" />}
      <img src={image.src} alt={image.alt} width={image.w} height={image.h} loading="lazy" decoding="async"
        style={image.position ? { objectPosition: image.position } : undefined} />
    </picture>
  )
}

export default function Plate({ project }) {
  const Drawing = PLATES[project.plate]
  return (
    <figure className="plate">
      <span className="plate-corner tl" /><span className="plate-corner tr" /><span className="plate-corner bl" /><span className="plate-corner br" />
      {project.image ? <Photo image={project.image} /> : (
        <svg viewBox="0 0 480 360" role="img" aria-label={`${project.title} — ${project.caption}`}>
          <Drawing />
        </svg>
      )}
      <figcaption>{project.caption}</figcaption>
    </figure>
  )
}
