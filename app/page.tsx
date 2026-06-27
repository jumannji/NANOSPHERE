import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import HeroCanvas from '@/components/HeroCanvas'
import SiteFooter from '@/components/SiteFooter'

export default function Home() {
  return (
    <>
      <Nav />
      <CornerBrackets />
      <HeroCanvas />
      <div className="vignette" />
      <SiteFooter />
    </>
  )
}
