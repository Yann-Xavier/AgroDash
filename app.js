/**
 * AgroDash Offline - Application logic
 * Features: LocalStorage user list database with first-access login system,
 * SheetJS Excel spreadsheet parsing, validation, automated alerts,
 * Chart.js responsive analytics graphs, and data roundtrip export.
 */

// ----------------------------------------------------
// 1. DATA MODELS & CONSTANTS
// ----------------------------------------------------

// Default demo sheets loaded first-use for a rich "out-of-the-box" experience
const DEFAULT_DEMO_SHEETS = {
  "Cadastro_Produtos": [
    ["Código do Produto", "Nome do Produto", "Categoria", "Unidade de Medida", "Estoque Mínimo", "Local de Armazenamento", "Status", "Observações"],
    ["HERB-01", "Glifosato Herbicida de Base", "Defensivos", "Litros", 250, "Galpão Principal A", "Uso emergencial antes do plantio"],
    ["FUNG-02", "Fungicida Systemic Pro", "Defensivos", "Litros", 150, "Câmara Climatizada", "Evitar umidade alta de armazenagem"],
    ["ADU-03", "NPK 04-14-08 Fertilizante", "Fertilizantes", "Kg", 15000, "Depósito de Adubo", "Insumo indispensável de cobertura"],
    ["MIL-SEMENTE", "Semente de Milho Híbrido", "Insumos", "Sacos", 40, "Galpão Principal B", "Sementes certificadas safrinha"],
    ["COMBUST", "Óleo Diesel S10", "Combustível", "Litros", 500, "Tanque Central de Abastecimento", "Abastecimento frotas de tratores"]
  ],
  "Controle_Almoxarifado": [
    ["Data", "Código do Produto", "Nome do Produto", "Tipo de Movimento", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Fornecedor", "Cultura", "Responsável", "Observações"],
    ["2026-01-20", "HERB-01", "Glifosato Herbicida de Base", "Entrada Estoque", 100, "Litros", 65, 6500, "Agroquímica Sul", "Geral", "Yann Xavier", "Compra planejada regular"],
    ["2026-03-05", "HERB-01", "Glifosato Herbicida de Base", "Saída Estoque", 120, "Litros", 65, 7800, "", "Soja", "Rodrigo M.", "Preparação de canteiros"],
    ["2026-01-10", "ADU-03", "NPK 04-14-08 Fertilizante", "Entrada Estoque", 20000, "Kg", 3.2, 64000, "Fertilizantes Brasil Ltda", "Geral", "Yann Xavier", "Compra em lote facilitada"],
    ["2026-04-12", "ADU-03", "NPK 04-14-18 Fertilizante", "Saída Estoque", 12000, "Kg", 3.2, 38400, "", "Milho", "Rodrigo M.", "Adubação Milho Safrinha"]
  ],
  "Fluxo_Financeiro": [
    ["Data", "Tipo", "Categoria", "Subcategoria", "Descrição", "Cultura", "Safra", "Talhão", "Centro de Custo", "Fornecedor ou Cliente", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Forma de Pagamento", "Status", "Observações"],
    ["2026-04-15", "Receita", "Venda de produção", "Contratos", "Venda de lote de Soja Cooperativa Regional (130t)", "Soja", "2025/2026", "Talhão 2", "Soja", "Cooperativa Agro", 130, "Toneladas", 2461.5, 320000, "Transferência", "Pago", ""],
    ["2026-05-10", "Receita", "Venda de produção", "Contratos", "Venda de produção de Milho Safrinha", "Milho", "2025/2026", "Talhão 1", "Milho", "Grãos Brasil", 1, "Un", 125000, 125000, "Transferência", "Pago", ""],
    ["2026-05-20", "Receita", "Venda de produção", "Balcão", "Contrato de entrega de Café Arábica beneficiado", "Café", "2025/2026", "Lote Principal", "Café", "Exportadora GrãoFino", 1, "Un", 450000, 450000, "Transferência", "Pago", ""],
    ["2026-01-10", "Despesa", "Fertilizantes", "Nutrientes", "Compra antecipada de adubo mineral NPK de base", "Soja", "2025/2026", "Geral", "Soja", "Fertilizantes Brasil", 20000, "Kg", 3.2, 64000, "Faturamento 30d", "Pago", ""],
    ["2026-02-15", "Despesa", "Insumos", "Sementes", "Sementes Milho Híbrido Safrinha", "Milho", "2025/2026", "Talhão 1", "Milho", "Sementes Agro", 40, "Sacos", 360, 14400, "Faturamento 30d", "Pago", ""],
    ["2026-03-05", "Despesa", "Defensivos", "Herbicida", "Herbicidas pré-emergentes distribuidora local", "Soja", "2025/2026", "Geral", "Soja", "Agroquímica Sul", 120, "Litros", 162.5, 19500, "Pix", "Pago", ""],
    ["2026-03-15", "Despesa", "Combustível", "Diesel", "Abastecimento do tanque central Diesel S10 (3500L)", "Geral", "2025/2026", "Geral", "Geral", "Rede Posto Rural", 3500, "Litros", 5.285, 18500, "Cartão", "Pago", ""],
    ["2026-04-02", "Despesa", "Mão de obra contratada", "Serviços", "Prestação de serviços colheita temporários", "Geral", "2025/2026", "Lote Principal", "Geral", "Trabalhadores Sazonais", 1, "Un", 12000, 12000, "Pix", "Pago", ""],
    ["2026-05-15", "Despesa", "Manutenção", "Pulverização", "Revisão e troca de bicos do Pulverizador Jacto", "Soja", "2025/2026", "Geral", "Geral", "Mecânica Agrícola", 1, "Un", 7500, 7500, "Pix", "Pago", ""]
  ],
  "Listas": [
    ["Cultura", "Categoria", "Unidade", "Safra"],
    ["Soja", "Defensivos", "Litros", "2025/2026"],
    ["Milho", "Fertilizantes", "Kg", "2026/2027"],
    ["Café", "Insumos", "Sacos", ""],
    ["Algodão", "Combustível", "Un", ""],
    ["Geral", "Manutenção", "Toneladas", ""]
  ]
};

const REQUIRED_PRODUCTS_COLS = ["Código"], REQUIRED_STOCK_TXS_COLS = ["Código", "Quantidade"], REQUIRED_CASH_COLS = ["Tipo", "Valor Total"];

const MONTH_NAMES_PT = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

// ----------------------------------------------------
// 2. IN-MEMORY GLOBAL WORKSPACE STATE
// ----------------------------------------------------
let activeUser = null;
let spreadsheetFileName = "";
let uploadedRawSheets = {}; // Sheets as 2D arrays: { [sheetName]: any[][] }
let activeView = "home"; // "home" | "finance" | "stock" | "source"

// Filter states
let finFilters = { month: "Todos", type: "Todos", category: "Todos", culture: "Todas", status: "Todos" };
let stockFilters = { prod: "Todos", cat: "Todos", loc: "Todos", month: "Todos" };

// Structured data sets
let productsData = [];     // parsed products registration
let stockMovements = [];   // parsed stock movements
let financialData = [];    // parsed financial rows

// Chart instances for hot updating without re-render canvas glitches
let charts = {
  homeRevExp: null,
  homeBalance: null,
  finExp: null,
  finRev: null,
  stockLevels: null,
  stockConsumption: null
};

// ----------------------------------------------------
// 2.5. NON-BLOCKING CUSTOM DIALOG & TOAST UTILITIES
// ----------------------------------------------------
function showCustomAlert(message, type = "success") {
  let container = document.getElementById("custom-toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "custom-toast-container";
    container.className = "fixed bottom-5 right-5 flex flex-col gap-2 z-55 max-w-sm w-full pointer-events-none";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  let bgClass = "bg-stone-900 text-white";
  let iconHtml = "";

  if (type === "success") {
    bgClass = "bg-emerald-900/95 text-emerald-50 border border-emerald-800";
    iconHtml = `<svg class="text-emerald-400 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
  } else if (type === "error") {
    bgClass = "bg-rose-950/95 text-rose-50 border border-rose-900";
    iconHtml = `<svg class="text-rose-450 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  } else if (type === "warning") {
    bgClass = "bg-amber-950/95 text-amber-50 border border-amber-900";
    iconHtml = `<svg class="text-amber-450 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/></svg>`;
  } else {
    bgClass = "bg-stone-900/95 text-stone-50 border border-stone-800";
    iconHtml = `<svg class="text-stone-400 shrink-0" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
  }

  toast.className = `p-3.5 rounded-xl shadow-lg flex items-center gap-2.5 text-xs font-semibold font-sans backdrop-blur-md transition-all duration-300 transform translate-y-2 opacity-0 pointer-events-auto ${bgClass}`;
  toast.innerHTML = `
    ${iconHtml}
    <span class="flex-1 leading-normal text-left">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.remove("translate-y-2", "opacity-0");
  }, 10);

  setTimeout(() => {
    toast.classList.add("opacity-0", "scale-95");
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 4500);
}

function showCustomConfirm(message, onConfirm) {
  const overlay = document.createElement("div");
  overlay.className = "fixed inset-0 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-55 transition-opacity duration-250";
  overlay.id = "custom-confirm-modal";

  const card = document.createElement("div");
  card.className = "bg-white rounded-2xl shadow-xl border border-stone-150 max-w-sm w-full p-5-6 transform scale-95 opacity-0 transition-transform transition-opacity duration-250 space-y-4 text-left p-6";
  
  const header = document.createElement("div");
  header.className = "flex items-start gap-3";
  header.innerHTML = `
    <div class="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
    </div>
    <div class="flex-1">
      <h3 class="text-sm font-bold text-stone-900">Confirmação de Ação</h3>
      <p class="text-xs text-stone-600 mt-1 leading-relaxed">${message}</p>
    </div>
  `;
  card.appendChild(header);

  const footer = document.createElement("div");
  footer.className = "flex items-center justify-end gap-2 pt-2";
  
  const btnCancel = document.createElement("button");
  btnCancel.className = "px-3.5 py-2 text-xs font-semibold rounded-xl text-stone-500 hover:text-stone-850 hover:bg-stone-50 cursor-pointer transition-all";
  btnCancel.innerText = "Cancelar";
  btnCancel.onclick = () => {
    card.classList.add("scale-100", "opacity-0");
    overlay.classList.add("opacity-0");
    setTimeout(() => overlay.remove(), 250);
  };

  const btnConfirm = document.createElement("button");
  btnConfirm.className = "px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-700 text-white cursor-pointer transition-all shadow-sm";
  btnConfirm.innerText = "Confirmar";
  btnConfirm.onclick = () => {
    card.classList.add("scale-100", "opacity-0");
    overlay.classList.add("opacity-0");
    setTimeout(() => {
      overlay.remove();
      onConfirm();
    }, 250);
  };

  footer.appendChild(btnCancel);
  footer.appendChild(btnConfirm);
  card.appendChild(footer);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  setTimeout(() => {
    card.classList.remove("scale-95", "opacity-0");
  }, 10);
}

// Override native non-blocking dialogs safely
window.alert = (msg) => showCustomAlert(msg, "info");

// ----------------------------------------------------
// 3. SECURE LOCAL USER STORAGE DATABASE ENGINE
// ----------------------------------------------------
const INITIAL_USERS_DB = [
  { username: "AdminLogin", passwordHash: "AdminSenha", isFirstAccess: true, name: "Administrador Geral" }
];

function initUserDb() {
  if (!localStorage.getItem("agropanel_users_database")) {
    localStorage.setItem("agropanel_users_database", JSON.stringify(INITIAL_USERS_DB));
  } else {
    try {
      const users = JSON.parse(localStorage.getItem("agropanel_users_database"));
      const filtered = users.filter(u => u.username.trim().toLowerCase() !== "yann.xavierr@gmail.com");
      if (users.length !== filtered.length) {
        localStorage.setItem("agropanel_users_database", JSON.stringify(filtered));
      }
    } catch (e) {
      localStorage.setItem("agropanel_users_database", JSON.stringify(INITIAL_USERS_DB));
    }
  }
}

function getUsersList() {
  initUserDb();
  return JSON.parse(localStorage.getItem("agropanel_users_database"));
}

function verifyCredentials(username, challengePassword) {
  const users = getUsersList();
  const matched = users.find(u => u.username.trim().toLowerCase() === username.trim().toLowerCase() || u.username.trim().toLowerCase() === username.trim().toLowerCase());
  if (matched && matched.passwordHash === challengePassword) {
    return matched;
  }
  return null;
}

function changeUserPassword(username, newPass) {
  const users = getUsersList();
  const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    users[idx].passwordHash = newPass;
    users[idx].isFirstAccess = false;
    localStorage.setItem("agropanel_users_database", JSON.stringify(users));
    return true;
  }
  return false;
}

// ----------------------------------------------------
// 4. APPLICATION ROUTINE INITIALIZER
// ----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initUserDb();
  bindListeners();
  checkActiveSession();
});

