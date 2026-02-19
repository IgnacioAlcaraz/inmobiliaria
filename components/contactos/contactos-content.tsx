'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ContactoForm } from '@/components/contactos/contacto-form'
import { createClient } from '@/lib/supabase/client'
import type { Contacto, ContactoTag, ContactoEstado } from '@/lib/types'
import { CONTACTO_ESTADOS } from '@/lib/types'
import { toast } from 'sonner'
import {
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  Trash2,
  Pencil,
  Calendar,
  AlertCircle,
  Filter,
  X,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface CaptacionOption {
  id: string
  direccion: string
  operacion: string
}

interface ContactosContentProps {
  contactos: Contacto[]
  tags: ContactoTag[]
  captaciones: CaptacionOption[]
  userId: string
}

const estadoColors: Record<ContactoEstado, string> = {
  Nuevo: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  Contactado: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300',
  'En reunion': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  Negociacion: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  Cerrado: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  Perdido: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

const prioridadColors: Record<string, string> = {
  Baja: 'text-muted-foreground',
  Media: 'text-amber-600 dark:text-amber-400',
  Alta: 'text-red-600 dark:text-red-400',
}

export function ContactosContent({ contactos, tags, captaciones, userId }: ContactosContentProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingContacto, setEditingContacto] = useState<Contacto | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [filterTipo, setFilterTipo] = useState<string>('all')
  const [filterPrioridad, setFilterPrioridad] = useState<string>('all')

  const filtered = useMemo(() => {
    return contactos.filter((c) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.nombre.toLowerCase().includes(q) ||
        (c.apellido || '').toLowerCase().includes(q) ||
        c.telefono.includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.ubicacion || '').toLowerCase().includes(q)

      const matchEstado = filterEstado === 'all' || c.estado === filterEstado
      const matchTipo = filterTipo === 'all' || c.tipo_cliente === filterTipo
      const matchPrioridad = filterPrioridad === 'all' || c.seguimiento_prioridad === filterPrioridad

      return matchSearch && matchEstado && matchTipo && matchPrioridad
    })
  }, [contactos, search, filterEstado, filterTipo, filterPrioridad])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('contactos').delete().eq('id', deleteId)
    if (error) {
      toast.error('Error al eliminar: ' + error.message)
    } else {
      toast.success('Contacto eliminado')
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const handleEstadoChange = async (contactoId: string, newEstado: ContactoEstado) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('contactos')
      .update({ estado: newEstado, updated_at: new Date().toISOString() })
      .eq('id', contactoId)
    if (error) {
      toast.error('Error al cambiar estado')
    } else {
      toast.success('Estado actualizado')
      router.refresh()
    }
  }

  const hasActiveFilters = filterEstado !== 'all' || filterTipo !== 'all' || filterPrioridad !== 'all'

  const clearFilters = () => {
    setFilterEstado('all')
    setFilterTipo('all')
    setFilterPrioridad('all')
  }

  // Stats
  const totalContactos = contactos.length
  const pendientesSeguimiento = contactos.filter(
    (c) => c.seguimiento_fecha && !c.seguimiento_hecho && new Date(c.seguimiento_fecha) <= new Date()
  ).length

  return (
    <div className="flex flex-col gap-6">
      {/* Stats Row */}
      <div className="flex flex-wrap gap-3">
        <Card className="flex-1 min-w-[140px]">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Contactos</p>
            <p className="text-2xl font-bold">{totalContactos}</p>
          </CardContent>
        </Card>
        {CONTACTO_ESTADOS.filter((e) => e !== 'Cerrado' && e !== 'Perdido').map((estado) => {
          const count = contactos.filter((c) => c.estado === estado).length
          return (
            <Card key={estado} className="flex-1 min-w-[120px]">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{estado}</p>
                <p className="text-2xl font-bold">{count}</p>
              </CardContent>
            </Card>
          )
        })}
        {pendientesSeguimiento > 0 && (
          <Card className="flex-1 min-w-[140px] border-amber-300 dark:border-amber-700">
            <CardContent className="p-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm text-muted-foreground">Seguimientos Vencidos</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{pendientesSeguimiento}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions + Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              setEditingContacto(null)
              setSheetOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Nuevo Contacto
          </Button>
          <div className="relative ml-auto flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar nombre, telefono, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={filterEstado} onValueChange={setFilterEstado}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {CONTACTO_ESTADOS.map((e) => (
                <SelectItem key={e} value={e}>{e}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {['Comprador', 'Vendedor', 'Inversor', 'Alquiler', 'Tasacion', 'Permuta'].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterPrioridad} onValueChange={setFilterPrioridad}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Prioridad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda prioridad</SelectItem>
              {['Baja', 'Media', 'Alta'].map((p) => (
                <SelectItem key={p} value={p}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>
          )}
          <span className="text-sm text-muted-foreground ml-auto">
            {filtered.length} de {totalContactos} contacto{totalContactos !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Contact Cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-lg font-medium">No hay contactos</p>
            <p className="text-sm">
              {contactos.length === 0 ? 'Agrega tu primer contacto para comenzar' : 'Intenta cambiar los filtros'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((contacto) => {
            const isOverdue =
              contacto.seguimiento_fecha &&
              !contacto.seguimiento_hecho &&
              new Date(contacto.seguimiento_fecha) <= new Date()

            return (
              <Card
                key={contacto.id}
                className={`relative transition-shadow hover:shadow-md ${isOverdue ? 'ring-1 ring-amber-400 dark:ring-amber-600' : ''}`}
              >
                <CardContent className="p-4 flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {contacto.nombre} {contacto.apellido || ''}
                      </p>
                      {contacto.tipo_cliente && (
                        <p className="text-xs text-muted-foreground">{contacto.tipo_cliente}</p>
                      )}
                    </div>
                    <Select
                      value={contacto.estado}
                      onValueChange={(v) => handleEstadoChange(contacto.id, v as ContactoEstado)}
                    >
                      <SelectTrigger className="h-7 w-auto border-0 p-0 focus:ring-0">
                        <Badge className={`${estadoColors[contacto.estado]} border-0 text-xs cursor-pointer`}>
                          {contacto.estado}
                        </Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {CONTACTO_ESTADOS.map((e) => (
                          <SelectItem key={e} value={e}>{e}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Contact Info */}
                  <div className="flex flex-col gap-1 text-sm">
                    <a href={`tel:${contacto.telefono}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{contacto.telefono}</span>
                    </a>
                    {contacto.email && (
                      <a href={`mailto:${contacto.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contacto.email}</span>
                      </a>
                    )}
                    {contacto.ubicacion && (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contacto.ubicacion}</span>
                      </span>
                    )}
                  </div>

                  {/* Seguimiento */}
                  {contacto.seguimiento_fecha && (
                    <div className={`flex items-center gap-2 text-xs ${isOverdue ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Seg: {new Date(contacto.seguimiento_fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                      </span>
                      <span className={prioridadColors[contacto.seguimiento_prioridad]}>
                        {contacto.seguimiento_prioridad}
                      </span>
                      {contacto.seguimiento_hecho && (
                        <Badge variant="outline" className="text-[10px] h-4">Hecho</Badge>
                      )}
                    </div>
                  )}

                  {/* Tags */}
                  {contacto.tags && contacto.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contacto.tags.map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-[10px] h-5">
                          {tag.nombre}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Propiedades */}
                  {contacto.propiedades && contacto.propiedades.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {contacto.propiedades.map((p) => (
                        <Badge key={p.id} variant="outline" className="text-[10px] h-5 font-mono">
                          ID: {p.propiedad_id}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Notas preview */}
                  {contacto.notas && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic">
                      {contacto.notas}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1 pt-1 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setEditingContacto(contacto)
                        setSheetOpen(true)
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive"
                      onClick={() => setDeleteId(contacto.id)}
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                    {contacto.forma_pago && (
                      <Badge variant="outline" className="ml-auto text-[10px] h-5">
                        {contacto.forma_pago}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingContacto ? 'Editar Contacto' : 'Nuevo Contacto'}
            </SheetTitle>
          </SheetHeader>
          <ContactoForm
            contacto={editingContacto}
            tags={tags}
            captaciones={captaciones}
            userId={userId}
            onSuccess={() => {
              setSheetOpen(false)
              setEditingContacto(null)
              router.refresh()
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar contacto"
        description="Esta accion eliminara el contacto permanentemente junto con sus propiedades y tags vinculados."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
