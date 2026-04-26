'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import NavSphere from './NavSphere'

interface NavProps { showSphere?: boolean }

export default function Nav({ showSphere = false }: NavProps) {
  const router = useRouter()
  const [revealed, setRevealed] = useState(false)

  function handleSphereClick() {
    if (!revealed) {
      setRevealed(true)
    } else {
      router.push('/')
    }
  }

  // Homepage: plain flex row, no sphere
  if (!showSphere) {
    return (
      <nav>
        <div className="nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/nanobazaar" className="pill">
            <span className="pill-label">NanoBazaar</span>
          </Link>
          <Link href="/nanoweb">NanoWeb</Link>
          <Link href="/about">About</Link>
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
          <Link href="/articles" style={leftLink(80)}>Articles</Link>
          <Link href="/nanobazaar" style={leftLink(20)} className="pill">
            <span className="pill-label">NanoBazaar</span>
          </Link>
        </div>

        <NavSphere onClick={handleSphereClick} />

        <div className="nav-group-right">
          <Link href="/nanoweb" style={rightLink(20)}>NanoWeb</Link>
          <Link href="/about"   style={rightLink(80)}>About</Link>
        </div>
      </div>
    </nav>
  )
}
