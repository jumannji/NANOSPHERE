'use client'

import { useEffect, useRef } from 'react'

const WORD = 'NanoSphere'

// Vivid electric blues (#4488ff territory and brighter)
const BLUE_PALETTE = [
  { r:  68, g: 136, b: 255 }, // #4488ff
  { r:  40, g: 110, b: 255 },
  { r:  80, g: 160, b: 255 },
  { r:  30, g:  90, b: 240 },
  { r: 100, g: 180, b: 255 },
  { r:  55, g: 125, b: 255 },
  { r:  20, g:  70, b: 220 },
]
const RED_PALETTE = [
  { r: 220, g:  40, b:  60 },
  { r: 200, g:  30, b:  50 },
  { r: 240, g:  60, b:  80 },
  { r: 180, g:  20, b:  40 },
  { r: 255, g:  70, b:  90 },
  { r: 210, g:  45, b:  65 },
  { r: 190, g:  25, b:  45 },
]

function pickBlendedColor(u: number) {
  const blue = BLUE_PALETTE[(Math.random() * BLUE_PALETTE.length) | 0]
  const red  = RED_PALETTE [(Math.random() * RED_PALETTE.length ) | 0]
  // Blue on left half of logo, red on right, smooth blend in middle
  let t: number
  if (u <= 0.38) t = 0
  else if (u >= 0.62) t = 1
  else t = (u - 0.38) / 0.24
  t = t * t * (3 - 2 * t)
  return {
    r: Math.round(blue.r + (red.r - blue.r) * t),
    g: Math.round(blue.g + (red.g - blue.g) * t),
    b: Math.round(blue.b + (red.b - blue.b) * t),
  }
}

