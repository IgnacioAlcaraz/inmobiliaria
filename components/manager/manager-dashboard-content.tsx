"use client";

import { useState, useMemo } from "react";
import { KpiCard } from "@/components/kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/export";
import { parseDateStr } from "@/lib/utils";
import { MONTH_NAMES, MEDAL_COLORS } from "@/lib/constants";
import type { Profile, Cierre, Captacion, Trackeo } from "@/lib/types";
import Link from "next/link";
import {
  Users,
  Handshake,
  DollarSign,
  TrendingUp,
  Building,
  Phone,
  Eye,
  LayoutGrid,
  Target,
  ArrowRight,
  Medal,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface ManagerDashboardContentProps {
  vendedores: Profile[];
  cierres: (Cierre & {
    captacion?: {
      id: string;
      direccion: string;
      operacion: string;
      moneda: string;
    } | null;
  })[];
  captaciones: Captacion[];
  trackeo: Trackeo[];
  year: number;
  trackeoDiario?: any[];
  captacionesBusquedas?: any[];
  objetivos?: any[];
}

function cierreHon(c: Cierre) {
  return (Number(c.valor_cierre) * Number(c.porcentaje_honorarios)) / 100;
}

function cierreCom(c: Cierre) {
  return (cierreHon(c) * Number(c.porcentaje_agente)) / 100;
}

const NAV_LINKS = [
  {
    href: "/app/manager/trackeo",
    icon: TrendingUp,
    title: "Trackeo Global",
    desc: "Reservas, cierres y capital humano",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    href: "/app/manager/tablero",
    icon: LayoutGrid,
    title: "Tablero de Gestión",
    desc: "Resumen detallado por agente",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    href: "/app/manager/captaciones",
    icon: Building,
    title: "Trackeo Cartera",
    desc: "Captaciones y operaciones cerradas",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    href: "/app/manager/okr",
    icon: Target,
    title: "OKR Global",
    desc: "Objetivos y cumplimiento trimestral",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export function ManagerDashboardContent({
  vendedores,
  cierres,
  captaciones,
  trackeo,
  year,
  trackeoDiario = [],
  captacionesBusquedas = [],
  objetivos = [],
}: ManagerDashboardContentProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedVendedor, setSelectedVendedor] = useState<string>("all");

  // Filter by vendedor
  const vCierres = useMemo(
    () => selectedVendedor === "all" ? cierres : cierres.filter((c) => c.user_id === selectedVendedor),
    [cierres, selectedVendedor],
  );
  const vCaptaciones = useMemo(
    () => selectedVendedor === "all" ? captaciones : captaciones.filter((c) => c.user_id === selectedVendedor),
    [captaciones, selectedVendedor],
  );
  const vTrackeo = useMemo(
    () => selectedVendedor === "all" ? trackeo : trackeo.filter((t) => t.user_id === selectedVendedor),
    [trackeo, selectedVendedor],
  );

  // Filter by month
  const filteredCierres = useMemo(
    () => selectedMonth === "all" ? vCierres : vCierres.filter((c) => parseDateStr(c.fecha).month === Number(selectedMonth)),
    [vCierres, selectedMonth],
  );
  const filteredTrackeo = useMemo(
    () => selectedMonth === "all" ? vTrackeo : vTrackeo.filter((t) => parseDateStr(t.fecha).month === Number(selectedMonth)),
    [vTrackeo, selectedMonth],
  );

  // KPIs
  const { totalHonorarios, totalComisiones, totalPuntas } = useMemo(() => ({
    totalHonorarios: filteredCierres.reduce((s, c) => s + cierreHon(c), 0),
    totalComisiones: filteredCierres.reduce((s, c) => s + cierreCom(c), 0),
    totalPuntas: filteredCierres.reduce((s, c) => s + c.puntas, 0),
  }), [filteredCierres]);
  const totalLlamadas = useMemo(() => filteredTrackeo.reduce((s, t) => s + t.llamadas, 0), [filteredTrackeo]);
  const totalVisitas = useMemo(() => filteredTrackeo.reduce((s, t) => s + t.visitas, 0), [filteredTrackeo]);

  // Agent ranking
  const vendedorStats = useMemo(
    () => vendedores
      .map((v) => {
        const vc = filteredCierres.filter((c) => c.user_id === v.id);
        const vcap = vCaptaciones.filter((c) => c.user_id === v.id);
        const vt = filteredTrackeo.filter((t) => t.user_id === v.id);
        const vcapBus = captacionesBusquedas.filter((c) => c.user_id === v.id);
        const vTrackD = trackeoDiario.filter((t) => t.user_id === v.id);
        const hon = vc.reduce((s, c) => s + cierreHon(c), 0);
        const com = vc.reduce((s, c) => s + cierreCom(c), 0);
        const puntas = vc.reduce((s, c) => s + c.puntas, 0);
        const reservas = vTrackD.reduce((s, t) => s + Number(t.reservas_puntas || 0), 0);
        return {
          id: v.id,
          name: v.full_name || "Sin nombre",
          cierres: vc.length,
          honorarios: hon,
          comisiones: com,
          puntas,
          captaciones: vcap.length + vcapBus.length,
          llamadas: vt.reduce((s, t) => s + t.llamadas, 0),
          visitas: vt.reduce((s, t) => s + t.visitas, 0) + vTrackD.reduce((s, t) => s + Number(t.visitas || 0), 0),
          reservas,
        };
      })
      .sort((a, b) => b.honorarios - a.honorarios),
    [vendedores, filteredCierres, vCaptaciones, filteredTrackeo, captacionesBusquedas, trackeoDiario],
  );

  // Chart data
  const honByMonth = useMemo(() => Array.from({ length: 12 }, (_, i) => {
    const mCierres = vCierres.filter((c) => parseDateStr(c.fecha).month === i);
    return {
      mes: MONTH_NAMES[i].substring(0, 3),
      honorarios: mCierres.reduce((s, c) => s + cierreHon(c), 0),
      comisiones: mCierres.reduce((s, c) => s + cierreCom(c), 0),
    };
  }), [vCierres]);

  // OKR
  const { totalObjective, teamHonorarios, teamComisiones } = useMemo(() => {
    const obj = objetivos.reduce((s: number, o: any) => {
      const val = Number(o.objetivo_comisiones_brutas ?? o.objetivo_facturacion_total ?? 0);
      return s + (isNaN(val) ? 0 : val);
    }, 0);
    const hon = cierres.reduce((s, c) => s + cierreHon(c), 0);
    const com = cierres.reduce((s, c) => s + cierreCom(c), 0);
    return { totalObjective: obj, teamHonorarios: hon, teamComisiones: com };
  }, [objetivos, cierres]);
  const ingresosNetos = teamHonorarios - teamComisiones;
  const okrProgress = totalObjective > 0
    ? Math.min(Math.round((teamHonorarios / totalObjective) * 100), 100)
    : 0;

  const periodLabel =
    selectedMonth === "all"
      ? `Año ${year}`
      : `${MONTH_NAMES[Number(selectedMonth)]} ${year}`;

  const vendedorLabel =
    selectedVendedor === "all"
      ? "Equipo completo"
      : vendedores.find((v) => v.id === selectedVendedor)?.full_name || "";


  return (
    <div className="flex flex-col gap-6 page-enter">

      {/* ── 1. FILTROS ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm font-medium text-foreground">
            {vendedores.length} agente{vendedores.length !== 1 ? "s" : ""} · {vendedorLabel} · {periodLabel}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedVendedor} onValueChange={setSelectedVendedor}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Vendedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Equipo completo</SelectItem>
              {vendedores.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.full_name || "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Mes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo el año {year}</SelectItem>
              {MONTH_NAMES.map((name, i) => (
                <SelectItem key={i} value={String(i)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 2. KPIs PRINCIPALES ── */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 stagger-children">
        <KpiCard
          title="Vendedores"
          value={String(vendedores.length)}
          icon={Users}
        />
        <KpiCard
          title="Cierres"
          value={String(filteredCierres.length)}
          subtitle={`${totalPuntas} puntas`}
          icon={Handshake}
          variant="primary"
        />
        <KpiCard
          title="Honorarios"
          value={formatCurrency(totalHonorarios)}
          subtitle="facturación equipo"
          icon={DollarSign}
          variant="success"
        />
        <KpiCard
          title="Comisiones"
          value={formatCurrency(totalComisiones)}
          subtitle="ingreso agentes"
          icon={TrendingUp}
          variant="accent"
        />
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 stagger-children">
        <KpiCard
          title="Captaciones"
          value={String(vCaptaciones.length)}
          subtitle="en cartera"
          icon={Building}
        />
        <KpiCard
          title="Llamadas"
          value={formatNumber(totalLlamadas)}
          subtitle={`${filteredTrackeo.length} días trackeados`}
          icon={Phone}
        />
        <KpiCard
          title="Visitas"
          value={formatNumber(totalVisitas)}
          subtitle="realizadas"
          icon={Eye}
        />
      </div>

      {/* ── 3. GRÁFICO + OKR ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base" id="hon-chart">
              Honorarios y Comisiones por Mes — {year}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vCierres.length > 0 ? (
              <div role="region" aria-labelledby="hon-chart" className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={honByMonth} accessibilityLayer>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                    <XAxis
                      dataKey="mes"
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "hsl(var(--muted)/0.2)" }}
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "var(--radius)",
                      }}
                    />
                    <Bar dataKey="honorarios" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Honorarios" />
                    <Bar dataKey="comisiones" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Comisiones" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                Sin cierres registrados este año
              </div>
            )}
          </CardContent>
        </Card>

        {/* OKR Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">OKR Equipo — {year}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-medium text-muted-foreground">Progreso hacia objetivo</p>
                <span className="text-sm font-bold text-foreground">{okrProgress}%</span>
              </div>
              <Progress value={okrProgress} className="h-2.5" />
              <p className="text-xs text-muted-foreground mt-1.5">
                {formatCurrency(teamHonorarios)} de {totalObjective > 0 ? formatCurrency(totalObjective) : "sin meta"}
              </p>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Hon. Brutos</p>
                <p className="text-sm font-semibold text-primary">{formatCurrency(teamHonorarios)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-xs text-muted-foreground">Com. Agentes</p>
                <p className="text-sm font-semibold">{formatCurrency(teamComisiones)}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-primary/8 px-3 py-2 border border-primary/20">
                <p className="text-xs font-medium text-primary">Ingresos Netos</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(ingresosNetos)}</p>
              </div>
            </div>

            <Link
              href="/app/manager/okr"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:underline mt-auto"
            >
              Ver desglose completo
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* ── 4. RANKING DE AGENTES ── */}
      {selectedVendedor === "all" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ranking de Agentes — {periodLabel}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-10 pl-4">#</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead className="text-right">Cierres</TableHead>
                    <TableHead className="text-right">Puntas</TableHead>
                    <TableHead className="text-right">Honorarios</TableHead>
                    <TableHead className="text-right">Comisiones</TableHead>
                    <TableHead className="text-right">Captaciones</TableHead>
                    <TableHead className="text-right pr-4">Llamadas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendedorStats.map((v, i) => (
                    <TableRow key={v.id} className={cn(i === 0 && "bg-primary/5")}>
                      <TableCell className="pl-4">
                        {i < 3 ? (
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                              MEDAL_COLORS[i],
                            )}
                          >
                            {i + 1}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground pl-1">{i + 1}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/app/manager/vendedores/${v.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {v.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{v.cierres}</TableCell>
                      <TableCell className="text-right tabular-nums">{v.puntas}</TableCell>
                      <TableCell className="text-right tabular-nums font-medium">
                        {formatCurrency(v.honorarios)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {formatCurrency(v.comisiones)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{v.captaciones}</TableCell>
                      <TableCell className="text-right tabular-nums pr-4">{v.llamadas}</TableCell>
                    </TableRow>
                  ))}
                  {vendedorStats.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">
                        Sin datos para el período seleccionado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── 5. NAVEGACIÓN RÁPIDA ── */}
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Secciones del supervisor
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 stagger-children">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="group block cursor-pointer">
              <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
                <CardContent className="p-4 flex flex-col gap-2.5">
                  <div className="flex items-start justify-between">
                    <div className={cn("p-2 rounded-lg", link.bg)}>
                      <link.icon className={cn("h-4 w-4", link.color)} aria-hidden="true" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-150" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">{link.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{link.desc}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
