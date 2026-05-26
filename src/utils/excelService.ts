import * as XLSX from "xlsx";
import { FinancialTransaction, StockItem, StockTransaction, ExpenseCategory } from "../types";

// Column lists
export const PRODUCT_COLUMNS = [
  "Código do produto",
  "Nome do produto",
  "Categoria",
  "Unidade de medida",
  "Estoque mínimo",
  "Local de armazenamento",
  "Observações"
];

export const STOCK_TX_COLUMNS = [
  "Data",
  "Código do produto",
  "Nome do produto",
  "Tipo", // Entrada ou Saída
  "Quantidade",
  "Valor unitário",
  "Valor total",
  "Fornecedor",
  "Talhão/Cultura",
  "Responsável",
  "Observações"
];

export const CASHFLOW_COLUMNS = [
  "Data",
  "Tipo", // receita ou despesa
  "Categoria",
  "Valor",
  "Descrição",
  "Cultura",
  "Talhão",
  "Fornecedor/Cliente",
  "Observações"
];

/**
 * Validates a sheet format against required header names
 */
export function validateHeaders(headers: string[], required: string[]): { isOk: boolean; missing: string[] } {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const missing = required.filter(
    req => !normalizedHeaders.includes(req.trim().toLowerCase())
  );
  return {
    isOk: missing.length === 0,
    missing
  };
}

/**
 * Parses products from Cadastro_Produtos sheet
 */
export function parseProductsSheet(rows: any[][]): { items: StockItem[]; logs: string[] } {
  const items: StockItem[] = [];
  const logs: string[] = [];

  if (rows.length < 2) {
    logs.push("Aba Cadastro_Produtos está vazia ou sem cabeçalhos.");
    return { items, logs };
  }

  const headers = rows[0].map(h => String(h || "").trim());
  const colIndexes: Record<string, number> = {};
  PRODUCT_COLUMNS.forEach(col => {
    colIndexes[col] = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
  });

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === "")) {
      continue; // Skip blank rows
    }

    const valOf = (colName: string, fallback: any = "") => {
      const idx = colIndexes[colName];
      if (idx !== undefined && idx !== -1 && row[idx] !== undefined) {
        return row[idx];
      }
      return fallback;
    };

    const code = String(valOf("Código do produto") || "").trim();
    const name = String(valOf("Nome do produto") || "").trim();
    if (!code || !name) {
      logs.push(`Cadastro_Produtos Linha ${i + 1}: Código ou Nome do produto ausente. Linha ignorada.`);
      continue;
    }

    const minQty = Number(valOf("Estoque mínimo", 0));
    const item: StockItem = {
      id: code, // parent compatibility id
      code,
      name,
      category: String(valOf("Categoria") || "Insumos").trim(),
      unit: String(valOf("Unidade de medida") || "Un").trim(),
      minQty: isNaN(minQty) ? 0 : minQty,
      location: String(valOf("Local de armazenamento") || "Galpão Principal").trim(),
      notes: String(valOf("Observações") || "").trim(),
      currentQty: 0, // Computed downstream based on movements
      totalValueInStock: 0,
      lastPrice: 0,
      priceTrend: "medio"
    };

    items.push(item);
  }

  logs.push(`✓ Processados ${items.length} produtos do mestre de insumos.`);
  return { items, logs };
}

/**
 * Parses stock movements from Controle_Almoxarifado sheet
 */
