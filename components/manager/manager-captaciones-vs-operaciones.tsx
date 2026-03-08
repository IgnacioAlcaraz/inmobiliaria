"use client"

import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency } from '@/lib/export'

interface Props {
  captacionesBusquedas: any[]
}

export function ManagerCaptacionesVsOperaciones({ captacionesBusquedas }: Props) {
  return (
    <div>
      <div className="mt-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Fecha Alta</TableHead>
              <TableHead>Direccion</TableHead>
              <TableHead>Operacion</TableHead>
              <TableHead>Valor Publicado</TableHead>
              <TableHead>Fecha Cierre</TableHead>
              <TableHead>Honorarios</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {captacionesBusquedas.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.id?.slice?.(0, 8) || '-'}</TableCell>
                <TableCell>{c.fecha_alta ? new Date(c.fecha_alta).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{c.direccion || '-'}</TableCell>
                <TableCell>{c.operacion || '-'}</TableCell>
                <TableCell>{formatCurrency(Number(c.valor_publicado || 0))}</TableCell>
                <TableCell>{c.fecha_cierre ? new Date(c.fecha_cierre).toLocaleDateString() : '-'}</TableCell>
                <TableCell>{formatCurrency(Number(c.honorarios_totales || 0))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
