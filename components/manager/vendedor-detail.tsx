'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatNumber } from '@/lib/export'
import { parseDateStr, formatDateDisplay } from '@/lib/utils'
import type { Profile, Cierre, Captacion, Trackeo, Objetivo } from '@/lib/types'
import {
  ArrowLeft,
  Handshake,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  Eye,
  Target,
} from 'lucide-react'
import Link from 'next/link'

interface VendedorDetailProps {
  vendedor: Profile
  cierres: (Cierre & { captacion?: { id: string; direccion: string; operacion: string; moneda: string } | null })[]
  captaciones: Captacion[]
  trackeo: Trackeo[]
  objetivo: Objetivo | null
  year: number
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function VendedorDetail({
  vendedor,
  cierres,
  captaciones,
  trackeo,
  objetivo,
  year,
}: VendedorDetailProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const cierreHon = (c: Cierre) =>
    (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
  const cierreCom = (c: Cierre) =>
    (cierreHon(c) * Number(c.porcentaje_agente)) / 100

  const filteredCierres = selectedMonth === 'all'
    ? cierres
    : cierres.filter((c) => parseDateStr(c.fecha).month === Number(selectedMonth))
  const filteredTrackeo = selectedMonth === 'all'
    ? trackeo
    : trackeo.filter((t) => parseDateStr(t.fecha).month === Number(selectedMonth))

  const totalHon = filteredCierres.reduce((s, c) => s + cierreHon(c), 0)
  const totalCom = filteredCierres.reduce((s, c) => s + cierreCom(c), 0)
  const totalPuntas = filteredCierres.reduce((s, c) => s + c.puntas, 0)
  const totalLlamadas = filteredTrackeo.reduce((s, t) => s + t.llamadas, 0)
  const totalVisitas = filteredTrackeo.reduce((s, t) => s + t.visitas, 0)
  const totalCaptT = filteredTrackeo.reduce((s, t) => s + t.captaciones, 0)

  const periodLabel = selectedMonth === 'all'
    ? `Anual ${year}`
    : `${MONTH_NAMES[Number(selectedMonth)]} ${year}`

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/app/manager/vendedores">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{vendedor.full_name || 'Sin nombre'}</h1>
          <p className="text-sm text-muted-foreground">{periodLabel} - Vista de lectura</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el anio {year}</SelectItem>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Cierres"
          value={String(filteredCierres.length)}
          subtitle={`${totalPuntas} puntas`}
          icon={Handshake}
        />
        <KpiCard title="Honorarios" value={formatCurrency(totalHon)} icon={DollarSign} />
        <KpiCard title="Comisiones" value={formatCurrency(totalCom)} icon={TrendingUp} />
        <KpiCard title="Captaciones" value={String(captaciones.length)} subtitle="en cartera" icon={Building} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard title="Llamadas" value={formatNumber(totalLlamadas)} icon={Phone} />
        <KpiCard title="Visitas" value={formatNumber(totalVisitas)} icon={Eye} />
        <KpiCard title="Captaciones (Trackeo)" value={formatNumber(totalCaptT)} icon={Target} />
      </div>

      {/* Objetivo progress */}
      {objetivo && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Progreso Objetivos {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Facturacion objetivo</p>
                <p className="text-lg font-bold">{formatCurrency(objetivo.objetivo_facturacion_total)}</p>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalHon / (objetivo.objetivo_facturacion_total || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalHon / (objetivo.objetivo_facturacion_total || 1)) * 100).toFixed(1)}% alcanzado
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Puntas objetivo</p>
                <p className="text-lg font-bold">{objetivo.objetivo_puntas}</p>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalPuntas / (objetivo.objetivo_puntas || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalPuntas / (objetivo.objetivo_puntas || 1)) * 100).toFixed(1)}% alcanzado
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Comisiones objetivo</p>
                <p className="text-lg font-bold">{formatCurrency(objetivo.objetivo_comisiones_agente)}</p>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${Math.min(100, (totalCom / (objetivo.objetivo_comisiones_agente || 1)) * 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {((totalCom / (objetivo.objetivo_comisiones_agente || 1)) * 100).toFixed(1)}% alcanzado
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cierres table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cierres ({filteredCierres.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Direccion</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Honorarios</TableHead>
                <TableHead className="text-right">Comision</TableHead>
                <TableHead className="text-right">Puntas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCierres.length > 0 ? (
                filteredCierres.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{formatDateDisplay(c.fecha)}</TableCell>
                    <TableCell>{c.captacion?.direccion || '-'}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(c.valor_cierre))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cierreHon(c))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(cierreCom(c))}</TableCell>
                    <TableCell className="text-right">{c.puntas}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground h-16">
                    Sin cierres en este periodo
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
