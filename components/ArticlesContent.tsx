'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getArticlesByVolume, toRoman } from '@/lib/articles'
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="mag-overlay" onClick={onClose} aria-modal role="dialog">
      <div className="mag-modal" onClick={e => e.stopPropagation()}>
        <button className="mag-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Left — portrait cover preview */}
        <div className="mag-modal-left">
          <span className="mag-modal-left-num">
            Vol.&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;{article.articleInVolume}
          </span>
          <h3 className="mag-modal-left-title">{article.title}</h3>
        </div>

        {/* Right — article info */}
        <div className="mag-modal-right">
          <div className="mag-modal-eyebrow">
            Volume&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;Article&nbsp;{article.articleInVolume}
          </div>
          <h2 className="mag-modal-title">{article.title}</h2>
          <div className="mag-modal-meta">
            <span className="mag-meta-row">{article.date}</span>
            <span className="mag-meta-row">{article.wordCount.toLocaleString()} words</span>
          </div>
          <button
            className="mag-read-btn"
            onClick={() => navigateTo(`/articles/${article.slug}`, h => router.push(h))}
          >
            Read
          </button>
        </div>
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
            <header className="mag-vol-header">
              <h2 className="mag-vol-title">Volume&nbsp;{toRoman(vol)}</h2>
              <div className="mag-vol-rule" aria-hidden />
            </header>
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
