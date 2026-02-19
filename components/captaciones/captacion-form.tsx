'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { captacionSchema, type CaptacionFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/export'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import type { Captacion } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface CaptacionFormProps {
  captacion?: Captacion | null
  userId: string
  onSuccess: () => void
}

export function CaptacionForm({ captacion, userId, onSuccess }: CaptacionFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!captacion

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CaptacionFormData>({
    resolver: zodResolver(captacionSchema),
    defaultValues: {
      fecha_alta: captacion?.fecha_alta || new Date().toISOString().split('T')[0],
      autorizacion: captacion?.autorizacion || '',
      direccion: captacion?.direccion || '',
      barrio: captacion?.barrio || '',
      ciudad: captacion?.ciudad || '',
      vence: captacion?.vence || '',
      adenda: captacion?.adenda || '',
      operacion: captacion?.operacion || 'Venta',
      valor_publicado: captacion?.valor_publicado || 0,
      fecha_baja: captacion?.fecha_baja || '',
      moneda: captacion?.moneda || 'USD',
      oferta: captacion?.oferta ?? undefined,
      porcentaje_diferencia_precio: captacion?.porcentaje_diferencia_precio ?? undefined,
      fecha_reserva: captacion?.fecha_reserva || '',
      fecha_aceptacion: captacion?.fecha_aceptacion || '',
      fecha_notificacion: captacion?.fecha_notificacion || '',
      fecha_refuerzo: captacion?.fecha_refuerzo || '',
      fecha_cierre: captacion?.fecha_cierre || '',
      honorarios_porcentaje_1: captacion?.honorarios_porcentaje_1 ?? undefined,
      honorarios_porcentaje_2: captacion?.honorarios_porcentaje_2 ?? undefined,
      honorarios_totales: captacion?.honorarios_totales ?? undefined,
      comision_agente_porcentaje: captacion?.comision_agente_porcentaje ?? undefined,
      comision_agente_monto: captacion?.comision_agente_monto ?? undefined,
      millas_viajes: captacion?.millas_viajes ?? undefined,
      observaciones: captacion?.observaciones || '',
    },
  })

  const oferta = watch('oferta')
  const honPct1 = watch('honorarios_porcentaje_1')
  const honPct2 = watch('honorarios_porcentaje_2')
  const comPct = watch('comision_agente_porcentaje')
  const valorPub = watch('valor_publicado')

  // Auto-calculate honorarios_totales from two percentages over oferta
  useEffect(() => {
    const ofertaNum = Number(oferta) || 0
    const p1 = Number(honPct1) || 0
    const p2 = Number(honPct2) || 0
    if (ofertaNum > 0 && (p1 > 0 || p2 > 0)) {
      const total = (ofertaNum * p1 / 100) + (ofertaNum * p2 / 100)
      setValue('honorarios_totales', Math.round(total * 100) / 100)
    } else {
      setValue('honorarios_totales', undefined)
    }
  }, [oferta, honPct1, honPct2, setValue])

  // Auto-calculate comision_agente_monto from % over honorarios_totales
  const honTotales = watch('honorarios_totales')
  useEffect(() => {
    const ht = Number(honTotales) || 0
    const cp = Number(comPct) || 0
    if (ht > 0 && cp > 0) {
      const monto = (ht * cp) / 100
      setValue('comision_agente_monto', Math.round(monto * 100) / 100)
    } else {
      setValue('comision_agente_monto', undefined)
    }
  }, [honTotales, comPct, setValue])

  // Auto-calculate % diferencia precio
  useEffect(() => {
    const vp = Number(valorPub) || 0
    const of2 = Number(oferta) || 0
    if (vp > 0 && of2 > 0) {
      const diff = ((of2 - vp) / vp) * 100
      setValue('porcentaje_diferencia_precio', Math.round(diff * 10) / 10)
    }
  }, [valorPub, oferta, setValue])

  const onSubmit = async (data: CaptacionFormData) => {
    setLoading(true)
    const supabase = createClient()

    // Clean empty strings to null
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    )

    const payload = { ...cleaned, user_id: userId }

    if (isEditing && captacion) {
      const { error } = await supabase
        .from('captaciones')
        .update(payload)
        .eq('id', captacion.id)
      if (error) {
        toast.error('Error al actualizar: ' + error.message)
      } else {
        toast.success('Registro actualizado')
        onSuccess()
      }
    } else {
      const { error } = await supabase.from('captaciones').insert(payload)
      if (error) {
        toast.error('Error al crear: ' + error.message)
      } else {
        toast.success('Registro creado')
        onSuccess()
      }
    }
    setLoading(false)
  }

  // Live preview of computed values
  const previewHonTotales = Number(honTotales) || 0
  const previewComMonto = Number(watch('comision_agente_monto')) || 0

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground border-b pb-1 pt-3">{children}</h3>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-4">
      <SectionLabel>Datos Principales</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_alta">Fecha Alta</Label>
          <Input
            id="fecha_alta"
            type="date"
            {...register('fecha_alta')}
            aria-invalid={!!errors.fecha_alta}
            aria-describedby={errors.fecha_alta ? 'fecha_alta-error' : undefined}
          />
          {errors.fecha_alta && (
            <p id="fecha_alta-error" className="text-xs text-destructive" role="alert">
              {errors.fecha_alta.message}
            </p>
          )}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="autorizacion">Autorizacion</Label>
          <Input id="autorizacion" {...register('autorizacion')} />
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="direccion">Direccion</Label>
        <Input
          id="direccion"
          placeholder="Av. Corrientes 1234"
          {...register('direccion')}
          aria-invalid={!!errors.direccion}
          aria-describedby={errors.direccion ? 'direccion-error' : undefined}
        />
        {errors.direccion && (
          <p id="direccion-error" className="text-xs text-destructive" role="alert">
            {errors.direccion.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="barrio">Barrio</Label>
          <Input id="barrio" {...register('barrio')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="ciudad">Ciudad</Label>
          <Input id="ciudad" {...register('ciudad')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="vence">Vence</Label>
          <Input id="vence" type="date" {...register('vence')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="adenda">Adenda</Label>
          <Input id="adenda" {...register('adenda')} />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="grid gap-1.5">
          <Label>Operacion</Label>
          <Select
            defaultValue={captacion?.operacion || 'Venta'}
            onValueChange={(val) => setValue('operacion', val as 'Venta' | 'Alquiler' | 'Temporario')}
          >
            <SelectTrigger aria-label="Operacion"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Venta">Venta</SelectItem>
              <SelectItem value="Alquiler">Alquiler</SelectItem>
              <SelectItem value="Temporario">Temporario</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Moneda</Label>
          <Select
            defaultValue={captacion?.moneda || 'USD'}
            onValueChange={(val) => setValue('moneda', val as 'USD' | 'ARS')}
          >
            <SelectTrigger aria-label="Moneda"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD</SelectItem>
              <SelectItem value="ARS">ARS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="valor_publicado">Valor Publicado</Label>
          <Input
            id="valor_publicado"
            type="number"
            step="0.01"
            inputMode="decimal"
            {...register('valor_publicado')}
          />
        </div>
      </div>

      <SectionLabel>Fechas del Proceso</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_baja">Fecha Baja</Label>
          <Input id="fecha_baja" type="date" {...register('fecha_baja')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_reserva">Fecha Reserva</Label>
          <Input id="fecha_reserva" type="date" {...register('fecha_reserva')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_aceptacion">Fecha Aceptacion</Label>
          <Input id="fecha_aceptacion" type="date" {...register('fecha_aceptacion')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_notificacion">Fecha Notificacion</Label>
          <Input id="fecha_notificacion" type="date" {...register('fecha_notificacion')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_refuerzo">Fecha Refuerzo</Label>
          <Input id="fecha_refuerzo" type="date" {...register('fecha_refuerzo')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="fecha_cierre">Fecha Cierre</Label>
          <Input id="fecha_cierre" type="date" {...register('fecha_cierre')} />
        </div>
      </div>

      <SectionLabel>Datos Economicos</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="oferta">Oferta</Label>
          <Input id="oferta" type="number" step="0.01" inputMode="decimal" {...register('oferta')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="porcentaje_diferencia_precio">% Diferencia Precio</Label>
          <Input id="porcentaje_diferencia_precio" type="number" step="0.1" inputMode="decimal" {...register('porcentaje_diferencia_precio')} className="bg-muted/50" readOnly />
        </div>
      </div>

      {/* Two percentage fields for honorarios */}
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="honorarios_porcentaje_1">% Honorarios 1</Label>
          <Input id="honorarios_porcentaje_1" type="number" step="0.1" inputMode="decimal" min="0" max="100" placeholder="ej: 3" {...register('honorarios_porcentaje_1')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="honorarios_porcentaje_2">% Honorarios 2</Label>
          <Input id="honorarios_porcentaje_2" type="number" step="0.1" inputMode="decimal" min="0" max="100" placeholder="ej: 3" {...register('honorarios_porcentaje_2')} />
        </div>
      </div>

      {/* Auto-calculated honorarios preview */}
      {previewHonTotales > 0 && (
        <div className="rounded-md border bg-muted/30 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Honorarios Totales (calculado)</span>
            <span className="font-semibold">{formatCurrency(previewHonTotales)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Oferta x {Number(honPct1) || 0}% + Oferta x {Number(honPct2) || 0}%
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="comision_agente_porcentaje">% Comision Agente</Label>
          <Input id="comision_agente_porcentaje" type="number" step="0.1" inputMode="decimal" {...register('comision_agente_porcentaje')} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="comision_agente_monto">Comision Agente (monto)</Label>
          <Input id="comision_agente_monto" type="number" step="0.01" inputMode="decimal" {...register('comision_agente_monto')} className="bg-muted/50" readOnly />
          {previewComMonto > 0 && (
            <p className="text-xs text-muted-foreground">{formatCurrency(previewComMonto)}</p>
          )}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="millas_viajes">Millas Viajes</Label>
        <Input id="millas_viajes" type="number" step="0.01" inputMode="decimal" {...register('millas_viajes')} />
      </div>

      <SectionLabel>Observaciones</SectionLabel>

      <div className="grid gap-1.5">
        <Label htmlFor="observaciones">Observaciones de Cierre o Motivo de Baja</Label>
        <Textarea id="observaciones" rows={3} placeholder="Notas adicionales..." {...register('observaciones')} />
      </div>

      <Button type="submit" disabled={loading} className="mt-3">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {isEditing ? 'Actualizando...' : 'Creando...'}
          </>
        ) : (
          isEditing ? 'Actualizar Registro' : 'Crear Registro'
        )}
      </Button>
    </form>
  )
}
