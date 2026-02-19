import { z } from 'zod'

// ==========================================
// CAPTACIONES Y BUSQUEDAS
// ==========================================
export const captacionSchema = z.object({
  fecha_alta: z.string().min(1, 'La fecha es requerida'),
  autorizacion: z.string().optional().nullable(),
  direccion: z.string().min(1, 'La direccion es requerida'),
  barrio: z.string().optional().nullable(),
  ciudad: z.string().optional().nullable(),
  vence: z.string().optional().nullable(),
  adenda: z.string().optional().nullable(),
  operacion: z.enum(['Venta', 'Alquiler', 'Temporario']),
  valor_publicado: z.coerce.number().min(0).default(0),
  fecha_baja: z.string().optional().nullable(),
  moneda: z.enum(['USD', 'ARS']).default('USD'),
  oferta: z.coerce.number().optional().nullable(),
  porcentaje_diferencia_precio: z.coerce.number().optional().nullable(),
  fecha_reserva: z.string().optional().nullable(),
  fecha_aceptacion: z.string().optional().nullable(),
  fecha_notificacion: z.string().optional().nullable(),
  fecha_refuerzo: z.string().optional().nullable(),
  fecha_cierre: z.string().optional().nullable(),
  honorarios_porcentaje_1: z.coerce.number().min(0).max(100).optional().nullable(),
  honorarios_porcentaje_2: z.coerce.number().min(0).max(100).optional().nullable(),
  honorarios_totales: z.coerce.number().optional().nullable(),
  comision_agente_porcentaje: z.coerce.number().optional().nullable(),
  comision_agente_monto: z.coerce.number().optional().nullable(),
  millas_viajes: z.coerce.number().optional().nullable(),
  observaciones: z.string().optional().nullable(),
})

export type CaptacionFormData = z.infer<typeof captacionSchema>

// ==========================================
// CIERRES
// ==========================================
export const cierreSchema = z.object({
  captacion_id: z.string().min(1, 'Debe seleccionar una captacion/busqueda'),
  fecha: z.string().min(1, 'La fecha es requerida'),
  valor_cierre: z.coerce.number().min(0, 'El valor debe ser positivo'),
  porcentaje_honorarios: z.coerce.number().min(0).max(100),
  porcentaje_agente: z.coerce.number().min(0).max(100),
  puntas: z.coerce.number().min(0).default(0),
  notas: z.string().optional().nullable(),
})

export type CierreFormData = z.infer<typeof cierreSchema>

// ==========================================
// TRACKEO
// ==========================================
export const trackeoSchema = z.object({
  fecha: z.string().min(1, 'La fecha es requerida'),
  llamadas: z.coerce.number().min(0).default(0),
  r1: z.coerce.number().min(0).default(0),
  expertise: z.coerce.number().min(0).default(0),
  captaciones: z.coerce.number().min(0).default(0),
  captaciones_valor: z.coerce.number().min(0).default(0),
  busquedas: z.coerce.number().min(0).default(0),
  consultas: z.coerce.number().min(0).default(0),
  visitas: z.coerce.number().min(0).default(0),
  r2: z.coerce.number().min(0).default(0),
  reservas_puntas: z.coerce.number().min(0).default(0),
  reservas_valor_oferta: z.coerce.number().min(0).default(0),
  devoluciones_puntas: z.coerce.number().min(0).default(0),
  devoluciones_honorarios: z.coerce.number().min(0).default(0),
  cierres_operaciones_puntas: z.coerce.number().min(0).default(0),
  cierres_honorarios: z.coerce.number().min(0).default(0),
})

export type TrackeoFormData = z.infer<typeof trackeoSchema>

// ==========================================
// OBJETIVOS
// ==========================================
export const objetivoSchema = z.object({
  anio: z.coerce.number().min(2020),
  ticket_promedio_cartera: z.coerce.number().min(0).default(0),
  comision_agente_porcentaje: z.coerce.number().min(0).max(100).default(0),
  objetivo_facturacion_total: z.coerce.number().min(0).default(0),
  gastos_personales_anio: z.coerce.number().min(0).default(0),
  inversion_negocio_anio: z.coerce.number().min(0).default(0),
  ahorro_anio: z.coerce.number().min(0).default(0),
  suenos_anio: z.coerce.number().min(0).default(0),
  peso_enero: z.coerce.number().min(0).max(100).default(0),
  peso_febrero: z.coerce.number().min(0).max(100).default(0),
  peso_marzo: z.coerce.number().min(0).max(100).default(0),
  peso_abril: z.coerce.number().min(0).max(100).default(0),
  peso_mayo: z.coerce.number().min(0).max(100).default(0),
  peso_junio: z.coerce.number().min(0).max(100).default(0),
  peso_julio: z.coerce.number().min(0).max(100).default(0),
  peso_agosto: z.coerce.number().min(0).max(100).default(0),
  peso_septiembre: z.coerce.number().min(0).max(100).default(0),
  peso_octubre: z.coerce.number().min(0).max(100).default(0),
  peso_noviembre: z.coerce.number().min(0).max(100).default(0),
  peso_diciembre: z.coerce.number().min(0).max(100).default(0),
})

export type ObjetivoFormData = z.infer<typeof objetivoSchema>

// ==========================================
// CONTACTOS
// ==========================================
export const contactoSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().optional().nullable(),
  telefono: z.string().min(1, 'El telefono es requerido'),
  email: z.string().email('Email invalido').optional().or(z.literal('')).nullable(),
  ubicacion: z.string().optional().nullable(),
  estado: z.enum(['Nuevo', 'Contactado', 'En reunion', 'Negociacion', 'Cerrado', 'Perdido']).default('Nuevo'),
  tipo_cliente: z.enum(['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta']).optional().nullable(),
  forma_pago: z.enum(['Contado', 'Credito aprobado', 'Credito en tramite', 'Necesita vender primero']).optional().nullable(),
  motivacion: z.array(z.string()).default([]),
  motivacion_otro: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  seguimiento_fecha: z.string().optional().nullable(),
  seguimiento_recordatorio: z.boolean().default(false),
  seguimiento_prioridad: z.enum(['Baja', 'Media', 'Alta']).default('Media'),
  seguimiento_hecho: z.boolean().default(false),
})

export type ContactoFormData = z.infer<typeof contactoSchema>
