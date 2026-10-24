import { useRef, useState } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { email } from '../data/content.js'
import { ArrowUp, ArrowUpRight, BrandMoth } from './Icons.jsx'
import SocialLinks from './SocialLinks.jsx'
import InkWord from './InkWord.jsx'

const ease = [0.22, 1, 0.36, 1]

function useReveal() {
  const reduced = useReducedMotion()
  return (delay = 0) => ({
    initial: reduced ? false : { opacity: 0, y: 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.25 },
    transition: { duration: reduced ? 0 : 1.1, delay: reduced ? 0 : delay, ease },
  })
}

// About and Practice now live in the Maker chapter (Maker.jsx).
// Certificates live in their own module (an animated exhibition); re-exported here with the other sections.
export { Certificates } from './Certificates.jsx'

export function Contact() {
  const r = useReveal()
  const reduced = useReducedMotion()
  const title = useRef(null)
  // "something." writes itself once the headline is properly in view (immediately under reduced motion).
  const inView = useInView(title, { once: true, amount: 0.6 })
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800) }
    catch { window.location.href = `mailto:${email}` }
  }
  return (
    <section className="contact" id="contact" aria-labelledby="contact-title">
      <span className="kicker">05 — Contact</span>
      <motion.h2 ref={title} id="contact-title" className="contact-title" {...r()}>Let’s make <em><InkWord text="something." pending={!inView && !reduced} delay={0.45} duration={1.1} /></em></motion.h2>
      <motion.a className="contact-mail" href={`mailto:${email}`} {...r(0.15)}>{email}<ArrowUpRight className="icon icon-mail" /></motion.a>
      <motion.div className="contact-links" {...r(0.25)}>
        <button onClick={copy} aria-live="polite">{copied ? 'Copied' : 'Copy email'}</button>
        <SocialLinks />
      </motion.div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <a className="brand" href="#top"><BrandMoth /><span className="brand-word">YOSON</span></a>
      <span>Think · Innovate · Fabricate</span>
      <SocialLinks className="footer-social" />
      <span className="colophon">Set in Instrument Serif, Instrument Sans &amp; IBM Plex Mono · 3D bust adapted from sen-3d-resume (MIT) · 2026</span>
      <a className="back-top" href="#top">Back to top <ArrowUp /></a>
    </footer>
  )
}
