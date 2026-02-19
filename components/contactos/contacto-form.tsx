'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactoSchema, type ContactoFormData } from '@/lib/validations'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import type { Contacto, ContactoTag } from '@/lib/types'
import {
  CONTACTO_ESTADOS,
  TIPO_CLIENTE_OPTIONS,
  FORMA_PAGO_OPTIONS,
  MOTIVACION_OPTIONS,
  PRIORIDAD_OPTIONS,
} from '@/lib/types'

interface CaptacionOption {
  id: string
  direccion: string
  operacion: string
}

interface ContactoFormProps {
  contacto?: Contacto | null
  tags: ContactoTag[]
  captaciones: CaptacionOption[]
  userId: string
  onSuccess: () => void
}

export function ContactoForm({ contacto, tags, captaciones, userId, onSuccess }: ContactoFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!contacto

  // Tags state
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    contacto?.tags?.map((t) => t.id) || []
  )
  const [newTagName, setNewTagName] = useState('')

  // Propiedades state
  const [propiedades, setPropiedades] = useState<string[]>(
    contacto?.propiedades?.map((p) => p.propiedad_id) || []
  )
  const [propSearch, setPropSearch] = useState('')

  // Motivacion state
  const [motivaciones, setMotivaciones] = useState<string[]>(
    contacto?.motivacion || []
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      nombre: contacto?.nombre || '',
      apellido: contacto?.apellido || '',
      telefono: contacto?.telefono || '',
      email: contacto?.email || '',
      ubicacion: contacto?.ubicacion || '',
      estado: contacto?.estado || 'Nuevo',
      tipo_cliente: contacto?.tipo_cliente || null,
      forma_pago: contacto?.forma_pago || null,
      motivacion: contacto?.motivacion || [],
      motivacion_otro: contacto?.motivacion_otro || '',
      notas: contacto?.notas || '',
      seguimiento_fecha: contacto?.seguimiento_fecha || '',
      seguimiento_recordatorio: contacto?.seguimiento_recordatorio || false,
      seguimiento_prioridad: contacto?.seguimiento_prioridad || 'Media',
      seguimiento_hecho: contacto?.seguimiento_hecho || false,
    },
  })

  const toggleMotivacion = (m: string) => {
    const updated = motivaciones.includes(m)
      ? motivaciones.filter((x) => x !== m)
      : [...motivaciones, m]
    setMotivaciones(updated)
    setValue('motivacion', updated)
  }

  const togglePropiedad = (captacionId: string) => {
    setPropiedades((prev) =>
      prev.includes(captacionId)
        ? prev.filter((p) => p !== captacionId)
        : [...prev, captacionId]
    )
  }

  const filteredCaptaciones = captaciones.filter((c) => {
    const q = propSearch.toLowerCase()
    return !q || c.direccion.toLowerCase().includes(q) || c.id.toLowerCase().includes(q) || c.operacion.toLowerCase().includes(q)
  })

  const addTag = async () => {
    const trimmed = newTagName.trim()
    if (!trimmed) return

    // Check if tag already exists
    const existing = tags.find((t) => t.nombre.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      if (!selectedTagIds.includes(existing.id)) {
        setSelectedTagIds([...selectedTagIds, existing.id])
      }
      setNewTagName('')
      return
    }

    // Create new tag
    const supabase = createClient()
    const { data, error } = await supabase
      .from('contacto_tags')
      .insert({ user_id: userId, nombre: trimmed })
      .select()
      .single()

    if (error) {
      toast.error('Error al crear tag: ' + error.message)
    } else if (data) {
      setSelectedTagIds([...selectedTagIds, data.id])
      tags.push(data) // mutate local array for immediate UI update
      setNewTagName('')
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTagIds(
      selectedTagIds.includes(tagId)
        ? selectedTagIds.filter((id) => id !== tagId)
        : [...selectedTagIds, tagId]
    )
  }

  const onSubmit = async (data: ContactoFormData) => {
    setLoading(true)
    const supabase = createClient()

    // Clean empty strings to null
    const cleaned = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === '' ? null : v])
    )

    const payload = {
      ...cleaned,
      user_id: userId,
      motivacion: motivaciones,
      updated_at: new Date().toISOString(),
    }

    let contactoId = contacto?.id

    if (isEditing && contacto) {
      const { error } = await supabase
        .from('contactos')
        .update(payload)
        .eq('id', contacto.id)
      if (error) {
        toast.error('Error al actualizar: ' + error.message)
        setLoading(false)
        return
      }
    } else {
      const { data: newContacto, error } = await supabase
        .from('contactos')
        .insert(payload)
        .select()
        .single()
      if (error) {
        toast.error('Error al crear: ' + error.message)
        setLoading(false)
        return
      }
      contactoId = newContacto.id
    }

    if (!contactoId) {
      setLoading(false)
      return
    }

    // Sync propiedades: delete old, insert new
    if (isEditing) {
      await supabase.from('contacto_propiedades').delete().eq('contacto_id', contactoId)
    }
    if (propiedades.length > 0) {
      await supabase.from('contacto_propiedades').insert(
        propiedades.map((pid) => ({ contacto_id: contactoId, propiedad_id: pid }))
      )
    }

    // Sync tag links: delete old, insert new
    if (isEditing) {
      await supabase.from('contacto_tag_links').delete().eq('contacto_id', contactoId)
    }
    if (selectedTagIds.length > 0) {
      await supabase.from('contacto_tag_links').insert(
        selectedTagIds.map((tid) => ({ contacto_id: contactoId, tag_id: tid }))
      )
    }

    toast.success(isEditing ? 'Contacto actualizado' : 'Contacto creado')
    onSuccess()
    setLoading(false)
  }

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-foreground border-b pb-1 pt-3">{children}</h3>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-4">
      <SectionLabel>Datos del Contacto</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" placeholder="Juan" {...register('nombre')} />
          {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="apellido">Apellido</Label>
          <Input id="apellido" placeholder="Perez" {...register('apellido')} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="telefono">Telefono *</Label>
          <Input id="telefono" placeholder="+54 11 1234-5678" {...register('telefono')} />
          {errors.telefono && <p className="text-xs text-destructive">{errors.telefono.message}</p>}
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="juan@email.com" {...register('email')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="ubicacion">Ubicacion / Zona de interes</Label>
        <Input id="ubicacion" placeholder="Palermo, CABA" {...register('ubicacion')} />
      </div>

      <SectionLabel>Clasificacion</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label>Estado</Label>
          <Select
            defaultValue={contacto?.estado || 'Nuevo'}
            onValueChange={(val) => setValue('estado', val as ContactoFormData['estado'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CONTACTO_ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Tipo de Cliente</Label>
          <Select
            defaultValue={contacto?.tipo_cliente || ''}
            onValueChange={(val) => setValue('tipo_cliente', val === '_none' ? null : val as ContactoFormData['tipo_cliente'])}
          >
            <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Sin especificar</SelectItem>
              {TIPO_CLIENTE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label>Forma de Pago</Label>
        <Select
          defaultValue={contacto?.forma_pago || ''}
          onValueChange={(val) => setValue('forma_pago', val === '_none' ? null : val as ContactoFormData['forma_pago'])}
        >
          <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Sin especificar</SelectItem>
            {FORMA_PAGO_OPTIONS.map((f) => (
              <SelectItem key={f} value={f}>{f}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label>Motivacion</Label>
        <div className="flex flex-wrap gap-2">
          {MOTIVACION_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => toggleMotivacion(m)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                motivaciones.includes(m)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-background text-muted-foreground hover:bg-accent'
              }`}
            >
              {m}
            </button>
          ))}
        </div>
        {motivaciones.includes('Otro') && (
          <Input
            placeholder="Especificar motivacion..."
            {...register('motivacion_otro')}
            className="mt-1"
          />
        )}
      </div>

      <SectionLabel>Propiedades Vinculadas</SectionLabel>

      {/* Selected propiedades */}
      {propiedades.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {propiedades.map((pid) => {
            const cap = captaciones.find((c) => c.id === pid)
            return (
              <Badge key={pid} variant="outline" className="gap-1 pr-1">
                <span className="text-xs truncate max-w-[200px]">
                  <span className="font-mono text-muted-foreground">{pid.slice(0, 6)}</span>
                  {cap && <> - {cap.direccion} ({cap.operacion})</>}
                </span>
                <button type="button" onClick={() => togglePropiedad(pid)} className="hover:text-destructive ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}

      {/* Searchable captaciones list */}
      {captaciones.length > 0 ? (
        <div className="flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por direccion o ID..."
              value={propSearch}
              onChange={(e) => setPropSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <div className="max-h-[160px] overflow-y-auto rounded-md border divide-y">
            {filteredCaptaciones.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-3">No se encontraron propiedades</p>
            ) : (
              filteredCaptaciones.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => togglePropiedad(cap.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 text-left text-sm transition-colors hover:bg-accent ${
                    propiedades.includes(cap.id) ? 'bg-primary/5' : ''
                  }`}
                >
                  <div className={`h-4 w-4 rounded border flex items-center justify-center shrink-0 ${
                    propiedades.includes(cap.id) ? 'bg-primary border-primary' : 'border-border'
                  }`}>
                    {propiedades.includes(cap.id) && (
                      <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="font-mono text-xs text-muted-foreground shrink-0">{cap.id.slice(0, 6)}</span>
                  <span className="truncate">{cap.direccion}</span>
                  <span className="text-xs text-muted-foreground shrink-0">({cap.operacion})</span>
                </button>
              ))
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No hay captaciones cargadas para vincular</p>
      )}

      <SectionLabel>Tags</SectionLabel>

      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selectedTagIds.includes(tag.id)
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:bg-accent'
            }`}
          >
            {tag.nombre}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Nuevo tag..."
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addTag}>
          <Plus className="h-3 w-3 mr-1" />
          Crear Tag
        </Button>
      </div>

      <SectionLabel>Seguimiento</SectionLabel>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="seguimiento_fecha">Fecha de seguimiento</Label>
          <Input id="seguimiento_fecha" type="date" {...register('seguimiento_fecha')} />
        </div>
        <div className="grid gap-1.5">
          <Label>Prioridad</Label>
          <Select
            defaultValue={contacto?.seguimiento_prioridad || 'Media'}
            onValueChange={(val) => setValue('seguimiento_prioridad', val as ContactoFormData['seguimiento_prioridad'])}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORIDAD_OPTIONS.map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="seguimiento_recordatorio"
            defaultChecked={contacto?.seguimiento_recordatorio || false}
            onCheckedChange={(checked) => setValue('seguimiento_recordatorio', !!checked)}
          />
          <Label htmlFor="seguimiento_recordatorio" className="text-sm">Recordatorio</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="seguimiento_hecho"
            defaultChecked={contacto?.seguimiento_hecho || false}
            onCheckedChange={(checked) => setValue('seguimiento_hecho', !!checked)}
          />
          <Label htmlFor="seguimiento_hecho" className="text-sm">Seguimiento hecho</Label>
        </div>
      </div>

      <SectionLabel>Notas</SectionLabel>

      <div className="grid gap-1.5">
        <Textarea id="notas" rows={3} placeholder="Notas adicionales sobre el contacto..." {...register('notas')} />
      </div>

      <Button type="submit" disabled={loading} className="mt-3">
        {loading
          ? isEditing ? 'Actualizando...' : 'Creando...'
          : isEditing ? 'Actualizar Contacto' : 'Crear Contacto'}
      </Button>
    </form>
  )
}
