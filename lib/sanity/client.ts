import { createClient } from 'next-sanity'

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2026-07-08'

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  // Freshness over speed: article pages must reflect Studio edits on the
  // very next load, so skip Sanity's CDN edge cache (which can lag ~60s).
  useCdn: false,
})
