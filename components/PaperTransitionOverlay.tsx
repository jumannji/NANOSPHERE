'use client'

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { subscribePaper } from '@/lib/paperTransition'
import type { PaperConfig } from '@/lib/paperTransition'

// ── Polygon geometry ──────────────────────────────────────────────────────────
// Both polygons must have the same number of points (24) so CSS can morph
// between them without jumping. Points go clockwise from near top-left.

// Crumpled: corners indented, edges with irregular bumps and dents
const CRUMPLED = `polygon(
  5% 8%, 22% 0%, 39% 6%, 54% 0%, 70% 5%, 86% 0%,
  97% 0%, 100% 13%, 96% 32%, 100% 51%, 96% 70%, 100% 88%,
  95% 100%, 76% 95%, 57% 100%, 40% 95%, 22% 100%, 6% 97%,
  0% 85%, 5% 66%, 0% 47%, 4% 28%, 0% 11%, 2% 0%
)`

// Flat: perfectly rectangular with 24 evenly-spaced edge points
const FLAT = `polygon(
  0% 0%, 17% 0%, 34% 0%, 51% 0%, 68% 0%, 85% 0%,
  100% 0%, 100% 17%, 100% 34%, 100% 51%, 100% 68%, 100% 85%,
  100% 100%, 83% 100%, 66% 100%, 49% 100%, 32% 100%, 15% 100%,
  0% 100%, 0% 85%, 0% 68%, 0% 51%, 0% 34%, 0% 17%
)`

// Premium expo-out easing — springs out fast, drifts to rest
const EASE = 'cubic-bezier(0.16, 1, 0.3, 1)'

// ── Paper overlay ─────────────────────────────────────────────────────────────

type Phase = 'initial' | 'expanding' | 'fading'

interface OverlayProps {
  config: PaperConfig
  onDone: () => void
}

function PaperOverlay({ config, onDone }: OverlayProps) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('initial')
  const [showTitle, setShowTitle] = useState(false)
  const navigatedRef = useRef(false)

  const vw = typeof window !== 'undefined' ? window.innerWidth  : 1
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1

  // Transform the full-screen element so it sits exactly over the origin rect.
  // With transform-origin 50% 50%:
  //   center after transform = (vw/2 + tx, vh/2 + ty)  →  set equal to origin center
  const { left, top, width, height } = config.origin
  const tx = left + width  / 2 - vw / 2
  const ty = top  + height / 2 - vh / 2
  const sx = width  / vw
  const sy = height / vh

  useEffect(() => {
    // Two rAF calls: first lets React paint the initial state, second triggers
    // the CSS transitions (browser needs at least one painted frame first).
    let raf1: number, raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setPhase('expanding'))
    })

    // Title fades in near the end of the expansion
    const t1 = setTimeout(() => setShowTitle(true), 820)

    // Navigate while paper is still visible (SPA — no flash)
    const t2 = setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true
        router.push(config.href)
      }
    }, 980)

    // Start fading the paper to reveal the now-loaded article page beneath
    const t3 = setTimeout(() => setPhase('fading'), 1060)

    // Unmount after fade completes
    const t4 = setTimeout(onDone, 1320)

    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isExpanding = phase === 'expanding'
  const isFading    = phase === 'fading'
  const isAnimating = isExpanding || isFading

  // ── Paper element styles ──────────────────────────────────────────────────
  const paperStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9998,
    overflow: 'hidden',
    background: 'var(--bg)',
    willChange: isFading ? 'auto' : 'transform, clip-path',

    // Geometry: starts at origin rect, expands to full screen
    transform:  isAnimating ? 'none' : `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`,
    clipPath:   isAnimating ? FLAT    : CRUMPLED,

    // Subtle sharpening as paper flattens
    filter: isAnimating ? 'none' : 'blur(0.5px)',

    // Opacity fades paper away to reveal article page
    opacity: isFading ? 0 : 1,

    transition: isFading
      ? 'opacity 250ms ease'
      : isExpanding
        ? [
            `transform  1.1s  ${EASE}`,
            `clip-path  1.05s ${EASE}`,
            'filter     0.8s  ease',
          ].join(', ')
        : 'none',
  }

  // ── Fold crease lines — fade out as paper flattens ────────────────────────
  const foldOpacity: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    opacity: isExpanding ? 0 : 0.85,
    transition: isExpanding ? 'opacity 0.6s ease' : 'none',
  }

  const lineBase: React.CSSProperties = {
    position: 'absolute',
  }

  // ── Article title — appears as the paper finishes opening ─────────────────
  const titleWrap: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 10vw',
    pointerEvents: 'none',
    opacity: showTitle ? 0.86 : 0,
    transform: showTitle ? 'translateY(0)' : 'translateY(18px)',
    transition: 'opacity 0.45s ease, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1)',
  }

  return (
    <div style={paperStyle}>

      {/* Fold creases — horizontal, vertical, and one diagonal */}
      <div style={foldOpacity}>
        {/* Horizontal fold at midpoint */}
        <div style={{
          ...lineBase,
          left: 0, right: 0, top: '50%',
          height: '1px',
          transform: 'translateY(-0.5px)',
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.09) 18%, rgba(0,0,0,0.09) 82%, transparent 100%)',
        }} />
        {/* Vertical fold at midpoint */}
        <div style={{
          ...lineBase,
          top: 0, bottom: 0, left: '50%',
          width: '1px',
          transform: 'translateX(-0.5px)',
          background: 'linear-gradient(0deg, transparent 0%, rgba(0,0,0,0.09) 18%, rgba(0,0,0,0.09) 82%, transparent 100%)',
        }} />
        {/* Diagonal crease — shallow gradient simulating a fold shadow */}
        <div style={{
          ...lineBase,
          inset: 0,
          background: 'linear-gradient(138deg, transparent 46%, rgba(0,0,0,0.04) 49%, rgba(0,0,0,0.04) 51%, transparent 54%)',
        }} />
        {/* Corner shadow — crumpled paper casts depth at corners */}
        <div style={{
          ...lineBase,
          inset: 0,
          background: 'radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.07) 0%, transparent 45%)',
        }} />
        <div style={{
          ...lineBase,
          inset: 0,
          background: 'radial-gradient(ellipse at 100% 100%, rgba(0,0,0,0.05) 0%, transparent 40%)',
        }} />
      </div>

      {/* Article title — magazine cover reveal */}
      <div style={titleWrap}>
        <h1 style={{
          fontFamily: 'var(--font-italiana), serif',
          fontWeight: 400,
          fontSize: 'clamp(38px, 6.5vw, 92px)',
          letterSpacing: '0.04em',
          color: 'var(--ink)',
          textAlign: 'center',
          margin: 0,
          lineHeight: 1.1,
        }}>
          {config.title}
        </h1>
      </div>

    </div>
  )
}

// ── Root component — subscribes to the store, renders portal ─────────────────

export default function PaperTransitionOverlay() {
  const [config, setConfig] = useState<PaperConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribePaper(cfg => setConfig(cfg))
  }, [])

  if (!mounted || !config) return null

  return createPortal(
    <PaperOverlay
      // Re-mount fresh if same article clicked again after completion
      key={`${config.href}:${config.origin.left}:${config.origin.top}`}
      config={config}
      onDone={() => setConfig(null)}
    />,
    document.body
  )
}
