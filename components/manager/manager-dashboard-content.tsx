'use client'

import { useState } from 'react'
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
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatNumber } from '@/lib/export'
import { parseDateStr } from '@/lib/utils'
import type { Profile, Cierre, Captacion, Trackeo } from '@/lib/types'
import {
  Users,
  Handshake,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  Eye,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import Link from 'next/link'

interface ManagerDashboardContentProps {
  vendedores: Profile[]
  cierres: (Cierre & { captacion?: { id: string; direccion: string; operacion: string; moneda: string } | null })[]
  captaciones: Captacion[]
  trackeo: Trackeo[]
  year: number
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function ManagerDashboardContent({
  vendedores,
  cierres,
  captaciones,
  trackeo,
  year,
}: ManagerDashboardContentProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedVendedor, setSelectedVendedor] = useState<string>('all')

  const cierreHon = (c: Cierre) =>
    (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
  const cierreCom = (c: Cierre) =>
    (cierreHon(c) * Number(c.porcentaje_agente)) / 100

  // Filter by vendedor
  const vCierres = selectedVendedor === 'all'
    ? cierres
    : cierres.filter((c) => c.user_id === selectedVendedor)
  const vCaptaciones = selectedVendedor === 'all'
    ? captaciones
    : captaciones.filter((c) => c.user_id === selectedVendedor)
  const vTrackeo = selectedVendedor === 'all'
    ? trackeo
    : trackeo.filter((t) => t.user_id === selectedVendedor)

  // Filter by month
  const filteredCierres = selectedMonth === 'all'
    ? vCierres
    : vCierres.filter((c) => parseDateStr(c.fecha).month === Number(selectedMonth))
  const filteredTrackeo = selectedMonth === 'all'
    ? vTrackeo
    : vTrackeo.filter((t) => parseDateStr(t.fecha).month === Number(selectedMonth))

  // KPIs
  const totalHonorarios = filteredCierres.reduce((s, c) => s + cierreHon(c), 0)
  const totalComisiones = filteredCierres.reduce((s, c) => s + cierreCom(c), 0)
  const totalPuntas = filteredCierres.reduce((s, c) => s + c.puntas, 0)
  const totalLlamadas = filteredTrackeo.reduce((s, t) => s + t.llamadas, 0)
  const totalVisitas = filteredTrackeo.reduce((s, t) => s + t.visitas, 0)

  // Vendedor ranking
  const vendedorStats = vendedores.map((v) => {
    const vc = filteredCierres.filter((c) => c.user_id === v.id)
    const vcap = vCaptaciones.filter((c) => c.user_id === v.id)
    const vt = filteredTrackeo.filter((t) => t.user_id === v.id)
    const hon = vc.reduce((s, c) => s + cierreHon(c), 0)
    const com = vc.reduce((s, c) => s + cierreCom(c), 0)
    const puntas = vc.reduce((s, c) => s + c.puntas, 0)
    return {
      id: v.id,
      name: v.full_name || 'Sin nombre',
      cierres: vc.length,
      honoriarios: hon,
      comisiones: com,
      puntas,
      captaciones: vcap.length,
      llamadas: vt.reduce((s, t) => s + t.llamadas, 0),
      visitas: vt.reduce((s, t) => s + t.visitas, 0),
    }
  }).sort((a, b) => b.honoriarios - a.honoriarios)

  // Chart: monthly honorarios
  const honByMonth = Array.from({ length: 12 }, (_, i) => {
    const mCierres = vCierres.filter((c) => parseDateStr(c.fecha).month === i)
    return {
      mes: MONTH_NAMES[i].substring(0, 3),
      honorarios: mCierres.reduce((s, c) => s + cierreHon(c), 0),
      comisiones: mCierres.reduce((s, c) => s + cierreCom(c), 0),
    }
  })

  const periodLabel = selectedMonth === 'all'
    ? `Anual ${year}`
    : `${MONTH_NAMES[Number(selectedMonth)]} ${year}`

  const vendedorLabel = selectedVendedor === 'all'
    ? 'Equipo completo'
    : vendedores.find((v) => v.id === selectedVendedor)?.full_name || ''

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Encargado</h1>
        <p className="text-sm text-muted-foreground">
          {vendedores.length} vendedores asignados - {vendedorLabel} - {periodLabel}
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Vendedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Equipo completo</SelectItem>
            {vendedores.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.full_name || 'Sin nombre'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Vendedores" value={String(vendedores.length)} icon={Users} />
        <KpiCard
          title="Cierres"
          value={String(filteredCierres.length)}
          subtitle={`${totalPuntas} puntas`}
          icon={Handshake}
        />
        <KpiCard
          title="Honorarios"
          value={formatCurrency(totalHonorarios)}
          subtitle="facturacion"
          icon={DollarSign}
        />
        <KpiCard
          title="Comisiones"
          value={formatCurrency(totalComisiones)}
          icon={TrendingUp}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Captaciones en Cartera"
          value={String(vCaptaciones.length)}
          icon={Building}
        />
        <KpiCard title="Llamadas" value={formatNumber(totalLlamadas)} icon={Phone} />
        <KpiCard title="Visitas" value={formatNumber(totalVisitas)} icon={Eye} />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Honorarios y Comisiones por Mes - {year}</CardTitle>
        </CardHeader>
        <CardContent>
          {vCierres.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={honByMonth}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Bar dataKey="honorarios" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Honorarios" />
                <Bar dataKey="comisiones" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Comisiones" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-muted-foreground text-sm">
              Sin cierres registrados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ranking table */}
      {selectedVendedor === 'all' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ranking de Vendedores</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Cierres</TableHead>
                  <TableHead className="text-right">Puntas</TableHead>
                  <TableHead className="text-right">Honorarios</TableHead>
                  <TableHead className="text-right">Comisiones</TableHead>
                  <TableHead className="text-right">Captaciones</TableHead>
                  <TableHead className="text-right">Llamadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendedorStats.map((v, i) => (
                  <TableRow key={v.id}>
                    <TableCell>
                      {i < 3 ? (
                        <Badge variant={i === 0 ? 'default' : 'secondary'} className="w-6 h-6 flex items-center justify-center rounded-full p-0 text-xs">
                          {i + 1}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">{i + 1}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/app/manager/vendedores/${v.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {v.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">{v.cierres}</TableCell>
                    <TableCell className="text-right">{v.puntas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.honoriarios)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.comisiones)}</TableCell>
                    <TableCell className="text-right">{v.captaciones}</TableCell>
                    <TableCell className="text-right">{v.llamadas}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
