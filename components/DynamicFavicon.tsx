'use client'

import { useEffect } from 'react'

const R    = 13    // sphere radius in pixels (32×32 canvas, center 16,16)
const SEGS = 24    // segments per circle

// Meridians (longitude lines)
const MERIDIANS = Array.from({ length: 6 }, (_, i) => {
  const theta = (i / 6) * Math.PI
  return Array.from({ length: SEGS }, (_, s) => {
    const u = (s / SEGS) * Math.PI * 2
    return [Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)] as const
  })
})

// Latitude lines
const LATITUDES = [-0.65, -0.25, 0.25, 0.65].map(ly => {
  const r = Math.sqrt(1 - ly * ly)
  return Array.from({ length: SEGS }, (_, s) => {
    const u = (s / SEGS) * Math.PI * 2
    return [Math.cos(u) * r, ly, Math.sin(u) * r] as const
  })
})

const CIRCLES = [...MERIDIANS, ...LATITUDES]

export default function DynamicFavicon() {
  useEffect(() => {
    const canvas  = document.createElement('canvas')
    canvas.width  = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
    if (!link) return

    let rafId          = 0
    let lastUpdate     = 0
    const UPDATE_EVERY = 50   // ms — caps favicon updates at 20fps

    const draw = (now: number) => {
      ctx.clearRect(0, 0, 32, 32)

      // Dark background circle
      ctx.fillStyle = '#0d0d0d'
      ctx.beginPath()
      ctx.arc(16, 16, 15.5, 0, Math.PI * 2)
      ctx.fill()

      // Rotate Y axis: full rotation every 8 seconds
      const ay   = now * 0.000785   // 2π / 8000ms
      const cosY = Math.cos(ay)
      const sinY = Math.sin(ay)

      ctx.lineWidth = 0.9

      for (const circle of CIRCLES) {
        for (let i = 0; i < circle.length; i++) {
          const a  = circle[i]
          const b  = circle[(i + 1) % circle.length]

          // Rotate around Y
          const ax = a[0] * cosY + a[2] * sinY
          const az = -a[0] * sinY + a[2] * cosY
          const bx = b[0] * cosY + b[2] * sinY
          const bz = -b[0] * sinY + b[2] * cosY

          // Depth-based opacity: front faces are brighter
          const op = 0.12 + ((az + bz) * 0.5 + 1) * 0.5 * 0.72

          ctx.strokeStyle = `rgba(210,210,210,${op.toFixed(2)})`
          ctx.beginPath()
          ctx.moveTo(16 + ax * R, 16 + a[1] * R)
          ctx.lineTo(16 + bx * R, 16 + b[1] * R)
          ctx.stroke()
        }
      }

      if (now - lastUpdate > UPDATE_EVERY) {
        link.href  = canvas.toDataURL('image/png')
        lastUpdate = now
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return null
}
