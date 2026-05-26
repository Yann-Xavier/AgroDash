import React, { useState } from "react";
import { ExpenseCategory, TransactionType } from "../types";
import { CircleDollarSign, Plus, EyeOff, Calendar, AlertCircle } from "lucide-react";

interface TransactionFormProps {
  onAddTransaction: (data: {
    date: string;
    type: TransactionType;
    category: ExpenseCategory | "Venda de produção";
    value: number;
    description: string;
    culture: string;
  }) => Promise<void>;
}

export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>("despesa");
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [category, setCategory] = useState<ExpenseCategory | "Venda de produção">("Insumos");
  const [value, setValue] = useState("");
  const [culture, setCulture] = useState("Soja");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const categoriesList: ExpenseCategory[] = [
    "Mão de obra contratada",
    "Mão de obra familiar",
    "Mecanização",
    "Insumos",
    "Defensivos",
    "Fertilizantes",
    "Combustível",
    "Energia elétrica",
    "Internet",
    "Manutenção",
    "Despesas administrativas",
    "Impostos",
    "Empréstimos",
    "INSS",
    "ITR",
    "IPVA",
  ];

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === "receita") {
      setCategory("Venda de produção");
    } else {
      setCategory("Insumos");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value || Number(value) <= 0 || !date) return;

    setLoading(true);
    setSuccess(false);

    try {
      await onAddTransaction({
        date,
        type,
        category,
        value: Number(value),
        description,
        culture: type === "receita" && culture === "Geral" ? "Soja" : culture, // Vendas usually assigned to specific culture
      });

      setSuccess(true);
      setValue("");
      setDescription("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/80 p-5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="text-emerald-700" size={18} />
          <h3 className="text-sm font-semibold text-stone-800 font-display">
            Lançamento Financeiro Rápido
          </h3>
        </div>
        <button
          id="btn-toggle-transaction-form"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 underline pointer-cursor"
        >
          {isOpen ? "Ocultar Painel" : "Mostrar Lançador"}
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-stone-100 space-y-4 animate-fade-in">
          {success && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-xs font-medium">
              ✓ Lançamento incluído com sucesso no Livro Caixa!
            </div>
          )}

          {/* Type trigger toggler */}
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              id="form-tx-despesa"
              onClick={() => handleTypeChange("despesa")}
              className={`flex-1 py-1.5 text-center rounded-lg text-xs font-medium transition-all ${
                type === "despesa" ? "bg-white text-stone-800 shadow-xs" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Despesa (Débito)
            </button>
            <button
              type="button"
              id="form-tx-receita"
              onClick={() => handleTypeChange("receita")}
              className={`flex-1 py-1.5 text-center rounded-lg text-xs font-medium transition-all ${
                type === "receita" ? "bg-white text-stone-800 shadow-xs" : "text-stone-400 hover:text-stone-700"
              }`}
            >
              Receita (Venda)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Value input */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Valor (R$)</label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="R$ 0,00"
                className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 text-stone-800 font-mono focus:outline-emerald-600"
              />
            </div>

            {/* Date input */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Data</label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-emerald-600 font-mono"
                />
              </div>
            </div>

            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Categoria de Custo</label>
              {type === "receita" ? (
                <input
                  type="text"
                  disabled
                  value="Venda de produção"
                  className="w-full text-xs bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-stone-500 font-medium"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 text-stone-700 font-medium focus:outline-emerald-600"
                >
                  {categoriesList.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Culture selector */}
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Vincular à Cultura</label>
              <select
                value={culture}
                onChange={(e) => setCulture(e.target.value)}
                className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 text-stone-700 font-medium focus:outline-emerald-600"
              >
                <option value="Soja">Soja</option>
                <option value="Milho">Milho</option>
                <option value="Café">Café</option>
                <option value="Outros">Outros</option>
                {type === "despesa" && <option value="Geral">Infraestrutura Geral</option>}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider mb-1">Descrição / Detalhe</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Compra de sementes qualificadas, venda cooperativa, etc."
              className="w-full text-xs bg-white border border-stone-200 rounded-lg p-2.5 text-stone-800 focus:outline-emerald-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 text-white font-medium py-2.5 rounded-xl text-xs hover:bg-emerald-800 transition-colors cursor-pointer disabled:bg-stone-200 disabled:text-stone-400 flex items-center justify-center gap-1.5"
          >
            <Plus size={14} />
            {loading ? "Inserindo..." : "Adicionar Lançamento Financeiro"}
          </button>
        </form>
      )}
    </div>
  );
}
