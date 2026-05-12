export interface PaperConfig {
  origin: { left: number; top: number; width: number; height: number }
  href: string
  title: string
}

type Listener = (cfg: PaperConfig | null) => void
const listeners = new Set<Listener>()

export function firePaper(cfg: PaperConfig): void {
  listeners.forEach(fn => fn(cfg))
}

export function subscribePaper(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
