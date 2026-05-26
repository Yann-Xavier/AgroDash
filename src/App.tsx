import React, { useState, useEffect } from "react";
import { 
  FinancialTransaction, StockItem, StockTransaction, 
  TransactionType, ExpenseCategory 
} from "./types";
import SummaryCards from "./components/SummaryCards";
import ExpenseAnalysis from "./components/ExpenseAnalysis";
import StockManagement from "./components/StockManagement";
import TransactionForm from "./components/TransactionForm";
import AiConsultant from "./components/AiConsultant";
import LoginScreen from "./components/LoginScreen";
import SourceDataModule from "./components/SourceDataModule";
import { sendNativeNotification } from "./utils/tauriBridge";
import { 
  Sprout, Calendar, User, Sliders, RefreshCw, 
  ArrowUpRight, ArrowDownRight, ClipboardList, LogOut, Database, ListCollapse,
  Home, LayoutDashboard, Boxes, FileSpreadsheet, Cpu, ChevronRight, Menu, X, Eye, HelpCircle, Download
} from "lucide-react";
import { 
  parseProductsSheet, 
  parseStockTxSheet, 
  parseFinancialRows, 
  collateInventory, 
  exportCurrentStateToExcel,
  downloadExcelTemplate,
  PRODUCT_COLUMNS,
  STOCK_TX_COLUMNS,
  CASHFLOW_COLUMNS
} from "./utils/excelService";

// Pre-populated default spreadsheet representations
const INITIAL_DEMO_SHEETS: Record<string, any[][]> = {
  "Cadastro_Produtos": [
     PRODUCT_COLUMNS,
     ["HERB-01", "Glifosato Herbicida de Base", "Defensivos", "Litros", 250, "Galpão Principal A", "Uso emergencial antes do plantio"],
     ["FUNG-02", "Fungicida Systemic Pro", "Defensivos", "Litros", 150, "Câmara Climatizada", "Evitar umidade alta de armazenagem"],
     ["ADU-03", "NPK 04-14-08 Fertilizante", "Fertilizantes", "Kg", 15000, "Depósito de Adubo", "Insumo indispensável de cobertura"],
     ["MIL-SEMENTE", "Semente de Milho Híbrido", "Insumos", "Sacos", 40, "Galpão Principal B", "Sementes certificadas safrinha"],
     ["COMBUST", "Óleo Diesel S10", "Combustível", "Litros", 500, "Tanque Central de Abastecimento", "Abastecimento frotas de tratores"]
  ],
  "Controle_Almoxarifado": [
    STOCK_TX_COLUMNS,
    ["2026-01-20", "HERB-01", "Glifosato Herbicida de Base", "Entrada", 100, 65, 6500, "Agroquímica Sul", "Geral", "Yann Xavier", "Compra planejada regular"],
    ["2026-03-05", "HERB-01", "Glifosato Herbicida de Base", "Saída", 120, 0, 0, "", "Soja", "Rodrigo M.", "Preparação de canteiros"],
    ["2026-01-10", "ADU-03", "NPK 04-14-08 Fertilizante", "Entrada", 20000, 3.2, 64000, "Fertilizantes Brasil Ltda", "Geral", "Yann Xavier", "Compra em lote facilitada"],
    ["2026-04-12", "ADU-03", "NPK 04-14-08 Fertilizante", "Saída", 12000, 3.2, 38400, "", "Milho", "Rodrigo M.", "Adubação Milho Safrinha"]
  ],
  "Fluxo_Financeiro": [
    CASHFLOW_COLUMNS,
    ["2026-04-15", "receita", "Venda de produção", 320000, "Venda de lote de Soja Cooperativa Regional (130t)", "Soja", "Talhão 2", "Cooperativa Agro", ""],
    ["2026-05-10", "receita", "Venda de produção", 125000, "Venda de produção de Milho Safrinha", "Milho", "Talhão 1", "Grãos Brasil", ""],
    ["2026-05-20", "receita", "Venda de produção", 450000, "Contrato de entrega de Café Arábica beneficiado", "Café", "Lote Principal", "Exportadora GrãoFino", ""],
    ["2026-01-10", "despesa", "Fertilizantes", 64000, "Compra antecipada de adubo mineral NPK de base", "Soja", "Geral", "Fertilizantes Brasil", ""],
    ["2026-02-15", "despesa", "Insumos", 14400, "Sementes Milho Híbrido Safrinha", "Milho", "Talhão 1", "Sementes Agro", ""],
    ["2026-03-05", "despesa", "Defensivos", 19500, "Herbicidas pré-emergentes distribuidora local", "Soja", "Geral", "Agroquímica Sul", ""],
    ["2026-03-15", "despesa", "Combustível", 18500, "Abastecimento do tanque central Diesel S10 (3500L)", "Geral", "Geral", "Rede Posto Rural", ""],
    ["2026-04-02", "despesa", "Mão de obra contratada", 12000, "Prestação de serviços colheita temporários", "Geral", "Lote Principal", "Trabalhadores Sazonais", ""],
    ["2026-05-15", "despesa", "Manutenção", 7500, "Revisão e troca de bicos do Pulverizador Jacto", "Soja", "Geral", "Mecânica Agrícola", ""]
  ]
};

