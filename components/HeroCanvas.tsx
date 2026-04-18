'use client'

import { useEffect, useRef } from 'react'

// ─── fire colour palette ───────────────────────────────────────────────────
// multiply blend on yellow bg deepens these into rich amber/crimson tones
const FIRE_PALETTE = [
  { r: 255, g:  72, b:   0 },  // red-orange
  { r: 255, g: 110, b:   8 },  // orange
  { r: 255, g: 155, b:  18 },  // warm orange
  { r: 255, g: 200, b:  38 },  // amber
  { r: 235, g:  48, b:   5 },  // deep orange-red
  { r: 205, g:  22, b:   5 },  // crimson
  { r: 255, g: 228, b:  80 },  // hot yellow
]

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
  size: number      // radius at birth
  alpha0: number    // peak alpha
  seed: number      // turbulence phase
  r: number; g: number; b: number  // fire colour assigned at birth
}

const WORD = 'NanoSphere'

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

    // ── ink mask (logo hit-test only — drives the trigger gate) ─────────
    let inkMask: { data: Uint8Array; w: number; h: number; mScale: number } | null = null
    let logoBox: DOMRect | null = null

    function buildLogoMask() {
      const rect = logo.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      logoBox = rect
      const cs = getComputedStyle(logo)
      const fontSize = parseFloat(cs.fontSize)
      const scale = 2
      const padX = Math.ceil(fontSize * 0.4), padY = Math.ceil(fontSize * 0.3)
      const ow = Math.ceil((rect.width  + padX * 2) * scale)
      const oh = Math.ceil((rect.height + padY * 2) * scale)
      const off = document.createElement('canvas')
      off.width = ow; off.height = oh
      const octx = off.getContext('2d')!
      octx.fillStyle = '#000'; octx.fillRect(0, 0, ow, oh)
      octx.fillStyle = '#fff'; octx.textBaseline = 'middle'; octx.textAlign = 'center'
      octx.font = `${cs.fontWeight} ${fontSize * scale}px ${cs.fontFamily}`
      octx.fillText(WORD, ow / 2, oh / 2)
      const img = octx.getImageData(0, 0, ow, oh).data
      const mScale = 2
      const mw = Math.ceil(rect.width  / mScale) + 2
      const mh = Math.ceil(rect.height / mScale) + 2
      const mask = new Uint8Array(mw * mh)
      const xStart = padX * scale, xEnd = (padX + rect.width) * scale
      for (let y = 0; y < oh; y += 3) {
        for (let x = xStart; x < xEnd; x += 3) {
          if (img[(y * ow + x) * 4] > 160) {
            const sx = rect.left - padX + x / scale
            const sy = rect.top  - padY + y / scale
            const mx = Math.floor((sx - rect.left) / mScale)
            const my = Math.floor((sy - rect.top)  / mScale)
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
              const xx = mx + dx, yy = my + dy
              if (xx >= 0 && yy >= 0 && xx < mw && yy < mh) mask[yy * mw + xx] = 1
            }
          }
        }
      }
      inkMask = { data: mask, w: mw, h: mh, mScale }
    }

    if (document.fonts?.ready) document.fonts.ready.then(buildLogoMask)
    else window.addEventListener('load', buildLogoMask)
    const onResizeMask = () => setTimeout(buildLogoMask, 60)
    window.addEventListener('resize', onResizeMask)

    function cursorOnInk(mx: number, my: number) {
      if (!inkMask || !logoBox) return false
      const lx = mx - logoBox.left, ly = my - logoBox.top
      if (lx < 0 || ly < 0 || lx > logoBox.width || ly > logoBox.height) return false
      const ix = Math.floor(lx / inkMask.mScale), iy = Math.floor(ly / inkMask.mScale)
      if (ix < 0 || iy < 0 || ix >= inkMask.w || iy >= inkMask.h) return false
      return inkMask.data[iy * inkMask.w + ix] === 1
    }

    // ── mouse + trigger gate ─────────────────────────────────────────────
    const mouse = { x: -9999, y: -9999, inside: false, vx: 0, vy: 0 }
    let lastMoveTime  = 0
    let smokeTriggered = false   // stays false until cursor first touches logo

    const onMouseMove = (e: MouseEvent) => {
      const rawVx = e.clientX - mouse.x
      const rawVy = e.clientY - mouse.y
      mouse.vx = mouse.vx * 0.38 + rawVx * 0.62
      mouse.vy = mouse.vy * 0.38 + rawVy * 0.62
      mouse.x = e.clientX; mouse.y = e.clientY
      mouse.inside = true
      lastMoveTime = performance.now()
      // Trigger once — permanently unlocked when cursor first enters logo ink
      if (!smokeTriggered && cursorOnInk(e.clientX, e.clientY)) {
        smokeTriggered = true
      }
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

    // ── fire smoke ───────────────────────────────────────────────────────
    //
    //  Gate: only spawns after cursor has touched logo ink at least once.
    //  Colour: fire palette with glowing hot-white core per particle.
    //  Blend: multiply on yellow bg → orange × yellow = rich amber/crimson.
    //  Physics: inherits cursor velocity for trail + gentle turbulent curl.
    //  Life: 1.9–3.0 s so cloud persists 2-3 s after cursor stops.

    const particles: Particle[] = []
    const MAX_PARTICLES = 1600
    const IDLE_MS = 90  // ms since last mousemove before spawning stops

    function driftField(x: number, y: number, t: number, seed: number): [number, number] {
      const T = t * 0.00040, S = seed
      const fx = Math.sin(x * 0.017 + T       + S) * 0.40
               + Math.cos(y * 0.022 - T * 0.7 + S * 0.9) * 0.30
               + Math.sin((x - y) * 0.011 + T * 1.3 + S * 0.4) * 0.18
      const fy = Math.cos(x * 0.022 + T * 1.1 + S * 0.7) * 0.40
               + Math.sin(y * 0.016 - T * 0.8 - S * 0.6) * 0.30
               + Math.cos((x + y) * 0.010 + T * 0.9 - S * 0.3) * 0.18
      return [fx, fy]
    }

    function spawnFire(now: number) {
      if (!smokeTriggered) return           // not yet unlocked
      if (!mouse.inside) return
      if (now - lastMoveTime > IDLE_MS) return
      if (particles.length >= MAX_PARTICLES) return

      const col = FIRE_PALETTE[(Math.random() * FIRE_PALETTE.length) | 0]
      const speed = Math.hypot(mouse.vx, mouse.vy)
      const trailFrac = 0.09 + Math.random() * 0.14
      const baseAng   = Math.atan2(mouse.vy, mouse.vx)
      const spread    = speed > 4 ? 0.5 : 1.0
      const ang       = baseAng + (Math.random() - 0.5) * spread * 2
      const ox = (Math.random() - 0.5) * 12
      const oy = (Math.random() - 0.5) * 12
      const life = 1900 + Math.random() * 1100

      particles.push({
        x: mouse.x + ox, y: mouse.y + oy,
        vx: Math.cos(ang) * speed * trailFrac,
        vy: Math.sin(ang) * speed * trailFrac,
        life, maxLife: life,
        size:   42 + Math.random() * 36,    // 42–78 px — big, visible
        alpha0: 0.07 + Math.random() * 0.07, // 0.07–0.14 — much more opaque than white mist
        seed:   Math.random() * 1000,
        r: col.r, g: col.g, b: col.b,
      })
    }

    function updateAndDrawFire(dt: number, now: number) {
      // Spawn
      const n = Math.max(1, Math.floor(8 * dt / 16.7))
      for (let i = 0; i < n; i++) spawnFire(now)

      // Physics
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt
        if (p.life <= 0) { particles.splice(i, 1); continue }
        const [fx, fy] = driftField(p.x, p.y, now, p.seed)
        p.vx += fx * 0.004
        p.vy += fy * 0.004 - 0.006   // slight upward buoyancy — fire rises
        p.vx *= 0.982; p.vy *= 0.982
        const sp = Math.hypot(p.vx, p.vy)
        if (sp > 1.4) { p.vx *= 1.4 / sp; p.vy *= 1.4 / sp }
        p.x += p.vx * dt * 0.055
        p.y += p.vy * dt * 0.055
      }

      // Redraw
      flowCtx.clearRect(0, 0, W, H)

      for (const p of particles) {
        const lifeT  = p.life / p.maxLife
        const fadeIn = Math.min(1, (1 - lifeT) * 8)
        const a = p.alpha0 * lifeT * fadeIn
        if (a < 0.002) continue

        const rad = p.size * (1 + (1 - lifeT) * 1.6)

        // ── outer glow bloom ──────────────────────────────────────
        // Wide, very faint halo that gives the fire an atmospheric glow
        const glowRad = rad * 2.2
        const glow = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRad)
        glow.addColorStop(0,   `rgba(${p.r},${p.g},${p.b},${(a * 0.28).toFixed(4)})`)
        glow.addColorStop(0.4, `rgba(${p.r},${p.g},${p.b},${(a * 0.08).toFixed(4)})`)
        glow.addColorStop(1,   `rgba(${p.r},${p.g},${p.b},0)`)
        flowCtx.fillStyle = glow
        flowCtx.beginPath(); flowCtx.arc(p.x, p.y, glowRad, 0, Math.PI * 2); flowCtx.fill()

        // ── core blob ─────────────────────────────────────────────
        // Hot white-yellow centre → fire colour → transparent edge
        const core = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        core.addColorStop(0,    `rgba(255,238,160,${a.toFixed(4)})`)     // hot core
        core.addColorStop(0.22, `rgba(${p.r},${p.g},${p.b},${a.toFixed(4)})`) // fire colour
        core.addColorStop(0.55, `rgba(${p.r},${p.g},${p.b},${(a * 0.42).toFixed(4)})`)
        core.addColorStop(1,    `rgba(${p.r},${p.g},${p.b},0)`)
        flowCtx.fillStyle = core
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
      updateAndDrawFire(dt, now)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', onResizeMask)
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
      {/*
        multiply blend: fire orange/red × yellow bg = rich amber and crimson.
        z-index 4 = above logo so fire drifts across the whole page.
      */}
      <canvas
        ref={flowRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 4,
          mixBlendMode: 'multiply',
        }}
      />
    </main>
  )
}
