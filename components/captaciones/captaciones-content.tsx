'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { CaptacionForm } from '@/components/captaciones/captacion-form'
import { formatCurrency, exportToCSV } from '@/lib/export'
import { formatDateDisplay } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Captacion } from '@/lib/types'
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

interface CaptacionesContentProps {
  captaciones: Captacion[]
  userId: string
  isAdmin: boolean
}

export function CaptacionesContent({ captaciones, userId, isAdmin }: CaptacionesContentProps) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingCaptacion, setEditingCaptacion] = useState<Captacion | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from('captaciones').delete().eq('id', deleteId)
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
    exportToCSV(captaciones, 'captaciones_busquedas', [
      { key: 'id', label: 'ID' },
      { key: 'fecha_alta', label: 'Fecha Alta' },
      { key: 'autorizacion', label: 'Autorizacion' },
      { key: 'direccion', label: 'Direccion' },
      { key: 'barrio', label: 'Barrio' },
      { key: 'ciudad', label: 'Ciudad' },
      { key: 'vence', label: 'Vence' },
      { key: 'adenda', label: 'Adenda' },
      { key: 'operacion', label: 'Operacion' },
      { key: 'valor_publicado', label: 'Valor Publicado' },
      { key: 'moneda', label: 'Moneda' },
      { key: 'fecha_baja', label: 'Fecha Baja' },
      { key: 'oferta', label: 'Oferta' },
      { key: 'porcentaje_diferencia_precio', label: '% Diferencia Precio' },
      { key: 'fecha_reserva', label: 'Fecha Reserva' },
      { key: 'fecha_aceptacion', label: 'Fecha Aceptacion' },
      { key: 'fecha_notificacion', label: 'Fecha Notificacion' },
      { key: 'fecha_refuerzo', label: 'Fecha Refuerzo' },
      { key: 'fecha_cierre', label: 'Fecha Cierre' },
      { key: 'honorarios_porcentaje_1', label: '% Honorarios 1' },
      { key: 'honorarios_porcentaje_2', label: '% Honorarios 2' },
      { key: 'honorarios_totales', label: 'Honorarios Totales' },
      { key: 'comision_agente_porcentaje', label: '% Comision Agente' },
      { key: 'comision_agente_monto', label: 'Comision Agente' },
      { key: 'millas_viajes', label: 'Millas Viajes' },
      { key: 'observaciones', label: 'Observaciones' },
    ])
  }

  const fmtDate = (val: string | null) => {
    if (!val) return '-'
    return formatDateDisplay(val)
  }

  const fmtNum = (val: number | null) => {
    if (val === null || val === undefined) return '-'
    return formatCurrency(Number(val))
  }

  const fmtPct = (val: number | null) => {
    if (val === null || val === undefined) return '-'
    return `${Number(val).toFixed(1)}%`
  }

  const columns: ColumnDef<Captacion>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground" title={row.original.id}>
          {row.original.id.slice(0, 6)}
        </span>
      ),
    },
    {
      accessorKey: 'fecha_alta',
      header: ({ column }) => (
        <Button variant="ghost" size="sm" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="-ml-3">
          Fecha Alta <ArrowUpDown className="ml-1 h-3 w-3" />
        </Button>
      ),
      cell: ({ row }) => fmtDate(row.getValue('fecha_alta')),
    },
    {
      accessorKey: 'autorizacion',
      header: 'Autorizacion',
      cell: ({ row }) => row.getValue('autorizacion') || '-',
    },
    {
      accessorKey: 'direccion',
      header: 'Direccion',
      cell: ({ row }) => (
        <span className="max-w-[180px] truncate block font-medium">{row.getValue('direccion')}</span>
      ),
    },
    {
      accessorKey: 'barrio',
      header: 'Barrio',
      cell: ({ row }) => row.getValue('barrio') || '-',
    },
    {
      accessorKey: 'ciudad',
      header: 'Ciudad',
      cell: ({ row }) => row.getValue('ciudad') || '-',
    },
    {
      accessorKey: 'vence',
      header: 'Vence',
      cell: ({ row }) => fmtDate(row.getValue('vence')),
    },
    {
      accessorKey: 'adenda',
      header: 'Adenda',
      cell: ({ row }) => row.getValue('adenda') || '-',
    },
    {
      accessorKey: 'operacion',
      header: 'Operacion',
      cell: ({ row }) => {
        const op = row.getValue('operacion') as string
        const colors: Record<string, string> = {
          Venta: 'bg-primary/10 text-primary',
          Alquiler: 'bg-blue-100 text-blue-700',
          Temporario: 'bg-amber-100 text-amber-700',
        }
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colors[op] || ''}`}>
            {op}
          </span>
        )
      },
    },
    {
      accessorKey: 'valor_publicado',
      header: 'Valor Publicado',
      cell: ({ row }) => {
        const moneda = row.original.moneda
        const val = Number(row.getValue('valor_publicado'))
        return `${moneda === 'ARS' ? '$' : 'USD'} ${val.toLocaleString('es-AR')}`
      },
    },
    {
      accessorKey: 'fecha_baja',
      header: 'Fecha Baja',
      cell: ({ row }) => fmtDate(row.getValue('fecha_baja')),
    },
    {
      accessorKey: 'moneda',
      header: 'Moneda',
    },
    {
      accessorKey: 'oferta',
      header: 'Oferta',
      cell: ({ row }) => fmtNum(row.original.oferta),
    },
    {
      accessorKey: 'porcentaje_diferencia_precio',
      header: '% Dif. Precio',
      cell: ({ row }) => fmtPct(row.original.porcentaje_diferencia_precio),
    },
    {
      accessorKey: 'fecha_reserva',
      header: 'F. Reserva',
      cell: ({ row }) => fmtDate(row.getValue('fecha_reserva')),
    },
    {
      accessorKey: 'fecha_aceptacion',
      header: 'F. Aceptacion',
      cell: ({ row }) => fmtDate(row.getValue('fecha_aceptacion')),
    },
    {
      accessorKey: 'fecha_notificacion',
      header: 'F. Notificacion',
      cell: ({ row }) => fmtDate(row.getValue('fecha_notificacion')),
    },
    {
      accessorKey: 'fecha_refuerzo',
      header: 'F. Refuerzo',
      cell: ({ row }) => fmtDate(row.getValue('fecha_refuerzo')),
    },
    {
      accessorKey: 'fecha_cierre',
      header: 'F. Cierre',
      cell: ({ row }) => fmtDate(row.getValue('fecha_cierre')),
    },
    {
      accessorKey: 'honorarios_porcentaje_1',
      header: '% Hon. 1',
      cell: ({ row }) => fmtPct(row.original.honorarios_porcentaje_1),
    },
    {
      accessorKey: 'honorarios_porcentaje_2',
      header: '% Hon. 2',
      cell: ({ row }) => fmtPct(row.original.honorarios_porcentaje_2),
    },
    {
      accessorKey: 'honorarios_totales',
      header: 'Hon. Totales',
      cell: ({ row }) => fmtNum(row.original.honorarios_totales),
    },
    {
      id: 'comision_agente',
      header: 'Com. Agente',
      cell: ({ row }) => {
        const pct = row.original.comision_agente_porcentaje
        const monto = row.original.comision_agente_monto
        if (pct === null && monto === null) return '-'
        return `${fmtPct(pct)} / ${fmtNum(monto)}`
      },
    },
    {
      accessorKey: 'millas_viajes',
      header: 'Millas',
      cell: ({ row }) => row.original.millas_viajes ?? '-',
    },
    {
      accessorKey: 'observaciones',
      header: 'Observaciones',
      cell: ({ row }) => (
        <span className="max-w-[150px] truncate block text-xs text-muted-foreground">
          {row.original.observaciones || '-'}
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
              setEditingCaptacion(row.original)
              setSheetOpen(true)
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

  return (
    <div className="flex flex-col gap-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          onClick={() => {
            setEditingCaptacion(null)
            setSheetOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nueva Captacion / Busqueda
        </Button>
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Exportar CSV
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          {captaciones.length} registro{captaciones.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Data Table - horizontal scroll for wide table */}
      <div className="overflow-x-auto border rounded-lg">
        <DataTable
          columns={columns}
          data={captaciones}
          searchKey="direccion"
          searchPlaceholder="Buscar por direccion..."
        />
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>
              {editingCaptacion ? 'Editar Registro' : 'Nueva Captacion / Busqueda'}
            </SheetTitle>
          </SheetHeader>
          <CaptacionForm
            captacion={editingCaptacion}
            userId={userId}
            onSuccess={() => {
              setSheetOpen(false)
              setEditingCaptacion(null)
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
        description="Esta accion eliminara el registro permanentemente. Si tiene cierres vinculados, tambien se eliminaran."
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  )
}
