export interface NavConfig { href: string }

type Listener = (cfg: NavConfig | null) => void
const listeners = new Set<Listener>()

export function fireNav(cfg: NavConfig): void {
  listeners.forEach(fn => fn(cfg))
}

export function subscribeNav(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