export default function App() {
  const [userSession, setUserSession] = useState<string | null>(null);

  // Navigation and Sidebar state in line with mockup specification
  const [activeTab, setActiveTab] = useState<"inicio" | "financeiro" | "estoque" | "planilha" | "ai_consultant">("inicio");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Main data states
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  
  // Sheet Explorer states
  const [rawSheets, setRawSheets] = useState<Record<string, any[][]>>(INITIAL_DEMO_SHEETS);
  const [activeFileName, setActiveFileName] = useState<string>("");

  const [selectedCulture, setSelectedCulture] = useState<string>("Todas");
  const [loading, setLoading] = useState(true);
  const [updateAiCounter, setUpdateAiCounter] = useState(0);

  // Initialize and load default state or fetched database values
  const loadData = async () => {
    try {
      const resp = await fetch("/api/data");
      const data = await resp.json();
      
      // Merge with default seed data
      const dbTxs = data.transactions && data.transactions.length > 0 ? data.transactions : [];
      const dbStockItems = data.stockItems && data.stockItems.length > 0 ? data.stockItems : [];
      const dbStockTxs = data.stockTransactions && data.stockTransactions.length > 0 ? data.stockTransactions : [];

      bootstrapStates(dbTxs, dbStockItems, dbStockTxs);
    } catch (err) {
      console.warn("Utilizando banco de dados offline local padrão.");
      bootstrapStates([], [], []);
    } finally {
      setLoading(false);
    }
  };

  const bootstrapStates = (extraTxs: any[], extraItems: any[], extraStockTxs: any[]) => {
    // 1. Process Initial Stock Products
    const baseItemsRaw = INITIAL_DEMO_SHEETS["Cadastro_Produtos"];
    const parsedProdsResult = parseProductsSheet(baseItemsRaw);
    let masterItems: StockItem[] = parsedProdsResult.items.map(p => ({
      ...p,
      id: p.code // preserve compatibility
    }));

    if (extraItems.length > 0) {
      extraItems.forEach(item => {
        if (!masterItems.some(existing => existing.code === item.code)) {
          masterItems.push({ ...item, id: item.code });
        }
      });
    }

    // 2. Process Initial Stock Transactions
    const baseStockTxsRaw = INITIAL_DEMO_SHEETS["Controle_Almoxarifado"];
    const parsedStockTxsResult = parseStockTxSheet(baseStockTxsRaw);
    let movements: StockTransaction[] = parsedStockTxsResult.txs;

    if (extraStockTxs.length > 0) {
      extraStockTxs.forEach(tx => {
        if (!movements.some(existing => existing.id === tx.id)) {
          movements.push(tx);
        }
      });
    }

    // 3. Process Initial Financial list
    const baseFinanceRaw = INITIAL_DEMO_SHEETS["Fluxo_Financeiro"];
    const parsedFinanceResult = parseFinancialRows(baseFinanceRaw, "Fluxo_Financeiro");
    let cashFlows: FinancialTransaction[] = parsedFinanceResult.txs;

    if (extraTxs.length > 0) {
      extraTxs.forEach(tx => {
        if (!cashFlows.some(existing => existing.id === tx.id)) {
          cashFlows.push(tx);
        }
      });
    }

    // Sort cashflows reverse chronologically
    cashFlows.sort((a,b) => b.date.localeCompare(a.date));
    movements.sort((a,b) => b.date.localeCompare(a.date));

    // Dynamic collation of physical levels
    const finalItems = collateInventory(masterItems, movements).map(item => ({
      ...item,
      id: item.code // back-compatibility
    }));

    setTransactions(cashFlows);
    setStockItems(finalItems);
    setStockTransactions(movements);
  };

  useEffect(() => {
    if (userSession) {
      loadData();
    }
  }, [userSession]);

  /**
   * Action trigger when custom excel file is uploaded
   */
  const handleSpreadsheetLoaded = (data: {
    sheetsList: string[];
    rawSheets: Record<string, any[][]>;
    fileName: string;
  }) => {
    setRawSheets(data.rawSheets);
    setActiveFileName(data.fileName);

    // 1. Parse products
    let masterItems: StockItem[] = [];
    if (data.rawSheets["Cadastro_Produtos"]) {
      const parsed = parseProductsSheet(data.rawSheets["Cadastro_Produtos"]);
      masterItems = parsed.items.map(p => ({ ...p, id: p.code }));
    }

    // 2. Parse stock movements
    let movements: StockTransaction[] = [];
    if (data.rawSheets["Controle_Almoxarifado"]) {
      const parsed = parseStockTxSheet(data.rawSheets["Controle_Almoxarifado"]);
      movements = parsed.txs;
    }

    // 3. Parse financial entries (prioritize Fluxo_Financeiro tab, else accumulate monthly tabs)
    let cashFlows: FinancialTransaction[] = [];
    if (data.rawSheets["Fluxo_Financeiro"]) {
      const parsed = parseFinancialRows(data.rawSheets["Fluxo_Financeiro"], "Fluxo_Financeiro");
      cashFlows = parsed.txs;
    } else {
      const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      months.forEach(m => {
        if (data.rawSheets[m]) {
          const parsed = parseFinancialRows(data.rawSheets[m], m);
          cashFlows = [...cashFlows, ...parsed.txs];
        }
      });
    }

    // Re-collate stock and update state variables
    const calculatedItems = collateInventory(masterItems, movements).map(item => ({
      ...item,
      id: item.code
    }));

    // Sort views
    cashFlows.sort((a,b) => b.date.localeCompare(a.date));
    movements.sort((a,b) => b.date.localeCompare(a.date));

    setTransactions(cashFlows);
    setStockItems(calculatedItems);
    setStockTransactions(movements);
    setUpdateAiCounter(c => c + 1); // trigger AI update
    sendNativeNotification("Planilha Carregada!", `Sucesso ao importar dados de ${data.fileName}`);
  };

  /**
   * Add a new financial transaction (receitas/despesas) locally
   */
  const handleAddTransaction = async (data: {
    date: string;
    type: TransactionType;
    category: ExpenseCategory | "Venda de produção" | string;
    value: number;
    description: string;
    culture: string;
  }) => {
    const newTx: FinancialTransaction = {
      id: "local-" + Math.random().toString(36).substring(2, 9),
      date: data.date,
      type: data.type,
      category: data.category,
      value: Number(data.value),
      description: data.description || `${data.category} - Lançamento`,
      culture: data.culture || "Geral",
      field: "Talhão 1",
      entity: "Direto da propriedade",
      notes: "Adicionado via painel de lançamentos rápidos"
    };

    setTransactions(prev => [newTx, ...prev]);

    // Update raw sheet rows for on-the-fly export consistency
    setRawSheets(prev => {
      const next = { ...prev };
      // 1. Append to Fluxo_Financeiro raw array
      if (!next["Fluxo_Financeiro"]) {
        next["Fluxo_Financeiro"] = [CASHFLOW_COLUMNS];
      }
      next["Fluxo_Financeiro"].push([
        newTx.date,
        newTx.type,
        newTx.category,
        newTx.value,
        newTx.description,
        newTx.culture,
        newTx.field || "",
        newTx.entity || "",
        newTx.notes || ""
      ]);

      // 2. Append to corresponding month sheet
      const monthIndex = parseInt(newTx.date.split("-")[1], 10);
      const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const targetMonthName = months[monthIndex - 1];
      if (targetMonthName) {
        if (!next[targetMonthName]) {
          next[targetMonthName] = [CASHFLOW_COLUMNS];
        }
        next[targetMonthName].push([
          newTx.date,
          newTx.type,
          newTx.category,
          newTx.value,
          newTx.description,
          newTx.culture,
          newTx.field || "",
          newTx.entity || "",
          newTx.notes || ""
        ]);
      }

      return next;
    });

    setUpdateAiCounter(c => c + 1);
    sendNativeNotification(
      "Lançamento Financeiro!",
      `${data.type === "receita" ? "Receita" : "Despesa"}: R$ ${Number(data.value).toLocaleString("pt-BR")} salva offline.`
    );

    // Also trigger proxy call to sync on background if server is responding
    try {
      fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // offline silent pass
    }
  };

  /**
   * Add entry or departure movement of stock locally
   */
  const handleStockTransaction = async (data: {
    itemId: string; // matches product's code
    type: "compra" | "consumo";
    qty: number;
    date: string;
    unitPrice?: number;
    totalValue?: number;
    culture?: string;
  }) => {
    // 1. Identify matched master item
    const matched = stockItems.find(item => item.id === data.itemId || item.code === data.itemId);
    const itemCode = matched ? matched.code : data.itemId;
    const itemName = matched ? matched.name : data.itemId;

    // Create stock movement
    const newStockTx: StockTransaction = {
      id: "stx-local-" + Math.random().toString(36).substring(2, 9),
      date: data.date,
      itemCode,
      itemName,
      type: data.type === "compra" ? "Entrada" : "Saída",
      qty: Number(data.qty),
      unitPrice: Number(data.unitPrice || matched?.lastPrice || 0),
      totalValue: Number(data.totalValue || (data.qty * (data.unitPrice || matched?.lastPrice || 0))),
      supplier: data.type === "compra" ? "Distribuidora Regional" : "",
      culture: data.culture || "Geral",
      field: "Talhão 1",
      responsible: userSession || "Gestor",
      notes: data.type === "compra" ? "Suprimento de caixa" : "Consumo operacional em lavoura"
    };

    const newMovements = [newStockTx, ...stockTransactions];
    const newResolvedItems = collateInventory(stockItems, newMovements).map(item => ({
      ...item,
      id: item.code
    }));

    setStockTransactions(newMovements);
    setStockItems(newResolvedItems);

    // Update raw sheet representation for Excel export
    setRawSheets(prev => {
      const next = { ...prev };
      if (!next["Controle_Almoxarifado"]) {
        next["Controle_Almoxarifado"] = [STOCK_TX_COLUMNS];
      }
      next["Controle_Almoxarifado"].push([
        newStockTx.date,
        newStockTx.itemCode,
        newStockTx.itemName,
        newStockTx.type,
        newStockTx.qty,
        newStockTx.unitPrice,
        newStockTx.totalValue,
        newStockTx.supplier || "",
        newStockTx.culture || "",
        newStockTx.responsible || "",
        newStockTx.notes || ""
      ]);
      return next;
    });

    // If purchase/abastecimento, automatically record matching financial debit
    if (data.type === "compra" && newStockTx.totalValue) {
      const isDefensivo = ["Herbicida", "Fungicida", "Inseticida"].includes(itemName);
      const isFertilizante = ["Adubo"].includes(itemName);
      const category = isDefensivo ? "Defensivos" : isFertilizante ? "Fertilizantes" : "Insumos";

      await handleAddTransaction({
        date: data.date,
        type: "despesa",
        category,
        value: newStockTx.totalValue,
        description: `[Estoque] Compra de ${data.qty} ${matched?.unit || "un"} de ${itemName}`,
        culture: data.culture || "Geral"
      });
    }

    setUpdateAiCounter(c => c + 1);
    sendNativeNotification(
      "Almoxarifado Atualizado!",
      `${data.type === "compra" ? "Entrada" : "Saída"} registrada de ${data.qty} un de ${itemName}`
    );

    // Dynamic background replication to back-end
    try {
      fetch("/api/stock/transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } catch {
      // offline silent pass
    }
  };

  /**
   * Export fully computed reactive system state back to Excel File (.xlsx)
   */
  const handleExportState = () => {
    exportCurrentStateToExcel(stockItems, stockTransactions, transactions);
  };

  const handleLoginSuccess = (userName: string) => {
    localStorage.setItem("agriJointSessionUser", userName);
    setUserSession(userName);
  };

  const handleLogout = () => {
    localStorage.removeItem("agriJointSessionUser");
    setUserSession(null);
  };

  // Render LoginScreen if not authenticated
  if (!userSession) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  // Compute stats on active subset
  const filteredTransactions = selectedCulture === "Todas"
    ? transactions
    : transactions.filter(t => t.culture === selectedCulture);

  const totalRevenue = filteredTransactions
    .filter(t => t.type === "receita")
    .reduce((sum, t) => sum + t.value, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === "despesa")
    .reduce((sum, t) => sum + t.value, 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#faf8f4] text-stone-600">
        {/* HEXAGON LOADER */}
        <div className="relative p-1">
          <svg width="64" height="64" viewBox="0 0 100 100" fill="none" className="animate-pulse">
            <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" fill="#14532d" stroke="#b45309" strokeWidth="4" />
          </svg>
        </div>
        <span className="text-xs font-mono mt-4 text-emerald-950 font-bold uppercase tracking-widest animate-pulse">
          Sincronizando Banco de Dados Agrícola...
        </span>
      </div>
    );
  }

  const cropCounts = {
    Soja: transactions.filter(t => t.culture === "Soja").length,
    Milho: transactions.filter(t => t.culture === "Milho").length,
    Café: transactions.filter(t => t.culture === "Café").length,
    Geral: transactions.filter(t => t.culture === "Geral" || !["Soja", "Milho", "Café"].includes(t.culture)).length,
  };

  return (
    <div className="min-h-screen bg-[#faf8f4] flex flex-col md:flex-row text-stone-800 selection:bg-amber-100 selection:text-amber-950 font-sans relative overflow-x-hidden">
      
      {/* MOBILE BAR */}
      <div className="md:hidden bg-emerald-950 text-white p-4 flex items-center justify-between border-b border-emerald-900 z-50 sticky top-0 shadow-md">
        <div className="flex items-center gap-2">
          {/* SECURE HEXAGON BRAND ICON */}
          <div className="shrink-0 flex items-center">
            <svg width="34" height="34" viewBox="0 0 100 100" fill="none">
              <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" fill="#14532d" stroke="#b45309" strokeWidth="6" />
              <circle cx="50" cy="30" r="9" fill="#f59e0b" />
              <path d="M50 82 V48" stroke="#10b981" strokeWidth="6" />
            </svg>
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-wider text-emerald-100 leading-none">Gestão Agrícola</h1>
            <p className="text-[9px] text-[#eab308]/85 font-mono mt-0.5 font-bold">FAZENDA TRIUNFO</p>
          </div>
        </div>
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white hover:text-amber-400 focus:outline-none p-2 bg-emerald-900 rounded-xl transition-all cursor-pointer"
        >
          {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* LEFT SIDEBAR - STRICT ADHERENCE TO BRANDING & SCREEN DESIGN METRIC */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-[#092518] text-emerald-100 border-r border-[#0d3d25] 
        flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shrink-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* LOGO BRAND SECTION */}
        <div className="p-5 border-b border-[#0d3d25] flex items-center gap-3 bg-[#071f14]">
          <div className="p-0.5 shrink-0 bg-[#0d3d25] rounded-xl border border-[#1b5e3c]">
            <svg width="40" height="40" viewBox="0 0 100 100" fill="none">
              <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" fill="#14532d" stroke="#b45309" strokeWidth="5" />
              <circle cx="50" cy="30" r="10" fill="#f59e0b" opacity="0.95" />
              <path d="M50 82 V48" stroke="#10b981" strokeWidth="5" strokeLinecap="round" />
              <path d="M50 60 C55 58, 65 52, 65 44 C65 42, 58 42, 50 48" fill="#10b981" />
            </svg>
          </div>
          <div>
            <h2 className="font-extrabold text-[15px] leading-tight text-white font-display tracking-tight">Gestão Agrícola</h2>
            <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase font-semibold">Yann Xavier • Produtor</p>
          </div>
        </div>

        {/* SIDE NAV MENU SCROLLABLE WRAPPER */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
          
          {/* MODULOS SECTION */}
          <div>
            <span className="block text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-2.5 px-2">
              Módulos Operacionais
            </span>
            <nav className="space-y-1">
              <button
                onClick={() => { setActiveTab("inicio"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer group ${
                  activeTab === "inicio"
                    ? "bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm"
                    : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home size={15} className={activeTab === "inicio" ? "text-amber-500" : "text-emerald-400 group-hover:text-emerald-200"} />
                  <span>Painel Inicial</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => { setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer group ${
                  activeTab === "financeiro"
                    ? "bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm"
                    : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard size={15} className={activeTab === "financeiro" ? "text-amber-500" : "text-emerald-400 group-hover:text-emerald-200"} />
                  <span>Lançamentos & Caixa</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => { setActiveTab("estoque"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer group ${
                  activeTab === "estoque"
                    ? "bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm"
                    : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Boxes size={15} className={activeTab === "estoque" ? "text-amber-500" : "text-emerald-400 group-hover:text-emerald-200"} />
                  <span>Almoxarifado & Estoque</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => { setActiveTab("planilha"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer group ${
                  activeTab === "planilha"
                    ? "bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm"
                    : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileSpreadsheet size={15} className={activeTab === "planilha" ? "text-amber-500" : "text-emerald-400 group-hover:text-emerald-200"} />
                  <span>Banco de Dados Excel</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>

              <button
                onClick={() => { setActiveTab("ai_consultant"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between text-left px-3 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer group ${
                  activeTab === "ai_consultant"
                    ? "bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm"
                    : "text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Cpu size={15} className={activeTab === "ai_consultant" ? "text-amber-500" : "text-emerald-400 group-hover:text-emerald-200"} />
                  <span>Consultoria Agronômica AI</span>
                </div>
                <ChevronRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </nav>
          </div>

          {/* RECENTES REGISTRATION LIST */}
          <div>
            <span className="block text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-2 px-2">
              Status Paridade
            </span>
            <div className="bg-[#071f14] border border-[#0d2e1f] p-3 rounded-xl text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-300">
                <div className="w-1.5 h-1.5 bg-[#eab308] rounded-full animate-ping" />
                <span className="font-mono text-[10px]">Carga Local Sincronizada</span>
              </div>
              <p className="text-[10px] text-emerald-400/70 leading-normal">
                {activeFileName ? (
                  <>Banco carregado de: <strong className="text-amber-205 block text-[9px] font-mono break-all mt-0.5">{activeFileName}</strong></>
                ) : (
                  "Banco Operando com Banco de Dados de Amostra padrão."
                )}
              </p>
            </div>
          </div>

          {/* CULTURAS ATIVAS (mimicking supported XML layout list) */}
          <div>
            <span className="block text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest mb-2 px-2">
              Culturas de Produção
            </span>
            <div className="space-y-1.5">
              <button
                onClick={() => { setSelectedCulture("Todas"); setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-all cursor-pointer ${
                  selectedCulture === "Todas" && activeTab === "financeiro"
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold"
                    : "bg-[#071f14] border-transparent text-emerald-200 hover:border-emerald-800"
                }`}
              >
                <span>🌍 Todas Culturas</span>
                <span className="font-mono text-[9px] text-amber-500 bg-[#0d2e1f] px-1.5 py-0.25 rounded-md font-bold">
                  {transactions.length}
                </span>
              </button>

              <button
                onClick={() => { setSelectedCulture("Soja"); setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-all cursor-pointer ${
                  selectedCulture === "Soja" && activeTab === "financeiro"
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold"
                    : "bg-[#071f14] border-transparent text-emerald-200 hover:border-emerald-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Soja (Grão)
                </span>
                <span className="font-mono text-[9px] text-amber-500 bg-[#0d2e1f] px-1.5 py-0.25 rounded-md font-bold">
                  {cropCounts.Soja}
                </span>
              </button>

              <button
                onClick={() => { setSelectedCulture("Milho"); setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-all cursor-pointer ${
                  selectedCulture === "Milho" && activeTab === "financeiro"
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold"
                    : "bg-[#071f14] border-transparent text-emerald-200 hover:border-emerald-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]" />
                  Milho
                </span>
                <span className="font-mono text-[9px] text-amber-500 bg-[#0d2e1f] px-1.5 py-0.25 rounded-md font-bold">
                  {cropCounts.Milho}
                </span>
              </button>

              <button
                onClick={() => { setSelectedCulture("Café"); setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-all cursor-pointer ${
                  selectedCulture === "Café" && activeTab === "financeiro"
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold"
                    : "bg-[#071f14] border-transparent text-emerald-200 hover:border-emerald-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-700" />
                  Café Arábica
                </span>
                <span className="font-mono text-[9px] text-amber-500 bg-[#0d2e1f] px-1.5 py-0.25 rounded-md font-bold">
                  {cropCounts.Café}
                </span>
              </button>

              <button
                onClick={() => { setSelectedCulture("Geral"); setActiveTab("financeiro"); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] rounded-lg border text-left transition-all cursor-pointer ${
                  selectedCulture === "Geral" && activeTab === "financeiro"
                    ? "bg-amber-500/20 border-amber-500 text-white font-bold"
                    : "bg-[#071f14] border-transparent text-emerald-200 hover:border-emerald-800"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  Uso Geral / Adm
                </span>
                <span className="font-mono text-[9px] text-amber-500 bg-[#0d2e1f] px-1.5 py-0.25 rounded-md font-bold">
                  {cropCounts.Geral}
                </span>
              </button>
            </div>
          </div>

        </div>

        {/* SIDEBAR FOOTER */}
        <div className="p-4 border-t border-[#0d3d25] bg-[#071f14] space-y-2 text-center text-[11px]">
          <div className="text-emerald-400/60 font-mono font-bold tracking-wider">
            SISTEMA AGRÍCOLA V1.2.0
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                sendNativeNotification("Sincronização Física", "Insumos e Livro Caixa recalculados!");
                loadData();
              }}
              title="Recarregar dados"
              className="flex-1 bg-[#103d25] hover:bg-[#155232] text-white border border-[#236e44]/40 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw size={11} />
              Re-sincronizar
            </button>
            
            <button
              onClick={handleLogout}
              className="px-2.5 bg-rose-950/40 border border-rose-900/30 text-rose-300 hover:bg-rose-900/60 rounded-lg flex items-center justify-center cursor-pointer"
              title="Desconectar do painel"
            >
              <LogOut size={12} />
            </button>
          </div>
        </div>
      </aside>

      {/* RIGHT SIDE MAIN AREA */}
      <main className="flex-1 min-w-0 flex flex-col overflow-x-hidden min-h-screen">
        
        {/* UPPER STATUS BAR */}
        <header id="main-statusbar" className="bg-white border-b border-stone-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 md:sticky z-35 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="md:hidden mr-1">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="text-stone-700 bg-stone-100 hover:bg-stone-200 p-2 rounded-xl border border-stone-200 cursor-pointer"
              >
                <Menu size={16} />
              </button>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700 block font-mono">
                {activeTab === "inicio" && "Painel Geral e Hub"}
                {activeTab === "financeiro" && `Fluxo de Caixa • ${selectedCulture === "Todas" ? "Todas as Culturas" : selectedCulture}`}
                {activeTab === "estoque" && "Almoxarifado & Controle de Sementes/Adubos"}
                {activeTab === "planilha" && "Sincronizador Estrutural Excel"}
                {activeTab === "ai_consultant" && "Consultoria Estratégica AI"}
              </span>
              <h2 className="text-base font-extrabold text-stone-900 tracking-tight leading-none mt-1">
                {activeTab === "inicio" && "Início e Controle Geral"}
                {activeTab === "financeiro" && "Livro Caixa & Custos da Safra"}
                {activeTab === "estoque" && "Registro Físico e Níveis de Estoque"}
                {activeTab === "planilha" && "Importador de Tabelas Planilha de Dados"}
                {activeTab === "ai_consultant" && "Agrônomo Inteligente de Rentabilidade"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <div className="hidden lg:flex items-center gap-1.5 bg-[#faf8f4] border border-stone-200 px-3 py-1.5 rounded-xl font-medium font-mono text-stone-600">
              <Calendar size={13} className="text-amber-600" />
              <span>Safra Plantio Calendário 2026/2027</span>
            </div>
            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-950 border border-emerald-100 px-3 py-1.5 rounded-xl font-bold">
              <User size={13} className="text-emerald-750" />
              <span>Gestor: {userSession}</span>
            </div>
          </div>
        </header>

        {/* WORKSPACE INNER WRAPPER */}
        <div className="p-6 md:p-8 space-y-8 flex-1 relative max-w-7xl w-full mx-auto">
          
          {/* VERY SUBTLE DECORATIVE BACKGROUND TOPOGRAPHY FOR PREMIUM FEEL --> Pure Artisanal Craft */}
          <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-[0.015] text-[#14532d] overflow-hidden">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="0.8" className="w-full h-full">
              <path d="M-20 30 C20 10, 60 40, 120 20" />
              <path d="M-20 50 C20 30, 60 60, 120 40" />
              <path d="M-20 70 C20 50, 60 80, 120 60" />
              <path d="M-20 90 C20 70, 60 100, 120 80" />
            </svg>
          </div>

          {/* TAB CONTENT: TAB 1: INICIO (STRICT COMPLIANCE TO THE MOCKUP OVERVIEW HOMEPAGE) */}
          {activeTab === "inicio" && (
            <div className="space-y-10 animate-fade-in">
              
              {/* BRAND SOLAR GEOMETRIC CENTER PANEL */}
              <div className="flex flex-col items-center justify-center text-center max-w-2xl mx-auto pt-6 px-4">
                {/* GEOMETRIC HEXAGON SEAL */}
                <div className="inline-flex mb-5 relative p-1.5">
                  <svg width="84" height="84" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform hover:scale-105 transition-transform duration-500">
                    <path d="M50 5 L88.97 27.5 V72.5 L50 95 L11.03 72.5 V27.5 L50 5 Z" fill="#14532d" stroke="#caa74a" strokeWidth="3" />
                    <path d="M25 43 C40 38, 60 48, 75 43" stroke="#caa74a" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                    <path d="M20 54 C40 50, 60 60, 80 54" stroke="#caa74a" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
                    <circle cx="50" cy="30" r="9" fill="#f59e0b" opacity="0.9" />
                    <path d="M50 82 V48" stroke="#10b981" strokeWidth="3.5" strokeLinecap="round" />
                    <path d="M50 60 C55 58, 65 52, 65 44 C65 42, 58 42, 50 48" fill="#10b981" />
                    <path d="M50 67 C45 65, 35 59, 35 51 C35 49, 42 49, 50 55" fill="#10b981" />
                  </svg>
                </div>
                
                <span className="text-[10px] font-bold text-amber-800 bg-amber-500/10 px-3 py-1 rounded-full uppercase tracking-widest font-mono">
                  SISTEMA DE SUPORTE OPERACIONAL • OFFLINE
                </span>
                
                <h1 className="text-3xl md:text-4xl font-black font-display text-emerald-950 tracking-tight mt-3">
                  Central offline para Gestão Agrícola
                </h1>
                
                <p className="text-xs md:text-sm text-stone-500 mt-2 leading-relaxed">
                  Controle financeiro de safras, balanceamento físico de fertilizantes e sementes em almoxarifado,
                  com inteligência artificial agronômica embarcada por planilhas Excel locais.
                </p>
              </div>

              {/* THREE MAIN INFO CARDS: AMBIENTE, BASE LOCAL, EFICIÊNCIA */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-all">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Ambiente</span>
                  <h3 className="text-sm font-bold text-stone-800 font-display">100% Offline</h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                    Seus dados sensíveis de plantio e caixa são guardados de forma segura localmente em seu navegador. Sem dependência de fetch externo ou envio externo.
                  </p>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-all">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Base Local</span>
                  <h3 className="text-sm font-bold text-stone-800 font-display">Sincronização por Excel</h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                    Importação direta de tabelas e atualização ao baixar de volta do banco. Compatibilidade instantânea com planilhas de safra familiares.
                  </p>
                </div>

                <div className="bg-white border border-stone-200 rounded-2xl p-5 hover:shadow-md transition-all">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block mb-1">Eficiência</span>
                  <h3 className="text-sm font-bold text-stone-800 font-display">Relatórios e Consultas</h3>
                  <p className="text-xs text-stone-500 mt-1.5 leading-normal">
                    Insira receitas rápidas de colheita, filtre compras de insumos e visualize gráficos de rentabilidade automatizados sem demora.
                  </p>
                </div>
              </div>

              {/* BOTTOM MODULE BOARDS (LARGE CARD CLICKS) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* BUTTON CARD 1 */}
                <div 
                  onClick={() => setActiveTab("financeiro")}
                  className="bg-[#faf8f4] hover:bg-white border-2 border-stone-200 hover:border-amber-600 rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:shadow-lg group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -mr-8 -mt-8" />
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-amber-500 group-hover:text-white">
                    <LayoutDashboard size={20} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Lançamentos & Caixa</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-normal">
                    Registrar vendas brutas da colheita, débito de óleo Diesel ou parcelas de fornecedores, com filtragens por safra.
                  </p>
                </div>

                {/* BUTTON CARD 2 */}
                <div 
                  onClick={() => setActiveTab("estoque")}
                  className="bg-[#faf8f4] hover:bg-white border-2 border-stone-200 hover:border-emerald-600 rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:shadow-lg group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -mr-8 -mt-8" />
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-850 flex items-center justify-center mb-4 transition-colors group-hover:bg-emerald-850 group-hover:text-white">
                    <Boxes size={20} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Almoxarifado & Estoque</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-normal">
                    Monitorar níveis de sementes qualificadas e defensivos químicos agendando saídas e prevendo consumo na terra.
                  </p>
                </div>

                {/* BUTTON CARD 3 */}
                <div 
                  onClick={() => setActiveTab("ai_consultant")}
                  className="bg-[#faf8f4] hover:bg-white border-2 border-stone-200 hover:border-sky-600 rounded-2xl p-6 transition-all duration-300 cursor-pointer hover:shadow-lg group text-left relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-sky-500/5 rounded-full -mr-8 -mt-8" />
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-4 transition-colors group-hover:bg-sky-700 group-hover:text-white">
                    <Cpu size={20} />
                  </div>
                  <h3 className="text-base font-bold text-stone-900">Consultoria Agronômica AI</h3>
                  <p className="text-xs text-stone-500 mt-1 leading-normal">
                    Planejamento inteligente do solo, rotatividade de cobertura de sementes e diagnósticos operacionais sustentáveis.
                  </p>
                </div>

              </div>

              {/* INTEGRATED INSTANT SPREADSHEET CARD FOR BOASTING UTILITY */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-850 text-emerald-100 rounded-xl">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-stone-800">Deseja sincronizar uma nova Planilha Excel?</h4>
                    <p className="text-[11px] text-stone-500 mt-0.5">Clique no botão ao lado para gerenciar arquivos de banco local de forma estruturada nas abas.</p>
                  </div>
                </div>
                <div>
                  <button 
                    onClick={() => setActiveTab("planilha")}
                    className="w-full sm:w-auto bg-emerald-850 hover:bg-emerald-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <FileSpreadsheet size={14} />
                    Ir para Planilhas
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: TAB 2: FINANCEIRO (KPIs, Cash ledger and Transaction Adding) */}
          {activeTab === "financeiro" && (
            <div className="space-y-6 animate-fade-in">
              
              {/* FILTER CONTROL PANEL */}
              <div id="filter-panel" className="bg-[#f5f5ee] border border-stone-200/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <Sliders className="text-stone-400" size={16} />
                  <span className="text-xs font-semibold text-stone-600 font-display">Filtro por Cultura de Produção:</span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {["Todas", "Soja", "Milho", "Café", "Geral"].map(cul => (
                    <button
                      key={cul}
                      id={`filter-crop-${cul.toLowerCase()}`}
                      onClick={() => setSelectedCulture(cul)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all ${
                        selectedCulture === cul
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "bg-white border border-stone-200 text-stone-600 hover:text-stone-900"
                      }`}
                    >
                      {cul === "Todas" ? "🌍 Todas Culturas" : cul}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI METRIC CARDS */}
              <SummaryCards totalRevenue={totalRevenue} totalExpense={totalExpense} />

              {/* INTERACTIVE WORKSPACE GRID */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left column: Quick Forms and Direct Ledger */}
                <div className="md:col-span-5 lg:col-span-4 space-y-6">
                  <TransactionForm onAddTransaction={handleAddTransaction} />

                  {/* Quick Ledger showing the latest transactions */}
                  <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-150">
                      <span className="text-xs font-bold text-stone-800 uppercase tracking-wider font-display flex items-center gap-1.5">
                        <ClipboardList size={14} className="text-stone-400" />
                        Ledger de Lançamentos Sincronizados
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">Últimos {Math.min(TransactionsToShow().length, 8)}</span>
                    </div>

                    <div className="mt-4 space-y-3 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin">
                      {TransactionsToShow().length === 0 ? (
                        <div className="text-center py-10 text-stone-400 text-xs">
                          Nenhum lançamento elegível nesta vista.
                        </div>
                      ) : (
                        TransactionsToShow().slice(0, 10).map(tx => (
                          <div key={tx.id} className="flex items-start justify-between p-2.5 rounded-xl hover:bg-stone-50 transition-colors border border-dashed border-stone-100">
                            <div className="space-y-1">
                              <span className="text-xs font-semibold text-stone-800 block leading-tight">{tx.description || tx.category}</span>
                              <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                                <span className="font-mono">{tx.date}</span>
                                <span>•</span>
                                <span className="bg-stone-105 text-stone-600 px-1 py-0.25 rounded">{tx.culture}</span>
                                {tx.field && (
                                  <>
                                    <span>•</span>
                                    <span className="text-stone-550">{tx.field}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <span className={`text-xs font-bold font-mono ${tx.type === "receita" ? "text-emerald-700" : "text-stone-700"}`}>
                              {tx.type === "receita" ? "+" : "-"} R$ {tx.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column: Distribution & Analysis metrics */}
                <div className="md:col-span-7 lg:col-span-8">
                  <ExpenseAnalysis 
                    transactions={transactions} 
                    selectedCulture={selectedCulture}
                    onSelectCulture={setSelectedCulture}
                  />
                </div>
              </div>

            </div>
          )}

          {/* TAB CONTENT: TAB 3: ESTOQUE (Product registration and Almoxarifado entries) */}
          {activeTab === "estoque" && (
            <div className="animate-fade-in">
              <StockManagement 
                stockItems={stockItems}
                stockTransactions={stockTransactions}
                onAddStockTransaction={handleStockTransaction}
              />
            </div>
          )}

          {/* TAB CONTENT: TAB 4: PLANILHA EXCEL (Import tables and Spreadsheet Explorer) */}
          {activeTab === "planilha" && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs">
                <h3 className="text-base font-bold text-stone-900 flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="text-emerald-800" size={18} />
                  Sincronização e Carga de Planilhas de Caixa e Insumos
                </h3>
                <p className="text-xs text-stone-500 leading-normal mb-4">
                  O sistema gerencial processa planilhas unificadas de forma local. Você pode baixar sua planilha limpa estruturada para o preenchimento físico das colheitas e resumos ou exportar os lançamentos recalculados para backup a qualquer momento.
                </p>
                <div className="flex flex-wrap gap-2.5">
                  <button 
                    onClick={handleExportState}
                    className="bg-[#14532d] hover:bg-[#1a5f35] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/10 transition-all border-b-2 border-emerald-950"
                  >
                    <Download size={14} />
                    Exportar Planilha Consolidada (.xlsx)
                  </button>
                  
                  <button 
                    onClick={() => {
                      try {
                        downloadExcelTemplate();
                      } catch (e) {
                        alert("Não foi possível gerar o template local.");
                      }
                    }}
                    className="bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-all"
                  >
                    <FileSpreadsheet size={14} className="text-amber-600" />
                    Baixar Planilha Modelo Limpo (.xlsx)
                  </button>
                </div>
              </div>

              <SourceDataModule 
                onSpreadsheetLoaded={handleSpreadsheetLoaded}
                rawSheets={rawSheets}
                activeFileName={activeFileName}
                onExportState={handleExportState}
              />
            </div>
          )}

          {/* TAB CONTENT: TAB 5: AI STRATEGIC CONSULTANT (Advisory interface) */}
          {activeTab === "ai_consultant" && (
            <div className="animate-fade-in">
              <AiConsultant triggerUpdateCount={updateAiCounter} />
            </div>
          )}

        </div>
      </main>

    </div>
  );

  function TransactionsToShow() {
    return selectedCulture === "Todas" 
      ? transactions 
      : transactions.filter(t => t.culture === selectedCulture);
  }
}
