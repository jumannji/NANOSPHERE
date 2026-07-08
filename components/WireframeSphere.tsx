'use client'

import { useEffect, useRef } from 'react'

// Identical geometry/projection to the homepage sphere (HeroCanvas.tsx)
const SPHERE_CIRCLES = (() => {
  const arr: { pts: number[][] }[] = []
  const segs = 72
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

// Resolves any CSS color value (hex, rgb(), custom-property shorthand
// like "18,18,20") to a plain "r,g,b" triple usable inside rgba(...).
function resolveRgbTriple(raw: string): string {
  if (/^\d+\s*,\s*\d+\s*,\s*\d+$/.test(raw)) return raw
  const probe = document.createElement('span')
  probe.style.color = raw
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const resolved = getComputedStyle(probe).color
  document.body.removeChild(probe)
  const m = resolved.match(/(\d+),\s*(\d+),\s*(\d+)/)
  return m ? `${m[1]},${m[2]},${m[3]}` : '255,255,255'
}

interface Props {
  size: number
  className?: string
  /** CSS custom property supplying the line color — defaults to the
   *  homepage sphere's dark-on-light tone. Pass '--bg' when placing the
   *  sphere over a dark panel so it stays legible (matches the existing
   *  cover-text pattern of using --bg as the accent color on dark ink). */
  colorVar?: string
}

export default function WireframeSphere({ size, className, colorVar = '--sphere-rgb' }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = size * DPR
    canvas.height = size * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const raw = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim()
    const sphereRgb = raw ? resolveRgbTriple(raw) : '18,18,20'

    const cx = size / 2, cy = size / 2, R = size * 0.42

    let rafId = 0
    function frame(t: number) {
      ctx.clearRect(0, 0, size, size)
      const ay = t * 0.00012, ax = Math.sin(t * 0.00007) * 0.28
      const cy_ = Math.cos(ay), sy_ = Math.sin(ay)
      const cx_ = Math.cos(ax), sx_ = Math.sin(ax)

      function proj(p: number[]) {
        let x = p[0]*cy_ + p[2]*sy_, z = -p[0]*sy_ + p[2]*cy_
        let y = p[1]*cx_ - z*sx_;    z = p[1]*sx_ + z*cx_
        return { x: cx + x*R, y: cy + y*R, z }
      }

      ctx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const proj_ = c.pts.map(proj)
        for (let i = 0; i < proj_.length; i++) {
          const a = proj_[i], b = proj_[(i + 1) % proj_.length]
          const op = 0.03 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.22
          ctx.strokeStyle = `rgba(${sphereRgb},${op.toFixed(3)})`
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }
      ctx.strokeStyle = `rgba(${sphereRgb},0.32)`
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke()

      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [size, colorVar])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
