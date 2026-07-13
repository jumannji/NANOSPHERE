import type { SanityImageSource } from '@sanity/image-url'

export interface Article {
  _id: string
  slug: string
  title: string
  subtitle?: string | null
  volume: number
  articleNumber: number
  publishDate: string // ISO yyyy-mm-dd — gates the locked state
  coverImage?: SanityImageSource | null
  plainText?: string | null // extracted from body, used for word count
  body?: unknown // Portable Text blocks, only present on the single-article query
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
export function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n)
}

// Compares against local calendar dates only (no time-of-day), so an
// article unlocks starting midnight local time on its publish date.
export function isLocked(article: Pick<Article, 'publishDate'>, now: Date = new Date()): boolean {
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return todayIso < article.publishDate
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getWordCount(plainText?: string | null): number {
  if (!plainText) return 0
  return plainText.trim().split(/\s+/).filter(Boolean).length
}

export function estimateReadingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 200))
}

interface PortableTextSpan { text?: string }
interface PortableTextBlock { _type: string; children?: PortableTextSpan[] }

// Pulls the plain text of the first paragraph block out of a Portable
// Text body, for the font-comparison sampler on the article page.
export function getFirstParagraphText(body: unknown): string | null {
  if (!Array.isArray(body)) return null
  const block = body.find(
    (b): b is PortableTextBlock => !!b && typeof b === 'object' && (b as PortableTextBlock)._type === 'block',
  )
  const text = block?.children?.map(c => c.text ?? '').join('').trim()
  return text || null
}

export function getArticlesByVolume(articles: Article[]): Map<number, Article[]> {
  const map = new Map<number, Article[]>()
  for (const a of articles) {
    if (!map.has(a.volume)) map.set(a.volume, [])
    map.get(a.volume)!.push(a)
  }
  return map
}