export function parseStockTxSheet(rows: any[][]): { txs: StockTransaction[]; logs: string[] } {
  const txs: StockTransaction[] = [];
  const logs: string[] = [];

  if (rows.length < 2) {
    logs.push("Aba Controle_Almoxarifado está vazia ou sem cabeçalhos relevantes.");
    return { txs, logs };
  }

  const headers = rows[0].map(h => String(h || "").trim());
  const colIndexes: Record<string, number> = {};
  STOCK_TX_COLUMNS.forEach(col => {
    colIndexes[col] = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
  });

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === "")) {
      continue;
    }

    const valOf = (colName: string, fallback: any = "") => {
      const idx = colIndexes[colName];
      if (idx !== undefined && idx !== -1 && row[idx] !== undefined) {
        return row[idx];
      }
      return fallback;
    };

    const rawDate = valOf("Data");
    const formattedDate = parseExcelDate(rawDate);
    const itemCode = String(valOf("Código do produto") || "").trim();
    const itemName = String(valOf("Nome do produto") || "").trim();
    const typeStr = String(valOf("Tipo") || "Entrada").trim();
    const qty = Number(valOf("Quantidade", 0));

    if (!itemCode || !qty || isNaN(qty)) {
      logs.push(`Controle_Almoxarifado Linha ${i + 1}: Dados cruciais ausentes (Código ou Quantidade).`);
      continue;
    }

    const unitPrice = Number(valOf("Valor unitário", 0));
    const totalValue = Number(valOf("Valor total") || (qty * unitPrice));

    const tx: StockTransaction = {
      id: "stx-" + i + "-" + Math.random().toString(36).substring(2, 5),
      date: formattedDate,
      itemCode,
      itemName: itemName || itemCode,
      type: (typeStr.toLowerCase() === "saída" || typeStr.toLowerCase() === "saida") ? "Saída" : "Entrada",
      qty: Math.abs(qty),
      unitPrice: isNaN(unitPrice) ? 0 : unitPrice,
      totalValue: isNaN(totalValue) ? 0 : totalValue,
      supplier: String(valOf("Fornecedor") || "").trim(),
      culture: String(valOf("Talhão/Cultura") || "Geral").trim(),
      field: String(valOf("Talhão/Cultura") || "Geral").trim(),
      responsible: String(valOf("Responsável") || "Administrador").trim(),
      notes: String(valOf("Observações") || "").trim()
    };

    txs.push(tx);
  }

  logs.push(`✓ Processadas ${txs.length} movimentações de estoque (Entradas/Saídas).`);
  return { txs, logs };
}

/**
 * Parses financial rows from generic financial arrays
 */
export function parseFinancialRows(rows: any[][], sheetName: string): { txs: FinancialTransaction[]; logs: string[] } {
  const txs: FinancialTransaction[] = [];
  const logs: string[] = [];

  if (rows.length < 2) {
    return { txs, logs };
  }

  const headers = rows[0].map(h => String(h || "").trim());
  const colIndexes: Record<string, number> = {};
  CASHFLOW_COLUMNS.forEach(col => {
    colIndexes[col] = headers.findIndex(h => h.toLowerCase() === col.toLowerCase());
  });

  // Fallbacks in case simple structure loaded
  const findIndexLoose = (names: string[]) => {
    for (let hIndex = 0; hIndex < headers.length; hIndex++) {
      const headerStr = headers[hIndex].toLowerCase();
      if (names.some(n => headerStr.includes(n.toLowerCase()) || n.toLowerCase().includes(headerStr))) {
        return hIndex;
      }
    }
    return -1;
  };

  const getFallbackIdx = (colName: string) => {
    const idx = colIndexes[colName];
    if (idx !== -1) return idx;
    if (colName === "Data") return findIndexLoose(["data", "dia"]);
    if (colName === "Tipo") return findIndexLoose(["tipo", "op", "fluxo"]);
    if (colName === "Categoria") return findIndexLoose(["categoria", "classi"]);
    if (colName === "Valor") return findIndexLoose(["valor", "preço", "custo", "receita", "total"]);
    if (colName === "Descrição") return findIndexLoose(["descri", "item", "detalhe"]);
    if (colName === "Cultura") return findIndexLoose(["cultura", "lavoura", "produto"]);
    if (colName === "Talhão") return findIndexLoose(["talhao", "setor", "campo"]);
    if (colName === "Fornecedor/Cliente") return findIndexLoose(["forned", "cliente", "entid"]);
    return -1;
  };

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every(val => val === null || val === undefined || val === "")) {
      continue;
    }

    const valOf = (colName: string, fallback: any = "") => {
      const idx = getFallbackIdx(colName);
      if (idx !== -1 && row[idx] !== undefined) {
        return row[idx];
      }
      return fallback;
    };

    const typeStr = String(valOf("Tipo") || "").trim().toLowerCase();
    const rawVal = valOf("Valor");
    const val = Number(rawVal);
    const rawDate = valOf("Data");
    const dateFormatted = parseExcelDate(rawDate);

    if (isNaN(val) || val <= 0 || !typeStr) {
      // Small alert log for broken inputs
      if (rawVal !== undefined && rawVal !== "") {
        logs.push(`Aba ${sheetName} Linha ${i + 1}: Valor incorreto ou tipo de fluxo não definido (Lido Tipo:"${typeStr}" Valor:"${rawVal}").`);
      }
      continue;
    }

    const type: 'receita' | 'despesa' = 
      (typeStr.includes("rec") || typeStr.includes("venda") || typeStr.includes("entrada") || typeStr === "r") 
        ? "receita" 
        : "despesa";

    const item: FinancialTransaction = {
      id: `tx-${sheetName}-${i}-${Math.random().toString(36).substring(2, 5)}`,
      date: dateFormatted,
      type,
      category: String(valOf("Categoria") || (type === "receita" ? "Venda de produção" : "Outras Despesas")).trim(),
      value: val,
      description: String(valOf("Descrição") || "Lançamento de Planilha").trim(),
      culture: String(valOf("Cultura") || "Geral").trim(),
      field: String(valOf("Talhão") || "").trim(),
      entity: String(valOf("Fornecedor/Cliente") || "").trim(),
      notes: String(valOf("Observações") || "").trim()
    };

    txs.push(item);
  }

  return { txs, logs };
}

