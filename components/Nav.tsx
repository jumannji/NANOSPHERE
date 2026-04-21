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

  if (!showSphere) {
    return (
      <nav>
        <div className="nav-links">
          <Link href="/articles">Articles</Link>
          <Link href="/nanopill" className="pill">
            <span className="pill-label">Nanopill</span>
          </Link>
          <Link href="/products">Products</Link>
          <Link href="/about">About</Link>
        </div>
      </nav>
    )
  }

  // Inner pages: links slide out from behind the sphere on first click
  const ease = 'cubic-bezier(0.22,1,0.36,1)'

  function leftLink(delay: number): React.CSSProperties {
    return {
      opacity:        revealed ? 1 : 0,
      transform:      revealed ? 'translateX(0)' : 'translateX(52px)',
      transition:     `opacity 420ms ease ${delay}ms, transform 480ms ${ease} ${delay}ms`,
      pointerEvents:  revealed ? 'auto' : 'none',
      display:        'inline-flex',
    }
  }

  function rightLink(delay: number): React.CSSProperties {
    return {
      opacity:        revealed ? 1 : 0,
      transform:      revealed ? 'translateX(0)' : 'translateX(-52px)',
      transition:     `opacity 420ms ease ${delay}ms, transform 480ms ${ease} ${delay}ms`,
      pointerEvents:  revealed ? 'auto' : 'none',
      display:        'inline-flex',
    }
  }

  return (
    <nav>
      <div className="nav-links">
        <Link href="/articles"  style={leftLink(80)}>Articles</Link>
        <Link href="/nanopill"  style={leftLink(20)}  className="pill">
          <span className="pill-label">Nanopill</span>
        </Link>
        <NavSphere onClick={handleSphereClick} />
        <Link href="/products"  style={rightLink(20)}>Products</Link>
        <Link href="/about"     style={rightLink(80)}>About</Link>
      </div>
    </nav>
  )
}
