'use client'

import { useState, useRef } from 'react'
import Nav from '@/components/Nav'
import ClothingRack from '@/components/ClothingRack'

const PRODUCTS = [
  { id: 'hoodie',     name: 'Hoodie',     price: 85, desc: 'Oversized, drop-shoulder silhouette.' },
  { id: 'tshirt',     name: 'T-Shirt',    price: 45, desc: 'Heavyweight cotton, boxy fit.'        },
  { id: 'sweatpants', name: 'Sweatpants', price: 65, desc: 'Tapered leg, drawstring waist.'       },
] as const

const N    = PRODUCTS.length
const STEP = 360 / N   // 120° per product

function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : 1 - 2 * (1 - t) * (1 - t)
}

function ArrowLeft() {
  return (
    <svg width="12" height="22" viewBox="0 0 12 22" fill="none" aria-hidden>
      <polyline points="10,1 2,11 10,21"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function ArrowRight() {
  return (
    <svg width="12" height="22" viewBox="0 0 12 22" fill="none" aria-hidden>
      <polyline points="2,1 10,11 2,21"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Diamond() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" style={{ display: 'block' }} aria-hidden>
      <polygon points="4,0 8,5 4,10 0,5"
        fill="none" stroke="rgba(247,197,0,0.26)" strokeWidth="0.5" />
    </svg>
  )
}
function Cross() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" style={{ display: 'block' }} aria-hidden>
      <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="rgba(247,197,0,0.20)" strokeWidth="0.5" />
      <line x1="0"   y1="3.5" x2="7" y2="3.5" stroke="rgba(247,197,0,0.20)" strokeWidth="0.5" />
    </svg>
  )
}

export default function NanoBazaarPage() {
  const [currentIdx,  setCurrentIdx ] = useState(0)
  const [rotOffset,   setRotOffset  ] = useState(0)
  const [fading,      setFading     ] = useState(false)
  const [negotiating, setNegotiating] = useState(false)

  const rafRef   = useRef<number>(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rotRef   = useRef(0)   // live rotation updated each frame

  function navigate(dir: 1 | -1) {
    if (rafRef.current) return   // ignore while animating

    const newIdx = (currentIdx + dir + N) % N
    const delta  = -dir * STEP   // ring rotates opposite to navigation direction

    setFading(true)
    setNegotiating(false)

    const fromRot = rotRef.current
    const startT  = performance.now()
    const DUR     = 650

    function step(now: number) {
      const t = Math.min((now - startT) / DUR, 1)
      const v = fromRot + delta * easeInOut(t)
      rotRef.current = v
      setRotOffset(v)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        rafRef.current = 0
      }
    }
    rafRef.current = requestAnimationFrame(step)

    // Update product at animation midpoint
    timerRef.current = setTimeout(() => {
      setCurrentIdx(newIdx)
      setFading(false)
    }, 300)
  }

  const product = PRODUCTS[currentIdx]

  return (
    <>
      <div aria-hidden className="bz-scanlines" />

      <div className="bz-decor bz-decor--left" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '7.5s', animationDelay: '0s' }}>
          <div className="bz-string" style={{ height: '130px' }} /><Diamond />
        </div>
        <div className="bz-hang" style={{ animationDuration: '9.8s', animationDelay: '-4.2s' }}>
          <div className="bz-string" style={{ height: '88px' }} /><Cross />
        </div>
      </div>
      <div className="bz-decor bz-decor--right" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '8.4s', animationDelay: '-2.6s' }}>
          <div className="bz-string" style={{ height: '105px' }} /><Diamond />
        </div>
        <div className="bz-hang" style={{ animationDuration: '6.9s', animationDelay: '-1.1s' }}>
          <div className="bz-string" style={{ height: '72px' }} /><Cross />
        </div>
      </div>

      <Nav showSphere />

      <main className="bz-main">
        <div className="bz-stage">

          {/* ── Left arrow ── */}
          <button className="bz-arrow bz-arrow--left"
            onClick={() => navigate(-1)}
            aria-label="Previous product">
            <ArrowLeft />
          </button>

          {/* ── Rack ── */}
          <section className="bz-rack-section" aria-label="Clothing rack">
            <ClothingRack rotOffset={rotOffset} />
          </section>

          {/* ── Product panel ── */}
          <div
            className={`bz-product-panel${fading ? ' bz-product-panel--fading' : ''}`}
            aria-label="Product details"
            aria-live="polite"
          >
            {/* Image placeholder */}
            <div className="bz-product-image" aria-hidden>
              <svg viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
                <line x1="0" y1="0" x2="1" y2="1"
                  stroke="rgba(255,255,255,0.055)" strokeWidth="0.006" />
                <line x1="1" y1="0" x2="0" y2="1"
                  stroke="rgba(255,255,255,0.055)" strokeWidth="0.006" />
              </svg>
            </div>

            <h2 className="bz-product-name">{product.name}</h2>
            <p  className="bz-product-price">${product.price}</p>
            <p  className="bz-product-desc">{product.desc}</p>

            <button className="bz-negotiate" onClick={() => setNegotiating(v => !v)}>
              Negotiate
            </button>
            {negotiating && (
              <p className="bz-coming-soon" aria-live="polite">Coming soon</p>
            )}

            {/* Position indicator dots */}
            <div className="bz-product-dots" aria-hidden>
              {PRODUCTS.map((_, i) => (
                <div key={i}
                  className={`bz-product-dot${i === currentIdx ? ' bz-product-dot--active' : ''}`}
                />
              ))}
            </div>
          </div>

          {/* ── Right arrow ── */}
          <button className="bz-arrow bz-arrow--right"
            onClick={() => navigate(1)}
            aria-label="Next product">
            <ArrowRight />
          </button>

        </div>
      </main>
    </>
  )
}
