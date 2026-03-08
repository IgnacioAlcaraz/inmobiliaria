"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/export'

interface Props {
  objetivos: any[]
  cierres: any[]
  year: number
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function ManagerOkrGlobal({ objetivos, cierres, year }: Props) {
  const totalObjective = objetivos.reduce((s: number, o: any) => {
    const val = Number(o.objetivo_comisiones_brutas ?? o.objetivo_facturacion_total ?? 0)
    return s + (isNaN(val) ? 0 : val)
  }, 0)

  const teamHonorarios = cierres.reduce((s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios) / 100), 0)
  const teamComisiones = cierres.reduce((s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios) / 100) * (Number(c.porcentaje_agente) / 100), 0)
  const ingresosNetos = teamHonorarios - teamComisiones

  const progressPct = totalObjective > 0 ? Math.round((teamHonorarios / totalObjective) * 100) : 0

  const quarters = [0,1,2,3].map((q) => {
    const months = Array.from({ length: 3 }, (_, i) => q * 3 + i)
    const honorarios = cierres
      .filter((c) => months.includes(new Date(c.fecha).getMonth()))
      .reduce((s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios) / 100), 0)

    const objectiveShare = objetivos.reduce((s: number, o: any) => {
      const pesoMonths = months.map((m) => Number(o[`peso_${MONTH_NAMES[m].toLowerCase()}`] ?? 0))
      const pesoSum = pesoMonths.reduce((a,b) => a + (isNaN(b) ? 0 : b), 0)
      const objVal = Number(o.objetivo_comisiones_brutas ?? o.objetivo_facturacion_total ?? 0) || 0
      if (pesoSum > 0) return s + (objVal * (pesoSum / 100))
      return s + objVal / 4
    }, 0)

    return { quarter: `Q${q+1}`, honorarios, objectiveShare }
  })

  return (
    <div>
      <h2 className="text-lg font-semibold">OKR Global - {year}</h2>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Objetivo Honorarios Brutos (Equipo)</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(totalObjective)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Honorarios Brutos Obtenidos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(teamHonorarios)}</p>
            <p className="text-sm text-muted-foreground mt-1">Progreso: {progressPct}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Ingresos Netos</CardTitle></CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{formatCurrency(ingresosNetos)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium">Desglose por Trimestre</h3>
        <Table className="mt-2">
          <TableHeader>
            <TableRow>
              <TableHead>Trimestre</TableHead>
              <TableHead>Objetivo</TableHead>
              <TableHead>Honorarios Obtenidos</TableHead>
              <TableHead>% Cumplimiento</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quarters.map((q) => (
              <TableRow key={q.quarter}>
                <TableCell>{q.quarter}</TableCell>
                <TableCell>{formatCurrency(q.objectiveShare)}</TableCell>
                <TableCell>{formatCurrency(q.honorarios)}</TableCell>
                <TableCell>{q.objectiveShare > 0 ? `${Math.round((q.honorarios / q.objectiveShare) * 100)}%` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
