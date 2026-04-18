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

interface Particle {
  x: number; y: number
  vx: number; vy: number
  life: number; maxLife: number
  size: number
  alpha0: number
  seed: number
}

export default function HeroCanvas() {
  const ringsRef  = useRef<HTMLCanvasElement>(null)
  const sphereRef = useRef<HTMLCanvasElement>(null)
  const flowRef   = useRef<HTMLCanvasElement>(null)
  const logoRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ringsCanvas  = ringsRef.current!
    const sphereCanvas = sphereRef.current!
    const flowCanvas   = flowRef.current!
    const logo         = logoRef.current!
    const ringsCtx  = ringsCanvas.getContext('2d')!
    const sphereCtx = sphereCanvas.getContext('2d')!
    const flowCtx   = flowCanvas.getContext('2d')!

    let W = 0, H = 0, DPR = 1
    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [ringsCanvas, sphereCanvas, flowCanvas]) {
        c.width  = Math.floor(W * DPR); c.height = Math.floor(H * DPR)
        c.style.width = W + 'px';       c.style.height = H + 'px'
      }
      ringsCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      sphereCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      flowCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    // ── mouse tracking ───────────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999, inside: false, vx: 0, vy: 0 }
    let lastMoveTime = 0

    const onMouseMove = (e: MouseEvent) => {
      const rawVx = e.clientX - mouse.x
      const rawVy = e.clientY - mouse.y
      mouse.vx = mouse.vx * 0.38 + rawVx * 0.62
      mouse.vy = mouse.vy * 0.38 + rawVy * 0.62
      mouse.x = e.clientX; mouse.y = e.clientY
      mouse.inside = true
      lastMoveTime = performance.now()
    }
    const onMouseLeave = () => { mouse.inside = false; mouse.vx = 0; mouse.vy = 0 }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    // ── logo float ───────────────────────────────────────────────────────
    function animateLogo(t: number) {
      const tx = Math.cos(t * 0.00025) * 5
      const ty = Math.sin(t * 0.00020) * 5 * 0.7
      const rot = Math.sin(t * 0.00018) * 1.0
      logo.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`
    }

    // ── orbit rings ──────────────────────────────────────────────────────
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

    // ── wireframe sphere ─────────────────────────────────────────────────
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
          sphereCtx.strokeStyle = `rgba(18,18,20,${op.toFixed(3)})`
          sphereCtx.beginPath(); sphereCtx.moveTo(a.x, a.y); sphereCtx.lineTo(b.x, b.y); sphereCtx.stroke()
        }
      }
      sphereCtx.strokeStyle = 'rgba(18,18,20,0.32)'
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R, 0, Math.PI * 2); sphereCtx.stroke()
    }

    // ── white mist particles ─────────────────────────────────────────────
    //
    //  Follows cursor anywhere on page. Wispy, soft, volumetric white mist.
    //  Trail fades 2-3 seconds after cursor stops.

    const particles: Particle[] = []
    const MAX_PARTICLES = 1200
    const IDLE_MS = 80

    function driftField(x: number, y: number, t: number, seed: number): [number, number] {
      const T = t * 0.00038, S = seed
      const fx = Math.sin(x * 0.015 + T       + S) * 0.35
               + Math.cos(y * 0.020 - T * 0.7 + S * 0.9) * 0.28
               + Math.sin((x - y) * 0.010 + T * 1.2 + S * 0.4) * 0.15
      const fy = Math.cos(x * 0.020 + T * 1.1 + S * 0.7) * 0.35
               + Math.sin(y * 0.014 - T * 0.8 - S * 0.6) * 0.28
               + Math.cos((x + y) * 0.009 + T * 0.9 - S * 0.3) * 0.15
      return [fx, fy]
    }

    function spawnMist(now: number) {
      if (!mouse.inside) return
      if (now - lastMoveTime > IDLE_MS) return
      if (particles.length >= MAX_PARTICLES) return

      const speed = Math.hypot(mouse.vx, mouse.vy)
      const trailFrac = 0.06 + Math.random() * 0.10
      const baseAng   = Math.atan2(mouse.vy, mouse.vx)
      const spread    = speed > 3 ? 0.6 : 1.1
      const ang       = baseAng + (Math.random() - 0.5) * spread * 2
      const ox = (Math.random() - 0.5) * 18
      const oy = (Math.random() - 0.5) * 18
      const life = 2000 + Math.random() * 1000

      particles.push({
        x: mouse.x + ox, y: mouse.y + oy,
        vx: Math.cos(ang) * speed * trailFrac,
        vy: Math.sin(ang) * speed * trailFrac,
        life, maxLife: life,
        size:   38 + Math.random() * 40,   // 38–78 px
        alpha0: 0.05 + Math.random() * 0.06,
        seed:   Math.random() * 1000,
      })
    }

    function updateAndDrawMist(dt: number, now: number) {
      const n = Math.max(1, Math.floor(7 * dt / 16.7))
      for (let i = 0; i < n; i++) spawnMist(now)

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt
        if (p.life <= 0) { particles.splice(i, 1); continue }
        const [fx, fy] = driftField(p.x, p.y, now, p.seed)
        p.vx += fx * 0.003
        p.vy += fy * 0.003
        p.vx *= 0.985; p.vy *= 0.985
        const sp = Math.hypot(p.vx, p.vy)
        if (sp > 1.2) { p.vx *= 1.2 / sp; p.vy *= 1.2 / sp }
        p.x += p.vx * dt * 0.055
        p.y += p.vy * dt * 0.055
      }

      flowCtx.clearRect(0, 0, W, H)

      for (const p of particles) {
        const lifeT  = p.life / p.maxLife
        const fadeIn = Math.min(1, (1 - lifeT) * 6)
        const a = p.alpha0 * lifeT * fadeIn
        if (a < 0.002) continue

        const rad = p.size * (1 + (1 - lifeT) * 1.4)

        const grad = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        grad.addColorStop(0,    `rgba(255,255,255,${a.toFixed(4)})`)
        grad.addColorStop(0.35, `rgba(255,255,255,${(a * 0.55).toFixed(4)})`)
        grad.addColorStop(0.7,  `rgba(255,255,255,${(a * 0.18).toFixed(4)})`)
        grad.addColorStop(1,    `rgba(255,255,255,0)`)
        flowCtx.fillStyle = grad
        flowCtx.beginPath(); flowCtx.arc(p.x, p.y, rad, 0, Math.PI * 2); flowCtx.fill()
      }
    }

    // ── main loop ────────────────────────────────────────────────────────
    let last = performance.now(), rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      updateAndDrawMist(dt, now)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={ringsRef}  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          ref={logoRef}
          style={{
            fontFamily: 'var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(72px, 12vw, 188px)',
            letterSpacing: '0.04em',
            color: '#ae3319',
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
      <canvas
        ref={flowRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />
    </main>
  )
}
