import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { maker, projects } from '../data/content.js'
import { FOCUS_POINTS } from '../maker/focusPoints'
import SocialLinks from './SocialLinks.jsx'
import { ProjectLink } from './Work.jsx'

/*
 * Fig. 02 — The Maker. About, practice and résumé as one chapter around the 3D bust from the Aboutme site.
 * The page scrolls normally: the stage is only `position: sticky` behind the timeline cards, and the camera
 * follows the cards (src/maker/progress.ts). The WebGL chunk loads when the chapter is about a screen away
 * (or earlier, on idle) and renders only while the chapter is on screen. The 3D is always on: the starburst turns
 * slowly only while a load genuinely takes time, and stays (still, with a message) only without WebGL or after a failed load.
 */

const loadCanvas = () => import('../maker/MakerCanvas.tsx')
const MakerCanvas = lazy(loadCanvas)
const ease = [0.22, 1, 0.36, 1]
const LOADER_DELAY = 350 // ms of loading before the starburst shows, so a quick (cached) start never flashes it
let warm = false // the scene was ready once this page load: model cached, so a remount skips the loader

const hasWebGL = () => {
  try {
    const c = document.createElement('canvas')
    const gl = c.getContext('webgl2') ?? c.getContext('webgl')
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
    return !!gl
  } catch { return false }
}
// Phones (touch or ≤640px, Aboutme's breakpoint): the same scene, pulled back for full-width cards (see Scene.tsx).
const isPhone = () => window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 640

