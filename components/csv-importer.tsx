"use client";

import { useState, useRef } from "react";
import {
  ArrowUpTrayIcon,
  DocumentArrowUpIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Interface atualizada usando os códigos dos setores
export interface ParsedCSVItem {
  code: string;
  name: string;
  unit: string;
  sectorCodes: string[];
  cost?: number;
}

interface CsvImporterProps {
  onImport: (data: ParsedCSVItem[]) => void;
}

export function CsvImporter({ onImport }: CsvImporterProps) {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setError("Por favor, envie um arquivo .csv válido.");
      return;
    }

    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "");

      if (lines.length < 2) {
        setError("O arquivo parece estar vazio ou não possui linhas de dados.");
        return;
      }

      const separator = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0]
        .toLowerCase()
        .split(separator)
        .map((h) => h.trim());

      // MAPEAMENTO DE COLUNAS (Agora à prova de acentuação e Excel)
      const codeIdx = headers.findIndex(
        (h) =>
          h === "código" ||
          h === "codigo" ||
          h === "referência" ||
          h === "referencia",
      );
      const nameIdx = headers.findIndex(
        (h) =>
          h === "nome" ||
          h === "insumo" ||
          h === "descrição" ||
          h === "descricao",
      );
      const unitIdx = headers.findIndex((h) => h === "unidade" || h === "und");
      const sectorIdx = headers.findIndex(
        (h) =>
          h === "cod setor" ||
          h === "cód setor" ||
          h === "setores" ||
          h === "setor",
      );
      const costIdx = headers.findIndex(
        (h) => h === "custo" || h === "preço" || h === "preco" || h === "valor",
      );

      // Validação de colunas obrigatórias
      if (codeIdx === -1 || nameIdx === -1 || unitIdx === -1) {
        setError(
          "O CSV precisa ter obrigatoriamente as colunas: Código, Nome e Unidade.",
        );
        return;
      }

      const parsedData: ParsedCSVItem[] = [];

      for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split(separator).map((col) => col.trim());
        if (columns.length < 3) continue;

        const code = columns[codeIdx];
        const name = columns[nameIdx];
        const unit = columns[unitIdx];
        const rawSectorCode = sectorIdx !== -1 ? columns[sectorIdx] : "";

        // SEPARA OS CÓDIGOS DOS SETORES POR VÍRGULA, BARRA OU PIPE
        const sectorCodes = rawSectorCode
          .split(/[/|,]+/) // Divide usando / ou | ou ,
          .map((s) => s.trim())
          .filter(Boolean); // Remove espaços vazios

        let cost: number | undefined = undefined;
        if (costIdx !== -1 && columns[costIdx]) {
          const parsedCost = parseFloat(columns[costIdx].replace(",", "."));
          if (!isNaN(parsedCost)) cost = parsedCost;
        }

        // Valida se as colunas essenciais existem na linha
        if (code && name && unit) {
          parsedData.push({ code, name, unit, sectorCodes, cost });
        }
      }

      if (parsedData.length === 0) {
        setError("Nenhum dado válido pôde ser extraído deste arquivo.");
        return;
      }

      onImport(parsedData);
      setOpen(false); // Fecha modal no final
    } catch (err) {
      setError(
        "Ocorreu um erro ao processar o arquivo. Verifique se o formato está legível.",
      );
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2" />}>
        <ArrowUpTrayIcon className="size-4" />
        <span className="hidden sm:inline">Importar via CSV</span>
        <span className="sm:hidden">Importar</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importar Insumos</DialogTitle>
        </DialogHeader>

        <div className="mt-2 flex flex-col gap-4">
          <p className="text-sm text-muted-foreground text-pretty">
            O arquivo CSV deve conter:{" "}
            <strong className="text-foreground">Código, Nome, Unidade</strong>{" "}
            (Obrigatórios).
            <br />E as colunas opcionais:{" "}
            <strong className="text-foreground">
              Cod Setor, Nome do Setor, Custo
            </strong>
            .<br />
            <em className="block mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
              Dica: O sistema utiliza o <strong>Cod Setor</strong> para fazer o
              vínculo real. A coluna <strong>Nome do Setor</strong> serve apenas
              para sua organização visual na planilha. Se for mais de um setor,
              separe por barra (ex: Cod: 101 / 102 | Nome: Coz / Pad).
            </em>
          </p>

          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={cn(
              "relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:bg-muted/50",
            )}
          >
            <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <DocumentArrowUpIcon className="size-7" />
            </div>
            <div>
              <p className="font-medium">Arraste e solte o seu arquivo aqui</p>
              <p className="mt-1 text-sm text-muted-foreground">
                ou clique para selecionar do computador
              </p>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            />
            <Button
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
            >
              Selecionar Arquivo
            </Button>
          </div>

          {error && (
            <div className="flex items-center gap-3 rounded-xl bg-destructive/15 px-4 py-3 text-sm text-destructive">
              <XMarkIcon className="size-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
