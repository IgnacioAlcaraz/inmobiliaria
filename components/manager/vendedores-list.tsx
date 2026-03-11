'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/export'
import { MEDAL_COLORS } from '@/lib/constants'
import type { Profile, Cierre, Captacion, Trackeo } from '@/lib/types'
import { Handshake, Building, Phone, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface VendedoresListProps {
  vendedores: Profile[]
  cierres: Cierre[]
  captaciones: Captacion[]
  trackeo: Trackeo[]
  year: number
}

export function VendedoresList({
  vendedores,
  cierres,
  captaciones,
  trackeo,
  year,
}: VendedoresListProps) {
  const cierreHon = (c: Cierre) =>
    (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100

  const stats = vendedores.map((v) => {
    const vc = cierres.filter((c) => c.user_id === v.id)
    const vcap = captaciones.filter((c) => c.user_id === v.id)
    const vt = trackeo.filter((t) => t.user_id === v.id)
    const hon = vc.reduce((s, c) => s + cierreHon(c), 0)
    const puntas = vc.reduce((s, c) => s + c.puntas, 0)
    return {
      ...v,
      cierresCount: vc.length,
      honorarios: hon,
      puntas,
      captacionesCount: vcap.length,
      llamadas: vt.reduce((s, t) => s + t.llamadas, 0),
    }
  }).sort((a, b) => b.honorarios - a.honorarios)

  return (
    <div className="flex flex-col gap-6 page-enter">
      <p className="text-sm font-medium text-muted-foreground">
        {vendedores.length} agente{vendedores.length !== 1 ? 's' : ''} asignado{vendedores.length !== 1 ? 's' : ''} — {year}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 stagger-children">
        {stats.map((v, i) => (
          <Link key={v.id} href={`/app/manager/vendedores/${v.id}`} className="group block cursor-pointer">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {i < 3 ? (
                      <span
                        className={cn(
                          'inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold shrink-0',
                          MEDAL_COLORS[i],
                        )}
                      >
                        {i + 1}
                      </span>
                    ) : (
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                        {i + 1}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-foreground leading-tight">
                        {v.full_name || 'Sin nombre'}
                      </p>
                      {i < 3 && (
                        <Badge
                          variant={i === 0 ? 'default' : 'secondary'}
                          className="text-[10px] px-1.5 py-0 mt-1"
                        >
                          #{i + 1} ranking
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150 mt-1 shrink-0" />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-2.5 text-sm mb-4">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Handshake className="h-3.5 w-3.5 shrink-0" />
                    <span className="tabular-nums">{v.cierresCount} cierres</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-3.5 w-3.5 shrink-0" />
                    <span className="tabular-nums">{v.captacionesCount} captaciones</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 shrink-0" />
                    <span className="tabular-nums">{v.llamadas} llamadas</span>
                  </div>
                  <div className="text-muted-foreground tabular-nums">
                    {v.puntas} puntas
                  </div>
                </div>

                {/* Honorarios */}
                <div className="pt-3 border-t border-border">
                  <p className="text-lg font-bold text-foreground tabular-nums">
                    {formatCurrency(v.honorarios)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">honorarios {year}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
