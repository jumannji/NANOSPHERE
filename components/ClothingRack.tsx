'use client'

const CX = 350, CY = 215
const RX = 310, RY = 65
const RING_DEG = -8
const RING_RAD = (RING_DEG * Math.PI) / 180
const POLE_L   = 230, POLE_R = 470   // 240px wide column

// Six hangers: 3 product slots (90°, 210°, 330°) + 3 fillers between them
const HANGER_BASES = [90, 150, 210, 270, 330, 30]

function pt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(r), CY + RY * Math.sin(r)]
}

// Ring point after the -8° tilt, in screen coordinates
function ptR(deg: number): [number, number] {
  const [x0, y0] = pt(deg)
  const dx = x0 - CX, dy = y0 - CY
  const c = Math.cos(RING_RAD), s = Math.sin(RING_RAD)
  return [CX + dx * c - dy * s, CY + dx * s + dy * c]
}

function Hanger({ deg, scale, opacity }: { deg: number; scale: number; opacity: number }) {
  const [x, y] = ptR(deg)
  const W  = 95 * scale
  const H  = 78 * scale
  const hk = 28 * scale
  const sw = 4.2
  const col = 'rgba(228,228,228,0.92)'

  return (
    <g opacity={opacity}>
      <line x1={x} y1={y + 2} x2={x} y2={y - hk}
        stroke={col} strokeWidth={sw * 0.70} strokeLinecap="round" />
      <path
        d={`M ${x},${y - hk} Q ${x + 9 * scale},${y - hk} ${x + 6 * scale},${y - hk - 16 * scale}`}
        fill="none" stroke={col} strokeWidth={sw * 0.62} strokeLinecap="round"
      />
      <line x1={x} y1={y} x2={x - W} y2={y + H}
        stroke={col} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x} y1={y} x2={x + W} y2={y + H}
        stroke={col} strokeWidth={sw} strokeLinecap="round" />
      <line x1={x - W} y1={y + H} x2={x + W} y2={y + H}
        stroke={col} strokeWidth={sw * 0.58} strokeLinecap="round" />
      <rect
        x={x - W + 6} y={y + H}
        width={W * 2 - 12} height={H * 1.55}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.9"
        rx="2"
      />
    </g>
  )
}

export default function ClothingRack({ rotOffset = 0 }: { rotOffset?: number }) {
  const [hlx1, hly1] = pt(228)
  const [hlx2, hly2] = pt(312)

  // Compute each hanger's depth from viewer and derive scale/opacity
  const hangers = HANGER_BASES.map(base => {
    const deg   = base + rotOffset
    const depth = Math.sin((deg * Math.PI) / 180)  // 1=front, -1=back
    const scale   = 0.52 + 0.48 * (depth + 1) / 2
    const opacity = 0.15 + 0.85 * (depth + 1) / 2
    return { deg, depth, scale, opacity }
  })

  // Split into back (rendered before pole+ring) and front (rendered after)
  // Within each group sort so deeper items are drawn first
  const back  = hangers.filter(h => h.depth <  0).sort((a, b) => a.depth - b.depth)
  const front = hangers.filter(h => h.depth >= 0).sort((a, b) => a.depth - b.depth)

  return (
    <div className="bz-rack-wrap">
      <svg
        className="bz-rack-svg"
        viewBox="0 0 700 1000"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clothing rack"
        role="img"
      >
        <defs>
          {/* White cylinder gradient for massive pole */}
          <linearGradient id="poleGrad" gradientUnits="userSpaceOnUse"
            x1={POLE_L} y1="0" x2={POLE_R} y2="0">
            <stop offset="0%"   stopColor="#080808" />
            <stop offset="14%"  stopColor="#585858" />
            <stop offset="37%"  stopColor="#d2d2d2" />
            <stop offset="50%"  stopColor="#ffffff" />
            <stop offset="63%"  stopColor="#d2d2d2" />
            <stop offset="86%"  stopColor="#585858" />
            <stop offset="100%" stopColor="#080808" />
          </linearGradient>

          <filter id="poleGlow" filterUnits="userSpaceOnUse"
            x="100" y="190" width="500" height="850">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* Back hangers — drawn before pole+ring so ring fill occludes them */}
        {back.map((h, i) => (
          <Hanger key={i} deg={h.deg} scale={h.scale} opacity={h.opacity} />
        ))}

        {/* Pole glow halo */}
        <rect x={POLE_L} y={CY} width={POLE_R - POLE_L} height={1000 - CY}
          fill="rgba(255,255,255,0.18)" filter="url(#poleGlow)" />

        {/* The monolith */}
        <rect x={POLE_L} y={CY - 2} width={POLE_R - POLE_L} height={1000 - CY + 2}
          fill="url(#poleGrad)" />

        {/* Tilted floating ring */}
        <g transform={`rotate(${RING_DEG}, ${CX}, ${CY})`}>
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#060606" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="50" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="26" />
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(215,215,215,0.92)" strokeWidth="14" />
          <path
            d={`M ${hlx1},${hly1} A ${RX},${RY} 0 0 1 ${hlx2},${hly2}`}
            fill="none" stroke="rgba(255,255,255,0.70)" strokeWidth="4" strokeLinecap="round"
          />
          <ellipse cx={CX} cy={CY + 9} rx={RX - 2} ry={RY - 2}
            fill="none" stroke="rgba(0,0,0,0.48)" strokeWidth="6" />
        </g>

        {/* Front hangers — drawn on top of ring */}
        {front.map((h, i) => (
          <Hanger key={i} deg={h.deg} scale={h.scale} opacity={h.opacity} />
        ))}
      </svg>
    </div>
  )
}