/**
 * Handles converting arbitrary spreadsheet values into secure dates "YYYY-MM-DD"
 */
function parseExcelDate(value: any): string {
  if (!value) {
    return new Date().toISOString().substring(0, 10);
  }

  // Handle SheetJS Date numbers (epoch based 1900)
  if (typeof value === "number") {
    try {
      const dateObj = XLSX.SSF.parse_date_code(value);
      const mm = String(dateObj.m).padStart(2, "0");
      const dd = String(dateObj.d).padStart(2, "0");
      return `${dateObj.y}-${mm}-${dd}`;
    } catch {
      // fallback
    }
  }

  // Handle standard Javascript string conversion
  const str = String(value).trim();
  
  // match formats like DD/MM/YYYY or DD-MM-YYYY
  const matchDmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (matchDmy) {
    let y = matchDmy[3];
    if (y.length === 2) y = "20" + y; // Assume 20xx
    const m = matchDmy[2].padStart(2, "0");
    const d = matchDmy[1].padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // match YYYY-MM-DD
  const matchYmd = str.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
  if (matchYmd) {
    return `${matchYmd[1]}-${matchYmd[2].padStart(2, "0")}-${matchYmd[3].padStart(2, "0")}`;
  }

  // Try parsing directly
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().substring(0, 10);
    }
  } catch {
    // skip
  }

  return new Date().toISOString().substring(0, 10);
}

/**
 * Computes safety levels and active inventory based on master items and raw logs
 */
export function collateInventory(items: StockItem[], movements: StockTransaction[]): StockItem[] {
  // Deep clone to avoid mutating parameters
  const resolvedItems: StockItem[] = items.map(item => ({ ...item, currentQty: 0, totalValueInStock: 0 }));

  // Group transactions by item code
  const txsByCode: Record<string, StockTransaction[]> = {};
  movements.forEach(m => {
    const code = m.itemCode.trim();
    if (!txsByCode[code]) txsByCode[code] = [];
    txsByCode[code].push(m);
  });

  resolvedItems.forEach(item => {
    const code = item.code.trim();
    const itemTxs = txsByCode[code] || [];
    
    // Sort transactions by date ascending to calculate progressive amounts
    itemTxs.sort((a, b) => a.date.localeCompare(b.date));

    let currentQty = 0;
    let avgCost = item.lastPrice || 0;
    let lastPrice = item.lastPrice || 0;

    itemTxs.forEach(tx => {
      if (tx.type === "Entrada") {
        currentQty += tx.qty;
        if (tx.unitPrice > 0) {
          lastPrice = tx.unitPrice;
          // Weighted moving average for inventory valuation
          const totalOldVal = (currentQty - tx.qty) * avgCost;
          const totalNewVal = tx.qty * tx.unitPrice;
          if (currentQty > 0) {
            avgCost = (totalOldVal + totalNewVal) / currentQty;
          } else {
            avgCost = tx.unitPrice;
          }
        }
      } else {
        // Output / Consumo
        // Note: For simplicity, assume safe floor of zero
        currentQty = Math.max(0, currentQty - tx.qty);
      }
    });

    item.currentQty = currentQty;
    item.lastPrice = lastPrice;
    item.totalValueInStock = currentQty * (avgCost || lastPrice);
    
    // Market trends (visual guidance)
    if (item.currentQty < item.minQty) {
      item.priceTrend = "baixo"; // Mark high priority buy window
    } else if (item.currentQty > item.minQty * 2.5) {
      item.priceTrend = "alto"; // Do not buy
    } else {
      item.priceTrend = "medio";
    }
  });

  return resolvedItems;
}

