import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { AnimatePresence, MotionConfig } from 'motion/react'
import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'
import Work, { plateRect } from './components/Work.jsx'
import CaseView from './components/CaseView.jsx'
import Maker from './components/Maker.jsx'
import { Certificates, Contact, Footer } from './components/Sections.jsx'
import { projects } from './data/content.js'
import './styles.css'

// Project views are addressable as #work/<id>, using the browser's own history (no router).
const CASE_HASH = /^#work\/([\w-]+)$/
const projectFromHash = () => {
  const m = window.location.hash.match(CASE_HASH)
  return m ? projects.find(p => p.id === m[1]) ?? null : null
}

function App() {
  const [active, setActive] = useState(projectFromHash)
  // Where the project view opens from and closes back to: a card figure's box, or null for
  // the default full-width reveal (shared links, Next study, a card that is off-screen).
  const [origin, setOrigin] = useState(null)
  const [exitTo, setExitTo] = useState(null)
  const activeRef = useRef(active)
  activeRef.current = active
  // true when the open project view added its own history entry, so closing can step back over it
  const pushed = useRef(false)

  useEffect(() => {
    const sync = () => {
      const p = projectFromHash()
      // An unknown project id (on load or in-page) falls back to the Work section instead of an empty dialog.
      if (!p && /^#work\//.test(window.location.hash)) history.replaceState(null, '', '#work')
      if (!p) pushed.current = false
      if (!p && activeRef.current) setExitTo(plateRect(activeRef.current.id))
      if (p && p.id !== activeRef.current?.id) setOrigin(null)
      setActive(p)
    }
    sync()
    window.addEventListener('popstate', sync)
    window.addEventListener('hashchange', sync)
    return () => { window.removeEventListener('popstate', sync); window.removeEventListener('hashchange', sync) }
  }, [])

  // A section link opened from outside (#maker, #credentials…): the browser looked for the target before React
  // rendered it, so jump there once the page exists.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && !CASE_HASH.test(window.location.hash)) document.getElementById(id)?.scrollIntoView({ behavior: 'instant' })
  }, [])

  const open = useCallback((p, rect = null) => {
    history.pushState(null, '', `#work/${p.id}`)
    pushed.current = true
    setOrigin(rect)
    activeRef.current = p
    setActive(p)
  }, [])
  // "Next study" replaces the entry, so Back still returns to the page rather than through every study.
  const navigate = useCallback(p => {
    history.replaceState(null, '', `#work/${p.id}`)
    activeRef.current = p
    setActive(p)
  }, [])
  const close = useCallback(() => {
    if (pushed.current) { pushed.current = false; history.back() } // popstate clears `active`
    else { history.replaceState(null, '', '#work'); setExitTo(plateRect(activeRef.current?.id)); setActive(null) } // opened from a shared link
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip" href="#work">Skip to work</a>
      <Nav />
      <main>
        <Hero />
        <Work onOpen={open} />
        <Maker onOpen={open} />
        <Certificates onOpen={open} />
        <Contact />
      </main>
      <Footer />
      <AnimatePresence custom={exitTo}>{active && <CaseView key="case" project={active} origin={origin} onClose={close} onNavigate={navigate} />}</AnimatePresence>
    </MotionConfig>
  )
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)
