'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import NavSphere from './NavSphere'
import TransitionLink from './TransitionLink'
import { navigateTo } from '@/lib/navigate'

// All nav links except Articles (we're already on that page)
const LINKS = [
  { href: '/nanobazaar', label: 'NanoBazaar', isPill: true  },
  { href: '/nanoweb',    label: 'NanoWeb',    isPill: false },
  { href: '/about',      label: 'About',      isPill: false },
]

export default function ArticlesNav() {
  const router  = useRouter()
  const [open,   setOpen  ] = useState(false)
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)

  // Fold nav on scroll-down, reveal on scroll-up
  useEffect(() => {
    lastY.current = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > lastY.current && y > 60) {
        setHidden(true)
        setOpen(false)   // collapse menu when nav hides
      } else if (y < lastY.current) {
        setHidden(false)
      }
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSphereClick() {
    if (!open) {
      setOpen(true)
    } else {
      // Second click navigates home
      navigateTo('/', h => router.push(h))
    }
  }

  return (
    <nav className={`articles-page-nav${hidden ? ' articles-page-nav--hidden' : ''}`}>
      <span className="articles-page-nav-title">Articles</span>

      <div className="articles-nav-right">
        {/* Links slide out from behind the sphere to the left */}
        <div className="nav-links articles-nav-links">
          {LINKS.map((link, i) => {
            // Rightmost link (closest to sphere) has delay 0, leftmost has highest delay
            const delay = (LINKS.length - 1 - i) * 72
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
                    ? `opacity 240ms ease ${delay}ms, transform 340ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`
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
    </nav>
  )
}
