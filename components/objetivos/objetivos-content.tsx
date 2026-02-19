'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/lib/export'
import { parseDateStr } from '@/lib/utils'
import type { Objetivo } from '@/lib/types'
import { toast } from 'sonner'
import { Save } from 'lucide-react'

const MONTHS_DISPLAY = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MESES_KEYS = [
  'peso_enero', 'peso_febrero', 'peso_marzo', 'peso_abril',
  'peso_mayo', 'peso_junio', 'peso_julio', 'peso_agosto',
  'peso_septiembre', 'peso_octubre', 'peso_noviembre', 'peso_diciembre',
] as const

interface SimpleCierre {
  id: string
  fecha: string
  valor_cierre: number
  porcentaje_honorarios: number
  porcentaje_agente: number
  puntas: number
}

interface ObjetivosContentProps {
  objetivos: Objetivo[]
  cierres: SimpleCierre[]
  userId: string
}

/** Parse a string that may use comma as decimal separator */
function parseDecimal(value: string): number {
  const cleaned = value.replace(/\s/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? 0 : n
}

type FormState = {
  ticket_promedio_cartera: string
  comision_agente_porcentaje: string
  objetivo_facturacion_total: string
  gastos_personales_anio: string
  inversion_negocio_anio: string
  ahorro_anio: string
  suenos_anio: string
  [key: string]: string // for peso_* keys
}

function buildDefaults(obj?: Objetivo | null): FormState {
  return {
    ticket_promedio_cartera: String(obj?.ticket_promedio_cartera || 0),
    comision_agente_porcentaje: String(obj?.comision_agente_porcentaje || 0),
    objetivo_facturacion_total: String(obj?.objetivo_facturacion_total || 0),
    gastos_personales_anio: String(obj?.gastos_personales_anio || 0),
    inversion_negocio_anio: String(obj?.inversion_negocio_anio || 0),
    ahorro_anio: String(obj?.ahorro_anio || 0),
    suenos_anio: String(obj?.suenos_anio || 0),
    peso_enero: String(obj?.peso_enero || 0),
    peso_febrero: String(obj?.peso_febrero || 0),
    peso_marzo: String(obj?.peso_marzo || 0),
    peso_abril: String(obj?.peso_abril || 0),
    peso_mayo: String(obj?.peso_mayo || 0),
    peso_junio: String(obj?.peso_junio || 0),
    peso_julio: String(obj?.peso_julio || 0),
    peso_agosto: String(obj?.peso_agosto || 0),
    peso_septiembre: String(obj?.peso_septiembre || 0),
    peso_octubre: String(obj?.peso_octubre || 0),
    peso_noviembre: String(obj?.peso_noviembre || 0),
    peso_diciembre: String(obj?.peso_diciembre || 0),
  }
}

export function ObjetivosContent({
  objetivos,
  cierres,
  userId,
}: ObjetivosContentProps) {
  const router = useRouter()
  const now = new Date()
  const [selectedYear, setSelectedYear] = useState(String(now.getFullYear()))
  const [loading, setLoading] = useState(false)

  const currentObjetivo = useMemo(() => {
    return objetivos.find((o) => o.anio === Number(selectedYear))
  }, [objetivos, selectedYear])

  const [form, setForm] = useState<FormState>(() => buildDefaults(currentObjetivo))

  const handleYearChange = (year: string) => {
    setSelectedYear(year)
    const obj = objetivos.find((o) => o.anio === Number(year))
    setForm(buildDefaults(obj))
  }

  const updateField = useCallback((key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Parsed numeric values
  const facturacion = parseDecimal(form.objetivo_facturacion_total)
  const ticketPromedio = parseDecimal(form.ticket_promedio_cartera)
  const comisionPct = parseDecimal(form.comision_agente_porcentaje)

  // Auto-calculated fields
  const objetivoPuntas = ticketPromedio > 0 ? Math.round((facturacion / 0.03) / ticketPromedio) : 0
  const objetivoComisionesAgente = (facturacion * comisionPct) / 100

  // Monthly weight total
  const pesoValues = MESES_KEYS.map((k) => parseDecimal(form[k] || '0'))
  const totalPeso = pesoValues.reduce((s, v) => s + v, 0)
  const totalPesoDisplay = Math.round(totalPeso * 100) / 100

  // Actual values from cierres for selected year
  const yearCierres = useMemo(() => {
    return cierres.filter((c) => parseDateStr(c.fecha).year === Number(selectedYear))
  }, [cierres, selectedYear])

  const actualPuntas = yearCierres.reduce((s, c) => s + c.puntas, 0)
  const actualFacturacion = yearCierres.reduce(
    (s, c) => s + (c.valor_cierre * c.porcentaje_honorarios) / 100, 0,
  )
  const actualComisiones = yearCierres.reduce(
    (s, c) => s + ((c.valor_cierre * c.porcentaje_honorarios) / 100) * (c.porcentaje_agente / 100), 0,
  )

  // Monthly breakdown
  const monthlyActuals = useMemo(() => {
    const result = Array.from({ length: 12 }, () => ({ puntas: 0, facturacion: 0, comisiones: 0 }))
    for (const c of yearCierres) {
      const m = parseDateStr(c.fecha).month
      const hon = (c.valor_cierre * c.porcentaje_honorarios) / 100
      const com = (hon * c.porcentaje_agente) / 100
      result[m].puntas += c.puntas
      result[m].facturacion += hon
      result[m].comisiones += com
    }
    return result
  }, [yearCierres])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()

    const payload = {
      user_id: userId,
      anio: Number(selectedYear),
      ticket_promedio_cartera: ticketPromedio,
      comision_agente_porcentaje: comisionPct,
      objetivo_puntas: objetivoPuntas,
      objetivo_facturacion_total: facturacion,
      objetivo_comisiones_agente: objetivoComisionesAgente,
      gastos_personales_anio: parseDecimal(form.gastos_personales_anio),
      inversion_negocio_anio: parseDecimal(form.inversion_negocio_anio),
      ahorro_anio: parseDecimal(form.ahorro_anio),
      suenos_anio: parseDecimal(form.suenos_anio),
      ...Object.fromEntries(MESES_KEYS.map((k) => [k, parseDecimal(form[k] || '0')])),
    }

    if (currentObjetivo) {
      const { error } = await supabase
        .from('objetivos')
        .update(payload)
        .eq('id', currentObjetivo.id)
      if (error) {
        toast.error('Error al actualizar: ' + error.message)
      } else {
        toast.success('Objetivos actualizados')
        router.refresh()
      }
    } else {
      const { error } = await supabase.from('objetivos').insert(payload)
      if (error) {
        toast.error('Error al crear: ' + error.message)
      } else {
        toast.success('Objetivos guardados')
        router.refresh()
      }
    }
    setLoading(false)
  }

  const pct = (actual: number, target: number) =>
    target > 0 ? Math.min(Math.round((actual / target) * 100), 100) : 0

  const years = Array.from({ length: 5 }, (_, i) => String(now.getFullYear() - 2 + i))

  // Use saved values for display cards (when objetivo exists)
  const savedPuntas = currentObjetivo?.objetivo_puntas || 0
  const savedFact = currentObjetivo?.objetivo_facturacion_total || 0
  const savedCom = currentObjetivo?.objetivo_comisiones_agente || 0
  const gastos = currentObjetivo?.gastos_personales_anio || 0
  const inversion = currentObjetivo?.inversion_negocio_anio || 0
  const ahorro = currentObjetivo?.ahorro_anio || 0
  const suenos = currentObjetivo?.suenos_anio || 0
  const totalNecesario = gastos + inversion + ahorro + suenos

  return (
    <div className="flex flex-col gap-6">
      {/* Year Selector */}
      <div className="flex items-center gap-2">
        <Select value={selectedYear} onValueChange={handleYearChange}>
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map((y) => (
              <SelectItem key={y} value={y}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {currentObjetivo ? 'Objetivos definidos' : 'Sin objetivos - define tus metas abajo'}
        </span>
      </div>

      {/* Annual Progress */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Puntas</p>
              <span className="text-sm font-bold">{pct(actualPuntas, savedPuntas)}%</span>
            </div>
            <Progress value={pct(actualPuntas, savedPuntas)} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{actualPuntas} / {savedPuntas}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Facturacion Total</p>
              <span className="text-sm font-bold">{pct(actualFacturacion, savedFact)}%</span>
            </div>
            <Progress value={pct(actualFacturacion, savedFact)} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{formatCurrency(actualFacturacion)} / {formatCurrency(savedFact)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-muted-foreground">Comisiones Agente</p>
              <span className="text-sm font-bold">{pct(actualComisiones, savedCom)}%</span>
            </div>
            <Progress value={pct(actualComisiones, savedCom)} className="h-2 mb-2" />
            <p className="text-xs text-muted-foreground">{formatCurrency(actualComisiones)} / {formatCurrency(savedCom)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Breakdown */}
      {currentObjetivo && totalNecesario > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Desglose Financiero Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-5 text-sm">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-muted-foreground text-xs">Gastos Personales</p>
                <p className="font-semibold">{formatCurrency(gastos)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-muted-foreground text-xs">Inversion Negocio</p>
                <p className="font-semibold">{formatCurrency(inversion)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-muted-foreground text-xs">Ahorro</p>
                <p className="font-semibold">{formatCurrency(ahorro)}</p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-muted-foreground text-xs">Suenos</p>
                <p className="font-semibold">{formatCurrency(suenos)}</p>
              </div>
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-primary text-xs font-medium">Total Necesario</p>
                <p className="font-bold text-primary">{formatCurrency(totalNecesario)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Weight Distribution + Progress */}
      {currentObjetivo && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Distribucion Mensual (Pesos y Progreso)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4">Mes</th>
                    <th className="text-right py-2 px-2">Peso %</th>
                    <th className="text-right py-2 px-2">Obj. Puntas</th>
                    <th className="text-right py-2 px-2">Real Puntas</th>
                    <th className="text-right py-2 px-2">Obj. Fact.</th>
                    <th className="text-right py-2 px-2">Real Fact.</th>
                    <th className="text-right py-2 px-2">Obj. Com.</th>
                    <th className="text-right py-2 px-2">Real Com.</th>
                  </tr>
                </thead>
                <tbody>
                  {MONTHS_DISPLAY.map((monthName, i) => {
                    const peso = currentObjetivo[MESES_KEYS[i]] || 0
                    const weightFraction = peso / 100
                    const objPuntasMes = Math.round(savedPuntas * weightFraction)
                    const objFactMes = Math.round(savedFact * weightFraction)
                    const objComMes = Math.round(savedCom * weightFraction)
                    const actual = monthlyActuals[i]
                    return (
                      <tr key={i} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-medium">{monthName}</td>
                        <td className="text-right py-2 px-2">{peso}%</td>
                        <td className="text-right py-2 px-2 text-muted-foreground">{objPuntasMes}</td>
                        <td className={`text-right py-2 px-2 font-medium ${actual.puntas >= objPuntasMes && objPuntasMes > 0 ? 'text-primary' : ''}`}>
                          {actual.puntas}
                        </td>
                        <td className="text-right py-2 px-2 text-muted-foreground">{formatCurrency(objFactMes)}</td>
                        <td className={`text-right py-2 px-2 font-medium ${actual.facturacion >= objFactMes && objFactMes > 0 ? 'text-primary' : ''}`}>
                          {formatCurrency(actual.facturacion)}
                        </td>
                        <td className="text-right py-2 px-2 text-muted-foreground">{formatCurrency(objComMes)}</td>
                        <td className={`text-right py-2 px-2 font-medium ${actual.comisiones >= objComMes && objComMes > 0 ? 'text-primary' : ''}`}>
                          {formatCurrency(actual.comisiones)}
                        </td>
                      </tr>
                    )
                  })}
                  {/* Quarterly subtotals */}
                  {[0, 1, 2, 3].map((q) => {
                    const start = q * 3
                    const qPeso = pesoValues.slice(start, start + 3).reduce((s, v) => s + v, 0)
                    const qWeightFraction = (currentObjetivo[MESES_KEYS[start]] + currentObjetivo[MESES_KEYS[start + 1]] + currentObjetivo[MESES_KEYS[start + 2]]) / 100
                    const qObjPuntas = Math.round(savedPuntas * qWeightFraction)
                    const qObjFact = Math.round(savedFact * qWeightFraction)
                    const qObjCom = Math.round(savedCom * qWeightFraction)
                    const qActual = monthlyActuals.slice(start, start + 3).reduce(
                      (acc, m) => ({ puntas: acc.puntas + m.puntas, facturacion: acc.facturacion + m.facturacion, comisiones: acc.comisiones + m.comisiones }),
                      { puntas: 0, facturacion: 0, comisiones: 0 },
                    )
                    return (
                      <tr key={`q${q}`} className="bg-muted/30 font-semibold border-b">
                        <td className="py-2 pr-4">{'Q' + (q + 1)}</td>
                        <td className="text-right py-2 px-2">{Math.round(qPeso * 100) / 100}%</td>
                        <td className="text-right py-2 px-2">{qObjPuntas}</td>
                        <td className="text-right py-2 px-2">{qActual.puntas}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(qObjFact)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(qActual.facturacion)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(qObjCom)}</td>
                        <td className="text-right py-2 px-2">{formatCurrency(qActual.comisiones)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Objectives Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {currentObjetivo ? 'Editar' : 'Definir'} Objetivos {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Core inputs + auto-calculated preview */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Datos Base</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2">
                  <Label htmlFor="objetivo_facturacion_total">Objetivo Facturacion Total ($)</Label>
                  <Input
                    id="objetivo_facturacion_total"
                    value={form.objetivo_facturacion_total}
                    onChange={(e) => updateField('objetivo_facturacion_total', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ticket_promedio_cartera">Ticket Promedio de Cartera ($)</Label>
                  <Input
                    id="ticket_promedio_cartera"
                    value={form.ticket_promedio_cartera}
                    onChange={(e) => updateField('ticket_promedio_cartera', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="comision_agente_porcentaje">Comision Agente (%)</Label>
                  <Input
                    id="comision_agente_porcentaje"
                    value={form.comision_agente_porcentaje}
                    onChange={(e) => updateField('comision_agente_porcentaje', e.target.value)}
                  />
                </div>
              </div>

              {/* Auto-calculated results */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {'Objetivo Puntas (auto: (Fact. / 0,03) / Ticket Prom.)'}
                  </p>
                  <p className="text-lg font-bold">{objetivoPuntas}</p>
                </div>
                <div className="rounded-lg border bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground mb-1">
                    {'Objetivo Comisiones Agente (auto: Fact. x % Comision)'}
                  </p>
                  <p className="text-lg font-bold">{formatCurrency(objetivoComisionesAgente)}</p>
                </div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Desglose Financiero</h4>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="grid gap-2">
                  <Label htmlFor="gastos_personales_anio">Gastos Personales</Label>
                  <Input
                    id="gastos_personales_anio"
                    value={form.gastos_personales_anio}
                    onChange={(e) => updateField('gastos_personales_anio', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inversion_negocio_anio">Inversion Negocio</Label>
                  <Input
                    id="inversion_negocio_anio"
                    value={form.inversion_negocio_anio}
                    onChange={(e) => updateField('inversion_negocio_anio', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ahorro_anio">Ahorro</Label>
                  <Input
                    id="ahorro_anio"
                    value={form.ahorro_anio}
                    onChange={(e) => updateField('ahorro_anio', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="suenos_anio">Suenos</Label>
                  <Input
                    id="suenos_anio"
                    value={form.suenos_anio}
                    onChange={(e) => updateField('suenos_anio', e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Monthly Weights */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-muted-foreground">Pesos Mensuales (%)</h4>
                <span className={`text-sm font-medium ${totalPesoDisplay === 100 ? 'text-primary' : totalPesoDisplay > 100 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  Total: {totalPesoDisplay}%
                  {totalPesoDisplay !== 100 && totalPesoDisplay > 0 && ' (debe ser 100%)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {MESES_KEYS.map((key, i) => (
                  <div key={key} className="grid gap-1.5">
                    <Label htmlFor={key} className="text-xs">{MONTHS_DISPLAY[i]}</Label>
                    <Input
                      id={key}
                      className="h-9"
                      inputMode="decimal"
                      value={form[key] || ''}
                      onChange={(e) => updateField(key, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Podes usar coma o punto como separador decimal (ej: 8,5 o 8.5)</p>
            </div>

            <div>
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-1" />
                {loading ? 'Guardando...' : 'Guardar Objetivos'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
