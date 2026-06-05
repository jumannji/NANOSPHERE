'use client'

import { useRouter } from 'next/navigation'
import NavSphere from './NavSphere'
import TransitionLink from './TransitionLink'
import { navigateTo } from '@/lib/navigate'

export default function ArticlesNav() {
  const router = useRouter()

  return (
    <nav className="articles-page-nav">
      {/* Page identity — Press Start 2P, left-anchored */}
      <span className="articles-page-nav-title">Articles</span>

      {/* Standard nav links — always visible, no sphere toggle */}
      <div className="nav-links articles-page-nav-links">
        <TransitionLink href="/articles">Articles</TransitionLink>
        <TransitionLink href="/nanobazaar" className="pill">
          <span className="pill-label">NanoBazaar</span>
        </TransitionLink>
        <TransitionLink href="/nanoweb">NanoWeb</TransitionLink>
        <TransitionLink href="/about">About</TransitionLink>
      </div>

      {/* Sphere at far right — direct home link, no toggle */}
      <div className="articles-page-nav-sphere">
        <NavSphere onClick={() => navigateTo('/', h => router.push(h))} />
      </div>
    </nav>
  )
}
