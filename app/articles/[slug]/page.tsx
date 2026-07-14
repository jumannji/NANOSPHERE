import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import ArticleFoldingNav from '@/components/ArticleFoldingNav'
import CornerBrackets from '@/components/CornerBrackets'
import SubstackSignup from '@/components/SubstackSignup'
import WireframeSphere from '@/components/WireframeSphere'
import { client } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/image'
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY } from '@/lib/sanity/queries'
import {
  toRoman,
  isLocked,
  formatDate,
  getWordCount,
  estimateReadingMinutes,
  type Article,
} from '@/lib/articles'

interface Props { params: { slug: string } }

const TICKER_TEXT = Array(20).fill('KINDNESS IS RESISTANCE').join('    •    ')

// Always render fresh — this page must reflect Sanity Studio edits on
// the very next load, not a cached build-time or ISR snapshot.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateStaticParams() {
  const slugs = await client.fetch<string[]>(ARTICLE_SLUGS_QUERY, {}, { cache: 'no-store' })
  return slugs.map(slug => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = await client.fetch<Article | null>(
    ARTICLE_QUERY,
    { slug: params.slug },
    { cache: 'no-store' },
  )
  if (!article) return {}
  return { title: `${article.title} — NanoSphere` }
}

const portableTextComponents: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="article-body-h2">{children}</h2>,
    h3: ({ children }) => <h3 className="article-body-h3">{children}</h3>,
    blockquote: ({ children }) => <blockquote className="article-body-quote">{children}</blockquote>,
    normal: ({ children }) => <p>{children}</p>,
  },
  marks: {
    link: ({ children, value }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  },
}

export default async function ArticlePage({ params }: Props) {
  const article = await client.fetch<Article | null>(
    ARTICLE_QUERY,
    { slug: params.slug },
    { cache: 'no-store' },
  )
  if (!article) notFound()

  const locked = isLocked(article)
  const coverUrl = !locked && article.coverImage ? urlFor(article.coverImage).width(1200).url() : null
  const readingMinutes = estimateReadingMinutes(getWordCount(article.plainText))

  return (
    <>
      <ArticleFoldingNav />
      <CornerBrackets />
      <div className="vignette" />

      <div className="article-page">
        <div className="article-top">
          {locked ? (
            <>
              <h1 className="article-title">{article.title}</h1>
              <div className="article-locked">
                <WireframeSphere size={140} className="article-locked-sphere" />
                <span className="article-locked-label">Coming&nbsp;{formatDate(article.publishDate)}</span>
              </div>
            </>
          ) : (
            <div className="article-top-grid">
              <div className="article-top-text">
                <h1 className="article-title">{article.title}</h1>
                <div className="article-eyebrow">
                  Volume&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;Article&nbsp;{article.articleNumber}
                </div>
                <div className="article-meta-row">
                  <span>{formatDate(article.publishDate)}</span>
                  <span aria-hidden="true">·</span>
                  <span>{readingMinutes}&nbsp;min&nbsp;read</span>
                </div>
              </div>

              {coverUrl && (
                <div className="article-top-image">
                  {/* Desktop/tablet only — mobile shows the cover further down, in the white section */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverUrl} alt="" className="article-cover article-cover-desktop" />
                </div>
              )}
            </div>
          )}
        </div>

        {!locked && (
          <div className="article-reading">
            <div className="article-reading-inner">
              {coverUrl && (
                // Mobile only — desktop/tablet show the cover beside the title above
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverUrl} alt="" className="article-cover article-cover-mobile" />
              )}

              {article.subtitle && <p className="article-subtitle">{article.subtitle}</p>}

              {Array.isArray(article.body) && article.body.length > 0 && (
                <div className="article-body">
                  <PortableText value={article.body} components={portableTextComponents} />
                </div>
              )}
            </div>
          </div>
        )}

        <div className="substack-signup-wrap">
          <SubstackSignup />
        </div>

        <div className="kindness-ticker" aria-hidden="true">
          <div className="kindness-ticker-track">
            <span className="kindness-ticker-text">{TICKER_TEXT}</span>
            <span className="kindness-ticker-text">{TICKER_TEXT}</span>
          </div>
        </div>
      </div>
    </>
  )
}
