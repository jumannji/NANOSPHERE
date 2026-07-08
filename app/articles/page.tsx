import type { Metadata } from 'next'
import ArticlesNav from '@/components/ArticlesNav'
import ArticlesContent from '@/components/ArticlesContent'
import { client } from '@/lib/sanity/client'
import { ARTICLES_QUERY } from '@/lib/sanity/queries'
import type { Article } from '@/lib/articles'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }
export const revalidate = 60

export default async function ArticlesPage() {
  const articles = await client.fetch<Article[]>(ARTICLES_QUERY)

  return (
    <>
      <ArticlesNav />
      <ArticlesContent articles={articles} />
    </>
  )
}
