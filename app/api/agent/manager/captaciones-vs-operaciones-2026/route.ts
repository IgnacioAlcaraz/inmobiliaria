import { NextRequest } from "next/server";
import {
  validateManagerRequest,
  managerSuccess,
  managerError,
} from "@/lib/manager-auth";
import { validAnio } from "@/lib/agent-validate";

/**
 * POST /api/agent/manager/captaciones-vs-operaciones-2026
 * Body: { managerId, anio? }
 * Returns captaciones and operaciones cerradas for the given year across vendedores
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req);
  if (!auth.ok) return auth.response;

  const { supabase, vendedorIds, body } = auth;
  const anio = validAnio(body.anio) ?? new Date().getFullYear();

  try {
    // captaciones in year
    const { data: caps, error: cErr } = await supabase
      .from("captaciones_busquedas")
      .select(
        "id, fecha_alta, direccion, barrio, ciudad, operacion, valor_publicado, moneda, fecha_reserva, fecha_cierre, honorarios_totales",
      )
      .in("user_id", vendedorIds)
      .gte("fecha_alta", `${anio}-01-01`)
      .lte("fecha_alta", `${anio}-12-31`);

    if (cErr) return managerError("Error captaciones: " + cErr.message, 500);

    // cierres in year — compute honorarios on the fly
    const { data: cierresRaw, error: crErr } = await supabase
      .from("cierres")
      .select(
        "id, fecha, id_direccion, valor_cierre, porcentaje_honorarios, porcentaje_agente",
      )
      .in("user_id", vendedorIds)
      .gte("fecha", `${anio}-01-01`)
      .lte("fecha", `${anio}-12-31`);

    if (crErr) return managerError("Error cierres: " + crErr.message, 500);

    const cierres = (cierresRaw || []).map((c) => {
      const honorarios_totales =
        Math.round(
          ((Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100) *
            100,
        ) / 100;
      const comision_agente =
        Math.round(
          ((honorarios_totales * Number(c.porcentaje_agente)) / 100) * 100,
        ) / 100;
      return {
        id: c.id,
        fecha: c.fecha,
        id_direccion: c.id_direccion,
        valor_cierre: c.valor_cierre,
        honorarios_totales,
        comision_agente,
      };
    });

    return managerSuccess(
      { captaciones: caps || [], cierres },
      (caps || []).length + cierres.length,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("captaciones-vs-operaciones-2026 error:", msg);
    return managerError(
      process.env.NODE_ENV === "development"
        ? `Error interno: ${msg}`
        : "Error interno",
      500,
    );
  }
}
