"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/export'
import type { Profile } from '@/lib/types'

interface Props {
  vendedores: Profile[]
  captacionesBusquedas: any[]
  cierres: any[]
  trackeoDiario: any[]
}

export function ManagerTableroGestion({ vendedores, captacionesBusquedas, cierres, trackeoDiario }: Props) {
  return (
    <div>
      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agente</TableHead>
              <TableHead>Captaciones</TableHead>
              <TableHead>Cierres</TableHead>
              <TableHead>Honorarios</TableHead>
              <TableHead className="text-right">Reservas</TableHead>
              <TableHead className="text-right">Visitas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendedores.map((v) => {
              const vCaps = captacionesBusquedas.filter((c) => c.user_id === v.id)
              const vCierres = cierres.filter((c) => c.user_id === v.id)
              const vTrack = trackeoDiario.filter((t) => t.user_id === v.id)
              const honorarios = vCierres.reduce((s, c) => s + Number(c.honorarios_totales || 0), 0)
              const reservas = vTrack.reduce((s, t) => s + Number(t.reservas_puntas || 0), 0)
              const visitas = vTrack.reduce((s, t) => s + Number(t.visitas || 0), 0)
              return (
                <TableRow key={v.id}>
                  <TableCell>{v.full_name}</TableCell>
                  <TableCell>{vCaps.length}</TableCell>
                  <TableCell>{vCierres.length}</TableCell>
                  <TableCell>{formatCurrency(honorarios)}</TableCell>
                  <TableCell className="text-right">{reservas}</TableCell>
                  <TableCell className="text-right">{visitas}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