const SPHERE_CIRCLES = (() => {
  const arr: { kind: string; pts: number[][] }[] = []
  const segs = 96
  const numLong = 9
  for (let i = 0; i < numLong; i++) {
    const theta = (i / numLong) * Math.PI
    const pts: number[][] = []
    for (let s = 0; s < segs; s++) {
      const u = (s / segs) * Math.PI * 2
      pts.push([
        Math.cos(u) * Math.cos(theta),
        Math.sin(u),
        Math.cos(u) * Math.sin(theta),
      ])
    }
    arr.push({ kind: 'long', pts })
  }
  const lats = [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]
  for (const ly of lats) {
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
  wob: number; wobSpeed: number
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

    let W = 0, H = 0
    let DPR = Math.min(window.devicePixelRatio || 1, 2)

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
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

    // Mouse with smoothed velocity for trail direction
    const mouse = { x: -9999, y: -9999, inside: false, vx: 0, vy: 0 }
    const onMouseMove = (e: MouseEvent) => {
      const rawVx = e.clientX - mouse.x
      const rawVy = e.clientY - mouse.y
      // Exponential moving average — smooths jitter while staying responsive
      mouse.vx = mouse.vx * 0.35 + rawVx * 0.65
      mouse.vy = mouse.vy * 0.35 + rawVy * 0.65
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.inside = true
    }
    const onMouseLeave = () => { mouse.inside = false; mouse.vx = 0; mouse.vy = 0 }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    // ---- logo float ----
    function animateLogo(t: number) {
      const r = 5
      const tx = Math.cos(t * 0.00025) * r
      const ty = Math.sin(t * 0.00020) * r * 0.7
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
        const opacity = 0.05 + pulse * 0.05
        ringsCtx.strokeStyle = `rgba(20,20,18,${opacity.toFixed(3)})`
        ringsCtx.beginPath()
        ringsCtx.arc(cx, cy, r, 0, Math.PI * 2)
        ringsCtx.stroke()
      }
    }

    // ---- cyberpunk wireframe sphere ----
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

      // Subtle flicker — two overlapping sine waves at prime-ish frequencies
      const flicker = 0.82 + Math.sin(t * 0.053) * 0.10 + Math.sin(t * 0.029) * 0.08

      // Pass 1: wide soft glow (cyan-electric blue)
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const zMid = (a.z + b.z) * 0.5
          const depth = (zMid + 1) * 0.5
          const op = (0.012 + depth * 0.055) * flicker
          sphereCtx.strokeStyle = `rgba(0,190,255,${op.toFixed(3)})`
          sphereCtx.lineWidth = 3.5
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }

      // Pass 2: crisp fine lines with depth-modulated opacity
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const zMid = (a.z + b.z) * 0.5
          const depth = (zMid + 1) * 0.5
          const op = (0.06 + depth * 0.32) * flicker
          sphereCtx.strokeStyle = `rgba(80,210,255,${op.toFixed(3)})`
          sphereCtx.lineWidth = 0.5
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }

      // Horizon circle — glow + crisp
      sphereCtx.beginPath()
      sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 3
      sphereCtx.strokeStyle = `rgba(0,200,255,${(0.10 * flicker).toFixed(3)})`
      sphereCtx.stroke()

      sphereCtx.beginPath()
      sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 0.8
      sphereCtx.strokeStyle = `rgba(100,225,255,${(0.45 * flicker).toFixed(3)})`
      sphereCtx.stroke()
    }

    // ---- ink mask for logo hit-testing ----
    let inkMask: { data: Uint8Array; w: number; h: number; mScale: number } | null = null
    let logoBox: DOMRect | null = null

    function sampleLogoPoints() {
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
      octx.fillStyle = '#000'
      octx.fillRect(0, 0, ow, oh)
      octx.fillStyle = '#fff'
      octx.textBaseline = 'middle'
      octx.textAlign = 'center'
      octx.font = `${fontWeight} ${fontSize * scale}px ${fontFamily}`
      octx.fillText(WORD, ow / 2, oh / 2)
      const img = octx.getImageData(0, 0, ow, oh).data
      const mScale = 2
      const mw = Math.ceil(rect.width / mScale) + 2
      const mh = Math.ceil(rect.height / mScale) + 2
      const mask = new Uint8Array(mw * mh)
      const xStart = padX * scale
      const xEnd   = (padX + rect.width) * scale
      const step = 3
      for (let y = 0; y < oh; y += step) {
        for (let x = xStart; x < xEnd; x += step) {
          if (img[(y * ow + x) * 4] > 160) {
            const sx = rect.left - padX + x / scale
            const sy = rect.top  - padY + y / scale
            const mx = Math.floor((sx - rect.left) / mScale)
            const my = Math.floor((sy - rect.top)  / mScale)
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const xx = mx + dx, yy = my + dy
                if (xx >= 0 && yy >= 0 && xx < mw && yy < mh) mask[yy * mw + xx] = 1
              }
            }
          }
        }
      }
      inkMask = { data: mask, w: mw, h: mh, mScale }
    }

    if (document.fonts?.ready) {
      document.fonts.ready.then(sampleLogoPoints)
    } else {
      window.addEventListener('load', sampleLogoPoints)
    }
    const onResizeSample = () => setTimeout(sampleLogoPoints, 50)
    window.addEventListener('resize', onResizeSample)

    function cursorOnInk() {
      if (!inkMask || !logoBox || !mouse.inside) return false
      const lx = mouse.x - logoBox.left
      const ly = mouse.y - logoBox.top
      if (lx < 0 || ly < 0 || lx > logoBox.width || ly > logoBox.height) return false
      const mx = Math.floor(lx / inkMask.mScale)
      const my = Math.floor(ly / inkMask.mScale)
      if (mx < 0 || my < 0 || mx >= inkMask.w || my >= inkMask.h) return false
      return inkMask.data[my * inkMask.w + mx] === 1
    }

    // ---- cursor-trailing particles ----
    const particles: Particle[] = []
    const MAX_PARTICLES = 2000

    function fadeFlowCanvas() {
      flowCtx.globalCompositeOperation = 'destination-out'
      // Moderate fade — trails dissolve in ~8-10 frames
      flowCtx.fillStyle = 'rgba(0,0,0,0.13)'
      flowCtx.fillRect(0, 0, W, H)
      flowCtx.globalCompositeOperation = 'source-over'
    }

    function spawnTrailParticles(dt: number) {
      if (!cursorOnInk() || !logoBox) return

      const u = Math.max(0, Math.min(1, (mouse.x - logoBox.left) / logoBox.width))
      const col = pickBlendedColor(u)

      const baseRate = 26
      const count = Math.max(1, Math.floor(baseRate * (dt / 16.7)))

      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break

        // Small spread around cursor so trail has width, not just a point
        const spread = 5
        const ox = (Math.random() - 0.5) * spread
        const oy = (Math.random() - 0.5) * spread

        // Particles inherit a fraction of cursor velocity — cursor moves ahead,
        // particles lag behind, naturally forming a trail
        const trailFrac = 0.15 + Math.random() * 0.20
        const life = 320 + Math.random() * 280

        particles.push({
          x: mouse.x + ox,
          y: mouse.y + oy,
          vx: mouse.vx * trailFrac,
          vy: mouse.vy * trailFrac,
          life,
          maxLife: life,
          size: 11 + Math.random() * 15,
          r: col.r, g: col.g, b: col.b,
          alpha0: 0.10 + Math.random() * 0.10,
          wob: Math.random() * Math.PI * 2,
          wobSpeed: 0.0014 + Math.random() * 0.0010,
        })
      }
    }

    function updateParticles(dt: number) {
      fadeFlowCanvas()
      flowCtx.globalCompositeOperation = 'source-over'

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.life -= dt
        if (p.life <= 0) { particles.splice(i, 1); continue }

        // Very gentle lateral wobble for organic softness
        p.wob += p.wobSpeed * dt
        p.vx += Math.cos(p.wob) * 0.006

        // Heavy drag — trail dissipates within ~15 frames
        p.vx *= 0.90
        p.vy *= 0.90

        p.x += p.vx * dt * 0.07
        p.y += p.vy * dt * 0.07

        const lifeT = p.life / p.maxLife
        // Quick fade-in (appears instantly), smooth fade-out
        const fadeIn = Math.min(1, (1 - lifeT) * 10)
        const a = p.alpha0 * lifeT * fadeIn

        // Slight expansion as particle dissolves
        const rad = p.size * (1 + (1 - lifeT) * 0.5)

        const grad = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        grad.addColorStop(0,    `rgba(${p.r},${p.g},${p.b},${a.toFixed(3)})`)
        grad.addColorStop(0.40, `rgba(${p.r},${p.g},${p.b},${(a * 0.38).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${p.r},${p.g},${p.b},0)`)
        flowCtx.fillStyle = grad
        flowCtx.beginPath()
        flowCtx.arc(p.x, p.y, rad, 0, Math.PI * 2)
        flowCtx.fill()
      }
    }

    // ---- main loop ----
    let last = performance.now()
    let rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last)
      last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      spawnTrailParticles(dt)
      updateParticles(dt)
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
      <canvas ref={ringsRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 3,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          ref={logoRef}
          style={{
            fontFamily: 'var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(72px, 12vw, 188px)',
            letterSpacing: '0.04em',
            color: 'var(--ink)',
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
      {/* normal blend preserves vivid electric blue/red on the yellow background */}
      <canvas ref={flowRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4 }} />
    </main>
  )
}
