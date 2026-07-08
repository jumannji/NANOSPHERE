import { defineQuery } from 'next-sanity'

export const ARTICLES_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)] | order(volume asc, articleNumber asc) {
    _id,
    title,
    subtitle,
    volume,
    articleNumber,
    publishDate,
    "slug": slug.current,
    coverImage,
    "plainText": pt::text(body)
  }
`)

export const ARTICLE_SLUGS_QUERY = defineQuery(`
  *[_type == "article" && defined(slug.current)].slug.current
`)

export const ARTICLE_QUERY = defineQuery(`
  *[_type == "article" && slug.current == $slug][0]{
    _id,
    title,
    subtitle,
    volume,
    articleNumber,
    publishDate,
    "slug": slug.current,
    coverImage,
    body,
    "plainText": pt::text(body)
  }
`)
