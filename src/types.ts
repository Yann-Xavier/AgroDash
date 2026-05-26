export type TransactionType = 'receita' | 'despesa';

export type ExpenseCategory =
  | 'Mão de obra contratada'
  | 'Mão de obra familiar'
  | 'Mecanização'
  | 'Insumos'
  | 'Defensivos'
  | 'Fertilizantes'
  | 'Combustível'
  | 'Energia elétrica'
  | 'Internet'
  | 'Manutenção'
  | 'Despesas administrativas'
  | 'Impostos'
  | 'Empréstimos'
  | 'INSS'
  | 'ITR'
  | 'IPVA'
  | 'Outras Despesas';

export type StockItemName = string;

export interface FinancialTransaction {
  id: string;
  date: string;
  type: TransactionType;
  category: ExpenseCategory | 'Venda de produção' | string;
  value: number;
  description: string;
  culture: string;
  field?: string; // Talhão
  entity?: string; // Fornecedor / Cliente
  notes?: string;
}

export interface StockItem {
  id: string; // Backward compatibility id
  code?: string; // Código do produto (opcional para retrocompatibilidade)
  name: string; // Nome do produto
  category?: string; // Categoria (ex: Herbicida, Adubo, etc)
  unit: string; // Unidade de medida
  minQty: number; // Estoque mínimo
  location?: string; // Local de armazenamento
  notes?: string; // Observações
  // Calculated fields:
  currentQty: number;
  totalValueInStock?: number;
  lastPrice: number;
  priceTrend?: 'baixo' | 'medio' | 'alto';
}

export interface StockTransaction {
  id: string;
  date: string; // Crucial date field
  itemId?: string; // Backport compatibility ID
  itemCode?: string; // Código do produto (opcional para retrocompatibilidade com o backend)
  itemName: string; // Nome do produto
  type: 'Entrada' | 'Saída' | 'compra' | 'consumo'; // Supports both raw sheet labels and server API
  qty: number; // Quantidade
  unitPrice?: number; // Valor unitário (opcional)
  totalValue?: number; // Valor total (opcional)
  supplier?: string; // Fornecedor
  culture?: string; // Talhão/Cultura
  field?: string; // Talhão
  responsible?: string; // Responsável
  notes?: string; // Observações
}

export interface MarketAlert {
  id: string;
  itemName: string;
  status: 'oportuno' | 'estavel' | 'desfavoravel';
  details: string;
}

export interface ExcelFileData {
  sheets: Record<string, any[][]>;
  activeSheet: string;
  fileName: string;
  parsingStatus: string;
  validationLogs: string[];
}