/**
 * Creates and downloads a 100% compliant demo excel template with sample records
 */
export function downloadExcelTemplate() {
  const wb = XLSX.utils.book_new();

  // 1. README Sheet
  const readmeData = [
    ["PLANILHA BANCO DE DADOS - GESTÃO AGRÍCOLA GERENCIAL"],
    ["Esta planilha funciona como o banco de dados mestre de sua propriedade."],
    ["Você pode carregá-la diretamente no painel para importar todos os registros organizados."],
    ["Adicione novos lançamentos nas respectivas abas ou use os formulários na tela."],
    ["Tudo atualizado pode ser exportado de volta em uma nova cópia desta planilha!"],
    [],
    ["ABAS OBRIGATÓRIAS:"],
    ["- Cadastro_Produtos: Lista mestre de insumos no almoxarifado"],
    ["- Controle_Almoxarifado: Histórico de entradas (compras) e saídas (consumo)"],
    ["- Fluxo_Financeiro: Banco de dados unificado de receitas e despesas"],
    ["- Janeiro a Dezembro: Lançamentos financeiros mensais específicos"],
    [],
    ["Instruções: Não altere os nomes das colunas de cabeçalho da linha 1 para garantir a leitura correta."]
  ];
  const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
  XLSX.utils.book_append_sheet(wb, wsReadme, "README");

  // 2. Cadastro_Produtos Sheet
  const prodData = [
    PRODUCT_COLUMNS,
    ["HERB-01", "Glifosato Herbicida de Base", "Defensivos", "Litros", 250, "Galpão Principal A", "Uso emergencial antes do plantio"],
    ["FUNG-02", "Fungicida Systemic Pro", "Defensivos", "Litros", 150, "Câmara Climatizada", "Evitar umidade alta de armazenagem"],
    ["ADU-03", "NPK 04-14-08 Fertilizante", "Fertilizantes", "Kg", 15000, "Depósito de Adubo", "Insumo indispensável de cobertura"],
    ["MIL-SEMENTE", "Semente de Milho Híbrido", "Insumos", "Sacos", 40, "Galpão Principal B", "Sementes certificadas safrinha"],
    ["COMBUST", "Óleo Diesel S10", "Combustível", "Litros", 500, "Tanque Central de Abastecimento", "Abastecimento frotas de tratores"]
  ];
  const wsProds = XLSX.utils.aoa_to_sheet(prodData);
  XLSX.utils.book_append_sheet(wb, wsProds, "Cadastro_Produtos");

  // 3. Controle_Almoxarifado Sheet
  const stockTxData = [
    STOCK_TX_COLUMNS,
    ["2026-01-10", "ADU-03", "NPK 04-14-08 Fertilizante", "Entrada", 20000, 3.2, 64000, "Fertilizantes Brasil Ltda", "Geral", "Yann Xavier", "Compra em lote facilitada"],
    ["2026-02-15", "MIL-SEMENTE", "Semente de Milho Híbrido", "Entrada", 60, 240, 14400, "Sementes Agro", "Milho", "Ayrton Silva", "Para plantio da Safrinha"],
    ["2026-03-05", "HERB-01", "Glifosato Herbicida de Base", "Entrada", 300, 65, 19500, "Agroquímica Sul", "Geral", "Yann Xavier", "Compra planejada regular"],
    ["2026-03-12", "ADU-03", "NPK 04-14-08 Fertilizante", "Saída", 12000, 3.2, 38400, "", "Milho", "Rodrigo M.", "Adubação Milho Safrinha Talhão 1"],
    ["2026-04-10", "HERB-01", "Glifosato Herbicida de Base", "Saída", 150, 65, 9750, "", "Soja", "Rodrigo M.", "Controle de invasoras Talhão 3"]
  ];
  const wsStockTx = XLSX.utils.aoa_to_sheet(stockTxData);
  XLSX.utils.book_append_sheet(wb, wsStockTx, "Controle_Almoxarifado");

  // 4. Fluxo_Financeiro Sheet
  const financeData = [
    CASHFLOW_COLUMNS,
    ["2026-04-15", "receita", "Venda de produção", 320000, "Venda de lote de Soja Cooperativa Regional (130t)", "Soja", "Talhão 2", "Cooperativa Agro", "Venda do grão limpo"],
    ["2026-05-10", "receita", "Venda de produção", 125000, "Venda de produção de Milho Safrinha", "Milho", "Talhão 1", "Grãos Brasil", "Milho entregue seco"],
    ["2026-05-20", "receita", "Venda de produção", 450000, "Contrato de entrega de Café Arábica beneficiado", "Café", "Lote Principal", "Exportadora GrãoFino", "Saca tipo exportação especial"],
    ["2026-01-10", "despesa", "Fertilizantes", 64000, "Compra antecipada de adubo mineral NPK de base", "Soja", "Geral", "Fertilizantes Brasil Ltda", "Compra cadastrada no almoxarifado"],
    ["2026-02-15", "despesa", "Insumos", 14400, "Aquisição Sementes Milho Safrinha", "Milho", "Talhão 1", "Sementes Agro", "Entrada em lote"],
    ["2026-03-05", "despesa", "Defensivos", 19500, "Herbicidas pré-emergentes distribuidora local", "Soja", "Geral", "Agroquímica Sul", "Faturada para safra cheia"],
    ["2026-03-15", "despesa", "Combustível", 18500, "Abastecimento do tanque central Diesel S10 (3500L)", "Geral", "Geral", "Rede Posto Rural", "Diesel maquinário integral"],
    ["2026-04-02", "despesa", "Mão de obra contratada", 12000, "Prestação de serviços colheita temporários", "Geral", "Lote Principal", "Trabalhadores Sazonais", "Equipe de apoio manual"],
    ["2026-05-15", "despesa", "Manutenção", 7500, "Revisão e troca de bicos do Pulverizador Jacto", "Soja", "Geral", "Mecânica Agrícola", "Bicos buster novos"]
  ];
  const wsFinance = XLSX.utils.aoa_to_sheet(financeData);
  XLSX.utils.book_append_sheet(wb, wsFinance, "Fluxo_Financeiro");

  // 5. Monthly sheets with subset records
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  
  months.forEach((mStr, idx) => {
    // Generate subset rows belonging to this month
    const mRows: any[][] = [CASHFLOW_COLUMNS];
    
    // Add real mock items matching dates for standard representation
    financeData.slice(1).forEach(row => {
      const rowDateStr = String(row[0]);
      const rowMonth = parseInt(rowDateStr.split("-")[1], 10);
      if (rowMonth === idx + 1) {
        mRows.push(row);
      }
    });

    const wsMonth = XLSX.utils.aoa_to_sheet(mRows);
    XLSX.utils.book_append_sheet(wb, wsMonth, mStr);
  });

  // 6. Listas tab for helper categories
  const wsListas = XLSX.utils.aoa_to_sheet([
    ["Categorias_Fluxo", "Culturas_Habilitadas"],
    ["Mão de obra contratada", "Soja"],
    ["Mão de obra familiar", "Milho"],
    ["Mecanização", "Café"],
    ["Insumos", "Outros"],
    ["Defensivos", "Geral"],
    ["Combustível"],
    ["Energia elétrica"],
    ["Internet"],
    ["Manutenção"],
    ["Impostos"]
  ]);
  XLSX.utils.book_append_sheet(wb, wsListas, "Listas");

  // Write file out
  XLSX.writeFile(wb, "Modelo_BancoDados_GestaoAgricola.xlsx");
}

