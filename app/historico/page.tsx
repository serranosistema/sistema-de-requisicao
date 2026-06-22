"use client";

import { useState, useMemo, useEffect } from "react";
import {
  FolderIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  TableCellsIcon,
  CalendarDaysIcon,
} from "@heroicons/react/24/outline";
import { FolderIcon as FolderSolid } from "@heroicons/react/24/solid";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getRequisitions } from "@/app/actions/requisitions";
import {
  FullRequisition,
  formatDatePTBR,
  exportCSV,
  exportPDF,
} from "./_components/export-utils";
import { RequisitionCard } from "./_components/requisition-card";

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

export default function HistoricoPage() {
  const [requisitions, setRequisitions] = useState<FullRequisition[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [activeMonth, setActiveMonth] = useState<number | null>(null);
  const [searchDate, setSearchDate] = useState<string>("");

  useEffect(() => {
    async function fetchReqs() {
      setLoading(true);
      const data = await getRequisitions();
      // @ts-ignore - A tipagem cruza as datas como string na rede e Date no cliente, isso garante o parse
      setRequisitions(data);
      setLoading(false);
    }
    fetchReqs();
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set(
      requisitions.map((r) => new Date(r.createdAt).getFullYear().toString()),
    );
    years.add(new Date().getFullYear().toString());
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [requisitions]);

  const isSearching = searchDate !== "";

  const displayRequisitions = useMemo(() => {
    let filtered = requisitions;

    if (isSearching) {
      filtered = requisitions.filter(
        (r) => new Date(r.createdAt).toISOString().slice(0, 10) === searchDate,
      );
    } else if (activeMonth !== null) {
      filtered = requisitions.filter((r) => {
        const date = new Date(r.createdAt);
        return (
          date.getFullYear().toString() === selectedYear &&
          date.getMonth() === activeMonth
        );
      });
    } else {
      return [];
    }

    return filtered.sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }, [requisitions, isSearching, searchDate, activeMonth, selectedYear]);

  const groupedByDay = useMemo(() => {
    const groups: Record<string, FullRequisition[]> = {};
    displayRequisitions.forEach((req) => {
      const day = new Date(req.createdAt).toISOString().slice(0, 10);
      if (!groups[day]) groups[day] = [];
      groups[day].push(req);
    });
    return groups;
  }, [displayRequisitions]);

  if (loading) {
    return (
      <AppShell title="Histórico e Relatórios">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="text-muted-foreground animate-pulse">
            Buscando histórico...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Histórico e Relatórios">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 pb-20">
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
                    if (e.target.value) setActiveMonth(null);
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
                onValueChange={(val) => val && setSelectedYear(val)}
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

        {!isSearching && activeMonth === null && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {MONTHS.map((month, index) => {
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
                <ArrowLeftIcon className="size-4" /> Voltar
              </Button>
              <h2 className="text-xl font-bold">
                {isSearching
                  ? `Resultados: ${formatDatePTBR(searchDate)}`
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
                      {/* Cabeçalho do Dia com Botões em Lote */}
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

                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {dayReqs.map((req) => (
                          <RequisitionCard
                            key={req.id}
                            req={req}
                            dayString={dayString}
                          />
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
