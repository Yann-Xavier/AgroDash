# AgroDash Offline - Sistema de Gestão Agrícola Integrada

O **AgroDash Offline** é uma solução ARP (Agro Resource Planning) de alto padrão, autossuficiente e offline, operando diretamente no navegador web sem dependência de internet ou servidores externos.

Desenvolvido em HTML puro, CSS personalizado e JavaScript nativo estruturado, o sistema conserta a lacuna de rede em propriedades rurais distantes, permitindo que produtores carreguem seus bancos de dados Excel locais para gerar dashboards de fluxo de caixa, controle volumétrico de estoque e auditorias estruturais instantaneamente.

---

## 📂 Arquitetura do Projeto

Para utilizar o sistema em modo offline completo no seu computador (sem internet), certifique-se de organizar os arquivos na seguinte estrutura de diretórios:

```text
/agrodash-offline
│
├── index.html              # Interface do Usuário (Skins, Cards e Modais)
├── style.css               # Estilo, Cores Agrícolas, Fontes e CSS Responsivo
├── app.js                  # Lógica do Sistema (Parsing Excel, Cálculos e Gráficos)
│
└── /libs                   # Dependências Estáticas Locais
    ├── xlsx.full.min.js    # Biblioteca SheetJS (Leitura de planilhas Excel)
    └── chart.umd.min.js    # Biblioteca Chart.js (Renders dos gráficos dinâmicos)
```

> **Aviso de Portabilidade:** O sistema possui fail-safes inteligentes. Se o computador possuir acesso à internet, ele carregará as dependências de CDN públicas. Se não possuir internet, o sistema carregará **automaticamente** dos arquivos da pasta `/libs`.

---

## ⚡ Como Executar Localmente (100% Offline)

1. Faça o download ou exporte a pasta completa do projeto do AgroDash.
2. Certifique-se de que os arquivos `index.html`, `style.css` e `app.js` estejam na mesma pasta.
3. Certifique-se de que a pasta `libs` possua as bibliotecas `xlsx.full.min.js` e `chart.umd.min.js`.
4. **Basta dar um duplo-clique no arquivo `index.html`!** O navegador abrirá a tela de segurança imediatamente, funcionando sem internet e sem necessidade de servidores locais.

---

## 🔒 Regras de Segurança e Primeiro Acesso

O sistema simula um banco de dados relacional de usuários integrado ao `localStorage` seguro do próprio navegador.

### Presets de Acesso Regulamentados:

*   **Acesso Administrador Principal:**
    *   **Usuário (Login):** `AdminLogin`
    *   **Senha de Primeiro Acesso:** `AdminSenha`
    *   **Aviso Importante:** No primeiro acesso do Administrador, o sistema força a **alteração imediata da senha** em um formulário exclusivo de segurança. A nova senha é gravada localmente de forma persistente, invalidando a senha padrão e resguardando a integridade do sistema.

---

## 📊 Estrutura Padrão da Planilha Importada

Para que as análises operem em conformidade, a sua planilha Excel original deve seguir as seguintes abas e layouts:

### 1. Aba: `Cadastro_Produtos`
Lista unificada de insumos e matérias-primas.
*   **Colunas Requeridas:** `Código do Produto`, `Nome do Produto`, `Categoria`, `Unidade de Medida`, `Estoque Mínimo`, `Local de Armazenamento`, `Status`, `Observações`.

### 2. Aba: `Controle_Almoxarifado`
Ficha Kardex física das movimentações volumétricas.
*   **Colunas Requeridas:** `Data` (Formato AAAA-MM-DD ou DD/MM/AAAA), `Código do Produto`, `Nome do Produto`, `Tipo de Movimento` (`Entrada Estoque` ou `Saída Estoque`), `Quantidade`, `Unidade`, `Valor Unitário`, `Valor Total`, `Fornecedor`, `Cultura`, `Responsável`, `Observações`.

### 3. Aba: `Fluxo_Financeiro` (Anual Consolidado)
*   **Colunas Requeridas:** `Data`, `Tipo` (`Receita` ou `Despesa`), `Categoria`, `Subcategoria` ou `Descrição`, `Cultura`, `Safra`, `Valor Total`, `Status` (`Pago` ou `Pendente`).
*   *Nota:* Se esta aba estiver ausente, o sistema tentará consolidar as informações a partir das abas mensais, se presentes: `Janeiro`, `Fevereiro`, ..., `Dezembro`.

---

## 🛠 Recursos Úteis e Funcionalidades Exclusivas

*   **Baixar Modelo Excel base:** Baixa no ato uma planilha Excel modelo contendo todas as estruturas e registros demonstração para auxiliar novos preenchimentos.
*   **Inspetor de Células Brancas:** No menu "Fonte de Dados", ao selecionar qualquer aba para análise visual das celulas, o sistema grifará **em amarelo pontilhado** cada campo em branco ou ausente, permitindo auditorias minuciosas antes de consolidar fechamentos.
*   **Validador de Colunas:** Informa se as colunas essenciais estão ausentes ou renomeadas incorretamente de forma interativa.
*   **Exportar Dados Roundtrip:** Permite que você modifique saldos ou adicione lançamentos rápidos no navegador e exporte de volta em formato `.xlsx` estruturado idêntico, fechando o fluxo de edição perfeita offline.
