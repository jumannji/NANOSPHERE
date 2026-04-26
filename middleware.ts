import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

// ─── Rate limiting ────────────────────────────────────────────────────────────
// In-memory store per serverless instance.
// For multi-region / multi-instance deployments, swap this for Upstash Redis.
const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000  // 1 minute
const MAX_RPS   = 10      // requests per window per IP

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  let entry = store.get(ip)

  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + WINDOW_MS }
    store.set(ip, entry)
    return { allowed: true, remaining: MAX_RPS - 1, resetAt: entry.resetAt }
  }

  entry.count++
  const remaining = Math.max(0, MAX_RPS - entry.count)
  return { allowed: entry.count <= MAX_RPS, remaining, resetAt: entry.resetAt }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Generate a fresh nonce for every page request.
  // Next.js reads x-nonce from the forwarded request headers and automatically
  // stamps it on all <script> tags it injects (RSC streaming scripts, chunks, etc.).
  const nonce = randomBytes(16).toString('base64')

  const csp = [
    "default-src 'self'",

    // nonce allows our inline theme script + Next.js's own injected scripts.
    // strict-dynamic propagates trust to scripts those load dynamically,
    // which covers Next.js chunk loading without needing 'self' (ignored by strict-dynamic).
    `script-src 'nonce-${nonce}' 'strict-dynamic'`,

    "style-src 'self' 'unsafe-inline'",

    // next/font downloads and self-hosts all fonts at build time.
    "font-src 'self'",

    // data: for base64 images; blob: for canvas toBlob / object URLs.
    "img-src 'self' data: blob:",

    // API calls stay on the same origin.
    // When the NanoBazaar route is added, no change needed here.
    "connect-src 'self'",

    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join('; ')

  // Pass nonce forward so layout.tsx can apply it to the inline theme script.
  const reqHeaders = new Headers(req.headers)
  reqHeaders.set('x-nonce', nonce)

  // Rate-limit API routes.
  if (pathname.startsWith('/api/')) {
    const ip = getIp(req)
    const { allowed, remaining, resetAt } = checkRateLimit(ip)

    const rlHeaders = {
      'X-RateLimit-Limit':     String(MAX_RPS),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset':     String(Math.ceil(resetAt / 1000)),
    }

    if (!allowed) {
      return NextResponse.json(
        { error: 'Too many requests — please wait before trying again.' },
        {
          status: 429,
          headers: {
            ...rlHeaders,
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'Content-Security-Policy': csp,
          },
        }
      )
    }

    const res = NextResponse.next({ request: { headers: reqHeaders } })
    res.headers.set('Content-Security-Policy', csp)
    Object.entries(rlHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  const res = NextResponse.next({ request: { headers: reqHeaders } })
  res.headers.set('Content-Security-Policy', csp)
  return res
}

// Run on every route except Next.js static assets (they don't need a CSP nonce).
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
