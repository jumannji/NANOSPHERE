'use client'

import { useEffect, useState } from 'react'
import Nav from '@/components/Nav'
import ClothingRack from '@/components/ClothingRack'

const END_DATE = new Date('2026-05-21T00:00:00')

const PRODUCTS = [
  { id: 'hoodie',     name: 'Hoodie',     price: 85, desc: 'Oversized, drop-shoulder silhouette.' },
  { id: 'tshirt',     name: 'T-Shirt',    price: 45, desc: 'Heavyweight cotton, boxy fit.'        },
  { id: 'sweatpants', name: 'Sweatpants', price: 65, desc: 'Tapered leg, drawstring waist.'       },
] as const

function useCountdown(end: Date) {
  const [rem, setRem] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, end.getTime() - Date.now())
      const s = Math.floor(diff / 1000)
      setRem({
        days:  Math.floor(s / 86400),
        hours: Math.floor((s % 86400) / 3600),
        mins:  Math.floor((s % 3600)  / 60),
        secs:  s % 60,
      })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [end])
  return rem
}

function pad(n: number) { return String(n).padStart(2, '0') }

// Minimal diamond pendant SVG
function Diamond() {
  return (
    <svg width="8" height="10" viewBox="0 0 8 10" style={{ display: 'block' }} aria-hidden>
      <polygon points="4,0 8,5 4,10 0,5"
        fill="none" stroke="rgba(247,197,0,0.26)" strokeWidth="0.5" />
    </svg>
  )
}

// Minimal cross pendant SVG
function Cross() {
  return (
    <svg width="7" height="7" viewBox="0 0 7 7" style={{ display: 'block' }} aria-hidden>
      <line x1="3.5" y1="0" x2="3.5" y2="7" stroke="rgba(247,197,0,0.20)" strokeWidth="0.5" />
      <line x1="0"   y1="3.5" x2="7" y2="3.5" stroke="rgba(247,197,0,0.20)" strokeWidth="0.5" />
    </svg>
  )
}

export default function NanoBazaarPage() {
  const { days, hours, mins, secs } = useCountdown(END_DATE)
  const [current]     = useState(0)
  const [negotiating, setNegotiating] = useState(false)

  const product = PRODUCTS[current]

  function handleNegotiate() {
    setNegotiating(true)
    setTimeout(() => setNegotiating(false), 3000)
  }

  return (
    <>
      <div aria-hidden className="bz-scanlines" />

      {/* ── Pendants — left ─────────────────────────── */}
      <div className="bz-decor bz-decor--left" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '7.5s', animationDelay: '0s' }}>
          <div className="bz-string" style={{ height: '130px' }} />
          <Diamond />
        </div>
        <div className="bz-hang" style={{ animationDuration: '9.8s', animationDelay: '-4.2s' }}>
          <div className="bz-string" style={{ height: '88px' }} />
          <Cross />
        </div>
      </div>

      {/* ── Pendants — right ────────────────────────── */}
      <div className="bz-decor bz-decor--right" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '8.4s', animationDelay: '-2.6s' }}>
          <div className="bz-string" style={{ height: '105px' }} />
          <Diamond />
        </div>
        <div className="bz-hang" style={{ animationDuration: '6.9s', animationDelay: '-1.1s' }}>
          <div className="bz-string" style={{ height: '72px' }} />
          <Cross />
        </div>
      </div>

      <Nav showSphere />

      <main className="bz-main">

        {/* ── Countdown strip ──────────────────────────────── */}
        <div className="bz-countdown-strip" aria-label="Collection countdown">
          <span className="bz-cd-label-text">OG Collection</span>
          <span className="bz-cd-rule" aria-hidden>—</span>
          <span className="bz-cd-nums">
            {pad(days)}<small>D</small>
            {pad(hours)}<small>H</small>
            {pad(mins)}<small>M</small>
            {pad(secs)}<small>S</small>
          </span>
        </div>

        {/* ── Rack — the centerpiece ───────────────────────── */}
        <section className="bz-rack-section" aria-label="Clothing rack">
          <ClothingRack />
        </section>

        {/* ── Product info ─────────────────────────────────── */}
        <section className="bz-product-info" aria-label="Current product">
          <h2 className="bz-product-name">{product.name}</h2>
          <p className="bz-product-price">${product.price}</p>
          <p className="bz-product-desc">{product.desc}</p>
          <button className="bz-negotiate" onClick={handleNegotiate}>
            Negotiate
          </button>
          {negotiating && (
            <p className="bz-coming-soon" aria-live="polite">Coming soon</p>
          )}
        </section>

        {/* ── Merchant chat ─────────────────────────────────── */}
        {/* ↓ Replace .bz-chat-inner contents with chat component when ready ↓ */}
        <section className="bz-chat-zone" aria-label="Merchant chat">
          <div className="bz-chat-inner">
            <span className="bz-chat-tag">Merchant Chat</span>
            <span className="bz-chat-sub">Direct negotiation — coming soon</span>
          </div>
        </section>

      </main>
    </>
  )
}
