import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import InnerPageShell from '@/components/InnerPageShell'
import WireframeSphere from '@/components/WireframeSphere'
import { client } from '@/lib/sanity/client'
import { urlFor } from '@/lib/sanity/image'
import { ARTICLE_QUERY, ARTICLE_SLUGS_QUERY } from '@/lib/sanity/queries'
import { toRoman, isLocked, formatDate, getWordCount, type Article } from '@/lib/articles'

interface Props { params: { slug: string } }

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

  return (
    <InnerPageShell title={article.title}>
      {locked ? (
        <div className="article-locked">
          <WireframeSphere size={140} className="article-locked-sphere" />
          <span className="article-locked-label">Coming&nbsp;{formatDate(article.publishDate)}</span>
        </div>
      ) : (
        <>
          <div className="article-meta">
            Volume&nbsp;{toRoman(article.volume)}&nbsp;·&nbsp;Article&nbsp;{article.articleNumber}
            &nbsp;·&nbsp;{formatDate(article.publishDate)}
            &nbsp;·&nbsp;{getWordCount(article.plainText).toLocaleString()}&nbsp;words
          </div>
          {article.subtitle && <p className="article-subtitle">{article.subtitle}</p>}
          {coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="article-cover" />
          )}
          {Array.isArray(article.body) && article.body.length > 0 && (
            <div className="article-body">
              <PortableText value={article.body} components={portableTextComponents} />
            </div>
          )}
        </>
      )}
    </InnerPageShell>
  )
}
