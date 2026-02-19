'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency } from '@/lib/export'
import type { Profile, Cierre, Captacion, Trackeo } from '@/lib/types'
import { User, Handshake, Building, Phone, ArrowRight } from 'lucide-react'
import Link from 'next/link'

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
      visitas: vt.reduce((s, t) => s + t.visitas, 0),
      diasTrackeados: vt.length,
    }
  }).sort((a, b) => b.honorarios - a.honorarios)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Vendedores</h1>
        <p className="text-sm text-muted-foreground">
          {vendedores.length} vendedores asignados - {year}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((v, i) => (
          <Link key={v.id} href={`/app/manager/vendedores/${v.id}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{v.full_name || 'Sin nombre'}</p>
                      {i < 3 && (
                        <Badge variant={i === 0 ? 'default' : 'secondary'} className="text-xs mt-1">
                          #{i + 1} ranking
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Handshake className="h-3.5 w-3.5" />
                    <span>{v.cierresCount} cierres</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building className="h-3.5 w-3.5" />
                    <span>{v.captacionesCount} captaciones</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span>{v.llamadas} llamadas</span>
                  </div>
                  <div className="text-muted-foreground">
                    {v.puntas} puntas
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-lg font-bold text-foreground">{formatCurrency(v.honorarios)}</p>
                  <p className="text-xs text-muted-foreground">honorarios {year}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
