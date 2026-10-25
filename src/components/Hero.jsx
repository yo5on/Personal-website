import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { useEffect, useRef } from 'react'
import { RibbonLayer } from './Ribbons.jsx'
import { ArrowRight } from './Icons.jsx'
import { projects } from '../data/content.js'

const ease = [0.22, 1, 0.36, 1]

// Responsive moth: phones and 1x screens get the 900px file, larger/denser screens the 1536px one.
// `sizes` mirrors the CSS: the moth is 75% of the art box (min(78vw, 132svh) desktop,
// min(86vw, 118svh) tablet, 122vw phone).
const MOTH_SRCSET = 'images/moth-900.webp 900w, images/moth.webp 1536w'
const MOTH_SIZES = '(max-width: 760px) 92vw, (max-width: 1080px) 65vw, 59vw'

// The three verbs, one per line, in crimson capitals.
const VERBS = ['Think.', 'Innovate.', 'Fabricate.']

export default function Hero() {
  const reduced = useReducedMotion()
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const artY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -70])
  const copyY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : -30])
  // The verbs' exit, from the Aboutme site's About block: they blur and fade as the letters spread apart.
  // Reduced motion keeps only the fade.
  const blur = useTransform(scrollYProgress, [0.08, 0.55], ['blur(0px)', 'blur(14px)'])
  const fade = useTransform(scrollYProgress, [0.08, 0.55], [1, 0])
  const spread = useTransform(scrollYProgress, [0, 0.6], ['0em', '0.3em'])

  // The moth's float and the ribbons' drift loop forever; pause them while the hero is out of view.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => el.classList.toggle('is-offscreen', !e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // One entrance for the copy: a short rise and fade, staggered eyebrow → headline → tagline → links,
  // so everything is readable within about 1.3 s. The headline and its supporting lines also resolve from a
  // slight blur. Mount-only (initial → animate), so re-renders never replay it; reduced motion shows the text at once.
  const enter = (delay, y = 14, blur = 0) => ({
    initial: reduced ? false : { opacity: 0, y, ...(blur && { filter: `blur(${blur}px)` }) },
    animate: { opacity: 1, y: 0, ...(blur && { filter: 'blur(0px)' }) },
    transition: { duration: reduced ? 0 : blur ? 1.1 : 0.9, delay: reduced ? 0 : delay, ease },
  })

  return (
    <section className="hero" id="origin" ref={ref} aria-labelledby="hero-title">
      <div className="hero-grain" aria-hidden="true" />

      <motion.div className="art" style={{ y: artY }} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 1.4, delay: reduced ? 0 : 0.1, ease }}>
        {/* The moth's soft shadow sits beneath the back ribbons, so ribbons that pass
            behind the moth are never darkened and every crossing stays clean. */}
        <picture className="moth moth-shadow" aria-hidden="true">
          <source srcSet={MOTH_SRCSET} sizes={MOTH_SIZES} type="image/webp" />
          <img src="images/moth.png" alt="" width="1536" height="977" decoding="async" />
        </picture>
        <RibbonLayer layer="back" className="ribbons ribbons-back" />
        <picture className="moth">
          <source srcSet={MOTH_SRCSET} sizes={MOTH_SIZES} type="image/webp" />
          <img src="images/moth.png" alt="A pale grey moth with outstretched forewings and long hanging hindwings, drawn in fine engraved detail" width="1536" height="977" fetchPriority="high" decoding="async" />
        </picture>
        <RibbonLayer layer="fore" className="ribbons ribbons-front" />
      </motion.div>

      <motion.div className="hero-copy" style={{ y: copyY }}>
        <motion.p className="hero-eyebrow" {...enter(0.1, 8)}>AI / ML ·<br />Software ·<br />Robotics</motion.p>
        <motion.h1 className="hero-title" id="hero-title" style={reduced ? { opacity: fade } : { filter: blur, opacity: fade, letterSpacing: spread }}>
          {VERBS.map((word, i) => (
            <span className="line" key={word}>
              <motion.span {...enter(0.18 + i * 0.1, '0.14em', 10)}>{word}</motion.span>{' '}
            </span>
          ))}
        </motion.h1>
        {/* Phones only: the specimen label beneath the moth (the desktop label sits in the margin). */}
        <motion.p className="hero-specimen" {...enter(0.5, 8)}>Fig. 01 — Digital specimen</motion.p>
        <motion.p className="hero-motto" {...enter(0.5, 10, 6)}>Small, sharp tools <em>over big, vague ideas.</em></motion.p>
        <motion.p className="hero-tagline" {...enter(0.6, 10, 6)}>Yoson — a CSE student specializing in AI&nbsp;/&nbsp;ML, <br />building explainable software, web apps <br />and ESP32&nbsp;robots.</motion.p>
        <motion.div className="hero-links" {...enter(0.7)}>
          <a className="hero-cta" href="#work">Explore the work <ArrowRight /></a>
          <a className="hero-cta is-quiet" href="#maker">Meet the maker <ArrowRight /></a>
        </motion.div>
      </motion.div>

      <motion.div className="hero-meta" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduced ? 0 : 1, delay: reduced ? 0 : 0.7 }}>
        <p className="meta-fig">Fig. 01<br />Digital<br />specimen<br />— 2026</p>
        <p className="meta-side">Selected work 01 — {String(projects.length).padStart(2, '0')}</p>
        <p className="meta-note">Portfolio of<br />Yoson, CSE<br />AI / ML<span className="meta-rule" /></p>
        {/* Visual cue only: "Explore the work" is the keyboard/screen-reader route to the same place. */}
        <a className="meta-scroll" href="#work" tabIndex={-1} aria-hidden="true"><span className="scroll-mark" />Explore the work</a>
      </motion.div>
    </section>
  )
}
