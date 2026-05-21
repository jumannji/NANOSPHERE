'use client'

const CX = 300, CY = 195, RX = 235, RY = 74

function pt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(r), CY + RY * Math.sin(r)]
}

function Hanger({ deg, scale = 1, opacity = 1 }: {
  deg: number; scale?: number; opacity?: number
}) {
  const [x, y] = pt(deg)
  const W  = 78 * scale
  const H  = 62 * scale
  const hk = 24 * scale
  const sw = 3.5
  const col = 'rgba(228,228,228,0.92)'

  return (
    <g opacity={opacity}>
      {/* Hook stem */}
      <line x1={x} y1={y + 2} x2={x} y2={y - hk}
        stroke={col} strokeWidth={sw * 0.72} strokeLinecap="round" />
      {/* Hook curl */}
      <path
        d={`M ${x},${y - hk} Q ${x + 8 * scale},${y - hk} ${x + 5 * scale},${y - hk - 14 * scale}`}
        fill="none" stroke={col} strokeWidth={sw * 0.65} strokeLinecap="round"
      />
      {/* Left arm */}
      <line x1={x} y1={y} x2={x - W} y2={y + H}
        stroke={col} strokeWidth={sw} strokeLinecap="round" />
      {/* Right arm */}
      <line x1={x} y1={y} x2={x + W} y2={y + H}
        stroke={col} strokeWidth={sw} strokeLinecap="round" />
      {/* Crossbar */}
      <line x1={x - W} y1={y + H} x2={x + W} y2={y + H}
        stroke={col} strokeWidth={sw * 0.6} strokeLinecap="round" />
      {/* Garment */}
      <rect
        x={x - W + 5} y={y + H}
        width={W * 2 - 10} height={H * 1.55}
        fill="rgba(255,255,255,0.05)"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="0.75"
        rx="2"
      />
    </g>
  )
}

export default function ClothingRack() {
  const [hlx1, hly1] = pt(228)
  const [hlx2, hly2] = pt(312)

  return (
    <div className="bz-rack-wrap">
      <svg
        className="bz-rack-svg"
        viewBox="0 0 600 960"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Clothing rack"
        role="img"
      >
        <defs>
          {/* White cylinder gradient for pole */}
          <linearGradient id="poleGrad" gradientUnits="userSpaceOnUse"
            x1={CX - 13} y1="0" x2={CX + 13} y2="0">
            <stop offset="0%"   stopColor="#111111" />
            <stop offset="18%"  stopColor="#777777" />
            <stop offset="40%"  stopColor="#d8d8d8" />
            <stop offset="50%"  stopColor="#ffffff" />
            <stop offset="60%"  stopColor="#d8d8d8" />
            <stop offset="82%"  stopColor="#777777" />
            <stop offset="100%" stopColor="#111111" />
          </linearGradient>

          {/* White metallic gradient for ring */}
          <linearGradient id="ringGrad" gradientUnits="userSpaceOnUse"
            x1={CX - RX} y1={CY} x2={CX + RX} y2={CY}>
            <stop offset="0%"   stopColor="#1e1e1e" />
            <stop offset="14%"  stopColor="#848484" />
            <stop offset="36%"  stopColor="#d0d0d0" />
            <stop offset="50%"  stopColor="#f8f8f8" />
            <stop offset="64%"  stopColor="#d0d0d0" />
            <stop offset="86%"  stopColor="#848484" />
            <stop offset="100%" stopColor="#1e1e1e" />
          </linearGradient>

          {/* Pole glow */}
          <filter id="poleGlow" filterUnits="userSpaceOnUse"
            x="238" y="178" width="124" height="804">
            <feGaussianBlur stdDeviation="12" />
          </filter>

          {/* Ring glow */}
          <filter id="ringGlow" filterUnits="userSpaceOnUse"
            x="28" y="82" width="544" height="244">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Back hangers (occluded by ring fill) ── */}
        <Hanger deg={270} scale={0.52} opacity={0.18} />
        <Hanger deg={315} scale={0.68} opacity={0.28} />
        <Hanger deg={225} scale={0.68} opacity={0.28} />

        {/* ── Pole glow behind the pole ── */}
        <rect
          x={CX - 13} y={CY} width={26} height={960 - CY}
          fill="rgba(255,255,255,0.22)"
          filter="url(#poleGlow)"
        />

        {/* ── Thick white pole ── */}
        <rect
          x={CX - 13} y={CY} width={26} height={960 - CY}
          fill="url(#poleGrad)"
        />

        {/* ── Ring: dark interior (occludes back hangers) ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#080808" />

        {/* ── Ring: wide ambient glow ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={32}
        />

        {/* ── Ring: main tube with glow ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={12}
          filter="url(#ringGlow)"
        />

        {/* ── Ring: top specular highlight ── */}
        <path
          d={`M ${hlx1},${hly1} A ${RX},${RY} 0 0 1 ${hlx2},${hly2}`}
          fill="none"
          stroke="rgba(255,255,255,0.62)"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* ── Ring: underside depth shadow ── */}
        <ellipse cx={CX} cy={CY + 8} rx={RX - 2} ry={RY - 2}
          fill="none"
          stroke="rgba(0,0,0,0.55)"
          strokeWidth="5"
        />

        {/* ── Front hangers ── */}
        <Hanger deg={180} scale={0.76} opacity={0.46} />
        <Hanger deg={0}   scale={0.76} opacity={0.46} />
        <Hanger deg={135} scale={0.88} opacity={0.66} />
        <Hanger deg={45}  scale={0.88} opacity={0.66} />
        <Hanger deg={90}  scale={1.00} opacity={1.00} />

        {/* ── Pole–ring junction collar ── */}
        <ellipse cx={CX} cy={CY} rx={18} ry={9}   fill="#aaaaaa" />
        <ellipse cx={CX} cy={CY} rx={14} ry={7}   fill="#cccccc" />
        <ellipse cx={CX} cy={CY} rx={9}  ry={4.5} fill="#eeeeee" />
        <ellipse cx={CX} cy={CY} rx={5}  ry={2.5} fill="#ffffff" />
      </svg>
    </div>
  )
}
