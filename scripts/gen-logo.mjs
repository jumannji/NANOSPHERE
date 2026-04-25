import { writeFileSync } from 'fs'

const SEGS = 96
const R    = 270   // sphere radius
const CX   = 500   // sphere center x
const CY   = 370   // sphere center y (upper portion of 1000x1000)

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

// Orthographic projection at t=0 (no rotation)
function proj(p) {
  return { x: CX + p[0] * R, y: CY + p[1] * R, z: p[2] }
}

// Generate line segments with depth-modulated opacity
const lines = []
for (const pts of circles) {
  const projected = pts.map(proj)
  for (let i = 0; i < projected.length; i++) {
    const a = projected[i]
    const b = projected[(i + 1) % projected.length]
    // Same formula as HeroCanvas: front-facing segments are brighter
    const op = 0.03 + ((a.z + b.z) * 0.5 + 1) * 0.5 * 0.22
    lines.push(
      `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" stroke="white" stroke-opacity="${op.toFixed(3)}" stroke-width="1"/>`
    )
  }
}

// Outer circle silhouette
lines.push(
  `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="white" stroke-opacity="0.38" stroke-width="1"/>`
)

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&amp;display=swap');
    </style>
  </defs>

  <!-- Background -->
  <rect width="1000" height="1000" fill="#000000"/>

  <!-- Wireframe sphere -->
  <g id="sphere">
${lines.map(l => '    ' + l).join('\n')}
  </g>

  <!-- Wordmark -->
  <text
    x="500"
    y="790"
    text-anchor="middle"
    dominant-baseline="middle"
    font-family="'Press Start 2P', 'Courier New', monospace"
    font-size="38"
    letter-spacing="3"
    fill="white"
    opacity="0.92"
  >NanoSphere</text>
</svg>`

writeFileSync('public/nanosphere-logo.svg', svg)
console.log('Written to public/nanosphere-logo.svg')
console.log(`Sphere segments: ${lines.length - 1} lines + 1 outer circle`)
