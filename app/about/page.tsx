import { Metadata } from 'next'
import InnerPageShell from '@/components/InnerPageShell'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = { title: 'About — NanoSphere' }

export default function AboutPage() {
  return (
    <>
      <InnerPageShell title="About">
        Coming soon
      </InnerPageShell>
      <SiteFooter />
    </>
  )
}
