import { writeFileSync } from 'fs'

const SEGS = 96
const R    = 210   // sphere radius — smaller than text, reads as background element
const CX   = 500
const CY   = 500   // centered in the square

// Slight rotation so latitude rings show as ellipses (matches how the sphere looks mid-animation)
const AY = 0.38   // ~22° around y-axis
const AX = 0.10   // ~6° tilt

const cosAY = Math.cos(AY), sinAY = Math.sin(AY)
const cosAX = Math.cos(AX), sinAX = Math.sin(AX)

function proj(p) {
  let x = p[0] * cosAY + p[2] * sinAY
  let z = -p[0] * sinAY + p[2] * cosAY
  let y = p[1] * cosAX - z * sinAX
  z     = p[1] * sinAX + z * cosAX
  return { x: CX + x * R, y: CY + y * R, z }
}

// Build same circle set as HeroCanvas
const circles = []

// 9 longitude great circles
for (let i = 0; i < 9; i++) {
  const theta = (i / 9) * Math.PI
  const pts = []
  for (let s = 0; s < SEGS; s++) {
    const u = (s / SEGS) * Math.PI * 2
    pts.push([Math.cos(u) * Math.cos(theta), Math.sin(u), Math.cos(u) * Math.sin(theta)])
  }
  circles.push(pts)
}

// 7 latitude rings
for (const ly of [-0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75]) {
  const r = Math.sqrt(1 - ly * ly)
  const pts = []
  for (let s = 0; s < SEGS; s++) {
    const u = (s / SEGS) * Math.PI * 2
    pts.push([Math.cos(u) * r, ly, Math.sin(u) * r])
  }
  circles.push(pts)
}

// Depth-modulated line segments — same formula as HeroCanvas
const lines = []
for (const pts of circles) {
  const projected = pts.map(proj)
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i]
    const b = projected[(i + 1) % projected.length]
    const op = 0.03 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.22
    lines.push(
      `<line x1="${a.x.toFixed(2)}" y1="${a.y.toFixed(2)}" x2="${b.x.toFixed(2)}" y2="${b.y.toFixed(2)}" stroke="white" stroke-opacity="${op.toFixed(3)}" stroke-width="1.2"/>`
    )
  }
}

// Outer circle silhouette
lines.push(
  `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="white" stroke-opacity="0.40" stroke-width="1.2"/>`
)

// Verify sphere fits within padding
const pad = 80
console.log(`Sphere bounds: x ${CX - R}–${CX + R}, y ${CY - R}–${CY + R}`)
console.log(`Safe area:     x ${pad}–${1000 - pad}, y ${pad}–${1000 - pad}`)
console.log(`Sphere fits:   ${CX - R >= pad && CX + R <= 1000 - pad && CY - R >= pad && CY + R <= 1000 - pad}`)

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1000" height="1000" fill="#000000"/>

  <!-- Wireframe sphere (behind text) -->
  <g id="sphere">
${lines.map(l => '    ' + l).join('\n')}
  </g>

  <!-- Wordmark centered over sphere, exactly as on the homepage -->
  <text
    x="500"
    y="500"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="'Press Start 2P', 'Courier New', monospace"
    font-size="54"
    letter-spacing="2"
    fill="white"
    opacity="0.95"
  >NanoSphere</text>
</svg>`

writeFileSync('public/nanosphere-logo.svg', svg)
console.log(`Written: public/nanosphere-logo.svg  (${lines.length} sphere elements)`)
