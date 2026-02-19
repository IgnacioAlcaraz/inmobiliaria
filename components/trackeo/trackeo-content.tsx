'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { TrackeoForm } from '@/components/trackeo/trackeo-form'
import { exportToCSV } from '@/lib/export'
import { createClient } from '@/lib/supabase/client'
import type { Trackeo } from '@/lib/types'
import { parseDateStr, formatDateDisplay } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Plus,
  Download,
  Pencil,
  Trash2,
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
import { ConfirmDialog } from '@/components/confirm-dialog'

interface TrackeoContentProps {
  trackeo: Trackeo[]
  userId: string
  isAdmin: boolean
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const fmtCur = (v: number) => v.toLocaleString('es-AR', { minimumFractionDigits: 0 })

export function TrackeoContent({ trackeo, userId }: TrackeoContentProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingTrackeo, setEditingTrackeo] = useState<Trackeo | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))

  // Group by month
  const monthlyGroups = useMemo(() => {
    const yearData = trackeo.filter((t) => {
      return parseDateStr(t.fecha).year === Number(selectedYear)
    })

    const groups: Record<number, Trackeo[]> = {}
    for (const t of yearData) {
      const m = parseDateStr(t.fecha).month
      if (!groups[m]) groups[m] = []
      groups[m].push(t)
    }

    // Sort each group by date ascending
    for (const key of Object.keys(groups)) {
      groups[Number(key)].sort((a, b) => a.fecha.localeCompare(b.fecha))
    }

    return groups
  }, [trackeo, selectedYear])

  const activeMonths = Object.keys(monthlyGroups)
    .map(Number)
    .sort((a, b) => a - b)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('trackeo').delete().eq('id', deleteId)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Registro eliminado')
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const handleExport = () => {
    const yearData = trackeo.filter((t) => parseDateStr(t.fecha).year === Number(selectedYear))
    exportToCSV(yearData, `trackeo_${selectedYear}`, [
      { key: 'fecha', label: 'Fecha' },
      { key: 'llamadas', label: 'Llamadas' },
      { key: 'r1', label: 'R1' },
      { key: 'expertise', label: 'Expertise' },
      { key: 'captaciones', label: 'Captaciones' },
      { key: 'captaciones_valor', label: 'Captaciones (Valor)' },
      { key: 'busquedas', label: 'Busquedas' },
      { key: 'consultas', label: 'Consultas' },
      { key: 'visitas', label: 'Visitas' },
      { key: 'r2', label: 'R2' },
      { key: 'reservas_puntas', label: 'Reservas (Puntas)' },
      { key: 'reservas_valor_oferta', label: 'Reservas (Valor Oferta)' },
      { key: 'devoluciones_puntas', label: 'Devoluciones (Puntas)' },
      { key: 'devoluciones_honorarios', label: 'Devoluciones (Honorarios)' },
      { key: 'cierres_operaciones_puntas', label: 'Cierres Op. (Puntas)' },
      { key: 'cierres_honorarios', label: 'Cierres (Honorarios)' },
    ])
  }

  const columns: ColumnDef<Trackeo>[] = [
    {
      accessorKey: 'fecha',
      header: 'Fecha',
      cell: ({ row }) => formatDateDisplay(row.getValue('fecha'), { weekday: 'short', day: '2-digit', month: '2-digit' }),
    },
    { accessorKey: 'llamadas', header: 'Llamadas' },
    { accessorKey: 'r1', header: 'R1' },
    { accessorKey: 'expertise', header: 'Expertise' },
    { accessorKey: 'captaciones', header: 'Capt.' },
    {
      accessorKey: 'captaciones_valor',
      header: 'Capt. Valor',
      cell: ({ row }) => fmtCur(Number(row.getValue('captaciones_valor'))),
    },
    { accessorKey: 'busquedas', header: 'Busq.' },
    { accessorKey: 'consultas', header: 'Consult.' },
    { accessorKey: 'visitas', header: 'Visitas' },
    { accessorKey: 'r2', header: 'R2' },
    { accessorKey: 'reservas_puntas', header: 'Res. Puntas' },
    {
      accessorKey: 'reservas_valor_oferta',
      header: 'Res. Valor',
      cell: ({ row }) => fmtCur(Number(row.getValue('reservas_valor_oferta'))),
    },
    { accessorKey: 'devoluciones_puntas', header: 'Dev. Puntas' },
    {
      accessorKey: 'devoluciones_honorarios',
      header: 'Dev. Hon.',
      cell: ({ row }) => fmtCur(Number(row.getValue('devoluciones_honorarios'))),
    },
    { accessorKey: 'cierres_operaciones_puntas', header: 'Cierres Puntas' },
    {
      accessorKey: 'cierres_honorarios',
      header: 'Cierres Hon.',
      cell: ({ row }) => fmtCur(Number(row.getValue('cierres_honorarios'))),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditingTrackeo(row.original)
              setSheetOpen(true)
            }}
          >
            <Pencil className="h-3 w-3" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-3 w-3" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      ),
    },
  ]

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

  // Calculate monthly totals for a summary row display
  const monthTotals = (items: Trackeo[]) => ({
    llamadas: items.reduce((s, t) => s + t.llamadas, 0),
    r1: items.reduce((s, t) => s + t.r1, 0),
    expertise: items.reduce((s, t) => s + t.expertise, 0),
    captaciones: items.reduce((s, t) => s + t.captaciones, 0),
    captaciones_valor: items.reduce((s, t) => s + Number(t.captaciones_valor), 0),
    busquedas: items.reduce((s, t) => s + t.busquedas, 0),
    consultas: items.reduce((s, t) => s + t.consultas, 0),
    visitas: items.reduce((s, t) => s + t.visitas, 0),
    r2: items.reduce((s, t) => s + t.r2, 0),
    reservas_puntas: items.reduce((s, t) => s + t.reservas_puntas, 0),
    reservas_valor_oferta: items.reduce((s, t) => s + Number(t.reservas_valor_oferta), 0),
    devoluciones_puntas: items.reduce((s, t) => s + t.devoluciones_puntas, 0),
    devoluciones_honorarios: items.reduce((s, t) => s + Number(t.devoluciones_honorarios), 0),
    cierres_operaciones_puntas: items.reduce((s, t) => s + t.cierres_operaciones_puntas, 0),
    cierres_honorarios: items.reduce((s, t) => s + Number(t.cierres_honorarios), 0),
  })

  return (
    <div className="flex flex-col gap-6">
      {/* Year Selector + Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={() => {
            setEditingTrackeo(null)
            setSheetOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Registro
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {trackeo.filter((t) => parseDateStr(t.fecha).year === Number(selectedYear)).length} registros en {selectedYear}
        </span>
      </div>

      {/* Monthly Tables */}
      {activeMonths.length === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center text-muted-foreground">
          No hay registros de trackeo para {selectedYear}. Crea un nuevo registro para comenzar.
        </div>
      )}

      {activeMonths.map((monthIdx) => {
        const items = monthlyGroups[monthIdx]
        const totals = monthTotals(items)
        return (
          <div key={monthIdx} className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{MONTHS[monthIdx]} {selectedYear}</h3>
              <span className="text-sm text-muted-foreground">{items.length} registros</span>
            </div>
            {/* Totals bar */}
            <div className="flex flex-wrap gap-3 text-xs bg-muted/50 rounded-lg p-2">
              <span><strong>Llamadas:</strong> {totals.llamadas}</span>
              <span><strong>R1:</strong> {totals.r1}</span>
              <span><strong>Expertise:</strong> {totals.expertise}</span>
              <span><strong>Capt:</strong> {totals.captaciones}</span>
              <span><strong>Capt.$:</strong> {fmtCur(totals.captaciones_valor)}</span>
              <span><strong>Busq:</strong> {totals.busquedas}</span>
              <span><strong>Consult:</strong> {totals.consultas}</span>
              <span><strong>Visitas:</strong> {totals.visitas}</span>
              <span><strong>R2:</strong> {totals.r2}</span>
              <span><strong>Res.Ptas:</strong> {totals.reservas_puntas}</span>
              <span><strong>Res.$:</strong> {fmtCur(totals.reservas_valor_oferta)}</span>
              <span><strong>Dev.Ptas:</strong> {totals.devoluciones_puntas}</span>
              <span><strong>Dev.Hon:</strong> {fmtCur(totals.devoluciones_honorarios)}</span>
              <span><strong>Cierres Ptas:</strong> {totals.cierres_operaciones_puntas}</span>
              <span><strong>Cierres Hon:</strong> {fmtCur(totals.cierres_honorarios)}</span>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <DataTable columns={columns} data={items} />
            </div>
          </div>
        )
      })}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingTrackeo ? 'Editar Registro' : 'Nuevo Registro'}
            </SheetTitle>
          </SheetHeader>
          <TrackeoForm
            trackeo={editingTrackeo}
            userId={userId}
            onSuccess={() => {
              setSheetOpen(false)
              setEditingTrackeo(null)
              router.refresh()
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar registro"
        description="Esta accion eliminara el registro de trackeo permanentemente."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
