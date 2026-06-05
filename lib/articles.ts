export interface Article {
  slug: string
  title: string
  volume: number
  articleInVolume: number
  date: string
  wordCount: number
}

export const ARTICLES: Article[] = [
  { slug: 'article-one',   title: 'Article One',   volume: 1, articleInVolume: 1, date: 'Jan 2026', wordCount: 1200 },
  { slug: 'article-two',   title: 'Article Two',   volume: 1, articleInVolume: 2, date: 'Feb 2026', wordCount: 980  },
  { slug: 'article-three', title: 'Article Three', volume: 1, articleInVolume: 3, date: 'Mar 2026', wordCount: 1450 },
  { slug: 'article-four',  title: 'Article Four',  volume: 1, articleInVolume: 4, date: 'Apr 2026', wordCount: 2100 },
]

const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X']
export function toRoman(n: number): string {
  return ROMAN[n - 1] ?? String(n)
}

export function getArticlesByVolume(): Map<number, Article[]> {
  const map = new Map<number, Article[]>()
  for (const a of ARTICLES) {
    if (!map.has(a.volume)) map.set(a.volume, [])
    map.get(a.volume)!.push(a)
  }
  return map
}
