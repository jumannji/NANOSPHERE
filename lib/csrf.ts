import { headers } from 'next/headers'

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL,
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean) as string[]

/**
 * Validate the Origin / Referer header on mutating requests.
 *
 * Call at the top of POST Route Handlers:
 *   export async function POST(req: Request) {
 *     validateCsrfOrigin()
 *     ...
 *   }
 *
 * Note: Next.js Server Actions validate the Origin header automatically.
 * This helper is for plain Route Handlers that accept POST/PUT/DELETE.
 */
export function validateCsrfOrigin(): void {
  const headersList = headers()
  const origin  = headersList.get('origin')
  const referer = headersList.get('referer')
  const source  = origin ?? referer

  if (!source) {
    throw new CsrfError('Request is missing an Origin header')
  }

  const allowed = ALLOWED_ORIGINS.some(o => source.startsWith(o))
  if (!allowed) {
    throw new CsrfError(`Origin not allowed: ${source}`)
  }
}

export class CsrfError extends Error {
  readonly status = 403
  constructor(message: string) {
    super(message)
    this.name = 'CsrfError'
  }
}
