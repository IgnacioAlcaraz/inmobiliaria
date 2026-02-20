export type UserRole = 'admin' | 'vendedor' | 'encargado'

export interface ManagerVendedor {
  id: string
  manager_id: string
  vendedor_id: string
  created_at: string
}

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  created_at: string
}

// ==========================================
// CAPTACIONES Y BUSQUEDAS
// ==========================================
export type TipoOperacion = 'Venta' | 'Alquiler' | 'Temporario'
export type Moneda = 'USD' | 'ARS'

export interface Captacion {
  id: string
  user_id: string
  fecha_alta: string
  autorizacion: string | null
  direccion: string
  barrio: string | null
  ciudad: string | null
  vence: string | null
  adenda: string | null
  operacion: TipoOperacion
  valor_publicado: number
  fecha_baja: string | null
  moneda: Moneda
  oferta: number | null
  porcentaje_diferencia_precio: number | null
  fecha_reserva: string | null
  fecha_aceptacion: string | null
  fecha_notificacion: string | null
  fecha_refuerzo: string | null
  fecha_cierre: string | null
  honorarios_porcentaje_1: number | null
  honorarios_porcentaje_2: number | null
  honorarios_totales: number | null
  comision_agente_porcentaje: number | null
  comision_agente_monto: number | null
  millas_viajes: number | null
  observaciones: string | null
  created_at: string
}

// ==========================================
// CIERRES (linked to captacion)
// ==========================================
export interface Cierre {
  id: string
  user_id: string
  captacion_id: string
  fecha: string
  valor_cierre: number
  porcentaje_honorarios: number
  porcentaje_agente: number
  puntas: number
  notas: string | null
  created_at: string
  // joined fields (Supabase returns null when join has no match)
  captacion?: Captacion | null
}

// Computed fields for display
export interface CierreConCalculos extends Cierre {
  direccion: string
  honorarios_totales: number
  comision_agente: number
  total_puntas: number
  acumulado: number
}

// ==========================================
// TRACKEO
// ==========================================
export interface Trackeo {
  id: string
  user_id: string
  fecha: string
  llamadas: number
  r1: number
  expertise: number
  captaciones: number
  captaciones_valor: number
  busquedas: number
  consultas: number
  visitas: number
  r2: number
  reservas_puntas: number
  reservas_valor_oferta: number
  devoluciones_puntas: number
  devoluciones_honorarios: number
  cierres_operaciones_puntas: number
  cierres_honorarios: number
  created_at: string
}

// ==========================================
// OBJETIVOS
// ==========================================
// ==========================================
// CHAT
// ==========================================
export interface ChatMessage {
  id: string
  user_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  scope?: 'personal' | 'equipo' | 'vendedor'
  target_user_id?: string | null
}

// ==========================================
// CONTACTOS
// ==========================================
export type ContactoEstado = 'Nuevo' | 'Contactado' | 'En reunion' | 'Negociacion' | 'Cerrado' | 'Perdido'
export type TipoCliente = 'Comprador' | 'Vendedor' | 'Inversor' | 'Alquiler' | 'Tasacion' | 'Permuta'
export type FormaPago = 'Contado' | 'Credito aprobado' | 'Credito en tramite' | 'Necesita vender primero'
export type SeguimientoPrioridad = 'Baja' | 'Media' | 'Alta'
export type MotivacionOption = 'Mudanza' | 'Inversion' | 'Divorcio' | 'Herencia' | 'Ampliar' | 'Reducir' | 'Otro'

export const CONTACTO_ESTADOS: ContactoEstado[] = ['Nuevo', 'Contactado', 'En reunion', 'Negociacion', 'Cerrado', 'Perdido']
export const TIPO_CLIENTE_OPTIONS: TipoCliente[] = ['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta']
export const FORMA_PAGO_OPTIONS: FormaPago[] = ['Contado', 'Credito aprobado', 'Credito en tramite', 'Necesita vender primero']
export const MOTIVACION_OPTIONS: MotivacionOption[] = ['Mudanza', 'Inversion', 'Divorcio', 'Herencia', 'Ampliar', 'Reducir', 'Otro']
export const PRIORIDAD_OPTIONS: SeguimientoPrioridad[] = ['Baja', 'Media', 'Alta']

export interface Contacto {
  id: string
  user_id: string
  nombre: string
  apellido: string | null
  telefono: string
  email: string | null
  ubicacion: string | null
  estado: ContactoEstado
  tipo_cliente: TipoCliente | null
  forma_pago: FormaPago | null
  motivacion: MotivacionOption[]
  motivacion_otro: string | null
  notas: string | null
  seguimiento_fecha: string | null
  seguimiento_recordatorio: boolean
  seguimiento_prioridad: SeguimientoPrioridad
  seguimiento_hecho: boolean
  created_at: string
  updated_at: string
  // joined
  propiedades?: ContactoPropiedad[]
  tags?: ContactoTag[]
}

export interface ContactoPropiedad {
  id: string
  contacto_id: string
  propiedad_id: string
  created_at: string
}

export interface ContactoTag {
  id: string
  user_id: string
  nombre: string
  created_at: string
}

export const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const

export type MesNombre = typeof MESES[number]

export interface Objetivo {
  id: string
  user_id: string
  anio: number
  ticket_promedio_cartera: number
  comision_agente_porcentaje: number
  objetivo_puntas: number
  objetivo_facturacion_total: number
  objetivo_comisiones_agente: number
  gastos_personales_anio: number
  inversion_negocio_anio: number
  ahorro_anio: number
  suenos_anio: number
  peso_enero: number
  peso_febrero: number
  peso_marzo: number
  peso_abril: number
  peso_mayo: number
  peso_junio: number
  peso_julio: number
  peso_agosto: number
  peso_septiembre: number
  peso_octubre: number
  peso_noviembre: number
  peso_diciembre: number
  created_at: string
}
