import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

const uuidSchema = z.string().uuid('userId must be a valid UUID')

/**
 * Validates the AGENT_SECRET header and extracts + validates userId from body.
 * Returns the Supabase admin client and userId if valid, or a NextResponse error.
 */
export async function validateAgentRequest(
  req: NextRequest
): Promise<
  | { ok: true; supabase: ReturnType<typeof createClient>; userId: string }
  | { ok: false; response: NextResponse }
> {
  // 1. Check AGENT_SECRET header
  const secret = req.headers.get('x-agent-secret')
  const expectedSecret = process.env.AGENT_SECRET

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      ),
    }
  }

  // 2. Extract and validate userId from body
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Invalid JSON body' },
        { status: 400 }
      ),
    }
  }

  const parsed = uuidSchema.safeParse(body.userId)
  if (!parsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'userId is required and must be a valid UUID' },
        { status: 400 }
      ),
    }
  }

  // 3. Create Supabase admin client (bypasses RLS)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      ),
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  return { ok: true, supabase, userId: parsed.data, ...body }
}

/** Standard success response */
export function agentSuccess(data: unknown, count: number) {
  return NextResponse.json({ ok: true, data, meta: { count } })
}

/** Standard error response */
export function agentError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}
