import { NextRequest } from "next/server";
import {
  validateManagerRequest,
  managerSuccess,
  managerError,
} from "@/lib/manager-auth";
import { validAnio } from "@/lib/agent-validate";

const VALID_PERIODOS = ["Q1", "Q2", "Q3", "Q4", "year"] as const;

/**
 * POST /api/agent/manager/okr-global
 * Body: { managerId, anio?, periodo? } periodo: 'Q1'|'Q2'|'Q3'|'Q4'|'year'
 * Returns aggregated objective vs achieved for trimesters or full year
 */
export async function POST(req: NextRequest) {
  const auth = await validateManagerRequest(req);
  if (!auth.ok) return auth.response;

  const { supabase, managerId, vendedorIds, body } = auth;
  const anio = validAnio(body.anio) ?? new Date().getFullYear();
  const periodo = VALID_PERIODOS.includes(
    body.periodo as (typeof VALID_PERIODOS)[number],
  )
    ? (body.periodo as string)
    : "year";

  try {
    // fetch objetivos_anuales for vendedores + manager's own center objective
    const { data: objetivos, error: oErr } = await supabase
      .from("objetivos_anuales")
      .select("*")
      .in("user_id", [...vendedorIds, managerId])
      .eq("year", anio);

    if (oErr) return managerError("Error objetivos: " + oErr.message, 500);

    // compute objective sums
    const objetivosList = objetivos || [];
    const sumObj = objetivosList.reduce(
      (
        acc: {
          objetivo_comisiones_brutas: number;
          objetivo_facturacion_total: number;
        },
        o: any,
      ) => {
        acc.objetivo_comisiones_brutas += Number(
          o.objetivo_comisiones_brutas || 0,
        );
        acc.objetivo_facturacion_total += Number(
          o.objetivo_facturacion_total || 0,
        );
        return acc;
      },
      { objetivo_comisiones_brutas: 0, objetivo_facturacion_total: 0 },
    );

    if (objetivosList.length === 0) {
      return managerError(
        `No hay objetivos anuales cargados para el equipo en ${anio}. Para cargar objetivos, cada vendedor debe completar su sección "Objetivos" en la app.`,
        404,
      );
    }

    // compute achieved honorarios from cierres
    // Use porcentaje_honorarios to compute on the fly (same as other agent routes)
    const { data: cierres, error: crErr } = await supabase
      .from("cierres")
      .select("fecha, valor_cierre, porcentaje_honorarios, porcentaje_agente")
      .in("user_id", vendedorIds)
      .gte("fecha", `${anio}-01-01`)
      .lte("fecha", `${anio}-12-31`);
    if (crErr) return managerError("Error cierres: " + crErr.message, 500);

    // helper to filter by quarter
    const quarterRanges: Record<string, [string, string]> = {
      Q1: [`${anio}-01-01`, `${anio}-03-31`],
      Q2: [`${anio}-04-01`, `${anio}-06-30`],
      Q3: [`${anio}-07-01`, `${anio}-09-30`],
      Q4: [`${anio}-10-01`, `${anio}-12-31`],
    };

    const computeForPeriod = (p: string) => {
      let filtered: typeof cierres = cierres || [];
      if (p !== "year") {
        const range = quarterRanges[p];
        filtered = (cierres || []).filter(
          (c) => c.fecha >= range[0] && c.fecha <= range[1],
        );
      }
      const honorarios_brutos = (filtered || []).reduce((acc, c) => {
        return (
          acc + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
        );
      }, 0);
      const comision_agente = (filtered || []).reduce((acc, c) => {
        const hon =
          (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100;
        return acc + (hon * Number(c.porcentaje_agente)) / 100;
      }, 0);
      return {
        honorarios_brutos: Math.round(honorarios_brutos * 100) / 100,
        ingresos_netos:
          Math.round((honorarios_brutos - comision_agente) * 100) / 100,
      };
    };

    if (periodo === "year") {
      const yearVals = computeForPeriod("year");
      return managerSuccess({ anio, objetivo: sumObj, achieved: yearVals }, 1);
    }

    // return per-quarter values
    const quarters = ["Q1", "Q2", "Q3", "Q4"].map((q) => ({
      q,
      ...computeForPeriod(q),
    }));
    return managerSuccess(
      { anio, objetivo: sumObj, quarters },
      quarters.length,
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("okr-global error:", msg, err);
    return managerError(
      process.env.NODE_ENV === "development"
        ? `Error interno: ${msg}`
        : "Error interno",
      500,
    );
  }
}
