'use client'

import { useEffect, useRef } from 'react'

// ── Sphere geometry — identical to HeroCanvas's homepage sphere ─────────────
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

const TEXT_A = 'NanoBazaar'
const TEXT_B = 'Coming Soon'

// ── Phase timeline (ms from mount) ───────────────────────────────────────────
const T_GLITCH1_END      = 2000                          // "NanoBazaar" glitches
const T_MORPH_START      = T_GLITCH1_END
const T_MORPH_SWAP       = T_MORPH_START + 260            // text swaps mid-burst
const T_MORPH_END        = T_MORPH_START + 550
const T_IDLE_END         = T_MORPH_END + 2000             // clean "Coming Soon" for 2s
const T_GLITCH2_START    = T_IDLE_END
const T_GLITCH2_END      = T_GLITCH2_START + 1600         // intensifying glitch
const T_CONVERGE_START   = T_GLITCH2_END
const T_CONVERGE_END     = T_CONVERGE_START + 900         // particles rush inward
const T_FLASH_END        = T_CONVERGE_END + 200
const T_SPHERE_GROW_END  = T_FLASH_END + 650

function ease3(t: number) { return t * t * t }
function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }

export default function BazaarComingSoon() {
  const wrapRef   = useRef<HTMLDivElement>(null)
  const spanRef   = useRef<HTMLSpanElement>(null)
  const glitchRef = useRef<HTMLCanvasElement>(null)
  const fxRef     = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const wrap    = wrapRef.current!
    const span    = spanRef.current!
    const glitchC = glitchRef.current!
    const fxC     = fxRef.current!
    const gctx    = glitchC.getContext('2d')!
    const fctx    = fxC.getContext('2d')!

    let W = 0, H = 0, DPR = 1, lW = 0, lH = 0

    function resize() {
      DPR = Math.min(window.devicePixelRatio || 1, 2)
      W = window.innerWidth
      H = window.innerHeight
      fxC.width  = Math.floor(W * DPR); fxC.height = Math.floor(H * DPR)
      fxC.style.width = W + 'px';       fxC.style.height = H + 'px'
      fctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      resizeGlitch()
    }

    function resizeGlitch() {
      lW = wrap.offsetWidth; lH = wrap.offsetHeight
      glitchC.width  = Math.floor(lW * DPR)
      glitchC.height = Math.floor(lH * DPR)
      glitchC.style.width  = lW + 'px'
      glitchC.style.height = lH + 'px'
      gctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }

    resize()
    window.addEventListener('resize', resize)

    let fontStr = '', bgColor = '', inkColor = '', sphereRgb = '18,18,20'
    document.fonts.ready.then(() => {
      const cs = getComputedStyle(span)
      fontStr   = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
      bgColor   = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f7c500'
      inkColor  = cs.color
      sphereRgb = getComputedStyle(document.documentElement).getPropertyValue('--sphere-rgb').trim() || '18,18,20'
      resizeGlitch()
    })

    // ── Glitch strip state (chromatic aberration + scan-line tears) ──────────
    let gStrips: { y: number; h: number; dx: number }[] = []
    let gStripAge = 0
    let gStripMs  = 60

    function regenStrips(I: number) {
      const cI = Math.min(I, 1.7)
      const count = 3 + Math.floor(Math.random() * 5 * cI)
      gStrips = []
      for (let i = 0; i < count; i++) {
        gStrips.push({
          y:  Math.random() * lH,
          h:  1 + Math.random() * Math.max(1, lH * 0.07 * cI),
          dx: (Math.random() - 0.5) * 22 * cI,
        })
      }
      gStripMs = Math.max(14, 70 - cI * 40)
    }

    function drawGlitchText(dt: number, text: string, I: number, altText?: string, altProb = 0) {
      gctx.clearRect(0, 0, lW, lH)
      if (I <= 0.004 || !fontStr) return

      gStripAge += dt
      if (gStripAge >= gStripMs || gStrips.length === 0) { gStripAge = 0; regenStrips(I) }

      const cI = Math.min(I, 1.7)
      const chromShift = Math.round(4 + cI * 14)
      const textX = lW / 2, textY = lH / 2

      gctx.textBaseline = 'middle'
      gctx.textAlign = 'center'
      gctx.font = fontStr

      // Chromatic aberration — red channel
      gctx.save()
      gctx.globalAlpha = Math.min(1, I) * 0.55
      gctx.fillStyle = 'rgba(255,0,60,1)'
      gctx.fillText(text, textX - chromShift, textY)
      gctx.restore()

      // Chromatic aberration — cyan channel
      gctx.save()
      gctx.globalAlpha = Math.min(1, I) * 0.55
      gctx.fillStyle = 'rgba(0,220,255,1)'
      gctx.fillText(text, textX + chromShift, textY)
      gctx.restore()

      // Scan-line tears — each strip repaints over the base text with a
      // horizontal offset; occasionally swaps in altText during the morph
      // burst so the two strings appear to bleed into one another.
      for (const strip of gStrips) {
        const useAlt = altText && Math.random() < altProb
        gctx.save()
        gctx.beginPath()
        gctx.rect(0, strip.y, lW, strip.h)
        gctx.clip()
        gctx.fillStyle = bgColor
        gctx.fillRect(0, strip.y, lW, strip.h)
        gctx.fillStyle = inkColor
        gctx.fillText(useAlt ? altText! : text, textX + strip.dx, textY)
        gctx.restore()
      }
    }

    // ── Particle convergence state ────────────────────────────────────────
    type Particle = { sx: number; sy: number; size: number; color: string; delay: number }
    let particles: Particle[] = []
    let particlesSpawned = false

    function spawnParticles() {
      particlesSpawned = true
      const rect = wrap.getBoundingClientRect()
      const n = 70
      particles = []
      for (let i = 0; i < n; i++) {
        const sx = rect.left + Math.random() * rect.width
        const sy = rect.top + rect.height / 2 + (Math.random() - 0.5) * rect.height * 1.6
        const roll = Math.random()
        particles.push({
          sx, sy,
          size: 1.5 + Math.random() * 3.5,
          color: roll < 0.3 ? '255,0,60' : roll < 0.6 ? '0,220,255' : sphereRgb,
          delay: Math.random() * 250,
        })
      }
    }

    function drawSphere(t: number, cx: number, cy: number, scale: number) {
      const R = Math.min(W, H) * 0.38 * scale
      if (R <= 0) return
      const ay = t * 0.00012, ax = Math.sin(t * 0.00007) * 0.28
      const cy_ = Math.cos(ay), sy_ = Math.sin(ay)
      const cx_ = Math.cos(ax), sx_ = Math.sin(ax)
      function proj(p: number[]) {
        let x = p[0] * cy_ + p[2] * sy_, z = -p[0] * sy_ + p[2] * cy_
        let y = p[1] * cx_ - z * sx_;    z = p[1] * sx_ + z * cx_
        return { x: cx + x * R, y: cy + y * R, z }
      }
      fctx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const proj_ = c.pts.map(proj)
        for (let i = 0; i < proj_.length; i++) {
          const a = proj_[i], b = proj_[(i + 1) % proj_.length]
          const op = (0.03 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.22) * scale
          fctx.strokeStyle = `rgba(${sphereRgb},${op.toFixed(3)})`
          fctx.beginPath(); fctx.moveTo(a.x, a.y); fctx.lineTo(b.x, b.y); fctx.stroke()
        }
      }
      fctx.strokeStyle = `rgba(${sphereRgb},${(0.32 * scale).toFixed(3)})`
      fctx.beginPath(); fctx.arc(cx, cy, R, 0, Math.PI * 2); fctx.stroke()
    }

    let start: number | null = null
    let last = 0
    let rafId = 0
    let swapped = false

    function frame(now: number) {
      if (start === null) { start = now; last = now }
      const elapsed = now - start
      const dt = Math.min(50, now - last)
      last = now

      let curText = TEXT_A
      let I = 0
      let altText: string | undefined
      let altProb = 0
      let jitter = 0

      // Guaranteed exactly once, regardless of which phase branch a dropped
      // frame (e.g. backgrounded tab) happens to land in first.
      if (!swapped && elapsed >= T_MORPH_SWAP) {
        span.textContent = TEXT_B
        resizeGlitch()
        swapped = true
      }

      if (elapsed < T_GLITCH1_END) {
        curText = TEXT_A
        I = Math.min(1, elapsed / 350) * (0.85 + 0.15 * Math.sin(elapsed * 0.02))
        span.style.opacity = '1'
        jitter = I
      } else if (elapsed < T_MORPH_END) {
        const p = (elapsed - T_MORPH_START) / (T_MORPH_END - T_MORPH_START)
        I = 1 + Math.sin(p * Math.PI) * 0.6
        span.style.opacity = '1'
        if (elapsed < T_MORPH_SWAP) {
          curText = TEXT_A; altText = TEXT_B; altProb = p * 1.4
        } else {
          curText = TEXT_B; altText = TEXT_A
          const q = (elapsed - T_MORPH_SWAP) / (T_MORPH_END - T_MORPH_SWAP)
          altProb = Math.max(0, (1 - q) * 0.8)
        }
        jitter = I
      } else if (elapsed < T_IDLE_END) {
        curText = TEXT_B
        I = 0
        span.style.opacity = '1'
        span.style.transform = ''
      } else if (elapsed < T_GLITCH2_END) {
        curText = TEXT_B
        const p = (elapsed - T_GLITCH2_START) / (T_GLITCH2_END - T_GLITCH2_START)
        I = Math.min(1.7, p * p * 2.0)
        span.style.opacity = String(Math.max(0, 1 - Math.max(0, p - 0.7) / 0.3))
        jitter = I
      } else {
        span.style.opacity = '0'
        I = 0
      }

      if (elapsed < T_GLITCH2_END + 60) {
        drawGlitchText(dt, curText, I, altText, altProb)
        if (jitter > 0.15) {
          const cI = Math.min(jitter, 1.7)
          const jx = (Math.random() - 0.5) * cI * 3
          const jy = (Math.random() - 0.5) * cI * 2
          span.style.transform = `translate(${jx.toFixed(1)}px,${jy.toFixed(1)}px)`
        } else {
          span.style.transform = ''
        }
      } else {
        gctx.clearRect(0, 0, lW, lH)
      }

      fctx.clearRect(0, 0, W, H)
      const cx = W / 2, cy = H / 2

      if (elapsed >= T_CONVERGE_START && elapsed < T_CONVERGE_END) {
        if (!particlesSpawned) spawnParticles()
        const pElapsed = elapsed - T_CONVERGE_START
        const total = T_CONVERGE_END - T_CONVERGE_START
        for (const p of particles) {
          const lt = Math.max(0, Math.min(1, (pElapsed - p.delay) / (total - p.delay)))
          const e = ease3(lt)
          const x = p.sx + (cx - p.sx) * e
          const y = p.sy + (cy - p.sy) * e
          const trailE = Math.max(0, e - 0.08)
          const tx = p.sx + (cx - p.sx) * trailE
          const ty = p.sy + (cy - p.sy) * trailE
          const alpha = lt < 0.05 ? lt / 0.05 : Math.max(0, 1 - lt * 0.4)
          const size = Math.max(0.4, p.size * (1 - lt * 0.7))

          fctx.strokeStyle = `rgba(${p.color},${(alpha * 0.5).toFixed(2)})`
          fctx.lineWidth = 0.6
          fctx.beginPath(); fctx.moveTo(tx, ty); fctx.lineTo(x, y); fctx.stroke()

          fctx.fillStyle = `rgba(${p.color},${alpha.toFixed(2)})`
          fctx.fillRect(x - size / 2, y - size / 2, size, size)
        }
      }

      if (elapsed >= T_CONVERGE_END) {
        if (elapsed < T_FLASH_END) {
          const fp = (elapsed - T_CONVERGE_END) / (T_FLASH_END - T_CONVERGE_END)
          const rad = 4 + fp * 44
          fctx.save()
          fctx.globalAlpha = Math.max(0, 1 - fp)
          fctx.fillStyle = `rgba(${sphereRgb},1)`
          fctx.beginPath(); fctx.arc(cx, cy, rad, 0, Math.PI * 2); fctx.fill()
          fctx.restore()
        }

        const growP = Math.max(0, Math.min(1, (elapsed - T_FLASH_END) / (T_SPHERE_GROW_END - T_FLASH_END)))
        if (growP > 0) drawSphere(elapsed, cx, cy, easeOutCubic(growP))
      }

      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <main
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={fxRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />
      <div style={{ position: 'relative', zIndex: 3, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <div
          ref={wrapRef}
          style={{
            position: 'relative',
            fontFamily: 'var(--font-press-start), var(--font-italiana), serif',
            fontWeight: 400,
            fontSize: 'clamp(12px, 8vw, 100px)',
            letterSpacing: '0',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            padding: '0.2em 0.4em',
          }}
        >
          <span
            ref={spanRef}
            style={{
              position: 'relative',
              display: 'inline-block',
              color: 'var(--logo-ink)',
              willChange: 'transform, opacity',
            }}
          >
            {TEXT_A}
          </span>
          <canvas
            ref={glitchRef}
            style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}
          />
        </div>
      </div>
    </main>
  )
}
