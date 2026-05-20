'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { subscribeNav } from '@/lib/navTransition'
import type { NavConfig } from '@/lib/navTransition'

// ── Sphere geometry (identical to NavSphere) ──────────────────────────────────
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
const TOTAL_MS = 800   // total animation (sine arch: 0 → peak → 0)
const NAV_MS   = 360   // navigate just before peak (400ms midpoint)

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

    // Capture theme colors now, before navigation changes the page
    const cs      = getComputedStyle(document.documentElement)
    const bgColor = cs.getPropertyValue('--bg').trim() || '#f0ece0'
    const srgb    = cs.getPropertyValue('--sphere-rgb').trim() || '18,18,20'
    const sparts  = srgb.split(',')
    const sr      = Number(sparts[0])
    const sg      = Number(sparts[1])
    const sb      = Number(sparts[2])

    // Radius to reach the farthest corner from dead-center
    const maxR = Math.sqrt(cx * cx + cy * cy) * 1.04

    const start = performance.now()
    let rafId   = 0

    const draw = (now: number) => {
      const tNorm = Math.min((now - start) / TOTAL_MS, 1)

      // Sine arch: 0 at t=0, peak at t=0.5, 0 at t=1 — smooth in and out
      const R = Math.sin(tNorm * Math.PI) * maxR

      ctx.clearRect(0, 0, vw, vh)

      if (R > 0.5) {
        // ── Filled circle in current theme background ─────────────────────
        ctx.fillStyle = bgColor
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.fill()

        // ── Wireframe sphere clipped inside the circle ────────────────────
        ctx.save()
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.clip()

        const sphereR = R * 0.86
        const ay      = now * 0.00012
        const ax      = Math.sin(now * 0.00007) * 0.28
        const cosY    = Math.cos(ay), sinY = Math.sin(ay)
        const cosX    = Math.cos(ax), sinX = Math.sin(ax)

        const proj = (p: number[]) => {
          const rx = p[0] * cosY + p[2] * sinY
          let   rz = -p[0] * sinY + p[2] * cosY
          const ry = p[1] * cosX - rz * sinX
          rz        = p[1] * sinX + rz * cosX
          return { x: cx + rx * sphereR, y: cy + ry * sphereR, z: rz }
        }

        ctx.lineWidth = 0.8
        for (const c of SPHERE_CIRCLES) {
          const pts = c.pts.map(proj)
          for (let i = 0; i < pts.length; i++) {
            const a  = pts[i]
            const b  = pts[(i + 1) % pts.length]
            // Depth-based opacity — higher range than NavSphere for visibility
            const op = 0.06 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.42
            ctx.strokeStyle = `rgba(${sr},${sg},${sb},${op.toFixed(3)})`
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }

        // Outer ring at sphere equator
        ctx.strokeStyle = `rgba(${sr},${sg},${sb},0.4)`
        ctx.lineWidth   = 1
        ctx.beginPath()
        ctx.arc(cx, cy, sphereR, 0, Math.PI * 2)
        ctx.stroke()

        ctx.restore()
      }

      if (tNorm < 1) {
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
