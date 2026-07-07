'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import NavSphere from './NavSphere'
import TransitionLink from './TransitionLink'
import { navigateTo } from '@/lib/navigate'

const EASE = 'cubic-bezier(0.22,1,0.36,1)'

// Desktop: links slide from behind the sphere (right→left), rightmost first
const DESKTOP_LINKS = [
  { href: '/nanobazaar', label: 'NanoBazaar', isPill: true  },
  { href: '/archives',   label: 'Archives',   isPill: false },
  { href: '/about',      label: 'About',      isPill: false },
]

export default function ArticlesNav() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  function handleSphereClick() {
    if (!open) setOpen(true)
    else navigateTo('/', h => router.push(h))
  }

  // Mobile sphere-center link styles (matches Nav.tsx behavior)
  function leftStyle(delay: number): React.CSSProperties {
    return {
      opacity: open ? 1 : 0,
      transform: open ? 'translateX(0)' : 'translateX(52px)',
      transition: `opacity 420ms ease ${delay}ms, transform 480ms ${EASE} ${delay}ms`,
      pointerEvents: open ? 'auto' : 'none',
      display: 'inline-flex',
    }
  }
  function rightStyle(delay: number): React.CSSProperties {
    return {
      opacity: open ? 1 : 0,
      transform: open ? 'translateX(0)' : 'translateX(-52px)',
      transition: `opacity 420ms ease ${delay}ms, transform 480ms ${EASE} ${delay}ms`,
      pointerEvents: open ? 'auto' : 'none',
      display: 'inline-flex',
    }
  }

  return (
    <nav className="articles-page-nav">

      {/* ── Desktop layout (≥769px) ────────────────────────────────────────── */}
      <div className="articles-desktop-nav">
        <span className="articles-page-nav-title">Articles</span>
        <div className="articles-nav-right">
          <div className="nav-links articles-nav-links">
            {DESKTOP_LINKS.map((link, i, arr) => {
              const delay = (arr.length - 1 - i) * 72
              return (
                <TransitionLink
                  key={link.href}
                  href={link.href}
                  className={link.isPill ? 'pill' : undefined}
                  style={{
                    opacity:       open ? 1 : 0,
                    transform:     open ? 'none' : 'translateX(10px)',
                    pointerEvents: open ? 'auto' : 'none',
                    transition: open
                      ? `opacity 240ms ease ${delay}ms, transform 340ms ${EASE} ${delay}ms`
                      : 'opacity 140ms ease, transform 140ms ease',
                    display: 'inline-flex',
                  }}
                >
                  {link.isPill ? <span className="pill-label">{link.label}</span> : link.label}
                </TransitionLink>
              )
            })}
          </div>
          <NavSphere onClick={handleSphereClick} />
        </div>
      </div>

      {/* ── Mobile layout (<769px) — original sphere-center behavior ──────── */}
      <div className="nav-links nav-links--sphere articles-mobile-nav">
        <div className="nav-group-left">
          <TransitionLink href="/articles" style={leftStyle(80)}>Articles</TransitionLink>
          <TransitionLink href="/nanobazaar" style={leftStyle(20)} className="pill">
            <span className="pill-label">NanoBazaar</span>
          </TransitionLink>
        </div>
        <NavSphere onClick={handleSphereClick} />
        <div className="nav-group-right">
          <TransitionLink href="/archives" style={rightStyle(20)}>Archives</TransitionLink>
          <TransitionLink href="/about"   style={rightStyle(80)}>About</TransitionLink>
        </div>
      </div>

    </nav>
  )
}