function checkActiveSession() {
  const cachedUser = localStorage.getItem("agropanel_logged_user");
  if (cachedUser) {
    activeUser = JSON.parse(cachedUser);
    showAppDashboard();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById("login-screen").classList.remove("hidden");
  document.getElementById("change-password-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

function showPasswordResetScreen() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("change-password-screen").classList.remove("hidden");
  document.getElementById("app-screen").classList.add("hidden");
}

function showAppDashboard() {
  document.getElementById("login-screen").classList.add("hidden");
  document.getElementById("change-password-screen").classList.add("hidden");
  document.getElementById("app-screen").classList.remove("hidden");

  // Update navbar user profile details
  document.getElementById("user-display-tag").textContent = activeUser.name || activeUser.username;

  // Show or hide Admin User Management sidebar button
  const uNavBtn = document.getElementById("btn-nav-users");
  if (uNavBtn) {
    const isSystemAdmin = activeUser && (activeUser.username.trim().toLowerCase() === "adminlogin" || activeUser.role === "Administrador");
    if (isSystemAdmin) {
      uNavBtn.classList.remove("hidden");
    } else {
      uNavBtn.classList.add("hidden");
    }
  }

  // Boot standard spreadsheet memory (first preloaded demo or load from local storage)
  loadWorkspaceData();
  renderApp();

  // Initialize Google Sheets Sync panel and listeners
  if (typeof initGoogleSheetsSync === "function") {
    initGoogleSheetsSync();
  }
}

// ----------------------------------------------------
// 5. EVENT LISTENERS REGISTRATION
// ----------------------------------------------------
function bindListeners() {
  // Login Form trigger
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const userVal = document.getElementById("login-username").value.trim();
      const passVal = document.getElementById("login-password").value.trim();

      const matchedUser = verifyCredentials(userVal, passVal);
      if (matchedUser) {
        document.getElementById("login-error-box").classList.add("hidden");
        // Check for Forced Reset first use case
        if (matchedUser.isFirstAccess) {
          activeUser = matchedUser; // temp assign to use inside reset schema
          showPasswordResetScreen();
        } else {
          // Logged in!
          activeUser = matchedUser;
          localStorage.setItem("agropanel_logged_user", JSON.stringify(matchedUser));
          showAppDashboard();
        }
      } else {
        document.getElementById("login-error-message").innerText = "Credenciais inválidas. Por favor, verifique seu login e senha local cadastrados.";
        document.getElementById("login-error-box").classList.remove("hidden");
      }
    });
  }

  // Eye toggle password
  const togglePassBtn = document.getElementById("login-toggle-password");
  if (togglePassBtn) {
    togglePassBtn.addEventListener("click", () => {
      const passInput = document.getElementById("login-password");
      const eyeOpen = document.getElementById("pass-eye-open");
      const eyeClosed = document.getElementById("pass-eye-closed");

      if (passInput.type === "password") {
        passInput.type = "text";
        eyeOpen.classList.remove("hidden");
        eyeClosed.classList.add("hidden");
      } else {
        passInput.type = "password";
        eyeOpen.classList.add("hidden");
        eyeClosed.classList.remove("hidden");
      }
    });
  }

  // Reset password form submit action
  const changePassForm = document.getElementById("change-password-form");
  if (changePassForm) {
    changePassForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const newP = document.getElementById("new-password").value.trim();
      const confP = document.getElementById("confirm-password").value.trim();

      if (newP.length < 6) {
        showPassError("A nova senha deve possuir pelo menos 6 caracteres.");
        return;
      }
      if (newP === "AdminSenha") {
        showPassError("Sua nova senha não pode ser igual à senha padrão regulamentar.");
        return;
      }
      if (newP !== confP) {
        showPassError("A senha informada e sua repetição de confirmação não coincidem.");
        return;
      }

      // Commit changes to Local storage DB
      const updated = changeUserPassword(activeUser.username, newP);
      if (updated) {
        document.getElementById("pass-error-box").classList.add("hidden");
        // Reload login session details
        localStorage.setItem("agropanel_logged_user", JSON.stringify({ ...activeUser, isFirstAccess: false }));
        alert("Senha do Administrador salva em banco de dados local com sucesso!");
        showAppDashboard();
      } else {
        showPassError("Erro ao salvar senha de administrador local.");
      }
    });
  }

  function showPassError(msg) {
    document.getElementById("pass-error-message").innerText = msg;
    document.getElementById("pass-error-box").classList.remove("hidden");
  }

  // Log out button trigger
  const logoutBtn = document.getElementById("btn-logout");
  const logoutHeaderBtn = document.getElementById("btn-logout-header");
  const performLogout = () => {
    showCustomConfirm("Tem certeza que deseja sair com segurança da sessão atual?", () => {
      localStorage.removeItem("agropanel_logged_user");
      activeUser = null;
      showLoginScreen();
    });
  };
  if (logoutBtn) logoutBtn.addEventListener("click", performLogout);
  if (logoutHeaderBtn) logoutHeaderBtn.addEventListener("click", performLogout);

  // Sidebar navigation listeners
  const navHome = document.getElementById("btn-nav-home");
  const navFinance = document.getElementById("btn-nav-finance");
  const navStock = document.getElementById("btn-nav-stock");
  const navSource = document.getElementById("btn-nav-source");
  const navUsers = document.getElementById("btn-nav-users");

  const viewsList = [
    { btn: navHome, id: "home", title: "Painel Geral • Home", dom: "view-home" },
    { btn: navFinance, id: "finance", title: "Fluxo Financeiro Mensal", dom: "view-finance" },
    { btn: navStock, id: "stock", title: "Almoxarifado & Controle de Insumos", dom: "view-stock" },
    { btn: navSource, id: "source", title: "Inspetor de Dados Mestre de Planilha", dom: "view-source" },
    { btn: navUsers, id: "users", title: "Gerenciamento de Usuários do Sistema", dom: "view-users" }
  ];

  viewsList.forEach(viewItem => {
    if (viewItem.btn) {
      viewItem.btn.addEventListener("click", () => {
        // Toggle view active tab ID
        activeView = viewItem.id;
        document.getElementById("screen-title").innerText = viewItem.title;

        // Reset UI classes of nav buttons
        viewsList.forEach(v => {
          if (v.btn) {
            v.btn.className = "w-full flex items-center justify-between text-left px-3 py-2.5 text-xs font-semibold rounded-xl text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white transition-all cursor-pointer group";
            // Change SVG colors on active / inactive
            const svgElem = v.btn.querySelector("svg");
            if (svgElem) {
              svgElem.className.baseVal = "text-emerald-400 group-hover:text-emerald-100 transition-colors";
            }
          }
          const dBox = document.getElementById(v.dom);
          if (dBox) dBox.classList.add("hidden");
        });

        // Set visual indicator on clicked button
        viewItem.btn.className = "w-full flex items-center justify-between text-left px-3 py-2.5 text-xs font-semibold rounded-xl bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm transition-all cursor-pointer group";
        const actSvg = viewItem.btn.querySelector("svg");
        if (actSvg) {
          actSvg.className.baseVal = "text-amber-500 transition-colors";
        }
        const targetDom = document.getElementById(viewItem.dom);
        if (targetDom) targetDom.classList.remove("hidden");

        // Responsive sidebar dismissal
        if (window.innerWidth < 768) {
          const sidebarPanel = document.getElementById("sidebar-panel");
          sidebarPanel.classList.add("-translate-x-full");
        }

        renderApp();
      });
    }
  });

  // Mobile Hamburger toggler
  const mobileToggle = document.getElementById("btn-sidebar-toggle");
  if (mobileToggle) {
    mobileToggle.addEventListener("click", () => {
      const sidebarPanel = document.getElementById("sidebar-panel");
      if (sidebarPanel.classList.contains("-translate-x-full")) {
        sidebarPanel.classList.remove("-translate-x-full");
      } else {
        sidebarPanel.classList.add("-translate-x-full");
      }
    });
  }

  // Drag and drop events for file loading
  const dropZone = document.getElementById("home-drop-zone");
  const fileInput = document.getElementById("home-file-input");

  if (dropZone) {
    dropZone.addEventListener("click", () => {
      fileInput.click();
    });

    dropZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.classList.add("border-emerald-700", "bg-emerald-50/20");
    });

    dropZone.addEventListener("dragleave", () => {
      dropZone.classList.remove("border-emerald-700", "bg-emerald-50/20");
    });

    dropZone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropZone.classList.remove("border-emerald-700", "bg-emerald-50/20");
      if (e.dataTransfer.files.length > 0) {
        handleFileImport(e.dataTransfer.files[0]);
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFileImport(e.target.files[0]);
      }
    });
  }

  // RESET DATABASE STATE (wipe loaded xlsx memory, return to defaults)
  const resetBtn = document.getElementById("btn-reset-database-state");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      showCustomConfirm("Tem certeza que deseja redefinir o simulador para a planilha modelo de exemplo? Todas as alterações volatilizadas serão descartadas.", () => {
        localStorage.removeItem("agrodash_custom_sheets");
        localStorage.removeItem("agrodash_file_name");
        loadWorkspaceData();
        renderApp();
        showCustomAlert("O banco de dados do AgroDash foi redefinido com sucesso.", "success");
      });
    });
  }

  // BUTTON FILTERS CLEAN
  const clearFinFilters_btn = document.getElementById("btn-filter-fin-clear");
  if (clearFinFilters_btn) {
    clearFinFilters_btn.addEventListener("click", () => {
      finFilters = { month: "Todos", type: "Todos", category: "Todos", culture: "Todas", status: "Todos" };
      document.getElementById("filter-fin-month").value = "Todos";
      document.getElementById("filter-fin-type").value = "Todos";
      document.getElementById("filter-fin-category").value = "Todos";
      document.getElementById("filter-fin-culture").value = "Todas";
      document.getElementById("filter-fin-status").value = "Todos";
      renderFinanceDashboard();
    });
  }

  const clearStFilters_btn = document.getElementById("btn-filter-stock-clear");
  if (clearStFilters_btn) {
    clearStFilters_btn.addEventListener("click", () => {
      stockFilters = { prod: "Todos", cat: "Todos", loc: "Todos", month: "Todos" };
      document.getElementById("filter-stock-prod").value = "Todos";
      document.getElementById("filter-stock-cat").value = "Todos";
      document.getElementById("filter-stock-loc").value = "Todos";
      document.getElementById("filter-stock-month").value = "Todos";
      renderStockDashboard();
    });
  }

  // DOWNLOAD BASE TEMPLATE BUTTONS
  const btnDownloadTmp = document.getElementById("btn-download-base-template");
  if (btnDownloadTmp) {
    btnDownloadTmp.addEventListener("click", () => {
      downloadBaseXlsxTemplate();
    });
  }

  // EXPORT CURRENT REPAIR STATE AS .XLSX workbook back trip
  const btnExportState = document.getElementById("btn-export-synced-excel");
  if (btnExportState) {
    btnExportState.addEventListener("click", () => {
      exportCurrentStateToXlsx();
    });
  }

  // REGISTER FINANCIAL FILTER EVENT LISTENERS
  const finFilterIds = ["filter-fin-month", "filter-fin-type", "filter-fin-category", "filter-fin-culture", "filter-fin-status"];
  finFilterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) => {
        const prop = id.replace("filter-fin-", "");
        finFilters[prop] = e.target.value;
        renderFinanceDashboard();
      });
    }
  });

  // REGISTER STOCK FILTER EVENT LISTENERS
  const stockFilterIds = ["filter-stock-prod", "filter-stock-cat", "filter-stock-loc", "filter-stock-month"];
  stockFilterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener("change", (e) => {
        const prop = id.replace("filter-stock-", "");
        stockFilters[prop] = e.target.value;
        renderStockDashboard();
      });
    }
  });

  // SOURCE DATA SCREEN EVENTS
  const pickerSource = document.getElementById("source-sheet-picker");
  if (pickerSource) {
    pickerSource.addEventListener("change", (e) => {
      renderSourceInspectorTable(e.target.value);
    });
  }

  const btnUploadSourceExcel = document.getElementById("btn-upload-source-excel");
  const sourceFileInput = document.getElementById("source-file-input");
  if (btnUploadSourceExcel && sourceFileInput) {
    btnUploadSourceExcel.addEventListener("click", () => {
      sourceFileInput.click();
    });
    sourceFileInput.addEventListener("change", (e) => {
      if (e.target.files.length > 0) {
        handleFileImport(e.target.files[0]);
      }
    });
  }

  const btnExportJson = document.getElementById("btn-export-json-file");
  if (btnExportJson) {
    btnExportJson.addEventListener("click", () => {
      const dump = {
        metadata: {
          exportedAt: new Date().toISOString(),
          importedFile: spreadsheetFileName || "Simulado",
          user: activeUser?.username || "Guest"
        },
        products: productsData,
        stockMovements: stockMovements,
        finance: financialData,
        sourceSheets: uploadedRawSheets
      };

      const dumpStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dump, null, 2));
      const anchor = document.createElement('a');
      anchor.setAttribute("href", dumpStr);
      anchor.setAttribute("download", `agrodash_backup_${Date.now()}.json`);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    });
  }

  // User Manager Form submit handler
  const formManageUser = document.getElementById("form-manage-user");
  if (formManageUser) {
    formManageUser.addEventListener("submit", (e) => {
      e.preventDefault();
      
      const idxVal = document.getElementById("input-user-editing-idx").value;
      const fName = document.getElementById("input-user-fullname").value.trim();
      const uName = document.getElementById("input-user-username").value.trim();
      const pass = document.getElementById("input-user-password").value.trim();
      const uRole = document.getElementById("input-user-role").value;
      const needsReset = document.getElementById("input-user-force-reset").checked;

      if (pass.length < 6) {
        alert("A senha de acesso deve possuir pelo menos 6 caracteres.");
        return;
      }

      const users = getUsersList();

      if (idxVal === "") {
        // Create Mode
        const duplicate = users.find(u => u.username.trim().toLowerCase() === uName.toLowerCase());
        if (duplicate) {
          alert("Erro: Já existe um usuário cadastrado com este Login de Acesso!");
          return;
        }

        users.push({
          username: uName,
          passwordHash: pass,
          isFirstAccess: needsReset,
          name: fName,
          role: uRole
        });
        alert("Usuário local cadastrado com sucesso!");
      } else {
        // Edit Mode
        const idx = parseInt(idxVal, 10);
        if (users[idx]) {
          if (users[idx].username.toLowerCase() !== uName.toLowerCase()) {
            const duplicate = users.find((u, i) => i !== idx && u.username.trim().toLowerCase() === uName.toLowerCase());
            if (duplicate) {
               alert("Erro: Já existe um usuário cadastrado com este Login de Acesso!");
               return;
            }
          }

          const isMe = activeUser && activeUser.username.toLowerCase() === users[idx].username.toLowerCase();

          users[idx].name = fName;
          users[idx].username = uName;
          users[idx].passwordHash = pass;
          users[idx].isFirstAccess = needsReset;
          users[idx].role = uRole;

          if (isMe) {
            activeUser.name = fName;
            activeUser.username = uName;
            activeUser.passwordHash = pass;
            activeUser.isFirstAccess = needsReset;
            activeUser.role = uRole;
            localStorage.setItem("agropanel_logged_user", JSON.stringify(activeUser));
            document.getElementById("user-display-tag").textContent = fName;
          }

          alert("Os dados do usuário foram atualizados com sucesso!");
        }
      }

      localStorage.setItem("agropanel_users_database", JSON.stringify(users));
      resetUserForm();
      renderUsersPanel();
    });
  }

  const btnUserCancel = document.getElementById("btn-user-cancel");
  if (btnUserCancel) {
    btnUserCancel.addEventListener("click", () => {
      resetUserForm();
    });
  }

  function resetUserForm() {
    const fTitle = document.getElementById("form-user-title");
    const editIdx = document.getElementById("input-user-editing-idx");
    const fElement = document.getElementById("form-manage-user");
    const forceReset = document.getElementById("input-user-force-reset");
    const fRole = document.getElementById("input-user-role");
    
    if (fTitle) fTitle.innerText = "Cadastrar Novo Usuário";
    if (editIdx) editIdx.value = "";
    if (fElement) fElement.reset();
    if (forceReset) forceReset.checked = true;
    if (fRole) fRole.value = "Operador";
  }

  // Save Custom Suggestion Click Handler
  const btnSaveSuggestion = document.getElementById("btn-save-custom-suggestion");
  if (btnSaveSuggestion) {
    btnSaveSuggestion.addEventListener("click", () => {
      const area = document.getElementById("input-custom-suggestion");
      if (!area) return;
      const text = area.value.trim();
      if (!text) {
        alert("Por favor, escreva uma sugestão/anotação antes de gravar.");
        return;
      }
      saveCustomSuggestion(text);
      area.value = "";
      renderCustomSuggestions();
      alert("Sua sugestão foi gravada com sucesso!");
    });
  }
}

