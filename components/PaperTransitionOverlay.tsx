'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { subscribePaper } from '@/lib/paperTransition'
import type { PaperConfig } from '@/lib/paperTransition'

// ── Timing ────────────────────────────────────────────────────────────────────
const ANIM_MS  = 2400   // canvas t: 0 → 1
const TITLE_MS = 1950   // article title fades in
const NAV_MS   = 2250   // router.push
const FADE_MS  = 2550   // overlay fades out
const DONE_MS  = 3000   // unmount

// ── Geometry ──────────────────────────────────────────────────────────────────

// Four wedge panels radiating from origin; each ~126° wide, overlapping → full 360° coverage
const PANELS = [
  { start: 0,             sweep: Math.PI * 0.70, delay: 0.00 },
  { start: Math.PI * 0.6, sweep: Math.PI * 0.70, delay: 0.06 },
  { start: Math.PI * 1.2, sweep: Math.PI * 0.70, delay: 0.12 },
  { start: Math.PI * 1.8, sweep: Math.PI * 0.70, delay: 0.04 },
]

// Six crease lines at fold boundaries (evenly distributed)
const CREASES = Array.from({ length: 6 }, (_, i) => ({
  angle: (i / 6) * Math.PI * 2,
  delay: i * 0.022,
}))

// ── Easing ────────────────────────────────────────────────────────────────────
const easeOut3    = (t: number) => 1 - Math.pow(1 - t, 3)
const easeOutExpo = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t)

// ── Overlay ───────────────────────────────────────────────────────────────────

interface OverlayProps { config: PaperConfig; onDone: () => void }

