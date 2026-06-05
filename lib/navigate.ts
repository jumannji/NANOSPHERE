/**
 * Navigates to `href` using the browser's View Transitions API when available,
 * giving a true crossfade (old page fades out, new page fades in simultaneously).
 * Falls back to an instant snap on Firefox and browsers without the API,
 * which is preferable to any intermediate-color flash.
 */
export function navigateTo(href: string, push: (href: string) => void): void {
  if (typeof window === 'undefined') { push(href); return }
  if (
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !('startViewTransition' in document)
  ) {
    push(href)
    return
  }
  ;(document as any).startViewTransition(() => push(href))
}
