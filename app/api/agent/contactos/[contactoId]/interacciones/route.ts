import { NextRequest, NextResponse } from 'next/server'
import { validateAgentRequest, agentSuccess, agentError } from '@/lib/agent-auth'

/**
 * POST /api/agent/contactos/:contactoId/interacciones
 * Body: { userId, tipo, fecha?, duracion?, resultado?, notas? }
 */
export async function POST(req, context) {
  const { params } = context;
  const { contactoId } = params;
  if (!auth.ok) return auth.response

  const { supabase, userId, body } = auth
  const contactoId = params.contactoId

  try {
    const tipo = (body.tipo || '').toString()
    if (!['llamada','prelisting','reunion','visita','reserva','cierre','nota'].includes(tipo)) {
      return agentError('Tipo de interacción inválido', 400)
    }

    const payload: Record<string, unknown> = {
      contacto_id: contactoId,
      user_id: userId,
      tipo,
      fecha: body.fecha || new Date().toISOString(),
      duracion: body.duracion ?? null,
      resultado: body.resultado ?? null,
      notas: body.notas ?? null,
    }

    const { data, error } = await supabase.from('contacto_interacciones').insert(payload).select().single()
    if (error) {
      return agentError('Error al crear interacción: ' + error.message, 500)
    }

    return agentSuccess(data, 1)
  } catch (err) {
    console.error('interacciones route error', err)
    return agentError('Error interno', 500)
  }
}
