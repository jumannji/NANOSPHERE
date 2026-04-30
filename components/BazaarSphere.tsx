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

const PALETTE: [number, number, number][] = [
  [247, 197,   0],
  [200, 255, 251],
  [255,  60,  60],
  [ 49, 152,  34],
  [  0, 180, 255],
  [255,  80, 220],
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ── Fix 4: shared rAF loop ────────────────────────────────────────────────────
// All BazaarSphere instances draw inside one requestAnimationFrame tick instead
// of N independent loops competing for the same vsync budget.
type DrawFn = (t: number) => void
const registry = new Set<DrawFn>()
let sharedRaf = 0

function sharedLoop(t: number) {
  registry.forEach(fn => fn(t))
  sharedRaf = requestAnimationFrame(sharedLoop)
}
function register(fn: DrawFn) {
  registry.add(fn)
  if (registry.size === 1) sharedRaf = requestAnimationFrame(sharedLoop)
}
function unregister(fn: DrawFn) {
  registry.delete(fn)
  if (registry.size === 0) { cancelAnimationFrame(sharedRaf); sharedRaf = 0 }
}

// ── Fix 1: depth-bucket count ─────────────────────────────────────────────────
// 16 buckets → at most 16 stroke() calls per sphere per frame instead of 1,152.
const N_BUCKETS = 16

interface Props { size?: number }

export default function BazaarSphere({ size = 200 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx    = canvas.getContext('2d')!
    const DPR    = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width  = size * DPR
    canvas.height = size * DPR
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0)

    const cx       = size / 2, cy = size / 2, R = size * 0.43
    const lineW    = size < 100 ? 0.6 : 0.75
    const ringW    = size < 100 ? 0.5 : 0.7
    const shadowSz = size * 0.055

    // ── Fix 3a: pre-allocated projected-point buffers ─────────────────────────
    // Objects created once at mount; filled in-place each frame — zero per-frame
    // heap allocation for projected points.
    const projBuf: { x: number; y: number; z: number }[][] =
      CIRCLES.map(c => c.pts.map(() => ({ x: 0, y: 0, z: 0 })))

    // ── Fix 3b: pre-allocated per-bucket segment arrays ───────────────────────
    // Cleared with .length = 0 each frame (keeps underlying memory, no re-alloc
    // after the first few frames once the arrays reach their steady-state size).
    const bfx: number[][] = Array.from({ length: N_BUCKETS }, () => [])
    const bfy: number[][] = Array.from({ length: N_BUCKETS }, () => [])
    const btx: number[][] = Array.from({ length: N_BUCKETS }, () => [])
    const bty: number[][] = Array.from({ length: N_BUCKETS }, () => [])

    // Rotation state — mutable locals updated each frame, captured by projectAll
    let cosY = 1, sinY = 0, cosX = 1, sinX = 0

    // Projection defined once per instance (not re-created inside frame each tick)
    function projectAll() {
      for (let ci = 0; ci < CIRCLES.length; ci++) {
        const { pts } = CIRCLES[ci]
        const buf     = projBuf[ci]
        for (let s = 0; s < pts.length; s++) {
          const [px, py, pz] = pts[s]
          const rx  = px * cosY + pz * sinY
          let   rz  = -px * sinY + pz * cosY
          const ry  = py * cosX - rz * sinX
          rz        = py * sinX + rz * cosX
          const out = buf[s]
          out.x = cx + rx * R
          out.y = cy + ry * R
          out.z = rz
        }
      }
    }

    function frame(t: number) {
      ctx.clearRect(0, 0, size, size)

      // Rotation
      const ay = t * 0.00016
      const ax = Math.sin(t * 0.000093) * 0.32
      cosY = Math.cos(ay); sinY = Math.sin(ay)
      cosX = Math.cos(ax); sinX = Math.sin(ax)
      projectAll()

      // Color interpolation — identical to original
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

      // ── Fix 3b: clear buckets by resetting length (no new array allocations) ─
      for (let bk = 0; bk < N_BUCKETS; bk++) {
        bfx[bk].length = 0; bfy[bk].length = 0
        btx[bk].length = 0; bty[bk].length = 0
      }

      // ── Fix 1: bucket every segment by depth ──────────────────────────────
      for (let ci = 0; ci < CIRCLES.length; ci++) {
        const buf = projBuf[ci]
        const len = buf.length
        for (let i = 0; i < len; i++) {
          const a   = buf[i]
          const bpt = buf[(i + 1) % len]
          const depth = ((a.z + bpt.z) * 0.5 + 1) * 0.5
          const bk    = Math.min(N_BUCKETS - 1, depth * N_BUCKETS | 0)
          bfx[bk].push(a.x);   bfy[bk].push(a.y)
          btx[bk].push(bpt.x); bty[bk].push(bpt.y)
        }
      }

      // ── Fix 1 + 3c: one stroke() per bucket, ~16 rgba strings per frame ────
      // shadowBlur is computed 16× per sphere per frame instead of 1,152×.
      ctx.shadowColor = `rgba(${r},${g},${b},0.85)`
      ctx.shadowBlur  = shadowSz
      ctx.lineWidth   = lineW

      for (let bk = 0; bk < N_BUCKETS; bk++) {
        const count = bfx[bk].length
        if (count === 0) continue
        const depthFrac = (bk + 0.5) / N_BUCKETS
        const op = (0.08 + depthFrac * 0.88) * flicker
        ctx.strokeStyle = `rgba(${r},${g},${b},${op.toFixed(2)})`
        ctx.beginPath()
        for (let j = 0; j < count; j++) {
          ctx.moveTo(bfx[bk][j], bfy[bk][j])
          ctx.lineTo(btx[bk][j], bty[bk][j])
        }
        ctx.stroke()
      }

      // Outer equator ring
      ctx.strokeStyle = `rgba(${r},${g},${b},${(0.38 * flicker).toFixed(2)})`
      ctx.lineWidth   = ringW
      ctx.beginPath()
      ctx.arc(cx, cy, R, 0, Math.PI * 2)
      ctx.stroke()

      ctx.shadowBlur = 0
    }

    // ── Fix 4: join the shared loop instead of starting a new rAF ─────────────
    register(frame)
    return () => unregister(frame)
  }, [size])

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, display: 'block' }}
    />
  )
}
