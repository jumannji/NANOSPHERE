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

// ── Timing ────────────────────────────────────────────────────────────────────
const EXPAND_MS   = 520   // sphere lines grow outward
const CONTRACT_MS = 780   // sphere lines retract
const TOTAL_MS    = EXPAND_MS + CONTRACT_MS  // 1300ms total
const NAV_MS      = 460   // navigate while expanding (before peak)

// Smooth one-directional easing — no bounce
function easeOut(t: number): number { return 1 - Math.pow(1 - t, 3) }
function easeIn(t: number):  number { return t * t * t }

// ── Overlay ───────────────────────────────────────────────────────────────────
interface OverlayProps { config: NavConfig; onDone: () => void }

function SphereOverlay({ config, onDone }: OverlayProps) {
  const router    = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const navigated = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const DPR    = Math.min(window.devicePixelRatio || 1, 2)
    const vw     = window.innerWidth
    const vh     = window.innerHeight
    const cx     = vw / 2
    const cy     = vh / 2

    canvas.width        = vw * DPR
    canvas.height       = vh * DPR
    canvas.style.width  = `${vw}px`
    canvas.style.height = `${vh}px`
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    // Capture theme line color before navigation changes the page
    const cs   = getComputedStyle(document.documentElement)
    const srgb = cs.getPropertyValue('--sphere-rgb').trim() || '200,200,200'
    const [sr, sg, sb] = srgb.split(',').map(Number)

    // Radius needed to reach the farthest viewport corner from center
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.06

    const start = performance.now()
    let rafId   = 0

    const draw = (now: number) => {
      const elapsed = now - start

      // Expand with easeOut, contract with easeIn — no bounce
      let R: number
      if (elapsed < EXPAND_MS) {
        R = maxR * easeOut(Math.min(elapsed / EXPAND_MS, 1))
      } else {
        const t2 = Math.min((elapsed - EXPAND_MS) / CONTRACT_MS, 1)
        R = maxR * (1 - easeIn(t2))
      }

      ctx.clearRect(0, 0, vw, vh)

      if (R > 1) {
        // Slow, graceful rotation
        const ay   = now * 0.00009
        const ax   = Math.sin(now * 0.00005) * 0.20
        const cosY = Math.cos(ay), sinY = Math.sin(ay)
        const cosX = Math.cos(ax), sinX = Math.sin(ax)

        const proj = (p: number[]) => {
          const rx  = p[0] * cosY + p[2] * sinY
          let   rz  = -p[0] * sinY + p[2] * cosY
          const ry  = p[1] * cosX - rz * sinX
          rz         = p[1] * sinX + rz * cosX
          return { x: cx + rx * R, y: cy + ry * R, z: rz }
        }

        ctx.lineWidth = 1.1
        for (const c of SPHERE_CIRCLES) {
          const pts = c.pts.map(proj)
          for (let i = 0; i < pts.length; i++) {
            const a  = pts[i]
            const b  = pts[(i + 1) % pts.length]
            // Depth-based opacity: lines facing viewer are brighter
            const op = 0.12 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.55
            ctx.strokeStyle = `rgba(${sr},${sg},${sb},${op.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      if (elapsed < TOTAL_MS) {
        rafId = requestAnimationFrame(draw)
      } else {
        onDone()
      }
    }

    rafId = requestAnimationFrame(draw)

    const navTimer = setTimeout(() => {
      if (!navigated.current) {
        navigated.current = true
        router.push(config.href)
      }
    }, NAV_MS)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(navTimer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  )
}

// ── Root component ─────────────────────────────────────────────────────────────
export default function SphereTransitionOverlay() {
  const [config,  setConfig ] = useState<NavConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribeNav(cfg => setConfig(cfg))
  }, [])

  if (!mounted || !config) return null

  return createPortal(
    <SphereOverlay
      key={`${config.href}:${Date.now()}`}
      config={config}
      onDone={() => setConfig(null)}
    />,
    document.body
  )
}