// ----------------------------------------------------
// 6. WORKSPACE DATA RETRIEVE STATE LOADER
// ----------------------------------------------------
function loadWorkspaceData() {
  const cachedFile = localStorage.getItem("agrodash_file_name");
  const cachedSheets = localStorage.getItem("agrodash_custom_sheets");

  if (cachedFile && cachedSheets) {
    spreadsheetFileName = cachedFile;
    uploadedRawSheets = JSON.parse(cachedSheets);
  } else {
    spreadsheetFileName = "";
    uploadedRawSheets = JSON.parse(JSON.stringify(DEFAULT_DEMO_SHEETS));
  }

  processSpreadsheetWorkspace();
}

// ----------------------------------------------------
// 7. EXCEL spreadsheet IMPORT LOGIC
// ----------------------------------------------------
function handleFileImport(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      // Read entire workbook in memory
      const workbook = XLSX.read(data, { type: 'array' });

      const parsedSheets = {};
      workbook.SheetNames.forEach(sheetName => {
        const info = workbook.Sheets[sheetName];
        // Parse into 2D value matrix [ [col1, col2], [val1, val2] ]
        const matrix = XLSX.utils.sheet_to_json(info, { header: 1, defval: "" });
        parsedSheets[sheetName] = matrix;
      });

      // Save spreadsheet in storage caches
      localStorage.setItem("agrodash_custom_sheets", JSON.stringify(parsedSheets));
      localStorage.setItem("agrodash_file_name", file.name);

      spreadsheetFileName = file.name;
      uploadedRawSheets = parsedSheets;

      processSpreadsheetWorkspace();
      renderApp();

      alert(`Sucesso! Planilha "${file.name}" carregada e processada offline.`);
    } catch {
      alert("Erro crítico: falha ao extrair ou interpretar dados do arquivo Excel. Verifique se o arquivo está corrompido ou inacessível.");
    }
  };
  reader.readAsArrayBuffer(file);
}

// ----------------------------------------------------
// 8. DATA PROCESSOR & COLLATION ENGINE
// ----------------------------------------------------
function processSpreadsheetWorkspace() {
  // Reset outputs
  productsData = [];
  stockMovements = [];
  financialData = [];

  // --- 8.1 PARSE PRODUCTS SHEETS ---
  const rawProds = uploadedRawSheets["Cadastro_Produtos"] || [];
  if (rawProds.length > 1) {
    const headers = rawProds[0].map(h => (h || "").toString().trim());

    // Locate column indexes flexibly (e.g. Code, Name, Base, Min stock qty, unit, loc, observations)
    const iCode = findHeaderIdx(headers, ["Código do Produto", "Código", "Cod", "SKU"]);
    const iName = findHeaderIdx(headers, ["Nome do Produto", "Nome", "Insumo", "Produto"]);
    const iCat = findHeaderIdx(headers, ["Categoria", "Grupo", "Tipo"]);
    const iUnit = findHeaderIdx(headers, ["Unidade de Medida", "Unidade", "Un", "Métrica"]);
    const iMinQty = findHeaderIdx(headers, ["Estoque Mínimo", "Estoque Min", "Mínimo", "Min"]);
    const iLoc = findHeaderIdx(headers, ["Local de Armazenamento", "Local", "Armazenamento", "Depósito"]);
    const iStatus = findHeaderIdx(headers, ["Status"]);
    const iObs = findHeaderIdx(headers, ["Observações", "Observação", "Detalhamento", "Obs"]);

    for (let r = 1; r < rawProds.length; r++) {
      const row = rawProds[r];
      if (row.length === 0 || !row[iCode]) continue; // Skip blank codes

      productsData.push({
        code: (row[iCode] || "").toString().trim(),
        name: (row[iName] || "").toString().trim(),
        category: (row[iCat] || "Outros").toString().trim(),
        unit: (row[iUnit] || "un").toString().trim(),
        minQty: Math.max(0, parseFloat(row[iMinQty]) || 0),
        location: (row[iLoc] || "Galpão Geral").toString().trim(),
        status: (row[iStatus] || "Ativo").toString().trim(),
        notes: (row[iObs] || "").toString().trim(),
        currentBalance: 0,
        valuation: 0,
        lastPrice: 0
      });
    }
  }

  // --- 8.2 PARSE STOCK MOVEMENTS SHEETS ---
  const rawStock = uploadedRawSheets["Controle_Almoxarifado"] || [];
  if (rawStock.length > 1) {
    const headers = rawStock[0].map(h => (h || "").toString().trim());

    const iDate = findHeaderIdx(headers, ["Data", "Dia", "Data Lançamento"]);
    const iCode = findHeaderIdx(headers, ["Código do Produto", "Código", "Cod", "SKU"]);
    const iName = findHeaderIdx(headers, ["Nome do Produto", "Nome", "Insumo"]);
    const iType = findHeaderIdx(headers, ["Tipo de Movimento", "Tipo", "Movimento", "Ação"]);
    const iQty = findHeaderIdx(headers, ["Quantidade", "Qtd", "Quant"]);
    const iUnit = findHeaderIdx(headers, ["Unidade"]);
    const iUnitPrice = findHeaderIdx(headers, ["Valor Unitário", "Preço Unitário", "Preço", "Custo Unitário", "Unitário"]);
    const iValTotal = findHeaderIdx(headers, ["Valor Total", "Preço Total", "Total", "Custo Total"]);
    const iSupplier = findHeaderIdx(headers, ["Fornecedor", "Origem"]);
    const iCulture = findHeaderIdx(headers, ["Cultura", "Lavoura", "Destino"]);
    const iResponsible = findHeaderIdx(headers, ["Responsável", "Operador", "Quem"]);
    const iObs = findHeaderIdx(headers, ["Observações", "Obs"]);

    for (let r = 1; r < rawStock.length; r++) {
      const row = rawStock[r];
      if (row.length === 0 || !row[iCode]) continue;

      const codeStr = (row[iCode] || "").toString().trim();
      const qtyVal = Math.max(0, parseFloat(row[iQty]) || 0);
      const unitP = Math.max(0, parseFloat(row[iUnitPrice]) || 0);
      let calculatedTotal = Math.max(0, parseFloat(row[iValTotal]) || 0);
      if (calculatedTotal === 0 && qtyVal > 0 && unitP > 0) {
        calculatedTotal = qtyVal * unitP;
      }

      stockMovements.push({
        id: `stx-${r}`,
        date: parseStringDate(row[iDate]),
        itemCode: codeStr,
        itemName: (row[iName] || "").toString().trim(),
        type: (row[iType] || "Entrada Estoque").toString().trim(),
        qty: qtyVal,
        unit: (row[iUnit] || "un").toString().trim(),
        unitPrice: unitP,
        totalValue: calculatedTotal,
        supplier: (row[iSupplier] || "").toString().trim(),
        culture: (row[iCulture] || "Geral").toString().trim(),
        responsible: (row[iResponsible] || "Yann Xavier").toString().trim(),
        notes: (row[iObs] || "").toString().trim()
      });
    }
  }

  // --- 8.3 PARSE FINANCIAL TRANSACTIONS ---
  // Prioritize "Fluxo_Financeiro" tab. If missing, accumulate JANEIRO - DEZEMBRO tabs
  const hasFinanceTab = !!uploadedRawSheets["Fluxo_Financeiro"];
  if (hasFinanceTab) {
    parseTableFinance(uploadedRawSheets["Fluxo_Financeiro"], "Fluxo_Financeiro");
  } else {
    // Traverse monthly tabs
    MONTH_NAMES_PT.forEach(month => {
      if (uploadedRawSheets[month]) {
        parseTableFinance(uploadedRawSheets[month], month);
      }
    });
  }

  // --- 8.4 CALCULATE PHYSICAL BALANCE & INVENTORY VALUATIONS ---
  // Collate transactions reverse chronologically to update current levels and last price averages
  productsData.forEach(prod => {
    // Sort transactions chronologically for this code to compute inventory levels correctly
    const prodTxs = stockMovements
      .filter(tx => tx.itemCode === prod.code)
      .sort((a, b) => a.date.localeCompare(b.date));

    let balance = 0;
    let sumUnitPrices = 0;
    let purchasesCount = 0;
    let lastKnownPrice = 0;

    prodTxs.forEach(tx => {
      const mType = tx.type.toLowerCase();
      const isInput = mType.includes("entrada") || mType.includes("compra") || mType.includes("ajuste entrada");
      const isOutput = mType.includes("saída") || mType.includes("consumo") || mType.includes("ajuste saída");

      if (isInput) {
        balance += tx.qty;
        if (tx.unitPrice > 0) {
          sumUnitPrices += tx.unitPrice;
          purchasesCount++;
          lastKnownPrice = tx.unitPrice;
        }
      } else if (isOutput) {
        balance -= tx.qty;
      }
    });

    prod.currentBalance = balance;
    prod.lastPrice = lastKnownPrice || (purchasesCount > 0 ? sumUnitPrices / purchasesCount : 0);
    prod.valuation = Math.max(0, prod.currentBalance * prod.lastPrice);
  });

  // Calculate top filters options
  repopulateFilterOptions();
}