/**
 * Builds and downloads an Excel file containing current runtime logs and state
 */
export function exportCurrentStateToExcel(
  products: StockItem[],
  stockTxs: StockTransaction[],
  financeTxs: FinancialTransaction[]
) {
  const wb = XLSX.utils.book_new();

  // 1. README info
  const readmeData = [
    ["SISTEMA DE GESTÃO AGRÍCOLA GERENCIAL - BANCO DE DADOS EXPORTADO"],
    [`Gerado em: ${new Date().toLocaleString()}`],
    ["Responsável: Yann Xavier"],
    ["Propriedades ativas salvas com sucesso no formato mestre."],
    [],
    ["Status do Almoxarifado:"],
    [`- Total de Produtos Cadastrados: ${products.length}`],
    [`- Total de Movimentações: ${stockTxs.length}`],
    ["Status Financeiro:"],
    [`- Total de Lançamentos de Caixa: ${financeTxs.length}`],
    [],
    ["Assegure-se de manter esta planilha em ambiente seguro. Ela pode ser re-importada a qualquer momento."]
  ];
  const wsReadme = XLSX.utils.aoa_to_sheet(readmeData);
  XLSX.utils.book_append_sheet(wb, wsReadme, "README");

  // 2. Cadastro_Produtos
  const prodRows: any[][] = [PRODUCT_COLUMNS];
  products.forEach(item => {
    prodRows.push([
      item.code,
      item.name,
      item.category,
      item.unit,
      item.minQty,
      item.location,
      item.notes
    ]);
  });
  const wsProds = XLSX.utils.aoa_to_sheet(prodRows);
  XLSX.utils.book_append_sheet(wb, wsProds, "Cadastro_Produtos");

  // 3. Controle_Almoxarifado
  const stockTxRows: any[][] = [STOCK_TX_COLUMNS];
  stockTxs.forEach(tx => {
    stockTxRows.push([
      tx.date,
      tx.itemCode,
      tx.itemName,
      tx.type,
      tx.qty,
      tx.unitPrice,
      tx.totalValue,
      tx.supplier || "",
      tx.culture || "",
      tx.responsible || "",
      tx.notes || ""
    ]);
  });
  const wsStockTxs = XLSX.utils.aoa_to_sheet(stockTxRows);
  XLSX.utils.book_append_sheet(wb, wsStockTxs, "Controle_Almoxarifado");

  // 4. Fluxo_Financeiro
  const financeRows: any[][] = [CASHFLOW_COLUMNS];
  financeTxs.forEach(tx => {
    financeRows.push([
      tx.date,
      tx.type,
      tx.category,
      tx.value,
      tx.description,
      tx.culture,
      tx.field || "",
      tx.entity || "",
      tx.notes || ""
    ]);
  });
  const wsFinance = XLSX.utils.aoa_to_sheet(financeRows);
  XLSX.utils.book_append_sheet(wb, wsFinance, "Fluxo_Financeiro");

  // 5. Monthly divided tables
  const months = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  months.forEach((mStr, idx) => {
    const mRows: any[][] = [CASHFLOW_COLUMNS];
    
    // Sort transactions chronologically
    const sortedTxs = [...financeTxs].sort((a, b) => a.date.localeCompare(b.date));

    sortedTxs.forEach(tx => {
      const parts = tx.date.split("-");
      if (parts.length >= 2) {
        const mVal = parseInt(parts[1], 10);
        if (mVal === idx + 1) {
          mRows.push([
            tx.date,
            tx.type,
            tx.category,
            tx.value,
            tx.description,
            tx.culture,
            tx.field || "",
            tx.entity || "",
            tx.notes || ""
          ]);
        }
      }
    });

    const wsMonth = XLSX.utils.aoa_to_sheet(mRows);
    XLSX.utils.book_append_sheet(wb, wsMonth, mStr);
  });

  XLSX.writeFile(wb, `BancoDados_Sincronizado_Fazenda_${new Date().toISOString().substring(0,10)}.xlsx`);
}
