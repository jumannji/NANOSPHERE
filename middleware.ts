import { NextRequest, NextResponse } from 'next/server'

// In-memory store per serverless instance.
// For multi-region / multi-instance deployments, swap this for Upstash Redis.
const store = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS  = 60_000  // 1 minute
const MAX_RPS    = 10      // requests per window per IP

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

export function middleware(req: NextRequest) {
  const ip = getIp(req)
  const { allowed, remaining, resetAt } = checkRateLimit(ip)

  const rateLimitHeaders = {
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
          ...rateLimitHeaders,
          'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
        },
      }
    )
  }

  const res = NextResponse.next()
  Object.entries(rateLimitHeaders).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

// Only run on API routes — all other routes are unaffected.
export const config = {
  matcher: '/api/:path*',
}
