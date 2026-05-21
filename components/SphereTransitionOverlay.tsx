'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { subscribeNav } from '@/lib/navTransition'
import type { NavConfig } from '@/lib/navTransition'

// ── Sphere geometry ───────────────────────────────────────────────────────────
const SEGS = 64
const SPHERE_CIRCLES = (() => {
  const arr: { pts: number[][] }[] = []
  for (let i = 0; i < 9; i++) {
    const theta = (i / 9) * Math.PI
    const pts: number[][] = []
    for (let s = 0; s < SEGS; s++) {
      const u = (s / SEGS) * Math.PI * 2
      pts.push([Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)])
    }
    arr.push({ pts })
  }
  for (const ly of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
    const r = Math.sqrt(1 - ly * ly)
    const pts: number[][] = []
    for (let s = 0; s < SEGS; s++) {
      const u = (s / SEGS) * Math.PI * 2
      pts.push([Math.cos(u) * r, ly, Math.sin(u) * r])
    }
    arr.push({ pts })
  }
  return arr
})()

// ── Shared types ──────────────────────────────────────────────────────────────
interface OverlayProps { config: NavConfig; onDone: () => void }

// ── FadeOverlay — inner pages ─────────────────────────────────────────────────
// Total ~420ms: fade to black (200ms), navigate at 190ms, fade out (200ms)
function FadeOverlay({ config, onDone }: OverlayProps) {
  const router    = useRouter()
  const navigated = useRef(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Double-rAF ensures the initial opacity:0 renders before transitioning
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setDark(true))
    )
    const t1 = setTimeout(() => {
      if (!navigated.current) { navigated.current = true; router.push(config.href) }
    }, 190)
    const t2 = setTimeout(() => setDark(false), 210)
    const t3 = setTimeout(onDone, 420)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      zIndex:     9999,
      pointerEvents: 'none',
      background: '#000',
      opacity:    dark ? 1 : 0,
      transition: 'opacity 200ms ease',
    }} />
  )
}

// ── SpinOverlay — homepage only ───────────────────────────────────────────────
// Sphere accelerates 0→800ms, background darkens; navigate at 660ms, then fade out
const SPIN_DUR = 800   // ms of spin-up
const NAV_AT   = 660   // ms when router.push fires
const FADE_OUT = 350   // ms for CSS fade-out after spin
const BASE_SPEED = 0.00010  // rad/ms at t=0
const PEAK_SPEED = 0.00110  // rad/ms at t=1 (11× faster)

function SpinOverlay({ config, onDone }: OverlayProps) {
  const router    = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigated = useRef(false)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const DPR    = Math.min(window.devicePixelRatio || 1, 2)
    const vw     = window.innerWidth
    const vh     = window.innerHeight
    const cx     = vw / 2
    const cy     = vh / 2
    const maxR   = Math.sqrt(cx * cx + cy * cy) * 1.06

    canvas.width        = vw * DPR
    canvas.height       = vh * DPR
    canvas.style.width  = `${vw}px`
    canvas.style.height = `${vh}px`
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const start   = performance.now()
    let   angle   = 0
    let   lastNow = start
    let   rafId   = 0

    const draw = (now: number) => {
      const elapsed = now - start
      const t = Math.min(elapsed / SPIN_DUR, 1)

      // Quadratic speed ramp: speed = BASE + (PEAK-BASE)*t²
      const speed = BASE_SPEED + (PEAK_SPEED - BASE_SPEED) * t * t
      angle += speed * (now - lastNow)
      lastNow = now

      // Background darkens from 18% → 90%
      const bgAlpha = 0.18 + 0.72 * t
      ctx.clearRect(0, 0, vw, vh)
      ctx.fillStyle = `rgba(0,0,0,${bgAlpha.toFixed(3)})`
      ctx.fillRect(0, 0, vw, vh)

      // Sphere lines (white, depth-shaded)
      const ax   = Math.sin(now * 0.00005) * 0.18
      const ay   = angle
      const cosY = Math.cos(ay), sinY = Math.sin(ay)
      const cosX = Math.cos(ax), sinX = Math.sin(ax)

      const proj = (p: number[]) => {
        const rx  = p[0] * cosY + p[2] * sinY
        let   rz  = -p[0] * sinY + p[2] * cosY
        const ry  = p[1] * cosX - rz * sinX
        rz         = p[1] * sinX + rz * cosX
        return { x: cx + rx * maxR, y: cy + ry * maxR, z: rz }
      }

      ctx.lineWidth = 1.1
      for (const c of SPHERE_CIRCLES) {
        const pts = c.pts.map(proj)
        for (let i = 0; i < pts.length; i++) {
          const a  = pts[i]
          const b  = pts[(i + 1) % pts.length]
          const op = 0.10 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.55
          ctx.strokeStyle = `rgba(255,255,255,${op.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }

      if (elapsed < SPIN_DUR) {
        rafId = requestAnimationFrame(draw)
      } else {
        setFading(true)
        setTimeout(onDone, FADE_OUT)
      }
    }

    rafId = requestAnimationFrame(draw)

    const navTimer = setTimeout(() => {
      if (!navigated.current) { navigated.current = true; router.push(config.href) }
    }, NAV_AT)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(navTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position:   'fixed',
      inset:      0,
      zIndex:     9999,
      pointerEvents: 'none',
      opacity:    fading ? 0 : 1,
      transition: fading ? `opacity ${FADE_OUT}ms ease` : 'none',
    }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

// ── Root component ────────────────────────────────────────────────────────────
export default function SphereTransitionOverlay() {
  const [config,  setConfig ] = useState<NavConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribeNav(cfg => setConfig(cfg))
  }, [])

  if (!mounted || !config) return null

  const Overlay = config.fromHome ? SpinOverlay : FadeOverlay

  return createPortal(
    <Overlay
      key={`${config.href}:${Date.now()}`}
      config={config}
      onDone={() => setConfig(null)}
    />,
    document.body
  )
}
