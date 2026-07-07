'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import NavSphere from './NavSphere'
import TransitionLink from './TransitionLink'
import { navigateTo } from '@/lib/navigate'

interface NavProps { showSphere?: boolean }

export default function Nav({ showSphere = false }: NavProps) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(false)

  function handleSphereClick() {
    if (!revealed) {
      setRevealed(true)
    } else {
      navigateTo('/', h => router.push(h))
    }
  }

  // Homepage: plain flex row, no sphere
  if (!showSphere) {
    return (
      <nav>
        <div className="nav-links">
          <TransitionLink href="/articles">Articles</TransitionLink>
          <TransitionLink href="/nanobazaar" className="pill">
            <span className="pill-label">NanoBazaar</span>
          </TransitionLink>
          <TransitionLink href="/archives">Archives</TransitionLink>
          <TransitionLink href="/about">About</TransitionLink>
        </div>
      </nav>
    )
  }

  // Inner pages: 3-column grid — left-group | sphere | right-group
  // The "auto" sphere column is always at the structural center;
  // both 1fr columns are equal width so the sphere never drifts.
  const ease = 'cubic-bezier(0.22,1,0.36,1)'

  function leftLink(delay: number): React.CSSProperties {
    return {
      opacity:       revealed ? 1 : 0,
      // start translated rightward (behind the sphere), slide to natural position
      transform:     revealed ? 'translateX(0)' : 'translateX(52px)',
      transition:    `opacity 420ms ease ${delay}ms, transform 480ms ${ease} ${delay}ms`,
      pointerEvents: revealed ? 'auto' : 'none',
      display:       'inline-flex',
    }
  }

  function rightLink(delay: number): React.CSSProperties {
    return {
      opacity:       revealed ? 1 : 0,
      // start translated leftward (behind the sphere), slide to natural position
      transform:     revealed ? 'translateX(0)' : 'translateX(-52px)',
      transition:    `opacity 420ms ease ${delay}ms, transform 480ms ${ease} ${delay}ms`,
      pointerEvents: revealed ? 'auto' : 'none',
      display:       'inline-flex',
    }
  }

  return (
    <nav>
      <div className="nav-links nav-links--sphere">
        <div className="nav-group-left">
          <TransitionLink href="/articles" style={leftLink(80)}>Articles</TransitionLink>
          <TransitionLink href="/nanobazaar" style={leftLink(20)} className="pill">
            <span className="pill-label">NanoBazaar</span>
          </TransitionLink>
        </div>

        <NavSphere onClick={handleSphereClick} />

        <div className="nav-group-right">
          <TransitionLink href="/archives" style={rightLink(20)}>Archives</TransitionLink>
          <TransitionLink href="/about"   style={rightLink(80)}>About</TransitionLink>
        </div>
      </div>
    </nav>
  )
}
