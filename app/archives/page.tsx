import { Metadata } from 'next'
import InnerPageShell from '@/components/InnerPageShell'

export const metadata: Metadata = { title: 'Archives — NanoSphere' }

export default function ArchivesPage() {
  return (
    <InnerPageShell title="Archives">
      The digital record of everything we&apos;ve made and why we made it.
    </InnerPageShell>
  )
}
