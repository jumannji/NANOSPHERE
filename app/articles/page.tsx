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

      <main className="articles-main">
        <h1
          style={{
            fontFamily: 'var(--font-press-start), monospace',
            fontWeight: 400,
            fontSize: 'clamp(18px, 4vw, 56px)',
            letterSpacing: '0.04em',
            color: 'var(--logo-ink)',
            userSelect: 'none',
            margin: 0,
            lineHeight: 1,
            textAlign: 'center',
          }}
        >
          Articles
        </h1>

        <div className="articles-grid">
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
