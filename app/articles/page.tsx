import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import ArticleSphere from '@/components/ArticleSphere'
import { ARTICLES } from '@/lib/articles'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }

export default function ArticlesPage() {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />

      <main
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          paddingTop: 96,
          paddingBottom: 72,
          gap: 72,
        }}
      >
        {/* Page title — same style as homepage logo */}
        <h1
          style={{
            fontFamily: 'var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(64px, 9vw, 140px)',
            letterSpacing: '0.04em',
            color: 'var(--logo-ink)',
            userSelect: 'none',
            margin: 0,
            lineHeight: 1,
          }}
        >
          Articles
        </h1>

        {/* 2×2 sphere grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '64px 96px',
            justifyItems: 'center',
          }}
        >
          {ARTICLES.map(article => (
            <ArticleSphere
              key={article.slug}
              title={article.title}
              href={`/articles/${article.slug}`}
            />
          ))}
        </div>
      </main>
    </>
  )
}
