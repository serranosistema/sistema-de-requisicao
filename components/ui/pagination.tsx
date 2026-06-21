"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  // Se só houver uma página ou nenhuma, não faz sentido renderizar a paginação
  if (totalPages <= 1) return null;

  // Lógica para gerar os números das páginas com reticências (...) dinâmicas
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Sempre renderiza a primeira página
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) {
          pages.push(i);
        }
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Sempre renderiza a última página
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <nav
      role="navigation"
      aria-label="Paginação de dados"
      className={cn("flex items-center justify-center gap-1.5 py-4", className)}
    >
      {/* Botão Voltar */}
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-40 active:translate-y-px"
        aria-label="Página anterior"
      >
        <ChevronLeftIcon className="size-5" />
      </button>

      {/* Números das Páginas */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === "...") {
            return (
              <span
                key={`ellipsis-${index}`}
                className="flex size-10 items-center justify-center text-sm text-muted-foreground"
              >
                &bull;&bull;&bull;
              </span>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page as number)}
              aria-current={isCurrent ? "page" : undefined}
              className={cn(
                "flex size-10 items-center justify-center rounded-xl text-sm font-medium transition-all active:translate-y-px",
                isCurrent
                  ? "bg-primary text-primary-foreground shadow-sm font-semibold"
                  : "border border-border bg-card text-foreground hover:bg-muted",
              )}
            >
              {page}
            </button>
          );
        })}
      </div>

      {/* Botão Avançar */}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-all hover:bg-muted disabled:pointer-events-none disabled:opacity-40 active:translate-y-px"
        aria-label="Próxima página"
      >
        <ChevronRightIcon className="size-5" />
      </button>
    </nav>
  );
}
