'use client'

const CX = 300, CY = 150, RX = 220, RY = 68

function pt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(r), CY + RY * Math.sin(r)]
}

function Hanger({ deg, scale, opacity }: { deg: number; scale: number; opacity: number }) {
  const [x, y] = pt(deg)
  const W  = 38 * scale
  const H  = 32 * scale
  const hk = 12 * scale
  const sw = Math.max(0.28, 0.88 * scale)

  return (
    <g opacity={opacity}>
      <line x1={x} y1={y + 1}    x2={x} y2={y - hk}    stroke="#7a7a7a" strokeWidth={sw} strokeLinecap="round" />
      <line x1={x} y1={y - hk}   x2={x + 3.5 * scale} y2={y - hk} stroke="#7a7a7a" strokeWidth={sw} strokeLinecap="round" />
      <line x1={x} y1={y}         x2={x - W}  y2={y + H}  stroke="#7a7a7a" strokeWidth={sw} strokeLinecap="round" />
      <line x1={x} y1={y}         x2={x + W}  y2={y + H}  stroke="#7a7a7a" strokeWidth={sw} strokeLinecap="round" />
      <line x1={x - W} y1={y + H} x2={x + W}  y2={y + H}  stroke="#7a7a7a" strokeWidth={sw * 0.55} strokeLinecap="round" />
    </g>
  )
}

export default function ClothingRack() {
  // Top highlight arc: from ~235° to ~305° (top of ellipse)
  const [hlx1, hly1] = pt(235)
  const [hlx2, hly2] = pt(305)

  return (
    <div className="bz-rack-wrap">
      <svg
        className="bz-rack-svg"
        viewBox="0 0 600 720"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clothing rack"
        role="img"
      >
        <defs>
          {/* Horizontal silver gradient for the rail tube surface */}
          <linearGradient id="railGrad" gradientUnits="userSpaceOnUse"
            x1={CX - RX} y1={CY} x2={CX + RX} y2={CY}>
            <stop offset="0%"   stopColor="#181818" />
            <stop offset="18%"  stopColor="#505050" />
            <stop offset="38%"  stopColor="#909090" />
            <stop offset="50%"  stopColor="#b8b8b8" />
            <stop offset="62%"  stopColor="#909090" />
            <stop offset="82%"  stopColor="#505050" />
            <stop offset="100%" stopColor="#181818" />
          </linearGradient>

          {/* Cylindrical gradient for the pole */}
          <linearGradient id="poleGrad" gradientUnits="userSpaceOnUse"
            x1={CX - 4} y1={CY} x2={CX + 4} y2={CY}>
            <stop offset="0%"   stopColor="#111111" />
            <stop offset="35%"  stopColor="#333333" />
            <stop offset="55%"  stopColor="#2c2c2c" />
            <stop offset="100%" stopColor="#0e0e0e" />
          </linearGradient>
        </defs>

        {/* ── Back hangers ── */}
        <Hanger deg={270} scale={0.44} opacity={0.22} />
        <Hanger deg={315} scale={0.58} opacity={0.32} />
        <Hanger deg={225} scale={0.58} opacity={0.32} />

        {/* ── Tapered pole ── */}
        <polygon
          points={`${CX - 3.5},${CY} ${CX + 3.5},${CY} ${CX + 2},622 ${CX - 2},622`}
          fill="url(#poleGrad)"
        />

        {/* ── Base cross ── */}
        <line x1={118} y1={622} x2={482} y2={622}
          stroke="#252525" strokeWidth="2.5" strokeLinecap="round" />
        <line x1={CX} y1={606} x2={CX} y2={638}
          stroke="#252525" strokeWidth="2.5" strokeLinecap="round" />

        {/* Ground shadow */}
        <ellipse cx={CX} cy={636} rx={185} ry={5}
          fill="rgba(0,0,0,0.18)" />

        {/* ── Rail: dark interior fill (occludes back hangers) ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#070707" />

        {/* ── Rail: barely-visible ambient glow ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="22" />

        {/* ── Rail: underside shadow (tube depth) ── */}
        <ellipse cx={CX} cy={CY + 5} rx={RX - 2} ry={RY - 2}
          fill="none" stroke="#141414" strokeWidth="2.5" />

        {/* ── Rail: main tube surface ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke="url(#railGrad)" strokeWidth="5" />

        {/* ── Rail: top catch-of-light ── */}
        <path
          d={`M ${hlx1},${hly1} A ${RX},${RY} 0 0 1 ${hlx2},${hly2}`}
          fill="none"
          stroke="rgba(230,230,230,0.22)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* ── Front hangers ── */}
        <Hanger deg={0}   scale={0.72} opacity={0.42} />
        <Hanger deg={180} scale={0.72} opacity={0.42} />
        <Hanger deg={45}  scale={0.87} opacity={0.62} />
        <Hanger deg={135} scale={0.87} opacity={0.62} />
        <Hanger deg={90}  scale={1.00} opacity={0.88} />

        {/* ── Pole–rail junction ── */}
        <ellipse cx={CX} cy={CY} rx={9} ry={4.5} fill="#222222" />
        <ellipse cx={CX} cy={CY} rx={6} ry={3}   fill="#333333" />
      </svg>
    </div>
  )
}
