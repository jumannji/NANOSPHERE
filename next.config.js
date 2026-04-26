/** @type {import('next').NextConfig} */

// SHA-256 hash of the synchronous inline theme script in app/layout.tsx.
// If that script is ever edited, recompute with:
//   node -e "const c=require('crypto');const s='<script-content>';console.log(\"'sha256-\"+c.createHash('sha256').update(s).digest('base64')+\"'\")"
const THEME_SCRIPT_HASH = "'sha256-nBvdAEKk9dpga/uyYAlSyV9GI2Ks75yqJHqukoQ3jh8='"

const ContentSecurityPolicy = [
  "default-src 'self'",

  // 'strict-dynamic' lets scripts loaded by our hashed script inherit trust (Next.js chunks).
  // 'unsafe-inline' is listed as a CSP2 fallback — CSP3 browsers ignore it when strict-dynamic is present.
  `script-src 'self' ${THEME_SCRIPT_HASH} 'strict-dynamic' 'unsafe-inline'`,

  // Next.js inlines critical CSS; fonts are served locally via next/font.
  "style-src 'self' 'unsafe-inline'",

  // next/font downloads and self-hosts all fonts at build time — no external font CDN needed.
  "font-src 'self'",

  // data: for base64 images; blob: for canvas toBlob / object URLs.
  "img-src 'self' data: blob:",

  // API calls stay on the same origin; extend with Anthropic endpoint when added.
  "connect-src 'self'",

  // No iframes anywhere on the site.
  "frame-src 'none'",
  "frame-ancestors 'none'",

  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join('; ')

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: ContentSecurityPolicy,
  },
  {
    // Belt-and-suspenders clickjacking protection (redundant with frame-ancestors but
    // honoured by older browsers that don't parse CSP frame-ancestors).
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    // Revoke access to hardware APIs the site never uses.
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  },
  {
    // 2-year HSTS, include subdomains, eligible for preload list.
    // Only effective over HTTPS — ignored locally and on plain-HTTP staging.
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
]

const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

module.exports = nextConfig
