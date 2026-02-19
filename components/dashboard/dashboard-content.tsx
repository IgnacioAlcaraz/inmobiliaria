'use client'

import { useState } from 'react'
import { KpiCard } from '@/components/kpi-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatNumber } from '@/lib/export'
import type { Cierre, Captacion, Trackeo } from '@/lib/types'
import { parseDateStr, formatDateDisplay } from '@/lib/utils'
import {
  Handshake,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  Eye,
  Target,
  CalendarDays,
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

interface DashboardContentProps {
  cierres: (Cierre & { captacion?: { id: string; direccion: string; operacion: string; moneda: string } | null })[]
  captaciones: Captacion[]
  trackeo: Trackeo[]
  isAdmin: boolean
  year: number
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function DashboardContent({
  cierres,
  captaciones,
  trackeo,
  isAdmin,
  year,
}: DashboardContentProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all')

  const cierreHon = (c: Cierre) =>
    (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100
  const cierreCom = (c: Cierre) =>
    (cierreHon(c) * Number(c.porcentaje_agente)) / 100

  // -- Filtered data based on selected month --
  const filteredCierres = selectedMonth === 'all'
    ? cierres
    : cierres.filter((c) => parseDateStr(c.fecha).month === Number(selectedMonth))

  const filteredTrackeo = selectedMonth === 'all'
    ? trackeo
    : trackeo.filter((t) => parseDateStr(t.fecha).month === Number(selectedMonth))

  // -- KPIs --
  const totalHonorarios = filteredCierres.reduce((s, c) => s + cierreHon(c), 0)
  const totalComisiones = filteredCierres.reduce((s, c) => s + cierreCom(c), 0)
  const totalPuntas = filteredCierres.reduce((s, c) => s + c.puntas, 0)

  const totalLlamadas = filteredTrackeo.reduce((s, t) => s + t.llamadas, 0)
  const totalVisitas = filteredTrackeo.reduce((s, t) => s + t.visitas, 0)
  const totalCaptacionesT = filteredTrackeo.reduce((s, t) => s + t.captaciones, 0)

  // -- Captaciones by operation (always show full portfolio) --
  const captByOp = [
    { tipo: 'Venta', count: captaciones.filter((c) => c.operacion === 'Venta').length },
    { tipo: 'Alquiler', count: captaciones.filter((c) => c.operacion === 'Alquiler').length },
    { tipo: 'Temporario', count: captaciones.filter((c) => c.operacion === 'Temporario').length },
  ].filter((item) => item.count > 0)

  // -- Chart: honorarios by month (always shows full year for context) --
  const honByMonth = Array.from({ length: 12 }, (_, i) => {
    const mCierres = cierres.filter((c) => parseDateStr(c.fecha).month === i)
    return {
      mes: MONTH_NAMES[i].substring(0, 3),
      honorarios: mCierres.reduce((s, c) => s + cierreHon(c), 0),
      comisiones: mCierres.reduce((s, c) => s + cierreCom(c), 0),
    }
  })

  // -- Trackeo chart data (filtered by selected month or last 30 days if "all") --
  const trackeoChartData = filteredTrackeo
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((t) => ({
      fecha: formatDateDisplay(t.fecha, { day: '2-digit', month: '2-digit' }),
      llamadas: t.llamadas,
      visitas: t.visitas,
      captaciones: t.captaciones,
    }))

  const periodLabel = selectedMonth === 'all'
    ? `Anual ${year}`
    : `${MONTH_NAMES[Number(selectedMonth)]} ${year}`

  return (
    <div className="flex flex-col gap-6">
      {isAdmin && (
        <p className="text-sm text-muted-foreground">
          Vista de administrador - datos de todos los vendedores
        </p>
      )}

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground">{periodLabel}</h2>
          <p className="text-sm text-muted-foreground">
            {filteredCierres.length} cierres / {captaciones.length} captaciones en cartera / {filteredTrackeo.length} dias trackeados
          </p>
        </div>
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por mes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el anio {year}</SelectItem>
            {MONTH_NAMES.map((name, i) => (
              <SelectItem key={i} value={String(i)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Cierres"
          value={String(filteredCierres.length)}
          subtitle={`${totalPuntas} puntas totales`}
          icon={Handshake}
        />
        <KpiCard
          title="Honorarios"
          value={formatCurrency(totalHonorarios)}
          subtitle="facturacion"
          icon={DollarSign}
        />
        <KpiCard
          title="Comisiones Agente"
          value={formatCurrency(totalComisiones)}
          subtitle="ingreso neto"
          icon={TrendingUp}
        />
        <KpiCard
          title="Captaciones en Cartera"
          value={String(captaciones.length)}
          subtitle={captByOp.map((c) => `${c.count} ${c.tipo}`).join(' / ') || 'sin datos'}
          icon={Building}
        />
      </div>

      {/* Trackeo KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Llamadas"
          value={formatNumber(totalLlamadas)}
          subtitle={`${filteredTrackeo.length} dias registrados`}
          icon={Phone}
        />
        <KpiCard
          title="Visitas"
          value={formatNumber(totalVisitas)}
          subtitle="visitas realizadas"
          icon={Eye}
        />
        <KpiCard
          title="Captaciones (Trackeo)"
          value={formatNumber(totalCaptacionesT)}
          subtitle="captaciones del periodo"
          icon={Target}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base" id="hon-chart-title">Honorarios y Comisiones por Mes - {year}</CardTitle>
          </CardHeader>
          <CardContent>
            {cierres.length > 0 ? (
              <div role="region" aria-labelledby="hon-chart-title" className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={honByMonth} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="mes" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
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
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <CalendarDays className="h-8 w-8 mb-2 opacity-20" />
                Sin cierres registrados este anio
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base" id="activity-chart-title">
              Actividad Diaria{selectedMonth !== 'all' ? ` - ${MONTH_NAMES[Number(selectedMonth)]}` : ` - ${year}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trackeoChartData.length > 0 ? (
              <div role="region" aria-labelledby="activity-chart-title" className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trackeoChartData} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis dataKey="fecha" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                      contentStyle={{
                        background: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                      }}
                    />
                    <Bar dataKey="llamadas" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Llamadas" />
                    <Bar dataKey="visitas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Visitas" />
                    <Bar dataKey="captaciones" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Captaciones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[280px] text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                <Target className="h-8 w-8 mb-2 opacity-20" />
                Sin datos de trackeo para este periodo
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
