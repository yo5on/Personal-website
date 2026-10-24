import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { email, github, linkedin, maker, projects } from '../data/content.js'
import { FOCUS_POINTS } from '../maker/focusPoints'
import { ExternalLink } from './Icons.jsx'
import { ProjectLink } from './Work.jsx'

/*
 * Fig. 02 — The Maker. About, practice and résumé as one chapter around the 3D bust from the Aboutme site.
 * The page scrolls normally: the stage is only `position: sticky` behind the timeline cards, and the camera
 * follows the cards (src/maker/progress.ts). The WebGL chunk loads when the chapter is about a screen away
 * (or earlier, on idle), renders only while the chapter is on screen, and a poster of the opening shot
 * stands in until it is ready — or for good without WebGL, with Save-Data, or with 3D switched off.
 */

const loadCanvas = () => import('../maker/MakerCanvas.tsx')
const MakerCanvas = lazy(loadCanvas)
const ease = [0.22, 1, 0.36, 1]
const PREF = 'maker-3d' // per-viewer convenience only: 'on' | 'off'

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch { return false }
}
const saveData = () => navigator.connection?.saveData === true
const readPref = () => { try { return localStorage.getItem(PREF) } catch { return null } }
const writePref = v => { try { localStorage.setItem(PREF, v) } catch { /* storage blocked: the toggle still works for this visit */ } }
// Phones (touch or narrow): the lighter model, 1× resolution, no post-processing, no shadows.
const isPhone = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 760

// Catches a failed chunk, WebGL context or model load; the poster stays and the chapter still reads.
class Boundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Maker 3D failed:', error); this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

function Node({ node, index, onOpen }) {
  const reduced = useReducedMotion()
  const byId = id => projects.find(p => p.id === id)
  return (
    <li className="maker-node">
      <motion.article className="maker-card" data-point={FOCUS_POINTS[index]} aria-labelledby={`maker-node-${index}`}
        initial={reduced ? false : { opacity: 0, y: 26 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-12% 0px -12% 0px' }}
        transition={{ duration: reduced ? 0 : 0.8, ease }}>
        <p className={node.verb ? 'maker-kicker is-verb' : 'maker-kicker'}><span>{String(index + 1).padStart(2, '0')}</span>{node.kicker}</p>
        <h3 id={`maker-node-${index}`} className="maker-node-title">{node.title}</h3>
        {node.sub && <p className="maker-sub">{node.sub}</p>}
        {node.points && <ul className="maker-points">{node.points.map(p => <li key={p}>{p}</li>)}</ul>}
        {node.work && (
          <p className="maker-work"><span className="sr-only">Studies: </span>
            {node.work.map(id => <ProjectLink key={id} project={byId(id)} onOpen={onOpen} className="tag">{byId(id).title}</ProjectLink>)}
          </p>
        )}
        {node.contact && (
          <div className="maker-contact">
            <a href={`mailto:${email}`}>{email}</a>
            <ExternalLink href={github}>GitHub</ExternalLink>
            <ExternalLink href={linkedin}>LinkedIn</ExternalLink>
            <a href="#credentials">Credentials ↓</a>
          </div>
        )}
      </motion.article>
    </li>
  )
}

export default function Maker({ onOpen }) {
  const reduced = useReducedMotion()
  const section = useRef(null)
  const [webgl] = useState(hasWebGL)
  const [on, setOn] = useState(() => { const p = readPref(); return p ? p === 'on' : !saveData() })
  const [near, setNear] = useState(false) // within about a screen: start loading
  const [visible, setVisible] = useState(false) // on screen: render
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const phone = useMemo(isPhone, [near]) // decided when the 3D mounts, not at page load
  const enabled = webgl && on && !failed

  useEffect(() => {
    const el = section.current
    const nearIO = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setNear(true); nearIO.disconnect() } }, { rootMargin: '100% 0px' })
    const seenIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    nearIO.observe(el); seenIO.observe(el)
    return () => { nearIO.disconnect(); seenIO.disconnect() }
  }, [])

  // Fetch the JS chunk (not the model) once the page is idle, so the chapter is quick to start.
  useEffect(() => {
    if (!enabled || !window.requestIdleCallback) return
    const id = requestIdleCallback(() => loadCanvas().catch(() => {}), { timeout: 4000 })
    return () => cancelIdleCallback(id)
  }, [enabled])

  const toggle = () => { const v = !on; setOn(v); writePref(v ? 'on' : 'off'); if (!v) setReady(false) }
  const onReady = useCallback(() => setReady(true), [])
  const onError = useCallback(() => { setFailed(true); setReady(false) }, [])

  const status = !webgl ? '3D needs WebGL — showing a still'
    : failed ? 'The 3D portrait could not load — showing a still'
    : !on ? '3D off — showing a still'
    : near && !ready ? 'Loading the 3D portrait…' : ''

  return (
    <section className="maker" id="maker" ref={section} aria-labelledby="maker-title">
      <div className={ready && enabled ? 'maker-stage is-live' : 'maker-stage'} aria-hidden="true">
        <img className="maker-poster" src="images/maker-poster.webp" srcSet="images/maker-poster-900.webp 900w, images/maker-poster.webp 1600w" sizes="100vw" alt="" width="1600" height="1000" loading="lazy" decoding="async" />
        {enabled && near && (
          <Boundary onError={onError}>
            <Suspense fallback={null}>
              <MakerCanvas phone={phone} active={visible} onReady={onReady} />
            </Suspense>
          </Boundary>
        )}
        <div className="maker-shade" />
      </div>

      <div className="maker-flow">
        <header className="maker-intro">
          <p className="kicker">03 — Fig. 02</p>
          <motion.h2 id="maker-title" className="maker-title" initial={reduced ? false : 'hidden'} whileInView="shown" viewport={{ once: true, amount: 0.5 }}>
            <span className="mask"><motion.span variants={{ hidden: { y: '105%' }, shown: { y: '0%' } }} transition={{ duration: reduced ? 0 : 1.2, ease }}>The <em>maker.</em></motion.span></span>
          </motion.h2>
          <motion.p className="maker-lede" initial={reduced ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.15, ease }}>{maker.intro}</motion.p>
          <p className="maker-hint">Background &amp; résumé below — Education, Think, Innovate, Fabricate, Say hi.</p>
        </header>
        <ol className="maker-nodes" aria-label="Background and résumé">
          {maker.nodes.map((n, i) => <Node key={n.kicker} node={n} index={i} onOpen={onOpen} />)}
        </ol>
      </div>

      <div className="maker-controls">
        <div className="maker-controls-inner">
          {webgl && (
            <button type="button" className="maker-toggle" aria-pressed={on} onClick={toggle}>
              <span className="maker-toggle-dot" aria-hidden="true" />3D {on ? 'on' : 'off'}
            </button>
          )}
          <p className="maker-status" role="status">{status}</p>
        </div>
      </div>
    </section>
  )
}
