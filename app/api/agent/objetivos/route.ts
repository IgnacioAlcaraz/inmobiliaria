import { NextRequest } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/objetivos
 * Body: { userId, anio? }
 * Returns objetivos (goals) for the user, optionally filtered by year
 */
export async function POST(req: NextRequest) {
  const auth = await validateAgentRequest(req)
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth

  try {
    let query = supabase
      .from('objetivos')
      .select('*')
      .eq('user_id', userId)
      .order('anio', { ascending: false })
      .limit(10)

    const anio = body.anio as number | undefined
    if (anio) {
      query = query.eq('anio', anio)
    }

    const { data, error } = await query

    if (error) return agentError(error.message, 500)

    return agentSuccess(data || [], (data || []).length)
  } catch (err) {
    return agentError(err instanceof Error ? err.message : 'Unknown error', 500)
  }
}
