import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  // managerId from cached user
  const managerId = (await (await import('@/lib/supabase/queries')).getCurrentUser())?.id
  if (!managerId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const { data, error } = await supabase.from('trackeo_manual').select('*').eq('manager_id', managerId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  const managerId = (await (await import('@/lib/supabase/queries')).getCurrentUser())?.id
  if (!managerId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  const payload = {
    manager_id: managerId,
    user_id: body.user_id ?? null,
    year: body.year,
    month: body.month,
    section: body.section,
    key: body.key,
    value: body.value ?? null,
    text_value: body.text_value ?? null,
    notes: body.notes ?? null,
  }

  const { data, error } = await supabase.from('trackeo_manual').insert(payload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(request: Request) {
  const body = await request.json()
  const supabase = await createClient()
  const managerId = (await (await import('@/lib/supabase/queries')).getCurrentUser())?.id
  if (!managerId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })

  if (!body.id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const updates: any = {}
  if (body.value !== undefined) updates.value = body.value
  if (body.text_value !== undefined) updates.text_value = body.text_value
  if (body.notes !== undefined) updates.notes = body.notes

  const { data, error } = await supabase.from('trackeo_manual').update(updates).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const supabase = await createClient()
  const managerId = (await (await import('@/lib/supabase/queries')).getCurrentUser())?.id
  if (!managerId) return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
  if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

  const { error } = await supabase.from('trackeo_manual').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
