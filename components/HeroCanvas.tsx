'use client'

import { useEffect, useRef } from 'react'

const WORD = 'NanoSphere'

// Blue (#3478ff) → Red (#d41c30) across logo width — deterministic, vivid
function getColorForU(u: number) {
  let t: number
  if (u <= 0.38) t = 0
  else if (u >= 0.62) t = 1
  else t = (u - 0.38) / 0.24
  t = t * t * (3 - 2 * t) // smoothstep
  return {
    r: Math.round(52  + (212 - 52)  * t),
    g: Math.round(120 + (28  - 120) * t),
    b: Math.round(255 + (48  - 255) * t),
  }
}

const SPHERE_CIRCLES = (() => {
  const arr: { kind: string; pts: number[][] }[] = []
  const segs = 96
  for (let i = 0; i < 9; i++) {
    const theta = (i / 9) * Math.PI
    const pts: number[][] = []
    for (let s = 0; s < segs; s++) {
      const u = (s / segs) * Math.PI * 2
      pts.push([Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)])
    }
    arr.push({ kind: 'long', pts })
  }
  for (const ly of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
    const r = Math.sqrt(1 - ly * ly)
    const pts: number[][] = []
    for (let s = 0; s < segs; s++) {
      const u = (s / segs) * Math.PI * 2
      pts.push([Math.cos(u) * r, ly, Math.sin(u) * r])
    }
    arr.push({ kind: 'lat', pts })
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
  r: number; g: number; b: number
  alpha0: number
  seed: number
}

// SVG filter string for brushed-metal logo.
// feTurbulence: low X-freq (0.001) + higher Y-freq (0.12) = long horizontal grain streaks.
// feSpecularLighting: azimuth 0° (light from left) at 70° elevation → angled sheen on grain.
// feBlend screen: layered on silver base → classic brushed chrome look.
const METAL_FILTER_SVG = `<defs>
  <filter id="brushed-metal" x="-8%" y="-18%" width="116%" height="136%" color-interpolation-filters="sRGB">
    <feTurbulence type="fractalNoise" baseFrequency="0.001 0.12" numOctaves="4" seed="3" stitchTiles="stitch" result="grain"/>
    <feSpecularLighting in="grain" surfaceScale="7" specularConstant="2.4" specularExponent="42" lighting-color="white" result="spec">
      <feDistantLight azimuth="0" elevation="70"/>
    </feSpecularLighting>
    <feComposite in="spec" in2="SourceAlpha" operator="in" result="clipped-spec"/>
    <feFlood flood-color="rgb(152,157,178)" result="silver"/>
    <feComposite in="silver" in2="SourceAlpha" operator="in" result="silver-text"/>
    <feBlend in="silver-text" in2="clipped-spec" mode="screen" result="metal"/>
    <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur"/>
    <feOffset in="blur" dx="0" dy="4" result="shadow-offset"/>
    <feFlood flood-color="rgba(0,0,10,0.92)" result="shadow-color"/>
    <feComposite in="shadow-color" in2="shadow-offset" operator="in" result="shadow"/>
    <feMerge>
      <feMergeNode in="shadow"/>
      <feMergeNode in="metal"/>
    </feMerge>
  </filter>
</defs>`

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

    let W = 0, H = 0
    let DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [ringsCanvas, sphereCanvas, flowCanvas]) {
        c.width  = Math.floor(W * DPR)
        c.height = Math.floor(H * DPR)
        c.style.width  = W + 'px'
        c.style.height = H + 'px'
      }
      ringsCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      sphereCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      flowCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const mouse = { x: -9999, y: -9999, inside: false }
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true }
    const onMouseLeave = () => { mouse.inside = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    // ---- logo float ----
    function animateLogo(t: number) {
      const tx = Math.cos(t * 0.00025) * 5
      const ty = Math.sin(t * 0.00020) * 5 * 0.7
      const rot = Math.sin(t * 0.00018) * 1.0
      logo.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`
    }

    // ---- orbit rings ----
    function drawRings(t: number) {
      ringsCtx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2
      const baseR = Math.min(W, H) * 0.48
      ringsCtx.lineWidth = 0.5
      for (const ring of RINGS_DEF) {
        const pulse = Math.sin(t * ring.speed + ring.phase) * 0.5 + 0.5
        const r = baseR * ring.rScale * (0.96 + pulse * 0.08)
        ringsCtx.strokeStyle = `rgba(20,20,18,${(0.04 + pulse * 0.04).toFixed(3)})`
        ringsCtx.beginPath()
        ringsCtx.arc(cx, cy, r, 0, Math.PI * 2)
        ringsCtx.stroke()
      }
    }

    // ---- cyberpunk wireframe sphere (electric cyan/blue) ----
    function drawSphere(t: number) {
      sphereCtx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2
      const R = Math.min(W, H) * 0.38
      const ay = t * 0.00012
      const ax = Math.sin(t * 0.00007) * 0.28
      const cy_ = Math.cos(ay), sy_ = Math.sin(ay)
      const cx_ = Math.cos(ax), sx_ = Math.sin(ax)

      function proj(p: number[]) {
        let x = p[0] * cy_ + p[2] * sy_
        let z = -p[0] * sy_ + p[2] * cy_
        let y = p[1] * cx_ - z * sx_
        z = p[1] * sx_ + z * cx_
        return { x: cx + x * R, y: cy + y * R, z }
      }

      // Two overlapping sines → subtle CRT-like flicker/sheen
      const flicker = 0.82 + Math.sin(t * 0.053) * 0.10 + Math.sin(t * 0.029) * 0.08

      // Pass 1 — wide electric-cyan glow
      sphereCtx.lineWidth = 3.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i], b = projected[(i + 1) % projected.length]
          const depth = ((a.z + b.z) * 0.5 + 1) * 0.5
          sphereCtx.strokeStyle = `rgba(0,190,255,${((0.012 + depth * 0.055) * flicker).toFixed(3)})`
          sphereCtx.beginPath(); sphereCtx.moveTo(a.x, a.y); sphereCtx.lineTo(b.x, b.y); sphereCtx.stroke()
        }
      }

      // Pass 2 — crisp bright-cyan lines, depth-modulated
      sphereCtx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i], b = projected[(i + 1) % projected.length]
          const depth = ((a.z + b.z) * 0.5 + 1) * 0.5
          sphereCtx.strokeStyle = `rgba(80,215,255,${((0.06 + depth * 0.32) * flicker).toFixed(3)})`
          sphereCtx.beginPath(); sphereCtx.moveTo(a.x, a.y); sphereCtx.lineTo(b.x, b.y); sphereCtx.stroke()
        }
      }

      // Horizon ring — glow halo + crisp edge
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 3
      sphereCtx.strokeStyle = `rgba(0,200,255,${(0.10 * flicker).toFixed(3)})`
      sphereCtx.stroke()
      sphereCtx.beginPath(); sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 0.8
      sphereCtx.strokeStyle = `rgba(100,228,255,${(0.45 * flicker).toFixed(3)})`
      sphereCtx.stroke()
    }

    // ---- ink mask ----
    let inkMask: { data: Uint8Array; w: number; h: number; mScale: number } | null = null
    let logoBox: DOMRect | null = null

    function sampleLogoMask() {
      const rect = logo.getBoundingClientRect()
      if (!rect.width || !rect.height) { logoBox = null; inkMask = null; return }
      logoBox = rect
      const cs = getComputedStyle(logo)
      const fontSize = parseFloat(cs.fontSize)
      const fontFamily = cs.fontFamily
      const fontWeight = cs.fontWeight
      const scale = 2
      const padX = Math.ceil(fontSize * 0.4)
      const padY = Math.ceil(fontSize * 0.3)
      const ow = Math.ceil((rect.width + padX * 2) * scale)
      const oh = Math.ceil((rect.height + padY * 2) * scale)
      const off = document.createElement('canvas')
      off.width = ow; off.height = oh
      const octx = off.getContext('2d')!
      octx.fillStyle = '#000'; octx.fillRect(0, 0, ow, oh)
      octx.fillStyle = '#fff'; octx.textBaseline = 'middle'; octx.textAlign = 'center'
      octx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`
      octx.fillText(WORD, ow / 2, oh / 2)
      const img = octx.getImageData(0, 0, ow, oh).data
      const mScale = 2
      const mw = Math.ceil(rect.width / mScale) + 2
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

    if (document.fonts?.ready) document.fonts.ready.then(sampleLogoMask)
    else window.addEventListener('load', sampleLogoMask)
    const onResizeSample = () => setTimeout(sampleLogoMask, 50)
    window.addEventListener('resize', onResizeSample)

    function cursorOnInk() {
      if (!inkMask || !logoBox || !mouse.inside) return false
      const lx = mouse.x - logoBox.left, ly = mouse.y - logoBox.top
      if (lx < 0 || ly < 0 || lx > logoBox.width || ly > logoBox.height) return false
      const mx = Math.floor(lx / inkMask.mScale), my = Math.floor(ly / inkMask.mScale)
      if (mx < 0 || my < 0 || mx >= inkMask.w || my >= inkMask.h) return false
      return inkMask.data[my * inkMask.w + mx] === 1
    }

    // ---- smoky particle cloud ----
    const particles: Particle[] = []
    const MAX_PARTICLES = 1600

    // Approximate 2D turbulence field via overlapping sines — makes particles curl and drift
    function smokeTurbulence(x: number, y: number, t: number, seed: number): [number, number] {
      const T = t * 0.00055, S = seed
      const lx = Math.sin(x * 0.020 + T       + S) * 0.45 + Math.cos(y * 0.024 - T * 0.80 + S * 1.3) * 0.45
      const ly = Math.cos(x * 0.024 + T * 1.1 + S * 0.7) * 0.45 + Math.sin(y * 0.018 - T * 0.90 - S * 0.5) * 0.45
      const hx = Math.sin(x * 0.055 + y * 0.040 + T * 2.2 + S * 2.0) * 0.18
      const hy = Math.cos(x * 0.048 - y * 0.055 + T * 1.8 - S * 1.5) * 0.18
      return [lx + hx, ly + hy]
    }

    function spawnSmoke() {
      if (!cursorOnInk() || !logoBox || particles.length >= MAX_PARTICLES) return
      const u = Math.max(0, Math.min(1, (mouse.x - logoBox.left) / logoBox.width))
      const col = getColorForU(u)
      const ox = (Math.random() - 0.5) * 14
      const oy = (Math.random() - 0.5) * 14
      // Initial velocity: mostly upward with a loose angular spread (smoke rises, wispy)
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.85
      const spd = 0.06 + Math.random() * 0.16
      const life = 1300 + Math.random() * 1400
      particles.push({
        x: mouse.x + ox, y: mouse.y + oy,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        life, maxLife: life,
        // Large blobs — many overlapping at low alpha = volumetric cloud
        size: 22 + Math.random() * 28,
        r: col.r, g: col.g, b: col.b,
        alpha0: 0.034 + Math.random() * 0.042,
        seed: Math.random() * 1000,
      })
    }

    function updateAndDrawSmoke(dt: number, now: number) {
      // Physics pass
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt
        if (p.life <= 0) { particles.splice(i, 1); continue }

        const [tx, ty] = smokeTurbulence(p.x, p.y, now, p.seed)
        p.vx += tx * 0.007        // turbulence curl
        p.vy += ty * 0.007 - 0.005 // curl + net upward buoyancy

        p.vx *= 0.974; p.vy *= 0.974 // drag — smoke is light
        const sp = Math.hypot(p.vx, p.vy)
        if (sp > 0.85) { p.vx *= 0.85 / sp; p.vy *= 0.85 / sp }

        p.x += p.vx * dt * 0.06
        p.y += p.vy * dt * 0.06
      }

      // Clear and redraw all particles fresh — precise per-particle age fade
      flowCtx.clearRect(0, 0, W, H)

      for (const p of particles) {
        const lifeT = p.life / p.maxLife
        // Fast fade-in, long plateau, gentle fade-out — cigarette smoke puff profile
        const fadeIn = Math.min(1, (1 - lifeT) * 7)
        const a = p.alpha0 * lifeT * fadeIn
        if (a < 0.002) continue

        // Expand as smoke dissipates (hot smoke cools and expands)
        const rad = p.size * (1.0 + (1 - lifeT) * 1.7)

        const grad = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        grad.addColorStop(0,    `rgba(${p.r},${p.g},${p.b},${a.toFixed(3)})`)
        grad.addColorStop(0.40, `rgba(${p.r},${p.g},${p.b},${(a * 0.48).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${p.r},${p.g},${p.b},0)`)
        flowCtx.fillStyle = grad
        flowCtx.beginPath()
        flowCtx.arc(p.x, p.y, rad, 0, Math.PI * 2)
        flowCtx.fill()
      }

      // Spawn new particles only while cursor is on ink
      if (cursorOnInk() && logoBox) {
        const count = Math.max(1, Math.floor(11 * dt / 16.7))
        for (let i = 0; i < count; i++) spawnSmoke()
      }
    }

    // ---- main loop ----
    let last = performance.now(), rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      updateAndDrawSmoke(dt, now)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      window.removeEventListener('resize', onResizeSample)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [])

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* SVG filter definition — hidden, referenced by logo via CSS filter */}
      <svg
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: METAL_FILTER_SVG }}
      />

      <canvas ref={ringsRef}  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />

      {/* Smoke canvas sits BELOW the logo so colored light glows from behind the letters */}
      <canvas ref={flowRef}   style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} />

      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', zIndex: 4, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          ref={logoRef}
          style={{
            fontFamily: 'var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(72px, 12vw, 188px)',
            letterSpacing: '0.04em',
            // Dark base color — SVG filter uses SourceAlpha (the text shape) as mask,
            // then replaces the fill entirely with brushed-metal texture
            color: '#1c1c24',
            filter: 'url(#brushed-metal)',
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
