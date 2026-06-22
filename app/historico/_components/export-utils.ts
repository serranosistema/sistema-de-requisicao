export function formatDatePTBR(iso: string | Date) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}

// A tipagem exata que vem do banco de dados
export interface FullRequisition {
  id: string;
  createdAt: Date;
  status: string;
  sector: { id: string; name: string; code: string };
  items: {
    id: string;
    quantity: number;
    item: { id: string; name: string; code: string; unit: string };
  }[];
}

export const exportCSV = (reqs: FullRequisition[], title: string) => {
  // Atualizado com as colunas de Códigos
  let csvContent =
    "Data,Cod. Setor,Setor,Status,Cod. Insumo,Insumo,Quantidade,Unidade\n";

  reqs.forEach((req) => {
    const data = formatDatePTBR(req.createdAt);
    const codSetor = req.sector.code;
    const setor = req.sector.name;
    const status = req.status;

    req.items.forEach((reqItem) => {
      const codInsumo = reqItem.item.code;
      const nomeInsumo = reqItem.item.name;
      const qtd = reqItem.quantity;
      const un = reqItem.item.unit;
      csvContent += `"${data}","${codSetor}","${setor}","${status}","${codInsumo}","${nomeInsumo}","${qtd}","${un}"\n`;
    });
  });

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${title}.csv`;
  link.click();
};

export const exportPDF = (reqs: FullRequisition[], title: string) => {
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
      <div class="sector-title">
        Setor: [${req.sector.code}] ${req.sector.name} | Data: ${formatDatePTBR(req.createdAt)}
      </div>
      <table>
        <thead>
          <tr>
            <th>Cód.</th>
            <th>Insumo</th>
            <th>Qtd.</th>
            <th>Unidade</th>
          </tr>
        </thead>
        <tbody>
          ${req.items
            .map(
              (reqItem) => `
            <tr>
              <td>${reqItem.item.code}</td>
              <td>${reqItem.item.name}</td>
              <td>${reqItem.quantity}</td>
              <td>${reqItem.item.unit}</td>
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

  setTimeout(() => {
    printWindow.print();
  }, 250);
};
