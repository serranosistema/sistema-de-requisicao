"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
} from "recharts";
import {
  ClockIcon,
  CubeTransparentIcon,
  FireIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";

const formatQty = (num: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(num);
const formatMoney = (num: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    num,
  );

const formatLocalDate = (dateStr: string) => {
  if (!dateStr) return "--";
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#0ea5e9",
];

export function ReportDocument({
  filteredReqs,
  startDate,
  endDate,
  selectedSectorName,
  showCosts,
  isAllSectors,
  showCharts, // <-- Novas opções de customização
  showTable,
  showSignatures,
}: any) {
  const {
    topItems,
    sectorRanking,
    totalVolume,
    grandTotalCost,
    topItemLabel,
    topItemQty,
  } = useMemo(() => {
    let volume = 0;
    let cost = 0;
    const itemMap: Record<string, { name: string; qty: number; cost: number }> =
      {};
    const sectorMap: Record<string, { name: string; qty: number }> = {};

    filteredReqs.forEach((req: any) => {
      if (!sectorMap[req.sector.id])
        sectorMap[req.sector.id] = { name: req.sector.name, qty: 0 };

      req.items.forEach((reqItem: any) => {
        const iId = reqItem.item.id;
        if (!itemMap[iId]) {
          itemMap[iId] = { name: reqItem.item.name, qty: 0, cost: 0 };
        }
        itemMap[iId].qty += reqItem.quantity;
        itemMap[iId].cost += reqItem.quantity * (reqItem.item.cost || 0);

        sectorMap[req.sector.id].qty += reqItem.quantity;
        volume += reqItem.quantity;
        cost += reqItem.quantity * (reqItem.item.cost || 0);
      });
    });

    const sortedItems = Object.values(itemMap).sort((a, b) => b.qty - a.qty);
    const sortedSectors = Object.values(sectorMap).sort(
      (a, b) => b.qty - a.qty,
    );

    return {
      topItems: sortedItems.slice(0, 10),
      sectorRanking: sortedSectors.slice(0, 6),
      totalVolume: volume,
      grandTotalCost: cost,
      topItemLabel: sortedItems[0]?.name || "—",
      topItemQty: sortedItems[0]?.qty || 0,
    };
  }, [filteredReqs]);

  if (filteredReqs.length === 0) {
    return (
      <div className="py-24 text-center text-gray-500 font-medium">
        Nenhuma requisição encontrada para o período e filtros selecionados.
      </div>
    );
  }

  return (
    // Removi as bordas redondas e adicionei fundo branco puro para simular papel
    <div className="bg-white p-8 sm:p-12 text-black print:p-0 print:m-0 print:w-full">
      {/* ── CABEÇALHO DO RELATÓRIO ── */}
      <div className="mb-6 border-b-2 border-gray-200 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-gray-900">
            Dashboard de Consumo
          </h1>
          <p className="mt-1 text-gray-600 font-medium">
            Período: {formatLocalDate(startDate)} a {formatLocalDate(endDate)}
          </p>
          <p className="text-gray-600">
            Filtro: <span className="font-semibold">{selectedSectorName}</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-500 uppercase">
            Emissão
          </p>
          <p className="text-base font-medium text-gray-900">
            {new Date().toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* ── 4 KPIs GIGANTES ── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <ClockIcon className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Separações
            </span>
          </div>
          <p className="text-3xl font-black text-gray-900">
            {filteredReqs.length}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CubeTransparentIcon className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Volume Total
            </span>
          </div>
          <p className="text-3xl font-black text-blue-900">
            {formatQty(totalVolume)}{" "}
            <span className="text-sm font-medium">un.</span>
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <FireIcon className="size-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Mais Consumido
            </span>
          </div>
          <p
            className="text-xl font-black text-amber-900 truncate"
            title={topItemLabel}
          >
            {topItemLabel}
          </p>
          <p className="text-sm font-medium text-amber-700/80">
            {formatQty(topItemQty)} un.
          </p>
        </div>

        {showCosts ? (
          <div className="rounded-xl border border-gray-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <CurrencyDollarIcon className="size-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Custo Estimado
              </span>
            </div>
            <p className="text-2xl font-black text-emerald-900">
              {formatMoney(grandTotalCost)}
            </p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider text-center">
              Custos Ocultos
            </span>
          </div>
        )}
      </div>

      {/* ── GRÁFICOS (Renderizados apenas se o usuário pedir) ── */}
      {showCharts && (
        <div
          className={`grid gap-8 mb-8 ${isAllSectors ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <div className="rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 text-center">
              Insumos Mais Consumidos (Top 6)
            </h3>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topItems.slice(0, 6)}
                  margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    dy={5}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "#6b7280" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(val) => formatQty(val)}
                  />
                  <Bar
                    dataKey="qty"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                    isAnimationActive={false}
                  >
                    {topItems.slice(0, 6).map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {isAllSectors && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-700 uppercase mb-4 text-center">
                Consumo por Setor
              </h3>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sectorRanking}
                    layout="vertical"
                    margin={{ top: 0, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={false}
                      stroke="#e5e7eb"
                    />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => formatQty(val)}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 10, fill: "#6b7280" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Bar
                      dataKey="qty"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={30}
                      isAnimationActive={false}
                    >
                      {sectorRanking.map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TABELA DE DETALHAMENTO ── */}
      {showTable && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
            Detalhamento Numérico (Top 10 Insumos)
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <th className="py-2 px-2 font-bold text-gray-800">Insumo</th>
                <th className="py-2 px-2 font-bold text-gray-800 text-right">
                  Qtd. Consumida
                </th>
                {showCosts && (
                  <th className="py-2 px-2 font-bold text-gray-800 text-right">
                    Custo Total
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {topItems.map((item: any) => (
                <tr key={item.name} className="print:break-inside-avoid">
                  <td className="py-2 px-2 font-medium text-gray-900">
                    {item.name}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-gray-900">
                    {formatQty(item.qty)}
                  </td>
                  {showCosts && (
                    <td className="py-2 px-2 text-right text-gray-600">
                      {item.cost > 0 ? formatMoney(item.cost) : "-"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── CAMPOS DE ASSINATURA ── */}
      {showSignatures && (
        <div className="mt-16 flex justify-between px-8 print:break-inside-avoid">
          <div className="w-48 border-t border-gray-400 pt-2 text-center">
            <p className="text-[10px] text-gray-600 uppercase font-medium">
              Visto do Responsável
            </p>
          </div>
          <div className="w-48 border-t border-gray-400 pt-2 text-center">
            <p className="text-[10px] text-gray-600 uppercase font-medium">
              Visto da Diretoria
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
