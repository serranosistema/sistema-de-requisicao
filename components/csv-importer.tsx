"use client";

import { useRef } from "react";
import { ArrowUpTrayIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";

export interface SmartImportData {
  items: {
    code: string;
    name: string;
    unit: string;
    sectorCodes: string[];
  }[];
  sectors: {
    code: string;
    name: string;
  }[];
}

// O segredo: Esta função ignora as vírgulas que estão dentro de aspas duplas!
function parseCSVLine(text: string, delimiter: string) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function CsvImporter({
  onImport,
}: {
  onImport: (data: SmartImportData) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;

      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l);
      if (lines.length < 2) return;

      const delimiter = lines[0].includes(";") ? ";" : ",";
      const headers = lines[0]
        .split(delimiter)
        .map((h) => h.trim().toLowerCase());

      const idxCodItem = headers.findIndex(
        (h) => h.includes("cod") && !h.includes("setor"),
      );
      const idxDescItem = headers.findIndex((h) => h.includes("desc"));
      const idxUnit = headers.findIndex((h) => h.includes("uni"));
      const idxCodSetor = headers.findIndex(
        (h) => h.includes("cod") && h.includes("setor"),
      );
      const idxNomeSetor = headers.findIndex(
        (h) => h.includes("nome") && h.includes("setor"),
      );

      const itemsMap = new Map();
      const sectorsMap = new Map();

      for (let i = 1; i < lines.length; i++) {
        // Usando a nova função blindada no lugar do .split() simples
        const cols = parseCSVLine(lines[i], delimiter).map((c) =>
          c.replace(/^"|"$/g, ""),
        );

        const codItem = cols[idxCodItem];
        const descItem = cols[idxDescItem];
        const unit = cols[idxUnit] || "UN";
        const codSetor = cols[idxCodSetor];
        const nomeSetor = cols[idxNomeSetor];

        if (!codItem) continue;

        if (codSetor && nomeSetor) {
          if (!sectorsMap.has(codSetor.toUpperCase())) {
            sectorsMap.set(codSetor.toUpperCase(), {
              code: codSetor,
              name: nomeSetor,
            });
          }
        }

        const itemKey = codItem.toUpperCase();
        if (!itemsMap.has(itemKey)) {
          itemsMap.set(itemKey, {
            code: codItem,
            name: descItem || "Sem descrição",
            unit: unit.toUpperCase(),
            sectorCodes: codSetor ? new Set([codSetor]) : new Set(),
          });
        } else {
          if (codSetor) itemsMap.get(itemKey).sectorCodes.add(codSetor);
        }
      }

      const finalItems = Array.from(itemsMap.values()).map((it) => ({
        ...it,
        sectorCodes: Array.from(it.sectorCodes),
      }));
      const finalSectors = Array.from(sectorsMap.values());

      onImport({ items: finalItems, sectors: finalSectors });

      if (fileRef.current) fileRef.current.value = "";
    };
    reader.readAsText(file);
  }

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        className="gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
      >
        <ArrowUpTrayIcon className="size-4" />
        <span className="hidden sm:inline">Importar Planilha</span>
      </Button>
    </>
  );
}
