import React, { useState } from "react";
import { StockItem, StockTransaction, StockItemName } from "../types";
import { 
  Package, AlertTriangle, ArrowDown, ArrowUp, RefreshCcw, 
  TrendingDown, TrendingUp, HelpCircle, ClipboardCheck, ArrowUpRight 
} from "lucide-react";

interface StockManagementProps {
  stockItems: StockItem[];
  stockTransactions: StockTransaction[];
  onAddStockTransaction: (data: {
    itemId: string;
    type: "compra" | "consumo";
    qty: number;
    date: string;
    unitPrice?: number;
    totalValue?: number;
    culture?: string;
  }) => Promise<void>;
}

export default function StockManagement({
  stockItems,
  stockTransactions,
  onAddStockTransaction,
}: StockManagementProps) {
  const [activeTab, setActiveTab] = useState<"inventory" | "history">("inventory");
  const [showLogForm, setShowLogForm] = useState(false);
  const [formType, setFormType] = useState<"compra" | "consumo">("consumo");
  const [selectedItemId, setSelectedItemId] = useState(stockItems[0]?.id || "");
  const [qty, setQty] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [culture, setCulture] = useState("Soja");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const selectedItemData = stockItems.find(s => s.id === selectedItemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!selectedItemId || !qty || Number(qty) <= 0 || !date) {
      setErrorMsg("Por favor, preencha todos os campos obrigatórios corretamente.");
      setLoading(false);
      return;
    }

    const currentItemDesc = stockItems.find(s => s.id === selectedItemId);
    if (!currentItemDesc) return;

    if (formType === "consumo" && currentItemDesc.currentQty < Number(qty)) {
      setErrorMsg(`Quantidade solicitada (${qty} ${currentItemDesc.unit}) é maior do que o saldo em estoque (${currentItemDesc.currentQty} ${currentItemDesc.unit}).`);
      setLoading(false);
      return;
    }

    try {
      const payload: any = {
        itemId: selectedItemId,
        type: formType,
        qty: Number(qty),
        date,
      };

      if (formType === "compra") {
        if (unitPrice && Number(unitPrice) > 0) {
          payload.unitPrice = Number(unitPrice);
          payload.totalValue = Number(unitPrice) * Number(qty);
        }
      } else {
        payload.culture = culture;
      }

      await onAddStockTransaction(payload);
      
      // Reset form variables
      setQty("");
      setUnitPrice("");
      setShowLogForm(false);
    } catch (err: any) {
      setErrorMsg("Ocorreu um erro ao lançar a movimentação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="stock-management-container" className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 font-display flex items-center gap-2">
            <Package className="text-emerald-700" size={20} />
            Almoxarifado & Estoque Estratégico
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Controle de defensivos e adubos focado em janelas de compra oportuna no mercado
          </p>
        </div>

        {/* View togglers & action button */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex bg-stone-100 p-1 rounded-xl scrollbar-none overflow-x-auto">
            <button
              id="stock-inventory-tab"
              onClick={() => setActiveTab("inventory")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeTab === "inventory"
                  ? "bg-white text-stone-800 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Estoque Atual
            </button>
            <button
              id="stock-history-tab"
              onClick={() => setActiveTab("history")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeTab === "history"
                  ? "bg-white text-stone-800 shadow-xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Movimentações
            </button>
          </div>

          <button
            id="btn-new-stock-action"
            onClick={() => {
              setShowLogForm(!showLogForm);
              setErrorMsg("");
            }}
            className="bg-stone-950 text-white px-3.5 py-1.5 rounded-xl text-xs font-medium hover:bg-stone-800 cursor-pointer transition-all flex items-center gap-1.5"
          >
            <RefreshCcw size={13} />
            Nova Movimentação
          </button>
        </div>
      </div>

      {/* NEW STOCK TRANSACTION POPUNDER FORM */}
      {showLogForm && (
        <form onSubmit={handleSubmit} className="mt-5 p-5 bg-stone-50 border border-stone-200/60 rounded-2xl animate-fade-in">
          <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-4">
            Registrar Movimento de Insumos
          </h3>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-100 rounded-xl text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Form Type Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Operação</label>
              <div className="flex bg-stone-200/60 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormType("consumo")}
                  className={`flex-1 py-1 text-center rounded text-xs font-medium transition-all ${
                    formType === "consumo" ? "bg-white text-stone-800 shadow-xs" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Consumo (Saída)
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("compra")}
                  className={`flex-1 py-1 text-center rounded text-xs font-medium transition-all ${
                    formType === "compra" ? "bg-white text-stone-800 shadow-xs" : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  Compra (Entrada)
                </button>
              </div>
            </div>

            {/* Insumo selector */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Insumo</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2 text-stone-700 focus:outline-emerald-600"
              >
                {stockItems.map(item => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
                Quantidade {selectedItemData ? `(${selectedItemData.unit})` : ""}
              </label>
              <input
                type="number"
                min="0.1"
                step="any"
                required
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="Ex. 150"
                className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2 text-stone-700 focus:outline-emerald-600"
              />
            </div>

            {/* Price (if Compra) or Crop (if Consumo) */}
            {formType === "compra" ? (
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Preço Unitário (R$)</label>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  required
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder="Ex. 65.00"
                  className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2 text-stone-700 focus:outline-emerald-600"
                />
              </div>
            ) : (
              <div>
                <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Vincular à Cultura</label>
                <select
                  value={culture}
                  onChange={(e) => setCulture(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2 text-stone-700 focus:outline-emerald-600"
                >
                  <option value="Soja">Soja</option>
                  <option value="Milho">Milho</option>
                  <option value="Café">Café</option>
                  <option value="Outros">Outros</option>
                  <option value="Geral">Infraestrutura / Geral</option>
                </select>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-stone-200/40 pt-4">
            <div className="text-xs text-stone-400">
              {formType === "compra" && qty && unitPrice && (
                <span>
                  Lançamento de compra integrado no fluxo financeiro: <strong>R$ {(Number(qty) * Number(unitPrice)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</strong>
                </span>
              )}
              {formType === "consumo" && (
                <span>Saída física de estoque sem movimentação de caixa.</span>
              )}
            </div>

            <div className="flex gap-2.5 self-end">
              <button
                type="button"
                onClick={() => setShowLogForm(false)}
                className="px-3 py-1.5 border border-stone-200 text-stone-500 rounded-lg text-xs hover:bg-stone-100 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.5 bg-emerald-700 text-white font-medium rounded-lg text-xs hover:bg-emerald-800 disabled:bg-stone-300 cursor-pointer"
              >
                {loading ? "Lançando..." : "Gravar Registro"}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW 1: INVENTORY & INTELLIGENT procurement advisory */}
      {activeTab === "inventory" && (
        <div className="mt-6 space-y-6">
          {/* Quick Explanatory Banner about Opportune Times */}
          <div className="bg-emerald-50/40 border border-emerald-100/60 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="bg-emerald-100 text-emerald-800 p-2 rounded-xl mt-0.5">
                <TrendingDown size={16} />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-900 font-display">Aproveitamento de Janelas de Desconto de Insumos</h4>
                <p className="text-[11px] text-emerald-700/90 mt-1 max-w-xl">
                  Seu estoque analisa a relação entre estoque físico de defensivos/fertilizantes e o preço de mercado atual. Itens com tendência de **preçobbaixo** sinalizam momentos ideais para fechar compras programadas.
                </p>
              </div>
            </div>
            
            <div className="text-xs font-medium text-emerald-900 bg-white/80 border border-emerald-200 rounded-xl px-3 py-1.5 self-start md:self-auto font-mono">
              Market Status: Monitorado
            </div>
          </div>

          {/* Grid representation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stockItems.map(item => {
              const isBelowMin = item.currentQty < item.minQty;
              const percentOfMin = Math.min(100, (item.currentQty / item.minQty) * 100);
              
              // Market timing decision logic
              let actionBadge = { text: "Estável", color: "bg-stone-50 text-stone-500 border-stone-200" };
              if (item.priceTrend === "baixo" && isBelowMin) {
                actionBadge = { text: "COMPRAR JÁ (PREÇO BAIXO)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
              } else if (item.priceTrend === "baixo" && !isBelowMin) {
                actionBadge = { text: "OPORTUNIDADE DE COMPRA", color: "bg-emerald-50/50 text-emerald-600 border-emerald-100" };
              } else if (item.priceTrend === "alto" && isBelowMin) {
                actionBadge = { text: "COMPRAR MÍNIMO SEGURANÇA", color: "bg-amber-50 text-amber-700 border-amber-200" };
              } else if (item.priceTrend === "alto" && !isBelowMin) {
                actionBadge = { text: "AGUARDAR (PREÇOS ALTOS)", color: "bg-red-50 text-red-600 border-red-100" };
              } else if (item.priceTrend === "medio" && isBelowMin) {
                actionBadge = { text: "REPOSIÇÃO SUGERIDA", color: "bg-amber-50 text-amber-700 border-amber-100" };
              }

              return (
                <div key={item.id} className="border border-stone-200/80 rounded-2xl p-5 bg-stone-50/30 hover:border-stone-300 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-stone-800 text-sm font-display flex items-center gap-1.5">
                        {item.name}
                        {isBelowMin && (
                          <span className="p-1 bg-red-50 text-red-600 rounded-full" title="Abaixo do limite de segurança">
                            <AlertTriangle size={12} />
                          </span>
                        )}
                      </h4>
                      <span className="text-[10px] text-stone-400">Último preço: R$ {item.lastPrice.toLocaleString("pt-BR")}/{item.unit === "Kg" ? "kg" : "L"}</span>
                    </div>

                    <span className="text-xs font-bold text-stone-600 font-mono">
                      {item.currentQty.toLocaleString()} / {item.minQty.toLocaleString()} <span className="text-[10px] text-stone-400">{item.unit}</span>
                    </span>
                  </div>

                  {/* Stock physical scale bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[9px] text-stone-400 mb-1 font-mono">
                      <span>Nível Atual</span>
                      <span>Mínimo: {item.minQty}</span>
                    </div>
                    <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isBelowMin ? 'bg-amber-500' : 'bg-emerald-600'}`}
                        style={{ width: `${percentOfMin}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Timing Advisory */}
                  <div className="mt-4 pt-4 border-t border-stone-100 flex items-center justify-between text-[11px]">
                    <span className="text-stone-400 flex items-center gap-1">
                      Mercado: 
                      <span className={`font-semibold flex items-center ${
                        item.priceTrend === 'baixo' ? 'text-emerald-600' : item.priceTrend === 'alto' ? 'text-red-500' : 'text-stone-500'
                      }`}>
                        {item.priceTrend === 'baixo' ? <ArrowDown size={11} /> : item.priceTrend === 'alto' ? <ArrowUp size={11} /> : null}
                        {item.priceTrend.toUpperCase()}
                      </span>
                    </span>

                    <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border ${actionBadge.color}`}>
                      {actionBadge.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: LOG ENTRIES TABLE */}
      {activeTab === "history" && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 text-stone-400 text-[10px] font-semibold uppercase tracking-wider border-b border-stone-200/50">
              <tr>
                <th className="py-3 px-4 whitespace-nowrap">Data</th>
                <th className="py-3 px-4 whitespace-nowrap">Item</th>
                <th className="py-3 px-4 whitespace-nowrap">Ação</th>
                <th className="py-3 px-4 text-center whitespace-nowrap">Quantidade</th>
                <th className="py-3 px-4 whitespace-nowrap">Vinculação / Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {stockTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400">
                    Nenhuma movimentação de estoque registrada neste ano.
                  </td>
                </tr>
              ) : (
                stockTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-stone-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono">{tx.date}</td>
                    <td className="py-3 px-4 font-semibold text-stone-800">{tx.itemName}</td>
                    <td className="py-3 px-4">
                      <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${
                        tx.type === "compra" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-stone-100 text-stone-600"
                      }`}>
                        {tx.type === "compra" ? "entrada" : "saída / consumo"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium">{tx.qty.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      {tx.type === "compra" && tx.totalValue ? (
                        <span className="text-stone-700 font-mono text-[11px]">
                          R$ {tx.totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="text-stone-500 font-display italic">
                          Cultura: {tx.culture}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
