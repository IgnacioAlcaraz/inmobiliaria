'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/export'
import { parseDateStr, formatDateDisplay } from '@/lib/utils'
import { MONTH_NAMES } from '@/lib/constants'
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
    ? `Año ${year}`
    : `${MONTH_NAMES[Number(selectedMonth)]} ${year}`

  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── Top bar: back + filter ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href="/app/manager/vendedores" aria-label="Volver a vendedores">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <Badge variant="secondary" className="text-xs">Vista de lectura</Badge>
            <p className="text-sm text-muted-foreground mt-0.5">{periodLabel}</p>
          </div>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el año {year}</SelectItem>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* ── KPIs row 1 ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 stagger-children">
        <KpiCard
          title="Cierres"
          value={String(filteredCierres.length)}
          subtitle={`${totalPuntas} puntas`}
          icon={Handshake}
          variant="primary"
        />
        <KpiCard title="Honorarios" value={formatCurrency(totalHon)} icon={DollarSign} variant="success" />
        <KpiCard title="Comisiones" value={formatCurrency(totalCom)} icon={TrendingUp} variant="accent" />
        <KpiCard title="Captaciones" value={String(captaciones.length)} subtitle="en cartera" icon={Building} />
      </div>

      {/* ── KPIs row 2 ── */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 stagger-children">
        <KpiCard title="Llamadas" value={formatNumber(totalLlamadas)} icon={Phone} />
        <KpiCard title="Visitas" value={formatNumber(totalVisitas)} icon={Eye} />
        <KpiCard title="Captaciones (Trackeo)" value={formatNumber(totalCaptT)} icon={Target} />
      </div>

      {/* ── Objetivo progress ── */}
      {objetivo && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Progreso Objetivos {year}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-5 md:grid-cols-3">
              {/* Facturación */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Facturación objetivo</p>
                  <span className="text-xs font-bold">
                    {((totalHon / (objetivo.objetivo_facturacion_total || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (totalHon / (objetivo.objetivo_facturacion_total || 1)) * 100)}
                  className="h-2"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground">{formatCurrency(totalHon)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(objetivo.objetivo_facturacion_total)}</p>
                </div>
              </div>
              {/* Puntas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Puntas objetivo</p>
                  <span className="text-xs font-bold">
                    {((totalPuntas / (objetivo.objetivo_puntas || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (totalPuntas / (objetivo.objetivo_puntas || 1)) * 100)}
                  className="h-2"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground tabular-nums">{totalPuntas}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">{objetivo.objetivo_puntas}</p>
                </div>
              </div>
              {/* Comisiones */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Comisiones objetivo</p>
                  <span className="text-xs font-bold">
                    {((totalCom / (objetivo.objetivo_comisiones_agente || 1)) * 100).toFixed(1)}%
                  </span>
                </div>
                <Progress
                  value={Math.min(100, (totalCom / (objetivo.objetivo_comisiones_agente || 1)) * 100)}
                  className="h-2"
                />
                <div className="flex items-center justify-between mt-1.5">
                  <p className="text-xs text-muted-foreground">{formatCurrency(totalCom)}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(objetivo.objetivo_comisiones_agente)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Cierres table ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Cierres
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filteredCierres.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Fecha</TableHead>
                  <TableHead>Dirección</TableHead>
                  <TableHead>Operación</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-right">Honorarios</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                  <TableHead className="text-right pr-4">Puntas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCierres.length > 0 ? (
                  filteredCierres.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="tabular-nums">{formatDateDisplay(c.fecha)}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{c.captacion?.direccion || '-'}</TableCell>
                      <TableCell>
                        {c.captacion?.operacion ? (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {c.captacion.operacion}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrency(Number(c.valor_cierre))}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">{formatCurrency(cierreHon(c))}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">{formatCurrency(cierreCom(c))}</TableCell>
                      <TableCell className="text-right tabular-nums pr-4">{c.puntas}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10 text-sm">
                      Sin cierres en este período
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
