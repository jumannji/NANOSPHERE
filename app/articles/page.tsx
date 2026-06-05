import type { Metadata } from 'next'
import ArticlesNav from '@/components/ArticlesNav'
import ArticlesContent from '@/components/ArticlesContent'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }

export default function ArticlesPage() {
  return (
    <>
      <ArticlesNav />
      <ArticlesContent />
    </>
  )
}
