import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import InnerPageShell from '@/components/InnerPageShell'
import { ARTICLES } from '@/lib/articles'

interface Props { params: { slug: string } }

export function generateStaticParams() {
  return ARTICLES.map(a => ({ slug: a.slug }))
}

export function generateMetadata({ params }: Props): Metadata {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) return {}
  return { title: `${article.title} — NanoSphere` }
}

export default function ArticlePage({ params }: Props) {
  const article = ARTICLES.find(a => a.slug === params.slug)
  if (!article) notFound()

  return (
    <InnerPageShell title={article.title}>
      {/* placeholder */}
    </InnerPageShell>
  )
}
