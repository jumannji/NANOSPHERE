'use client'

const CX = 350, CY = 215
const RX = 310, RY = 65
const RING_DEG  = -8
const RING_RAD  = (RING_DEG * Math.PI) / 180
const POLE_L    = 230, POLE_R = 470   // 240px wide column

// Point on the unrotated ring ellipse
function pt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(r), CY + RY * Math.sin(r)]
}

// Point on the ring after the -8° tilt, in screen coordinates
function ptR(deg: number): [number, number] {
  const [x0, y0] = pt(deg)
  const dx = x0 - CX, dy = y0 - CY
  const c = Math.cos(RING_RAD), s = Math.sin(RING_RAD)
  return [CX + dx * c - dy * s, CY + dx * s + dy * c]
}

function Hanger({ deg, scale = 1, opacity = 1 }: {
  deg: number; scale?: number; opacity?: number
}) {
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

export default function ClothingRack() {
  // Highlight arc: top of ring in unrotated coords (used inside the rotated group)
  const [hlx1, hly1] = pt(228)
  const [hlx2, hly2] = pt(312)

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
          {/* White cylinder gradient — pole edges dark, center bright */}
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

          {/* Pole glow blur — wide soft halo behind the column */}
          <filter id="poleGlow" filterUnits="userSpaceOnUse"
            x="100" y="190" width="500" height="850">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>

        {/* ── Back hangers (drawn before ring fill so ring occludes them) ── */}
        <Hanger deg={270} scale={0.50} opacity={0.14} />
        <Hanger deg={295} scale={0.65} opacity={0.20} />
        <Hanger deg={245} scale={0.65} opacity={0.20} />

        {/* ── Pole glow — diffuse white halo behind the monolith ── */}
        <rect
          x={POLE_L} y={CY} width={POLE_R - POLE_L} height={1000 - CY}
          fill="rgba(255,255,255,0.18)"
          filter="url(#poleGlow)"
        />

        {/* ── The monolith — 240px wide white column ── */}
        <rect
          x={POLE_L} y={CY - 2} width={POLE_R - POLE_L} height={1000 - CY + 2}
          fill="url(#poleGrad)"
        />

        {/* ── Tilted floating ring ── all elements share the -8° rotation ── */}
        <g transform={`rotate(${RING_DEG}, ${CX}, ${CY})`}>

          {/* Dark interior — occludes back hangers and creates tube depth */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#060606" />

          {/* Outer diffuse glow */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(255,255,255,0.045)" strokeWidth="50" />

          {/* Inner atmospheric glow */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="26" />

          {/* Main tube — crisp white ring */}
          <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
            fill="none" stroke="rgba(215,215,215,0.92)" strokeWidth="14" />

          {/* Top specular — bright arc where light catches the tube */}
          <path
            d={`M ${hlx1},${hly1} A ${RX},${RY} 0 0 1 ${hlx2},${hly2}`}
            fill="none"
            stroke="rgba(255,255,255,0.70)"
            strokeWidth="4"
            strokeLinecap="round"
          />

          {/* Underside depth shadow */}
          <ellipse cx={CX} cy={CY + 9} rx={RX - 2} ry={RY - 2}
            fill="none" stroke="rgba(0,0,0,0.48)" strokeWidth="6" />

        </g>

        {/* ── Front hangers — hang vertically from tilted ring positions ── */}
        <Hanger deg={90}  scale={1.00} opacity={1.00} />
        <Hanger deg={65}  scale={0.88} opacity={0.66} />
        <Hanger deg={115} scale={0.88} opacity={0.66} />
        <Hanger deg={40}  scale={0.76} opacity={0.44} />
        <Hanger deg={140} scale={0.76} opacity={0.44} />

      </svg>
    </div>
  )
}
