import Nav from '@/components/Nav'
import CornerBrackets from '@/components/CornerBrackets'
import HeroCanvas from '@/components/HeroCanvas'
import NavSphere from '@/components/NavSphere'

export default function Home() {
  return (
    <>
      <Nav />
      <CornerBrackets />
      <HeroCanvas />
      {/* Pinned to the hero sphere's north pole: cy=50vh, R=0.38*min(100vw,100vh) */}
      <div style={{
        position: 'fixed',
        left: '50%',
        top: 'calc(50vh - 0.38 * min(100vw, 100vh))',
        transform: 'translate(-50%, -50%)',
        zIndex: 11,
      }}>
        <NavSphere />
      </div>
      <div className="vignette" />
    </>
  )
}
