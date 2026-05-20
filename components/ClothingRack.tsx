'use client'

// Rack geometry constants
const CX = 200, CY = 155, RX = 155, RY = 52

function railPt(deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  return [CX + RX * Math.cos(r), CY + RY * Math.sin(r)]
}

function Hanger({ deg, scale, opacity }: { deg: number; scale: number; opacity: number }) {
  const [x, y] = railPt(deg)
  const W  = 27 * scale
  const H  = 25 * scale
  const hk = 10 * scale
  const sw = Math.max(0.8, 1.6 * scale)
  const c  = '#b4b4b4'

  return (
    <g opacity={opacity}>
      {/* hook stem going up through rail */}
      <line x1={x} y1={y + 1} x2={x} y2={y - hk}       stroke={c} strokeWidth={sw} strokeLinecap="square" />
      {/* hook tip — small J curve (angular/pixel style) */}
      <line x1={x} y1={y - hk} x2={x + 4 * scale} y2={y - hk}          stroke={c} strokeWidth={sw} strokeLinecap="square" />
      <line x1={x + 4 * scale} y1={y - hk} x2={x + 4 * scale} y2={y - hk + 3 * scale} stroke={c} strokeWidth={sw} strokeLinecap="square" />
      {/* left shoulder */}
      <line x1={x} y1={y + 1} x2={x - W} y2={y + H}    stroke={c} strokeWidth={sw} strokeLinecap="square" />
      {/* right shoulder */}
      <line x1={x} y1={y + 1} x2={x + W} y2={y + H}    stroke={c} strokeWidth={sw} strokeLinecap="square" />
      {/* bottom bar */}
      <line x1={x - W} y1={y + H} x2={x + W} y2={y + H} stroke={c} strokeWidth={sw * 0.75} strokeLinecap="square" />
    </g>
  )
}

export default function ClothingRack() {
  return (
    <div className="bz-rack-wrap">
      <svg
        className="bz-rack-svg"
        viewBox="0 0 400 500"
        xmlns="http://www.w3.org/2000/svg"
        shapeRendering="crispEdges"
        aria-label="Clothing rack"
        role="img"
      >
        {/* ── Back hangers (drawn before rail so they appear behind it) ── */}
        <Hanger deg={270} scale={0.48} opacity={0.28} />
        <Hanger deg={315} scale={0.60} opacity={0.40} />
        <Hanger deg={225} scale={0.60} opacity={0.40} />

        {/* ── Pole ── */}
        <line x1={CX}     y1={CY}  x2={CX}     y2={432} stroke="#555" strokeWidth="7" strokeLinecap="square" />
        {/* Pole highlight edge */}
        <line x1={CX + 2} y1={CY}  x2={CX + 2} y2={432} stroke="rgba(255,255,255,0.07)" strokeWidth="2" strokeLinecap="square" />

        {/* ── Base cross ── */}
        <line x1={104} y1={432} x2={296} y2={432} stroke="#555" strokeWidth="7" strokeLinecap="square" />
        <line x1={CX}  y1={416} x2={CX}  y2={448} stroke="#555" strokeWidth="7" strokeLinecap="square" />
        {/* Feet — left end */}
        <line x1={104} y1={432} x2={91}      y2={450} stroke="#555" strokeWidth="5" strokeLinecap="square" />
        {/* Feet — right end */}
        <line x1={296} y1={432} x2={309}     y2={450} stroke="#555" strokeWidth="5" strokeLinecap="square" />
        {/* Feet — front end */}
        <line x1={CX}  y1={448} x2={CX - 13} y2={463} stroke="#555" strokeWidth="5" strokeLinecap="square" />
        <line x1={CX}  y1={448} x2={CX + 13} y2={463} stroke="#555" strokeWidth="5" strokeLinecap="square" />

        {/* ── Rail fill — dark interior occludes back hangers ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} fill="#080808" />

        {/* ── Rail outer glow ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke="rgba(247,197,0,0.16)" strokeWidth="16" />

        {/* ── Rail inner accent line (depth) ── */}
        <ellipse cx={CX} cy={CY + 5} rx={RX - 6} ry={RY - 5}
          fill="none" stroke="rgba(247,197,0,0.10)" strokeWidth="2" />

        {/* ── Rail main stroke ── */}
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY}
          fill="none" stroke="#f7c500" strokeWidth="4" />

        {/* ── Front hangers (on top of rail) ── */}
        <Hanger deg={0}   scale={0.74} opacity={0.58} />
        <Hanger deg={180} scale={0.74} opacity={0.58} />
        <Hanger deg={45}  scale={0.88} opacity={0.78} />
        <Hanger deg={135} scale={0.88} opacity={0.78} />
        <Hanger deg={90}  scale={1.00} opacity={1.00} />

        {/* ── Pole–rail junction block ── */}
        <rect x={CX - 6} y={CY - 4} width="12" height="8" fill="#f7c500" />
        <rect x={CX - 4} y={CY - 2} width="8"  height="4" fill="#b89200" />
      </svg>
    </div>
  )
}
