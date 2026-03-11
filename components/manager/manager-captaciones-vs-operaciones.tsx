"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/kpi-card";
import { formatCurrency } from "@/lib/export";
import type { Profile } from "@/lib/types";
import {
  Building,
  CheckCircle,
  Clock,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Props {
  captacionesBusquedas: any[];
  vendedores: Profile[];
  year: number;
}

const PAGE_SIZE = 40;

function fmtDate(d: string | null | undefined): string {
  if (!d) return "-";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "-";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function monedaSymbol(m: string | null | undefined): string {
  if (!m) return "-";
  if (m === "USD" || m === "u$d") return "u$d";
  if (m === "ARS" || m === "$") return "$";
  return m;
}

function n(val: any): number {
  const v = Number(val);
  return isNaN(v) ? 0 : v;
}

function pctDif(publicado: number, oferta: number): string {
  if (!publicado || !oferta) return "-";
  const pct = ((oferta - publicado) / publicado) * 100;
  return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
}

export function ManagerCaptacionesVsOperaciones({
  captacionesBusquedas,
  vendedores,
  year,
}: Props) {
  const [page, setPage] = useState(0);

  // Build vendedor name lookup
  const vendedorMap = useMemo(() => {
    const m: Record<string, string> = {};
    vendedores.forEach((v) => {
      m[v.id] = v.full_name || "Sin nombre";
    });
    return m;
  }, [vendedores]);

  // Sort: by fecha_alta descending
  const sorted = useMemo(
    () =>
      [...captacionesBusquedas].sort(
        (a, b) =>
          new Date(b.fecha_alta).getTime() - new Date(a.fecha_alta).getTime(),
      ),
    [captacionesBusquedas],
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageData = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // KPI aggregates
  const totalCerradas = sorted.filter((c) => !!c.fecha_cierre).length;
  const totalReservadas = sorted.filter(
    (c) => !!c.fecha_reserva && !c.fecha_cierre,
  ).length;
  const totalHonorarios = sorted.reduce(
    (s, c) => s + n(c.honorarios_totales),
    0,
  );

  const hClass = "text-[10px] px-2 py-1.5 whitespace-nowrap font-semibold";
  const cClass = "text-xs px-2 py-1.5 whitespace-nowrap tabular-nums";

  return (
    <div className="flex flex-col gap-6 page-enter w-full overflow-x-hidden">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard
          title="Total Captaciones"
          value={String(sorted.length)}
          icon={Building}
        />
        <KpiCard
          title="En Reserva"
          value={String(totalReservadas)}
          icon={Clock}
          variant="info"
        />
        <KpiCard
          title="Cerradas"
          value={String(totalCerradas)}
          icon={CheckCircle}
          variant="success"
        />
        <KpiCard
          title="Honorarios"
          value={totalHonorarios > 0 ? formatCurrency(totalHonorarios) : "-"}
          icon={DollarSign}
          variant="primary"
        />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {sorted.length} registros &mdash; Página {page + 1} de {totalPages}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-t overflow-x-auto">
            <Table className="text-xs">
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead
                    className={`${hClass} sticky left-0 bg-muted/30 z-10`}
                  >
                    Agente
                  </TableHead>
                  <TableHead className={hClass}>ID</TableHead>
                  <TableHead className={hClass}>Fecha Alta</TableHead>
                  <TableHead className={hClass}>Autorización</TableHead>
                  <TableHead className={hClass}>Propiedad</TableHead>
                  <TableHead className={hClass}>Ciudad</TableHead>
                  <TableHead className={hClass}>Vencimiento</TableHead>
                  <TableHead className={hClass}>Adenda</TableHead>
                  <TableHead className={hClass}>Operación</TableHead>
                  <TableHead className={hClass}>Valor Publicado</TableHead>
                  <TableHead className={hClass}>Fecha Baja</TableHead>
                  <TableHead className={hClass}>Moneda</TableHead>
                  <TableHead className={hClass}>Valor Ofertado</TableHead>
                  <TableHead className={hClass}>% Dif. Precio</TableHead>
                  <TableHead className={hClass}>Fecha Reserva</TableHead>
                  <TableHead className={hClass}>Fecha Aceptación</TableHead>
                  <TableHead className={hClass}>Fecha Notificación</TableHead>
                  <TableHead className={hClass}>Fecha Refuerzo</TableHead>
                  <TableHead className={hClass}>Fecha Cierre</TableHead>
                  <TableHead className={hClass}>Honorarios Totales</TableHead>
                  <TableHead className={hClass}>Hon. Agente / Puntos</TableHead>
                  <TableHead className={hClass}>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={22}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Sin captaciones registradas para {year}
                    </TableCell>
                  </TableRow>
                ) : (
                  pageData.map((c) => {
                    const pub = n(c.valor_publicado);
                    const oferta = n(c.oferta);
                    const honTot = n(c.honorarios_totales);
                    const comAgMonto = n(c.comision_agente_monto);
                    const comAgPct = n(c.comision_agente_porcentaje);
                    const honAgente =
                      comAgMonto > 0
                        ? formatCurrency(comAgMonto)
                        : comAgPct > 0
                          ? `${comAgPct}%`
                          : "-";

                    // Propiedad = direccion + barrio
                    const propiedad =
                      [c.direccion, c.barrio].filter(Boolean).join(", ") || "-";

                    // Row highlight: green tint if cierre exists, red tint if baja
                    const rowClass = c.fecha_cierre
                      ? "bg-green-500/5 hover:bg-green-500/10"
                      : c.fecha_baja
                        ? "bg-red-500/5 hover:bg-red-500/10"
                        : "hover:bg-muted/20";

                    return (
                      <TableRow key={c.id} className={rowClass}>
                        <TableCell
                          className={`${cClass} font-medium sticky left-0 bg-background z-10`}
                        >
                          {vendedorMap[c.user_id] || "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.codigo_id || c.id?.slice?.(0, 8) || "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_alta)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.autorizacion || "-"}
                        </TableCell>
                        <TableCell
                          className={`${cClass} max-w-[200px] truncate`}
                          title={propiedad}
                        >
                          {propiedad}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.ciudad || "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.vence)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.adenda || "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.operacion ? (
                            <Badge
                              variant={
                                c.operacion === "Venta"
                                  ? "default"
                                  : c.operacion === "Alquiler"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-[10px] px-1.5 py-0"
                            >
                              {c.operacion}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className={`${cClass} text-right`}>
                          {pub > 0 ? formatCurrency(pub) : "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_baja)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {monedaSymbol(c.moneda)}
                        </TableCell>
                        <TableCell className={`${cClass} text-right`}>
                          {oferta > 0 ? formatCurrency(oferta) : "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {c.pct_dif_precio != null && n(c.pct_dif_precio) !== 0
                            ? `${n(c.pct_dif_precio).toFixed(1)}%`
                            : pub > 0 && oferta > 0
                              ? pctDif(pub, oferta)
                              : "-"}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_reserva)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_aceptacion)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_notificacion)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_refuerzo)}
                        </TableCell>
                        <TableCell className={cClass}>
                          {fmtDate(c.fecha_cierre)}
                        </TableCell>
                        <TableCell
                          className={`${cClass} text-right font-medium`}
                        >
                          {honTot > 0 ? formatCurrency(honTot) : "-"}
                        </TableCell>
                        <TableCell className={`${cClass} text-right`}>
                          {honAgente}
                        </TableCell>
                        <TableCell
                          className={`${cClass} max-w-[180px] truncate`}
                          title={c.observaciones || ""}
                        >
                          {c.observaciones || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Mostrando {page * PAGE_SIZE + 1}-
            {Math.min((page + 1) * PAGE_SIZE, sorted.length)} de {sorted.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <span className="text-sm font-medium">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
