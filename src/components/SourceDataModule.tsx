import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { 
  FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, Table,
  HelpCircle, RefreshCw, Layers, FileDown, ShieldAlert
} from "lucide-react";
import { 
  downloadExcelTemplate, 
  validateHeaders, 
  PRODUCT_COLUMNS, 
  STOCK_TX_COLUMNS, 
  CASHFLOW_COLUMNS 
} from "../utils/excelService";

interface SourceDataModuleProps {
  onSpreadsheetLoaded: (data: {
    products: any[];
    stockMovements: any[];
    financialTxs: any[];
    sheetsList: string[];
    rawSheets: Record<string, any[][]>;
    fileName: string;
  }) => void;
  rawSheets: Record<string, any[][]>;
  activeFileName: string;
  onExportState: () => void;
}

export default function SourceDataModule({
  onSpreadsheetLoaded,
  rawSheets,
  activeFileName,
  onExportState
}: SourceDataModuleProps) {
  const [selectedSheet, setSelectedSheet] = useState<string>("Cadastro_Produtos");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [alertMsg, setAlertMsg] = useState<{ type: "success" | "error" | "warning"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sheets list derived from rawSheets state
  const sheetsList = Object.keys(rawSheets);

  // If Cadastro_Produtos isn't there but there are other sheets, pick the first
  const currentSheetName = rawSheets[selectedSheet] ? selectedSheet : sheetsList[0] || "";

  const handleExcelParse = (file: File) => {
    setAlertMsg(null);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) throw new Error("Não foi possível ler os dados do arquivo.");

        const workbook = XLSX.read(data, { type: "array" });
        const parsedRecord: Record<string, any[][]> = {};
        const sheetsFound = workbook.SheetNames;

        sheetsFound.forEach(sheetName => {
          const ws = workbook.Sheets[sheetName];
          // Read raw rows as array of arrays
          const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1 });
          parsedRecord[sheetName] = rows;
        });

        // Parse structures out
        let products: any[] = [];
        let stockMovements: any[] = [];
        let financialTxs: any[] = [];

        const validationLogs: string[] = [];

        // 1. Parse products mestre
        if (parsedRecord["Cadastro_Produtos"]) {
          const rows = parsedRecord["Cadastro_Produtos"];
          if (rows.length > 0) {
            const head = rows[0].map(h => String(h || ""));
            const val = validateHeaders(head, PRODUCT_COLUMNS);
            if (!val.isOk) {
              validationLogs.push(`⚠️ Cadastro_Produtos: Colunas ausentes (${val.missing.join(", ")})`);
            }
          }
        } else {
          validationLogs.push("⚠️ Cadastro_Produtos: Aba ausente na planilha.");
        }

        // 2. Parse stock
        if (parsedRecord["Controle_Almoxarifado"]) {
          const rows = parsedRecord["Controle_Almoxarifado"];
          if (rows.length > 0) {
            const head = rows[0].map(h => String(h || ""));
            const val = validateHeaders(head, STOCK_TX_COLUMNS);
            if (!val.isOk) {
              validationLogs.push(`⚠️ Controle_Almoxarifado: Colunas ausentes (${val.missing.join(", ")})`);
            }
          }
        } else {
          validationLogs.push("⚠️ Controle_Almoxarifado: Aba ausente.");
        }

        // 3. Try to read Month sheets for financial data or central Flow sheet
        const months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        let monthlyFoundCount = 0;
        months.forEach(m => {
          if (parsedRecord[m]) monthlyFoundCount++;
        });

        if (parsedRecord["Fluxo_Financeiro"]) {
          validationLogs.push(`✓ Fluxo_Financeiro unificado detectado e processado.`);
        } else if (monthlyFoundCount > 0) {
          validationLogs.push(`✓ ${monthlyFoundCount} abas de meses identificadas para Fluxo Financeiro.`);
        } else {
          validationLogs.push("⚠️ Nenhuma aba financeira central (Fluxo_Financeiro) ou abas mensais encontradas.");
        }

        // Propagate loaded data onwards
        onSpreadsheetLoaded({
          products,
          stockMovements,
          financialTxs,
          sheetsList: sheetsFound,
          rawSheets: parsedRecord,
          fileName: file.name
        });

        // Set success alert
        setAlertMsg({
          type: "success",
          text: `Sucesso! Planilha "${file.name}" carregada e conectada como Banco de Dados Offline local.`
        });
        
        // Auto pick first available sheet
        if (parsedRecord["Cadastro_Produtos"]) {
          setSelectedSheet("Cadastro_Produtos");
        } else if (sheetsFound.length > 0) {
          setSelectedSheet(sheetsFound[0]);
        }

      } catch (err: any) {
        console.error(err);
        setAlertMsg({
          type: "error",
          text: `Erro ao abrir planilha: Certifique-se de carregar um arquivo .xlsx válido. (${err.message})`
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleExcelParse(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleExcelParse(e.target.files[0]);
    }
  };

  // Build rows preview
  const currentRows = currentSheetName ? (rawSheets[currentSheetName] || []) : [];
  const headers = currentRows.length > 0 ? currentRows[0] : [];
  const bodyRows = currentRows.slice(1, 41); // Render up to first 40 rows preview

  // Column validations based on sheet classification
  const getRequiredColumnsForSelected = (): string[] => {
    const sLow = currentSheetName.toLowerCase();
    if (sLow === "cadastro_produtos") return PRODUCT_COLUMNS;
    if (sLow === "controle_almoxarifado") return STOCK_TX_COLUMNS;
    
    const months = ["janeiro", "fevereiro", "março", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    if (sLow === "fluxo_financeiro" || months.includes(sLow)) return CASHFLOW_COLUMNS;
    
    return [];
  };

  const requiredCols = getRequiredColumnsForSelected();
  const validationResult = validateHeaders(headers.map(h => String(h || "")), requiredCols);

  return (
    <div id="source-data-module" className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-xs space-y-6">
      
      {/* Header and status info */}
      <div className="flex flex-col md:flex-row md:items-start justify-between pb-4 border-b border-stone-150 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 font-display flex items-center gap-2">
            <FileSpreadsheet className="text-emerald-700 font-bold" size={20} />
            Fonte de Dados de Planilha Mestre
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Seu sistema funciona de forma **100% offline**. Use a planilha Excel como seu Banco de Dados local.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadExcelTemplate}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/50 hover:bg-emerald-100 p-2 px-3.5 rounded-xl transition-all font-medium text-xs cursor-pointer"
          >
            <Download size={13} />
            Baixar Modelo de Planilha (.xlsx)
          </button>
          
          <button
            onClick={onExportState}
            className="flex items-center gap-1.5 bg-stone-900 leading-none text-white hover:bg-stone-850 p-2.5 px-3.5 rounded-xl transition-all font-medium text-xs cursor-pointer"
          >
            <FileDown size={14} />
            Exportar Dados Atuais (.xlsx)
          </button>
        </div>
      </div>

      {/* Grid containing Dropzone and Active sheet validation stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Import drag zones & warnings (ColSpan 4) */}
        <div className="lg:col-span-5 space-y-4">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block font-display">Carregar Planilha Banco de Dados</span>
          
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
              dragActive 
                ? "border-emerald-600 bg-emerald-50/50" 
                : "border-stone-200 hover:border-stone-400 hover:bg-stone-50/40 bg-stone-50/20"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl mb-3 shadow-xs">
              <Upload size={22} className="text-emerald-700" />
            </div>
            
            <span className="text-xs font-semibold text-stone-700 block mb-1">
              Arraste sua planilha ou clique aqui
            </span>
            <span className="text-[10px] text-stone-400 font-mono">
              Suporta formatos .xlsx e .xls (limite máximo 30MB)
            </span>
          </div>

          {/* Connected state indicators */}
          <div className="border border-stone-150 rounded-2xl p-4 bg-stone-50/50 space-y-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Status do Banco de Dados Offline</span>
            
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-xs font-semibold text-stone-700">
                {activeFileName ? `Planilha conectada: ${activeFileName}` : "Banco de dados interno de simulação ativo"}
              </span>
            </div>

            <p className="text-[11px] text-stone-500 leading-normal">
              Todos os lançamentos que você fizer na tela são salvos localmente na memória do navegador. Para persistir permanentemente nas suas abas mensais locais, clique em <strong>"Exportar Dados Atuais"</strong> para baixar o Excel preenchido!
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Active spreadsheet inspector (ColSpan 8) */}
        <div className="lg:col-span-7 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest block font-display">Inspetor de Abas da Planilha</span>
            
            {sheetsList.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Layers className="text-stone-400" size={14} />
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-700 font-medium focus:outline-emerald-600"
                >
                  {sheetsList.map(name => (
                    <option key={name} value={name}>
                      Aba: {name} ({rawSheets[name]?.length || 0} Linhas)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {alertMsg && (
            <div className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
              alertMsg.type === "success" 
                ? "bg-emerald-50 border border-emerald-100 text-emerald-800" 
                : "bg-red-50 border border-red-100 text-red-800"
            }`}>
              {alertMsg.type === "success" ? <CheckCircle size={16} className="text-emerald-700 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />}
              <span className="leading-tight">{alertMsg.text}</span>
            </div>
          )}

          {/* Validation header summary */}
          {currentSheetName && requiredCols.length > 0 && (
            <div className={`p-4 rounded-2xl border text-xs flex items-start justify-between gap-3 ${
              validationResult.isOk 
                ? "bg-stone-50/50 border-stone-200" 
                : "bg-amber-50/60 border-amber-200 text-amber-900"
            }`}>
              <div className="space-y-1">
                <span className="font-semibold block font-display text-stone-800">
                  Validação de Colunas Obrigatórias ({currentSheetName})
                </span>
                <p className="text-[11px] text-stone-500 leading-normal">
                  {validationResult.isOk 
                    ? "✓ Excelente! Todas as colunas cruciais para cálculo de balanceamento foram encontradas nesta aba mestre." 
                    : `⚠️ Atenção: A planilha não possui as seguintes colunas obrigatórias: ${validationResult.missing.join(", ")}. Alguns recursos do painel gerencial podem falhar.`}
                </p>
              </div>

              {!validationResult.isOk && (
                <ShieldAlert className="text-amber-600 shrink-0" size={20} />
              )}
            </div>
          )}

          {/* Data list rows preview table */}
          <div className="border border-stone-150 rounded-2xl overflow-hidden flex-1 flex flex-col justify-between max-h-[350px] overflow-y-auto">
            {headers.length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs flex flex-col items-center justify-center gap-2">
                <Table size={24} className="text-stone-300" />
                <span>Nenhuma planilha carregada para visualizar. Use o painel ao lado.</span>
              </div>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-xs text-left text-stone-600">
                  <thead className="bg-[#fcfcf9] text-stone-400 font-semibold text-[10px] uppercase tracking-wider border-b border-stone-200">
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i} className="py-2.5 px-3.5 whitespace-nowrap font-mono">{String(h || `Coluna ${i + 1}`)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono">
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-stone-50/50">
                        {headers.map((_, cIdx) => {
                          const val = row[cIdx];
                          const isEmpty = val === null || val === undefined || String(val).trim() === "";
                          return (
                            <td 
                              key={cIdx} 
                              className={`py-2 px-3.5 text-[11px] max-w-xs truncate ${
                                isEmpty ? "bg-amber-50 text-amber-700 italic border border-amber-100" : "text-stone-800"
                              }`}
                              title={isEmpty ? "Campo de planilha vazio" : String(val)}
                            >
                              {isEmpty ? "Vazio" : String(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {currentRows.length > 40 && (
              <div className="bg-stone-50 border-t border-stone-150 p-2.5 text-center text-[10px] text-stone-400 font-medium">
                Mostrando as primeiras 40 de {currentRows.length} linhas para visualização rápida.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
