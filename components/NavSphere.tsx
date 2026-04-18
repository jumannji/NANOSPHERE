'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'

const SPHERE_CIRCLES = (() => {
  const arr: { kind: string; pts: number[][] }[] = []
  const segs = 64
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

const SIZE = 42

export default function NavSphere() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!
    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = SIZE * DPR
    canvas.height = SIZE * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const cx = SIZE / 2
    const cy = SIZE / 2
    const R = SIZE * 0.42

    let rafId = 0
    function frame(t: number) {
      ctx.clearRect(0, 0, SIZE, SIZE)
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

      ctx.lineWidth = 0.5
      for (const c of SPHERE_CIRCLES) {
        const projected = c.pts.map(proj)
        for (let i = 0; i < projected.length; i++) {
          const a = projected[i]
          const b = projected[(i + 1) % projected.length]
          const zMid = (a.z + b.z) * 0.5
          const depth = (zMid + 1) * 0.5
          const op = 0.03 + depth * 0.22
          ctx.strokeStyle = `rgba(18,18,20,${op.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.stroke()
        }
      }
      ctx.strokeStyle = 'rgba(18,18,20,0.32)'
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <Link href="/" aria-label="NanoSphere home" className="nav-sphere">
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE, display: 'block' }} />
    </Link>
  )
}
