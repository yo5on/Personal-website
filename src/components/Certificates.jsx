import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { certificates, hackathons, projects } from '../data/content.js'
import { ArrowUpRight } from './Icons.jsx'
import { ProjectLink } from './Work.jsx'

// Certificates: one featured certificate at a time (after AnimatedTestimonials), with title, issuer and date beside
// it. Like the project plates, the framed certificate sits at a slight tilt, alternating -1° / 1° (±0.75° on phones)
// from one certificate to the next; the text beside it stays straight. The next certificate slides in from the side
// on top of the current one, which drifts the other way and fades only once it is covered: never a dim or empty frame.
// The previews are the real certificates (first page of each PDF, see public/certificates/previews); the featured one,
// and the "View certificate" link, open the original in a new tab. Navigation is manual only: arrows, ← → keys, a swipe.

const ease = [0.22, 1, 0.36, 1]
const items = certificates.flatMap(g => g.items.map(c => ({ ...c, group: g.group })))
const N = items.length
// preview images: named after the PDF; the Udemy credential (PDF not hosted) names its own preview
const slug = c => c.preview ?? c.file.split('/').pop().replace(/\.pdf$/, '')
const preview = (c, w) => `certificates/previews/${slug(c)}-${w}.webp`
const two = n => String(n).padStart(2, '0')
const SLIDE = 18 // px the incoming certificate travels
const reveal = (reduced, delay = 0) => ({ initial: reduced ? false : { opacity: 0, y: 22 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.2 }, transition: { duration: reduced ? 0 : 1.1, delay: reduced ? 0 : delay, ease } })

function useNarrow() {
  const q = '(max-width: 760px)'
  const [narrow, setNarrow] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches)
  useEffect(() => { const m = window.matchMedia(q), on = () => setNarrow(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on) }, [])
  return narrow
}