// Catches a failed chunk, WebGL context or model load; the starburst stops turning and the chapter still reads.
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
            <SocialLinks />
            <a href="#credentials">Credentials →</a>
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
  const [near, setNear] = useState(false) // within about a screen: start loading
  const [visible, setVisible] = useState(false) // on screen: render
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [slow, setSlow] = useState(false) // still loading after LOADER_DELAY: show the starburst
  const phone = useMemo(isPhone, [near]) // decided when the 3D mounts, not at page load
  const enabled = webgl && !failed

  // Aboutme's scroll transitions (App.tsx), same offsets: the intro blurs, fades and drifts up (title faster,
  // letter-spacing opening) from when its top reaches 60% of the viewport; the cue, the hero's bottom gradient and
  // the right-hand scrim follow page scroll; the frosted rail fades in as the cards arrive.
  const intro = useRef(null)
  const { scrollY } = useScroll()
  // Aboutme's ['start 0.6', 'start start'] offsets, but never already under way at scroll 0: this intro is taller,
  // so on short screens its top starts above the 60% line and the copy loaded blurred.
  const introProgress = useTransform(scrollY, y => {
    const el = intro.current
    if (!el) return 0
    const top = el.getBoundingClientRect().top + y
    const start = Math.max(0, top - window.innerHeight * 0.6)
    return Math.min(Math.max((y - start) / Math.max(1, top - start), 0), 1)
  })
  const introBlur = useTransform(introProgress, [0, 0.5], ['blur(0px)', 'blur(16px)'])
  const introOpacity = useTransform(introProgress, [0, 0.5], [1, 0])
  const titleY = useTransform(introProgress, [0, 1], [0, -96])
  const bodyY = useTransform(introProgress, [0, 1], [0, -52])
  const titleSpacing = useTransform(introProgress, [0, 1], ['0em', '0.42em'])
  const vh = window.innerHeight
  const scrimOpacity = useTransform(scrollY, [0, 520], [0, 0.4])
  const cueOpacity = useTransform(scrollY, [0, 160], [1, 0])
  const gradientOpacity = useTransform(scrollY, [0, 240], [1, 0])
  const railOpacity = useTransform(scrollY, [vh * 0.5, vh * 1.1], [0, 1])
  // Once the chapter's end passes the viewport bottom the sticky stage scrolls up with it; fade it out so its
  // bottom (the torso) never trails into the footer.
  const { scrollYProgress: endProgress } = useScroll({ target: section, offset: ['end end', 'end 0.6'] })
  const stageOpacity = useTransform(endProgress, [0, 1], [1, 0])

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

  useEffect(() => {
    if (!enabled || !near || ready || warm) return
    const id = setTimeout(() => setSlow(true), LOADER_DELAY)
    return () => clearTimeout(id)
  }, [enabled, near, ready])

  // 'maker-3d-visible' marks the first frame drawn after mount (shader compile included), for load measurements
  const onReady = useCallback(() => { warm = true; setReady(true); requestAnimationFrame(() => requestAnimationFrame(() => performance.mark('maker-3d-visible'))) }, [])
  const onError = useCallback(() => { setFailed(true); setReady(false) }, [])

  const status = !webgl ? 'The 3D portrait needs WebGL, which is off or unsupported in this browser'
    : failed ? 'The 3D portrait could not load. Reloading the page may help'
    : slow && !ready ? 'Loading the 3D portrait…' : ''

  return (
    <section className="maker" id="maker" ref={section} aria-labelledby="maker-title">
      <motion.div className={ready && enabled ? 'maker-stage is-live' : 'maker-stage'} style={{ opacity: stageOpacity }} aria-hidden="true">
        {/* the turning starburst shows over the sky only once a load is slow, and dissolves as the canvas fades in once the
            scene is ready; without 3D (no WebGL, a failed load) it stays, dimmed. */}
        {(slow || !enabled) && (
          <div className={enabled ? 'maker-loader' : 'maker-loader is-still'}>
            <span className="maker-loader-mark" />
          </div>
        )}
        {enabled && near && (
          <Boundary onError={onError}>
            <Suspense fallback={null}>
              <MakerCanvas phone={phone} active={visible} onReady={onReady} />
            </Suspense>
          </Boundary>
        )}
        <motion.div className="maker-scrim" style={{ opacity: scrimOpacity }} />
        <motion.div className="maker-rail" style={{ opacity: railOpacity }} />
        <motion.div className="maker-gradient" style={{ opacity: gradientOpacity }} />
      </motion.div>

      <div className="maker-flow">
        <header className="maker-intro">
          {/* the scroll-out lives on outer wrappers so it never fights the entrance animations inside */}
          <motion.div ref={intro} className="maker-copy" style={reduced ? { opacity: introOpacity } : { filter: introBlur, opacity: introOpacity }}>
            {/* Entrance on mount (this is the first screen): painted blurred from the first frame, settling to a faint haze (not fully crisp) by design.
                No clipping mask, which would hide the blur instead of showing it. */}
            <motion.h2 id="maker-title" className="maker-title" style={reduced ? undefined : { y: titleY, letterSpacing: titleSpacing }}>
              <motion.span className="maker-title-text" initial={reduced ? false : { opacity: 0.35, y: 22, filter: 'blur(18px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(1.6px)' }} transition={{ duration: 1.8, delay: 0.25, ease }}>The <em>maker.</em></motion.span>
            </motion.h2>
            <motion.div style={reduced ? undefined : { y: bodyY }}>
              <motion.p className="maker-lede" initial={reduced ? false : { opacity: 0.25, y: 16, filter: 'blur(12px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0.95px)' }} transition={{ duration: 1.6, delay: 0.55, ease }}>{maker.intro}</motion.p>
            </motion.div>
          </motion.div>
          <motion.div className="maker-cue" style={{ opacity: cueOpacity }} aria-hidden="true">
            <span className="maker-cue-label">Scroll</span>
            <span className="maker-cue-track"><span className="maker-cue-dot" /></span>
          </motion.div>
        </header>
        <ol className="maker-nodes" aria-label="Background and résumé">
          {maker.nodes.map((n, i) => <Node key={n.kicker} node={n} index={i} onOpen={onOpen} />)}
        </ol>
      </div>

      <div className="maker-controls">
        <div className="maker-controls-inner">
          <p className="maker-status" role="status">{status}</p>
        </div>
      </div>
    </section>
  )
}
