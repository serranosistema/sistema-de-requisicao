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

  // === TELA DE CONFIGURAÇÃO (BUILDER) ===
  return (
    <AppShell title="Gerador de Relatórios">
      <div className="mx-auto max-w-4xl pb-24 space-y-6">
        {/* BLOCO 1: Filtros de Dados */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-primary/10 p-3 text-primary">
              <FunnelIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Filtros de Dados</h2>
              <p className="text-sm text-muted-foreground">
                Escolha o período e os setores a analisar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col gap-2">
              <Label>Data Inicial</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Data Final</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Setor</Label>
              <Select
                value={selectedSector}
                onValueChange={(val) => val && setSelectedSector(val)}
              >
                <SelectTrigger className="h-11">
                  {/* MÁGICA AQUI: Forçamos a exibição do nome em vez de deixar o componente tentar adivinhar */}
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
        </div>

        {/* BLOCO 2: Personalização do Visual */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-indigo-500/10 p-3 text-indigo-600 dark:text-indigo-400">
              <Cog6ToothIcon className="size-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Estrutura do Documento</h2>
              <p className="text-sm text-muted-foreground">
                Ligue ou desligue as seções do relatório
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
              <div>
                <p className="font-semibold">Exibir Custos Financeiros</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Mostra colunas de valor e KPI de custo
                </p>
              </div>
              <Checkbox
                checked={showCosts}
                onCheckedChange={(c) => setShowCosts(!!c)}
                className="scale-125"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
              <div>
                <p className="font-semibold">Painel de Gráficos</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Incluir gráficos de barras do consumo
                </p>
              </div>
              <Checkbox
                checked={showCharts}
                onCheckedChange={(c) => setShowCharts(!!c)}
                className="scale-125"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
              <div>
                <p className="font-semibold">Tabela de Detalhamento</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lista os 10 itens mais consumidos
                </p>
              </div>
              <Checkbox
                checked={showTable}
                onCheckedChange={(c) => setShowTable(!!c)}
                className="scale-125"
              />
            </label>

            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
              <div>
                <p className="font-semibold">Campos de Assinatura</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Rodapé para rubrica física e aprovação
                </p>
              </div>
              <Checkbox
                checked={showSignatures}
                onCheckedChange={(c) => setShowSignatures(!!c)}
                className="scale-125"
              />
            </label>
          </div>
        </div>

        {/* BLOCO 3: Botão Flutuante/Fixo de Ação */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => setIsPreviewMode(true)}
            size="lg"
            className="w-full sm:w-auto gap-2 font-bold h-14 rounded-xl text-base"
          >
            <EyeIcon className="size-6" />
            Gerar e Ver Prévia
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
