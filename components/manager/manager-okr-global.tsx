"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { KpiCard } from "@/components/kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/export";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";
import { ArrowUpDown, Pencil, Check, X, DollarSign, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface OkrCierre {
  id: string;
  user_id: string;
  fecha: string;
  valor_cierre: number;
  porcentaje_honorarios: number;
  porcentaje_agente: number;
  regalias?: number;
  director_monto?: number;
  martillero_monto?: number;
  created_at: string;
  captacion?: { operacion: string; direccion?: string } | null;
}

interface Props {
  objetivos: any[];
  cierres: OkrCierre[];
  vendedores: Profile[];
  year: number;
  managerId: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
interface ComputedRow {
  id: string;
  agente: string;
  userId: string;
  operacion: string;
  pctHonorarios: number;
  valorCierre: number;
  honorarioBruto: number;
  regalias: number;
  honorarioNeto: number;
  director: number;
  martillero: number;
  pctComisionAgente: number;
  comisionAgente: number;
  ingresoNetoCentro: number;
  resultadoCentroAcumulado: number;
  fecha: string;
  createdAt: string;
}

function computeRows(
  cierres: OkrCierre[],
  vendedoresMap: Map<string, string>,
): ComputedRow[] {
  let acumulado = 0;
  return cierres.map((c) => {
    const pctHon = Number(c.porcentaje_honorarios) || 0;
    const valorCierre = Number(c.valor_cierre) || 0;
    const honorarioBruto = (valorCierre * pctHon) / 100;
    const regalias = Number(c.regalias) || 0;
    const honorarioNeto = honorarioBruto - regalias;
    const director = Number(c.director_monto) || 0;
    const martillero = Number(c.martillero_monto) || 0;
    const pctComision = Number(c.porcentaje_agente) || 0;
    const comisionAgente = (honorarioNeto * pctComision) / 100;
    const ingresoNetoCentro =
      honorarioNeto - comisionAgente - director - martillero;
    acumulado += ingresoNetoCentro;

    return {
      id: c.id,
      agente: vendedoresMap.get(c.user_id) || "Sin nombre",
      userId: c.user_id,
      operacion: c.captacion?.operacion || "-",
      pctHonorarios: pctHon,
      valorCierre,
      honorarioBruto,
      regalias,
      honorarioNeto,
      director,
      martillero,
      pctComisionAgente: pctComision,
      comisionAgente,
      ingresoNetoCentro,
      resultadoCentroAcumulado: acumulado,
      fecha: c.fecha,
      createdAt: c.created_at,
    };
  });
}

interface Totals {
  valorCierre: number;
  honorarioBruto: number;
  regalias: number;
  honorarioNeto: number;
  director: number;
  martillero: number;
  comisionAgente: number;
  ingresoNetoCentro: number;
  resultadoCentroAcumulado: number;
}

function computeTotals(rows: ComputedRow[]): Totals {
  const t: Totals = {
    valorCierre: 0,
    honorarioBruto: 0,
    regalias: 0,
    honorarioNeto: 0,
    director: 0,
    martillero: 0,
    comisionAgente: 0,
    ingresoNetoCentro: 0,
    resultadoCentroAcumulado: 0,
  };
  for (const r of rows) {
    t.valorCierre += r.valorCierre;
    t.honorarioBruto += r.honorarioBruto;
    t.regalias += r.regalias;
    t.honorarioNeto += r.honorarioNeto;
    t.director += r.director;
    t.martillero += r.martillero;
    t.comisionAgente += r.comisionAgente;
    t.ingresoNetoCentro += r.ingresoNetoCentro;
  }
  t.resultadoCentroAcumulado =
    rows.length > 0 ? rows[rows.length - 1].resultadoCentroAcumulado : 0;
  return t;
}

const QUARTER_MONTHS: number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [9, 10, 11],
];

const OPERACION_OPTIONS = ["Venta", "Alquiler", "Temporario"] as const;

/* ------------------------------------------------------------------ */
/*  Sub-component: OKR Table (used by each quarter & annual)           */
/* ------------------------------------------------------------------ */
function OkrTable({ rows, totals }: { rows: ComputedRow[]; totals: Totals }) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        Sin operaciones en este período.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Agente</TableHead>
            <TableHead className="whitespace-nowrap">Operación</TableHead>
            <TableHead className="whitespace-nowrap text-right">
              % Honorarios
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Valor Cierre
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Honorario Bruto
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Regalías
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Honorario Neto
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Director
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Martillero
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              % Com. Agente
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Comisión Agente
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Ingreso Neto Centro
            </TableHead>
            <TableHead className="whitespace-nowrap text-right">
              Resultado Centro Acum.
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {/* Totals row */}
          <TableRow className="bg-primary/5 font-semibold border-b-2">
            <TableCell className="font-bold">TOTAL</TableCell>
            <TableCell>—</TableCell>
            <TableCell className="text-right">—</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.valorCierre)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.honorarioBruto)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.regalias)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.honorarioNeto)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.director)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.martillero)}</TableCell>
            <TableCell className="text-right">—</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.comisionAgente)}</TableCell>
            <TableCell className="text-right tabular-nums text-primary">{formatCurrency(totals.ingresoNetoCentro)}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(totals.resultadoCentroAcumulado)}</TableCell>
          </TableRow>

          {/* Data rows */}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="whitespace-nowrap font-medium">{r.agente}</TableCell>
              <TableCell>{r.operacion}</TableCell>
              <TableCell className="text-right tabular-nums">{r.pctHonorarios}%</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.valorCierre)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.honorarioBruto)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.regalias)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.honorarioNeto)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.director)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.martillero)}</TableCell>
              <TableCell className="text-right tabular-nums">{r.pctComisionAgente}%</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.comisionAgente)}</TableCell>
              <TableCell className="text-right tabular-nums font-medium">{formatCurrency(r.ingresoNetoCentro)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatCurrency(r.resultadoCentroAcumulado)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export function ManagerOkrGlobal({
  objetivos,
  cierres,
  vendedores,
  year,
  managerId,
}: Props) {
  const supabase = createClient();

  /* Vendedores map for fast lookup */
  const vendedoresMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of vendedores) m.set(v.id, v.full_name || "Sin nombre");
    return m;
  }, [vendedores]);

  /* ----- Meta del Centro (editable) ----- */
  const managerObjetivo = useMemo(
    () => objetivos.find((o: any) => o.user_id === managerId) ?? null,
    [objetivos, managerId],
  );
  const [editingMeta, setEditingMeta] = useState(false);
  const [metaInput, setMetaInput] = useState(
    String(
      managerObjetivo?.objetivo_comisiones_brutas ??
        managerObjetivo?.objetivo_facturacion_total ??
        "",
    ),
  );
  const [savingMeta, setSavingMeta] = useState(false);

  async function handleSaveMeta() {
    const value = parseFloat(metaInput.replace(",", "."));
    if (!isFinite(value) || value < 0 || value > 1_000_000_000) {
      toast.error("Ingresá un monto válido (entre 0 y 1.000.000.000)");
      return;
    }
    setSavingMeta(true);
    const { error } = await supabase.from("objetivos_anuales").upsert(
      {
        user_id: managerId,
        year,
        objetivo_comisiones_brutas: value,
        objetivo_facturacion_total: value,
      },
      { onConflict: "user_id,year" },
    );
    setSavingMeta(false);
    if (error) {
      toast.error("Error al guardar: " + error.message);
    } else {
      toast.success("Meta del centro guardada");
      setEditingMeta(false);
    }
  }

  /* ----- KPI calculations (kept from original) ----- */
  const totalObjective = useMemo(
    () =>
      objetivos.reduce((s: number, o: any) => {
        const val = Number(
          o.objetivo_comisiones_brutas ?? o.objetivo_facturacion_total ?? 0,
        );
        return s + (isNaN(val) ? 0 : val);
      }, 0),
    [objetivos],
  );

  const teamHonorarios = useMemo(
    () =>
      cierres.reduce(
        (s, c) =>
          s + (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100,
        0,
      ),
    [cierres],
  );

  const teamComisiones = useMemo(
    () =>
      cierres.reduce((s, c) => {
        const hon =
          (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100;
        return s + (hon * Number(c.porcentaje_agente)) / 100;
      }, 0),
    [cierres],
  );

  const ingresosNetos = teamHonorarios - teamComisiones;
  const progressPct =
    totalObjective > 0
      ? Math.round((teamHonorarios / totalObjective) * 100)
      : 0;

  /* ----- Quarterly data ----- */
  const quarterData = useMemo(
    () =>
      QUARTER_MONTHS.map((months, qi) => {
        const qCierres = cierres
          .filter((c) => months.includes(new Date(c.fecha).getMonth()))
          .sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime(),
          );
        const rows = computeRows(qCierres, vendedoresMap);
        const totals = computeTotals(rows);
        return { label: `Q${qi + 1}`, rows, totals };
      }),
    [cierres, vendedoresMap],
  );

  /* ----- Annual data (with filters & sorting) ----- */
  const [sortAsc, setSortAsc] = useState(true);
  const [filterAgente, setFilterAgente] = useState("all");
  const [filterOperacion, setFilterOperacion] = useState("all");

  const annualRows = useMemo(() => {
    let filtered = [...cierres];
    if (filterAgente !== "all")
      filtered = filtered.filter((c) => c.user_id === filterAgente);
    if (filterOperacion !== "all")
      filtered = filtered.filter(
        (c) => c.captacion?.operacion === filterOperacion,
      );

    filtered.sort((a, b) => {
      const diff =
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortAsc ? diff : -diff;
    });

    return computeRows(filtered, vendedoresMap);
  }, [cierres, vendedoresMap, sortAsc, filterAgente, filterOperacion]);

  const annualTotals = useMemo(() => computeTotals(annualRows), [annualRows]);

  /* Unique operacion values from actual data */
  const uniqueOperaciones = useMemo(() => {
    const ops = new Set<string>();
    for (const c of cierres) {
      if (c.captacion?.operacion) ops.add(c.captacion.operacion);
    }
    return Array.from(ops).sort();
  }, [cierres]);

  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
        {/* Objetivo — editable */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Meta del Centro {year}
              </CardTitle>
              {!editingMeta && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 cursor-pointer"
                  onClick={() => {
                    setMetaInput(
                      String(
                        managerObjetivo?.objetivo_comisiones_brutas ??
                          managerObjetivo?.objetivo_facturacion_total ??
                          "",
                      ),
                    );
                    setEditingMeta(true);
                  }}
                  aria-label="Editar meta"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {editingMeta ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  value={metaInput}
                  onChange={(e) => setMetaInput(e.target.value)}
                  className="h-8 text-sm"
                  placeholder="Ej: 500000"
                />
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" disabled={savingMeta} onClick={handleSaveMeta}>
                  <Check className="h-4 w-4 text-green-600" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setEditingMeta(false)}>
                  <X className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ) : (
              <p className="text-2xl font-bold tabular-nums">
                {totalObjective > 0 ? (
                  formatCurrency(totalObjective)
                ) : (
                  <span className="text-muted-foreground text-base font-normal">Sin meta — click lápiz</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <KpiCard
          title="Honorarios Brutos"
          value={formatCurrency(teamHonorarios)}
          subtitle={`Progreso: ${progressPct}%`}
          icon={DollarSign}
          variant="success"
        />
        <KpiCard
          title="Ingresos Netos"
          value={formatCurrency(ingresosNetos)}
          icon={TrendingUp}
          variant="primary"
        />
      </div>

      {/* ── Progress bar ── */}
      {totalObjective > 0 && (
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium">Progreso hacia meta anual</p>
              <span className="text-sm font-bold tabular-nums">{progressPct}%</span>
            </div>
            <Progress value={Math.min(progressPct, 100)} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-2">
              {formatCurrency(teamHonorarios)} de {formatCurrency(totalObjective)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Accordion sections */}
      <Accordion type="multiple" className="w-full">
        {/* Q1 - Q4 */}
        {quarterData.map((q, qi) => (
          <AccordionItem key={qi} value={`q${qi + 1}`}>
            <AccordionTrigger className="text-base font-semibold">
              OKR Global {q.label}
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({q.rows.length} operaciones)
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <OkrTable rows={q.rows} totals={q.totals} />
            </AccordionContent>
          </AccordionItem>
        ))}

        {/* Annual */}
        <AccordionItem value="anual">
          <AccordionTrigger className="text-base font-semibold">
            OKR Año {year}
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({annualRows.length} operaciones)
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {/* Filters */}
            <div className="flex items-center gap-4 flex-wrap mb-4">
              <Select value={filterAgente} onValueChange={setFilterAgente}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los agentes</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.full_name || "Sin nombre"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filterOperacion}
                onValueChange={setFilterOperacion}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Operación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las operaciones</SelectItem>
                  {(uniqueOperaciones.length > 0
                    ? uniqueOperaciones
                    : (OPERACION_OPTIONS as unknown as string[])
                  ).map((op) => (
                    <SelectItem key={op} value={op}>
                      {op}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortAsc((prev) => !prev)}
                className="gap-1"
              >
                <ArrowUpDown className="h-4 w-4" />
                {sortAsc ? "Más antigua primero" : "Más nueva primero"}
              </Button>
            </div>

            <OkrTable rows={annualRows} totals={annualTotals} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
