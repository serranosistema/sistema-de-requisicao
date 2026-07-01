"use client";

import { useState, useMemo, useEffect } from "react";
import {
  PrinterIcon,
  Cog6ToothIcon,
  EyeIcon,
  ArrowLeftIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getRequisitions } from "@/app/actions/requisitions";
import { getSectors } from "@/app/actions/sectors";
import { ReportDocument } from "./components/report-document";

interface DbReqItem {
  quantity: number;
  item: {
    id: string;
    name: string;
    code: string;
    unit: string;
    cost: number | null;
  };
}

interface DbRequisition {
  id: string;
  createdAt: string | Date;
  sector: { id: string; name: string; code: string };
  items: DbReqItem[];
}

interface Sector {
  id: string;
  name: string;
}

const parseLocalDate = (dateStr: string, isEndOfDay = false) => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(
    year,
    month - 1,
    day,
    isEndOfDay ? 23 : 0,
    isEndOfDay ? 59 : 0,
    isEndOfDay ? 59 : 0,
    999,
  );
};

export default function RelatoriosPage() {
  const [requisitions, setRequisitions] = useState<DbRequisition[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados dos Filtros Básicos
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSector, setSelectedSector] = useState<string>("ALL");

  // Estados de Customização do Relatório
  const [showCosts, setShowCosts] = useState(false);
  const [showCharts, setShowCharts] = useState(true);
  const [showTable, setShowTable] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);

  // Controle de Visualização
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Atualizamos o cache para a marca Reqi
      const cachedReqs = sessionStorage.getItem("@reqi-historico-reqs");
      const cachedSectors = sessionStorage.getItem("@reqi-sectors");

      if (cachedReqs && cachedSectors) {
        setRequisitions(JSON.parse(cachedReqs));
        setSectors(JSON.parse(cachedSectors));
        setLoading(false);
      }

      try {
        const [fetchedReqs, fetchedSectors] = await Promise.all([
          getRequisitions(),
          getSectors(),
        ]);
        setRequisitions(fetchedReqs as unknown as DbRequisition[]);
        setSectors(fetchedSectors);
        sessionStorage.setItem(
          "@reqi-historico-reqs",
          JSON.stringify(fetchedReqs),
        );
        sessionStorage.setItem("@reqi-sectors", JSON.stringify(fetchedSectors));
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    setStartDate(`${ano}-${mes}-01`);
    setEndDate(`${ano}-${mes}-${dia}`);
  }, []);

  const filteredReqs = useMemo(() => {
    if (!startDate || !endDate) return [];
    const start = parseLocalDate(startDate, false);
    const end = parseLocalDate(endDate, true);

    let list = requisitions.filter((r) => {
      const d = new Date(r.createdAt);
      return d >= start && d <= end;
    });

    if (selectedSector !== "ALL") {
      list = list.filter((r) => String(r.sector.id) === String(selectedSector));
    }
    return list;
  }, [requisitions, startDate, endDate, selectedSector]);

  // A SOLUÇÃO: Forçamos a comparação como String() para garantir que o Nome seja encontrado
  const selectedSectorName =
    selectedSector === "ALL"
      ? "Todos os Setores"
      : sectors.find((s) => String(s.id) === String(selectedSector))?.name ||
        "Setor não encontrado";

  if (loading) {
    return (
      <AppShell title="Gerador de Relatórios">
        <div className="flex h-[50vh] items-center justify-center">
          <p className="animate-pulse text-muted-foreground">
            Preparando relatórios do Reqi...
          </p>
        </div>
      </AppShell>
    );
  }

  // === TELA DE PRÉVIA DE IMPRESSÃO ===
  if (isPreviewMode) {
    return (
      <AppShell title="Prévia de Impressão">
        <div className="flex h-full flex-col -m-4 md:-m-6 bg-muted/30 print:bg-white">
          {/* Barra de Ações Superior (Não sai na impressão) */}
          <div className="sticky top-0 z-40 border-b border-border bg-card px-4 py-3 shadow-sm print:hidden flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => setIsPreviewMode(false)}
              className="gap-2 rounded-xl"
            >
              <ArrowLeftIcon className="size-4" />
              <span className="hidden sm:inline">Voltar às Configurações</span>
              <span className="sm:hidden">Voltar</span>
            </Button>

            <Button
              onClick={() => window.print()}
              size="default"
              className="gap-2 font-bold rounded-xl"
            >
              <PrinterIcon className="size-5" />
              Imprimir PDF
            </Button>
          </div>

          {/* Área com "Efeito Papel" */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 print:p-0">
            <div className="mx-auto max-w-[21cm] min-h-[29.7cm] shadow-xl ring-1 ring-border rounded-lg overflow-hidden bg-white print:shadow-none print:ring-0 print:rounded-none">
              <ReportDocument
                filteredReqs={filteredReqs}
                startDate={startDate}
                endDate={endDate}
                selectedSectorName={selectedSectorName}
                showCosts={showCosts}
                isAllSectors={selectedSector === "ALL"}
                showCharts={showCharts}
                showTable={showTable}
                showSignatures={showSignatures}
              />
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  // === TELA DE CONFIGURAÇÃO (BUILDER) — layout chapado, sem cards ===
  return (
    <AppShell title="Gerador de Relatórios">
      <div className="flex h-full flex-col -m-4 md:-m-6">
        {/* Conteúdo rolável */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-4xl px-4 py-6 md:px-6">
            <div className="space-y-10">
              {/* SEÇÃO 1: Filtros de Dados */}
              <section>
                <header className="mb-4 flex items-center gap-2">
                  <FunnelIcon className="size-4 text-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Filtros de Dados
                  </h2>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="flex flex-col gap-1.5">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label>Setor</Label>
                    <Select
                      value={selectedSector}
                      onValueChange={(val) => val && setSelectedSector(val)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue>{selectedSectorName}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos os Setores</SelectItem>
                        {sectors.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              {/* SEÇÃO 2: Estrutura do Documento */}
              <section>
                <header className="mb-1 flex items-center gap-2">
                  <Cog6ToothIcon className="size-4 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Estrutura do Documento
                  </h2>
                </header>
                <p className="mb-2 text-sm text-muted-foreground">
                  Ligue ou desligue as seções do relatório
                </p>

                <div className="divide-y divide-border/60">
                  <label className="flex cursor-pointer items-center justify-between gap-4 py-4 transition-colors active:bg-muted/40 sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">
                        Exibir Custos Financeiros
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Mostra colunas de valor e KPI de custo
                      </p>
                    </div>
                    <Checkbox
                      checked={showCosts}
                      onCheckedChange={(c) => setShowCosts(!!c)}
                      className="scale-125 shrink-0"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-4 py-4 transition-colors active:bg-muted/40 sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">
                        Painel de Gráficos
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Incluir gráficos de barras do consumo
                      </p>
                    </div>
                    <Checkbox
                      checked={showCharts}
                      onCheckedChange={(c) => setShowCharts(!!c)}
                      className="scale-125 shrink-0"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-4 py-4 transition-colors active:bg-muted/40 sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">
                        Tabela de Detalhamento
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Lista os 10 itens mais consumidos
                      </p>
                    </div>
                    <Checkbox
                      checked={showTable}
                      onCheckedChange={(c) => setShowTable(!!c)}
                      className="scale-125 shrink-0"
                    />
                  </label>

                  <label className="flex cursor-pointer items-center justify-between gap-4 py-4 transition-colors active:bg-muted/40 sm:-mx-3 sm:rounded-lg sm:px-3 sm:hover:bg-muted/30">
                    <div className="min-w-0">
                      <p className="font-semibold leading-tight">
                        Campos de Assinatura
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Rodapé para rubrica física e aprovação
                      </p>
                    </div>
                    <Checkbox
                      checked={showSignatures}
                      onCheckedChange={(c) => setShowSignatures(!!c)}
                      className="scale-125 shrink-0"
                    />
                  </label>
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Barra de ação fixa no rodapé — CTA estilo app nativo */}
        <div className="border-t border-border bg-card px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
          <div className="mx-auto max-w-4xl">
            <Button
              onClick={() => setIsPreviewMode(true)}
              size="lg"
              className="h-14 w-full gap-2 rounded-xl text-base font-bold"
            >
              <EyeIcon className="size-6" />
              Gerar e Ver Prévia
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
