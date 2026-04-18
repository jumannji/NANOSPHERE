'use client'

import { useEffect, useRef } from 'react'

const WORD = 'NanoSphere'
const BLUE_PALETTE = [
  { r:  14, g:  34, b:  92 },
  { r:  22, g:  58, b: 148 },
  { r:  30, g:  82, b: 190 },
  { r:  52, g: 116, b: 230 },
  { r:  20, g:  76, b: 128 },
  { r:  74, g: 140, b: 222 },
  { r:  38, g:  98, b: 204 },
]
const RED_PALETTE = [
  { r:  92, g:  14, b:  22 },
  { r: 148, g:  22, b:  34 },
  { r: 190, g:  30, b:  46 },
  { r: 222, g:  58, b:  68 },
  { r: 128, g:  20, b:  28 },
  { r: 230, g:  86, b:  92 },
  { r: 204, g:  42, b:  54 },
]

function pickBlendedColor(u: number) {
  const blue = BLUE_PALETTE[(Math.random() * BLUE_PALETTE.length) | 0]
  const red  = RED_PALETTE [(Math.random() * RED_PALETTE.length ) | 0]
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

    const mouse = { x: -9999, y: -9999, inside: false }
    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.inside = true }
    const onMouseLeave = () => { mouse.inside = false }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseleave', onMouseLeave)

    function animateLogo(t: number) {
      const r = 5
      const tx = Math.cos(t * 0.00025) * r
      const ty = Math.sin(t * 0.00020) * r * 0.7
      const rot = Math.sin(t * 0.00018) * 1.0
      logo.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`
    }

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

      sphereCtx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const zMid = (a.z + b.z) * 0.5
          const depth = (zMid + 1) * 0.5
          const op = 0.03 + depth * 0.22
          sphereCtx.strokeStyle = `rgba(18,18,20,${op.toFixed(3)})`
          sphereCtx.beginPath()
          sphereCtx.moveTo(a.x, a.y)
          sphereCtx.lineTo(b.x, b.y)
          sphereCtx.stroke()
        }
      }
      sphereCtx.lineWidth = 0.5
      sphereCtx.strokeStyle = 'rgba(18,18,20,0.32)'
      sphereCtx.beginPath()
      sphereCtx.arc(cx, cy, R, 0, Math.PI * 2)
      sphereCtx.stroke()
    }

    // ---- ink mask ----
    let zonePoints: { x: number; y: number }[][] = []
    let inkMask: { data: Uint8Array; w: number; h: number; mScale: number } | null = null
    let logoBox: DOMRect | null = null

    function sampleLogoPoints() {
      const rect = logo.getBoundingClientRect()
      if (!rect.width || !rect.height) { zonePoints = []; logoBox = null; inkMask = null; return }
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
      const zones: { x: number; y: number }[][] = Array.from({ length: WORD.length }, () => [])
      const step = 3
      const xStart = padX * scale
      const xEnd   = (padX + rect.width) * scale
      const textW  = Math.max(1, xEnd - xStart)
      for (let y = 0; y < oh; y += step) {
        for (let x = 0; x < ow; x += step) {
          const idx = (y * ow + x) * 4
          if (img[idx] > 160) {
            const u = (x - xStart) / textW
            const zi = Math.max(0, Math.min(WORD.length - 1, Math.floor(u * WORD.length)))
            const sx = rect.left - padX + x / scale
            const sy = rect.top  - padY + y / scale
            zones[zi].push({ x: sx, y: sy })
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
      zonePoints = zones
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

    // ---- particles ----
    const particles: Particle[] = []
    const MAX_PARTICLES = 2400

    function fadeFlowCanvas() {
      flowCtx.globalCompositeOperation = 'destination-out'
      // Faster fade = shorter trails, more smoke-like
      flowCtx.fillStyle = 'rgba(0,0,0,0.11)'
      flowCtx.fillRect(0, 0, W, H)
      flowCtx.globalCompositeOperation = 'source-over'
    }

    function spawnFromZone(zi: number, count: number) {
      const pts = zonePoints[zi]
      if (!pts || !pts.length || !logoBox) return
      for (let i = 0; i < count; i++) {
        if (particles.length >= MAX_PARTICLES) break
        const p = pts[(Math.random() * pts.length) | 0]
        const u = Math.max(0, Math.min(1, (p.x - logoBox.left) / logoBox.width))
        const col = pickBlendedColor(u)
        // Mostly upward with lateral spread — aurora/smoke drift
        const lateralSpread = (Math.random() - 0.5) * 1.2
        const upSpeed = 0.4 + Math.random() * 0.9
        const life = 900 + Math.random() * 700
        particles.push({
          x: p.x, y: p.y,
          vx: lateralSpread,
          vy: -upSpeed,
          life, maxLife: life,
          // Large soft blobs — many overlapping = aurora glow
          size: 10 + Math.random() * 18,
          r: col.r, g: col.g, b: col.b,
          alpha0: 0.055 + Math.random() * 0.065,
          wob: Math.random() * Math.PI * 2,
          wobSpeed: 0.0012 + Math.random() * 0.0016,
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

        // Gentle lateral wobble for organic flow
        p.wob += p.wobSpeed * dt
        p.vx += Math.cos(p.wob) * 0.018
        // Sustained upward buoyancy
        p.vy -= 0.022

        // Light drag — let them float freely
        p.vx *= 0.96
        p.vy *= 0.97

        const sp = Math.hypot(p.vx, p.vy)
        const maxSp = 2.8
        if (sp > maxSp) { p.vx *= maxSp / sp; p.vy *= maxSp / sp }

        p.x += p.vx * dt * 0.06
        p.y += p.vy * dt * 0.06

        const lifeT = p.life / p.maxLife
        // Quick fade-in, long fade-out for smoke puff feel
        const fadeIn = Math.min(1, (1 - lifeT) * 6)
        const a = p.alpha0 * lifeT * fadeIn
        // Grow slightly as they rise (smoke expansion)
        const rad = p.size * (1 + (1 - lifeT) * 1.2)

        const grad = flowCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad)
        grad.addColorStop(0,    `rgba(${p.r},${p.g},${p.b},${a.toFixed(3)})`)
        grad.addColorStop(0.45, `rgba(${p.r},${p.g},${p.b},${(a * 0.4).toFixed(3)})`)
        grad.addColorStop(1,    `rgba(${p.r},${p.g},${p.b},0)`)
        flowCtx.fillStyle = grad
        flowCtx.beginPath()
        flowCtx.arc(p.x, p.y, rad, 0, Math.PI * 2)
        flowCtx.fill()
      }
    }

    function spawnIfOverInk(dt: number) {
      if (!cursorOnInk()) return
      const u = Math.max(0, Math.min(0.9999, (mouse.x - logoBox!.left) / logoBox!.width))
      const zi = Math.floor(u * WORD.length)
      // Higher burst rate for dense smoke/aurora response
      const baseRate = 28
      const spawn = Math.max(2, Math.floor(baseRate * (dt / 16.7)))
      spawnFromZone(zi, spawn)
      if (zi > 0)               spawnFromZone(zi - 1, Math.ceil(spawn * 0.5))
      if (zi < WORD.length - 1) spawnFromZone(zi + 1, Math.ceil(spawn * 0.5))
    }

    let last = performance.now()
    let rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last)
      last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      spawnIfOverInk(dt)
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
      <canvas ref={ringsRef}  id="rings"  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }} />
      <canvas ref={sphereRef} id="sphere" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }} />
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
      <canvas ref={flowRef} id="flow" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 4, mixBlendMode: 'multiply' }} />
    </main>
  )
}
