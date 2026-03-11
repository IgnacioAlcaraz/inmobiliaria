import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { ManagerOkrGlobal } from "@/components/manager/manager-okr-global";
import { AppHeader } from "@/components/app-header";

export default async function Page() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getCurrentProfile();
  if (!profile || (profile.role !== "encargado" && profile.role !== "admin")) {
    redirect("/app/dashboard");
  }

  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("manager_vendedores")
    .select("vendedor_id")
    .eq("manager_id", user.id);
  const vendedorIds = (assignments || []).map((a) => a.vendedor_id);
  if (vendedorIds.length === 0)
    return (
      <>
        <AppHeader title="OKR Global" />
        <div className="p-4 lg:p-6"><p className="text-muted-foreground">No tienes vendedores asignados.</p></div>
      </>
    );

  const year = new Date().getFullYear();
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const [cierresRes, objetivosRes, profilesRes] = await Promise.all([
    supabase
      .from("cierres")
      .select("*, captacion:captaciones(id, direccion, operacion, moneda)")
      .in("user_id", vendedorIds)
      .gte("fecha", startOfYear)
      .lte("fecha", endOfYear)
      .order("created_at", { ascending: true })
      .limit(500),
    supabase
      .from("objetivos_anuales")
      .select("*")
      .in("user_id", [...vendedorIds, user.id])
      .eq("year", year),
    supabase
      .from("profiles")
      .select("id, full_name, role, created_at")
      .in("id", vendedorIds),
  ]);

  return (
    <>
      <AppHeader title="OKR Global" />
      <div className="p-4 lg:p-6">
        <ManagerOkrGlobal
          objetivos={objetivosRes.data || []}
          cierres={cierresRes.data || []}
          vendedores={profilesRes.data || []}
          year={year}
          managerId={user.id}
        />
      </div>
    </>
  );
}
