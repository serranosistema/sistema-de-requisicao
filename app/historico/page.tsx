"use client";

import { useState, useMemo } from "react";
import {
  FolderIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { FolderIcon as FolderSolid } from "@heroicons/react/24/solid";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/lib/store";
import type { Requisition } from "@/lib/types";

const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDatePTBR(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC", // Ajuste para evitar bugs de fuso
  });
}

export default function HistoricoPage() {
  const { requisitions, sectorName, itemName, itemUnit } = useStore();

  // Estados de Navegação
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [activeMonth, setActiveMonth] = useState<number | null>(null); // 0 a 11
  const [searchDate, setSearchDate] = useState<string>(""); // Formato YYYY-MM-DD do input date

  // Extrai os anos disponíveis baseados nas requisições reais (com fallback para o ano atual)
  const availableYears = useMemo(() => {
    const years = new Set(
      requisitions.map((r) => new Date(r.createdAt).getFullYear().toString()),
    );
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [requisitions]);

  // Lógica de visualização
  const isSearching = searchDate !== "";

  // Requisições a serem exibidas (seja na busca ou dentro do mês)
  const displayRequisitions = useMemo(() => {
    let filtered = requisitions;

    if (isSearching) {
      // Se estiver buscando por data, ignora ano/mês e foca no dia exato
      filtered = requisitions.filter(
        (r) => r.createdAt.slice(0, 10) === searchDate,
      );
    } else if (activeMonth !== null) {
      // Se estiver dentro de uma pasta de mês
      filtered = requisitions.filter((r) => {
        const date = new Date(r.createdAt);
        return (
          date.getFullYear().toString() === selectedYear &&
          date.getMonth() === activeMonth
        );
      });
    } else {
      return []; // Mostrando as pastas, não precisa carregar a lista
    }

    // Ordena das mais recentes para as mais antigas
    return filtered.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [requisitions, isSearching, searchDate, activeMonth, selectedYear]);

  // Agrupa as requisições por dia (para a view detalhada)
  const groupedByDay = useMemo(() => {
    const groups: Record<string, Requisition[]> = {};
    displayRequisitions.forEach((req) => {
      const day = req.createdAt.slice(0, 10); // YYYY-MM-DD
      if (!groups[day]) groups[day] = [];
      groups[day].push(req);
    });
    return groups;
  }, [displayRequisitions]);

  // --- LÓGICA DE EXPORTAÇÃO --- //

  // 1. Exportar CSV
  const exportCSV = (reqs: Requisition[], title: string) => {
    let csvContent =
      "Data,Setor,Solicitante,Status,Insumo,Quantidade,Unidade\n";

    reqs.forEach((req) => {
      const data = formatDatePTBR(req.createdAt);
      const setor = sectorName(req.sectorId);
      const solicitante = req.requesterName;
      const status = req.status;

      req.items.forEach((item) => {
        const nomeInsumo = itemName(item.itemId);
        const qtd = item.quantity;
        const un = itemUnit(item.itemId);
        csvContent += `"${data}","${setor}","${solicitante}","${status}","${nomeInsumo}","${qtd}","${un}"\n`;
      });
    });

    // Adiciona o BOM para o Excel ler acentos corretamente
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.csv`;
    link.click();
  };

  // 2. Exportar PDF (Usa nativo de Impressão da web estilizado)
  const exportPDF = (reqs: Requisition[], title: string) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    let html = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: system-ui, sans-serif; color: #111; padding: 20px; }
            h1 { font-size: 20px; margin-bottom: 20px; border-bottom: 1px solid #ccc; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
            th, td { text-align: left; padding: 10px; border-bottom: 1px solid #eee; }
            th { background-color: #f8f9fa; font-weight: 600; }
            .sector-title { background: #eef2ff; font-weight: bold; padding: 10px; font-size: 16px; margin-top: 20px;}
          </style>
        </head>
        <body>
          <h1>Relatório de Requisições: ${title}</h1>
    `;

    reqs.forEach((req) => {
      html += `
        <div class="sector-title">Setor: ${sectorName(req.sectorId)} | Solicitante: ${req.requesterName} | Data: ${formatDatePTBR(req.createdAt)}</div>
        <table>
          <thead>
            <tr>
              <th>Insumo</th>
              <th>Quantidade</th>
              <th>Unidade</th>
            </tr>
          </thead>
          <tbody>
            ${req.items
              .map(
                (item) => `
              <tr>
                <td>${itemName(item.itemId)}</td>
                <td>${item.quantity}</td>
                <td>${itemUnit(item.itemId)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      `;
    });

    html += `</body></html>`;
    printWindow.document.write(html);
    printWindow.document.close();

    // Pequeno delay para garantir que o DOM renderizou antes de puxar a janela de impressão
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // --- RENDERIZAÇÃO --- //

  return (
    <AppShell title="Histórico e Relatórios">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-20">
        {/* Barra de Ferramentas Superior */}
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between rounded-2xl border border-border bg-card p-4">
          <div className="flex w-full sm:w-auto items-center gap-3">
            <div className="flex-1 sm:w-48 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground ml-1">
                Buscar por Data Exata
              </span>
              <div className="relative">
                <CalendarDaysIcon className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="date"
                  value={searchDate}
                  onChange={(e) => {
                    setSearchDate(e.target.value);
                    if (e.target.value) setActiveMonth(null); // Fecha pasta se buscar
                  }}
                  className="pl-10 h-11"
                />
              </div>
            </div>
          </div>

          {!isSearching && (
            <div className="flex w-full sm:w-40 flex-col gap-1.5">
              <span className="text-sm font-medium text-muted-foreground ml-1">
                Ano Letivo
              </span>
              <Select
                value={selectedYear}
                onValueChange={(val) => {
                  // Select may provide null; keep current year in that case
                  if (val) setSelectedYear(val);
                }}
              >
                <SelectTrigger className="h-11 font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* MODO 1: Mostrando as Pastas (12 Meses) */}
        {!isSearching && activeMonth === null && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {MONTHS.map((month, index) => {
              // Conta quantas requisições existem neste mês específico para dar feedback visual
              const reqsInMonth = requisitions.filter((r) => {
                const date = new Date(r.createdAt);
                return (
                  date.getFullYear().toString() === selectedYear &&
                  date.getMonth() === index
                );
              }).length;

              return (
                <button
                  key={month}
                  onClick={() => setActiveMonth(index)}
                  className="group flex flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-6 text-center transition-all hover:border-primary hover:bg-primary/5 active:scale-[0.98]"
                >
                  <div className="relative text-muted-foreground transition-colors group-hover:text-primary">
                    {reqsInMonth > 0 ? (
                      <FolderSolid className="size-16 text-primary" />
                    ) : (
                      <FolderIcon className="size-16" />
                    )}
                  </div>
                  <div>
                    <span className="block text-base font-semibold text-foreground">
                      {month}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {reqsInMonth} {reqsInMonth === 1 ? "arquivo" : "arquivos"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* MODO 2: Dentro da Pasta (Mês) ou Resultado de Busca Exata */}
        {(isSearching || activeMonth !== null) && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setActiveMonth(null);
                  setSearchDate("");
                }}
                className="gap-2"
              >
                <ArrowLeftIcon className="size-4" />
                Voltar
              </Button>
              <h2 className="text-xl font-bold">
                {isSearching
                  ? `Resultados da busca: ${formatDatePTBR(searchDate)}`
                  : `Arquivos de ${MONTHS[activeMonth!]} de ${selectedYear}`}
              </h2>
            </div>

            {Object.keys(groupedByDay).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                <FolderIcon className="mx-auto size-12 opacity-40 mb-3" />
                <p>Nenhuma requisição encontrada neste período.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-8">
                {Object.entries(groupedByDay)
                  .sort(
                    ([dateA], [dateB]) => +new Date(dateB) - +new Date(dateA),
                  )
                  .map(([dayString, dayReqs]) => (
                    <div key={dayString} className="flex flex-col gap-4">
                      {/* Cabeçalho do Dia (Ação em Lote) */}
                      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-muted/50 px-5 py-3 border border-border">
                        <div className="flex items-center gap-3">
                          <CalendarDaysIcon className="size-5 text-primary" />
                          <h3 className="font-semibold text-lg">
                            {formatDatePTBR(dayString)}
                          </h3>
                          <span className="text-sm rounded-full bg-background px-2.5 py-0.5 border">
                            {dayReqs.length} resgates
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              exportCSV(dayReqs, `Consolidado_${dayString}`)
                            }
                          >
                            <TableCellsIcon className="size-4 text-emerald-600" />
                            <span className="hidden sm:inline">CSV do Dia</span>
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="gap-2"
                            onClick={() =>
                              exportPDF(dayReqs, `Consolidado_${dayString}`)
                            }
                          >
                            <DocumentArrowDownIcon className="size-4 text-rose-600" />
                            <span className="hidden sm:inline">PDF do Dia</span>
                          </Button>
                        </div>
                      </div>

                      {/* Lista Individual das Requisições daquele dia */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {dayReqs.map((req) => (
                          <div
                            key={req.id}
                            className="flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-lg text-primary">
                                  {sectorName(req.sectorId)}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Por: {req.requesterName}
                                </p>
                              </div>
                              <StatusBadge status={req.status} />
                            </div>

                            <div className="flex flex-col gap-1 text-sm bg-muted/30 p-3 rounded-lg border">
                              {req.items.slice(0, 3).map((item) => (
                                <div
                                  key={item.id}
                                  className="flex justify-between"
                                >
                                  <span className="truncate pr-2">
                                    {itemName(item.itemId)}
                                  </span>
                                  <span className="font-medium shrink-0">
                                    {item.quantity} {itemUnit(item.itemId)}
                                  </span>
                                </div>
                              ))}
                              {req.items.length > 3 && (
                                <p className="text-xs text-muted-foreground mt-1 pt-1 border-t italic">
                                  + {req.items.length - 3} itens ocultos...
                                </p>
                              )}
                            </div>

                            {/* Botões de Ação Individual */}
                            <div className="flex items-center gap-2 mt-auto pt-2">
                              <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() =>
                                  exportCSV(
                                    [req],
                                    `Req_${sectorName(req.sectorId)}_${dayString}`,
                                  )
                                }
                              >
                                <TableCellsIcon className="size-4" /> CSV
                              </Button>
                              <Button
                                variant="outline"
                                className="flex-1 gap-2"
                                onClick={() =>
                                  exportPDF(
                                    [req],
                                    `Req_${sectorName(req.sectorId)}_${dayString}`,
                                  )
                                }
                              >
                                <DocumentArrowDownIcon className="size-4" /> PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
