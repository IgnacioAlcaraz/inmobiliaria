'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { trackeoSchema, type TrackeoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useState } from 'react'
import type { Trackeo } from '@/lib/types'
import { Loader2 } from 'lucide-react'

interface TrackeoFormProps {
  trackeo?: Trackeo | null
  userId: string
  onSuccess: () => void
}

export function TrackeoForm({ trackeo, userId, onSuccess }: TrackeoFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!trackeo

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackeoFormData>({
    resolver: zodResolver(trackeoSchema),
    defaultValues: {
      fecha: trackeo?.fecha || new Date().toISOString().split('T')[0],
      llamadas: trackeo?.llamadas || 0,
      r1: trackeo?.r1 || 0,
      expertise: trackeo?.expertise || 0,
      captaciones: trackeo?.captaciones || 0,
      captaciones_valor: trackeo?.captaciones_valor || 0,
      busquedas: trackeo?.busquedas || 0,
      consultas: trackeo?.consultas || 0,
      visitas: trackeo?.visitas || 0,
      r2: trackeo?.r2 || 0,
      reservas_puntas: trackeo?.reservas_puntas || 0,
      reservas_valor_oferta: trackeo?.reservas_valor_oferta || 0,
      devoluciones_puntas: trackeo?.devoluciones_puntas || 0,
      devoluciones_honorarios: trackeo?.devoluciones_honorarios || 0,
      cierres_operaciones_puntas: trackeo?.cierres_operaciones_puntas || 0,
      cierres_honorarios: trackeo?.cierres_honorarios || 0,
    },
  })

  const onSubmit = async (data: TrackeoFormData) => {
    setLoading(true)
    const supabase = createClient()

    const payload = {
      ...data,
      user_id: userId,
    }

    if (isEditing && trackeo) {
      const { error } = await supabase
        .from('trackeo')
        .update(payload)
        .eq('id', trackeo.id)
      if (error) {
        toast.error('Error al actualizar: ' + error.message)
      } else {
        toast.success('Registro actualizado')
        onSuccess()
      }
    } else {
      const { error } = await supabase.from('trackeo').insert(payload)
      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          toast.error('Ya existe un registro para esta fecha')
        } else {
          toast.error('Error al crear: ' + error.message)
        }
      } else {
        toast.success('Registro creado')
        onSuccess()
      }
    }
    setLoading(false)
  }

  const intFields: { name: keyof TrackeoFormData; label: string }[] = [
    { name: 'llamadas', label: 'Llamadas' },
    { name: 'r1', label: 'R1' },
    { name: 'expertise', label: 'Expertise' },
    { name: 'captaciones', label: 'Captaciones' },
    { name: 'captaciones_valor', label: 'Captaciones (Valor)' },
    { name: 'busquedas', label: 'Busquedas' },
    { name: 'consultas', label: 'Consultas' },
    { name: 'visitas', label: 'Visitas' },
    { name: 'r2', label: 'R2' },
    { name: 'reservas_puntas', label: 'Reservas (Puntas)' },
    { name: 'reservas_valor_oferta', label: 'Reservas (Valor Oferta)' },
    { name: 'devoluciones_puntas', label: 'Devoluciones (Puntas)' },
    { name: 'devoluciones_honorarios', label: 'Devoluciones (Honorarios)' },
    { name: 'cierres_operaciones_puntas', label: 'Cierres Op. (Puntas)' },
    { name: 'cierres_honorarios', label: 'Cierres (Honorarios)' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
      <div className="grid gap-2">
        <Label htmlFor="fecha">Fecha</Label>
        <Input
          id="fecha"
          type="date"
          {...register('fecha')}
          aria-invalid={!!errors.fecha}
          aria-describedby={errors.fecha ? 'fecha-error' : undefined}
        />
        {errors.fecha && (
          <p id="fecha-error" className="text-xs text-destructive" role="alert">
            {errors.fecha.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {intFields.map((field) => (
          <div key={field.name} className="grid gap-1.5">
            <Label htmlFor={field.name} className="text-xs">{field.label}</Label>
            <Input
              id={field.name}
              type="number"
              step={field.name.includes('valor') || field.name.includes('honorarios') ? '0.01' : '1'}
              min="0"
              inputMode={field.name.includes('valor') || field.name.includes('honorarios') ? 'decimal' : 'numeric'}
              {...register(field.name)}
              aria-invalid={!!errors[field.name]}
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined}
            />
            {errors[field.name] && (
              <p id={`${field.name}-error`} className="text-xs text-destructive" role="alert">
                {errors[field.name]?.message}
              </p>
            )}
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading} className="mt-2">
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
