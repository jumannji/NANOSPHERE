'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ARTICLES, getArticlesByVolume, toRoman } from '@/lib/articles'
import { navigateTo } from '@/lib/navigate'
import type { Article } from '@/lib/articles'

function MagCard({ article, onSelect }: { article: Article; onSelect: () => void }) {
  return (
    <button className="mag-card" onClick={onSelect} aria-label={`Open ${article.title}`}>
      <div className="mag-cover">
        <span className="mag-cover-num">
          Vol.&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;{article.articleInVolume}
        </span>
        <h3 className="mag-cover-title">{article.title}</h3>
      </div>
    </button>
  )
}

function MagOverlay({ article, onClose }: { article: Article; onClose: () => void }) {
  const router = useRouter()

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="mag-overlay" onClick={onClose} aria-modal role="dialog">
      <div className="mag-modal" onClick={e => e.stopPropagation()}>
        <button className="mag-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="mag-modal-cover">
          <span className="mag-modal-num">
            Volume&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;Article&nbsp;{article.articleInVolume}
          </span>
          <h2 className="mag-modal-title">{article.title}</h2>
        </div>

        <div className="mag-modal-meta">
          <span className="mag-meta-item">{article.date}</span>
          <span className="mag-meta-sep">·</span>
          <span className="mag-meta-item">{article.wordCount.toLocaleString()} words</span>
        </div>

        <button
          className="mag-read-btn"
          onClick={() => navigateTo(`/articles/${article.slug}`, h => router.push(h))}
        >
          Read
        </button>
      </div>
    </div>
  )
}

export default function ArticlesContent() {
  const [selected, setSelected] = useState<Article | null>(null)
  const volumes = Array.from(getArticlesByVolume().entries()).sort(([a], [b]) => a - b)

  return (
    <>
      <main className="mag-main">
        {volumes.map(([vol, articles]) => (
          <section key={vol} className="mag-volume">
            <div className="mag-volume-label">
              <span>Volume&nbsp;{toRoman(vol)}</span>
            </div>
            <div className="mag-row">
              {articles.map(article => (
                <MagCard
                  key={article.slug}
                  article={article}
                  onSelect={() => setSelected(article)}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {selected && (
        <MagOverlay article={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
