'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { subscribeNav } from '@/lib/navTransition'
import type { NavConfig } from '@/lib/navTransition'

interface OverlayProps { config: NavConfig; onDone: () => void }

function FadeOverlay({ config, onDone }: OverlayProps) {
  const router    = useRouter()
  const navigated = useRef(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    // Double-rAF lets opacity:0 paint before the transition fires
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setDark(true))
    )
    const t1 = setTimeout(() => {
      if (!navigated.current) { navigated.current = true; router.push(config.href) }
    }, 200)
    const t2 = setTimeout(() => setDark(false), 210)
    const t3 = setTimeout(onDone, 420)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{
      position:      'fixed',
      inset:         0,
      zIndex:        9999,
      pointerEvents: 'none',
      background:    '#000',
      opacity:       dark ? 1 : 0,
      transition:    'opacity 200ms ease',
    }} />
  )
}

export default function SphereTransitionOverlay() {
  const [config,  setConfig ] = useState<NavConfig | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return subscribeNav(cfg => setConfig(cfg))
  }, [])

  if (!mounted || !config) return null

  return createPortal(
    <FadeOverlay
      key={`${config.href}:${Date.now()}`}
      config={config}
      onDone={() => setConfig(null)}
    />,
    document.body
  )
}
