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
  const glitchRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const ringsCanvas  = ringsRef.current!
    const sphereCanvas = sphereRef.current!
    const glitchCanvas = glitchRef.current!
    const logo         = logoRef.current!
    const ringsCtx  = ringsCanvas.getContext('2d')!
    const sphereCtx = sphereCanvas.getContext('2d')!
    const glitchCtx = glitchCanvas.getContext('2d')!

    const sphereRgb = getComputedStyle(document.documentElement)
      .getPropertyValue('--sphere-rgb').trim() || '18,18,20'

    let W = 0, H = 0, DPR = 1
    let lW = 0, lH = 0

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth; H = window.innerHeight
      for (const c of [ringsCanvas, sphereCanvas]) {
        c.width  = Math.floor(W * DPR); c.height = Math.floor(H * DPR)
        c.style.width = W + 'px';       c.style.height = H + 'px'
      }
      ringsCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      sphereCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
      resizeGlitch()
    }

    function resizeGlitch() {
      lW = logo.offsetWidth; lH = logo.offsetHeight
      glitchCanvas.width  = Math.floor(lW * DPR)
      glitchCanvas.height = Math.floor(lH * DPR)
      glitchCanvas.style.width  = lW + 'px'
      glitchCanvas.style.height = lH + 'px'
      glitchCtx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    // Glitch state
    let gHovering = false
    let gIntensity = 0
    let gSpread = 0
    let gEnterX = 0.5
    let gStripAge = 0
    let gStripMs = 60
    let gStrips: { y: number; h: number; dx: number }[] = []
    let fontStr = ''
    let bgColor = ''
    let inkColor = ''
    let gAutoStopId: ReturnType<typeof setTimeout> | null = null

    function regenStrips(I: number) {
      const count = 2 + Math.floor(Math.random() * 4 * I + 1)
      gStrips = []
      for (let i = 0; i < count; i++) {
        gStrips.push({
          y:  Math.random() * lH,
          h:  1 + Math.random() * Math.max(1, lH * 0.06 * I),
          dx: (Math.random() - 0.5) * 18 * I,
        })
      }
      gStripMs = 20 + Math.random() * (80 - I * 55)
    }

    document.fonts.ready.then(() => {
      const cs = getComputedStyle(logo)
      fontStr  = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      bgColor  = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f7c500'
      inkColor = cs.color
      resizeGlitch()
    })

    function onEnter(ex: number) {
      const rect = logo.getBoundingClientRect()
      if (gAutoStopId !== null) { clearTimeout(gAutoStopId); gAutoStopId = null }
      gHovering = true
      gEnterX   = Math.max(0, Math.min(1, (ex - rect.left) / rect.width))
      gSpread   = 0
      gIntensity = 0
      gAutoStopId = setTimeout(() => { gHovering = false; gAutoStopId = null }, 5000)
    }

    function onLeave() {
      if (gAutoStopId !== null) { clearTimeout(gAutoStopId); gAutoStopId = null }
      gHovering = false
    }

    function onMouseEnter(e: MouseEvent) { onEnter(e.clientX) }
    function onMouseLeave() { onLeave() }
    function onTouchStart(e: TouchEvent) {
      onEnter(e.touches[0].clientX)
      setTimeout(onLeave, 1400)
    }

    logo.addEventListener('mouseenter', onMouseEnter)
    logo.addEventListener('mouseleave', onMouseLeave)
    logo.addEventListener('touchstart', onTouchStart, { passive: true })

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

    function drawGlitch(dt: number) {
      if (gHovering) {
        gIntensity = Math.min(1, gIntensity + dt / 2000)
        gSpread    = Math.min(1, gSpread    + dt / 450)
      } else {
        gIntensity = Math.max(0, gIntensity - dt / 380)
      }

      if (gIntensity < 0.004 || !fontStr) {
        glitchCtx.clearRect(0, 0, lW, lH)
        return
      }

      const I = gIntensity

      // Spread zone: expand outward from entry point
      const maxR  = Math.max(gEnterX, 1 - gEnterX) * lW
      const curR  = gSpread * maxR
      const sL    = Math.max(0, gEnterX * lW - curR)
      const sR    = Math.min(lW, gEnterX * lW + curR)
      const zoneW = sR - sL
      if (zoneW < 1) { glitchCtx.clearRect(0, 0, lW, lH); return }

      // Strip regen
      gStripAge += dt
      if (gStripAge >= gStripMs || gStrips.length === 0) {
        gStripAge = 0
        regenStrips(I)
      }

      glitchCtx.clearRect(0, 0, lW, lH)

      const chromShift = Math.round(4 + I * 10)

      // Chromatic aberration — red channel
      glitchCtx.save()
      glitchCtx.beginPath()
      glitchCtx.rect(sL, 0, zoneW, lH)
      glitchCtx.clip()
      glitchCtx.globalAlpha = I * 0.52
      glitchCtx.globalCompositeOperation = 'source-over'
      glitchCtx.fillStyle = `rgba(255,0,60,1)`
      glitchCtx.font = fontStr
      glitchCtx.textBaseline = 'middle'
      const textX = lW / 2
      const textY = lH / 2
      glitchCtx.textAlign = 'center'
      glitchCtx.fillText('NanoSphere', textX - chromShift, textY)
      glitchCtx.restore()

      // Chromatic aberration — cyan channel
      glitchCtx.save()
      glitchCtx.beginPath()
      glitchCtx.rect(sL, 0, zoneW, lH)
      glitchCtx.clip()
      glitchCtx.globalAlpha = I * 0.52
      glitchCtx.fillStyle = `rgba(0,220,255,1)`
      glitchCtx.font = fontStr
      glitchCtx.textBaseline = 'middle'
      glitchCtx.textAlign = 'center'
      glitchCtx.fillText('NanoSphere', textX + chromShift, textY)
      glitchCtx.restore()

      // Scan-line tears
      for (const strip of gStrips) {
        const sy = strip.y, sh = strip.h, sdx = strip.dx
        const clipL = sL, clipW = zoneW
        if (clipW < 1) continue
        glitchCtx.save()
        glitchCtx.beginPath()
        glitchCtx.rect(clipL, sy, clipW, sh)
        glitchCtx.clip()
        glitchCtx.globalAlpha = 1
        glitchCtx.fillStyle = bgColor
        glitchCtx.fillRect(clipL, sy, clipW, sh)
        glitchCtx.fillStyle = inkColor
        glitchCtx.font = fontStr
        glitchCtx.textBaseline = 'middle'
        glitchCtx.textAlign = 'center'
        glitchCtx.fillText('NanoSphere', textX + sdx, textY)
        glitchCtx.restore()
      }

    }

    let last = performance.now(), rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now
      drawRings(now)
      drawSphere(now)
      animateLogo(now)
      drawGlitch(dt)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      logo.removeEventListener('mouseenter', onMouseEnter)
      logo.removeEventListener('mouseleave', onMouseLeave)
      logo.removeEventListener('touchstart', onTouchStart)
      if (gAutoStopId !== null) clearTimeout(gAutoStopId)
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
            position: 'relative',
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
          <canvas
            ref={glitchRef}
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        </div>
      </div>
    </main>
  )
}
