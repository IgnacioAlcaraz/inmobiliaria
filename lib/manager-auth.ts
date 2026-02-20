import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

const uuidSchema = z.string().uuid()

/**
 * Validates the AGENT_SECRET header, extracts managerId from body,
 * verifies the user has 'encargado' role, and returns the list of
 * assigned vendedor IDs (optionally filtered to a single vendedorId).
 */
export async function validateManagerRequest(
  req: NextRequest
): Promise<
  | {
      ok: true
      supabase: SupabaseClient
      managerId: string
      vendedorIds: string[]
      body: Record<string, unknown>
    }
  | { ok: false; response: NextResponse }
> {
  // 1. Check AGENT_SECRET header
  const secret = req.headers.get('x-agent-secret')
  const expectedSecret = process.env.AGENT_SECRET

  if (!expectedSecret || !secret || secret !== expectedSecret) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 }),
    }
  }

  // 2. Parse body
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 }),
    }
  }

  // 3. Validate managerId
  const managerParsed = uuidSchema.safeParse(body.managerId)
  if (!managerParsed.success) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'managerId is required and must be a valid UUID' },
        { status: 400 }
      ),
    }
  }

  const managerId = managerParsed.data

  // 4. Create admin Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 }),
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  // 5. Verify encargado role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', managerId)
    .single()

  if (!profile || (profile.role !== 'encargado' && profile.role !== 'admin')) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'User is not an encargado' },
        { status: 403 }
      ),
    }
  }

  // 6. Get assigned vendedor IDs
  const { data: assignments } = await supabase
    .from('manager_vendedores')
    .select('vendedor_id')
    .eq('manager_id', managerId)

  const allVendedorIds = (assignments || []).map((a) => a.vendedor_id)

  // 7. Optionally filter to a single vendedor
  let vendedorIds = allVendedorIds
  if (body.vendedorId) {
    const vParsed = uuidSchema.safeParse(body.vendedorId)
    if (!vParsed.success) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: 'vendedorId must be a valid UUID' },
          { status: 400 }
        ),
      }
    }
    if (!allVendedorIds.includes(vParsed.data)) {
      return {
        ok: false,
        response: NextResponse.json(
          { ok: false, error: 'Vendedor not assigned to this manager' },
          { status: 403 }
        ),
      }
    }
    vendedorIds = [vParsed.data]
  }

  if (vendedorIds.length === 0) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: 'No vendedores assigned to this manager' },
        { status: 404 }
      ),
    }
  }

  return { ok: true, supabase, managerId, vendedorIds, body }
}

/** Standard success response */
export function managerSuccess(data: unknown, count: number) {
  return NextResponse.json({ ok: true, data, meta: { count } })
}

/** Standard error response */
export function managerError(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status })
}
