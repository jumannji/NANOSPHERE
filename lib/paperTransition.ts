import { fireNav } from '@/lib/navTransition'

export interface PaperConfig {
  origin: { left: number; top: number; width: number; height: number }
  href: string
  title: string
}

type Listener = (cfg: PaperConfig | null) => void

export function firePaper(cfg: PaperConfig): void {
  fireNav({ href: cfg.href })
}

export function subscribePaper(_fn: Listener): () => void {
  return () => {}
}
