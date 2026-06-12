'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
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

        <div className="mag-modal-left">
          <span className="mag-modal-left-num">
            Vol.&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;{article.articleInVolume}
          </span>
          <h3 className="mag-modal-left-title">{article.title}</h3>
        </div>

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

type Phase = 'intro' | 'exit' | 'revealed'

export default function ArticlesContent() {
  const [selected, setSelected] = useState<Article | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const volumes = Array.from(getArticlesByVolume().entries()).sort(([a], [b]) => a - b)

  const introTitleRef = useRef<HTMLHeadingElement>(null)
  const mainTitleRef  = useRef<HTMLHeadingElement>(null)
  // Stores the intro title's rect captured right before the transition starts
  const introRectRef  = useRef<DOMRect | null>(null)

  // Skip intro immediately if already visited this session
  useLayoutEffect(() => {
    if (sessionStorage.getItem('articles-revealed') === '1') {
      setPhase('revealed')
    }
  }, [])

  // Drive nav visibility via html class
  useEffect(() => {
    if (phase === 'intro') {
      document.documentElement.classList.add('articles-intro-active')
    } else {
      document.documentElement.classList.remove('articles-intro-active')
    }
    return () => document.documentElement.classList.remove('articles-intro-active')
  }, [phase])

  // Auto-trigger: show glitch for 2s then transition
  useEffect(() => {
    if (phase !== 'intro') return

    let finalId: ReturnType<typeof setTimeout>

    const revealId = setTimeout(() => {
      if (!introTitleRef.current) return
      // Capture intro title's screen position before switching to exit phase
      introRectRef.current = introTitleRef.current.getBoundingClientRect()
      setPhase('exit')
      sessionStorage.setItem('articles-revealed', '1')
      // Unmount intro overlay after all animations complete
      finalId = setTimeout(() => setPhase('revealed'), 1050)
    }, 2000)

    return () => {
      clearTimeout(revealId)
      clearTimeout(finalId)
    }
  }, [phase])

  // FLIP animation: warp main title to intro position, then transition to natural position
  useEffect(() => {
    if (phase !== 'exit' || !mainTitleRef.current || !introRectRef.current) return

    const el = mainTitleRef.current
    const target = el.getBoundingClientRect()
    const intro  = introRectRef.current

    const dx = intro.left - target.left
    const dy = intro.top  - target.top
    const sx = intro.width  / Math.max(target.width,  1)
    const sy = intro.height / Math.max(target.height, 1)

    // Step 1 — instantly warp to intro position (no transition)
    el.style.transition      = 'none'
    el.style.transformOrigin = 'top left'
    el.style.transform       = `translate(${dx}px,${dy}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`

    // Step 2 — double rAF ensures the browser paints the warped position before animating
    const raf1 = requestAnimationFrame(() => {
      const raf2 = requestAnimationFrame(() => {
        el.style.transition      = 'transform 820ms cubic-bezier(0.22,1,0.36,1)'
        el.style.transform       = ''
        el.style.transformOrigin = ''
      })
      return raf2
    })

    return () => {
      cancelAnimationFrame(raf1)
      el.style.transition = el.style.transform = el.style.transformOrigin = ''
    }
  }, [phase])

  return (
    <>
      {(phase === 'intro' || phase === 'exit') && (
        <div className={`mag-intro${phase === 'exit' ? ' mag-intro--exit' : ''}`}>
          <h2 ref={introTitleRef} className="mag-intro-title" data-text="Volume I">
            Volume&nbsp;I
          </h2>
        </div>
      )}

      {(phase === 'exit' || phase === 'revealed') && (
        <main className={`mag-main${phase === 'exit' ? ' mag-main--entering' : ''}`}>
          {volumes.map(([vol, articles], idx) => (
            <section key={vol} className="mag-volume">
              <header className="mag-vol-header">
                <h2
                  ref={idx === 0 ? mainTitleRef : undefined}
                  className="mag-vol-title"
                >
                  Volume&nbsp;{toRoman(vol)}
                </h2>
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
      )}

      {selected && (
        <MagOverlay article={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}
