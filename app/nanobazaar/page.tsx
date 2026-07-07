import { Metadata } from 'next'
import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import BazaarComingSoon from '@/components/BazaarComingSoon'

export const metadata: Metadata = { title: 'NanoBazaar — Coming Soon — NanoSphere' }

export default function NanoBazaarPage() {
  return (
    <>
      <Nav showSphere />
      <CornerBrackets />
      <div className="vignette" />
      <BazaarComingSoon />
    </>
  )
}
