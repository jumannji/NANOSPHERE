const HTML_TAG_RE      = /<[^>]*>/g
const JS_PROTOCOL_RE   = /javascript\s*:/gi
const EVENT_HANDLER_RE = /on\w+\s*=/gi
const NULL_BYTE_RE     = /\0/g

/**
 * Strip HTML, script injection patterns, and null bytes from a string.
 * Use on all user-supplied text before storing or rendering.
 */
export function sanitizeText(input: unknown, maxLength = 2000): string {
  if (typeof input !== 'string') return ''

  return input
    .slice(0, maxLength)
    .replace(NULL_BYTE_RE,     '')
    .replace(HTML_TAG_RE,      '')
    .replace(JS_PROTOCOL_RE,   '')
    .replace(EVENT_HANDLER_RE, '')
    .trim()
}

/**
 * Returns true only if the string contains no HTML or script patterns.
 * Use as a quick guard before accepting input from API request bodies.
 */
export function isSafeInput(input: string): boolean {
  return (
    !HTML_TAG_RE.test(input) &&
    !JS_PROTOCOL_RE.test(input) &&
    !EVENT_HANDLER_RE.test(input)
  )
}

/** Sanitize an entire object's string values one level deep. */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxLength = 2000
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, sanitizeText(v, maxLength)])
  )
}
