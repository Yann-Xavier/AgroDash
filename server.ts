import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { FinancialTransaction, StockItem, StockTransaction } from "./src/types.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory DB
let transactions: FinancialTransaction[] = [
  // 2026 Revenues
  {
    id: "t1",
    date: "2026-04-15",
    type: "receita",
    category: "Venda de produção",
    value: 320000,
    description: "Venda de lote de Soja Cooperativa Regional (130t)",
    culture: "Soja"
  },
  {
    id: "t2",
    date: "2026-05-10",
    type: "receita",
    category: "Venda de produção",
    value: 125000,
    description: "Venda de produção de Milho Safrinha",
    culture: "Milho"
  },
  {
    id: "t3",
    date: "2026-05-20",
    type: "receita",
    category: "Venda de produção",
    value: 450000,
    description: "Contrato de entrega de Café Arábica beneficiado",
    culture: "Café"
  },
  
  // 2026 Expenses
  {
    id: "e1",
    date: "2026-01-10",
    type: "despesa",
    category: "Fertilizantes",
    value: 48000,
    description: "Compra antecipada de adubo mineral NPK de base",
    culture: "Soja"
  },
  {
    id: "e2",
    date: "2026-01-20",
    type: "despesa",
    category: "Defensivos",
    value: 36000,
    description: "Herbicidas pré-emergentes distribuidora local",
    culture: "Soja"
  },
  {
    id: "e3",
    date: "2026-02-05",
    type: "despesa",
    category: "Combustível",
    value: 18500,
    description: "Abastecimento do tanque central (Diesel S10, 3.500L)",
    culture: "Geral"
  },
  {
    id: "e4",
    date: "2026-02-15",
    type: "despesa",
    category: "Mão de obra contratada",
    value: 12000,
    description: "Diárias de tratoristas temporários na capina química",
    culture: "Geral"
  },
  {
    id: "e5",
    date: "2026-03-01",
    type: "despesa",
    category: "IPVA",
    value: 4600,
    description: "IPVA Caminhonete Hilux e Caminhão Caçamba",
    culture: "Geral"
  },
  {
    id: "e6",
    date: "2026-03-10",
    type: "despesa",
    category: "Manutenção",
    value: 7500,
    description: "Revisão e troca de bicos do Pulverizador Jacto",
    culture: "Soja"
  },
  {
    id: "e7",
    date: "2026-03-12",
    type: "despesa",
    category: "Energia elétrica",
    value: 3800,
    description: "Fatura de energia do galpão de secagem e bomba d'água",
    culture: "Café"
  },
  {
    id: "e8",
    date: "2026-03-25",
    type: "despesa",
    category: "Impostos",
    value: 29000,
    description: "Recolhimento ICMS e taxas estaduais agronegócio",
    culture: "Geral"
  },
  {
    id: "e9",
    date: "2026-04-05",
    type: "despesa",
    category: "Defensivos",
    value: 22000,
    description: "Fungicida foliar aplicação emergencial ferrugem",
    culture: "Café"
  },
  {
    id: "e10",
    date: "2026-04-20",
    type: "despesa",
    category: "Mecanização",
    value: 15400,
    description: "Aluguel temporário de colhedora de arroz/milho",
    culture: "Milho"
  },
  {
    id: "e11",
    date: "2026-05-02",
    type: "despesa",
    category: "Mão de obra familiar",
    value: 8000,
    description: "Pró-labore mensal para gestão familiar",
    culture: "Geral"
  },
  {
    id: "e12",
    date: "2026-05-15",
    type: "despesa",
    category: "Empréstimos",
    value: 14200,
    description: "Amortização da parcela do trator John Deere 4x4",
    culture: "Geral"
  },
  {
    id: "e13",
    date: "2026-05-22",
    type: "despesa",
    category: "ITR",
    value: 1250,
    description: "Imposto Territorial Rural glebas norte/sul",
    culture: "Geral"
  },
  {
    id: "e14",
    date: "2026-05-24",
    type: "despesa",
    category: "Internet",
    value: 350,
    description: "Assinatura Banda Larga Starlink Rural integrada",
    culture: "Geral"
  }
];

let stockItems: StockItem[] = [
  {
    id: "s1",
    name: "Herbicida",
    currentQty: 180,
    minQty: 250,
    unit: "Litros",
    priceTrend: "baixo", // Opportune time! Under safety limit & low market price
    lastPrice: 65 // R$/Litro
  },
  {
    id: "s2",
    name: "Fungicida",
    currentQty: 340,
    minQty: 150,
    unit: "Litros",
    priceTrend: "alto", // Expensive
    lastPrice: 110
  },
  {
    id: "s3",
    name: "Inseticida",
    currentQty: 95,
    minQty: 120,
    unit: "Litros",
    priceTrend: "medio", // Stable
    lastPrice: 85
  },
  {
    id: "s4",
    name: "Adubo",
    currentQty: 12000,
    minQty: 15000,
    unit: "Kg",
    priceTrend: "baixo", // Under limit & low market price - perfect buying window!
    lastPrice: 3.2
  },
  {
    id: "s5",
    name: "Foliar",
    currentQty: 500,
    minQty: 300,
    unit: "Litros",
    priceTrend: "alto", // Expensive, but stock levels are rich
    lastPrice: 22
  }
];

