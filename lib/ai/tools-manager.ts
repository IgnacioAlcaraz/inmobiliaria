import { tool } from '@langchain/core/tools'
import { z } from 'zod'

async function callRoute(path: string, body: object): Promise<string> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-agent-secret': process.env.AGENT_SECRET!,
      },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    return JSON.stringify(json.data ?? json)
  } catch (err) {
    return JSON.stringify({ error: `Error al consultar ${path}: ${String(err)}` })
  }
}

export function createManagerTools(managerId: string) {
  return [
    tool(
      async ({ anio, vendedorId }) =>
        callRoute('/api/agent/manager/vendedores', { managerId, vendedorId, anio }),
      {
        name: 'get_vendedores_manager',
        description:
          'Lista de vendedores asignados al encargado con sus IDs y nombres. Usar cuando el encargado menciona un vendedor por nombre para obtener su ID, o cuando pide la lista del equipo.',
        schema: z.object({
          vendedorId: z.string().uuid().optional().describe('UUID del vendedor específico'),
          anio: z.number().optional(),
        }),
      }
    ),

    tool(
      async ({ anio, vendedorId }) =>
        callRoute('/api/agent/manager/resumen', { managerId, anio, vendedorId }),
      {
        name: 'get_resumen_manager',
        description:
          'KPIs consolidados del equipo o de un vendedor específico: cierres, honorarios, comisiones, puntas, captaciones, llamadas, visitas y % vs objetivo. Usar cuando el encargado pide resumen, cómo viene el equipo, performance o ranking.',
        schema: z.object({
          anio: z.number().optional().describe('Año. Default: año actual'),
          vendedorId: z.string().uuid().optional().describe('UUID del vendedor. Si se omite, devuelve todo el equipo'),
        }),
      }
    ),

    tool(
      async ({ vendedorId, anio, mes, desde, hasta }) =>
        callRoute('/api/agent/manager/cierres', { managerId, vendedorId, anio, mes, desde, hasta }),
      {
        name: 'get_cierres_manager',
        description:
          'Cierres del equipo o de un vendedor específico con honorarios y comisiones. Soporta filtro por año, mes o rango de fechas.',
        schema: z.object({
          vendedorId: z.string().uuid().optional().describe('UUID del vendedor. Si se omite, devuelve todo el equipo'),
          anio: z.number().optional(),
          mes: z.number().min(1).max(12).optional().describe('Mes (1-12)'),
          desde: z.string().optional().describe('Fecha inicio YYYY-MM-DD'),
          hasta: z.string().optional().describe('Fecha fin YYYY-MM-DD'),
        }),
      }
    ),

    tool(
      async ({ vendedorId, operacion, conCierre, diasHastaVencimiento }) =>
        callRoute('/api/agent/manager/captaciones', { managerId, vendedorId, operacion, conCierre, diasHastaVencimiento }),
      {
        name: 'get_captaciones_manager',
        description:
          'Captaciones del equipo o de un vendedor específico. Soporta filtro por tipo de operación, estado de cierre y vencimientos próximos.',
        schema: z.object({
          vendedorId: z.string().uuid().optional(),
          operacion: z.enum(['Venta', 'Alquiler', 'Temporario']).optional(),
          conCierre: z.boolean().optional(),
          diasHastaVencimiento: z.number().optional().describe('Captaciones que vencen en los próximos N días'),
        }),
      }
    ),

    tool(
      async ({ vendedorId, anio, mes, desde, hasta }) =>
        callRoute('/api/agent/manager/trackeo', { managerId, vendedorId, anio, mes, desde, hasta }),
      {
        name: 'get_trackeo_manager',
        description:
          'Actividad diaria del equipo o de un vendedor específico: llamadas, visitas, consultas, reservas, etc. Soporta filtro por período.',
        schema: z.object({
          vendedorId: z.string().uuid().optional(),
          anio: z.number().optional(),
          mes: z.number().min(1).max(12).optional(),
          desde: z.string().optional().describe('Fecha inicio YYYY-MM-DD'),
          hasta: z.string().optional().describe('Fecha fin YYYY-MM-DD'),
        }),
      }
    ),

    tool(
      async ({ vendedorId, anio }) =>
        callRoute('/api/agent/manager/objetivos', { managerId, vendedorId, anio }),
      {
        name: 'get_objetivos_manager',
        description:
          'Objetivos anuales del equipo o de un vendedor específico: facturación, puntas, comisión y pesos mensuales.',
        schema: z.object({
          vendedorId: z.string().uuid().optional(),
          anio: z.number().optional(),
        }),
      }
    ),

    tool(
      async ({ vendedorId, estado, tipo_cliente, prioridad, pendientes, vencidos, limit }) =>
        callRoute('/api/agent/manager/contactos', { managerId, vendedorId, estado, tipo_cliente, prioridad, pendientes, vencidos, limit }),
      {
        name: 'get_contactos_manager',
        description:
          'Contactos del equipo o de un vendedor específico. Útil para ver pipeline de clientes, seguimientos pendientes o leads por estado.',
        schema: z.object({
          vendedorId: z.string().uuid().optional(),
          estado: z.enum(['Nuevo', 'Contactado', 'En reunion', 'Negociacion', 'Cerrado', 'Perdido']).optional(),
          tipo_cliente: z.enum(['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta']).optional(),
          prioridad: z.enum(['Baja', 'Media', 'Alta']).optional(),
          pendientes: z.boolean().optional(),
          vencidos: z.boolean().optional(),
          limit: z.number().optional(),
        }),
      }
    ),
  ]
}
