'use client'

import { useEffect, useRef } from 'react'

const WORD = 'NanoSphere'

// Deterministic blue→red gradient along the logo width (no randomness — ribbon needs consistent color)
function getColorForU(u: number) {
  let t: number
  if (u <= 0.38) t = 0
  else if (u >= 0.62) t = 1
  else t = (u - 0.38) / 0.24
  t = t * t * (3 - 2 * t) // smoothstep
  // Blue: #4488ff (68,136,255) → Red: #dc2840 (220,40,64)
  return {
    r: Math.round(68  + (220 - 68)  * t),
    g: Math.round(136 + (40  - 136) * t),
    b: Math.round(255 + (64  - 255) * t),
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

interface TrailPoint {
  x: number
  y: number
  t: number   // timestamp ms
  u: number   // 0–1 horizontal position in logo (drives color)
}

// Ribbon passes: outer bloom → inner glow → bright core
const RIBBON_PASSES = [
  { widthPx: 42, alphaMult: 0.055, whiten: 0.0 },
  { widthPx: 18, alphaMult: 0.18,  whiten: 0.0 },
  { widthPx:  6, alphaMult: 0.55,  whiten: 0.0 },
  { widthPx:  1.5, alphaMult: 0.92, whiten: 0.55 }, // hot core
]
const TRAIL_LIFE_MS = 1600

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

    const mouse = { x: -9999, y: -9999, inside: false }

    // ---- ink mask (for cursor-on-letter detection) ----
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

    if (document.fonts?.ready) document.fonts.ready.then(sampleLogoMask)
    else window.addEventListener('load', sampleLogoMask)
    const onResizeSample = () => setTimeout(sampleLogoMask, 50)
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

    // ---- trail ----
    const trail: TrailPoint[] = []

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.inside = true

      // Sample a trail point if cursor is on letter ink
      if (cursorOnInk() && logoBox) {
        const last = trail[trail.length - 1]
        // Min 4px spacing so we don't oversample while still smooth
        if (!last || Math.hypot(e.clientX - last.x, e.clientY - last.y) >= 4) {
          const u = Math.max(0, Math.min(1, (e.clientX - logoBox.left) / logoBox.width))
          trail.push({ x: e.clientX, y: e.clientY, t: performance.now(), u })
          if (trail.length > 600) trail.shift() // hard cap
        }
      }
    }
    const onMouseLeave = () => { mouse.inside = false }
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
        const opacity = 0.04 + pulse * 0.04
        ringsCtx.strokeStyle = `rgba(20,20,18,${opacity.toFixed(3)})`
        ringsCtx.beginPath()
        ringsCtx.arc(cx, cy, r, 0, Math.PI * 2)
        ringsCtx.stroke()
      }
    }

    // ---- silver/chrome wireframe sphere ----
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

      // Metallic sheen: two overlapping sine waves simulate the shimmer as sphere rotates
      const sheen = 0.88 + Math.sin(t * 0.053) * 0.07 + Math.sin(t * 0.031) * 0.05

      // Pass 1 — soft silver halo (wide glow)
      sphereCtx.lineWidth = 3
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const depth = ((a.z + b.z) * 0.5 + 1) * 0.5
          const op = (0.012 + depth * 0.048) * sheen
          sphereCtx.strokeStyle = `rgba(155,160,178,${op.toFixed(3)})`
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }

      // Pass 2 — chrome mid-tone lines
      sphereCtx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const depth = ((a.z + b.z) * 0.5 + 1) * 0.5
          const op = (0.06 + depth * 0.30) * sheen
          sphereCtx.strokeStyle = `rgba(200,205,222,${op.toFixed(3)})`
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }

      // Pass 3 — specular highlight on front hemisphere only
      sphereCtx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const zMid = (a.z + b.z) * 0.5
          if (zMid < 0.45) continue
          const specular = (zMid - 0.45) / 0.55
          const op = specular * specular * 0.25 * sheen
          sphereCtx.strokeStyle = `rgba(245,248,255,${op.toFixed(3)})`
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }

      // Horizon ring — chrome edge with soft glow
      sphereCtx.beginPath()
      sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 2.5
      sphereCtx.strokeStyle = `rgba(140,148,168,${(0.12 * sheen).toFixed(3)})`
      sphereCtx.stroke()

      sphereCtx.beginPath()
      sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.lineWidth = 0.7
      sphereCtx.strokeStyle = `rgba(220,226,242,${(0.42 * sheen).toFixed(3)})`
      sphereCtx.stroke()
    }

    // ---- ribbon trail ----
    function drawTrailRibbon(now: number) {
      // Expire old points
      const cutoff = now - TRAIL_LIFE_MS
      while (trail.length > 0 && trail[0].t < cutoff) trail.shift()

      // Always clear — redraw entire trail fresh each frame so age-fade is precise
      flowCtx.clearRect(0, 0, W, H)
      if (trail.length < 2) return

      flowCtx.lineCap = 'round'
      flowCtx.lineJoin = 'round'

      for (const pass of RIBBON_PASSES) {
        for (let i = 1; i < trail.length; i++) {
          const p0 = trail[i - 1]
          const p1 = trail[i]

          // Age: 1 = just spawned, 0 = about to expire. Use quadratic ease-out for natural fade.
          const age0 = Math.max(0, 1 - (now - p0.t) / TRAIL_LIFE_MS)
          const age1 = Math.max(0, 1 - (now - p1.t) / TRAIL_LIFE_MS)
          const a0 = age0 * age0 * pass.alphaMult
          const a1 = age1 * age1 * pass.alphaMult
          if (a0 + a1 < 0.005) continue

          let c0 = getColorForU(p0.u)
          let c1 = getColorForU(p1.u)

          // Whiten the hot core toward luminous white
          if (pass.whiten > 0) {
            const w = pass.whiten
            c0 = { r: Math.round(c0.r + (255 - c0.r) * w), g: Math.round(c0.g + (255 - c0.g) * w), b: Math.round(c0.b + (255 - c0.b) * w) }
            c1 = { r: Math.round(c1.r + (255 - c1.r) * w), g: Math.round(c1.g + (255 - c1.g) * w), b: Math.round(c1.b + (255 - c1.b) * w) }
          }

          // Width tapers with age — fat at cursor tip, whisper-thin at tail
          const lineWidth = ((age0 + age1) / 2) * pass.widthPx + 0.5

          const dx = p1.x - p0.x, dy = p1.y - p0.y
          const dist = Math.hypot(dx, dy)

          // For segments shorter than ~2px, use solid midpoint color (skips gradient creation)
          if (dist < 2 || Math.abs(p0.u - p1.u) < 0.005) {
            const mc = getColorForU((p0.u + p1.u) / 2)
            const ma = (a0 + a1) / 2
            flowCtx.strokeStyle = `rgba(${mc.r},${mc.g},${mc.b},${ma.toFixed(3)})`
          } else {
            const grad = flowCtx.createLinearGradient(p0.x, p0.y, p1.x, p1.y)
            grad.addColorStop(0, `rgba(${c0.r},${c0.g},${c0.b},${a0.toFixed(3)})`)
            grad.addColorStop(1, `rgba(${c1.r},${c1.g},${c1.b},${a1.toFixed(3)})`)
            flowCtx.strokeStyle = grad
          }

          flowCtx.lineWidth = lineWidth
          flowCtx.beginPath()
          flowCtx.moveTo(p0.x, p0.y)
          flowCtx.lineTo(p1.x, p1.y)
          flowCtx.stroke()
        }
      }
    }

    // ---- main loop ----
    let last = performance.now()
    let rafId = 0
    function frame(now: number) {
      last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      drawTrailRibbon(now)
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

  const silverGradient = 'linear-gradient(172deg, #ececf0 0%, #9a9aaa 38%, #d4d4e0 62%, #f2f2f6 100%)'

  return (
    <main style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas ref={ringsRef}  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />

      {/*
        flow canvas at z-index 3, logo at z-index 4.
        The ribbon glow sits BELOW the silver letters — light appears to
        radiate from behind the letterforms, not float on top of them.
      */}
      <canvas ref={flowRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }} />

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%,-50%)',
          zIndex: 4,
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
            background: silverGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
