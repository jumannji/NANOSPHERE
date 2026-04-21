import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }

const ARTICLES = [
  {
    slug: 'cultural-transmission',
    title: 'Cultural Transmission',
    date: '2026.04',
    preview: 'On how ideas move through matter and survive it.',
  },
  {
    slug: 'the-surface-of-things',
    title: 'The Surface of Things',
    date: '2026.03',
    preview: 'Material memory and what it refuses to forget.',
  },
  {
    slug: 'invisible-architecture',
    title: 'Invisible Architecture',
    date: '2026.02',
    preview: 'Structure beneath the threshold of perception.',
  },
  {
    slug: 'signal-and-noise',
    title: 'Signal & Noise',
    date: '2026.01',
    preview: 'Filtering the world at a scale below language.',
  },
  {
    slug: 'emergent-forms',
    title: 'Emergent Forms',
    date: '2025.12',
    preview: 'When components become something irreducible.',
  },
  {
    slug: 'density',
    title: 'Density',
    date: '2025.11',
    preview: 'How compression changes the shape of meaning.',
  },
]

// Absolute positions + transforms for each card around the centered title
const POSITIONS = [
  { top: 'max(88px, 13vh)', left:  '6vw',   transform: 'rotate(-1.2deg)'                    },
  { top: '50%',             left:  '4vw',   transform: 'translateY(-50%) rotate(0.4deg)'    },
  { bottom: '11vh',         left:  '7vw',   transform: 'rotate(0.8deg)'                     },
  { top: 'max(80px, 10vh)', right: '5.5vw', transform: 'rotate(1.3deg)'                     },
  { top: '48%',             right: '4vw',   transform: 'translateY(-50%) rotate(-0.6deg)'   },
  { bottom: '9vh',          right: '6vw',   transform: 'rotate(0deg)'                       },
]

export default function ArticlesPage() {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />

      <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>

        {/* Central heading — same style as homepage logo */}
        <div
          aria-label="Articles"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(64px, 9vw, 140px)',
            letterSpacing: '0.04em',
            color: 'var(--logo-ink)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          Articles
        </div>

        {/* Cards scattered around the title */}
        {ARTICLES.map((article, i) => {
          const pos = POSITIONS[i]
          const { transform, ...coords } = pos
          const coordStyles = Object.fromEntries(
            Object.entries(coords).filter(([, v]) => v !== undefined)
          )
          return (
            <a
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="article-card"
              style={{ transform, ...coordStyles }}
            >
              <div className="article-card-title">{article.title}</div>
              <div className="article-card-date">{article.date}</div>
              <div className="article-card-preview">{article.preview}</div>
            </a>
          )
        })}

      </main>
    </>
  )
}
