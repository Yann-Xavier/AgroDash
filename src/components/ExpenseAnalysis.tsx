import { useState } from "react";
import { FinancialTransaction, ExpenseCategory } from "../types";
import { ChevronRight, ArrowUpRight, BarChart3, PieChart, Landmark } from "lucide-react";

interface ExpenseAnalysisProps {
  transactions: FinancialTransaction[];
  selectedCulture: string;
  onSelectCulture: (culture: string) => void;
}

export default function ExpenseAnalysis({
  transactions,
  selectedCulture,
  onSelectCulture,
}: ExpenseAnalysisProps) {
  const [viewMode, setViewMode] = useState<"categories" | "cultures">("categories");

  // Filter transactions based on active selection (exclude 'Geral' context if specific culture clicked, or vice-versa)
  const filteredTx = selectedCulture === "Todas" 
    ? transactions 
    : transactions.filter(t => t.culture === selectedCulture || t.culture === "Geral");

  // Calculate expense breakdown by Category
  const expenseByCategory: Record<string, number> = {};
  let totalExpensesForFilter = 0;

  filteredTx.forEach(t => {
    if (t.type === "despesa") {
      expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.value;
      totalExpensesForFilter += t.value;
    }
  });

  // Sort categories by expenditure
  const sortedCategories = Object.entries(expenseByCategory)
    .map(([category, value]) => ({
      category: category as ExpenseCategory,
      value,
      percentage: totalExpensesForFilter > 0 ? (value / totalExpensesForFilter) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  // Compute breakdown by Culture (specifically Soja, Milho, Café, etc.)
  const culturesList = ["Soja", "Milho", "Café", "Outros"];
  const cultureData = culturesList.map(cul => {
    const culTx = transactions.filter(t => t.culture === cul);
    const revenue = culTx.reduce((sum, t) => t.type === "receita" ? sum + t.value : sum, 0);
    const expense = culTx.reduce((sum, t) => t.type === "despesa" ? sum + t.value : sum, 0);
    const net = revenue - expense;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;

    return {
      culture: cul,
      revenue,
      expense,
      net,
      margin,
    };
  });

  // Sort cultures by net profit to reveal "Qual cultura é mais rentável"
  const sortedCultures = [...cultureData].sort((a, b) => b.net - a.net);

  return (
    <div id="expense-analysis-container" className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-stone-100 gap-4">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 font-display flex items-center gap-2">
            <BarChart3 className="text-emerald-700" size={20} />
            Análise e Distribuição Financeira
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Métricas de direcionamento de custos e classificação de rentabilidade
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-stone-100 p-1 rounded-xl self-start sm:self-auto max-w-full overflow-x-auto scrollbar-none shrink-0">
          <button
            id="tab-categories"
            onClick={() => setViewMode("categories")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === "categories"
                ? "bg-white text-stone-800 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <PieChart size={14} />
              Onde Gasto Mais?
            </span>
          </button>
          <button
            id="tab-cultures"
            onClick={() => setViewMode("cultures")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              viewMode === "cultures"
                ? "bg-white text-stone-800 shadow-xs"
                : "text-stone-500 hover:text-stone-800"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Landmark size={14} />
              Rentabilidade por Cultura
            </span>
          </button>
        </div>
      </div>

      {selectedCulture !== "Todas" && viewMode === "categories" && (
        <div className="my-4 px-4 py-2.5 bg-emerald-50/50 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
          <span>Visualizando incidência de despesas para: <strong>{selectedCulture}</strong> (Incluindo infraestrutura/geral)</span>
          <button 
            onClick={() => onSelectCulture("Todas")}
            className="text-[10px] text-emerald-700 font-semibold underline hover:text-emerald-900 cursor-pointer"
          >
            Ver Geral
          </button>
        </div>
      )}

      {/* VIEW: CATEGORIES BREAKDOWN ("Onde estou gastando mais?") */}
      {viewMode === "categories" && (
        <div className="mt-6 space-y-5">
          {sortedCategories.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-sm">
              Nenhuma despesa registrada para o filtro selecionado.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Graphical List */}
              <div className="lg:col-span-3 space-y-4">
                <span className="text-xs font-semibold text-stone-400 tracking-wider uppercase font-display block">Categorias de Custo Ordenadas</span>
                
                <div className="space-y-3.5">
                  {sortedCategories.map((item, index) => (
                    <div key={item.category} className="group">
                      <div className="flex justify-between items-center text-xs mb-1">
                        <span className="font-medium text-stone-700 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getCategoryColor(index) }}></span>
                          {item.category}
                        </span>
                        <div className="text-stone-600 font-mono">
                          <span className="font-semibold text-stone-800">
                            R$ {item.value.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                          </span>
                          <span className="text-stone-400 ml-1.5">({item.percentage.toFixed(1)}%)</span>
                        </div>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full bg-stone-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: getCategoryColor(index)
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanatory summary for Q10 */}
              <div className="lg:col-span-2 bg-stone-50/70 rounded-2xl p-5 border border-stone-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-stone-800 font-display">Principais Direcionadores</h4>
                  <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                    Sua maior saída financeira com base nos dados registrados é com <strong className="text-stone-700">{sortedCategories[0]?.category || "N/A"}</strong>, representando <strong className="text-stone-700">{sortedCategories[0]?.percentage.toFixed(1)}%</strong> do caixa rural.
                  </p>
                  
                  {sortedCategories.length > 1 && (
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed">
                      Seguido por <span className="text-stone-700">{sortedCategories[1]?.category}</span> ({sortedCategories[1]?.percentage.toFixed(1)}%), exigindo atenção para possíveis contratos de compras programadas.
                    </p>
                  )}
                  
                  <div className="mt-4 p-3 bg-white/80 border border-stone-200/50 rounded-xl">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-stone-400 block">Soma de Custos Operacionais</span>
                    <span className="text-sm font-mono font-bold text-stone-700 mt-1 block">
                      R$ {totalExpensesForFilter.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-200/60 text-[11px] text-stone-400 leading-relaxed">
                  💡 Insumos agrícolas e fertilizantes possuem forte flutuação cambial. Agrupe compras com produtores vizinhos para reduzir custos por hectare.
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: CULTURES BREAKDOWN ("Qual cultura é mais rentável?") */}
      {viewMode === "cultures" && (
        <div className="mt-6">
          <span className="text-xs font-semibold text-stone-400 tracking-wider uppercase font-display block mb-4">Rentabilidade Operacional Separada (Ranking)</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedCultures.map((culData, idx) => {
              const isProfit = culData.net >= 0;
              const efficiencyLabel = culData.margin > 40 ? "Alta" : culData.margin > 15 ? "Média" : culData.margin > 0 ? "Baixa" : "Prejuízo";
              const efficiencyColor = culData.margin > 40 ? "text-emerald-600 bg-emerald-50" : culData.margin > 15 ? "text-stone-600 bg-stone-50" : "text-amber-600 bg-amber-50";

              return (
                <div
                  key={culData.culture}
                  onClick={() => onSelectCulture(culData.culture)}
                  className={`group p-5 rounded-2xl border transition-all cursor-pointer ${
                    selectedCulture === culData.culture
                      ? "bg-stone-900 border-stone-900 text-white shadow-md transform scale-[1.02]"
                      : "bg-white border-stone-200/80 hover:border-emerald-600 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                      selectedCulture === culData.culture ? "bg-stone-800 text-stone-200" : "bg-stone-100 text-stone-600"
                    }`}>
                      #{idx + 1} Rentabilidade
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${efficiencyColor}`}>
                      Eficiência: {efficiencyLabel}
                    </span>
                  </div>

                  <h3 className={`text-xl font-bold mt-3 font-display ${selectedCulture === culData.culture ? "text-white" : "text-stone-800"}`}>
                    {culData.culture}
                  </h3>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className={selectedCulture === culData.culture ? "text-stone-400" : "text-stone-500"}>Receita</span>
                      <span className="font-semibold font-mono">
                        R$ {culData.revenue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={selectedCulture === culData.culture ? "text-stone-400" : "text-stone-500"}>Despesa Direta</span>
                      <span className="font-semibold font-mono">
                        R$ {culData.expense.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-100/10">
                      <span className={selectedCulture === culData.culture ? "text-stone-300 font-medium" : "text-stone-800 font-medium"}>Lucro</span>
                      <span className={`font-bold font-mono ${isProfit ? "text-emerald-500" : "text-red-500"}`}>
                        R$ {culData.net.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>

                  {/* Profit Margin bar visualizer */}
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className={selectedCulture === culData.culture ? "text-stone-400" : "text-stone-500"}>Margem Operacional</span>
                      <span className="font-bold font-mono">{culData.margin.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-stone-100 dark:bg-stone-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${Math.max(0, Math.min(100, culData.margin))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Visual color palette generator for categories chart
function getCategoryColor(index: number): string {
  const colors = [
    "#15803d", // verde de crescimento (green-700)
    "#b45309", // dourado da colheita (amber-700)
    "#c2410c", // terracota do solo (orange-700)
    "#0284c7", // azul de tecnologia (sky-700)
    "#1e3a8a", // azul escuro inovação
    "#854d0e", // ocre de grãos
    "#166534", // verde floresta profundo
    "#7c2d12", // marrom avermelhado terra
    "#ea580c", // terracota brilhante
    "#d97706", // mostarda/gold
    "#0d9488", // azul esmeralda/verde-azulado
    "#7c3aed", // violeta de flor
    "#0369a1", // azul oceânico limpo
  ];
  return colors[index % colors.length];
}
