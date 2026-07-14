import { Metadata } from 'next'
import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'

export const metadata: Metadata = { title: 'Archives — NanoSphere' }

export default function ArchivesPage() {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />
      <div className="archives-page">
        <p className="archives-message">nothing to see here, yet</p>
      </div>
    </>
  )
}
