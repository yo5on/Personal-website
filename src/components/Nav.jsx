import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { BrandMoth } from './Icons.jsx'
import SocialLinks from './SocialLinks.jsx'

const links = [['Work', '#work'], ['Maker', '#maker'], ['Credentials', '#credentials'], ['Contact', '#contact']]
// Page sections in order, and the nav link each one makes current.
const SECTIONS = [['top', null], ['work', '#work'], ['maker', '#maker'], ['credentials', '#credentials'], ['contact', '#contact']]
const ease = [0.22, 1, 0.36, 1]
// Everything outside the header and the menu sheet is taken out of reach while the sheet is open.
const BACKGROUND = '.skip, main, footer, .nav .brand, .nav-links, .nav-aside'

export default function Nav() {
  const reduced = useReducedMotion()
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState(null) // nothing is current until a section is actually in view
  const [open, setOpen] = useState(false)
  const menuButton = useRef(null)
  const sheet = useRef(null)
  // The current section is the last one whose top has risen above a line 30% down the viewport, so a
  // section becomes current once it fills most of the screen, not when its top edge first appears.
  // The hero clears the underline; the very bottom of the page is Contact, which is too short to reach the
  // line on tall screens.
  const updateActive = () => {
    const line = window.innerHeight * 0.3
    let current = null
    for (const [id, href] of SECTIONS) {
      const el = document.getElementById(id)
      if (el && el.getBoundingClientRect().top <= line) current = href
    }
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) current = '#contact'
    setActive(current)
  }
  useMotionValueEvent(scrollY, 'change', v => { setScrolled(v > 60); updateActive() })

  useEffect(() => {
    updateActive()
    window.addEventListener('resize', updateActive)
    return () => window.removeEventListener('resize', updateActive)
  }, [])

  useEffect(() => {
    if (!open) return
    const background = [...document.querySelectorAll(BACKGROUND)]
    background.forEach(el => { el.inert = true })
    document.body.style.overflow = 'hidden'
    // Focus the first link once the sheet has mounted.
    const raf = requestAnimationFrame(() => sheet.current?.querySelector('a')?.focus())
    const onKey = e => {
      if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
      if (e.key !== 'Tab' || !sheet.current) return
      // Cycle between the Menu/Close button and the links in the sheet.
      const items = [menuButton.current, ...sheet.current.querySelectorAll('a[href]')]
      const first = items[0], last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    // Back/Forward (including Android's Back gesture) closes the menu instead of leaving it open over
    // another scroll position or a project view; a menu link's own hash change closes it the same way.
    const onHistory = () => setOpen(false)
    // Widening past the phone breakpoint (window resize, or a phone turned to landscape) hides the Menu/Close
    // button; close the sheet then too, so it cannot stay over the desktop layout with the page still locked.
    const desktop = window.matchMedia('(min-width: 761px)')
    const onLayout = e => { if (e.matches) setOpen(false) }
    window.addEventListener('keydown', onKey)
    window.addEventListener('popstate', onHistory)
    window.addEventListener('hashchange', onHistory)
    desktop.addEventListener('change', onLayout)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('popstate', onHistory)
      window.removeEventListener('hashchange', onHistory)
      desktop.removeEventListener('change', onLayout)
      // If Forward/Back has just opened a project view, it now owns the page lock (it may have applied it
      // before this cleanup runs): release only the nav items, which it does not manage, and leave focus to it.
      const projectView = document.querySelector('.case[role="dialog"]')
      background.forEach(el => { if (!projectView || el.closest('header.nav')) el.inert = false })
      if (!projectView) {
        document.body.style.overflow = ''
        menuButton.current?.focus({ preventScroll: true })
      }
    }
  }, [open])

  return <>
    <motion.header className={scrolled ? 'nav is-scrolled' : 'nav'} initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.1, ease }}>
      <a className="brand" href="#top" aria-label="YOSON — back to top"><BrandMoth /><span className="brand-word">YOSON</span></a>
      <nav className="nav-links" aria-label="Primary">
        {links.map(([label, href]) => (
          <a key={href} href={href} aria-current={active === href ? 'location' : undefined}>
            {label}
            {active === href && <motion.span className="nav-underline" layoutId="nav-underline" transition={{ type: 'spring', stiffness: 320, damping: 32 }} />}
          </a>
        ))}
      </nav>
      <div className="nav-aside">
        <span className="nav-divider" aria-hidden="true" />
        <SocialLinks />
      </div>
      <button ref={menuButton} className="nav-menu" aria-expanded={open} aria-controls="menu-sheet" onClick={() => setOpen(v => !v)}>{open ? 'Close' : 'Menu'}</button>
    </motion.header>

    {/* The Menu button's aria-controls target: always in the DOM (empty while closed), the sheet mounts inside it. */}
    <div id="menu-sheet">
    <AnimatePresence>
      {open && (
        <motion.div ref={sheet} className="menu-sheet" role="dialog" aria-modal="true" aria-label="Site menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : 0.5, ease }}>
          <nav aria-label="Mobile">
            {links.map(([label, href], i) => (
              <motion.a key={href} href={href} onClick={() => setOpen(false)} initial={reduced ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : 0.1 + i * 0.07, ease }}>{label}</motion.a>
            ))}
          </nav>
          <div className="menu-foot"><SocialLinks /></div>
        </motion.div>
      )}
    </AnimatePresence>
    </div>
  </>
}
