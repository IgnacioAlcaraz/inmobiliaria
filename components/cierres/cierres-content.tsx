'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CierreForm } from '@/components/cierres/cierre-form'
import { formatCurrency, exportToCSV } from '@/lib/export'
import { formatDateDisplay } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { CierreConCalculos } from '@/lib/types'
import { toast } from 'sonner'
import {
  Plus,
  Download,
  Pencil,
  Trash2,
  ArrowUpDown,
} from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface CaptacionOption {
  id: string
  direccion: string
  operacion: string
  moneda: string
  valor_publicado: number
}

interface CierreRow {
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
  captacion?: {
    id: string
    direccion: string
    operacion: string
    moneda: string
  } | null
}

interface CierresContentProps {
  cierres: CierreRow[]
  captaciones: CaptacionOption[]
  userId: string
  isAdmin: boolean
}

export function CierresContent({ cierres, captaciones, userId }: CierresContentProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCierre, setEditingCierre] = useState<CierreRow | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Compute calculated fields with running acumulado
  const cierresConCalculos: CierreConCalculos[] = useMemo(() => {
    let acumulado = 0
    return cierres.map((c) => {
      const honorarios_totales = (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
      const comision_agente = (honorarios_totales * Number(c.porcentaje_agente)) / 100
      acumulado += honorarios_totales
      return {
        ...c,
        direccion: c.captacion?.direccion || 'Sin direccion',
        honorarios_totales,
        comision_agente,
        total_puntas: c.puntas,
        acumulado,
      }
    })
  }, [cierres])

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('cierres').delete().eq('id', deleteId)
    if (error) {
      toast.error('Error al eliminar')
    } else {
      toast.success('Cierre eliminado')
      router.refresh()
    }
    setDeleting(false)
    setDeleteId(null)
  }

  const handleExport = () => {
    exportToCSV(cierresConCalculos, 'cierres', [
      { key: 'fecha', label: 'Fecha' },
      { key: 'direccion', label: 'ID / Direccion' },
      { key: 'valor_cierre', label: 'Valor Cierre' },
      { key: 'porcentaje_honorarios', label: '% Honorarios' },
      { key: 'porcentaje_agente', label: '% Agente' },
      { key: 'honorarios_totales', label: 'Honorarios Totales' },
      { key: 'comision_agente', label: 'Comision Agente' },
      { key: 'total_puntas', label: 'Total Puntas' },
      { key: 'acumulado', label: 'Acumulado' },
    ])
  }

  const columns: ColumnDef<CierreConCalculos>[] = [
    {
      accessorKey: 'fecha',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
          Fecha <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => formatDateDisplay(row.getValue('fecha')),
    },
    {
      accessorKey: 'direccion',
      header: 'ID / Direccion',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium truncate max-w-[200px]">{row.original.direccion}</span>
          <span className="text-xs text-muted-foreground font-mono">{row.original.captacion_id.slice(0, 6)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'valor_cierre',
      header: 'Valor Cierre',
      cell: ({ row }) => formatCurrency(row.original.valor_cierre),
    },
    {
      accessorKey: 'porcentaje_honorarios',
      header: '% Honorarios',
      cell: ({ row }) => `${row.original.porcentaje_honorarios}%`,
    },
    {
      accessorKey: 'porcentaje_agente',
      header: '% Agente',
      cell: ({ row }) => `${row.original.porcentaje_agente}%`,
    },
    {
      id: 'honorarios_totales',
      header: 'Honorarios Totales',
      cell: ({ row }) => (
        <span className="font-medium text-primary">
          {formatCurrency(row.original.honorarios_totales)}
        </span>
      ),
    },
    {
      id: 'comision_agente',
      header: 'Comision Agente',
      cell: ({ row }) => formatCurrency(row.original.comision_agente),
    },
    {
      accessorKey: 'total_puntas',
      header: 'Total Puntas',
      cell: ({ row }) => row.original.total_puntas,
    },
    {
      id: 'acumulado',
      header: 'Acumulado',
      cell: ({ row }) => (
        <span className="font-semibold text-foreground">
          {formatCurrency(row.original.acumulado)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const orig = cierres.find((c) => c.id === row.original.id)
              if (orig) {
                setEditingCierre(orig)
                setSheetOpen(true)
              }
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
            <span className="sr-only">Editar</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => setDeleteId(row.original.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="sr-only">Eliminar</span>
          </Button>
        </div>
      ),
    },
  ]

  // Summary totals
  const totalHonorarios = cierresConCalculos.reduce((s, c) => s + c.honorarios_totales, 0)
  const totalComision = cierresConCalculos.reduce((s, c) => s + c.comision_agente, 0)
  const totalPuntas = cierresConCalculos.reduce((s, c) => s + c.total_puntas, 0)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Honorarios</p>
          <p className="text-2xl font-bold text-primary">{formatCurrency(totalHonorarios)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Comision Agente</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(totalComision)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total Puntas</p>
          <p className="text-2xl font-bold text-foreground">{totalPuntas}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setEditingCierre(null)
            setSheetOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nuevo Cierre
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {cierres.length} cierre{cierres.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={cierresConCalculos}
        searchKey="direccion"
        searchPlaceholder="Buscar por direccion..."
      />

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingCierre ? 'Editar Cierre' : 'Nuevo Cierre'}
            </SheetTitle>
          </SheetHeader>
          <CierreForm
            cierre={editingCierre}
            captaciones={captaciones}
            userId={userId}
            onSuccess={() => {
              setSheetOpen(false)
              setEditingCierre(null)
              router.refresh()
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar cierre"
        description="Esta accion eliminara el cierre permanentemente."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