let stockTransactions: StockTransaction[] = [
  {
    id: "st1",
    itemId: "s1",
    itemName: "Herbicida",
    type: "compra",
    qty: 100,
    date: "2026-01-20",
    unitPrice: 65,
    totalValue: 6500,
    culture: "Geral"
  },
  {
    id: "st2",
    itemId: "s1",
    itemName: "Herbicida",
    type: "consumo",
    qty: 120,
    date: "2026-03-05",
    culture: "Soja"
  },
  {
    id: "st3",
    itemId: "s4",
    itemName: "Adubo",
    type: "compra",
    qty: 10000,
    date: "2026-01-10",
    unitPrice: 3.2,
    totalValue: 32000,
    culture: "Geral"
  },
  {
    id: "st4",
    itemId: "s4",
    itemName: "Adubo",
    type: "consumo",
    qty: 8000,
    date: "2026-04-12",
    culture: "Milho"
  }
];

// Initialize Gemini Client safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.log("Aviso: GEMINI_API_KEY não encontrada no ambiente. Consultoria IA usará dados locais simulados.");
}

// REST APIs
app.get("/api/data", (req, res) => {
  res.json({
    transactions,
    stockItems,
    stockTransactions
  });
});

app.post("/api/transactions", (req, res) => {
  const { date, type, category, value, description, culture } = req.body;
  if (!date || !type || !category || !value) {
    return res.status(400).json({ error: "Parâmetros obrigatórios ausentes" });
  }

  const newTx: FinancialTransaction = {
    id: Math.random().toString(36).substring(2, 9),
    date,
    type,
    category,
    value: Number(value),
    description: description || "",
    culture: culture || "Geral"
  };

  transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

app.post("/api/stock/transaction", (req, res) => {
  const { itemId, type, qty, date, unitPrice, totalValue, culture } = req.body;
  if (!itemId || !type || !qty || !date) {
    return res.status(400).json({ error: "Parâmetros de estoque obrigatórios ausentes" });
  }

  const stockItem = stockItems.find(s => s.id === itemId);
  if (!stockItem) {
    return res.status(404).json({ error: "Item de estoque não encontrado" });
  }

  const quantityChange = Number(qty);
  if (type === "compra") {
    stockItem.currentQty += quantityChange;
    if (unitPrice) stockItem.lastPrice = Number(unitPrice);
  } else {
    if (stockItem.currentQty < quantityChange) {
      return res.status(400).json({ error: "Quantidade insuficiente em estoque" });
    }
    stockItem.currentQty -= quantityChange;
  }

  const newStockTx: StockTransaction = {
    id: Math.random().toString(36).substring(2, 9),
    itemId,
    itemName: stockItem.name,
    type,
    qty: quantityChange,
    date,
    unitPrice: unitPrice ? Number(unitPrice) : undefined,
    totalValue: totalValue ? Number(totalValue) : undefined,
    culture: culture || "Geral"
  };

  stockTransactions.unshift(newStockTx);

  // Auto create Financial transaction on purchase to show integrated cashflow!
  if (type === "compra" && totalValue) {
    const isDefensivo = ["Herbicida", "Fungicida", "Inseticida"].includes(stockItem.name);
    const category = isDefensivo ? "Defensivos" : "Fertilizantes";
    const financialTx: FinancialTransaction = {
      id: "auto-" + Math.random().toString(36).substring(2, 9),
      date,
      type: "despesa",
      category,
      value: Number(totalValue),
      description: `[Auto Estoque] Compra de ${quantityChange} e abastecimento de ${stockItem.name}`,
      culture: culture || "Geral"
    };
    transactions.unshift(financialTx);
  }

  res.json({ success: true, stockItem, stockTransaction: newStockTx, transactions });
});

// Advanced Agricultural AI Analyst
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { customQuestion } = req.body;

    // Build data summary for the prompt
    const totalRev = transactions.reduce((sum, t) => t.type === 'receita' ? sum + t.value : sum, 0);
    const totalExp = transactions.reduce((sum, t) => t.type === 'despesa' ? sum + t.value : sum, 0);
    const netProfit = totalRev - totalExp;
    const profitMargin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

    // Culture analysis
    const cropSales: Record<string, number> = {};
    const cropExpenses: Record<string, number> = {};
    transactions.forEach(t => {
      const col = t.culture || 'Geral';
      if (t.type === 'receita') {
        cropSales[col] = (cropSales[col] || 0) + t.value;
      } else {
        cropExpenses[col] = (cropExpenses[col] || 0) + t.value;
      }
    });

    const expensesByCategory: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'despesa') {
        expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.value;
      }
    });

    const criticalStocks = stockItems.map(item => ({
      name: item.name,
      status: item.currentQty < item.minQty ? "CRÍTICO/ABAIXO" : "OK",
      qty: `${item.currentQty} ${item.unit}`,
      min: `${item.minQty} ${item.unit}`,
      trend: item.priceTrend === 'baixo' ? "BAIXO (Oportunidade de compra)" : item.priceTrend === 'alto' ? "ALTO (Evitar comprar)" : "MÉDIO/ESTÁVEL"
    }));

    const detailsStr = `
- Receita Total: R$ ${totalRev.toLocaleString('pt-BR')}
- Despesa Total: R$ ${totalExp.toLocaleString('pt-BR')}
- Lucro Líquido: R$ ${netProfit.toLocaleString('pt-BR')} (Margem: ${profitMargin.toFixed(1)}%)
- Vendas por Cultura: ${JSON.stringify(cropSales)}
- Custos por Cultura: ${JSON.stringify(cropExpenses)}
- Distribuição de despesas por categoria: ${JSON.stringify(expensesByCategory)}
- Status de Estoque e Preços de Mercado: ${JSON.stringify(criticalStocks)}
`;

    if (!ai) {
      // Return a realistic simulation if API key is not configured
      const simulatedResponse = `### 🌾 Relatório de Consultoria de Planejamento Agrícola (Simulado)

**1. Diagnóstico do Caixa e Custos**
Analisando suas receitas de **R$ ${totalRev.toLocaleString('pt-BR')}** e despesas de **R$ ${totalExp.toLocaleString('pt-BR')}**, seu negócio apresenta um lucro operacional limpo de **R$ ${netProfit.toLocaleString('pt-BR')}** com margem de **${profitMargin.toFixed(1)}%**. 

As maiores despesas estão classificadas em:
${Object.entries(expensesByCategory).slice(0, 3).map(([cat, val]) => `- **${cat}**: R$ ${val.toLocaleString('pt-BR')}`).join('\n')}

**2. Estratégia Prática de Compras & Estoque Inteligente**
*   **${stockItems[0].name} (${stockItems[0].currentQty} ${stockItems[0].unit})**: Encontra-se **abaixo do estoque mínimo de segurança** (Meta: ${stockItems[0].minQty}). Como o preço de mercado atual está sinalizado como **BAIXO**, este é o **momento perfeito para comprar em lote**. Você economizará de 15% a 25% comparado ao final do trimestre com base na sazonalidade agrícola.
*   **${stockItems[3].name} (${stockItems[3].currentQty} ${stockItems[3].unit})**: Também está abaixo do limite mínimo. Preço de mercado está **BAIXO**. Recomendamos reposição urgente para garantir a adubação de cobertura do próximo ciclo antes das variações cambiais.

**3. Recomendação Estratégica por Cultura**
*   A cultura de **Café** lidera em geração bruta de valor, enquanto as operações de **Soja** demonstram uma excelente eficiência e menor complexidade logística direta para a propriedade neste ciclo. Certifique-se de amparar despesas com combustível e manutenção de maquinários nas fases de plantio e transporte de grãos.`;

      return res.json({ analysis: simulatedResponse });
    }

    let prompt = `Você é um agrônomo sênior, corretor de commodities agrícolas e especialista em controladoria financeira rural.
Analise os indicadores de desempenho reais da fazenda a seguir e forneça um relatório gerencial em português (PT-BR) conciso, com excelente formatação em Markdown, focado na tomada de decisão do proprietário:
${detailsStr}

Considere especificamente:
1. Onde ele está gastando mais (identifique as principais categorias e como otimizar).
2. Quais insumos críticos estão abaixo do estoque mínimo e cujos preços de mercado estão desfavoráveis ou favoráveis (se favoráveis, incentive compras urgentes; se desfavoráveis e com estoque aceitável, mande esperar).
3. Qual cultura agrícola está sendo mais rentável com base nos lançamentos, comparando margens.
4. Conclua com 3 ações táticas imediatas para a semana em tópicos claros.`;

    if (customQuestion) {
      prompt += `\n\nAlém disso, o proprietário fez a seguinte pergunta específica para você. Responda-a com precisão técnica agrícola:\n"${customQuestion}"`;
    }

    const result = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um consultor agrícola sênior especialista em agro-negócios brasileiros. Forneça respostas estratégicas de alta qualidade, realistas, sem lero-lero técnico exaustivo, sempre focadas no bolso e na segurança de cultivo do produtor."
      }
    });

    res.json({ analysis: result.text });
  } catch (err: any) {
    console.error("Erro no processamento da IA:", err);
    res.status(500).json({ error: "Erro ao gerar consultoria com Inteligência Artificial: " + err.message });
  }
});

// Vite middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
