import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from './server'
import type { Profile } from '@/lib/types'

/**
 * Cross-request cache for profile data.
 * unstable_cache persists across separate server requests (backed by Next.js/Netlify cache).
 * Avoids a DB call per navigation for data that rarely changes.
 * TTL: 120 seconds. Cache key is user-scoped to prevent cross-user cache collisions.
 */
const _fetchProfileCached = (userId: string, accessToken: string) =>
  unstable_cache(
    async (): Promise<Profile | null> => {
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll: () => [],
            setAll: (_: { name: string; value: string; options: CookieOptions }[]) => {},
          },
          global: {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        }
      )
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      return data as Profile | null
    },
    // User-scoped cache key — prevents one user's profile from being served to another
    [`user-profile-${userId}`],
    { revalidate: 120 }
  )()

/**
 * Per-request deduplication with React.cache().
 * If layout and page both call getCurrentUser(), only one network request is made.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user ?? null
})

/**
 * Combines React.cache() (per-request dedup) with unstable_cache (cross-request persistence).
 * First navigation: hits DB, caches result.
 * Subsequent navigations within 2 min: returns cached result instantly.
 */
export const getCurrentProfile = cache(async () => {
  const user = await getCurrentUser()
  if (!user) return null

  // getSession reads from cookies only — no network call
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return null

  return _fetchProfileCached(user.id, session.access_token)
})
