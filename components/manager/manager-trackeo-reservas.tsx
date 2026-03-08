"use client"
import { Table, TableCell, TableRow, TableHeader, TableBody, TableHead } from '../ui/table';
import React from 'react'
import { formatCurrency } from '@/lib/export'
import type { Profile } from '@/lib/types'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Props {
  trackeoDiario: any[]
  captacionesBusquedas?: any[]
  vendedores?: Profile[]
  manualEntries?: any[]
}

export function ManagerTrackeoGlobal({ trackeoDiario = [], captacionesBusquedas = [], vendedores = [], manualEntries = [] }: Props) {
  const MONTH_NAMES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ]

  // Helper: rows by month index 0..11
  const rowsByMonth = Array.from({ length: 12 }, (_, i) => {
    const rows = (trackeoDiario || []).filter((t) => new Date(t.fecha).getMonth() === i)
    const reservasPuntas = rows.reduce((s, r) => s + Number(r.reservas_puntas || 0), 0)
    const reservasValor = rows.reduce((s, r) => s + Number(r.reservas_valor_oferta || 0), 0)
    const cierresPuntas = rows.reduce((s, r) => s + Number(r.cierres_operaciones_puntas || 0), 0)
    const cierresHonorarios = rows.reduce((s, r) => s + Number(r.cierres_honorarios || 0), 0)
    const llamadas = rows.reduce((s, r) => s + Number(r.llamadas || 0), 0)
    const visitas = rows.reduce((s, r) => s + Number(r.visitas || 0), 0)
    const captBusMes = (captacionesBusquedas || []).filter((c) => new Date(c.fecha_alta).getMonth() === i)
    const captacionesCnt = captBusMes.length
    const captacionesValor = captBusMes.reduce((s, c) => s + Number(c.valor_publicado || 0), 0)

    return {
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      reservasPuntas,
      reservasValor,
      cierresPuntas,
      cierresHonorarios,
      llamadas,
      visitas,
      captacionesCnt,
      captacionesValor,
    }
  })

  // running accumulators for reservas
  let acumulReservasPuntas = 0
  let acumulReservasValor = 0

  // normalize manual entries to map by section/month/key
  const manualMap: Record<string, any> = {}
  ;(manualEntries || []).forEach((m: any) => {
    const k = `${m.section}::${m.month}::${m.key}`
    manualMap[k] = m
  })

  // For capital humano we approximate from vendedores list (created_at)
  const vendedoresByMonth = Array.from({ length: 12 }, (_, i) => (vendedores || []).filter((v) => new Date(v.created_at).getMonth() === i).length)

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Trackeo Global</h1>

      {/* 1) Trackeo Reservas vs Cierres */}
      <section>
        <h2 className="text-lg font-medium">Trackeo Reservas vs Cierres</h2>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Reservas (puntas)</TableHead>
                  <TableHead>Reservas Valor</TableHead>
                  <TableHead>Cierres (puntas)</TableHead>
                  <TableHead>Honorarios Cierres</TableHead>
                  <TableHead>Reservas Acumuladas</TableHead>
                  <TableHead>Reservas Valor Acumulado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsByMonth.map((r) => {
                  acumulReservasPuntas += r.reservasPuntas
                  acumulReservasValor += r.reservasValor
                  return (
                    <TableRow key={r.monthIndex}>
                      <TableCell>{r.monthName}</TableCell>
                      <TableCell>
                        {manualMap[`reservas_vs_cierres::${r.monthIndex}::puntas_reservas_inicio_mes`]?.value ?? r.reservasPuntas}
                      </TableCell>
                      <TableCell>
                        {manualMap[`reservas_vs_cierres::${r.monthIndex}::reservas_honorarios_inicio_mes`]?.value ?? formatCurrency(r.reservasValor)}
                      </TableCell>
                      <TableCell>{manualMap[`reservas_vs_cierres::${r.monthIndex}::cantidad_cierres_puntas`]?.value ?? r.cierresPuntas}</TableCell>
                      <TableCell>{manualMap[`reservas_vs_cierres::${r.monthIndex}::honorarios_brutos_por_cierres`]?.value ?? formatCurrency(r.cierresHonorarios)}</TableCell>
                      <TableCell>{manualMap[`reservas_vs_cierres::${r.monthIndex}::puntas_reservas_acumuladas`]?.value ?? acumulReservasPuntas}</TableCell>
                      <TableCell>{manualMap[`reservas_vs_cierres::${r.monthIndex}::honorarios_reservas_acumulados`]?.value ?? formatCurrency(acumulReservasValor)}</TableCell>
                    </TableRow>
                  )
                })}

                {/* Acumulado row */}
                <TableRow>
                  <TableCell>Acumulado</TableCell>
                  <TableCell>{rowsByMonth.reduce((s, r) => s + r.reservasPuntas, 0)}</TableCell>
                  <TableCell>{formatCurrency(rowsByMonth.reduce((s, r) => s + r.reservasValor, 0))}</TableCell>
                  <TableCell>{rowsByMonth.reduce((s, r) => s + r.cierresPuntas, 0)}</TableCell>
                  <TableCell>{formatCurrency(rowsByMonth.reduce((s, r) => s + r.cierresHonorarios, 0))}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>

              </TableBody>
            </Table>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rowsByMonth.map((r) => ({ mes: r.monthName, honorarios: r.cierresHonorarios }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="honorarios" fill="#c0392b" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-sm text-muted-foreground mt-2">Honorarios Brutos por Cierre</div>
          </div>
        </div>
      </section>

      {/* 2) Trackeo Numérico */}
      <section>
        <h2 className="text-lg font-medium">Trackeo Numérico</h2>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Honorarios Brutos</TableHead>
                  <TableHead>Regalías Master</TableHead>
                  <TableHead>Comisión Director</TableHead>
                  <TableHead>Honorarios Martillero</TableHead>
                  <TableHead>Comisión Agentes</TableHead>
                  <TableHead>Ingreso Neto Centro</TableHead>
                  <TableHead>Gastos Mes</TableHead>
                  <TableHead>Resultado Centro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsByMonth.map((r) => {
                  const honorarios = r.cierresHonorarios
                  const comAgentes = manualMap[`numerico::${r.monthIndex}::comision_agentes`]?.value ?? 0
                  const gastos = manualMap[`numerico::${r.monthIndex}::gastos_mes`]?.value ?? 0
                  const resultado = honorarios - comAgentes - gastos
                  return (
                    <TableRow key={r.monthIndex}>
                      <TableCell>{r.monthName}</TableCell>
                      <TableCell>{formatCurrency(honorarios)}</TableCell>
                      <TableCell>{manualMap[`numerico::${r.monthIndex}::regalias_master`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`numerico::${r.monthIndex}::comision_director`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`numerico::${r.monthIndex}::honorarios_martillero`]?.value ?? '-'}</TableCell>
                      <TableCell>{comAgentes || '-'}</TableCell>
                      <TableCell>{formatCurrency(honorarios - (comAgentes || 0))}</TableCell>
                      <TableCell>{gastos || '-'}</TableCell>
                      <TableCell>{formatCurrency(resultado)}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell>Acumulado</TableCell>
                  <TableCell>{formatCurrency(rowsByMonth.reduce((s, r) => s + r.cierresHonorarios, 0))}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rowsByMonth.map((r) => ({ mes: r.monthName, resultado: (r.cierresHonorarios - (manualMap[`numerico::${r.monthIndex}::comision_agentes`]?.value ?? 0) - (manualMap[`numerico::${r.monthIndex}::gastos_mes`]?.value ?? 0)) }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="resultado" stroke="#2c3e50" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-sm text-muted-foreground mt-2">Resultado Centro</div>
          </div>
        </div>
      </section>

      {/* 3) Trackeo Capital Humano */}
      <section>
        <h2 className="text-lg font-medium">Trackeo Capital Humano</h2>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Agentes Al Inicio Mes</TableHead>
                  <TableHead>Agentes Nuevos</TableHead>
                  <TableHead>Bajas Agentes</TableHead>
                  <TableHead>Total Agentes</TableHead>
                  <TableHead>Agentes Principiantes</TableHead>
                  <TableHead>Agentes Buscadores</TableHead>
                  <TableHead>Agentes Encam.</TableHead>
                  <TableHead>Agentes Logradores</TableHead>
                  <TableHead>Agentes Referentes</TableHead>
                  <TableHead>Agentes en proceso desvinc.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsByMonth.map((r, idx) => {
                  const nuevos = vendedoresByMonth[idx] || 0
                  // total agents at month end = agents created until this month
                  const totalAgents = (vendedores || []).filter((v) => new Date(v.created_at).getMonth() <= idx).length
                  return (
                    <TableRow key={r.monthIndex}>
                      <TableCell>{r.monthName}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_inicio_mes`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_nuevos`]?.value ?? nuevos}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::bajas_agentes`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::total_agentes`]?.value ?? totalAgents}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_principiantes`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_buscadores`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_encaminados`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_logradores`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_referentes`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`capital_humano::${r.monthIndex}::agentes_desvinc`]?.value ?? '-'}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell>Acumulado</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{(vendedores || []).length}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{(vendedores || []).length}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rowsByMonth.map((r, idx) => ({ mes: r.monthName, total: (vendedores || []).filter((v) => new Date(v.created_at).getMonth() <= idx).length }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={2} dot={true} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-sm text-muted-foreground mt-2">Evolución Equipo</div>
          </div>
        </div>
      </section>

      {/* 4) Trackeo Evolución Cartera */}
      <section>
        <h2 className="text-lg font-medium">Trackeo Evolución Cartera</h2>
        <div className="mt-3 grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mes</TableHead>
                  <TableHead>Cartera Inicio Mes</TableHead>
                  <TableHead>Nuevas Captaciones Venta</TableHead>
                  <TableHead>Nuevas Captaciones Alquiler</TableHead>
                  <TableHead>Reservadas</TableHead>
                  <TableHead>Dadas De Baja</TableHead>
                  <TableHead>Total Cartera Mes</TableHead>
                  <TableHead>Exclusivas</TableHead>
                  <TableHead>% Exclusividad</TableHead>
                  <TableHead>Ticket Promedio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rowsByMonth.map((r) => {
                  const totalCartera = manualMap[`evolucion_cartera::${r.monthIndex}::total_cartera_mes`]?.value ?? r.captacionesCnt
                  const ticketProm = r.captacionesCnt > 0 ? Math.round(r.captacionesValor / r.captacionesCnt) : null
                  return (
                    <TableRow key={r.monthIndex}>
                      <TableCell>{r.monthName}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::cartera_inicio_mes`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::nuevas_captaciones_venta`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::nuevas_captaciones_alquiler`]?.value ?? '-'}</TableCell>
                      <TableCell>{r.reservasPuntas}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::dadas_de_baja`]?.value ?? '-'}</TableCell>
                      <TableCell>{totalCartera}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::exclusivas`]?.value ?? '-'}</TableCell>
                      <TableCell>{manualMap[`evolucion_cartera::${r.monthIndex}::pct_exclusividad`]?.value ?? '-'}</TableCell>
                      <TableCell>{ticketProm ? formatCurrency(ticketProm) : '-'}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow>
                  <TableCell>Acumulado</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{rowsByMonth.reduce((s, r) => s + r.reservasPuntas, 0)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rowsByMonth.map((r) => ({ mes: r.monthName, total: manualMap[`evolucion_cartera::${r.monthIndex}::total_cartera_mes`]?.value ?? r.captacionesCnt }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#0ea5a4" />
              </BarChart>
            </ResponsiveContainer>
            <div className="text-sm text-muted-foreground mt-2">Total Cartera Mes</div>
          </div>
        </div>
      </section>
    </div>
  )
}
