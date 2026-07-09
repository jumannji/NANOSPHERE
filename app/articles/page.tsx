import type { Metadata } from 'next'
import ArticlesNav from '@/components/ArticlesNav'
import ArticlesContent from '@/components/ArticlesContent'
import { client } from '@/lib/sanity/client'
import { ARTICLES_QUERY } from '@/lib/sanity/queries'
import type { Article } from '@/lib/articles'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }

// Always render fresh — this page must reflect Sanity Studio edits on
// the very next load, not a cached build-time or ISR snapshot.
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ArticlesPage() {
  const articles = await client.fetch<Article[]>(ARTICLES_QUERY, {}, { cache: 'no-store' })

  return (
    <>
      <ArticlesNav />
      <ArticlesContent articles={articles} />
    </>
  )
}
