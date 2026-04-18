'use client'

import Link from 'next/link'
import NavSphere from './NavSphere'

export default function Nav() {
  return (
    <nav>
      <div className="nav-links">
        <Link href="/articles">Articles</Link>
        <Link href="/nanopill" className="pill">
          <span className="pill-label">Nanopill</span>
        </Link>
        <NavSphere />
        <Link href="/merch">Merch</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  )
}
