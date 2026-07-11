'use client'

import { useEffect, useRef, useState } from 'react'
import WireframeSphere from '@/components/WireframeSphere'

const WALLPAPER_TEXT = Array(600).fill('KINDNESS IS RESISTANCE').join(' ')

// Chromatic-aberration + scanline-tear glitch, scoped to one word's own
// canvas. Two instances (one per word) share a single hover trigger so
// the effect reads as one continuous glitch across the wordmark.
function makeGlitchController(word: string, el: HTMLElement, canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!
  let lW = 0, lH = 0
  let hovering = false, intensity = 0, spread = 0, enterX = 0.5
  let stripAge = 0, stripMs = 60
  let strips: { y: number; h: number; dx: number }[] = []
  let fontStr = '', bgColor = '', inkColor = ''
  let autoStopId: ReturnType<typeof setTimeout> | null = null

  function resize(dpr: number) {
    lW = el.offsetWidth; lH = el.offsetHeight
    canvas.width  = Math.floor(lW * dpr); canvas.height = Math.floor(lH * dpr)
    canvas.style.width = lW + 'px'; canvas.style.height = lH + 'px'
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  function refreshStyle() {
    const cs = getComputedStyle(el)
    fontStr  = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`
    bgColor  = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#f7c500'
    inkColor = cs.color
  }

  function regenStrips(I: number) {
    const count = 2 + Math.floor(Math.random() * 4 * I + 1)
    strips = []
    for (let i = 0; i < count; i++) {
      strips.push({
        y:  Math.random() * lH,
        h:  1 + Math.random() * Math.max(1, lH * 0.06 * I),
        dx: (Math.random() - 0.5) * 18 * I,
      })
    }
    stripMs = 20 + Math.random() * (80 - I * 55)
  }

  function enter(clientX: number) {
    const rect = el.getBoundingClientRect()
    if (autoStopId !== null) { clearTimeout(autoStopId); autoStopId = null }
    hovering = true
    enterX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    spread = 0
    intensity = 0
    autoStopId = setTimeout(() => { hovering = false; autoStopId = null }, 5000)
  }

  function leave() {
    if (autoStopId !== null) { clearTimeout(autoStopId); autoStopId = null }
    hovering = false
  }

  function frame(dt: number) {
    if (hovering) {
      intensity = Math.min(1, intensity + dt / 2000)
      spread    = Math.min(1, spread    + dt / 450)
    } else {
      intensity = Math.max(0, intensity - dt / 380)
    }

    if (intensity < 0.004 || !fontStr) {
      ctx.clearRect(0, 0, lW, lH)
      return
    }

    const I = intensity
    const maxR  = Math.max(enterX, 1 - enterX) * lW
    const curR  = spread * maxR
    const sL    = Math.max(0, enterX * lW - curR)
    const sR    = Math.min(lW, enterX * lW + curR)
    const zoneW = sR - sL
    if (zoneW < 1) { ctx.clearRect(0, 0, lW, lH); return }

    stripAge += dt
    if (stripAge >= stripMs || strips.length === 0) {
      stripAge = 0
      regenStrips(I)
    }

    ctx.clearRect(0, 0, lW, lH)

    const chromShift = Math.round(4 + I * 10)
    const textX = lW / 2, textY = lH / 2

    ctx.save()
    ctx.beginPath(); ctx.rect(sL, 0, zoneW, lH); ctx.clip()
    ctx.globalAlpha = I * 0.52
    ctx.fillStyle = 'rgba(255,0,60,1)'
    ctx.font = fontStr; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ctx.fillText(word, textX - chromShift, textY)
    ctx.restore()

    ctx.save()
    ctx.beginPath(); ctx.rect(sL, 0, zoneW, lH); ctx.clip()
    ctx.globalAlpha = I * 0.52
    ctx.fillStyle = 'rgba(0,220,255,1)'
    ctx.font = fontStr; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
    ctx.fillText(word, textX + chromShift, textY)
    ctx.restore()

    for (const strip of strips) {
      if (zoneW < 1) continue
      ctx.save()
      ctx.beginPath(); ctx.rect(sL, strip.y, zoneW, strip.h); ctx.clip()
      ctx.globalAlpha = 1
      ctx.fillStyle = bgColor
      ctx.fillRect(sL, strip.y, zoneW, strip.h)
      ctx.fillStyle = inkColor
      ctx.font = fontStr; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
      ctx.fillText(word, textX + strip.dx, textY)
      ctx.restore()
    }
  }

  return { resize, refreshStyle, enter, leave, frame }
}

export default function HeroCanvas() {
  const wordmarkRef    = useRef<HTMLDivElement>(null)
  const nanRef         = useRef<HTMLSpanElement>(null)
  const sphereWordRef  = useRef<HTMLSpanElement>(null)
  const nanGlitchRef   = useRef<HTMLCanvasElement>(null)
  const sphereGlitchRef = useRef<HTMLCanvasElement>(null)
  const [sphereSize, setSphereSize] = useState(64)

  useEffect(() => {
    const wordmark   = wordmarkRef.current!
    const nanEl       = nanRef.current!
    const sphereWordEl = sphereWordRef.current!
    const nanCanvas   = nanGlitchRef.current!
    const sphereCanvas = sphereGlitchRef.current!

    const nanCtl    = makeGlitchController('Nan', nanEl, nanCanvas)
    const sphereCtl = makeGlitchController('sphere', sphereWordEl, sphereCanvas)

    function updateSphereSize() {
      setSphereSize(Math.min(170, Math.max(28, window.innerWidth * 0.135)))
    }

    function resizeAll() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      nanCtl.resize(dpr)
      sphereCtl.resize(dpr)
      updateSphereSize()
    }

    resizeAll()
    window.addEventListener('resize', resizeAll)

    document.fonts.ready.then(() => {
      nanCtl.refreshStyle()
      sphereCtl.refreshStyle()
      resizeAll()
    })

    function onMouseEnter(e: MouseEvent) { nanCtl.enter(e.clientX); sphereCtl.enter(e.clientX) }
    function onMouseLeave() { nanCtl.leave(); sphereCtl.leave() }
    function onTouchStart(e: TouchEvent) {
      nanCtl.enter(e.touches[0].clientX)
      sphereCtl.enter(e.touches[0].clientX)
      setTimeout(onMouseLeave, 1400)
    }

    wordmark.addEventListener('mouseenter', onMouseEnter)
    wordmark.addEventListener('mouseleave', onMouseLeave)
    wordmark.addEventListener('touchstart', onTouchStart, { passive: true })

    function animateWordmark(t: number) {
      const tx = Math.cos(t * 0.00025) * 5
      const ty = Math.sin(t * 0.00020) * 5 * 0.7
      const rot = Math.sin(t * 0.00018) * 1.0
      wordmark.style.transform = `translate(${tx.toFixed(2)}px,${ty.toFixed(2)}px) rotate(${rot.toFixed(3)}deg)`
    }

    let last = performance.now(), rafId = 0
    function frame(now: number) {
      const dt = Math.min(50, now - last); last = now
      animateWordmark(now)
      nanCtl.frame(dt)
      sphereCtl.frame(dt)
      rafId = requestAnimationFrame(frame)
    }
    rafId = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resizeAll)
      wordmark.removeEventListener('mouseenter', onMouseEnter)
      wordmark.removeEventListener('mouseleave', onMouseLeave)
      wordmark.removeEventListener('touchstart', onTouchStart)
    }
  }, [])

  return (
    <main className="hero">
      <div className="hero-wallpaper" aria-hidden="true">{WALLPAPER_TEXT}</div>

      <div className="hero-blob hero-blob-a" aria-hidden="true" />
      <div className="hero-blob hero-blob-b" aria-hidden="true" />

      <div className="hero-bars hero-bars-left" aria-hidden="true">
        <span className="hero-bar hero-bar-1" />
        <span className="hero-bar hero-bar-2" />
        <span className="hero-bar hero-bar-3" />
        <span className="hero-bar hero-bar-4" />
        <span className="hero-bar hero-bar-5" />
      </div>
      <div className="hero-bars hero-bars-right" aria-hidden="true">
        <span className="hero-bar hero-bar-1" />
        <span className="hero-bar hero-bar-2" />
        <span className="hero-bar hero-bar-3" />
        <span className="hero-bar hero-bar-4" />
        <span className="hero-bar hero-bar-5" />
      </div>

      <div className="hero-wordmark-wrap">
        <div ref={wordmarkRef} className="hero-wordmark">
          <span ref={nanRef} className="hero-word">
            Nan
            <canvas ref={nanGlitchRef} className="hero-glitch" />
          </span>
          <div className="hero-sphere-wrap">
            <WireframeSphere size={sphereSize} colorVar="--hero-sphere-rgb" bold className="hero-sphere" />
          </div>
          <span ref={sphereWordRef} className="hero-word">
            sphere
            <canvas ref={sphereGlitchRef} className="hero-glitch" />
          </span>
        </div>
      </div>
    </main>
  )
}