export function Certificates({ onOpen }) {
  const reduced = useReducedMotion()
  const [{ active, last, dir }, setShown] = useState({ active: 0, last: -1, dir: 1 })
  const swipe = useRef(null)
  const narrow = useNarrow()
  const go = d => setShown(s => ({ active: (s.active + d + N) % N, last: s.active, dir: d }))
  const tilt = (active % 2 ? 1 : -1) * (narrow ? 0.75 : 1) // resting angle, alternating
  const c = items[active]

  return (
    <section className="certificates" id="credentials" aria-labelledby="certificates-title">
      <header className="section-head">
        <span className="kicker">04 — Credentials</span>
        <motion.h2 id="certificates-title" className="section-title" {...reveal(reduced)}>Certificates<em>.</em></motion.h2>
        <p className="section-note">Courses, certifications and hackathons. Every certificate opens the original.</p>
      </header>

      <motion.div className="cs" role="region" aria-roledescription="carousel" aria-label="Certificates" {...reveal(reduced, 0.1)}
        onKeyDown={e => { if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.altKey) { e.preventDefault(); go(e.key === 'ArrowLeft' ? -1 : 1) } }}>
        {/* every certificate stays mounted (so the next one is already decoded); only the featured one shows */}
        <motion.div className="cs-stage" initial={false} animate={{ rotate: tilt }} transition={{ duration: reduced ? 0 : 0.6, ease }}
          onPointerDown={e => { if (e.pointerType !== 'mouse') swipe.current = { x: e.clientX, y: e.clientY } }}
          onPointerUp={e => { const s = swipe.current; swipe.current = null; if (!s) return; const dx = e.clientX - s.x; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - s.y)) go(dx < 0 ? 1 : -1) }}
          onPointerCancel={() => { swipe.current = null }}>
          <span className="plate-corner tl" /><span className="plate-corner tr" /><span className="plate-corner bl" /><span className="plate-corner br" />
          <div className="cs-stack">
            {items.map((it, i) => {
              const on = i === active, under = i === last
              return (
                <motion.a key={it.title} className="cs-card" href={it.file ?? it.verify} target="_blank" rel="noreferrer" tabIndex={-1} aria-hidden="true" draggable={false}
                  initial={false}
                  animate={reduced ? { opacity: on ? 1 : 0, x: 0, zIndex: on ? 2 : 0 }
                    : on ? { opacity: 1, x: [dir * SLIDE, 0], zIndex: 2 }
                    : under ? { opacity: 0, x: -dir * SLIDE * 0.5, zIndex: 1 }
                    : { opacity: 0, zIndex: 0 }}
                  // Opacity always moves from where it is: on quick clicks a half-faded card never snaps to full or to
                  // nothing. Cards being covered hold, then fade once the incoming one is opaque.
                  transition={reduced ? { duration: 0 }
                    : on ? { opacity: { duration: 0.3, ease }, x: { duration: 0.55, ease }, zIndex: { duration: 0 } }
                    : { opacity: { duration: 0.15, delay: 0.3 }, x: { duration: 0.45, ease }, zIndex: { duration: 0 } }}
                  style={{ pointerEvents: on ? 'auto' : 'none' }}>
                  <img src={preview(it, 720)} srcSet={`${preview(it, 720)} 720w, ${preview(it, 1280)} 1280w`} sizes="(max-width: 760px) 90vw, 560px"
                    alt="" loading="lazy" decoding="async" draggable={false} />
                </motion.a>
              )
            })}
          </div>
        </motion.div>

        <div className="cs-text">
          <div className="cs-head">
            <p className="cs-count" aria-hidden="true"><span>{two(active + 1)}</span><span className="cs-total">/ {two(N)}</span></p>
            <p className="cs-group">{c.group}</p>
          </div>
          <div className="cs-body">
            {/* title and details change together: the old block leaves quickly, then the new one rises in (no overlap) */}
            {/* every certificate's text sits invisibly in the same cell, so the cell is always as tall as the longest */}
            <div className="cs-copy">
              {items.map(it => (
                <div key={it.title} className="cs-ghost" aria-hidden="true">
                  <p className="cs-title">{it.title}</p>
                  <p className="cs-meta">{it.issuer}{it.note && <> · {it.note}</>}{it.when && <><span className="cs-sep"> · </span><span className="cs-date">{it.when}</span></>}</p>
                </div>
              ))}
              <div className="cs-live" aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={active} initial={reduced ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? { opacity: 1 } : { opacity: 0, y: -4, transition: { duration: 0.14, ease } }} transition={{ duration: reduced ? 0 : 0.34, ease }}>
                  <h3 className="cs-title"><span className="sr-only">Certificate {active + 1} of {N}: </span>{c.title}</h3>
                  {/* issuer and date: one line on phones, the date on its own line on wider screens */}
                  <p className="cs-meta">
                    {c.issuer}{c.note && <> · {c.note}</>}
                    {c.when && <><span className="cs-sep" aria-hidden="true"> · </span><time className="cs-date" dateTime={c.date}>{c.when}</time></>}
                  </p>
                </motion.div>
              </AnimatePresence>
              </div>
            </div>
            <a className="cs-open" href={c.file ?? c.verify} target="_blank" rel="noreferrer">
              {c.file ? 'View certificate' : 'Verify on Udemy'}<ArrowUpRight className="icon icon-ext" />
              <span className="sr-only">: {c.title} ({c.file ? 'PDF' : c.verifyHost}, opens in new tab)</span>
            </a>
          </div>
          {/* navigation: its own ruled row, the site's long crimson arrows (as on "Open study"), progress between */}
          <div className="cs-nav">
            <button type="button" className="cs-step cs-prev" onClick={() => go(-1)}><span className="open-arrow" aria-hidden="true" />Previous<span className="sr-only"> certificate</span></button>
            <span className="cs-progress" aria-hidden="true"><span style={{ transform: `scaleX(${(active + 1) / N})` }} /></span>
            <button type="button" className="cs-step cs-next" onClick={() => go(1)}>Next<span className="sr-only"> certificate</span><span className="open-arrow" aria-hidden="true" /></button>
          </div>
        </div>
      </motion.div>

      {/* Hackathons as a ledger: the two certificates also sit in the carousel; Tech Utsav has no certificate file */}
      <motion.div className="ledger" {...reveal(reduced, 0.1)}>
        <h3 className="kicker">Hackathons</h3>
        <ol>
          {hackathons.map(h => (
            <li key={h.title}>
              <span className="ledger-title">{h.title}</span>
              <span className="ledger-what">{h.what}{h.when && <> · {h.when}</>}</span>
              {h.work
                ? <ProjectLink project={projects.find(p => p.id === h.work)} onOpen={onOpen} className="ledger-link">Open study</ProjectLink>
                : <a className="ledger-link" href={h.file} target="_blank" rel="noreferrer">Certificate<ArrowUpRight className="icon icon-ext" /><span className="sr-only"> (PDF, opens in new tab)</span></a>}
            </li>
          ))}
        </ol>
      </motion.div>
    </section>
  )
}
