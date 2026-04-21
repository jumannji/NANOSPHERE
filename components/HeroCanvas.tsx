'use client'

import { useEffect, useRef } from 'react'

const SPHERE_CIRCLES = (() => {
  const arr: { pts: number[][] }[] = []
  const segs = 96
  for (let i = 0; i < 9; i++) {
    const theta = (i / 9) * Math.PI
    const pts: number[][] = []
    for (let s = 0; s < segs; s++) {
      const u = (s / segs) * Math.PI * 2
      pts.push([Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)])
    }
    arr.push({ pts })
  }
  for (const ly of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
    const r = Math.sqrt(1 - ly * ly)
    const pts: number[][] = []
    for (let s = 0; s < segs; s++) {
      const u = (s / segs) * Math.PI * 2
      pts.push([Math.cos(u) * r, ly, Math.sin(u) * r])
    }
    arr.push({ pts })
  }
  return arr
})()

const RINGS_DEF = [
  { phase: 0.0, speed: 0.00040, rScale: 0.86 },
  { phase: 1.3, speed: 0.00055, rScale: 0.68 },
  { phase: 2.6, speed: 0.00035, rScale: 0.52 },
  { phase: 4.0, speed: 0.00060, rScale: 0.38 },
  { phase: 5.4, speed: 0.00045, rScale: 0.26 },
]

export default function HeroCanvas() {
  const ringsRef  = useRef<HTMLCanvasElement>(null)
  const sphereRef = useRef<HTMLCanvasElement>(null)
  const logoRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ringsCanvas  = ringsRef.current!
    const sphereCanvas = sphereRef.current!
    const logo         = logoRef.current!
    const ringsCtx  = ringsCanvas.getContext('2d')!
    const sphereCtx = sphereCanvas.getContext('2d')!

    const sphereRgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--sphere-rgb').trim() || '18,18,20'

    let W = 0, H = 0, DPR = 1
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [ringsCanvas, sphereCanvas]) {
        c.width  = Math.floor(W * DPR); c.height = Math.floor(H * DPR)
        c.style.width = W + 'px';       c.style.height = H + 'px'
      }
      ringsCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      sphereCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    function animateLogo(t: number) {
      const tx = Math.cos(t * 0.00025) * 5
      const ty = Math.sin(t * 0.00020) * 5 * 0.7
      const rot = Math.sin(t * 0.00018) * 1.0
      logo.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`
    }

    function drawRings(t: number) {
      ringsCtx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2, baseR = Math.min(W, H) * 0.48
      ringsCtx.lineWidth = 0.5
      for (const ring of RINGS_DEF) {
        const pulse = Math.sin(t * ring.speed + ring.phase) * 0.5 + 0.5
        const r = baseR * ring.rScale * (0.96 + pulse * 0.08)
        ringsCtx.strokeStyle = `rgba(20,20,18,${(0.05 + pulse * 0.05).toFixed(3)})`
        ringsCtx.beginPath(); ringsCtx.arc(cx, cy, r, 0, Math.PI * 2); ringsCtx.stroke()
      }
    }

    function drawSphere(t: number) {
      sphereCtx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.38
      const ay = t * 0.00012, ax = Math.sin(t * 0.00007) * 0.28
      const cy_ = Math.cos(ay), sy_ = Math.sin(ay)
      const cx_ = Math.cos(ax), sx_ = Math.sin(ax)
      function proj(p: number[]) {
        let x = p[0]*cy_ + p[2]*sy_, z = -p[0]*sy_ + p[2]*cy_
        let y = p[1]*cx_ - z*sx_;    z = p[1]*sx_ + z*cx_
        return { x: cx + x*R, y: cy + y*R, z }
      }
      sphereCtx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const proj_ = c.pts.map(proj)
        for (let i = 0; i < proj_.length; i++) {
          const a = proj_[i], b = proj_[(i + 1) % proj_.length]
          const op = 0.03 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.22
          sphereCtx.strokeStyle = `rgba(${sphereRgb},${op.toFixed(3)})`
          sphereCtx.beginPath(); sphereCtx.moveTo(a.x, a.y); sphereCtx.lineTo(b.x, b.y); sphereCtx.stroke()
        }
      }
      sphereCtx.strokeStyle = `rgba(${sphereRgb},0.32)`
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R, 0, Math.PI * 2); sphereCtx.stroke()
    }

    let last = performance.now(), rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now
      void dt
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100dvh', overflow: 'hidden' }}>
      <canvas ref={ringsRef}  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          ref={logoRef}
          style={{
            fontFamily: "var(--font-press-start), var(--font-italiana), serif",
            fontWeight: 400,
            fontSize: 'clamp(12px, 8vw, 100px)',
            letterSpacing: '0',
            color: 'var(--logo-ink)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            willChange: 'transform',
            transformOrigin: 'center center',
            padding: '0.2em 0.4em',
            cursor: 'default',
          }}
        >
          NanoSphere
        </div>
      </div>
    </main>
  )
}
