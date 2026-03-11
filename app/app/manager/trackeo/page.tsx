import { redirect } from "next/navigation";
import { getCurrentUser, getCurrentProfile } from "@/lib/supabase/queries";
import { createClient } from "@/lib/supabase/server";
import { ManagerTrackeoGlobal } from "@/components/manager/manager-trackeo-reservas";
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
        <AppHeader title="Trackeo Global" />
        <div className="p-4 lg:p-6"><p className="text-muted-foreground">No tienes vendedores asignados.</p></div>
      </>
    );

  const year = new Date().getFullYear();
  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const [trackeoDiarioRes, captBusRes, vendedoresRes] = await Promise.all([
    supabase
      .from("trackeo_diario")
      .select("*")
      .in("user_id", vendedorIds)
      .gte("fecha", startOfYear)
      .lte("fecha", endOfYear)
      .order("fecha", { ascending: false })
      .limit(2000),
    supabase
      .from("captaciones_busquedas")
      .select("*")
      .in("user_id", vendedorIds)
      .gte("fecha_alta", startOfYear)
      .lte("fecha_alta", endOfYear)
      .limit(2000),
    supabase.from("profiles").select("*").in("id", vendedorIds),
  ]);
  // fetch manual overrides for this manager
  const manualRes = await supabase
    .from("trackeo_manual")
    .select("*")
    .eq("manager_id", user.id);

  return (
    <>
      <AppHeader title="Trackeo Global" />
      <div className="p-4 lg:p-6">
        <ManagerTrackeoGlobal
          trackeoDiario={trackeoDiarioRes?.data || []}
          captacionesBusquedas={captBusRes?.data || []}
          vendedores={vendedoresRes?.data || []}
          manualEntries={manualRes?.data || []}
          year={year}
        />
      </div>
    </>
  );
}
