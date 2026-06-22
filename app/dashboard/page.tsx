"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ClockIcon,
  BuildingStorefrontIcon,
  FireIcon,
  CubeTransparentIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Importando as ações reais do servidor
import { getRequisitions } from "@/app/actions/requisitions";
import { getSectors } from "@/app/actions/sectors";

// Tipagem baseada no retorno do Prisma
interface DbReqItem {
  id: string;
  quantity: number;
  item: { id: string; name: string; code: string; unit: string };
}

interface DbRequisition {
  id: string;
  createdAt: string | Date;
  status: string;
  sector: { id: string; name: string; code: string };
  items: DbReqItem[];
}

// ─── helpers ────────────────────────────────────────────────────────────────

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function shortDate(iso: string | Date) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
  "#f97316",
  "#64748b",
];

// ─── Tooltip customizado ─────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover p-3 shadow-lg text-sm min-w-35 z-50">
      <p className="font-semibold text-foreground mb-2">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span
              className="inline-block size-2 rounded-full"
              style={{ background: p.color }}
            />
            {p.name}
          </span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Componente de card KPI ──────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
  large = false,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  tint: string;
  large?: boolean;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl",
          tint,
          large ? "size-14" : "size-12",
        )}
      >
        <Icon className={large ? "size-7" : "size-6"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground leading-tight">{label}</p>
        <p
          className={cn(
            "mt-0.5 font-bold leading-tight text-balance",
            large ? "text-3xl" : "text-xl",
          )}
        >
          {value}
        </p>
        {sub && (
          <p className="mt-1 text-xs text-muted-foreground text-balance">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-2 mb-4">
      <div>
        <h2 className="font-semibold text-base text-foreground">{title}</h2>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [requisitions, setRequisitions] = useState<DbRequisition[]>([]);
  const router = useRouter();
  const [totalSectorsCount, setTotalSectorsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number>(30);

  // Carrega os dados reais do banco
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [fetchedReqs, fetchedSectors] = await Promise.all([
        getRequisitions(),
        getSectors(),
      ]);
      setRequisitions(fetchedReqs as DbRequisition[]);
      setTotalSectorsCount(fetchedSectors.length);
      setLoading(false);
    }
    fetchData();
  }, []);

  // ── filtro de período ──
  const cutoff = useMemo(() => daysAgo(period), [period]);
  const prevCutoff = useMemo(() => daysAgo(period * 2), [period]);

  const reqs = useMemo(
    () => requisitions.filter((r) => new Date(r.createdAt) >= cutoff),
    [requisitions, cutoff],
  );

  const prevReqs = useMemo(
    () =>
      requisitions.filter(
        (r) =>
          new Date(r.createdAt) >= prevCutoff && new Date(r.createdAt) < cutoff,
      ),
    [requisitions, prevCutoff, cutoff],
  );

  // ── KPIs ──
  const totalReqs = reqs.length;
  const activeSectors = new Set(reqs.map((r) => r.sector.id)).size;

  const totalsByItem: Record<string, { qty: number; name: string }> = {};
  reqs.forEach((r) =>
    r.items.forEach((i) => {
      if (!totalsByItem[i.item.id]) {
        totalsByItem[i.item.id] = { qty: 0, name: i.item.name };
      }
      totalsByItem[i.item.id].qty += i.quantity;
    }),
  );

  const topItemEntry = Object.values(totalsByItem).sort(
    (a, b) => b.qty - a.qty,
  )[0];
  const topItemLabel = topItemEntry ? topItemEntry.name : "—";
  const totalVolume = Object.values(totalsByItem).reduce(
    (a, b) => a + b.qty,
    0,
  );

  // ── Comparativo ao longo do tempo (LineChart Duplo) ──
  const comparativeTimelineData = useMemo(() => {
    const data: { date: string; Atual: number; Anterior: number }[] = [];

    for (let d = period - 1; d >= 0; d--) {
      const curDate = new Date();
      curDate.setDate(curDate.getDate() - d);
      const curStr = shortDate(curDate.toISOString());

      data.push({ date: curStr, Atual: 0, Anterior: 0 });
    }

    reqs.forEach((r) => {
      const curStr = shortDate(r.createdAt);
      const idx = data.findIndex((d) => d.date === curStr);
      if (idx !== -1) {
        data[idx].Atual += r.items.reduce((s, i) => s + i.quantity, 0);
      }
    });

    prevReqs.forEach((r) => {
      const pDate = new Date(r.createdAt);
      pDate.setDate(pDate.getDate() + period);
      const curStr = shortDate(pDate.toISOString());
      const idx = data.findIndex((d) => d.date === curStr);
      if (idx !== -1) {
        data[idx].Anterior += r.items.reduce((s, i) => s + i.quantity, 0);
      }
    });

    return data;
  }, [reqs, prevReqs, period]);

  // ── Ranking de setores por volume (BarChart horizontal) ──
  const sectorRanking = useMemo(() => {
    const map: Record<string, { qty: number; name: string }> = {};
    reqs.forEach((r) => {
      if (!map[r.sector.id]) map[r.sector.id] = { qty: 0, name: r.sector.name };
      r.items.forEach((i) => (map[r.sector.id].qty += i.quantity));
    });
    return Object.values(map)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 8);
  }, [reqs]);

  // ── Top 6 insumos (BarChart vertical) ──
  const topItems = useMemo(() => {
    return Object.values(totalsByItem)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);
  }, [totalsByItem]);

  // ── Composição por setor × insumo (Stacked BarChart) ──
  const stackedData = useMemo(() => {
    // Pegar os top setores
    const sectorMap: Record<string, { id: string; name: string; qty: number }> =
      {};
    reqs.forEach((r) => {
      if (!sectorMap[r.sector.id])
        sectorMap[r.sector.id] = {
          id: r.sector.id,
          name: r.sector.name,
          qty: 0,
        };
      r.items.forEach((i) => (sectorMap[r.sector.id].qty += i.quantity));
    });

    const topSectors = Object.values(sectorMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 6);

    const topItemIds = Object.entries(totalsByItem)
      .sort((a, b) => b[1].qty - a[1].qty)
      .slice(0, 5)
      .map(([id]) => id);

    return topSectors.map((sec) => {
      const row: Record<string, any> = { setor: sec.name };
      const sReqs = reqs.filter((r) => r.sector.id === sec.id);

      topItemIds.forEach((iId) => {
        const itemName = totalsByItem[iId].name;
        const qty = sReqs
          .flatMap((r) => r.items)
          .filter((i) => i.item.id === iId)
          .reduce((s, i) => s + i.quantity, 0);
        row[itemName] = qty || 0;
      });
      return row;
    });
  }, [reqs, totalsByItem]);

  const stackedKeys = useMemo(() => {
    if (!stackedData.length) return [];
    return Object.keys(stackedData[0]).filter((k) => k !== "setor");
  }, [stackedData]);

  // ── Variação semana × semana por insumo ──
  const weekComparison = useMemo(() => {
    const thisWeekCutoff = daysAgo(7);
    const prevWeekCutoff = daysAgo(14);

    const thisWeek: Record<string, { name: string; qty: number }> = {};
    const prevWeek: Record<string, { name: string; qty: number }> = {};

    requisitions
      .filter((r) => new Date(r.createdAt) >= thisWeekCutoff)
      .forEach((r) =>
        r.items.forEach((i) => {
          if (!thisWeek[i.item.id])
            thisWeek[i.item.id] = { name: i.item.name, qty: 0 };
          thisWeek[i.item.id].qty += i.quantity;
        }),
      );

    requisitions
      .filter(
        (r) =>
          new Date(r.createdAt) >= prevWeekCutoff &&
          new Date(r.createdAt) < thisWeekCutoff,
      )
      .forEach((r) =>
        r.items.forEach((i) => {
          if (!prevWeek[i.item.id])
            prevWeek[i.item.id] = { name: i.item.name, qty: 0 };
          prevWeek[i.item.id].qty += i.quantity;
        }),
      );

    const allIds = new Set([
      ...Object.keys(thisWeek),
      ...Object.keys(prevWeek),
    ]);

    return [...allIds]
      .map((id) => {
        const curObj = thisWeek[id];
        const prevObj = prevWeek[id];
        const name = curObj?.name || prevObj?.name || "Desconhecido";
        const cur = curObj?.qty ?? 0;
        const prev = prevObj?.qty ?? 0;
        const delta =
          prev === 0 ? null : Math.round(((cur - prev) / prev) * 100);
        return { id, name, cur, prev, delta };
      })
      .filter((x) => x.cur > 0 || x.prev > 0)
      .sort((a, b) => b.cur - a.cur)
      .slice(0, 8);
  }, [requisitions]);

  if (loading) {
    return (
      <AppShell title="Dashboard">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">
            Calculando métricas e montando gráficos...
          </p>
        </div>
      </AppShell>
    );
  }

  const isEmpty = requisitions.length === 0;

  return (
    <AppShell title="Dashboard">
      <div className="flex h-full flex-col -m-4 md:-m-6">
        <div className="flex-1 overflow-y-auto px-4 md:px-6">
          <div className="mx-auto max-w-6xl flex flex-col gap-6 py-6 pb-10">
            {/* ── Cabeçalho ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Visão Operacional
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Consumo de insumos da loja
                </p>
              </div>
              <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                <Select
                  value={period.toString()}
                  onValueChange={(v) => setPeriod(Number(v))}
                >
                  <SelectTrigger className="h-10 w-full sm:w-44 bg-card">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="15">Últimos 15 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 3 meses</SelectItem>
                    <SelectItem value="180">Últimos 6 meses</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => router.push("/requisicao")}
                  size="default"
                  className="h-10"
                >
                  <PlusCircleIcon className="size-5 mr-1.5" />
                  Nova Separação
                </Button>
              </div>
            </div>

            {/* ── KPIs ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Requisições no período"
                value={totalReqs}
                icon={ClockIcon}
                tint="bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                large
              />
              <KpiCard
                label="Setores ativos"
                value={activeSectors}
                sub={`de ${totalSectorsCount} cadastrados`}
                icon={BuildingStorefrontIcon}
                tint="bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300"
              />
              <KpiCard
                label="Insumo líder"
                value={topItemLabel}
                sub={topItemEntry ? `${topItemEntry.qty} unidades` : undefined}
                icon={FireIcon}
                tint="bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
              />
              <KpiCard
                label="Volume total separado"
                value={totalVolume}
                sub="unidades no período"
                icon={CubeTransparentIcon}
                tint="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              />
            </div>

            {isEmpty && (
              <div className="rounded-2xl border-2 border-dashed border-border p-12 text-center">
                <p className="text-lg font-semibold text-foreground">
                  Nenhuma requisição registrada
                </p>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Faça a primeira separação para os gráficos aparecerem.
                </p>
                <Button onClick={() => router.push("/requisicao")}>
                  Iniciar separação
                </Button>
              </div>
            )}

            {!isEmpty && (
              <>
                {/* ── Comparativo ao longo do tempo (NOVO GRÁFICO DUPLO) ── */}
                <div className="rounded-2xl border border-border bg-card p-5">
                  <SectionHeader
                    title="Evolução de Consumo"
                    description="Comparativo de volume: Período Atual vs Período Anterior"
                  />
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart
                      data={comparativeTimelineData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        interval={
                          period <= 15 ? 0 : period === 30 ? 4 : "preserveEnd"
                        }
                        dy={10}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{
                          fontSize: 12,
                          color: "var(--muted-foreground)",
                          paddingTop: "15px",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="Atual"
                        stroke="#3b82f6" // blue-500
                        strokeWidth={3}
                        dot={period <= 15 ? { r: 4, fill: "#3b82f6" } : false}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                      <Line
                        type="monotone"
                        dataKey="Anterior"
                        stroke="#94a3b8" // slate-400
                        strokeWidth={3}
                        strokeDasharray="5 5"
                        dot={false}
                        activeDot={{ r: 6 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* ── Grid: ranking setores + top insumos ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Ranking de setores */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <SectionHeader
                      title="Setores que mais consomem"
                      description="Volume total de unidades separadas por setor"
                    />
                    {sectorRanking.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Sem dados no período.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={sectorRanking}
                          layout="vertical"
                          margin={{ top: 0, right: 15, left: -10, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            tick={{
                              fontSize: 12,
                              fill: "var(--muted-foreground)",
                            }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={90}
                            tick={{
                              fontSize: 12,
                              fill: "var(--muted-foreground)",
                            }}
                            tickLine={false}
                            axisLine={false}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--muted)" }}
                          />
                          <Bar
                            dataKey="qty"
                            name="Qtd."
                            radius={[0, 6, 6, 0]}
                            maxBarSize={32}
                          >
                            {sectorRanking.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Top insumos */}
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <SectionHeader
                      title="Insumos mais utilizados"
                      description="Top 6 por quantidade total no período"
                    />
                    {topItems.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Sem dados no período.
                      </p>
                    ) : (
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart
                          data={topItems}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{
                              fontSize: 11,
                              fill: "var(--muted-foreground)",
                            }}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                          />
                          <YAxis
                            tick={{
                              fontSize: 12,
                              fill: "var(--muted-foreground)",
                            }}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <Tooltip
                            content={<CustomTooltip />}
                            cursor={{ fill: "var(--muted)" }}
                          />
                          <Bar
                            dataKey="qty"
                            name="Qtd."
                            radius={[6, 6, 0, 0]}
                            maxBarSize={48}
                          >
                            {topItems.map((_, i) => (
                              <Cell
                                key={i}
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>

                {/* ── Composição por setor × insumo ── */}
                {stackedData.length > 0 && stackedKeys.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <SectionHeader
                      title="Composição de consumo por setor"
                      description="Quais insumos cada setor utiliza — top 5 insumos × top 6 setores"
                    />
                    <div className="overflow-x-auto -mx-1">
                      <div className="min-w-150 px-1">
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart
                            data={stackedData}
                            margin={{
                              top: 10,
                              right: 10,
                              left: -20,
                              bottom: 0,
                            }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="var(--border)"
                              vertical={false}
                            />
                            <XAxis
                              dataKey="setor"
                              tick={{
                                fontSize: 12,
                                fill: "var(--muted-foreground)",
                              }}
                              tickLine={false}
                              axisLine={false}
                              dy={10}
                            />
                            <YAxis
                              tick={{
                                fontSize: 12,
                                fill: "var(--muted-foreground)",
                              }}
                              tickLine={false}
                              axisLine={false}
                              allowDecimals={false}
                            />
                            <Tooltip
                              content={<CustomTooltip />}
                              cursor={{ fill: "var(--muted)" }}
                            />
                            <Legend
                              wrapperStyle={{
                                fontSize: 12,
                                color: "var(--muted-foreground)",
                                paddingTop: "20px",
                              }}
                            />
                            {stackedKeys.map((key, i) => (
                              <Bar
                                key={key}
                                dataKey={key}
                                stackId="a"
                                fill={CHART_COLORS[i % CHART_COLORS.length]}
                                maxBarSize={60}
                                radius={
                                  i === stackedKeys.length - 1
                                    ? [6, 6, 0, 0]
                                    : [0, 0, 0, 0]
                                }
                              />
                            ))}
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Variação semana × semana ── */}
                {weekComparison.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <SectionHeader
                      title="Variação semana a semana"
                      description="Esta semana vs semana anterior — detecte aumentos e reduções de consumo"
                    />
                    <div className="overflow-x-auto -mx-5 mt-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="px-5 py-3 text-left font-medium text-muted-foreground">
                              Insumo
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                              Sem. anterior
                            </th>
                            <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                              Esta semana
                            </th>
                            <th className="px-5 py-3 text-right font-medium text-muted-foreground">
                              Variação
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {weekComparison.map((row) => {
                            const up = row.delta !== null && row.delta > 0;
                            const down = row.delta !== null && row.delta < 0;
                            return (
                              <tr
                                key={row.id}
                                className="hover:bg-muted/40 transition-colors"
                              >
                                <td className="px-5 py-3.5 font-medium text-foreground">
                                  {row.name}
                                </td>
                                <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums">
                                  {row.prev}
                                </td>
                                <td className="px-4 py-3.5 text-right font-semibold text-foreground tabular-nums">
                                  {row.cur}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                  {row.delta === null ? (
                                    <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                                      <MinusIcon className="size-3.5" />
                                      novo
                                    </span>
                                  ) : (
                                    <span
                                      className={cn(
                                        "inline-flex items-center justify-end gap-1 font-semibold text-xs rounded-full px-2.5 py-1",
                                        up
                                          ? "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400"
                                          : down
                                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400"
                                            : "bg-muted text-muted-foreground",
                                      )}
                                    >
                                      {up ? (
                                        <ArrowUpIcon className="size-3" />
                                      ) : down ? (
                                        <ArrowDownIcon className="size-3" />
                                      ) : (
                                        <MinusIcon className="size-3" />
                                      )}
                                      {row.delta === 0
                                        ? "estável"
                                        : `${Math.abs(row.delta)}%`}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 px-0.5">
                      <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                        <ArrowUpIcon className="size-3" /> aumento
                      </span>{" "}
                      significa mais consumo que o esperado —{" "}
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <ArrowDownIcon className="size-3" /> redução
                      </span>{" "}
                      pode indicar eficiência ou subprodução.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
