'use client'

import Link from 'next/link'
import NavSphere from './NavSphere'

interface NavProps {
  showSphere?: boolean
}

export default function Nav({ showSphere = false }: NavProps) {
  return (
    <nav>
      <div className="nav-links">
        <Link href="/articles">Articles</Link>
        <Link href="/nanopill" className="pill">
          <span className="pill-label">Nanopill</span>
        </Link>
        {showSphere && <NavSphere />}
        <Link href="/products">Products</Link>
        <Link href="/about">About</Link>
      </div>
    </nav>
  )
}
