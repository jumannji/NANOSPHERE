'use client'

import { useEffect, useState } from 'react'
import Nav from './Nav'

// Hides the nav (and its sphere) on scroll-down, brings it back on
// scroll-up — keeps it out of the way while reading, without hiding it
// the moment the page loads or during tiny scroll jitter.
export default function ArticleFoldingNav() {
  const [folded, setFolded] = useState(false)

  useEffect(() => {
    // This site scrolls `body` itself (html/body are pinned to 100dvh
    // with overflow-y:auto), not the window — `window.scrollY` never
    // changes here, so the listener has to live on body.
    const scroller = document.body
    let lastY = scroller.scrollTop
    let ticking = false

    function update() {
      const y = scroller.scrollTop
      const delta = y - lastY
      if (y > 80 && delta > 4) setFolded(true)
      else if (delta < -4 || y <= 80) setFolded(false)
      lastY = y
      ticking = false
    }

    function onScroll() {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    scroller.addEventListener('scroll', onScroll, { passive: true })
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [])

  return <Nav showSphere folded={folded} />
}
