import { tool } from "@langchain/core/tools";
import { z } from "zod";

async function callRoute(path: string, body: object): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-agent-secret": process.env.AGENT_SECRET!,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    return JSON.stringify(json.data ?? json);
  } catch (err) {
    return JSON.stringify({
      error: `Error al consultar ${path}: ${String(err)}`,
    });
  }
}

export function createVendedorTools(userId: string) {
  return [
    tool(
      async ({ anio }) => callRoute("/api/agent/resumen", { userId, anio }),
      {
        name: "get_resumen_usuario",
        description:
          "KPIs consolidados del vendedor: total cierres, honorarios, comisiones, puntas, captaciones activas/cerradas, trackeo acumulado y objetivos anuales. Usar cuando el usuario pide resumen, performance, cómo viene, KPIs o métricas generales.",
        schema: z.object({
          anio: z
            .number()
            .optional()
            .describe("Año a consultar. Default: año actual."),
        }),
      },
    ),

    tool(
      async ({ anio, mes, fechaDesde, fechaHasta }) =>
        callRoute("/api/agent/cierres", {
          userId,
          anio,
          mes,
          fechaDesde,
          fechaHasta,
        }),
      {
        name: "get_cierres_usuario",
        description:
          "Lista detallada de cierres con honorarios, comisiones, puntas y dirección de la propiedad. Soporta filtro por año, mes (1-12) o rango de fechas. Usar cuando el usuario pregunta por cierres, comisiones, honorarios o acumulado.",
        schema: z.object({
          anio: z.number().optional().describe("Año. Ej: 2026"),
          mes: z
            .number()
            .min(1)
            .max(12)
            .optional()
            .describe("Mes (1-12). Ej: 2 para febrero"),
          fechaDesde: z
            .string()
            .optional()
            .describe("Fecha inicio en formato YYYY-MM-DD"),
          fechaHasta: z
            .string()
            .optional()
            .describe("Fecha fin en formato YYYY-MM-DD"),
        }),
      },
    ),

    tool(
      async ({
        operacion,
        conCierre,
        sinCierre,
        diasHastaVencimiento,
        limit,
      }) =>
        callRoute("/api/agent/captaciones", {
          userId,
          operacion,
          conCierre,
          sinCierre,
          diasHastaVencimiento,
          limit,
        }),
      {
        name: "get_captaciones_usuario",
        description:
          "Lista de captaciones y búsquedas (pipeline de propiedades). Soporta filtro por tipo de operación, estado de cierre y vencimientos próximos. Usar cuando el usuario pregunta por captaciones, pipeline, propiedades activas, reservas o vencimientos.",
        schema: z.object({
          operacion: z
            .enum(["Venta", "Alquiler", "Temporario"])
            .optional()
            .describe("Tipo de operación"),
          conCierre: z
            .boolean()
            .optional()
            .describe("true = solo captaciones cerradas"),
          sinCierre: z
            .boolean()
            .optional()
            .describe("true = solo captaciones activas (sin fecha de cierre)"),
          diasHastaVencimiento: z
            .number()
            .optional()
            .describe(
              "Filtrar captaciones que vencen en los próximos N días. Ej: 15",
            ),
          limit: z
            .number()
            .optional()
            .describe("Cantidad máxima de resultados. Default 200"),
        }),
      },
    ),

    tool(
      async ({ anio, mes, fechaDesde, fechaHasta }) =>
        callRoute("/api/agent/trackeo", {
          userId,
          anio,
          mes,
          fechaDesde,
          fechaHasta,
        }),
      {
        name: "get_trackeo_usuario",
        description:
          "Registros diarios de actividad: llamadas, R1, expertise, captaciones, búsquedas, consultas, visitas, R2, reservas, devoluciones y cierres operativos. Usar cuando el usuario pregunta por actividad diaria, productividad, llamadas, visitas o consultas.",
        schema: z.object({
          anio: z.number().optional().describe("Año. Ej: 2026"),
          mes: z.number().min(1).max(12).optional().describe("Mes (1-12)"),
          fechaDesde: z
            .string()
            .optional()
            .describe("Fecha inicio en formato YYYY-MM-DD"),
          fechaHasta: z
            .string()
            .optional()
            .describe("Fecha fin en formato YYYY-MM-DD"),
        }),
      },
    ),

    tool(
      async ({ anio }) => callRoute("/api/agent/objetivos", { userId, anio }),
      {
        name: "get_objetivos_usuario",
        description:
          "Objetivos anuales del vendedor: facturación, puntas, comisión, ticket promedio, gastos, inversión, ahorro y pesos mensuales. Usar cuando el usuario pregunta por metas, objetivos, cuánto le falta, brecha o peso mensual.",
        schema: z.object({
          anio: z.number().optional().describe("Año. Default: año actual"),
        }),
      },
    ),

    tool(
      async ({
        estado,
        tipo_cliente,
        prioridad,
        clasificacion,
        instancia,
        pendientes,
        vencidos,
        limit,
      }) =>
        callRoute("/api/agent/contactos", {
          userId,
          estado,
          tipo_cliente,
          prioridad,
          clasificacion,
          instancia,
          pendientes,
          vencidos,
          limit,
        }),
      {
        name: "get_contactos_usuario",
        description:
          "Lista de contactos/clientes con estado, tipo, seguimiento y próximos pasos. Soporta filtro por clasificación (A+/A/B/C/D) e instancia de venta (contacto/llamado/prelisting/reunion/venta). Usar cuando el usuario pregunta por contactos, clientes, seguimientos pendientes, leads o pipeline de clientes.",
        schema: z.object({
          estado: z
            .enum([
              "Nuevo",
              "Contactado",
              "En reunion",
              "Negociacion",
              "Cerrado",
              "Perdido",
            ])
            .optional(),
          tipo_cliente: z
            .enum([
              "Comprador",
              "Vendedor",
              "Inversor",
              "Alquiler",
              "Tasacion",
              "Permuta",
            ])
            .optional(),
          prioridad: z.enum(["Baja", "Media", "Alta"]).optional(),
          clasificacion: z
            .enum(["A+", "A", "B", "C", "D"])
            .optional()
            .describe("Clasificación del contacto: A+ = top, D = frío"),
          instancia: z
            .enum(["contacto", "llamado", "prelisting", "reunion", "venta"])
            .optional()
            .describe("Instancia de la venta en la que está el contacto"),
          pendientes: z
            .boolean()
            .optional()
            .describe("true = solo seguimientos no realizados"),
          vencidos: z
            .boolean()
            .optional()
            .describe("true = seguimientos pendientes con fecha vencida"),
          limit: z
            .number()
            .optional()
            .describe("Cantidad máxima de resultados. Default 100"),
        }),
      },
    ),
  ];
}
