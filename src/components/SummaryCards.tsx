import { TrendingUp, ArrowDownRight, DollarSign, Percent } from "lucide-react";

interface SummaryCardsProps {
  totalRevenue: number;
  totalExpense: number;
}

export default function SummaryCards({ totalRevenue, totalExpense }: SummaryCardsProps) {
  const netProfit = totalRevenue - totalExpense;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const isLoss = netProfit < 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* CARD 1: RECEITAS - FOCO DOURADO (COLHEITA E GRÃOS) */}
      <div id="card-revenue" className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200/80 transition-all hover:shadow-md hover:border-amber-500/60 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-125" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-500 font-display">Faturamento (Colheita)</span>
          <div className="p-2 rounded-xl bg-amber-100 text-amber-700 transition-colors group-hover:bg-amber-200">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight text-amber-950 font-mono">
            R$ {totalRevenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-stone-400 mt-1">Faturamento bruto (Grãos & Café)</p>
        </div>
      </div>

      {/* CARD 2: CUSTOS & DESPESAS - FOCO TERROSO/TERRACOTA (ESTABILIDADE E SOLO) */}
      <div id="card-expenses" className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200/80 transition-all hover:shadow-md hover:border-orange-500/50 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-orange-700/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-125" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-500 font-display">Insumos & Despesas</span>
          <div className="p-2 rounded-xl bg-orange-100 text-orange-850 transition-colors group-hover:bg-orange-200/80">
            <ArrowDownRight size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight text-stone-800 font-mono">
            R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-stone-400 mt-1">Soma de fertilizantes, diesel e campo</p>
        </div>
      </div>

      {/* CARD 3: LUCRO OPERACIONAL - FOCO VERDE (CRESCIMENTO & SUSTENTABILIDADE) */}
      <div id="card-profit" className={`bg-white p-5 rounded-2xl shadow-xs border border-stone-200/80 transition-all hover:shadow-md group relative overflow-hidden ${
        isLoss ? 'hover:border-red-400 bg-red-50/5' : 'hover:border-emerald-600 bg-emerald-50/5'
      }`}>
        <div className={`absolute top-0 right-0 w-16 h-16 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-125 ${
          isLoss ? 'bg-red-500/5' : 'bg-emerald-500/5'
        }`} />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-500 font-display">Resultado (Lucro Líquido)</span>
          <div className={`p-2 rounded-xl transition-colors ${
            isLoss ? 'bg-red-100 text-red-700 group-hover:bg-red-200' : 'bg-emerald-100 text-emerald-800 group-hover:bg-emerald-200'
          }`}>
            <DollarSign size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className={`text-2xl font-bold tracking-tight font-mono ${isLoss ? 'text-rose-700' : 'text-emerald-900'}`}>
            R$ {netProfit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-xs text-stone-400 mt-1">Resultado líquido da propriedade</p>
        </div>
      </div>

      {/* CARD 4: MARGEM - FOCO AZUL (TECNOLOGIA E INOVAÇÃO GERENCIAL) */}
      <div id="card-margin" className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200/80 transition-all hover:shadow-md hover:border-sky-500/60 group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-16 h-16 bg-sky-500/5 rounded-full -mr-6 -mt-6 transition-all group-hover:scale-125" />
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-stone-500 font-display">Eficiência Gerencial</span>
          <div className="p-2 rounded-xl bg-sky-100 text-sky-800 transition-colors group-hover:bg-sky-200">
            <Percent size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold tracking-tight text-sky-950 font-mono">
            {margin.toFixed(1)}%
          </h3>
          <p className="text-xs text-stone-400 mt-1">Retorno operacional gerado</p>
        </div>
      </div>
    </div>
  );
}
