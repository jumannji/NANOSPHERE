import type { Metadata } from 'next'
import Nav from '@/components/Nav'
import ArticlesContent from '@/components/ArticlesContent'

export const metadata: Metadata = { title: 'Articles — NanoSphere' }

export default function ArticlesPage() {
  return (
    <>
      <Nav showSphere />
      <ArticlesContent />
    </>
  )
}
