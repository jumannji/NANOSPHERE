'use client'

import Link from 'next/link'

export default function Nav() {
  return (
    <nav>
      <div className="nav-links">
        <Link href="/articles">Articles</Link>
        <Link href="/nanopill" className="pill">
          <span className="pill-label">Nanopill</span>
        </Link>
        <Link href="/merch">Merch</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  )
}
