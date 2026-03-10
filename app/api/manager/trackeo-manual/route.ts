import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const postSchema = z.object({
  user_id: z.string().uuid().optional().nullable(),
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12),
  section: z.string().min(1).max(50),
  key: z.string().min(1).max(100),
  value: z.number().optional().nullable(),
  text_value: z.string().max(1000).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export async function GET(request: Request) {
  const supabase = await createClient();
  // managerId from cached user
  const managerId = (
    await (await import("@/lib/supabase/queries")).getCurrentUser()
  )?.id;
  if (!managerId)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("trackeo_manual")
    .select("*")
    .eq("manager_id", managerId);
  if (error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const body = await request.json();
  const supabase = await createClient();
  const managerId = (
    await (await import("@/lib/supabase/queries")).getCurrentUser()
  )?.id;
  if (!managerId)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const parsed = postSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );

  const payload = { manager_id: managerId, ...parsed.data };

  const { data, error } = await supabase
    .from("trackeo_manual")
    .insert(payload)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  return NextResponse.json({ data });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const supabase = await createClient();
  const managerId = (
    await (await import("@/lib/supabase/queries")).getCurrentUser()
  )?.id;
  if (!managerId)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  if (!z.string().uuid().safeParse(body.id).success)
    return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (body.value !== undefined) {
    const v = Number(body.value);
    if (!isFinite(v))
      return NextResponse.json({ error: "Invalid value" }, { status: 400 });
    updates.value = v;
  }
  if (body.text_value !== undefined) {
    if (typeof body.text_value !== "string" || body.text_value.length > 1000)
      return NextResponse.json(
        { error: "Invalid text_value" },
        { status: 400 },
      );
    updates.text_value = body.text_value;
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string" || body.notes.length > 2000)
      return NextResponse.json({ error: "Invalid notes" }, { status: 400 });
    updates.notes = body.notes;
  }

  const { data, error } = await supabase
    .from("trackeo_manual")
    .update(updates)
    .eq("id", body.id)
    .eq("manager_id", managerId)
    .select()
    .single();
  if (error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  if (!data)
    return NextResponse.json(
      { error: "not found or not authorized" },
      { status: 404 },
    );
  return NextResponse.json({ data });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const supabase = await createClient();
  const managerId = (
    await (await import("@/lib/supabase/queries")).getCurrentUser()
  )?.id;
  if (!managerId)
    return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
  if (!id || !z.string().uuid().safeParse(id).success)
    return NextResponse.json({ error: "invalid id" }, { status: 400 });

  const { error, count } = await supabase
    .from("trackeo_manual")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("manager_id", managerId);
  if (error)
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  if (count === 0)
    return NextResponse.json(
      { error: "not found or not authorized" },
      { status: 404 },
    );
  return NextResponse.json({ ok: true });
}
