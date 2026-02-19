'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cierreSchema, type CierreFormData } from '@/lib/validations'
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
import { toast } from 'sonner'
import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/export'
import { Loader2 } from 'lucide-react'

interface CaptacionOption {
  id: string
  direccion: string
  operacion: string
  moneda: string
  valor_publicado: number
}

interface CierreRow {
  id: string
  captacion_id: string
  fecha: string
  valor_cierre: number
  porcentaje_honorarios: number
  porcentaje_agente: number
  puntas: number
  notas: string | null
}

interface CierreFormProps {
  cierre?: CierreRow | null
  captaciones: CaptacionOption[]
  userId: string
  onSuccess: () => void
}

export function CierreForm({ cierre, captaciones, userId, onSuccess }: CierreFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!cierre

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CierreFormData>({
    resolver: zodResolver(cierreSchema),
    defaultValues: {
      captacion_id: cierre?.captacion_id || '',
      fecha: cierre?.fecha || new Date().toISOString().split('T')[0],
      valor_cierre: cierre?.valor_cierre || 0,
      porcentaje_honorarios: cierre?.porcentaje_honorarios || 0,
      porcentaje_agente: cierre?.porcentaje_agente || 0,
      puntas: cierre?.puntas || 0,
      notas: cierre?.notas || '',
    },
  })

  const valorCierre = watch('valor_cierre')
  const pctHonorarios = watch('porcentaje_honorarios')
  const pctAgente = watch('porcentaje_agente')
  const captacionId = watch('captacion_id')

  const honorariosTotales = (Number(valorCierre) * Number(pctHonorarios)) / 100
  const comisionAgente = (honorariosTotales * Number(pctAgente)) / 100

  // Auto-fill valor_cierre from selected captacion
  const selectedCaptacion = captaciones.find((c) => c.id === captacionId)

  useEffect(() => {
    if (selectedCaptacion && !isEditing) {
      setValue('valor_cierre', selectedCaptacion.valor_publicado)
    }
  }, [captacionId, selectedCaptacion, isEditing, setValue])

  const onSubmit = async (data: CierreFormData) => {
    setLoading(true)
    const supabase = createClient()

    const payload = {
      ...data,
      user_id: userId,
      notas: data.notas || null,
    }

    if (isEditing && cierre) {
      const { error } = await supabase
        .from('cierres')
        .update(payload)
        .eq('id', cierre.id)
      if (error) {
        toast.error('Error al actualizar: ' + error.message)
      } else {
        toast.success('Cierre actualizado')
        onSuccess()
      }
    } else {
      const { error } = await supabase.from('cierres').insert(payload)
      if (error) {
        toast.error('Error al crear: ' + error.message)
      } else {
        toast.success('Cierre creado')
        onSuccess()
      }
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
      <div className="grid gap-2">
        <Label id="label-captacion">Captacion / Busqueda vinculada</Label>
        <Select
          defaultValue={cierre?.captacion_id || ''}
          onValueChange={(val) => setValue('captacion_id', val)}
        >
          <SelectTrigger aria-labelledby="label-captacion">
            <SelectValue placeholder="Seleccionar captacion..." />
          </SelectTrigger>
          <SelectContent>
            {captaciones.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-muted-foreground">{c.id.slice(0, 6)}</span>
                  <span className="truncate">{c.direccion}</span>
                  <span className="text-xs text-muted-foreground">({c.operacion})</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.captacion_id && (
          <p id="captacion_id-error" className="text-xs text-destructive" role="alert">
            {errors.captacion_id.message}
          </p>
        )}
      </div>

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

      <div className="grid gap-2">
        <Label htmlFor="valor_cierre">Valor Cierre</Label>
        <Input
          id="valor_cierre"
          type="number"
          step="0.01"
          inputMode="decimal"
          {...register('valor_cierre')}
          aria-invalid={!!errors.valor_cierre}
          aria-describedby={errors.valor_cierre ? 'valor_cierre-error' : undefined}
        />
        {errors.valor_cierre && (
          <p id="valor_cierre-error" className="text-xs text-destructive" role="alert">
            {errors.valor_cierre.message}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="porcentaje_honorarios">% Honorarios</Label>
          <Input
            id="porcentaje_honorarios"
            type="number"
            step="0.1"
            inputMode="decimal"
            {...register('porcentaje_honorarios')}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="porcentaje_agente">% Comision Agente</Label>
          <Input
            id="porcentaje_agente"
            type="number"
            step="0.1"
            inputMode="decimal"
            {...register('porcentaje_agente')}
          />
        </div>
      </div>

      {/* Calculated preview */}
      <div className="rounded-lg bg-muted/50 p-3 text-sm flex flex-col gap-1" role="region" aria-label="Vista previa de honorarios">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Honorarios Totales:</span>
          <span className="font-semibold text-primary">{formatCurrency(honorariosTotales)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Comision Agente:</span>
          <span className="font-semibold">{formatCurrency(comisionAgente)}</span>
        </div>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="puntas">Puntas</Label>
        <Input
          id="puntas"
          type="number"
          inputMode="numeric"
          {...register('puntas')}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="notas">Notas</Label>
        <Textarea id="notas" rows={2} placeholder="Notas adicionales..." {...register('notas')} />
      </div>

      <Button type="submit" disabled={loading} className="mt-2">
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            {isEditing ? 'Actualizando...' : 'Creando...'}
          </>
        ) : (
          isEditing ? 'Actualizar Cierre' : 'Crear Cierre'
        )}
      </Button>
    </form>
  )
}
