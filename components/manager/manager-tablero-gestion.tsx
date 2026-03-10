"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/export";
import type { Profile } from "@/lib/types";
import { Building, Handshake, TrendingUp, DollarSign } from "lucide-react";

interface Props {
  vendedores: Profile[];
  captacionesBusquedas: any[];
  cierres: any[];
  trackeoDiario: any[];
  year: number;
}

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function isExclusiva(autorizacion: string | null | undefined): boolean {
  if (!autorizacion) return false;
  const lower = autorizacion.toLowerCase().trim();
  // "Exclusiva" yes, "No Exclusiva" / "No exclusiva" no
  return lower.includes("exclusiv") && !lower.includes("no ");
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}/${mm}/${yy}`;
}

function n(val: any): number {
  const v = Number(val);
  return isNaN(v) ? 0 : v;
}

export function ManagerTableroGestion({
  vendedores,
  captacionesBusquedas,
  cierres,
  trackeoDiario,
  year,
}: Props) {
  const totalCaptaciones = captacionesBusquedas.length;
  const totalCierres = cierres.length;
  const totalHonorarios = cierres.reduce((s, c) => {
    return (
      s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios || 0)) / 100
    );
  }, 0);
  const totalReservas = trackeoDiario.reduce(
    (s, t) => s + Number(t.reservas_puntas || 0),
    0,
  );

  return (
    <div className="flex flex-col gap-8 page-enter">
      <div>
        <h1 className="text-2xl font-bold">Tablero de Gestión Inmobiliaria</h1>
        <p className="text-sm text-muted-foreground">
          {vendedores.length} agentes &mdash; Año {year}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        <KpiCard
          title="Captaciones"
          value={String(totalCaptaciones)}
          icon={Building}
        />
        <KpiCard
          title="Reservas"
          value={String(totalReservas)}
          icon={Handshake}
          variant="info"
        />
        <KpiCard
          title="Cierres"
          value={String(totalCierres)}
          icon={TrendingUp}
          variant="success"
        />
        <KpiCard
          title="Honorarios Brutos"
          value={formatCurrency(totalHonorarios)}
          icon={DollarSign}
          variant="primary"
        />
      </div>

      {vendedores.map((v) => (
        <Card key={v.id} className="overflow-hidden">
          <AgentTable
            vendedor={v}
            captacionesBusquedas={captacionesBusquedas.filter(
              (c) => c.user_id === v.id,
            )}
            cierres={cierres.filter((c) => c.user_id === v.id)}
            trackeoDiario={trackeoDiario.filter((t) => t.user_id === v.id)}
            year={year}
          />
        </Card>
      ))}
    </div>
  );
}

/* ─── Table per agent ────────────────────────────────────── */

function AgentTable({
  vendedor,
  captacionesBusquedas,
  cierres,
  trackeoDiario,
  year,
}: {
  vendedor: Profile;
  captacionesBusquedas: any[];
  cierres: any[];
  trackeoDiario: any[];
  year: number;
}) {
  // Helper: end-of-month date for comparison
  const endOfMonth = (m: number) => new Date(year, m + 1, 0); // last day of month m

  // ── Build monthly rows ──
  const rows = Array.from({ length: 12 }, (_, monthIdx) => {
    // Captaciones given alta in this specific month+year
    const capsMonth = captacionesBusquedas.filter((c) => {
      const d = new Date(c.fecha_alta);
      return d.getFullYear() === year && d.getMonth() === monthIdx;
    });
    // Captaciones dadas de baja in this specific month+year
    const bajasMonth = captacionesBusquedas.filter((c) => {
      if (!c.fecha_baja) return false;
      const d = new Date(c.fecha_baja);
      return d.getFullYear() === year && d.getMonth() === monthIdx;
    });

    // ── VENTA ──
    const ventaExcl = capsMonth.filter(
      (c) => c.operacion === "Venta" && isExclusiva(c.autorizacion),
    ).length;
    const ventaNoExcl = capsMonth.filter(
      (c) => c.operacion === "Venta" && !isExclusiva(c.autorizacion),
    ).length;
    const ventaBajas = bajasMonth.filter((c) => c.operacion === "Venta").length;
    const totalCaptActivasVenta = ventaExcl + ventaNoExcl - ventaBajas;

    // Ticket promedio venta
    const ventaCaps = capsMonth.filter((c) => c.operacion === "Venta");
    const ticketPromedioVenta =
      ventaCaps.length > 0
        ? ventaCaps.reduce((s, c) => s + n(c.valor_publicado), 0) /
          ventaCaps.length
        : 0;

    // ── ALQUILER ──
    const alqExcl = capsMonth.filter(
      (c) => c.operacion === "Alquiler" && isExclusiva(c.autorizacion),
    ).length;
    const alqNoExcl = capsMonth.filter(
      (c) => c.operacion === "Alquiler" && !isExclusiva(c.autorizacion),
    ).length;
    const alqBajas = bajasMonth.filter(
      (c) => c.operacion === "Alquiler",
    ).length;

    // Total captaciones del mes (all operaciones)
    const totalCaptaciones = capsMonth.length;

    // Total cartera activa: all captaciones with fecha_alta <= end of this month
    // minus those with fecha_baja <= end of this month (including prior years)
    const eom = endOfMonth(monthIdx);
    const capsUpToMonth = captacionesBusquedas.filter(
      (c) => new Date(c.fecha_alta) <= eom,
    );
    const bajasUpToMonth = captacionesBusquedas.filter(
      (c) => c.fecha_baja && new Date(c.fecha_baja) <= eom,
    );
    const totalCarteraActiva = capsUpToMonth.length - bajasUpToMonth.length;

    // ── TRACKEO (reservas, cierres, devoluciones) ──
    const trackMonth = trackeoDiario.filter(
      (t) => new Date(t.fecha).getMonth() === monthIdx,
    );
    const reservasNuevasPuntas = trackMonth.reduce(
      (s, t) => s + n(t.reservas_puntas),
      0,
    );
    const reservasNuevasHonBruto = trackMonth.reduce(
      (s, t) => s + n(t.reservas_valor_oferta),
      0,
    );
    const devuelPuntas = trackMonth.reduce(
      (s, t) => s + n(t.devoluciones_puntas),
      0,
    );
    const devuelHon = trackMonth.reduce(
      (s, t) => s + n(t.devoluciones_honorarios),
      0,
    );
    const cierresPuntas = trackMonth.reduce(
      (s, t) => s + n(t.cierres_operaciones_puntas),
      0,
    );
    const cierresHon = trackMonth.reduce(
      (s, t) => s + n(t.cierres_honorarios),
      0,
    );

    return {
      monthIdx,
      ventaExcl,
      ventaNoExcl,
      ventaBajas,
      totalCaptActivasVenta,
      ticketPromedioVenta,
      alqExcl,
      alqNoExcl,
      alqBajas,
      totalCaptaciones,
      totalCarteraActiva,
      reservasNuevasPuntas,
      reservasNuevasHonBruto,
      devuelPuntas,
      devuelHon,
      cierresPuntas,
      cierresHon,
    };
  });

  // ── ACUMULADO ROW ──
  const acum = rows.reduce(
    (a, r) => ({
      ventaExcl: a.ventaExcl + r.ventaExcl,
      ventaNoExcl: a.ventaNoExcl + r.ventaNoExcl,
      ventaBajas: a.ventaBajas + r.ventaBajas,
      totalCaptActivasVenta: a.totalCaptActivasVenta + r.totalCaptActivasVenta,
      ticketPromedioVentaSum: a.ticketPromedioVentaSum + r.ticketPromedioVenta,
      ticketPromedioVentaCount:
        a.ticketPromedioVentaCount + (r.ticketPromedioVenta > 0 ? 1 : 0),
      alqExcl: a.alqExcl + r.alqExcl,
      alqNoExcl: a.alqNoExcl + r.alqNoExcl,
      alqBajas: a.alqBajas + r.alqBajas,
      totalCaptaciones: a.totalCaptaciones + r.totalCaptaciones,
      reservasNuevasPuntas: a.reservasNuevasPuntas + r.reservasNuevasPuntas,
      reservasNuevasHonBruto:
        a.reservasNuevasHonBruto + r.reservasNuevasHonBruto,
      devuelPuntas: a.devuelPuntas + r.devuelPuntas,
      devuelHon: a.devuelHon + r.devuelHon,
      cierresPuntas: a.cierresPuntas + r.cierresPuntas,
      cierresHon: a.cierresHon + r.cierresHon,
    }),
    {
      ventaExcl: 0,
      ventaNoExcl: 0,
      ventaBajas: 0,
      totalCaptActivasVenta: 0,
      ticketPromedioVentaSum: 0,
      ticketPromedioVentaCount: 0,
      alqExcl: 0,
      alqNoExcl: 0,
      alqBajas: 0,
      totalCaptaciones: 0,
      reservasNuevasPuntas: 0,
      reservasNuevasHonBruto: 0,
      devuelPuntas: 0,
      devuelHon: 0,
      cierresPuntas: 0,
      cierresHon: 0,
    },
  );
  const acumTicketPromedio =
    acum.ticketPromedioVentaCount > 0
      ? acum.ticketPromedioVentaSum / acum.ticketPromedioVentaCount
      : 0;

  // ── Running accumulators for "Reservas Acumuladas" and monthly acumuladas ──
  let runResPuntas = 0;
  let runResHon = 0;
  const runningRows = rows.map((r) => {
    runResPuntas += r.reservasNuevasPuntas - r.devuelPuntas - r.cierresPuntas;
    runResHon += r.reservasNuevasHonBruto - r.devuelHon - r.cierresHon;
    return {
      ...r,
      resAcumPuntas: runResPuntas,
      resAcumHonBruto: runResHon,
      resAcumPuntasMes: r.reservasNuevasPuntas - r.devuelPuntas,
      resAcumHonBrutoMes: r.reservasNuevasHonBruto - r.devuelHon,
    };
  });

  const acumResAcumPuntas = runningRows[11]?.resAcumPuntas ?? 0;
  const acumResAcumHon = runningRows[11]?.resAcumHonBruto ?? 0;
  const acumResAcumPuntasMes = runningRows.reduce(
    (s, r) => s + r.resAcumPuntasMes,
    0,
  );
  const acumResAcumHonMes = runningRows.reduce(
    (s, r) => s + r.resAcumHonBrutoMes,
    0,
  );

  const cellClass = "text-xs px-2 py-1.5 text-right whitespace-nowrap";
  const headerClass =
    "text-[10px] px-2 py-1.5 text-right whitespace-nowrap font-semibold";
  const separatorClass = "border-l-2 border-primary/30";

  return (
    <div className="overflow-hidden">
      {/* Agent header */}
      <div className="bg-muted/40 px-4 py-3 border-b flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-base">
            {vendedor.full_name || "Sin nombre"}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ID: {vendedor.id.slice(0, 8)}
            </span>
          </h3>
          <p className="text-xs text-muted-foreground">
            Ingreso al sistema: {formatDate(vendedor.created_at)}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-[10px] px-2 py-1.5 font-semibold sticky left-0 bg-muted/30 z-10">
                Mes
              </TableHead>
              {/* ── VENTA ── */}
              <TableHead className={headerClass}>Cap. Venta Excl.</TableHead>
              <TableHead className={headerClass}>Cap. Venta No Excl.</TableHead>
              <TableHead className={headerClass}>Cap. Venta Bajas</TableHead>
              <TableHead className={headerClass}>
                Total Cap. Activas Venta
              </TableHead>
              <TableHead className={headerClass}>Ticket Prom. Venta</TableHead>
              {/* ── ALQUILER (separator) ── */}
              <TableHead className={`${headerClass} ${separatorClass}`}>
                Cap. Alq. Excl.
              </TableHead>
              <TableHead className={headerClass}>Cap. Alq. No Excl.</TableHead>
              <TableHead className={headerClass}>Cap. Alq. Bajas</TableHead>
              {/* ── TOTALES ── */}
              <TableHead className={`${headerClass} ${separatorClass}`}>
                Total Cap.
              </TableHead>
              <TableHead className={headerClass}>Cartera Activa</TableHead>
              {/* ── RESERVAS & CIERRES ── */}
              <TableHead className={`${headerClass} ${separatorClass}`}>
                Res. Acum. Puntas
              </TableHead>
              <TableHead className={headerClass}>
                Res. Acum. Hon. Bruto
              </TableHead>
              <TableHead className={headerClass}>Res. Nuevas Puntas</TableHead>
              <TableHead className={headerClass}>
                Res. Nuevas Hon. Bruto
              </TableHead>
              <TableHead className={headerClass}>
                Res. Devueltas Puntas
              </TableHead>
              <TableHead className={headerClass}>Res. Devueltas Hon.</TableHead>
              <TableHead className={headerClass}>Cierres Puntas</TableHead>
              <TableHead className={headerClass}>Cierres Hon. Brutos</TableHead>
              <TableHead className={headerClass}>
                Res. Acum. Puntas Mes
              </TableHead>
              <TableHead className={headerClass}>
                Res. Acum. Hon. Bruto Mes
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runningRows.map((r) => (
              <TableRow key={r.monthIdx} className="hover:bg-muted/20">
                <TableCell className="text-xs px-2 py-1.5 font-medium sticky left-0 bg-background z-10">
                  {MONTH_NAMES[r.monthIdx]}
                </TableCell>
                {/* VENTA */}
                <TableCell className={cellClass}>{r.ventaExcl}</TableCell>
                <TableCell className={cellClass}>{r.ventaNoExcl}</TableCell>
                <TableCell className={cellClass}>{r.ventaBajas}</TableCell>
                <TableCell className={cellClass}>
                  {r.totalCaptActivasVenta}
                </TableCell>
                <TableCell className={cellClass}>
                  {r.ticketPromedioVenta > 0
                    ? formatCurrency(r.ticketPromedioVenta)
                    : "-"}
                </TableCell>
                {/* ALQUILER */}
                <TableCell className={`${cellClass} ${separatorClass}`}>
                  {r.alqExcl}
                </TableCell>
                <TableCell className={cellClass}>{r.alqNoExcl}</TableCell>
                <TableCell className={cellClass}>{r.alqBajas}</TableCell>
                {/* TOTALES */}
                <TableCell
                  className={`${cellClass} ${separatorClass} font-semibold`}
                >
                  {r.totalCaptaciones}
                </TableCell>
                <TableCell className={`${cellClass} font-semibold`}>
                  {r.totalCarteraActiva}
                </TableCell>
                {/* RESERVAS & CIERRES */}
                <TableCell className={`${cellClass} ${separatorClass}`}>
                  {r.resAcumPuntas}
                </TableCell>
                <TableCell className={cellClass}>
                  {formatCurrency(r.resAcumHonBruto)}
                </TableCell>
                <TableCell className={cellClass}>
                  {r.reservasNuevasPuntas}
                </TableCell>
                <TableCell className={cellClass}>
                  {formatCurrency(r.reservasNuevasHonBruto)}
                </TableCell>
                <TableCell className={cellClass}>{r.devuelPuntas}</TableCell>
                <TableCell className={cellClass}>
                  {formatCurrency(r.devuelHon)}
                </TableCell>
                <TableCell className={cellClass}>{r.cierresPuntas}</TableCell>
                <TableCell className={cellClass}>
                  {formatCurrency(r.cierresHon)}
                </TableCell>
                <TableCell className={cellClass}>
                  {r.resAcumPuntasMes}
                </TableCell>
                <TableCell className={cellClass}>
                  {formatCurrency(r.resAcumHonBrutoMes)}
                </TableCell>
              </TableRow>
            ))}
            {/* ── ACUMULADO ── */}
            <TableRow className="bg-muted/40 font-bold border-t-2">
              <TableCell className="text-xs px-2 py-1.5 font-bold sticky left-0 bg-muted/40 z-10">
                Acumulado
              </TableCell>
              <TableCell className={cellClass}>{acum.ventaExcl}</TableCell>
              <TableCell className={cellClass}>{acum.ventaNoExcl}</TableCell>
              <TableCell className={cellClass}>{acum.ventaBajas}</TableCell>
              <TableCell className={cellClass}>
                {acum.totalCaptActivasVenta}
              </TableCell>
              <TableCell className={cellClass}>
                {acumTicketPromedio > 0
                  ? formatCurrency(acumTicketPromedio)
                  : "-"}
              </TableCell>
              <TableCell className={`${cellClass} ${separatorClass}`}>
                {acum.alqExcl}
              </TableCell>
              <TableCell className={cellClass}>{acum.alqNoExcl}</TableCell>
              <TableCell className={cellClass}>{acum.alqBajas}</TableCell>
              <TableCell className={`${cellClass} ${separatorClass}`}>
                {acum.totalCaptaciones}
              </TableCell>
              <TableCell className={cellClass}>
                {runningRows[11]?.totalCarteraActiva ?? 0}
              </TableCell>
              <TableCell className={`${cellClass} ${separatorClass}`}>
                {acumResAcumPuntas}
              </TableCell>
              <TableCell className={cellClass}>
                {formatCurrency(acumResAcumHon)}
              </TableCell>
              <TableCell className={cellClass}>
                {acum.reservasNuevasPuntas}
              </TableCell>
              <TableCell className={cellClass}>
                {formatCurrency(acum.reservasNuevasHonBruto)}
              </TableCell>
              <TableCell className={cellClass}>{acum.devuelPuntas}</TableCell>
              <TableCell className={cellClass}>
                {formatCurrency(acum.devuelHon)}
              </TableCell>
              <TableCell className={cellClass}>{acum.cierresPuntas}</TableCell>
              <TableCell className={cellClass}>
                {formatCurrency(acum.cierresHon)}
              </TableCell>
              <TableCell className={cellClass}>
                {acumResAcumPuntasMes}
              </TableCell>
              <TableCell className={cellClass}>
                {formatCurrency(acumResAcumHonMes)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
