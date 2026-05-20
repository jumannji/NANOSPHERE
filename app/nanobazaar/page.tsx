'use client'

import React, { useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import BazaarSphere from '@/components/BazaarSphere'

// OG Collection end date — 3 weeks from site launch (2026-04-30)
const END_DATE = new Date('2026-05-21T00:00:00')

const PRODUCTS = [
  { id: 'hoodie',     name: 'Hoodie',     price: 85 },
  { id: 'tshirt',     name: 'T-Shirt',    price: 45 },
  { id: 'sweatpants', name: 'Sweatpants', price: 65 },
] as const

const COLORWAYS = [
  { name: 'yellow', color: 'rgb(247,197,0)' },
  { name: 'mint',   color: '#c8fffb'        },
  { name: 'red',    color: 'rgb(255,0,0)'   },
  { name: 'green',  color: '#319822'        },
] as const

type ProductId = typeof PRODUCTS[number]['id']

function useCountdown(end: Date) {
  const [rem, setRem] = useState({ days: 0, hours: 0, mins: 0, secs: 0 })
  useEffect(() => {
    function tick() {
      const diff = Math.max(0, end.getTime() - Date.now())
      const s    = Math.floor(diff / 1000)
      setRem({ days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), mins: Math.floor((s % 3600) / 60), secs: s % 60 })
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [end])
  return rem
}

function pad(n: number) { return String(n).padStart(2, '0') }

export default function NanoBazaarPage() {
  const { days, hours, mins, secs } = useCountdown(END_DATE)

  const [negotiating, setNegotiating] = useState<ProductId | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selected, setSelected] = useState<Partial<Record<ProductId, string>>>({})

  function handleNegotiate(id: ProductId) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setNegotiating(id)
    timerRef.current = setTimeout(() => { setNegotiating(null); timerRef.current = null }, 3000)
  }

  function pickColor(id: ProductId, name: string) {
    setSelected(s => ({ ...s, [id]: name }))
  }

  // Stall awning stripe colors map to colorways by index
  const awningColors = ['rgb(247,197,0)', '#c8fffb', '#319822']

  return (
    <>
      {/* Pixel scanline overlay */}
      <div aria-hidden className="bz-scanlines" />

      {/* ── Hanging decorations — left ───────────────── */}
      <div className="bz-decor bz-decor--left" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '5.2s', animationDelay: '0s' }}>
          <div className="bz-string" style={{ height: '64px' }} />
          <svg className="bz-pixel-lantern" width="14" height="20" viewBox="0 0 14 20" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="0" width="4" height="3" fill="#f7c500"/>
            <rect x="1" y="3" width="12" height="13" fill="#3d0055"/>
            <rect x="1" y="3" width="12" height="13" fill="none" stroke="#f7c500" strokeWidth="1"/>
            <rect x="4" y="6" width="2" height="7" fill="#f7c500" opacity="0.25"/>
            <rect x="8" y="6" width="2" height="7" fill="#f7c500" opacity="0.25"/>
            <rect x="5" y="16" width="4" height="3" fill="#f7c500"/>
          </svg>
          <div className="bz-tassel" style={{ '--tc': '#9b4dca' } as React.CSSProperties} />
        </div>

        <div className="bz-hang" style={{ animationDuration: '7.1s', animationDelay: '-3.2s' }}>
          <div className="bz-string" style={{ height: '100px' }} />
          <svg className="bz-pixel-lantern" width="10" height="16" viewBox="0 0 10 16" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="0" width="4" height="2" fill="#f7c500"/>
            <rect x="0" y="2" width="10" height="10" fill="#004a3d"/>
            <rect x="0" y="2" width="10" height="10" fill="none" stroke="#f7c500" strokeWidth="1"/>
            <rect x="3" y="12" width="4" height="2" fill="#f7c500"/>
          </svg>
          <div className="bz-tassel" style={{ '--tc': '#00aa88' } as React.CSSProperties} />
        </div>

        <div className="bz-hang" style={{ animationDuration: '4.6s', animationDelay: '-1.8s' }}>
          <div className="bz-string" style={{ height: '40px' }} />
          <div className="bz-fabric" />
        </div>
      </div>

      {/* ── Hanging decorations — right ──────────────── */}
      <div className="bz-decor bz-decor--right" aria-hidden="true">
        <div className="bz-hang" style={{ animationDuration: '4.9s', animationDelay: '-0.8s' }}>
          <div className="bz-string" style={{ height: '36px' }} />
          <div className="bz-fabric bz-fabric--ruby" />
        </div>

        <div className="bz-hang" style={{ animationDuration: '6.5s', animationDelay: '-2.5s' }}>
          <div className="bz-string" style={{ height: '88px' }} />
          <svg className="bz-pixel-lantern" width="10" height="16" viewBox="0 0 10 16" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="0" width="4" height="2" fill="#f7c500"/>
            <rect x="0" y="2" width="10" height="10" fill="#8b1a00"/>
            <rect x="0" y="2" width="10" height="10" fill="none" stroke="#f7c500" strokeWidth="1"/>
            <rect x="3" y="12" width="4" height="2" fill="#f7c500"/>
          </svg>
          <div className="bz-tassel" style={{ '--tc': '#ff4444' } as React.CSSProperties} />
        </div>

        <div className="bz-hang" style={{ animationDuration: '5.8s', animationDelay: '-4.1s' }}>
          <div className="bz-string" style={{ height: '72px' }} />
          <svg className="bz-pixel-lantern" width="14" height="20" viewBox="0 0 14 20" xmlns="http://www.w3.org/2000/svg">
            <rect x="5" y="0" width="4" height="3" fill="#f7c500"/>
            <rect x="1" y="3" width="12" height="13" fill="#005a8b"/>
            <rect x="1" y="3" width="12" height="13" fill="none" stroke="#f7c500" strokeWidth="1"/>
            <rect x="4" y="6" width="2" height="7" fill="#f7c500" opacity="0.25"/>
            <rect x="8" y="6" width="2" height="7" fill="#f7c500" opacity="0.25"/>
            <rect x="5" y="16" width="4" height="3" fill="#f7c500"/>
          </svg>
          <div className="bz-tassel" style={{ '--tc': '#00aaff' } as React.CSSProperties} />
        </div>
      </div>

      <Nav showSphere />

      <main className="bz-main">

        {/* ── Hero ─────────────────────────────────────────── */}
        <header className="bz-header">
          <div className="bz-hero-sphere">
            <BazaarSphere size={220} />
          </div>

          <h1 className="bz-title">NanoBazaar</h1>

          <div className="bz-countdown">
            <p className="bz-cd-label">OG Collection available until May 21, 2026</p>
            <div className="bz-cd-timer">
              <span>{pad(days)}<span className="bz-cd-unit">D</span></span>
              <span className="bz-cd-sep">:</span>
              <span>{pad(hours)}<span className="bz-cd-unit">H</span></span>
              <span className="bz-cd-sep">:</span>
              <span>{pad(mins)}<span className="bz-cd-unit">M</span></span>
              <span className="bz-cd-sep">:</span>
              <span>{pad(secs)}<span className="bz-cd-unit">S</span></span>
            </div>
          </div>
        </header>

        {/* ── Market stalls ────────────────────────────────── */}
        <section className="bz-market" aria-label="Market stalls">
          <div className="bz-stall-row">
            {PRODUCTS.map((p, i) => (
              <article key={p.id} className={`bz-stall bz-stall--${i}`}>
                {/* Stall awning */}
                <div
                  className="bz-awning"
                  style={{
                    background: `repeating-linear-gradient(90deg, ${awningColors[i]} 0px, ${awningColors[i]} 12px, #080808 12px, #080808 24px)`,
                  }}
                />

                {/* Stall body */}
                <div className="bz-stall-body">
                  <div className="bz-stall-sphere">
                    <BazaarSphere size={64} />
                  </div>

                  <h2 className="bz-stall-name">{p.name}</h2>
                  <p className="bz-stall-price">${p.price}</p>

                  {/* Colorway swatches */}
                  <div className="bz-swatches" role="group" aria-label="Colorways">
                    {COLORWAYS.map(cw => (
                      <button
                        key={cw.name}
                        className={`bz-swatch${selected[p.id] === cw.name ? ' bz-swatch--on' : ''}`}
                        style={{ background: cw.color }}
                        onClick={() => pickColor(p.id, cw.name)}
                        aria-label={`${cw.name} colorway`}
                        aria-pressed={selected[p.id] === cw.name}
                      />
                    ))}
                  </div>

                  {/* Negotiate */}
                  <button
                    className="bz-negotiate"
                    onClick={() => handleNegotiate(p.id)}
                  >
                    Negotiate
                  </button>

                  {negotiating === p.id && (
                    <p className="bz-coming-soon" aria-live="polite">
                      Coming soon
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════
            MERCHANT CHAT — INSERT COMPONENT HERE
            ─────────────────────────────────────────────────────────
            Drop the merchant chat widget inside .bz-chat-inner.
            The outer .bz-chat-zone section and its label can stay.
            ══════════════════════════════════════════════════════════ */}
        <section className="bz-chat-zone" aria-label="Merchant chat">
          <div className="bz-chat-inner">
            {/* ↓ REPLACE THIS PLACEHOLDER WITH THE CHAT COMPONENT ↓ */}
            <span className="bz-chat-tag">[ MERCHANT CHAT ]</span>
            <span className="bz-chat-sub">Direct negotiation — coming soon</span>
            {/* ↑ END PLACEHOLDER ↑ */}
          </div>
        </section>
        {/* ══════════════════════════════════════════════════════════
            END MERCHANT CHAT SECTION
            ══════════════════════════════════════════════════════════ */}

      </main>
    </>
  )
}
