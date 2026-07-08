export interface Article {
  slug: string
  title: string
  volume: number
  articleInVolume: number
  date: string        // display date, e.g. "July 13, 2026"
  publishDate: string // ISO yyyy-mm-dd — gates the locked state
  wordCount: number
}

export const ARTICLES: Article[] = [
  { slug: 'article-one',   title: 'The American Dream Can Never Die', volume: 1, articleInVolume: 1, date: 'July 6, 2026',  publishDate: '2026-07-06', wordCount: 1200 },
  { slug: 'article-two',   title: 'Article Two',   volume: 1, articleInVolume: 2, date: 'July 13, 2026', publishDate: '2026-07-13', wordCount: 980  },
  { slug: 'article-three', title: 'Article Three', volume: 1, articleInVolume: 3, date: 'July 20, 2026', publishDate: '2026-07-20', wordCount: 1450 },
  { slug: 'article-four',  title: 'Article Four',  volume: 1, articleInVolume: 4, date: 'July 27, 2026', publishDate: '2026-07-27', wordCount: 2100 },
]

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X']
export function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n)
}

// Compares against local calendar dates only (no time-of-day), so an
// article unlocks starting midnight local time on its publish date.
export function isLocked(article: Article, now: Date = new Date()): boolean {
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return todayIso < article.publishDate
}

export function getArticlesByVolume(): Map<number, Article[]> {
  const map = new Map<number, Article[]>()
  for (const a of ARTICLES) {
    if (!map.has(a.volume)) map.set(a.volume, [])
    map.get(a.volume)!.push(a)
  }
  return map
}