function parseTableFinance(rawArray, tabName) {
  if (rawArray.length <= 1) return;
  const headers = rawArray[0].map(h => (h || "").toString().trim());

  const iDate = findHeaderIdx(headers, ["Data", "Dia"]);
  const iType = findHeaderIdx(headers, ["Tipo", "Movimentação"]);
  const iCat = findHeaderIdx(headers, ["Categoria", "Grupo"]);
  const iDesc = findHeaderIdx(headers, ["Subcategoria", "Descrição", "Histórico"]);
  const iCulture = findHeaderIdx(headers, ["Cultura", "Lavoura", "Destino"]);
  const iValTotal = findHeaderIdx(headers, ["Valor Total", "Valor", "Total", "Preço Total"]);
  const iStatus = findHeaderIdx(headers, ["Status", "Resultado"]);
  const iVendor = findHeaderIdx(headers, ["Fornecedor ou Cliente", "Quem", "Credor", "Fornecedor", "Cliente"]);
  const iQty = findHeaderIdx(headers, ["Quantidade", "Qtd"]);
  const iUnitPrice = findHeaderIdx(headers, ["Valor Unitário", "Preço Unitário"]);

  for (let r = 1; r < rawArray.length; r++) {
    const row = rawArray[r];
    if (row.length === 0 || !row[iType]) continue;

    const typeStr = (row[iType] || "").toString().trim().toLowerCase();
    const typeNorm = typeStr.includes("despesa") || typeStr.includes("saída") ? "despesa" : "receita";

    const qtyVal = Math.max(0, parseFloat(row[iQty]) || 1);
    const unitP = Math.max(0, parseFloat(row[iUnitPrice]) || 0);
    let totalValue = Math.max(0, parseFloat(row[iValTotal]) || 0);
    if (totalValue === 0 && unitP > 0) {
      totalValue = qtyVal * unitP;
    }

    financialData.push({
      id: `fin-${tabName}-${r}`,
      date: parseStringDate(row[iDate]),
      type: typeNorm,
      category: (row[iCat] || "Outros").toString().trim(),
      description: (row[iDesc] || "").toString().trim(),
      culture: (row[iCulture] || "Geral").toString().trim(),
      entity: (row[iVendor] || "").toString().trim(),
      quantity: qtyVal,
      unitPrice: unitP,
      value: totalValue,
      status: (row[iStatus] || "Pago").toString().trim(),
      notes: `Importado de: Aba ${tabName}`
    });
  }
}

// ----------------------------------------------------
// 9. REPOPULATE DYNAMIC FILTER DROPDOWNS
// ----------------------------------------------------
function repopulateFilterOptions() {
  // 1. Finance Category Option dropdown
  const finCats = [...new Set(financialData.map(f => f.category))].sort();
  const finCatEl = document.getElementById("filter-fin-category");
  if (finCatEl) {
    finCatEl.innerHTML = '<option value="Todos">Todas as Categorias</option>';
    finCats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      finCatEl.appendChild(opt);
    });
  }

  // 2. Finance Culture Option dropdown
  const finCultures = [...new Set(financialData.map(f => f.culture))].sort();
  const finCultEl = document.getElementById("filter-fin-culture");
  if (finCultEl) {
    finCultEl.innerHTML = '<option value="Todas">Todas as Culturas</option>';
    finCultures.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      finCultEl.appendChild(opt);
    });
  }

  // 3. Stock Product Code/Name option dropdown
  const stockProds = productsData.map(p => ({ code: p.code, name: p.name })).sort((a,b) => a.name.localeCompare(b.name));
  const stockProdEl = document.getElementById("filter-stock-prod");
  if (stockProdEl) {
    stockProdEl.innerHTML = '<option value="Todos">Todos os Produtos</option>';
    stockProds.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.code;
      opt.textContent = `${p.code} - ${p.name}`;
      stockProdEl.appendChild(opt);
    });
  }

  // 4. Stock Category dropdown
  const stockCats = [...new Set(productsData.map(p => p.category))].sort();
  const stockCatEl = document.getElementById("filter-stock-cat");
  if (stockCatEl) {
    stockCatEl.innerHTML = '<option value="Todos">Todas as Categorias</option>';
    stockCats.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c; opt.textContent = c;
      stockCatEl.appendChild(opt);
    });
  }

  // 5. Stock Storage location dropdown
  const stockLocs = [...new Set(productsData.map(p => p.location))].sort();
  const stockLocEl = document.getElementById("filter-stock-loc");
  if (stockLocEl) {
    stockLocEl.innerHTML = '<option value="Todos">Todos os Locais</option>';
    stockLocs.forEach(l => {
      const opt = document.createElement("option");
      opt.value = l; opt.textContent = l;
      stockLocEl.appendChild(opt);
    });
  }

  // 6. Source sheet picker dropdown list
  const srcSheetPicker = document.getElementById("source-sheet-picker");
  if (srcSheetPicker) {
    const lastSelected = srcSheetPicker.value;
    srcSheetPicker.innerHTML = "";
    const activeAbas = Object.keys(uploadedRawSheets);
    if (activeAbas.length > 0) {
      activeAbas.forEach(aba => {
        const opt = document.createElement("option");
        opt.value = aba; opt.textContent = `${aba} (${uploadedRawSheets[aba].length || 0} linhas)`;
        srcSheetPicker.appendChild(opt);
      });
      // Preserve last selected if it is still valid
      if (lastSelected && activeAbas.includes(lastSelected)) {
        srcSheetPicker.value = lastSelected;
        renderSourceInspectorTable(lastSelected);
      } else {
        srcSheetPicker.value = activeAbas[0];
        renderSourceInspectorTable(activeAbas[0]);
      }
    } else {
      srcSheetPicker.innerHTML = '<option value="">Nenhuma Aba Cadastrada</option>';
    }
  }
}

// ----------------------------------------------------
// 10. PRIMARY VIEW PORT RENDER Orchestrator
// ----------------------------------------------------
function renderApp() {
  // Update overall file loaded status text
  const fileStatusText = document.getElementById("file-status-indicator");
  if (fileStatusText) {
    if (spreadsheetFileName) {
      fileStatusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Planilha Ativa: <strong>${spreadsheetFileName}</strong> (Modo Leitura e Edição Local)`;
      fileStatusText.className = "text-[10px] text-emerald-800 mt-0.5 flex items-center gap-1.5 font-mono";
    } else {
      fileStatusText.innerHTML = `<span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> Nenhuma planilha carregada (Navegando nos dados simulados mestre)`;
      fileStatusText.className = "text-[10px] text-amber-600 mt-0.5 flex items-center gap-1.5 font-mono";
    }
  }

  // Render view-specific content
  if (activeView === "home") {
    renderHomeDashboard();
  } else if (activeView === "finance") {
    renderFinanceDashboard();
  } else if (activeView === "stock") {
    renderStockDashboard();
  } else if (activeView === "source") {
    renderSourceDataDashboard();
  } else if (activeView === "users") {
    const isSystemAdmin = activeUser && (activeUser.username.trim().toLowerCase() === "adminlogin" || activeUser.role === "Administrador");
    if (!isSystemAdmin) {
      activeView = "home";
      // Highlight home button and hide user view
      const navHome = document.getElementById("btn-nav-home");
      const navUsers = document.getElementById("btn-nav-users");
      if (navHome) {
        navHome.className = "w-full flex items-center justify-between text-left px-3 py-2.5 text-xs font-semibold rounded-xl bg-emerald-900 border-l-4 border-amber-500 text-white shadow-sm transition-all cursor-pointer group";
      }
      if (navUsers) {
        navUsers.className = "w-full flex items-center justify-between text-left px-3 py-2.5 text-xs font-semibold rounded-xl text-emerald-200/80 hover:bg-emerald-900/40 hover:text-white transition-all cursor-pointer group";
      }
      const viewUsers = document.getElementById("view-users");
      if (viewUsers) viewUsers.classList.add("hidden");
      const viewHome = document.getElementById("view-home");
      if (viewHome) viewHome.classList.remove("hidden");
      document.getElementById("screen-title").innerText = "Painel Geral • Home";
      renderHomeDashboard();
    } else {
      renderUsersPanel();
    }
  }

  // Handle visibility of the Home navigation button based on active view
  const navHomeBtn = document.getElementById("btn-nav-home");
  if (navHomeBtn) {
    if (activeView === "home") {
      navHomeBtn.classList.add("hidden");
    } else {
      navHomeBtn.classList.remove("hidden");
    }
  }
}

// ----------------------------------------------------
// 11. SUB-VIEW: HOME DASHBOARD
// ----------------------------------------------------
function renderHomeDashboard() {
  // Compute totals
  const totalRev = financialData.filter(f => f.type === "receita").reduce((acc, current) => acc + current.value, 0);
  const totalExp = financialData.filter(f => f.type === "despesa").reduce((acc, current) => acc + current.value, 0);
  const balance = totalRev - totalExp;

  const totalInputsQty = stockMovements.filter(tx => {
    const t = tx.type.toLowerCase();
    return t.includes("entrada") || t.includes("compra") || t.includes("ajuste entrada");
  }).length;

  const totalOutputsQty = stockMovements.filter(tx => {
    const t = tx.type.toLowerCase();
    return t.includes("saída") || t.includes("consumo") || t.includes("ajuste saída");
  }).length;

  const totalRegisteredItems = productsData.length;
  const criticalItems = productsData.filter(p => p.currentBalance < p.minQty);
  const criticalQty = criticalItems.length;

  // Update counters on screen
  document.getElementById("card-sum-revenue").innerText = formatCurrencyBR(totalRev);
  document.getElementById("card-sum-expense").innerText = formatCurrencyBR(totalExp);

  const cardBalance = document.getElementById("card-sum-balance");
  cardBalance.innerText = formatCurrencyBR(balance);
  if (balance >= 0) {
    cardBalance.className = "block text-base sm:text-lg font-black text-emerald-800 tracking-tight mt-1";
    document.getElementById("card-sum-balance-icon").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#047857" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>`;
  } else {
    cardBalance.className = "block text-base sm:text-lg font-black text-rose-800 tracking-tight mt-1";
    document.getElementById("card-sum-balance-icon").innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#be123c" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
  }

  document.getElementById("card-sum-stock-inputs").innerText = totalInputsQty;
  document.getElementById("card-sum-stock-outputs").innerText = totalOutputsQty;
  document.getElementById("card-sum-products").innerText = totalRegisteredItems;

  const criticalBadge = document.getElementById("card-sum-critical-qty");
  const criticalCardBg = document.getElementById("card-critical-bg-indicator");
  criticalBadge.innerText = criticalQty;
  if (criticalQty > 0) {
    criticalBadge.className = "block text-base sm:text-lg font-black text-rose-700 font-mono tracking-tight mt-1 animate-pulse";
    criticalCardBg.className = "bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-xs";
  } else {
    criticalBadge.className = "block text-base sm:text-lg font-black text-stone-700 font-mono tracking-tight mt-1";
    criticalCardBg.className = "bg-white border border-stone-200 p-4 rounded-xl shadow-xs";
  }

  // --- RENDERING AUDIT ALERTS ---
  const alertListEl = document.getElementById("home-alert-list");
  alertListEl.innerHTML = "";
  const alerts = [];

  // 1. Minimum stock inventory alerts
  criticalItems.forEach(item => {
    alerts.push({
      type: "stock",
      color: "color-red",
      iconColor: "text-red-700",
      bgClass: "bg-red-50 border-red-150",
      text: `Produto mestre "${item.name}" (${item.code}) está abaixo do estoque mínimo. Registrado: <strong>${item.currentBalance} ${item.unit}</strong> (Mínimo requerido: ${item.minQty} ${item.unit})`
    });
  });

  // 2. Spreadsheet integration / sheets check alerts
  const abas = Object.keys(uploadedRawSheets);
  const reqAbas = ["Cadastro_Produtos", "Controle_Almoxarifado"];
  reqAbas.forEach(ra => {
    if (!abas.includes(ra)) {
      alerts.push({
        type: "structure",
        bgClass: "bg-red-50 border-red-200",
        iconColor: "text-red-800",
        text: `Falta de aba requerida: A aba regulamentar <strong>"${ra}"</strong> é obrigatória e não foi encontrada.`
      });
    }
  });

  if (!abas.includes("Fluxo_Financeiro")) {
    const foundMonths = MONTH_NAMES_PT.filter(m => abas.includes(m));
    if (foundMonths.length < 12) {
      alerts.push({
        type: "months",
        bgClass: "bg-amber-50 border-amber-200",
        iconColor: "text-amber-800",
        text: `Consolidação comprometida: Aba unificada "Fluxo_Financeiro" está ausente e faltam abas mensais (${12 - foundMonths.length} meses ausentes no Excel).`
      });
    }
  }

  // 3. Mandatory columns validation
  validateBaseColumns(alerts);

  if (alerts.length === 0) {
    alertListEl.innerHTML = `
      <div class="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-900 leading-normal flex items-center gap-2.5">
        <svg class="text-emerald-700 shrink-0" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <span>Nenhum alerta ou inconsistência pendente! Todas as abas, colunas obrigatórias e níveis de estoque estão em perfeita conformidade.</span>
      </div>
    `;
  } else {
    alerts.forEach(al => {
      const alertDiv = document.createElement("div");
      alertDiv.className = `p-3 ${al.bgClass || "bg-amber-50 border border-amber-100/50"} rounded-xl text-[11px] font-medium leading-relaxed flex items-start gap-2.5`;
      alertDiv.innerHTML = `
        <div class="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></div>
        <span class="text-stone-750">${al.text}</span>
      `;
      alertListEl.appendChild(alertDiv);
    });
  }

  // --- RENDERING CHARTS IN HOME SCREEN ---
  // Monthly Revenues vs Expenses
  const monthlySums = calculateMonthlyAggregation();
  const ctxRevExp = document.getElementById("chart-receitas-despesas-mensal").getContext("2d");

  if (charts.homeRevExp) charts.homeRevExp.destroy();
  charts.homeRevExp = new Chart(ctxRevExp, {
    type: "bar",
    data: {
      labels: MONTH_NAMES_PT.map(m => m.substring(0, 3)),
      datasets: [
        {
          label: "Receitas",
          data: monthlySums.revenues,
          backgroundColor: "#16a34a",
          borderRadius: 4
        },
        {
          label: "Despesas",
          data: monthlySums.expenses,
          backgroundColor: "#be123c",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { boxWidth: 12, font: { size: 10, weight: 600 } } }
      },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { font: { size: 9 }, callback: val => "R$ " + (val / 1000) + "k" } }
      }
    }
  });

  // Monthly Balance trend Chart
  const ctxBalance = document.getElementById("chart-saldo-mensal").getContext("2d");
  if (charts.homeBalance) charts.homeBalance.destroy();
  charts.homeBalance = new Chart(ctxBalance, {
    type: "bar",
    data: {
      labels: MONTH_NAMES_PT.map(m => m.substring(0, 3)),
      datasets: [
        {
          label: "Saldo Líquido",
          data: monthlySums.balance,
          backgroundColor: monthlySums.balance.map(val => val >= 0 ? "rgba(22, 163, 74, 0.25)" : "rgba(190, 18, 60, 0.25)"),
          borderColor: monthlySums.balance.map(val => val >= 0 ? "#16a34a" : "#be123c"),
          borderWidth: 1.5,
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { font: { size: 9 }, callback: val => "R$ " + (val / 1000) + "k" } }
      }
    }
  });
}

