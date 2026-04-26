/** @type {import('next').NextConfig} */

// CSP is handled per-request by middleware.ts so it can embed a fresh nonce.
// All other security headers live here and are applied statically to every route.

const securityHeaders = [
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
