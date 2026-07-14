import { Metadata } from 'next'
import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import SiteFooter from '@/components/SiteFooter'
import SubstackSignup from '@/components/SubstackSignup'

export const metadata: Metadata = { title: 'About — NanoSphere' }

export default function AboutPage() {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />

      <div className="about-page">
        <div className="substack-signup-wrap">
          <SubstackSignup />
        </div>

        <div className="about-contact">
          <h2 className="about-contact-heading">Reach out to us @</h2>
          <a className="about-contact-email" href="mailto:nanosphere@pm.me">
            nanosphere@pm.me
          </a>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}
