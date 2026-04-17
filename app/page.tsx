import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import HeroCanvas from '@/components/HeroCanvas'

export default function Home() {
  return (
    <>
      <Nav />
      <CornerBrackets />
      <HeroCanvas />
      <div className="vignette" />
      <div className="tagline">Cultural&nbsp;&nbsp;Transmission</div>
    </>
  )
}