function DigitalFoldOverlay({ config, onDone }: OverlayProps) {
  const router    = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigated = useRef(false)
  const [showTitle, setShowTitle] = useState(false)
  const [fading,    setFading   ] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const DPR    = Math.min(window.devicePixelRatio || 1, 2)
    const vw     = window.innerWidth
    const vh     = window.innerHeight

    canvas.width        = vw * DPR
    canvas.height       = vh * DPR
    canvas.style.width  = `${vw}px`
    canvas.style.height = `${vh}px`
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    // ── Theme colors ─────────────────────────────────────────────────────────
    const cs      = getComputedStyle(document.documentElement)
    const bgColor = cs.getPropertyValue('--bg').trim() || '#f0ece0'
    const srgb    = cs.getPropertyValue('--sphere-rgb').trim() || '18,18,20'
    const parts   = srgb.split(',')
    const cr      = Number(parts[0])
    const cg      = Number(parts[1])
    const cb      = Number(parts[2])

    // ── Origin (center of clicked sphere) ────────────────────────────────────
    const ox = config.origin.left + config.origin.width  / 2
    const oy = config.origin.top  + config.origin.height / 2

    const maxDist = Math.max(
      Math.hypot(ox,      oy     ),
      Math.hypot(vw - ox, oy     ),
      Math.hypot(ox,      vh - oy),
      Math.hypot(vw - ox, vh - oy),
    ) * 1.06

    // ── Stable pixel noise (pre-allocated, changes every glitch frame) ────────
    const NOISE = new Float32Array(1024)
    for (let i = 0; i < NOISE.length; i++) NOISE[i] = Math.random()

    const start = performance.now()
    let rafId   = 0

    const draw = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / ANIM_MS, 1)

      ctx.clearRect(0, 0, vw, vh)

      // 1 ── Origin burst ─────────────────────────────────────────────────────
      if (t < 0.14) {
        const bt  = t / 0.14
        ctx.strokeStyle = `rgba(${cr},${cg},${cb},${((1 - bt) * 0.9).toFixed(3)})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(ox, oy, bt * 30, 0, Math.PI * 2)
        ctx.stroke()
        if (bt > 0.28) {
          const bt2 = (bt - 0.28) / 0.72
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${((1 - bt2) * 0.45).toFixed(3)})`
          ctx.lineWidth = 1
          ctx.beginPath()
          ctx.arc(ox, oy, bt2 * 18, 0, Math.PI * 2)
          ctx.stroke()
        }
      }

      // 2 ── Wedge panels expanding from origin ──────────────────────────────
      ctx.fillStyle = bgColor
      for (const p of PANELS) {
        const pt = Math.max(0, Math.min(1, (t - p.delay) / 0.60))
        if (pt === 0) continue
        const dist = easeOutExpo(pt) * maxDist

        ctx.beginPath()
        ctx.moveTo(ox, oy)
        for (let s = 0; s <= 40; s++) {
          const a = p.start + (p.sweep / 40) * s
          ctx.lineTo(ox + Math.cos(a) * dist, oy + Math.sin(a) * dist)
        }
        ctx.closePath()
        ctx.fill()
      }

      // 3 ── Full fill once panels converge ──────────────────────────────────
      if (t > 0.68) {
        const ft = easeOut3(Math.min(1, (t - 0.68) / 0.22))
        ctx.globalAlpha = ft
        ctx.fillStyle   = bgColor
        ctx.fillRect(0, 0, vw, vh)
        ctx.globalAlpha = 1
      }

      // 4 ── Crease lines with pixel noise ───────────────────────────────────
      for (let i = 0; i < CREASES.length; i++) {
        const c  = CREASES[i]
        const ct = Math.max(0, Math.min(1, (t - c.delay) / 0.50))
        if (ct === 0) continue

        const dist = easeOutExpo(ct) * maxDist
        const ex   = ox + Math.cos(c.angle) * dist
        const ey   = oy + Math.sin(c.angle) * dist

        const lineOp = ct < 0.55 ? ct / 0.55 : 1 - (ct - 0.55) / 0.45
        if (lineOp > 0.005) {
          ctx.strokeStyle = `rgba(${cr},${cg},${cb},${(lineOp * 0.88).toFixed(3)})`
          ctx.lineWidth   = 1.5
          ctx.beginPath()
          ctx.moveTo(ox, oy)
          ctx.lineTo(ex, ey)
          ctx.stroke()

          // Pixel noise scattered along each crease
          const spacing = 8
          const steps   = Math.min(110, Math.floor(dist / spacing))
          for (let n = 0; n < steps; n++) {
            const ni   = (i * 128 + n * 5) & 1023
            const frac = n / steps
            const lx   = ox + Math.cos(c.angle) * frac * dist
            const ly   = oy + Math.sin(c.angle) * frac * dist
            const px   = lx + (NOISE[ni]            - 0.5) * 10
            const py   = ly + (NOISE[(ni + 1) & 1023] - 0.5) * 10
            const pop  = NOISE[(ni + 2) & 1023] * 0.72 * lineOp
            const psz  = NOISE[(ni + 3) & 1023] < 0.11 ? 3 : 1
            ctx.fillStyle = `rgba(${cr},${cg},${cb},${pop.toFixed(3)})`
            ctx.fillRect(Math.round(px), Math.round(py), psz, psz)
          }
        }
      }

      // 5 ── Glitch bars (offset horizontal bands) ───────────────────────────
      if (t > 0.32 && t < 0.90) {
        // Refresh at ~18 fps for a stutter feel
        const frame = Math.floor(elapsed / 55)
        const nBars = 2 + Math.floor(easeOut3(Math.min(1, (t - 0.32) / 0.28)) * 5)
        for (let gi = 0; gi < nBars; gi++) {
          const ni  = ((frame * 13 + gi * 37) & 1023)
          const gy  = NOISE[ni]              * vh
          const gw  = 25 + NOISE[(ni+1)&1023] * 200
          const gx  = NOISE[(ni+2)&1023]      * (vw - gw)
          const gh  = 1 + Math.floor(NOISE[(ni+3)&1023] * 3)
          const gop = NOISE[(ni+4)&1023]      * 0.36
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${gop.toFixed(3)})`
          ctx.fillRect(Math.round(gx), Math.round(gy), Math.round(gw), gh)
        }
      }

      // 6 ── Scanlines across expanding panels ───────────────────────────────
      if (t > 0.08) {
        const st  = Math.min(1, (t - 0.08) / 0.50)
        const sOp = t < 0.78 ? st * 0.055 : (1 - (t - 0.78) / 0.22) * 0.055
        if (sOp > 0.001) {
          ctx.fillStyle = `rgba(${cr},${cg},${cb},${sOp.toFixed(4)})`
          for (let sy = 0; sy < vh; sy += 4) ctx.fillRect(0, sy, vw, 1)
        }
      }

      if (t < 1) rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)

    const t1 = setTimeout(() => setShowTitle(true), TITLE_MS)
    const t2 = setTimeout(() => {
      if (!navigated.current) { navigated.current = true; router.push(config.href) }
    }, NAV_MS)
    const t3 = setTimeout(() => setFading(true), FADE_MS)
    const t4 = setTimeout(onDone, DONE_MS)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9998,
      cursor: 'default',
      opacity: fading ? 0 : 1,
      transition: fading ? 'opacity 400ms ease' : 'none',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Article title — fades in once screen is fully covered */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 10vw',
        pointerEvents: 'none',
        opacity: showTitle ? 0.88 : 0,
        transform: showTitle ? 'none' : 'translateY(14px)',
        transition: 'opacity 0.5s ease, transform 0.65s cubic-bezier(0.22, 1, 0.36, 1)',
      }}>
        <h1 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontWeight: 400,
          fontSize: 'clamp(38px, 6.5vw, 92px)',
          letterSpacing: '0.04em',
          color: 'var(--ink)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.1,
        }}>
          {config.title}
        </h1>
      </div>
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────

export default function PaperTransitionOverlay() {
  const [config,  setConfig ] = useState<PaperConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribePaper(cfg => setConfig(cfg))
  }, [])

  if (!mounted || !config) return null

  return createPortal(
    <DigitalFoldOverlay
      key={`${config.href}:${config.origin.left}:${config.origin.top}`}
      config={config}
      onDone={() => setConfig(null)}
    />,
    document.body
  )
}
