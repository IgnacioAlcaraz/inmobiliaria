'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency } from '@/lib/export'
import type { Profile, Cierre, Captacion, ManagerVendedor } from '@/lib/types'
import { Users, Handshake, Building, DollarSign, UserPlus, X } from 'lucide-react'
import { KpiCard } from '@/components/kpi-card'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface AdminContentProps {
  profiles: Profile[]
  cierres: Cierre[]
  captaciones: Captacion[]
  assignments: ManagerVendedor[]
}

export function AdminContent({ profiles, cierres, captaciones, assignments: initialAssignments }: AdminContentProps) {
  const [assignments, setAssignments] = useState<ManagerVendedor[]>(initialAssignments)
  const [selectedManager, setSelectedManager] = useState<string>('')
  const [selectedVendedor, setSelectedVendedor] = useState<string>('')
  const [changingRole, setChangingRole] = useState<Record<string, boolean>>({})

  const totalVendedores = profiles.filter((p) => p.role === 'vendedor').length
  const totalEncargados = profiles.filter((p) => p.role === 'encargado').length
  const totalCierres = cierres.length
  const totalCaptaciones = captaciones.length
  const totalHonorarios = cierres.reduce(
    (s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100,
    0,
  )

  const encargados = profiles.filter((p) => p.role === 'encargado')
  const vendedores = profiles.filter((p) => p.role === 'vendedor')

  // Change user role
  const handleRoleChange = async (userId: string, newRole: string) => {
    const currentProfile = profiles.find((p) => p.id === userId)
    if (currentProfile?.role === newRole) return

    setChangingRole((prev) => ({ ...prev, [userId]: true }))
    const supabase = createClient()

    // If changing from encargado to vendedor, remove their manager assignments first
    if (currentProfile?.role === 'encargado' && newRole === 'vendedor') {
      await supabase
        .from('manager_vendedores')
        .delete()
        .eq('manager_id', userId)
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) {
      toast.error('Error al cambiar rol: ' + error.message)
    } else {
      toast.success('Rol actualizado')
      window.location.reload()
    }
    setChangingRole((prev) => ({ ...prev, [userId]: false }))
  }

  // Add assignment
  const handleAddAssignment = async () => {
    if (!selectedManager || !selectedVendedor) return
    if (assignments.some((a) => a.manager_id === selectedManager && a.vendedor_id === selectedVendedor)) {
      toast.error('Asignacion ya existe')
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase
      .from('manager_vendedores')
      .insert({ manager_id: selectedManager, vendedor_id: selectedVendedor })
      .select()
      .single()

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      setAssignments((prev) => [...prev, data as ManagerVendedor])
      setSelectedVendedor('')
      toast.success('Vendedor asignado')
    }
  }

  // Remove assignment
  const handleRemoveAssignment = async (assignmentId: string) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('manager_vendedores')
      .delete()
      .eq('id', assignmentId)

    if (error) {
      toast.error('Error: ' + error.message)
    } else {
      setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
      toast.success('Asignacion eliminada')
    }
  }

  // Vendedor stats for ranking
  const vendedorStats = profiles
    .filter((p) => p.role === 'vendedor' || p.role === 'encargado')
    .map((p) => {
      const userCierres = cierres.filter((c) => c.user_id === p.id)
      const userCaptaciones = captaciones.filter((c) => c.user_id === p.id)
      const volumen = userCierres.reduce((s, c) => s + Number(c.valor_cierre), 0)
      const honorarios = userCierres.reduce(
        (s, c) => s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100,
        0,
      )
      const puntas = userCierres.reduce((s, c) => s + c.puntas, 0)
      return {
        id: p.id,
        name: p.full_name || 'Sin nombre',
        role: p.role,
        cierres: userCierres.length,
        volumen,
        honorarios,
        puntas,
        captaciones_total: userCaptaciones.length,
      }
    })
    .sort((a, b) => b.honorarios - a.honorarios)

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard title="Vendedores" value={String(totalVendedores)} icon={Users} />
        <KpiCard title="Encargados" value={String(totalEncargados)} icon={UserPlus} />
        <KpiCard title="Total Cierres" value={String(totalCierres)} icon={Handshake} />
        <KpiCard title="Total Captaciones" value={String(totalCaptaciones)} icon={Building} />
        <KpiCard title="Total Honorarios" value={formatCurrency(totalHonorarios)} icon={DollarSign} />
      </div>

      {/* Manager-Vendedor Assignments */}
      {encargados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Asignaciones Encargado - Vendedores</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {/* Add assignment form */}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Encargado</label>
                <Select value={selectedManager} onValueChange={setSelectedManager}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {encargados.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.full_name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Vendedor</label>
                <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {vendedores.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.full_name || 'Sin nombre'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAssignment} disabled={!selectedManager || !selectedVendedor}>
                <UserPlus className="h-4 w-4 mr-1" />
                Asignar
              </Button>
            </div>

            {/* Current assignments by encargado */}
            {encargados.map((enc) => {
              const encAssignments = assignments.filter((a) => a.manager_id === enc.id)
              return (
                <div key={enc.id} className="border border-border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-2">
                    {enc.full_name || 'Sin nombre'}
                    <span className="text-muted-foreground text-sm font-normal ml-2">
                      ({encAssignments.length} vendedores)
                    </span>
                  </h4>
                  {encAssignments.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {encAssignments.map((a) => {
                        const vendedor = profiles.find((p) => p.id === a.vendedor_id)
                        return (
                          <Badge key={a.id} variant="outline" className="flex items-center gap-1.5 py-1.5 px-3">
                            {vendedor?.full_name || 'Sin nombre'}
                            <button
                              onClick={() => handleRemoveAssignment(a.id)}
                              className="hover:text-destructive transition-colors"
                              aria-label="Remover asignacion"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin vendedores asignados</p>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Ranking Table */}
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
                <TableHead>Rol</TableHead>
                <TableHead className="text-right">Cierres</TableHead>
                <TableHead className="text-right">Puntas</TableHead>
                <TableHead className="text-right">Volumen</TableHead>
                <TableHead className="text-right">Honorarios</TableHead>
                <TableHead className="text-right">Captaciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendedorStats.length > 0 ? (
                vendedorStats.map((v, i) => (
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
                    <TableCell className="font-medium">{v.name}</TableCell>
                    <TableCell>
                      <Badge variant={v.role === 'encargado' ? 'default' : 'secondary'} className="capitalize text-xs">
                        {v.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{v.cierres}</TableCell>
                    <TableCell className="text-right">{v.puntas}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.volumen)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(v.honorarios)}</TableCell>
                    <TableCell className="text-right">{v.captaciones_total}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                    Sin vendedores registrados
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