// ----------------------------------------------------
// 12. SUB-VIEW: FLUXO FINANCEIRO DASHBOARD
// ----------------------------------------------------
function renderFinanceDashboard() {
  // Apply dynamic multicriterial filters to finance listing
  const filtered = financialData.filter(f => {
    // 1. Month filter check
    if (finFilters.month !== "Todos") {
      const monthIdx = parseInt(f.date.split("-")[1], 10);
      const mName = MONTH_NAMES_PT[monthIdx - 1];
      if (mName !== finFilters.month) return false;
    }
    // 2. Type filter check
    if (finFilters.type !== "Todos" && f.type !== finFilters.type) return false;
    // 3. Category filter check
    if (finFilters.category !== "Todos" && f.category !== finFilters.category) return false;
    // 4. Culture filter check
    if (finFilters.culture !== "Todas" && f.culture !== finFilters.culture) return false;
    // 5. Status filter check
    if (finFilters.status !== "Todos") {
      const isPaid = f.status.trim().toLowerCase() === "pago" || f.status.trim().toLowerCase() === "recebido";
      if (finFilters.status === "Pago" && !isPaid) return false;
      if (finFilters.status === "Pendente" && isPaid) return false;
    }
    return true;
  });

  // Calculate dynamic outputs of the filtered set
  const revenues = filtered.filter(f => f.type === "receita").reduce((acc, c) => acc + c.value, 0);
  const expenses = filtered.filter(f => f.type === "despesa").reduce((acc, c) => acc + c.value, 0);
  const balance = revenues - expenses;

  // Render cards
  document.getElementById("fin-sum-revenue").innerText = formatCurrencyBR(revenues);
  document.getElementById("fin-sum-expense").innerText = formatCurrencyBR(expenses);
  const blText = document.getElementById("fin-sum-balance");
  blText.innerText = formatCurrencyBR(balance);
  blText.className = `text-base sm:text-lg font-black tracking-tight block mt-1 ${balance >= 0 ? "text-emerald-800" : "text-rose-800"}`;

  // Top expense category
  const expenseCats = {};
  filtered.filter(f => f.type === "despesa").forEach(f => {
    expenseCats[f.category] = (expenseCats[f.category] || 0) + f.value;
  });
  let topExpCat = "Nenhuma";
  let maxExpVal = 0;
  for (const cat in expenseCats) {
    if (expenseCats[cat] > maxExpVal) {
      maxExpVal = expenseCats[cat];
      topExpCat = cat;
    }
  }
  document.getElementById("fin-sum-top-category").innerText = maxExpVal > 0 ? `${topExpCat} (${formatCurrencyBR(maxExpVal)})` : "Sem Despesas";

  // Top month of revenue & expense
  const monthsRevSums = {}, monthsExpSums = {};
  filtered.forEach(f => {
    const monthIndex = parseInt(f.date.split("-")[1], 10);
    const mName = MONTH_NAMES_PT[monthIndex - 1] || "Geral";
    if (f.type === "receita") {
      monthsRevSums[mName] = (monthsRevSums[mName] || 0) + f.value;
    } else {
      monthsExpSums[mName] = (monthsExpSums[mName] || 0) + f.value;
    }
  });

  let topMRev = "Nenhum", maxMRev = 0;
  for (const m in monthsRevSums) {
    if (monthsRevSums[m] > maxMRev) { maxMRev = monthsRevSums[m]; topMRev = m; }
  }
  document.getElementById("fin-sum-top-month-rev").innerText = maxMRev > 0 ? `${topMRev} (${formatCurrencyBR(maxMRev)})` : "Nenhum";

  let topMExp = "Nenhum", maxMExp = 0;
  for (const m in monthsExpSums) {
    if (monthsExpSums[m] > maxMExp) { maxMExp = monthsExpSums[m]; topMExp = m; }
  }
  document.getElementById("fin-sum-top-month-exp").innerText = maxMExp > 0 ? `${topMExp} (${formatCurrencyBR(maxMExp)})` : "Nenhum";

  // Set entries count indicator
  document.getElementById("fin-rows-count").innerText = `REGISTROS FILTRADOS: ${filtered.length}`;

  // Render Table
  const tbody = document.querySelector("#fin-transactions-table tbody");
  const emptyBox = document.getElementById("fin-table-empty-box");
  tbody.innerHTML = "";

  if (filtered.length === 0) {
    emptyBox.classList.remove("hidden");
    document.getElementById("fin-transactions-table").classList.add("hidden");
  } else {
    emptyBox.classList.add("hidden");
    document.getElementById("fin-transactions-table").classList.remove("hidden");

    // Display first 250 sorted by date reversed
    filtered
      .sort((a,b) => b.date.localeCompare(a.date))
      .slice(0, 250)
      .forEach(f => {
        const tr = document.createElement("tr");
        const badgeType = f.type === "receita"
          ? `<span class="px-2 py-1 rounded-full text-[9px] font-extrabold bg-green-50 text-green-700 uppercase">Receita</span>`
          : `<span class="px-2 py-1 rounded-full text-[9px] font-extrabold bg-rose-50 text-rose-700 uppercase">Despesa</span>`;

        const isPaid = f.status.trim().toLowerCase() === "pago" || f.status.trim().toLowerCase() === "recebido";
        const badgeStatus = isPaid
          ? `<span class="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-emerald-100 text-emerald-800">PAGO</span>`
          : `<span class="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-amber-100 text-amber-800">PENDENTE</span>`;

        tr.innerHTML = `
          <td class="whitespace-nowrap text-stone-500">${formatPortugueseDate(f.date)}</td>
          <td>${badgeType}</td>
          <td class="font-bold text-stone-750">${f.category}</td>
          <td class="text-stone-600 truncate max-w-xs font-sans">${f.description}</td>
          <td class="whitespace-nowrap"><span class="text-stone-700 font-semibold text-xs">${f.culture}</span></td>
          <td class="text-stone-500 font-sans truncate max-w-xs">${f.entity || "-"}</td>
          <td class="text-right whitespace-nowrap text-stone-600">${f.quantity}</td>
          <td class="text-right whitespace-nowrap text-stone-500">${formatCurrencyBR(f.unitPrice)}</td>
          <td class="text-right whitespace-nowrap font-black font-display ${f.type === 'receita' ? 'text-emerald-800' : 'text-stone-850'}">${formatCurrencyBR(f.value)}</td>
          <td class="whitespace-nowrap">${badgeStatus}</td>
        `;
        tbody.appendChild(tr);
      });
  }

  // Expenses categories pie distribution Chart
  const expCatsList = Object.keys(expenseCats).sort((a,b) => expenseCats[b] - expenseCats[a]);
  const expVals = expCatsList.map(c => expenseCats[c]);
  
  const canvasExp = document.getElementById("chart-fin-categories-expenses");
  if (canvasExp) {
    const oldExpChart = Chart.getChart(canvasExp);
    if (oldExpChart) oldExpChart.destroy();
    if (charts.finExp) {
      try { charts.finExp.destroy(); } catch (e) {}
    }
    
    const ctxExp = canvasExp.getContext("2d");
    charts.finExp = new Chart(ctxExp, {
      type: "doughnut",
      data: {
        labels: expCatsList.slice(0, 8),
        datasets: [{
          data: expVals.slice(0, 8),
          backgroundColor: ["#9f1239", "#be123c", "#e11d48", "#f43f5e", "#fb7185", "#fda4af", "#ffe4e6", "#fecdd3"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: "right", 
            labels: { 
              boxWidth: 10, 
              font: { size: 9, weight: "600" } 
            } 
          }
        }
      }
    });
  }

  // Revenues categories distribution Charts
  const revCats = {};
  filtered.filter(f => f.type === "receita").forEach(f => {
    revCats[f.category] = (revCats[f.category] || 0) + f.value;
  });
  const revCatsList = Object.keys(revCats).sort((a,b) => revCats[b] - revCats[a]);
  const revVals = revCatsList.map(c => revCats[c]);
  
  const canvasRev = document.getElementById("chart-fin-categories-revenues");
  if (canvasRev) {
    const oldRevChart = Chart.getChart(canvasRev);
    if (oldRevChart) oldRevChart.destroy();
    if (charts.finRev) {
      try { charts.finRev.destroy(); } catch (e) {}
    }

    const ctxRev = canvasRev.getContext("2d");
    charts.finRev = new Chart(ctxRev, {
      type: "doughnut",
      data: {
        labels: revCatsList.slice(0, 8),
        datasets: [{
          data: revVals.slice(0, 8),
          backgroundColor: ["#14532d", "#15803d", "#16a34a", "#22c55e", "#4ade80", "#86efac", "#bbf7d0", "#dcfce7"]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: "right", 
            labels: { 
              boxWidth: 10, 
              font: { size: 9, weight: "600" } 
            } 
          }
        }
      }
    });
  }
}

// ----------------------------------------------------
// 13. SUB-VIEW: CONTROLE DE ALMOXARIFADO
// ----------------------------------------------------
function renderStockDashboard() {
  // Apply dynamic filters
  const filteredProducts = productsData.filter(p => {
    if (stockFilters.prod !== "Todos" && p.code !== stockFilters.prod) return false;
    if (stockFilters.cat !== "Todos" && p.category !== stockFilters.cat) return false;
    if (stockFilters.loc !== "Todos" && p.location !== stockFilters.loc) return false;
    return true;
  });

  const filteredMovements = stockMovements.filter(tx => {
    if (stockFilters.prod !== "Todos" && tx.itemCode !== stockFilters.prod) return false;
    // Check match on category of product
    const prodRef = productsData.find(p => p.code === tx.itemCode);
    const prodCat = prodRef ? prodRef.category : "Outros";
    if (stockFilters.cat !== "Todos" && prodCat !== stockFilters.cat) return false;

    // Month filter check
    if (stockFilters.month !== "Todos") {
      const monthIdx = parseInt(tx.date.split("-")[1], 10);
      const mName = MONTH_NAMES_PT[monthIdx - 1];
      if (mName !== stockFilters.month) return false;
    }
    return true;
  });

  // Summary widgets
  const registeredCount = productsData.length;
  const criticalItems = productsData.filter(p => p.currentBalance < p.minQty);
  const criticalCount = criticalItems.length;

  const totalInputsQty = stockMovements.filter(tx => {
    const t = tx.type.toLowerCase();
    return t.includes("entrada") || t.includes("compra") || t.includes("ajuste entrada");
  }).length;

  const totalOutputsQty = stockMovements.filter(tx => {
    const t = tx.type.toLowerCase();
    return t.includes("saída") || t.includes("consumo") || t.includes("ajuste saída");
  }).length;

  const estimatedValuation = productsData.reduce((sum, p) => sum + p.valuation, 0);

  // Update DOM cards
  document.getElementById("stock-sum-registered").innerText = registeredCount;
  document.getElementById("stock-sum-inputs").innerText = totalInputsQty;
  document.getElementById("stock-sum-outputs").innerText = totalOutputsQty;
  document.getElementById("stock-sum-valuation").innerText = formatCurrencyBR(estimatedValuation);

  const critCard = document.getElementById("stock-sum-critical");
  const critBg = document.getElementById("stock-sum-critical-bg");
  critCard.innerText = criticalCount;
  if (criticalCount > 0) {
    critCard.className = "text-xl sm:text-2xl font-black text-rose-700 font-mono tracking-tight block mt-1 animate-pulse";
    critBg.className = "bg-rose-50 border border-rose-200 p-4 rounded-2xl shadow-xs";
  } else {
    critCard.className = "text-xl sm:text-2xl font-black text-stone-850 font-mono tracking-tight block mt-1";
    critBg.className = "bg-white border border-stone-200 p-4 rounded-2xl shadow-xs";
  }

  // --- RENDERING PRODUCTS TABLE ---
  document.getElementById("stock-items-count").innerText = `CADASTROS: ${filteredProducts.length}`;
  const prodTbody = document.querySelector("#stock-products-table tbody");
  prodTbody.innerHTML = "";

  filteredProducts.forEach(p => {
    const isCritical = p.currentBalance < p.minQty;
    const isOutOfStock = p.currentBalance <= 0;

    let statusBadge = `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700">OK</span>`;
    if (isOutOfStock) {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700">SEM SALDO</span>`;
    } else if (isCritical) {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700">CRÍTICO</span>`;
    } else if (p.status && p.status.trim().toLowerCase() === "inativo") {
      statusBadge = `<span class="px-2 py-0.5 rounded text-[9px] font-bold bg-stone-100 text-stone-500">INATIVO</span>`;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="font-bold text-stone-600">${p.code}</td>
      <td class="font-sans text-stone-800 font-medium">${p.name}</td>
      <td><span class="text-stone-500 text-xs">${p.category}</span></td>
      <td class="text-right text-stone-500 font-sans">${p.location || "Galpão Principal"}</td>
      <td class="text-right text-stone-600 text-xs font-semibold">${p.minQty.toLocaleString("pt-BR")}</td>
      <td class="text-right font-black ${isCritical ? 'text-amber-700' : 'text-emerald-800'}">${p.currentBalance.toLocaleString("pt-BR")}</td>
      <td><span class="text-stone-400 text-xs uppercase">${p.unit}</span></td>
      <td class="text-right text-stone-500">${formatCurrencyBR(p.lastPrice)}</td>
      <td class="text-right font-black text-stone-800 font-display">${formatCurrencyBR(p.valuation)}</td>
      <td>${statusBadge}</td>
    `;
    prodTbody.appendChild(tr);
  });

  // --- RENDERING MOVEMENTS LOG TABLE ---
  document.getElementById("stock-movements-count").innerText = `MOVIMENTAÇÕES: ${filteredMovements.length}`;
  const movTbody = document.querySelector("#stock-movements-table tbody");
  const emptyBox = document.getElementById("stock-movements-empty-box");
  movTbody.innerHTML = "";

  if (filteredMovements.length === 0) {
    emptyBox.classList.remove("hidden");
    document.getElementById("stock-movements-table").classList.add("hidden");
  } else {
    emptyBox.classList.add("hidden");
    document.getElementById("stock-movements-table").classList.remove("hidden");

    filteredMovements
      .sort((a,b) => b.date.localeCompare(a.date))
      .slice(0, 150)
      .forEach(m => {
        const isInput = m.type.toLowerCase().includes("entrada");
        const badgeType = isInput
          ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-green-50 text-green-700 uppercase">Entrada</span>`
          : `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 uppercase">Saída</span>`;

        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td class="whitespace-nowrap text-stone-500">${formatPortugueseDate(m.date)}</td>
          <td class="font-bold text-stone-600">${m.itemCode}</td>
          <td class="font-sans text-stone-700 truncate max-w-xs">${m.itemName}</td>
          <td>${badgeType}</td>
          <td class="text-right font-bold text-stone-750">${m.qty.toLocaleString("pt-BR")}</td>
          <td><span class="text-stone-400 text-[10px] uppercase">${m.unit}</span></td>
          <td class="text-right text-stone-500">${formatCurrencyBR(m.unitPrice)}</td>
          <td class="text-right font-black text-stone-800 font-display">${formatCurrencyBR(m.totalValue)}</td>
          <td><span class="text-stone-600 text-xs">${m.culture}</span></td>
          <td class="text-stone-500 font-sans truncate max-w-xs">${m.responsible}</td>
          <td class="text-stone-400 font-sans text-xs italic truncate max-w-xs">${m.notes || "-"}</td>
        `;
        movTbody.appendChild(tr);
      });
  }

  // --- RENDERING CHARTS IN STOCK SCREEN ---
  // Product level active balance bar Chart
  const topProds = productsData.sort((a,b) => b.valuation - a.valuation).slice(0, 15);
  const prodLabels = topProds.map(p => p.name.substring(0, 16) + "...");
  const prodBalances = topProds.map(p => p.currentBalance);
  const minBalances = topProds.map(p => p.minQty);

  const ctxSLevels = document.getElementById("chart-stock-items-balance").getContext("2d");
  if (charts.stockLevels) charts.stockLevels.destroy();
  charts.stockLevels = new Chart(ctxSLevels, {
    type: "bar",
    data: {
      labels: prodLabels,
      datasets: [
        {
          label: "Estoque Físico Atual",
          data: prodBalances,
          backgroundColor: "#15803d",
          borderRadius: 4
        },
        {
          label: "Nível Crítico Segurança",
          data: minBalances,
          backgroundColor: "#d97706",
          borderRadius: 4
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { boxWidth: 10, font: { size: 9, weight: 600 } } }
      },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { font: { size: 9 } } }
      }
    }
  });

  // Material dynamic consumption m-o-m Chart
  const monthlyConsumptionSums = new Array(12).fill(0);
  stockMovements.forEach(m => {
    const isOutput = m.type.toLowerCase().includes("saída") || m.type.toLowerCase().includes("consumo");
    if (isOutput) {
      const monthIdx = parseInt(m.date.split("-")[1], 10);
      if (monthIdx >= 1 && monthIdx <= 12) {
        monthlyConsumptionSums[monthIdx - 1] += m.totalValue;
      }
    }
  });

  const ctxConsumption = document.getElementById("chart-stock-consumption-monthly").getContext("2d");
  if (charts.stockConsumption) charts.stockConsumption.destroy();
  charts.stockConsumption = new Chart(ctxConsumption, {
    type: "line",
    data: {
      labels: MONTH_NAMES_PT.map(m => m.substring(0, 3)),
      datasets: [{
        label: "Valor Total Consumido (R$)",
        data: monthlyConsumptionSums,
        borderColor: "#b45309",
        backgroundColor: "rgba(180, 83, 9, 0.05)",
        borderWidth: 2.5,
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { ticks: { font: { size: 9 }, callback: val => "R$ " + (val / 1000) + "k" } }
      }
    }
  });
}

// ----------------------------------------------------
// 14. SUB-VIEW: SOURCE DATA SHEET INSPECTOR
// ----------------------------------------------------
function renderSourceDataDashboard() {
  const container = document.getElementById("source-abas-checklist-container");
  container.innerHTML = "";

  const abas = Object.keys(uploadedRawSheets);
  const checklist = [
    { label: "Cadastro_Produtos (Insumos)", key: "Cadastro_Produtos", mandatory: true },
    { label: "Controle_Almoxarifado (Kardex)", key: "Controle_Almoxarifado", mandatory: true },
    { label: "Fluxo_Financeiro (Anual)", key: "Fluxo_Financeiro", mandatory: false },
    { label: "Listas (Validações de Campo)", key: "Listas", mandatory: false }
  ];

  checklist.forEach(item => {
    const isFound = abas.some(aba => aba.trim().toLowerCase() === item.key.toLowerCase());
    const div = document.createElement("div");
    div.className = `p-2.5 rounded-xl border flex items-center justify-between font-mono text-[10.5px] ${isFound ? 'bg-green-50/70 border-green-100 text-green-900' : 'bg-red-50/70 border-red-100 text-rose-950'}`;

    const icon = isFound
      ? `<svg class="text-green-700" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
      : `<svg class="text-rose-700" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;

    div.innerHTML = `
      <span>${item.label} ${item.mandatory ? '<span class="text-rose-600 font-bold">*</span>' : ''}</span>
      <div class="flex items-center gap-1.5 font-bold">
        <span>${isFound ? 'PRESENTE' : 'AUSENTE'}</span>
        ${icon}
      </div>
    `;
    container.appendChild(div);
  });

  // Monthly months checklist
  const monthlyLabel = document.createElement("div");
  monthlyLabel.className = "text-[10px] text-stone-400 font-bold uppercase tracking-wider pt-2 block font-display";
  monthlyLabel.innerText = "Abas Trimestrais / Mensais:";
  container.appendChild(monthlyLabel);

  const monthsGrid = document.createElement("div");
  monthsGrid.className = "grid grid-cols-2 gap-1.5 pt-1";
  MONTH_NAMES_PT.forEach(m => {
    const isFound = abas.some(aba => aba.trim().toLowerCase() === m.toLowerCase());
    const dev = document.createElement("div");
    dev.className = `p-1.5 text-[9.5px] font-bold font-mono rounded-lg border text-center ${isFound ? 'bg-emerald-50 border-emerald-100/50 text-emerald-800' : 'bg-stone-100 border-stone-200 text-stone-400'}`;
    dev.innerText = m;
    monthsGrid.appendChild(dev);
  });
  container.appendChild(monthsGrid);
}

// Inspect a single selected sheet in raw tabular preview grid
function renderSourceInspectorTable(sheetName) {
  const tableHead = document.querySelector("#source-inspected-grid-table thead");
  const tableBody = document.querySelector("#source-inspected-grid-table tbody");
  const dimensionsEl = document.getElementById("inspector-dimensions");

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  if (!sheetName || !uploadedRawSheets[sheetName]) {
    dimensionsEl.innerText = "Nenhuma aba carregada.";
    return;
  }

  const rawRows = uploadedRawSheets[sheetName];
  dimensionsEl.innerText = `Mostrando as primeiras 40 de ${rawRows.length} linhas / ${rawRows[0]?.length || 0} colunas.`;

  if (rawRows.length === 0) return;

  // Render header columns
  const firstRow = rawRows[0];
  const trHead = document.createElement("tr");
  firstRow.forEach((colName) => {
    const th = document.createElement("th");
    th.className = "font-semibold whitespace-nowrap text-stone-700 bg-stone-50 border-b p-2";
    th.innerText = (colName || "").toString();
    trHead.appendChild(th);
  });
  tableHead.appendChild(trHead);

  // Render and high-light empty/blank cells in yellow
  rawRows.slice(1, 41).forEach((row) => {
    const tr = document.createElement("tr");
    // Ensure accurate sizing representation
    for (let c = 0; c < firstRow.length; c++) {
      const td = document.createElement("td");
      const cellValue = row[c] === undefined ? "" : row[c].toString().trim();

      td.innerText = cellValue;
      td.className = "p-2 font-mono text-stone-600 truncate border-b border-stone-100 max-w-xs";

      // If cell is empty, we perform yellow border styled highlighting
      if (cellValue === "") {
        td.className += " empty-cell-highlight";
        td.title = "Aviso: Campo vazio detectado no banco de dados Excel.";
      }
      tr.appendChild(td);
    }
    tableBody.appendChild(tr);
  });

  // Evaluate structure compliance box
  const complianceText = document.getElementById("inspector-columns-compliance-text");
  const complianceBox = document.getElementById("inspector-columns-compliance-box");

  if (sheetName === "Cadastro_Produtos") {
    const colNorms = firstRow.map(col => (col || "").toString().trim().toLowerCase());
    const hasCode = colNorms.some(c => c.includes("código") || c.includes("cod") || c.includes("sku"));
    const hasName = colNorms.some(c => c.includes("nome") || c.includes("produto") || c.includes("insumo"));
    
    if (hasCode && hasName) {
      complianceText.innerText = "Aba de cadastro 100% conforme! Colunas estruturais obrigatórias ('Código do Produto' e 'Nome') identificadas com sucesso.";
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-emerald-50 border-emerald-100 text-emerald-900";
    } else {
      complianceText.innerText = "Aviso estrutural: Certifique-se de que a aba de cadastro possui colunas identificadoras para 'Código' e 'Nome/Insumo' válidos.";
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-rose-50 border-rose-100 text-rose-950";
    }
  } else if (sheetName === "Controle_Almoxarifado") {
    const colNorms = firstRow.map(col => (col || "").toString().trim().toLowerCase());
    const hasCode = colNorms.some(c => c.includes("código") || c.includes("cod") || c.includes("produto"));
    const hasQty = colNorms.some(c => c.includes("quantidade") || c.includes("qtd") || c.includes("quant"));
    
    if (hasCode && hasQty) {
      complianceText.innerText = "Aba de Controle de Almoxarifado conforme! Colunas essenciais ('Código do Produto' e 'Quantidade') validadas para controle operacional físico.";
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-emerald-50 border-emerald-100 text-emerald-900";
    } else {
      complianceText.innerText = "Falha de compatibilidade: Não foram encontradas colunas de 'Código do Produto' (ou similar) e/ou 'Quantidade' para cálculo de estoque.";
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-rose-50 border-rose-100 text-rose-950";
    }
  } else if (sheetName === "Fluxo_Financeiro" || MONTH_NAMES_PT.some(m => m.toLowerCase() === sheetName.trim().toLowerCase())) {
    const colNorms = firstRow.map(col => (col || "").toString().trim().toLowerCase());
    const hasType = colNorms.some(c => c.includes("tipo") || c.includes("movimentação") || c.includes("ação"));
    const hasValue = colNorms.some(c => c.includes("valor") || c.includes("total") || c.includes("preço"));
    
    if (hasType && hasValue) {
      complianceText.innerText = `Aba financeira "${sheetName}" validada com sucesso! Colunas de fluxo de caixa operacional ('Tipo' e 'Valor Total') estão presentes.`;
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-emerald-50 border-emerald-100 text-emerald-900";
    } else {
      complianceText.innerText = `Aba financeira "${sheetName}" com pendências: Necessita de colunas identificadoras para 'Tipo' (Receita/Despesa) e 'Valor' das movimentações.`;
      complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-rose-50 border-rose-100 text-rose-950";
    }
  } else {
    complianceText.innerText = `Exibindo aba estática ou complementar "${sheetName}". Células vazias destacados em realce amarelo de atenção para fiscalização local.`;
    complianceBox.className = "p-3.5 rounded-xl border text-xs leading-normal bg-stone-50 border-stone-200 text-stone-750";
  }
}

// ----------------------------------------------------
// 15. DYNAMIC COMPLIANCE CHECKS & HEADERS MAPPING
// ----------------------------------------------------
function validateBaseColumns(alerts) {
  const prods = uploadedRawSheets["Cadastro_Produtos"];
  if (prods && prods.length > 0) {
    const headers = prods[0].map(h => (h || "").toString().trim().toLowerCase());
    const valid = headers.includes("código do produto") || headers.includes("código") || headers.includes("cod");
    if (!valid) {
      alerts.push({
        type: "cols",
        bgClass: "bg-red-50 border-red-200",
        text: "Inconsistência na aba Cadastro_Produtos: Coluna chave identificadora <strong>'Código do Produto'</strong> está faltando."
      });
    }
  }

  const stock = uploadedRawSheets["Controle_Almoxarifado"];
  if (stock && stock.length > 0) {
    const headers = stock[0].map(h => (h || "").toString().trim().toLowerCase());
    const validCode = headers.includes("código do produto") || headers.includes("código") || headers.includes("cod");
    const validQty = headers.includes("quantidade") || headers.includes("qtd") || headers.includes("quant");
    if (!validCode || !validQty) {
      alerts.push({
        type: "cols",
        bgClass: "bg-red-50 border-red-200",
        text: "Inconsistência na aba Controle_Almoxarifado: Colunas mestre <strong>'Código do Produto'</strong> ou <strong>'Quantidade'</strong> ausentes."
      });
    }
  }
}

// ----------------------------------------------------
// 16. STATIC HELPER METHOD UTILITIES
// ----------------------------------------------------
function findHeaderIdx(headers, aliases) {
  for (let i = 0; i < headers.length; i++) {
    const hNorm = headers[i].toLowerCase().trim();
    if (aliases.some(alias => hNorm === alias.toLowerCase())) {
      return i;
    }
  }
  // Fallback pattern matching
  for (let i = 0; i < headers.length; i++) {
    const hNorm = headers[i].toLowerCase().trim();
    if (aliases.some(alias => hNorm.includes(alias.toLowerCase()))) {
      return i;
    }
  }
  return 0; // default anchor
}

function parseStringDate(rawVal) {
  if (!rawVal) return "2026-01-01";
  const str = rawVal.toString().trim();

  // Handle excel numeric serial dates
  if (!isNaN(str) && parseFloat(str) > 30000) {
    const parsed = new Date((parseFloat(str) - 25569) * 86400 * 1000);
    return parsed.toISOString().split("T")[0];
  }

  // Handle standard ISO formats
  if (str.match(/^\d{4}-\d{2}-\d{2}/)) {
    return str.substring(0, 10);
  }

  // Handle format DD/MM/YYYY
  const parts = str.split("/");
  if (parts.length === 3) {
    const day = parts[0].padStart(2, "0");
    const month = parts[1].padStart(2, "0");
    let year = parts[2];
    if (year.length === 2) year = "20" + year;
    return `${year}-${month}-${day}`;
  }

  return "2026-01-01";
}

function calculateMonthlyAggregation() {
  const revs = new Array(12).fill(0);
  const exps = new Array(12).fill(0);
  const bal = new Array(12).fill(0);

  financialData.forEach(item => {
    const monthIdx = parseInt(item.date.split("-")[1], 10);
    if (monthIdx >= 1 && monthIdx <= 12) {
      if (item.type === "receita") {
        revs[monthIdx - 1] += item.value;
      } else {
        exps[monthIdx - 1] += item.value;
      }
    }
  });

  for (let i = 0; i < 12; i++) {
    bal[i] = revs[i] - exps[i];
  }

  return { revenues: revs, expenses: exps, balance: bal };
}

function formatCurrencyBR(val) {
  return "R$ " + (val || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPortugueseDate(isoStr) {
  if (!isoStr) return "-";
  const p = isoStr.split("-");
  if (p.length === 3) {
    return `${p[2]}/${p[1]}/${p[0]}`;
  }
  return isoStr;
}

// ----------------------------------------------------
// 17. TEMPLATE GENERATION & REUSE METHOD SHEETJS EXPORTS
// ----------------------------------------------------
function downloadBaseXlsxTemplate() {
  try {
    const wb = XLSX.utils.book_new();

    // 1. Cadastro de produtos
    const prodWS = XLSX.utils.aoa_to_sheet(DEFAULT_DEMO_SHEETS["Cadastro_Produtos"]);
    XLSX.utils.book_append_sheet(wb, prodWS, "Cadastro_Produtos");

    // 2. Controle de almoxarifado
    const stockWS = XLSX.utils.aoa_to_sheet(DEFAULT_DEMO_SHEETS["Controle_Almoxarifado"]);
    XLSX.utils.book_append_sheet(wb, stockWS, "Controle_Almoxarifado");

    // 3. Fluxo Financeiro Anual
    const finWS = XLSX.utils.aoa_to_sheet(DEFAULT_DEMO_SHEETS["Fluxo_Financeiro"]);
    XLSX.utils.book_append_sheet(wb, finWS, "Fluxo_Financeiro");

    // 3.5. Listas (Validações de Campo)
    const listasWS = XLSX.utils.aoa_to_sheet(DEFAULT_DEMO_SHEETS["Listas"]);
    XLSX.utils.book_append_sheet(wb, listasWS, "Listas");

    // 4. Monthly sheets placeholders Jan - Dez
    MONTH_NAMES_PT.forEach((m) => {
      const data = [
        ["Data", "Tipo", "Categoria", "Subcategoria", "Descrição", "Cultura", "Safra", "Talhão", "Centro de Custo", "Fornecedor ou Cliente", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Forma de Pagamento", "Status", "Observações"]
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, m);
    });

    XLSX.writeFile(wb, "Modelo_Planejador_Agricola_AgroDash.xlsx");
    alert("Planilha modelo com todas as regras e abas carregada com sucesso.");
  } catch {
    alert("Falha local do navegador ao gerar modelo de planilhas.");
  }
}

function exportCurrentStateToXlsx() {
  try {
    const wb = XLSX.utils.book_new();

    // Build Cadastro Produtos from current state
    const prodsHeaders = [["Código do Produto", "Nome do Produto", "Categoria", "Unidade de Medida", "Estoque Mínimo", "Local de Armazenamento", "Status", "Observações"]];
    productsData.forEach(p => {
      prodsHeaders.push([
        p.code, p.name, p.category, p.unit, p.minQty, p.location, p.status, p.notes
      ]);
    });
    const wsProd = XLSX.utils.aoa_to_sheet(prodsHeaders);
    XLSX.utils.book_append_sheet(wb, wsProd, "Cadastro_Produtos");

    // Build Controle Almoxarifado from current state
    const stockHeaders = [["Data", "Código do Produto", "Nome do Produto", "Tipo de Movimento", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Fornecedor", "Cultura", "Responsável", "Observações"]];
    stockMovements.forEach(m => {
      stockHeaders.push([
        m.date, m.itemCode, m.itemName, m.type, m.qty, m.unit, m.unitPrice, m.totalValue, m.supplier, m.culture, m.responsible, m.notes
      ]);
    });
    const wsStock = XLSX.utils.aoa_to_sheet(stockHeaders);
    XLSX.utils.book_append_sheet(wb, wsStock, "Controle_Almoxarifado");

    // Build Fluxo Financeiro from current state
    const finHeaders = [["Data", "Tipo", "Categoria", "Subcategoria", "Descrição", "Cultura", "Safra", "Talhão", "Centro de Custo", "Fornecedor ou Cliente", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Forma de Pagamento", "Status", "Observações"]];
    financialData.forEach(f => {
      finHeaders.push([
        f.date, f.type === 'receita' ? 'Receita' : 'Despesa', f.category, f.subcat || "", f.description, f.culture, f.safra || "2025/2026", f.field || "", f.centerKey || "", f.entity || "", f.quantity || 1, f.unit || "Un", f.unitPrice || 0, f.value, f.payment || "", f.status || "Pago", f.notes || ""
      ]);
    });
    const wsFin = XLSX.utils.aoa_to_sheet(finHeaders);
    XLSX.utils.book_append_sheet(wb, wsFin, "Fluxo_Financeiro");

    // Build Listas sheet from template or loaded data
    const listsData = uploadedRawSheets["Listas"] || DEFAULT_DEMO_SHEETS["Listas"];
    const wsListas = XLSX.utils.aoa_to_sheet(listsData);
    XLSX.utils.book_append_sheet(wb, wsListas, "Listas");

    // Monthly tabs output
    MONTH_NAMES_PT.forEach((monthName, idx) => {
      const monthNum = idx + 1;
      const monthTxs = financialData.filter(f => {
        const parts = f.date.split("-");
        return parseInt(parts[1], 10) === monthNum;
      });

      const monthRows = [["Data", "Tipo", "Categoria", "Subcategoria", "Descrição", "Cultura", "Safra", "Talhão", "Centro de Custo", "Fornecedor ou Cliente", "Quantidade", "Unidade", "Valor Unitário", "Valor Total", "Forma de Pagamento", "Status", "Observações"]];
      monthTxs.forEach(f => {
        monthRows.push([
          f.date, f.type === 'receita' ? 'Receita' : 'Despesa', f.category, f.subcat || "", f.description, f.culture, f.safra || "2025/2026", f.field || "", f.centerKey || "", f.entity || "", f.quantity || 1, f.unit || "Un", f.unitPrice || 0, f.value, f.payment || "", f.status || "Pago", f.notes || ""
        ]);
      });
      const wsMonth = XLSX.utils.aoa_to_sheet(monthRows);
      XLSX.utils.book_append_sheet(wb, wsMonth, monthName);
    });

    const exportName = `agrodash_consolidado_${Date.now()}.xlsx`;
    XLSX.writeFile(wb, exportName);
    alert(`Sucesso! planilha exportada offline como "${exportName}".`);
  } catch {
    alert("Erro ao exportar planilhas.");
  }
}

// ----------------------------------------------------
// 18. EXCLUSIVE USER MANAGEMENT & APP SUGGESTIONS ENGINE
// ----------------------------------------------------
function renderUsersPanel() {
  const users = getUsersList();
  
  // Render count
  const countTag = document.getElementById("users-count-tag");
  if (countTag) {
    countTag.innerText = `Mostrando ${users.length} usuário(s) cadastrado(s) localmente.`;
  }

  const tableBody = document.querySelector("#users-active-list-table tbody");
  if (!tableBody) return;
  tableBody.innerHTML = "";

  users.forEach((usr, index) => {
    const isCurrentUser = activeUser && activeUser.username.toLowerCase() === usr.username.toLowerCase();
    const isSystemAdmin = usr.username.toLowerCase() === "adminlogin";

    const tr = document.createElement("tr");
    tr.className = "hover:bg-stone-50/50 transition-colors border-b border-stone-100";
    
    // Resolve user role style
    const resolvedRole = usr.role || (isSystemAdmin ? "Administrador" : "Operador");
    let roleBadge = '';
    if (resolvedRole === "Administrador") {
      roleBadge = '<span class="inline-block text-[8px] leading-none bg-amber-50 text-amber-800 border border-amber-100 px-1 py-0.5 rounded font-black uppercase tracking-wider">Administrador</span>';
    } else if (resolvedRole === "Visualizador") {
      roleBadge = '<span class="inline-block text-[8px] leading-none bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Visualizador</span>';
    } else {
      roleBadge = '<span class="inline-block text-[8px] leading-none bg-emerald-50 text-emerald-700 px-1 py-0.5 rounded font-bold uppercase tracking-wider">Operador</span>';
    }

    // 1. Full name Column
    const tdName = document.createElement("td");
    tdName.className = "px-4 py-3.5 font-semibold text-stone-850";
    tdName.innerHTML = `
      <div class="flex items-center gap-2.5">
        <span class="w-8 h-8 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shrink-0 border border-emerald-100/40">
          ${usr.name ? usr.name.substring(0, 2) : "US"}
        </span>
        <div class="max-w-[150px] truncate">
          <span class="block truncate">${usr.name || "Sem Nome"}</span>
          <div class="flex flex-wrap gap-1 mt-0.5">
            ${isCurrentUser ? '<span class="inline-block text-[8px] leading-none bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-black uppercase tracking-wider">Você</span>' : ''}
            ${roleBadge}
          </div>
        </div>
      </div>
    `;
    
    // 2. Username Column
    const tdUser = document.createElement("td");
    tdUser.className = "px-4 py-3.5 font-mono text-xs text-stone-600";
    tdUser.textContent = usr.username;

    // 3. Password Column (with toggle eye icon)
    const tdPass = document.createElement("td");
    tdPass.className = "px-4 py-3.5";
    tdPass.innerHTML = `
      <div class="flex items-center gap-2">
        <span id="user-plain-pass-${index}" class="hidden font-mono text-xs text-stone-700 bg-stone-100 px-1.5 py-0.5 rounded border border-stone-200/50">${usr.passwordHash}</span>
        <span id="user-masked-pass-${index}" class="text-stone-300 tracking-widest font-sans font-bold text-sm">••••••••</span>
        <button type="button" onclick="toggleUserPassVisibility(${index})" class="text-stone-400 hover:text-stone-600 cursor-pointer p-1" title="Ver / Ocultar Senha">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
      </div>
    `;

    // 4. Force Reset status Column
    const tdReset = document.createElement("td");
    tdReset.className = "px-4 py-3.5 text-center";
    tdReset.innerHTML = usr.isFirstAccess
      ? `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100 whitespace-nowrap">SIM <span class="w-1 h-1 rounded-full bg-amber-500 animate-pulse ml-1"></span></span>`
      : `<span class="inline-flex items-center px-w py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 whitespace-nowrap">NÃO</span>`;

    // 5. Actions Column
    const tdActions = document.createElement("td");
    tdActions.className = "px-4 py-3.5 text-right space-x-1 whitespace-nowrap";
    
    const deleteBtnHtml = isSystemAdmin
      ? `<button disabled class="opacity-30 cursor-not-allowed inline-flex p-1.5 bg-stone-100 text-stone-400 rounded-lg text-xs" title="Administrador Principal não pode ser apagado">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
         </button>`
      : `<button onclick="handleDeleteUserAction('${usr.username}')" class="inline-flex p-1.5 bg-rose-50 hover:bg-rose-100 hover:text-rose-850 text-rose-600 rounded-lg text-xs transition-colors cursor-pointer" title="Remover Usuário">
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
         </button>`;

    const editBtnHtml = `<button onclick="handleEditUserAction(${index})" class="inline-flex p-1.5 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-850 text-emerald-700 rounded-lg text-xs transition-colors cursor-pointer" title="Editar Usuário">
      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
    </button>`;

    tdActions.innerHTML = `${editBtnHtml} ${deleteBtnHtml}`;

    tr.appendChild(tdName);
    tr.appendChild(tdUser);
    tr.appendChild(tdPass);
    tr.appendChild(tdReset);
    tr.appendChild(tdActions);

    tableBody.appendChild(tr);
  });

  renderCustomSuggestions();
}

window.toggleUserPassVisibility = function(idx) {
  const plainSpan = document.getElementById(`user-plain-pass-${idx}`);
  const maskedSpan = document.getElementById(`user-masked-pass-${idx}`);
  if (plainSpan && maskedSpan) {
    if (plainSpan.classList.contains("hidden")) {
      plainSpan.classList.remove("hidden");
      maskedSpan.classList.add("hidden");
    } else {
      plainSpan.classList.add("hidden");
      maskedSpan.classList.remove("hidden");
    }
  }
};

window.handleDeleteUserAction = function(username) {
  showCustomConfirm(`Excluir permanentemente o usuário "${username}"? Esta ação não pode ser desfeita.`, () => {
    const users = getUsersList();
    const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    localStorage.setItem("agropanel_users_database", JSON.stringify(filtered));
    
    if (activeUser && activeUser.username.toLowerCase() === username.toLowerCase()) {
      localStorage.removeItem("agropanel_logged_user");
      activeUser = null;
      showLoginScreen();
    } else {
      renderUsersPanel();
    }
  });
};

window.handleEditUserAction = function(idx) {
  const users = getUsersList();
  const usr = users[idx];
  if (!usr) return;

  // Change form mode
  const fTitle = document.getElementById("form-user-title");
  const editIdxInput = document.getElementById("input-user-editing-idx");
  const fFullName = document.getElementById("input-user-fullname");
  const fUserName = document.getElementById("input-user-username");
  const fPassword = document.getElementById("input-user-password");
  const fForceReset = document.getElementById("input-user-force-reset");

  if (fTitle) fTitle.innerText = "Editar Usuário";
  if (editIdxInput) editIdxInput.value = idx;
  if (fFullName) fFullName.value = usr.name || "";
  if (fUserName) fUserName.value = usr.username || "";
  if (fPassword) fPassword.value = usr.passwordHash || "";
  if (fForceReset) fForceReset.checked = usr.isFirstAccess;
  
  const fRoleSelect = document.getElementById("input-user-role");
  if (fRoleSelect) {
    fRoleSelect.value = usr.role || (usr.username.toLowerCase() === "adminlogin" ? "Administrador" : "Operador");
  }

  // Scroll smoothly to input block
  const managerForm = document.getElementById("form-manage-user");
  if (managerForm) {
    managerForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
};

function getCustomSuggestions() {
  const data = localStorage.getItem("agropanel_custom_suggestions");
  return data ? JSON.parse(data) : [];
}

function saveCustomSuggestion(text) {
  const list = getCustomSuggestions();
  list.unshift({
    id: Date.now(),
    text: text,
    createdAt: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR')
  });
  localStorage.setItem("agropanel_custom_suggestions", JSON.stringify(list));
}

window.deleteCustomSuggestion = function(id) {
  const list = getCustomSuggestions();
  const filtered = list.filter(item => item.id !== id);
  localStorage.setItem("agropanel_custom_suggestions", JSON.stringify(filtered));
  renderCustomSuggestions();
};

function renderCustomSuggestions() {
  const suggestionsBox = document.getElementById("custom-suggestions-list");
  if (!suggestionsBox) return;

  const list = getCustomSuggestions();
  if (list.length === 0) {
    suggestionsBox.innerHTML = `
      <div class="text-stone-400 text-center py-4 text-[10px] font-mono border border-dashed border-stone-200 rounded-xl mt-2 bg-white/50">
        Nenhuma sugestão personalizada anotada ainda.
      </div>
    `;
    return;
  }

  suggestionsBox.innerHTML = '<span class="block text-[9px] font-bold text-stone-400 bg-stone-100 px-2 py-1 rounded inline-block uppercase tracking-wider mt-3 mb-1.5">Minhas Anotações Salvas:</span>';
  
  const cont = document.createElement("div");
  cont.className = "space-y-1.5 mt-1 max-h-[140px] overflow-y-auto pr-1";
  
  list.forEach(item => {
    const div = document.createElement("div");
    div.className = "bg-amber-50/50 border border-amber-100 p-2.5 rounded-xl text-xs flex justify-between items-start gap-2 max-w-full font-sans";
    div.innerHTML = `
      <div class="flex-1 space-y-0.5 truncate pr-1">
        <p class="text-stone-750 font-semibold whitespace-pre-wrap leading-normal truncate max-w-xs">${item.text}</p>
        <span class="text-[8px] text-stone-400 font-mono">${item.createdAt}</span>
      </div>
      <button onclick="deleteCustomSuggestion(${item.id})" class="text-rose-500 hover:text-rose-700 font-bold cursor-pointer p-0.5 transition-colors shrink-0 text-sm leading-none" title="Apagar Sugestão">
        &times;
      </button>
    `;
    cont.appendChild(div);
  });
  
  suggestionsBox.appendChild(cont);
}

// ----------------------------------------------------
// 6. GOOGLE SPREADSHEETS AUTOMATIC SYNC SYSTEM
// ----------------------------------------------------
let gsheetsAccessToken = null;

function initGoogleSheetsSync() {
  const firebaseConfig = {
    projectId: "imagined-gravity-cwh20",
    appId: "1:1032702526299:web:cb5bba2cd938ae0572107e",
    apiKey: "AIzaSyBINQFVdUH9jEoSX_F0dp1QvVRoI4k2lHg",
    authDomain: "imagined-gravity-cwh20.firebaseapp.com",
    storageBucket: "imagined-gravity-cwh20.firebasestorage.app",
    messagingSenderId: "1032702526299"
  };

  if (!window.firebase) {
    console.error("Firebase SDK não carregado. Integração Google Sheets desabilitada.");
    return;
  }

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const auth = firebase.auth();
  
  auth.onAuthStateChanged(user => {
    const loggedOutDiv = document.getElementById("gsheets-logged-out");
    const loggedInDiv = document.getElementById("gsheets-logged-in");
    const userEmailSpan = document.getElementById("gsheets-user-email");
    const spreadsheetInput = document.getElementById("gsheets-spreadsheet-id");
    const lastSyncText = document.getElementById("gsheets-last-sync-text");

    if (user) {
      if (loggedOutDiv) loggedOutDiv.classList.add("hidden");
      if (loggedInDiv) {
        loggedInDiv.classList.remove("hidden");
        loggedInDiv.classList.add("animate-fade-in");
      }
      if (userEmailSpan) userEmailSpan.textContent = user.email;
      
      const savedSpreadsheetId = localStorage.getItem("agrodash_gsheets_id");
      if (savedSpreadsheetId && spreadsheetInput) {
        spreadsheetInput.value = savedSpreadsheetId;
      }
      
      const lastSync = localStorage.getItem("agrodash_gsheets_last_sync_time");
      if (lastSync && lastSyncText) {
        lastSyncText.textContent = `Última sincronização: ${lastSync}`;
      }

      gsheetsAccessToken = localStorage.getItem("agrodash_gsheets_access_token") || null;
    } else {
      if (loggedOutDiv) loggedOutDiv.classList.remove("hidden");
      if (loggedInDiv) loggedInDiv.classList.add("hidden");
      gsheetsAccessToken = null;
    }
  });

  const btnLogin = document.getElementById("btn-gsheets-login");
  if (btnLogin) {
    btnLogin.onclick = () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
      
      auth.signInWithPopup(provider).then((result) => {
        const credential = result.credential;
        gsheetsAccessToken = credential.accessToken;
        localStorage.setItem("agrodash_gsheets_access_token", gsheetsAccessToken);
        showCustomAlert("Conectado com sucesso ao Google Sheets!", "success");
      }).catch((error) => {
        console.error("Erro ao fazer login no Google:", error);
        showCustomAlert("Erro ao conectar conta Google: " + error.message, "error");
      });
    };
  }

  const btnLogout = document.getElementById("btn-gsheets-logout");
  if (btnLogout) {
    btnLogout.onclick = () => {
      auth.signOut().then(() => {
        localStorage.removeItem("agrodash_gsheets_access_token");
        localStorage.removeItem("agrodash_gsheets_id");
        localStorage.removeItem("agrodash_gsheets_last_sync_time");
        gsheetsAccessToken = null;
        showCustomAlert("Desconectado do Google Sheets.", "success");
      });
    };
  }

  const btnSync = document.getElementById("btn-gsheets-sync");
  if (btnSync) {
    btnSync.onclick = async () => {
      let sheetIdOrUrl = document.getElementById("gsheets-spreadsheet-id")?.value?.trim();
      if (!sheetIdOrUrl) {
        showCustomAlert("Insira o ID ou URL da planilha Google Sheets.", "warning");
        return;
      }

      if (sheetIdOrUrl.includes("docs.google.com/spreadsheets")) {
        const match = sheetIdOrUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          sheetIdOrUrl = match[1];
        }
      }

      if (!firebase.auth().currentUser || !gsheetsAccessToken) {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/spreadsheets.readonly');
        
        try {
          const result = await auth.signInWithPopup(provider);
          gsheetsAccessToken = result.credential.accessToken;
          localStorage.setItem("agrodash_gsheets_access_token", gsheetsAccessToken);
        } catch (error) {
          showCustomAlert("Erro de autenticação para sincronizar: " + error.message, "error");
          return;
        }
      }

      btnSync.disabled = true;
      const originalHtml = btnSync.innerHTML;
      btnSync.innerHTML = `<svg class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;

      try {
        showCustomAlert("Conectando à planilha no Google Drive...", "success");
        
        const docInfo = await fetchGoogleWorkbook(sheetIdOrUrl, gsheetsAccessToken);
        const docTitle = docInfo.properties.title;
        const sheetTitles = docInfo.sheets.map(s => s.properties.title);

        showCustomAlert("Baixando abas: " + sheetTitles.join(", ") + "...", "success");
        
        const valueRanges = await fetchGoogleSheetValuesBatch(sheetIdOrUrl, sheetTitles, gsheetsAccessToken);
        
        const importedData = {};
        valueRanges.forEach(vr => {
          let tabName = vr.range.split('!')[0];
          if (tabName.startsWith("'") && tabName.endsWith("'")) {
            tabName = tabName.substring(1, tabName.length - 1);
          }
          importedData[tabName] = vr.values || [];
        });

        localStorage.setItem("agrodash_custom_sheets", JSON.stringify(importedData));
        localStorage.setItem("agrodash_file_name", "Google Sheets: " + docTitle);
        localStorage.setItem("agrodash_gsheets_id", sheetIdOrUrl);
        
        const nowStr = new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR');
        localStorage.setItem("agrodash_gsheets_last_sync_time", nowStr);
        
        const lastSyncTextEl = document.getElementById("gsheets-last-sync-text");
        if (lastSyncTextEl) lastSyncTextEl.textContent = `Última sincronização: ${nowStr}`;

        loadWorkspaceData();
        renderApp();
        
        showCustomAlert("Google Sheets sincronizado com sucesso!", "success");
      } catch (err) {
        console.error("Erro na sincronização:", err);
        showCustomAlert("Erro na sincronização: " + err.message, "error");
      } finally {
        btnSync.disabled = false;
        btnSync.innerHTML = originalHtml;
      }
    };
  }
}

async function fetchGoogleWorkbook(spreadsheetId, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Código do documento inválido ou sem permissão.");
  }
  return await response.json();
}

async function fetchGoogleSheetValuesBatch(spreadsheetId, sheetNames, accessToken) {
  const queryRanges = sheetNames.map(name => `ranges=${encodeURIComponent(name)}`).join('&');
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${queryRanges}`;
  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || "Erro de leitura nos valores.");
  }
  const data = await response.json();
  return data.valueRanges || [];
}


