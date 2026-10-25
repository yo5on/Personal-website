import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Work from './components/Work.jsx'
import CaseView from './components/CaseView.jsx'
import Maker from './components/Maker.jsx'
import { Certificates, Contact, Footer } from './components/Sections.jsx'
import { projects } from './data/content.js'
import { pageFromHash } from './route.js'
import './styles.css'

// Project views are addressable as #work/<id>, using the browser's own history (no router).
const CASE_HASH = /^#work\/([\w-]+)$/
const projectFromHash = () => {
  const m = window.location.hash.match(CASE_HASH)
  return m ? projects.find(p => p.id === m[1]) ?? null : null
}

const TITLES = { origin: 'Think. Innovate. Fabricate.', work: 'Work', maker: 'The maker', credentials: 'Credentials', contact: 'Contact' }

function App() {
  const [page, setPage] = useState(() => pageFromHash(window.location.hash))
  const [active, setActive] = useState(projectFromHash)
  const activeRef = useRef(active)
  activeRef.current = active
  // true when the open project view added its own history entry, so closing can step back over it
  const pushed = useRef(false)
  // true from Close until the next open: a second Close/Escape before popstate lands would otherwise rewrite the hash
  const closing = useRef(false)

  useEffect(() => {
    const sync = () => {
      const p = projectFromHash()
      if (p) closing.current = false
      // An unknown project id (on load or in-page) falls back to the Work section instead of an empty dialog.
      if (!p && /^#work\//.test(window.location.hash)) history.replaceState(null, '', '#work')
      if (!p) pushed.current = false
      // A project view keeps the page it was opened over (Maker, Credentials…); only real page hashes switch pages.
      if (!p) setPage(pageFromHash(window.location.hash))
      setActive(p)
    }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync) }
  }, [])

  // A new page starts at its top, with focus moved to it so screen readers announce the change (not on first load).
  const main = useRef(null)
  const firstPage = useRef(true)
  useEffect(() => {
    document.title = `YOSON — ${TITLES[page]}`
    window.scrollTo({ top: 0, behavior: 'instant' })
    if (firstPage.current) firstPage.current = false
    else main.current?.focus({ preventScroll: true })
  }, [page])

  const open = useCallback(p => {
    history.pushState(null, '', `#work/${p.id}`)
    pushed.current = true
    closing.current = false
    activeRef.current = p
    setActive(p)
  }, [])
  // "Next study" replaces the entry, so Back still returns to the page rather than through every study.
  const navigate = useCallback(p => {
    if (closing.current) return
    history.replaceState(null, '', `#work/${p.id}`)
    activeRef.current = p
    setActive(p)
  }, [])
  const close = useCallback(() => {
    if (closing.current || !activeRef.current) return
    closing.current = true
    if (pushed.current) { pushed.current = false; history.back() } // popstate clears `active`
    else { history.replaceState(null, '', '#work'); setActive(null) } // opened from a shared link
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      {/* Same-hash links: they move focus/scroll to the page's own section without changing the route. */}
      <a className="skip" href={`#${page}`}>Skip to content</a>
      <Nav page={page} />
      {/* One page at a time, so the 3D scene only exists on Maker; a short fade in, no exit wait. */}
      <motion.main key={page} ref={main} tabIndex={-1} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.35 }}>
        {/* Origin is the landing page: the hero alone; the projects are their own page */}
        {page === 'origin' && <Hero />}
        {page === 'work' && <Work onOpen={open} />}
        {page === 'maker' && <Maker onOpen={open} caseOpen={!!active} />}
        {page === 'credentials' && <Certificates onOpen={open} />}
        {page === 'contact' && <Contact />}
      </motion.main>
      {/* Maker ends on its bottom-anchored bust, as in Aboutme: no footer after it */}
      {page !== 'maker' && <Footer page={page} />}
      <AnimatePresence>{active && <CaseView key="case" project={active} onClose={close} onNavigate={navigate} />}</AnimatePresence>
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
