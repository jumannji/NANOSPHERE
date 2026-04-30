'use client'

import { useEffect, useRef } from 'react'

const SEGS = 72

const CIRCLES = (() => {
  const arr: { pts: [number, number, number][] }[] = []
  for (let i = 0; i < 9; i++) {
    const theta = (i / 9) * Math.PI
    const pts: [number, number, number][] = []
    for (let s = 0; s < SEGS; s++) {
      const u = (s / SEGS) * Math.PI * 2
      pts.push([Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)])
    }
    arr.push({ pts })
  }
  for (const ly of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
    const r = Math.sqrt(1 - ly * ly)
    const pts: [number, number, number][] = []
    for (let s = 0; s < SEGS; s++) {
      const u = (s / SEGS) * Math.PI * 2
      pts.push([Math.cos(u) * r, ly, Math.sin(u) * r])
    }
    arr.push({ pts })
  }
  return arr
})()

// Colors to cycle through: yellow, mint, red, green, electric blue, magenta
const PALETTE: [number, number, number][] = [
  [247, 197,   0],
  [200, 255, 251],
  [255,  60,  60],
  [ 49, 152,  34],
  [  0, 180, 255],
  [255,  80, 220],
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

interface Props { size?: number }

export default function BazaarSphere({ size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = size * DPR
    canvas.height = size * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const cx = size / 2, cy = size / 2, R = size * 0.43

    let rafId = 0

    function frame(t: number) {
      ctx.clearRect(0, 0, size, size)

      // Rotation
      const ay = t * 0.00016
      const ax = Math.sin(t * 0.000093) * 0.32
      const cosY = Math.cos(ay), sinY = Math.sin(ay)
      const cosX = Math.cos(ax), sinX = Math.sin(ax)

      function proj(p: [number, number, number]) {
        let x = p[0] * cosY + p[2] * sinY
        let z = -p[0] * sinY + p[2] * cosY
        let y = p[1] * cosX - z * sinX
        z = p[1] * sinX + z * cosX
        return { x: cx + x * R, y: cy + y * R, z }
      }

      // Color cycling — smooth interpolation between palette entries
      const colorT = (t * 0.00085) % PALETTE.length
      const ci = Math.floor(colorT) % PALETTE.length
      const cn = (ci + 1) % PALETTE.length
      const frac = colorT - Math.floor(colorT)
      const ease = frac < 0.5 ? 2 * frac * frac : 1 - 2 * (1 - frac) * (1 - frac)

      const cr = lerp(PALETTE[ci][0], PALETTE[cn][0], ease)
      const cg = lerp(PALETTE[ci][1], PALETTE[cn][1], ease)
      const cb = lerp(PALETTE[ci][2], PALETTE[cn][2], ease)

      // Subtle intensity flicker for electric feel
      const flicker = 0.88 + 0.12 * Math.sin(t * 0.047) * Math.cos(t * 0.031)

      const r = Math.round(cr)
      const g = Math.round(cg)
      const b = Math.round(cb)

      // Glow via shadowBlur
      ctx.shadowColor = `rgba(${r},${g},${b},0.85)`
      ctx.shadowBlur = size * 0.055

      ctx.lineWidth = size < 100 ? 0.6 : 0.75

      for (const c of CIRCLES) {
        const pts = c.pts.map(proj)
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i], bpt = pts[(i + 1) % pts.length]
          const depth = ((a.z + bpt.z) * 0.5 + 1) * 0.5
          const op = (0.08 + depth * 0.88) * flicker
          ctx.strokeStyle = `rgba(${r},${g},${b},${op.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(bpt.x, bpt.y)
          ctx.stroke()
        }
      }

      // Outer ring
      ctx.strokeStyle = `rgba(${r},${g},${b},${(0.38 * flicker).toFixed(3)})`
      ctx.lineWidth = size < 100 ? 0.5 : 0.7
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      ctx.shadowBlur = 0

      rafId = requestAnimationFrame(frame)
    }

    rafId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(rafId)
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
