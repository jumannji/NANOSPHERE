'use client'

import { useEffect, useRef } from 'react'

// ── Shared sphere geometry ────────────────────────────────────────────────────
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

// ── Bazaar palette (matches BazaarSphere.tsx) ─────────────────────────────────
const PALETTE: [number, number, number][] = [
  [247, 197,   0],
  [200, 255, 251],
  [255,  60,  60],
  [ 49, 152,  34],
  [  0, 180, 255],
  [255,  80, 220],
]
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

const N_BUCKETS = 16
const SIZE = 42

interface Props { onClick: () => void }

export default function NavSphere({ onClick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const DPR    = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = SIZE * DPR
    canvas.height = SIZE * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const cx = SIZE / 2, cy = SIZE / 2, R = SIZE * 0.42
    let rafId = 0

    const isBazaar = document.documentElement.dataset.theme === 'bazaar'

    if (isBazaar) {
      // ── Bazaar rendering: color-cycling glow, visible on dark background ───
      // Uses the same bucketed approach as BazaarSphere so shadowBlur is
      // computed once per bucket (~16×) instead of once per segment (~1024×).
      const shadowSz = SIZE * 0.14  // slightly more spread at small size

      const projBuf: { x: number; y: number; z: number }[][] =
        SPHERE_CIRCLES.map(c => c.pts.map(() => ({ x: 0, y: 0, z: 0 })))
      const bfx: number[][] = Array.from({ length: N_BUCKETS }, () => [])
      const bfy: number[][] = Array.from({ length: N_BUCKETS }, () => [])
      const btx: number[][] = Array.from({ length: N_BUCKETS }, () => [])
      const bty: number[][] = Array.from({ length: N_BUCKETS }, () => [])

      let cosY = 1, sinY = 0, cosX = 1, sinX = 0

      const projectAll = () => {
        for (let ci = 0; ci < SPHERE_CIRCLES.length; ci++) {
          const { pts } = SPHERE_CIRCLES[ci]
          const buf     = projBuf[ci]
          for (let s = 0; s < pts.length; s++) {
            const p = pts[s]
            const rx  = p[0] * cosY + p[2] * sinY
            let   rz  = -p[0] * sinY + p[2] * cosY
            const ry  = p[1] * cosX - rz * sinX
            rz        = p[1] * sinX + rz * cosX
            const out = buf[s]
            out.x = cx + rx * R
            out.y = cy + ry * R
            out.z = rz
          }
        }
      }

      const frameBazaar = (t: number) => {
        ctx.clearRect(0, 0, SIZE, SIZE)

        const ay = t * 0.00016
        const ax = Math.sin(t * 0.000093) * 0.32
        cosY = Math.cos(ay); sinY = Math.sin(ay)
        cosX = Math.cos(ax); sinX = Math.sin(ax)
        projectAll()

        const ct      = (t * 0.00085) % PALETTE.length
        const pi      = Math.floor(ct) % PALETTE.length
        const pn      = (pi + 1) % PALETTE.length
        const frac    = ct - Math.floor(ct)
        const ease    = frac < 0.5 ? 2 * frac * frac : 1 - 2 * (1 - frac) * (1 - frac)
        const cr      = lerp(PALETTE[pi][0], PALETTE[pn][0], ease)
        const cg      = lerp(PALETTE[pi][1], PALETTE[pn][1], ease)
        const cb      = lerp(PALETTE[pi][2], PALETTE[pn][2], ease)
        const flicker = 0.88 + 0.12 * Math.sin(t * 0.047) * Math.cos(t * 0.031)
        const r = Math.round(cr), g = Math.round(cg), b = Math.round(cb)

        for (let bk = 0; bk < N_BUCKETS; bk++) {
          bfx[bk].length = 0; bfy[bk].length = 0
          btx[bk].length = 0; bty[bk].length = 0
        }

        for (let ci = 0; ci < SPHERE_CIRCLES.length; ci++) {
          const buf = projBuf[ci]
          const len = buf.length
          for (let i = 0; i < len; i++) {
            const a   = buf[i]
            const bpt = buf[(i + 1) % len]
            const depth = ((a.z + bpt.z) * 0.5 + 1) * 0.5
            const bk    = Math.min(N_BUCKETS - 1, depth * N_BUCKETS | 0)
            bfx[bk].push(a.x); bfy[bk].push(a.y)
            btx[bk].push(bpt.x); bty[bk].push(bpt.y)
          }
        }

        ctx.shadowColor = `rgba(${r},${g},${b},0.9)`
        ctx.shadowBlur  = shadowSz
        ctx.lineWidth   = 0.6

        for (let bk = 0; bk < N_BUCKETS; bk++) {
          const count = bfx[bk].length
          if (count === 0) continue
          const depthFrac = (bk + 0.5) / N_BUCKETS
          // Higher opacity range (0.15–0.90) so lines are visible on dark bg
          const op = (0.15 + depthFrac * 0.75) * flicker
          ctx.strokeStyle = `rgba(${r},${g},${b},${op.toFixed(2)})`
          ctx.beginPath()
          for (let j = 0; j < count; j++) {
            ctx.moveTo(bfx[bk][j], bfy[bk][j])
            ctx.lineTo(btx[bk][j], bty[bk][j])
          }
          ctx.stroke()
        }

        // Outer ring
        ctx.strokeStyle = `rgba(${r},${g},${b},${(0.55 * flicker).toFixed(2)})`
        ctx.lineWidth   = 0.5
        ctx.beginPath()
        ctx.arc(cx, cy, R, 0, Math.PI * 2)
        ctx.stroke()

        ctx.shadowBlur = 0
        rafId = requestAnimationFrame(frameBazaar)
      }

      rafId = requestAnimationFrame(frameBazaar)

    } else {
      // ── Original rendering: subtle dark lines on light backgrounds ─────────
      const sphereRgb = getComputedStyle(document.documentElement)
        .getPropertyValue('--sphere-rgb').trim() || '18,18,20'

      const frame = (t: number) => {
        ctx.clearRect(0, 0, SIZE, SIZE)
        const ay = t * 0.00012, ax = Math.sin(t * 0.00007) * 0.28
        const cy_ = Math.cos(ay), sy_ = Math.sin(ay)
        const cx_ = Math.cos(ax), sx_ = Math.sin(ax)

        const proj = (p: number[]) => {
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
    }

    return () => cancelAnimationFrame(rafId)
  }, [])

  return (
    <button
      onClick={onClick}
      aria-label="Toggle nav / go home"
      className="nav-sphere"
      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
    >
      <canvas ref={canvasRef} style={{ width: SIZE, height: SIZE, display: 'block' }} />
    </button>
  )
}
