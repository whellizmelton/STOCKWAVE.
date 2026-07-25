// script.js
// ==============================================================
// 1. LÓGICA DO MENU MOBILE (PRIORIDADE ALTA)
// ==============================================================
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.getElementById('mainNav');

    // Só executa se os elementos existirem na página
    if (mobileMenuBtn && mainNav) {
        
        // Função para Fechar o Menu
        const closeMenu = () => {
            mainNav.classList.remove('active');
            mobileMenuBtn.classList.remove('active'); // Remove efeito do botão
            
            // Reseta o ícone para "Barras"
            const icon = mobileMenuBtn.querySelector('i');
            if(icon) {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        };

        // Função para Abrir/Alternar o Menu
        const toggleMenu = (e) => {
            // Impede que o clique se propague para o documento
            e.stopPropagation(); 
            
            const isActive = mainNav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');

            // Troca o ícone
            const icon = mobileMenuBtn.querySelector('i');
            if(icon) {
                if (isActive) {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                } else {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        };

        // EVENTO 1: Clique no Botão Sanduíche
        mobileMenuBtn.addEventListener('click', toggleMenu);

        // EVENTO 2: Clique em qualquer lugar do Documento (para fechar)
        document.addEventListener('click', (event) => {
            // Se o menu estiver aberto...
            if (mainNav.classList.contains('active')) {
                // E o clique NÃO foi dentro do menu...
                // E o clique NÃO foi no próprio botão...
                if (!mainNav.contains(event.target) && !mobileMenuBtn.contains(event.target)) {
                    closeMenu();
                }
            }
        });

        // EVENTO 3: Clique nos links do menu (para fechar ao navegar)
        const navLinks = mainNav.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', closeMenu);
        });

        // EVENTO 4: Redimensionamento da tela (fecha se virar desktop)
        window.addEventListener('resize', () => {
            if (window.innerWidth > 768) {
                closeMenu();
            }
        });
    }
});

// ... AQUI COMEÇA O RESTO DO SEU CÓDIGO ORIGINAL (let db, let currentUser...) ...

/* ============================================
   PROTEÇÃO DE PÁGINAS — REDIRECIONAR SE NÃO LOGADO
   (IGNORADO CONFORME SOLICITADO PELO USUÁRIO)
=============================================== */
let db;            // Firestore
let currentUser;   // Usuário logado

let products = [];
let history = [];
let categories = [];


document.addEventListener("DOMContentLoaded", () => {
    
    // PASSO 1: IMPOR A REGRAS DE NAVEGAÇÃO HISTORIA -> INDEX
    
    
    // Se houve redirecionamento, interrompe o resto do script
    if (wasRedirected) {
        console.log('Redirecionamento ocorreu - parando execução');
        return; 
    }

    // O BLOCO firebase.auth().onAuthStateChanged FOI IGNORADO CONFORME SOLICITAÇÃO DO USUÁRIO.
    /* ... código comentado ... */


    // O BLOCO firebase.auth().onAuthStateChanged FOI IGNORADO CONFORME SOLICITAÇÃO DO USUÁRIO.
    /*
    firebase.auth().onAuthStateChanged(async user => {
        const isLoginPage = window.location.pathname.includes("login.html");
    
        if (!user && !isLoginPage) {
            window.location.href = "login.html";
            return;
        }
    
        if (user && isLoginPage) {
            window.location.href = "index.html";
            return;
        }
    
        if (user) {
            currentUser = user;
            db = firebase.firestore();
    
            await carregarDadosDoUsuario();
        }
    });
    */
    

});
async function carregarDadosDoUsuario() {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const docRef = db.collection("users").doc(uid);
    const doc = await docRef.get();

    if (doc.exists) {
        const data = doc.data();

        products = data.products || [];
        history = data.history || [];
        categories = data.categories || [];

    } else {
        products = [];
        history = [];
        categories = [];

        await salvarDadosNoFirestore();
    }

    // Se estiver usando o modo sem login, a função 'atualizarUI' pode precisar
    // de adaptações para ser chamada diretamente no StockWaveApp.init()
    // Caso contrário, mantenha esta linha se 'currentUser' for definido manualmente.
    // atualizarUI(); 
}
async function salvarDadosNoFirestore() {
    if (!currentUser) return;
    const uid = currentUser.uid;

    await db.collection("users").doc(uid).set({
        products,
        history,
        categories
    });
}

// O segundo DOMContentLoaded é mantido para inicializar as páginas
// O segundo DOMContentLoaded é mantido para inicializar as páginas
document.addEventListener('DOMContentLoaded', function() {
    highlightActiveLink();
    
    const path = window.location.pathname;
    const page = path.split("/").pop();

    console.log('Inicializando página:', page);

    // === DASHBOARD PRINCIPAL (index.html OU raiz) ===
    // AQUI ESTÁ A CORREÇÃO: Agrupamos "index.html" e "" (vazio) na mesma condição.
    if (page === "index.html" || page === "") {
        console.log('Inicializando dashboard');
        StockWaveApp.init(); 
    } 
    // === OUTRAS PÁGINAS ===
    else if (page === "produtos.html") {
        initProdutos();
    } else if (page === "estoque.html") {
        initEstoque();
    } else if (page === "historico.html") {
        initHistorico();
    } else if (page === "configuracoes.html") {
        initConfiguracoes();
    }
});

// ========== VARIÁVEIS GLOBAIS E FUNÇÕES DE PERSISTÊNCIA ==========


// Funções para salvar dados no localStorage
function salvarProdutos() {
    localStorage.setItem('stockwave_products', JSON.stringify(products));
}

function salvarHistorico() {
    localStorage.setItem('estoque_historico', JSON.stringify(history));
}

function salvarCategorias() {
    localStorage.setItem('estoque_categorias', JSON.stringify(categories));
}

// Icons for product categories (compartilhado)
const categoryIcons = {
    'Eletrônicos': 'fa-laptop',
    'Alimentos': 'fa-apple-alt',
    'Limpeza': 'fa-soap',
    'Roupas': 'fa-tshirt',
    'Bebidas': 'fa-wine-bottle',
    'eletronicos': 'fa-laptop',
    'eletrônicos': 'fa-laptop',
    'Eletronicos': 'fa-laptop',
    'alimentos': 'fa-apple-alt',
    'limpeza': 'fa-soap',
    'roupas': 'fa-tshirt',
    'bebidas': 'fa-wine-bottle'
};

// Funções auxiliares compartilhadas
function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

// Função global para destacar link ativo
function highlightActiveLink() {
    const path = window.location.pathname;
    let currentPage = path.split("/").pop();
    
    console.log('Destacando link para página:', currentPage);
    
    // CORREÇÃO AQUI: Se for vazio (""), assume que é o index.html para o destaque funcionar.
    // O bloco antigo que referenciava "historia.html" foi removido.
    if (currentPage === "") {
        currentPage = "index.html"; 
    }
    
    const navLinks = document.querySelectorAll('nav a');
    
    // O link para o Início no seu HTML deve ser "index.html" (ou "./index.html")
    // Os links têm que ter o atributo href apontando para o nome do arquivo.
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        let linkPage = linkHref;
        
        // Remover ./ se existir (bom que isso já estava)
        if (linkPage.startsWith('./')) {
            linkPage = linkPage.substring(2);
        }
        
        // Comparação corrigida
        // Ex: Se currentPage for "index.html", o link que tiver href "index.html" será ativado.
        const isActive = currentPage === linkPage;
        
        link.classList.toggle('active', isActive);
        
        if (isActive) {
            console.log('Link ativo:', linkHref);
        }
    });
}
// ========= FUNÇÃO GLOBAL PADRONIZADA DE EXPORTAÇÃO PARA EXCEL =========
function exportarParaExcel(dados, nomePlanilha = "Relatório", nomeArquivo = "relatorio.xlsx") {
    if (!dados || dados.length === 0) {
        alert("Nenhum dado encontrado para exportar!");
        return;
    }

    const wb = XLSX.utils.book_new();

    // Converter para planilha
    const ws = XLSX.utils.json_to_sheet(dados);

    // Estilos de cabeçalho e colunas
    const range = XLSX.utils.decode_range(ws["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
        if (cell) {
            cell.s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "1E1B4B" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
    }

    ws["!cols"] = Object.keys(dados[0]).map(() => ({ wch: 20 }));
    ws["!freeze"] = { x: 0, y: 1 };
    ws["!autofilter"] = { ref: ws["!ref"] };

    XLSX.utils.book_append_sheet(wb, ws, nomePlanilha);
    XLSX.writeFile(wb, nomeArquivo);
}

// Executar quando a página carregar
window.addEventListener('DOMContentLoaded', highlightActiveLink);

// ================== PAGINA INICIAL (index.html) ==================
const StockWaveApp = (() => { 
    // Estado da aplicação
    let state = {
        products: [],
        categories: [],
        history: [],
        currentPage: 1,
        itemsPerPage: 5,
        isValueVisible: false,
        searchTerm: '',
        categoryIcons: {
            'Eletrônicos': 'fa-laptop',
            'Alimentos': 'fa-apple-alt',
            'Limpeza': 'fa-soap',
            'Roupas': 'fa-tshirt',
            'Bebidas': 'fa-wine-bottle',
            'eletronicos': 'fa-laptop',
            'eletrônicos': 'fa-laptop',
            'Eletronicos': 'fa-laptop',
            'alimentos': 'fa-apple-alt',
            'limpeza': 'fa-soap',
            'roupas': 'fa-tshirt',
            'bebidas': 'fa-wine-bottle'
        }
    };
        
    // Elementos DOM
    const DOM = {
        productsTable: document.getElementById('productsTable'),
        historyItems: document.getElementById('historyItems'),
        productModal: document.getElementById('productModal'),
        movementModal: document.getElementById('movementModal'),
        categoryModal: document.getElementById('categoryModal'),
        categoryList: document.getElementById('categoryList'),
        movementProductSelect: document.getElementById('movementProduct'),
        productCategorySelect: document.getElementById('productCategory'),
        movementTypeInput: document.getElementById('movementType'),
        modalMovementTitle: document.getElementById('modalMovementTitle'),
        modalProductTitle: document.getElementById('modalProductTitle'),
        filterButtons: document.querySelectorAll('.filter-btn'),
        searchInput: document.getElementById('searchInput'),
        prevPageBtn: document.getElementById('prevPageBtn'),
        nextPageBtn: document.getElementById('nextPageBtn'),
        pageInfo: document.getElementById('pageInfo'),
        refreshBtn: document.getElementById('refreshBtn')
    };
    
    // Inicializar dados de exemplo se o localStorage estiver vazio
    const initSampleData = () => {
        if (state.products.length === 0) {
            state.products = [
                // ... (mantenha os produtos de exemplo)
            ];
            saveProducts();
        }
        
        if (state.history.length === 0) {
            state.history = [
                // ... (mantenha o histórico de exemplo)
            ];
            saveHistory();
        }
    };
    
    // Salvar dados no localStorage
    const saveProducts = () => {
        localStorage.setItem('stockwave_products', JSON.stringify(state.products));
    };
    
    const saveHistory = () => {
        localStorage.setItem('stockwave_history', JSON.stringify(state.history));
    };
    
    const saveCategories = () => {
        localStorage.setItem('stockwave_categories', JSON.stringify(state.categories));
    };
    
    // Calcular valor total do estoque
    const calculateTotalValue = () => {
        return state.products.reduce((total, product) => {
            return total + (product.quantity * product.price);
        }, 0);
    };
    
    // Calcular itens com baixo estoque
    const calculateLowStockItems = () => {
        return state.products.filter(product => 
            product.status === 'low-stock' || 
            product.status === 'critical-stock'
        ).length;
    };
    
    // Atualizar status do produto
    const updateProductStatus = (product) => {
        if (product.quantity <= 0) {
            product.status = 'out-of-stock';
        } 
        // Estoque crítico (suficiente para 1 dia)
        else if (product.dailyConsumption > 0 && product.quantity <= product.dailyConsumption) {
            product.status = 'critical-stock';
        } 
        // Estoque baixo (suficiente para 5 dias)
        else if (product.dailyConsumption > 0 && product.quantity <= (product.dailyConsumption * 5)) {
            product.status = 'low-stock';
        } 
        // Estoque mínimo definido
        else if (product.minStock > 0 && product.quantity <= product.minStock) {
            product.status = 'low-stock';
        }
        else {
            product.status = 'in-stock';
        }
    };
    
    // Filtrar produtos com base no termo de pesquisa
    const filterProducts = () => {
        if (!state.searchTerm) return state.products;
        
        const term = state.searchTerm.toLowerCase();
        return state.products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            product.code.toLowerCase().includes(term)
        );
    };
    
    // Paginar produtos
    const getPaginatedProducts = () => {
        const filtered = filterProducts();
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    };
    
    // Calcular número total de páginas
    const getTotalPages = () => {
        const filtered = filterProducts();
        return Math.ceil(filtered.length / state.itemsPerPage);
    };
    
    // Atualizar estatísticas do dashboard
    const updateStatsCards = () => {
        const totalValue = calculateTotalValue();
        const lowStockCount = calculateLowStockItems();
        
        document.getElementById('totalProducts').textContent = state.products.length;
        document.getElementById('lowStockItems').textContent = lowStockCount;
        document.getElementById('totalCategories').textContent = state.categories.length;
        
        const hiddenValue = document.getElementById('hiddenValue');
        const toggleIcon = document.getElementById('toggleVisibility');
        
        if (state.isValueVisible) {
            hiddenValue.textContent = `R$ ${totalValue.toFixed(2)}`;
            toggleIcon.classList.remove('fa-eye-slash');
            toggleIcon.classList.add('fa-eye');
        } else {
            hiddenValue.textContent = 'R$ ******';
            toggleIcon.classList.remove('fa-eye');
            toggleIcon.classList.add('fa-eye-slash');
        }
    };
    
    // Renderizar tabela de produtos
    const renderProductsTable = () => {
        DOM.productsTable.innerHTML = '';
        
        const paginatedProducts = getPaginatedProducts();
        
        if (paginatedProducts.length === 0) {
            DOM.productsTable.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-light);">
                        <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Nenhum produto encontrado</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        paginatedProducts.forEach(product => {
            const statusText = product.status === 'in-stock' ? 'Em Estoque' : 
                              product.status === 'low-stock' ? 'Baixo Estoque' : 
                              product.status === 'critical-stock' ? 'Estoque Crítico' : 
                              'Sem Estoque';
            
            const statusClass = `status ${product.status}`;
            
            // Adicionar classes de alerta
            let rowClass = '';
            if (product.status === 'low-stock') {
                rowClass = 'low-stock-warning';
            } else if (product.status === 'critical-stock') {
                rowClass = 'critical-stock-alert';
            } else if (product.status === 'out-of-stock') {
                rowClass = 'no-stock-alert';
            }
            
            const row = document.createElement('tr');
            row.className = rowClass;
            row.innerHTML = `
                <td>
                    <div class="product-cell">
                        <div class="product-image">
                            <i class="fas ${state.categoryIcons[product.category] || 'fa-box'}"></i>
                        </div>
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-code">${product.code}</div>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td class="action-cell">
                    <button class="action-btn edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" data-id="${product.id}">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
                <td class="quick-out-cell">
                    <div class="quick-out-container">
                        <input type="number" min="1" max="${product.quantity}" class="quick-out-input" placeholder="Qtd" data-id="${product.id}">
                        <button class="quick-out-btn" data-id="${product.id}">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                </td>
            `;
            DOM.productsTable.appendChild(row);
        });
        
        // Atualizar controles de paginação
        updatePaginationControls();
        
        // Adicionar event listeners aos botões de ação
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
        
        // Adicionar event listeners aos botões de saída rápida
        document.querySelectorAll('.quick-out-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const productId = btn.dataset.id;
                const input = document.querySelector(`.quick-out-input[data-id="${productId}"]`);
                const quantity = parseInt(input.value);
                
                if (!quantity || quantity <= 0) {
                    showToast('Digite uma quantidade válida!', 'error');
                    return;
                }
                
                registerQuickOut(productId, quantity);
            });
        });
        
        // Atualizar estatísticas
        updateStatsCards();
    };
    
    // Atualizar controles de paginação
    const updatePaginationControls = () => {
        const totalPages = getTotalPages();
        
        DOM.pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
        
        DOM.prevPageBtn.disabled = state.currentPage === 1;
        DOM.nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;
    };
    
    // Renderizar histórico de movimentações
    const renderHistoryItems = (filter = 'all') => {
        DOM.historyItems.innerHTML = '';
        
        let filteredHistory = state.history;
        if (filter !== 'all') {
            filteredHistory = state.history.filter(item => item.type === filter);
        }
        
        if (filteredHistory.length === 0) {
            DOM.historyItems.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>Nenhuma movimentação registrada</p>
                </div>
            `;
            return;
        }
        
        filteredHistory.forEach(item => {
            const iconClass = item.type === 'entry' ? 'fas fa-arrow-circle-down entry' :
                             item.type === 'exit' ? 'fas fa-arrow-circle-up exit' :
                             'fas fa-trash-alt delete';
                             
            const typeText = item.type === 'entry' ? 'Entrada' :
                             item.type === 'exit' ? 'Saída' : 'Exclusão';
            
            // Extrair motivo básico (primeira parte antes de ":")
            let motivo = item.note || "";
            if (motivo.includes(":")) {
                motivo = motivo.split(":")[0];
            }
            
            const itemElement = document.createElement('div');
            itemElement.className = 'history-item';
            itemElement.dataset.id = item.id; // Adiciona ID para referência
            itemElement.innerHTML = `
                <div class="history-icon ${item.type}">
                    <i class="${iconClass}"></i>
                </div>
                <div class="history-details">
                    <div class="history-product">${item.productName}</div>
                    <div class="history-info">
                        <span>${typeText} de ${item.quantity} unidades</span>
                        <span>${motivo}</span>
                    </div>
                </div>
                <div class="history-date">${new Date(item.date).toLocaleString()}</div>
            `;
            DOM.historyItems.appendChild(itemElement);
        });
        
        // Adicionar event listeners para abrir detalhes
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const historyId = item.dataset.id;
                openHistoryDetailModal(historyId);
            });
        });
    };
    const openHistoryDetailModal = (historyId) => {
        const historyItem = state.history.find(item => item.id === historyId);
        if (!historyItem) return;
        
        const date = new Date(historyItem.date);
        const formattedDate = date.toLocaleDateString('pt-BR');
        const formattedTime = date.toLocaleTimeString('pt-BR');
        
        const typeText = historyItem.type === 'entry' ? 'Entrada' :
                         historyItem.type === 'exit' ? 'Saída' : 'Exclusão';
        
        // Extrair motivo e notas
        let motivo = "";
        let notas = "";
        
        if (historyItem.note) {
            if (historyItem.note.includes(":")) {
                [motivo, notas] = historyItem.note.split(":").map(s => s.trim());
            } else {
                motivo = historyItem.note;
            }
        }
        
        document.getElementById('detailHistoryDateTime').textContent = `${formattedDate} às ${formattedTime}`;
        document.getElementById('detailHistoryType').textContent = typeText;
        document.getElementById('detailHistoryType').className = `detail-value type ${historyItem.type}`;
        document.getElementById('detailHistoryProduct').textContent = historyItem.productName;
        document.getElementById('detailHistoryQuantity').textContent = historyItem.quantity;
        document.getElementById('detailHistoryUser').textContent = historyItem.user;
        document.getElementById('detailHistoryReason').textContent = motivo || "Nenhum motivo informado";
        document.getElementById('detailHistoryNote').textContent = notas || "Nenhuma nota adicional";
        
        document.getElementById('historyDetailModal').classList.add('active');
    };
    
    // Renderizar lista de categorias
    const renderCategoryList = () => {
        DOM.categoryList.innerHTML = '';
        state.categories.forEach((category, index) => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <span>${category}</span>
                <div class="category-actions">
                    <button class="category-btn delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            DOM.categoryList.appendChild(categoryItem);
        });
        
        // Adicionar event listeners aos botões de exclusão
        document.querySelectorAll('.category-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(btn.dataset.index));
        });
    };
    
    // Renderizar opções de categoria
    const renderCategoryOptions = () => {
        DOM.productCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        state.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            DOM.productCategorySelect.appendChild(option);
        });
    };
    
    // Abrir modal de adição de produto
    const openAddProductModal = () => {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        DOM.modalProductTitle.textContent = 'Adicionar Novo Produto';
        renderCategoryOptions();
        DOM.productModal.classList.add('active');
    };
    
    // Abrir modal de edição de produto
    const openEditProductModal = (productId) => {
        const product = state.products.find(p => p.id == productId);
        if (product) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productCode').value = product.code;
            document.getElementById('productQuantity').value = product.quantity;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productMinStock').value = product.minStock || '';
            document.getElementById('productDailyConsumption').value = product.dailyConsumption || '';
            document.getElementById('productId').value = product.id;
            
            renderCategoryOptions();
            DOM.modalProductTitle.textContent = 'Editar Produto';
            DOM.productModal.classList.add('active');
        }
    };
    
    // Abrir modal de movimentação
    const openMovementModal = (type) => {
        DOM.movementTypeInput.value = type;
        
        // Definir título do modal
        DOM.modalMovementTitle.textContent = type === 'entry' ? 
            'Registrar Entrada de Produto' : 'Registrar Saída de Produto';
        
        // Popular o seletor de produtos
        DOM.movementProductSelect.innerHTML = '';
        state.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            DOM.movementProductSelect.appendChild(option);
        });
        
        // Definir data e hora atuais como padrão
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0,5);
        
        document.getElementById('movementDate').value = today;
        document.getElementById('movementTime').value = time;
        
        // Mostrar campos apropriados
        document.getElementById('entryNoteGroup').style.display = type === 'entry' ? 'block' : 'none';
        document.getElementById('exitReasonGroup').style.display = type === 'exit' ? 'block' : 'none';
        
        // Resetar campos
        document.getElementById('movementQuantity').value = '';
        document.getElementById('movementNote').value = '';
        document.getElementById('movementReason').value = '';
        document.getElementById('lossDescription').value = '';
        document.getElementById('lossDescriptionGroup').style.display = 'none';
        
        DOM.movementModal.classList.add('active');
    };
    
    // Abrir modal de categorias
    const openCategoryModal = () => {
        renderCategoryList();
        DOM.categoryModal.classList.add('active');
    };
    
    // Salvar produto
    const saveProduct = () => {
        const productId = document.getElementById('productId').value;
        const productData = {
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            code: document.getElementById('productCode').value,
            quantity: parseInt(document.getElementById('productQuantity').value) || 0,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            description: document.getElementById('productDescription').value,
            minStock: parseInt(document.getElementById('productMinStock').value) || 0,
            dailyConsumption: parseInt(document.getElementById('productDailyConsumption').value) || 0,
            status: 'in-stock',
            lastUpdate: new Date().toISOString()
        };
        
        // Validar campos obrigatórios
        if (!productData.name || !productData.category || !productData.code) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Atualizar status
        updateProductStatus(productData);
        
        if (productId) {
            // Atualizar produto existente
            const index = state.products.findIndex(p => p.id == productId);
            if (index !== -1) {
                state.products[index] = { ...state.products[index], ...productData };
            }
        } else {
            // Adicionar novo produto
            productData.id = Date.now().toString();
            state.products.push(productData);
        }
        
        // Atualizar UI e salvar
        renderProductsTable();
        saveProducts();
        DOM.productModal.classList.remove('active');
        showToast(`Produto ${productId ? 'atualizado' : 'adicionado'} com sucesso!`);
    };
    
    // Excluir produto
    const deleteProduct = (productId) => {
        const product = state.products.find(p => p.id == productId);
        if (product && confirm(`Tem certeza que deseja excluir "${product.name}" do estoque?`)) {
            // Remover produto do array
            state.products = state.products.filter(p => p.id != productId);
            
            // Adicionar ao histórico
            state.history.unshift({
                id: Date.now().toString(),
                type: "delete",
                productId: product.id,
                productName: product.name,
                quantity: 0,
                date: new Date().toISOString(),
                user: "Administrador",
                note: "Produto excluído do sistema"
            });
            
            // Atualizar UI e salvar
            renderProductsTable();
            renderHistoryItems();
            saveProducts();
            saveHistory();
            showToast(`"${product.name}" foi excluído com sucesso.`);
        }
    };
    
    // Salvar movimentação
    const saveMovement = () => {
        const productId = DOM.movementProductSelect.value;
        const quantity = parseInt(document.getElementById('movementQuantity').value) || 0;
        const date = document.getElementById('movementDate').value;
        const time = document.getElementById('movementTime').value;
        const type = DOM.movementTypeInput.value;
        
        // Validar campos obrigatórios
        if (!productId || !quantity || !date || !time) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        let note = '';
        
        if (type === 'entry') {
            const reason = document.getElementById('entryReason').value;
            if (!reason) {
                showToast('Por favor, selecione o motivo da entrada.', 'error');
                return;
            }
            const noteText = document.getElementById('movementNote').value;
            note = noteText ? `${reason}: ${noteText}` : reason;
        } else if (type === 'exit') {
            const reason = document.getElementById('movementReason').value;
            if (!reason) {
                showToast('Por favor, selecione o motivo da saída.', 'error');
                return;
            }
            
            if (reason === 'Perda') {
                const lossDescription = document.getElementById('lossDescription').value.trim();
                if (!lossDescription) {
                    showToast('Por favor, descreva a razão da perda.', 'error');
                    return;
                }
                note = `Perda: ${lossDescription}`;
            } else {
                note = reason;
            }
        }
        
        const product = state.products.find(p => p.id == productId);
        if (!product) return;
        
        // Validar estoque para saída
        if (type === 'exit' && product.quantity < quantity) {
            showToast('Quantidade em estoque insuficiente para esta saída.', 'error');
            return;
        }
        
        // Criar data/hora combinada em formato ISO
        const dateTime = new Date(`${date}T${time}`).toISOString();
        
        // Atualizar quantidade do produto
        if (type === 'entry') {
            product.quantity += quantity;
        } else if (type === 'exit') {
            product.quantity -= quantity;
        }
        
        // Atualizar status do produto
        updateProductStatus(product);
        product.lastUpdate = new Date().toISOString();
        
        // Adicionar ao histórico
        state.history.unshift({
            id: Date.now().toString(),
            type: type,
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            date: dateTime,
            user: "Administrador",
            note: note
        });
        
        // Atualizar UI e salvar
        renderProductsTable();
        renderHistoryItems();
        saveProducts();
        saveHistory();
        DOM.movementModal.classList.remove('active');
        showToast(`Movimentação de ${type === 'entry' ? 'entrada' : 'saída'} registrada com sucesso!`);
    };
    
    // Adicionar nova categoria
    const addCategory = () => {
        const newCategory = document.getElementById('newCategoryName').value.trim();
        if (!newCategory) {
            showToast('Digite um nome para a categoria!', 'error');
            return;
        }

        if (state.categories.includes(newCategory)) {
            showToast('Esta categoria já existe!', 'error');
            return;
        }

        state.categories.push(newCategory);
        saveCategories();
        renderCategoryList();
        document.getElementById('newCategoryName').value = '';
        showToast(`Categoria "${newCategory}" adicionada com sucesso!`);
    };
    
    // Excluir categoria
    const deleteCategory = (index) => {
        if (confirm(`Tem certeza que deseja excluir a categoria "${state.categories[index]}"?`)) {
            // Verificar se há produtos nessa categoria
            const hasProducts = state.products.some(p => p.category === state.categories[index]);
            if (hasProducts) {
                showToast('Não é possível excluir esta categoria pois existem produtos associados a ela.', 'error');
                return;
            }

            const categoryName = state.categories[index];
            state.categories.splice(index, 1);
            saveCategories();
            renderCategoryList();
            showToast(`Categoria "${categoryName}" excluída com sucesso!`);
        }
    };
    
    // Registrar saída rápida
    const registerQuickOut = (productId, quantity) => {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;
    
        if (product.quantity < quantity) {
            showToast('Quantidade em estoque insuficiente!', 'error');
            return;
        }
    
        // Atualizar produto
        product.quantity -= quantity;
        updateProductStatus(product);
        product.lastUpdate = new Date().toISOString();
    
        // Adicionar ao histórico com motivo padrão "Venda"
        state.history.unshift({
            id: Date.now().toString(),
            type: "exit",
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            date: new Date().toISOString(),
            user: "Administrador",
            note: "Venda" // Motivo padrão para saída rápida
        });
    
        // Atualizar UI e salvar
        renderProductsTable();
        renderHistoryItems();
        saveProducts();
        saveHistory();
        showToast(`Saída de ${quantity} unidades de ${product.name} registrada!`);
    };
    // Mostrar toast
    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    };
    
   // Inicializar a aplicação
const init = () => {
    // INICIALIZAÇÃO CORRETA DO ESTADO
    state.products = JSON.parse(localStorage.getItem('stockwave_products')) || [];
    state.categories = JSON.parse(localStorage.getItem('stockwave_categories')) || 
    [];

    state.history = JSON.parse(localStorage.getItem('stockwave_history')) || [];
    
    renderProductsTable();
    renderHistoryItems();
    renderCategoryOptions();
    updateStatsCards();
    
        
        // Event listeners para modais
        document.querySelectorAll('.close-modal, #cancelProductBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.productModal.classList.remove('active');
                DOM.movementModal.classList.remove('active');
                DOM.categoryModal.classList.remove('active');
            });
        });
        
        document.querySelectorAll('#cancelMovementBtn, #closeCategoryModalBtn').forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.movementModal.classList.remove('active');
                DOM.categoryModal.classList.remove('active');
            });
        });

        // Event listeners para abrir modais
        document.getElementById('entryBtn').addEventListener('click', () => openMovementModal('entry'));
        document.getElementById('exitBtn').addEventListener('click', () => openMovementModal('exit'));
        document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
        document.getElementById('manageCategoriesBtn').addEventListener('click', openCategoryModal);

        // Botões de salvar
        document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
        document.getElementById('saveMovementBtn').addEventListener('click', saveMovement);
        document.getElementById('addCategoryBtn').addEventListener('click', addCategory);

        // Botões de filtro de histórico
        DOM.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderHistoryItems(btn.dataset.filter);
            });
        });

        // Evento para seleção de motivo de perda
        document.getElementById('movementReason').addEventListener('change', function() {
            const lossGroup = document.getElementById('lossDescriptionGroup');
            lossGroup.style.display = this.value === 'Perda' ? 'block' : 'none';
            if (this.value === 'Perda') {
                document.getElementById('lossDescription').required = true;
            } else {
                document.getElementById('lossDescription').required = false;
            }
        });

        // Alternar visibilidade do valor total - CORREÇÃO
        const toggleBtn = document.getElementById('toggleVisibility');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                state.isValueVisible = !state.isValueVisible;
                updateStatsCards();
            });
        }
        
        // Pesquisa
        DOM.searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value;
            state.currentPage = 1; // Resetar para a primeira página
            renderProductsTable();
        });
        
        // Paginação
        DOM.prevPageBtn.addEventListener('click', () => {
            if (state.currentPage > 1) {
                state.currentPage--;
                renderProductsTable();
            }
        });
        
        DOM.nextPageBtn.addEventListener('click', () => {
            const totalPages = getTotalPages();
            if (state.currentPage < totalPages) {
                state.currentPage++;
                renderProductsTable();
            }
        });
        
        // Botão de atualizar
        DOM.refreshBtn.addEventListener('click', () => {
            renderProductsTable();
            renderHistoryItems();
            updateStatsCards();
            showToast('Dados atualizados com sucesso!');
        });
           // Event listeners para fechar modais
document.querySelectorAll('.close-modal, #cancelProductBtn, #closeHistoryDetailModalBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        DOM.productModal.classList.remove('active');
        DOM.movementModal.classList.remove('active');
        DOM.categoryModal.classList.remove('active');
        document.getElementById('historyDetailModal').classList.remove('active');
    });
});
    };
    
    
    // Retornar métodos públicos
    return {
        init
    };
})();

// ================== PÁGINA DE PRODUTOS (produtos.html) ==================
function initProdutos() {
    products = JSON.parse(localStorage.getItem('stockwave_products')) || [];
    categories = JSON.parse(localStorage.getItem('stockwave_categories')) || 
                 JSON.parse(localStorage.getItem('estoque_categorias')) || [];


    // DOM Elements
    const productsTable = document.getElementById('productsTable');
    const productModal = document.getElementById('productModal');
    const productDetailModal = document.getElementById('productDetailModal');
    const categoryFilter = document.getElementById('categoryFilter');
    const productCategorySelect = document.getElementById('productCategory');
    const modalProductTitle = document.getElementById('modalProductTitle');
    let currentFilteredProducts = [...products];

    // Format date for display
    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

   // Render products table
   function renderProductsTable(productsToRender = products) {
    productsTable.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 30px; color: var(--text-light);">
                    <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                    <p>Nenhum produto encontrado.</p>
                </td>
            </tr>
        `;
        return;
    }
    productsToRender.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="product-cell">
                    <div class="product-image">
                        <i class="fas ${categoryIcons[product.category] || 'fa-box'}"></i>
                    </div>
                    <div class="product-info">
                        <div class="product-name">${product.name}</div>
                        <div class="product-code">${product.code}</div>
                    </div>
                </div>
            </td>
            <td>${product.category}</td>
            <td>${formatDate(product.lastUpdate)}</td>
            <td class="action-cell">
                <button class="action-btn view" data-id="${product.id}">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        productsTable.appendChild(row);
    });
        // Add event listeners to action buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => openProductDetailModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
    }

    // Render category options in selects
    function renderCategoryOptions() {
        productCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        categoryFilter.innerHTML = '<option value="">Todas categorias</option>';
        
        categories.forEach(category => {
            const option1 = document.createElement('option');
            option1.value = category;
            option1.textContent = category;
            productCategorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = category;
            option2.textContent = category;
            categoryFilter.appendChild(option2);
        });
    }

    // Open add product modal
    function openAddProductModal() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        modalProductTitle.textContent = 'Adicionar Novo Produto';
        renderCategoryOptions();
        productModal.classList.add('active');
    }

    // Open edit product modal
   // Open edit product modal
   function openEditProductModal(productId) {
    const product = products.find(p => p.id == productId);
    if (product) {
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productCode').value = product.code;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productId').value = product.id;
        
        renderCategoryOptions();
        modalProductTitle.textContent = 'Editar Produto';
        productModal.classList.add('active');
    }
}
    // Open product detail modal
    function openProductDetailModal(productId) {
        const product = products.find(p => p.id == productId);
        if (product) {
            document.getElementById('detailName').textContent = product.name;
            document.getElementById('detailCode').textContent = product.code;
            document.getElementById('detailCategory').textContent = product.category;
            document.getElementById('detailLastUpdate').textContent = formatDate(product.lastUpdate);
            document.getElementById('detailDescription').textContent = product.description || 'Nenhuma descrição fornecida';
            // Set edit button
            document.getElementById('editProductBtn').onclick = () => {
                productDetailModal.classList.remove('active');
                openEditProductModal(productId);
            };
            
            productDetailModal.classList.add('active');
        }
    }

    // Save product
    function saveProduct() {
        const productId = document.getElementById('productId').value;
        const productData = {
            id: productId || Date.now().toString(),
            name: document.getElementById('productName').value,
            category: document.getElementById('productCategory').value,
            code: document.getElementById('productCode').value,
            description: document.getElementById('productDescription').value,
            lastUpdate: new Date().toISOString(),
            // Campos padrão para compatibilidade
            quantity: 0,
            price: 0.00,
            minStock: 0,
            dailyConsumption: 0,
            status: 'in-stock'
        };
        
        if (!productData.name || !productData.category || !productData.code) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        if (productId) {
            const index = products.findIndex(p => p.id == productId);
            if (index !== -1) {
                products[index] = { ...products[index], ...productData };
            }
        } else {
            products.push(productData);
        }
        
        currentFilteredProducts = [...products];
        renderProductsTable(currentFilteredProducts);
        
        // Salvar apenas na chave principal
        localStorage.setItem('stockwave_products', JSON.stringify(products));
        
        productModal.classList.remove('active');
        showToast(`Produto ${productId ? 'atualizado' : 'adicionado'} com sucesso!`);
    }

    // Delete product
     // Delete product - FUNÇÃO CORRIGIDA
     function deleteProduct(productId) {
        const product = products.find(p => p.id == productId);
        if (product && confirm(`Tem certeza que deseja excluir "${product.name}" do estoque?`)) {
            products = products.filter(p => p.id != productId);
            currentFilteredProducts = currentFilteredProducts.filter(p => p.id != productId);
            
            // Salvar apenas na chave principal
            localStorage.setItem('stockwave_products', JSON.stringify(products));
            
            renderProductsTable(currentFilteredProducts);
            showToast(`"${product.name}" foi excluído com sucesso.`);
        }
    }

    // Apply filters
    function applyFilters() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        currentFilteredProducts = [...products];
        
        // Apply search filter
        if (searchTerm) {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.code.toLowerCase().includes(searchTerm)
            );
        }
        
        // Apply category filter
        if (category) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.category === category);
        }
        
        // Apply sorting
        switch(sortBy) {
            case 'name-asc':
                currentFilteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                currentFilteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'quantity-asc':
                currentFilteredProducts.sort((a, b) => a.quantity - b.quantity);
                break;
            case 'quantity-desc':
                currentFilteredProducts.sort((a, b) => b.quantity - a.quantity);
                break;
            case 'price-asc':
                currentFilteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                currentFilteredProducts.sort((a, b) => b.price - a.price);
                break;
        }
        
        renderProductsTable(currentFilteredProducts);
    }

    // Initialize the page
    renderProductsTable();
    renderCategoryOptions();
    
    // Event listeners for modals
    document.querySelectorAll('.close-modal, #cancelProductBtn, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            productModal.classList.remove('active');
            productDetailModal.classList.remove('active');
        });
    });
    
    // Buttons for opening modals
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
    
    // Save button
    document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
    
    // Filter buttons
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchProduct').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sortBy').value = 'name-asc';
        currentFilteredProducts = [...products];
        renderProductsTable();
    });
    // Exportar produtos para PDF
    function exportToExcel() {
        if (products.length === 0) {
            alert('Não há produtos para exportar!');
            return;
        }
    
        const dados = products.map(product => ({
            "Nome": product.name,
            "Código": product.code,
            "Categoria": product.category,
            "Quantidade": product.quantity,
            "Preço Unitário (R$)": product.price.toFixed(2),
            "Valor Total (R$)": (product.quantity * product.price).toFixed(2),
            "Status": product.status,
            "Última Atualização": new Date(product.lastUpdate).toLocaleString('pt-BR'),
            "Descrição": product.description || ''
        }));
    
        exportarParaExcel(dados, "Produtos", "relatorio_produtos.xlsx");
    }
    

// Função global para formatar data (reutilizável)
function formatDateGlobal(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
    // Export button
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    function showToast(message, type = 'success') {
        // Verifica se já existe um toast container
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            // Cria o container se não existir
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '10000';
            document.body.appendChild(toastContainer);
        }
        
        // Cria o elemento toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        // Mostra o toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        // Remove após 3 segundos
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}
// ================== PÁGINA DE ESTOQUE (estoque.html) ==================
// ================== PÁGINA DE ESTOQUE (estoque.html) ==================
function initEstoque() {
    // Carregar produtos e categorias do localStorage
    products = JSON.parse(localStorage.getItem('stockwave_products')) || [];
    categories = JSON.parse(localStorage.getItem('stockwave_categories')) || [];
    history = JSON.parse(localStorage.getItem('stockwave_history')) || [];

    // Elementos DOM
    const estoqueTable = document.getElementById('estoqueTable');
    const movementModal = document.getElementById('movementModal');
    const productDetailModal = document.getElementById('productDetailModal');
    const movementProductSelect = document.getElementById('movementProduct');
    const categoryFilter = document.getElementById('categoryFilter');
    const modalMovementTitle = document.getElementById('modalMovementTitle');
    let currentFilteredProducts = [...products];

    // Funções auxiliares
    function formatDateTime(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

    function formatDateGlobal(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('pt-BR');
    }

    function updateProductStatus(product) {
        if (product.quantity <= 0) {
            product.status = 'out-of-stock';
        } 
        else if (product.dailyConsumption > 0 && product.quantity <= product.dailyConsumption) {
            product.status = 'critical-stock';
        } 
        else if (product.dailyConsumption > 0 && product.quantity <= (product.dailyConsumption * 5)) {
            product.status = 'low-stock';
        } 
        else if (product.minStock > 0 && product.quantity <= product.minStock) {
            product.status = 'low-stock';
        }
        else {
            product.status = 'in-stock';
        }
    }

    // Função para fechar todos os modais
    function closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Renderizar tabela de estoque
    function renderEstoqueTable(productsToRender = products) {
        estoqueTable.innerHTML = '';
        
        if (productsToRender.length === 0) {
            estoqueTable.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 30px; color: var(--text-light);">
                        <i class="fas fa-box-open" style="font-size: 2rem; margin-bottom: 10px;"></i>
                        <p>Nenhum produto encontrado.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        productsToRender.forEach(product => {
            updateProductStatus(product);
            
            const statusText = product.status === 'in-stock' ? 'Em Estoque' : 
                              product.status === 'low-stock' ? 'Baixo Estoque' : 
                              product.status === 'critical-stock' ? 'Estoque Crítico' : 
                              'Sem Estoque';
            
            const statusClass = `status ${product.status}`;
            const totalValue = product.quantity * product.price;
            
            const row = document.createElement('tr');
            if (product.status === 'low-stock') {
                row.classList.add('low-stock-warning');
            } else if (product.status === 'critical-stock') {
                row.classList.add('critical-stock-alert');
            } else if (product.status === 'out-of-stock') {
                row.classList.add('no-stock-alert');
            }
            
            row.innerHTML = `
                <td>
                    <div class="product-cell">
                        <div class="product-image">
                            <i class="fas ${categoryIcons[product.category] || 'fa-box'}"></i>
                        </div>
                        <div class="product-info">
                            <div class="product-name">${product.name}</div>
                            <div class="product-code">${product.code}</div>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>R$ ${product.price.toFixed(2)}</td>
                <td>R$ ${totalValue.toFixed(2)}</td>
                <td><span class="${statusClass}">${statusText}</span></td>
                <td>${formatDateTime(product.lastUpdate)}</td>
                <td class="action-cell">
                   
                    <button class="action-btn edit" data-id="${product.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            `;
            estoqueTable.appendChild(row);
        });
        
        // Adicionar event listeners aos botões de ação
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => openProductDetailModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
        });
        
    }

    // Renderizar opções de produto no modal de movimento
    function renderProductOptions() {
        movementProductSelect.innerHTML = '<option value="">Selecione um produto</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            movementProductSelect.appendChild(option);
        });
    }

    // Renderizar opções de categoria no filtro
    // SUBSTITUA A FUNÇÃO renderCategoryOptions DENTRO DE initEstoque() POR ESTA:
    
    function renderCategoryOptions() {
        // 1. Preenche o Filtro da página principal
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Todas categorias</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                categoryFilter.appendChild(option);
            });
        }

        // 2. Preenche o Select dentro do Modal de Editar (A CORREÇÃO ESTÁ AQUI)
        const modalCategorySelect = document.getElementById('productCategory');
        if (modalCategorySelect) {
            modalCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                modalCategorySelect.appendChild(option);
            });
        }
    }

    // Abrir modal de movimento (entrada/saída)
    function openMovementModal(type) {
        document.getElementById('movementType').value = type;
        modalMovementTitle.textContent = type === 'entry' ? 
            'Registrar Entrada de Produto' : 'Registrar Saída de Produto';
        
        // Mostrar/ocultar campos conforme o tipo
        document.getElementById('priceGroup').style.display = type === 'entry' ? 'block' : 'none';
        document.getElementById('reasonGroup').style.display = type === 'exit' ? 'block' : 'none';
        document.getElementById('lossDescriptionGroup').style.display = 'none';
        
        // Resetar formulário
        document.getElementById('movementForm').reset();
        renderProductOptions();
        movementModal.classList.add('active');
    }

    // Abrir modal de detalhes do produto
    function openProductDetailModal(productId) {
        const product = products.find(p => p.id == productId);
        if (product) {
            // Filtrar histórico de entradas para este produto
            const entries = history.filter(item => 
                item.type === 'entry' && item.productId === productId
            );
            
            document.getElementById('detailName').textContent = product.name;
            document.getElementById('detailCode').textContent = product.code;
            document.getElementById('detailCategory').textContent = product.category;
            document.getElementById('detailQuantity').textContent = product.quantity;
            document.getElementById('detailPrice').textContent = `R$ ${product.price.toFixed(2)}`;
            document.getElementById('detailTotalValue').textContent = `R$ ${(product.quantity * product.price).toFixed(2)}`;
            
            // Preencher tabela de entradas
            const batchesTable = document.getElementById('batchesTable');
            batchesTable.innerHTML = '';
            
            if (entries.length === 0) {
                batchesTable.innerHTML = `
                    <tr>
                        <td colspan="5" style="text-align: center; padding: 10px; color: var(--text-light);">
                            Nenhuma entrada registrada
                        </td>
                    </tr>
                `;
            } else {
                entries.forEach(entry => {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${formatDateTime(entry.date)}</td>
                        <td>${entry.quantity}</td>
                        <td>R$ ${entry.price.toFixed(2)}</td>
                        <td>R$ ${(entry.quantity * entry.price).toFixed(2)}</td>
                        <td>${entry.note || 'N/A'}</td>
                    `;
                    batchesTable.appendChild(row);
                });
            }
            
            // Configurar botão de edição
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Produto';
            editBtn.onclick = () => {
                closeAllModals();
                openEditProductModal(productId);
            };
            
            // Limpar e adicionar botão ao footer do modal
            const modalFooter = document.querySelector('#productDetailModal .modal-footer');
            modalFooter.innerHTML = '';
            modalFooter.appendChild(editBtn);
            
            productDetailModal.classList.add('active');
        }
    }

    // Abrir modal de edição de produto
    function openEditProductModal(productId) {
        const product = products.find(p => p.id == productId);
        if (product) {
            document.getElementById('productName').value = product.name;
            document.getElementById('productCategory').value = product.category;
            document.getElementById('productCode').value = product.code;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productMinStock').value = product.minStock;
            document.getElementById('productDailyConsumption').value = product.dailyConsumption;
            document.getElementById('productDescription').value = product.description || '';
            document.getElementById('productId').value = product.id;
            
            document.getElementById('modalProductTitle').textContent = 'Editar Produto';
            document.getElementById('productModal').classList.add('active');
        }
    }

    // Salvar movimento (entrada/saída)
    function saveMovement() {
        const productId = document.getElementById('movementProduct').value;
        const quantity = parseInt(document.getElementById('movementQuantity').value) || 0;
        const price = parseFloat(document.getElementById('movementPrice').value) || 0;
        const reason = document.getElementById('movementReason').value;
        const note = document.getElementById('movementNote').value;
        const type = document.getElementById('movementType').value;
        
        if (!productId || !quantity || quantity <= 0) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const now = new Date().toISOString();
        let movementNote = '';
        
        if (type === 'entry') {
            // Calcular novo preço médio
            const totalValue = (product.quantity * product.price) + (quantity * price);
            const totalQuantity = product.quantity + quantity;
            product.price = totalValue / totalQuantity;
            product.quantity += quantity;
            
            movementNote = `Entrada: ${reason}${note ? ' - ' + note : ''}`;
        } else if (type === 'exit') {
            if (product.quantity < quantity) {
                showToast('Quantidade em estoque insuficiente!', 'error');
                return;
            }
            
            product.quantity -= quantity;
            
            if (reason === 'Perda') {
                const lossDescription = document.getElementById('lossDescription').value;
                movementNote = `Saída: Perda - ${lossDescription}`;
            } else {
                movementNote = `Saída: ${reason}${note ? ' - ' + note : ''}`;
            }
        }
        
        // Atualizar status e data
        updateProductStatus(product);
        product.lastUpdate = now;
        
        // Registrar no histórico
        history.unshift({
            id: Date.now().toString(),
            type: type,
            productId: product.id,
            productName: product.name,
            quantity: quantity,
            price: price,
            date: now,
            user: "Administrador",
            note: movementNote
        });
        
        // Atualizar dados
        localStorage.setItem('stockwave_products', JSON.stringify(products));
        localStorage.setItem('stockwave_history', JSON.stringify(history));
        
        // Atualizar UI
        renderEstoqueTable();
        closeAllModals();
        showToast(`Movimentação de ${type === 'entry' ? 'entrada' : 'saída'} registrada com sucesso!`);
    }

    // Aplicar filtros
    function applyFilters() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        currentFilteredProducts = [...products];
        
        // Aplicar filtro de pesquisa
        if (searchTerm) {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.code.toLowerCase().includes(searchTerm)
            );
        }
        
        // Aplicar filtro de categoria
        if (category) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.category === category);
        }
        
        // Aplicar filtro de status
        if (status) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.status === status);
        }
        
        // Aplicar ordenação
        switch(sortBy) {
            case 'name-asc':
                currentFilteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                currentFilteredProducts.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'quantity-asc':
                currentFilteredProducts.sort((a, b) => a.quantity - b.quantity);
                break;
            case 'quantity-desc':
                currentFilteredProducts.sort((a, b) => b.quantity - a.quantity);
                break;
        }
        
        renderEstoqueTable(currentFilteredProducts);
    }

    // Exportar para PDF
    function exportToExcel() {
        if (products.length === 0) {
            alert('Não há produtos para exportar!');
            return;
        }
    
        const dados = products.map(product => ({
            "Produto": product.name,
            "Categoria": product.category,
            "Quantidade": product.quantity,
            "Preço Unitário (R$)": product.price.toFixed(2),
            "Valor Total (R$)": (product.quantity * product.price).toFixed(2),
            "Status": product.status,
            "Última Atualização": new Date(product.lastUpdate).toLocaleString('pt-BR')
        }));
    
        exportarParaExcel(dados, "Estoque", "relatorio_estoque.xlsx");
    }
    

    // Inicialização da página
    renderEstoqueTable();
    renderCategoryOptions();
    renderProductOptions();
    
    // Event listeners
    document.getElementById('entryBtn').addEventListener('click', () => openMovementModal('entry'));
    document.getElementById('exitBtn').addEventListener('click', () => openMovementModal('exit'));
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchProduct').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sortBy').value = 'name-asc';
        currentFilteredProducts = [...products];
        renderEstoqueTable();
    });
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);

    document.getElementById('saveMovementBtn').addEventListener('click', saveMovement);
    
    // Event listener para motivo de perda
    document.getElementById('movementReason').addEventListener('change', function() {
        const lossGroup = document.getElementById('lossDescriptionGroup');
        lossGroup.style.display = this.value === 'Perda' ? 'block' : 'none';
    });
    
    // Event listeners para fechar modais
    document.querySelectorAll('.close-modal, #cancelMovementBtn, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });

    // Fechar modal ao clicar fora do conteúdo
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });
    // ... dentro de initEstoque() ...

    // 1. FUNÇÃO PARA SALVAR A EDIÇÃO DO PRODUTO
    function saveProductEdit() {
        const productId = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const category = document.getElementById('productCategory').value;
        const code = document.getElementById('productCode').value;
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const minStock = parseInt(document.getElementById('productMinStock').value) || 0;
        const dailyConsumption = parseInt(document.getElementById('productDailyConsumption').value) || 0;
        const description = document.getElementById('productDescription').value;

        if (!productId || !name || !code) {
            showToast('Preencha os campos obrigatórios!', 'error');
            return;
        }

        // Encontrar e atualizar o produto
        const index = products.findIndex(p => p.id == productId);
        if (index !== -1) {
            products[index] = {
                ...products[index],
                name,
                category,
                code,
                price,
                minStock,
                dailyConsumption,
                description,
                lastUpdate: new Date().toISOString() // Atualiza data
            };
            
            // Recalcular status após edição (caso tenha mudado consumo ou estoque min)
            updateProductStatus(products[index]);

            // Salvar no LocalStorage
            localStorage.setItem('stockwave_products', JSON.stringify(products));

            // Atualizar Tabela e Fechar Modal
            renderEstoqueTable();
            document.getElementById('productModal').classList.remove('active');
            showToast('Produto atualizado com sucesso!');
        }
    }

    // 2. ADICIONAR OS LISTENERS (EVENTOS DE CLIQUE)
    // Coloque isso junto com os outros event listeners no final da função initEstoque
    
    // Botão Salvar do Modal de Edição
    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProductEdit);
    }

    // Botão Cancelar do Modal de Edição
    const cancelProductBtn = document.getElementById('cancelProductBtn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
             document.getElementById('productModal').classList.remove('active');
        });
    }

    // Botão X do Modal de Edição
    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
             document.getElementById('productModal').classList.remove('active');
        });
    }
}

// ================== PÁGINA DE HISTÓRICO (historico.html) ==================
function initHistorico() {
    // Carregar histórico do localStorage
    history = JSON.parse(localStorage.getItem('stockwave_history')) || [];
    products = JSON.parse(localStorage.getItem('stockwave_products')) || [];

    // DOM Elements
    const historyTable = document.getElementById('historyTable');
    const movementDetailModal = document.getElementById('movementDetailModal');
    const productFilter = document.getElementById('productFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    // CORREÇÃO: Delegação de eventos correta para botões de detalhes
    historyTable.addEventListener('click', function(e) {
        const btn = e.target.closest('.detail-btn');
        if (btn) {
            const movementId = btn.dataset.id;
            openMovementDetailModal(movementId);
        }
    });

    // Função para filtrar o histórico
    function getFilteredHistory() {
        const type = document.getElementById('movementType').value;
        const productId = document.getElementById('productFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        return history.filter(item => {
            // Filtro por tipo
            if (type && item.type !== type) return false;
            
            // Filtro por produto
            if (productId && item.productId !== productId) return false;
            
            // Filtro por data
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            
            return true;
        });
    }

    // Render history table
    function renderHistoryTable(historyData = history) {
        historyTable.innerHTML = '';
        
        if (historyData.length === 0) {
            historyTable.innerHTML = `
                <tr>
                    <td colspan="5" class="empty-state">
                        <i class="fas fa-history"></i>
                        <h3>Nenhuma movimentação registrada</h3>
                        <p>Quando você realizar movimentações de estoque, elas aparecerão aqui.</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        historyData.forEach(item => {
            const dateTime = formatDateTime(item.date);
            const product = products.find(p => p.id == item.productId);
            const productName = product ? product.name : "Produto excluído";
            const productCode = product ? product.code : "N/A";
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dateTime}</td>
                <td>
                    <span class="movement-type ${item.type}">
                        ${item.type === 'entry' ? 'Entrada' : item.type === 'exit' ? 'Saída' : 'Exclusão'}
                    </span>
                </td>
                <td>
                    <div class="product-info">
                        <div class="product-name">${productName}</div>
                        <div class="product-code">${productCode}</div>
                    </div>
                </td>
                <td>
                    <span class="movement-quantity ${item.type === 'entry' ? 'positive' : 'negative'}">
                        ${item.type === 'entry' ? '+' : item.type === 'exit' ? '-' : ''}${item.quantity}
                    </span>
                </td>
                <td>
                    <button class="detail-btn" data-id="${item.id}">
                        <i class="fas fa-eye"></i> Ver detalhes
                    </button>
                </td>
            `;
            historyTable.appendChild(row);
        });
        
        // REMOVIDO: Não é mais necessário adicionar event listeners aqui
    }
    
    // Render product options in filter
    function renderProductOptions() {
        productFilter.innerHTML = '<option value="">Todos os produtos</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            productFilter.appendChild(option);
        });
    }
    
    // Open movement detail modal
    function openMovementDetailModal(movementId) {
        const movement = history.find(m => m.id == movementId);
        if (movement) {
            const dateTime = formatDateTime(movement.date);
            const product = products.find(p => p.id == movement.productId);
            const productName = product ? `${product.name} (${product.code})` : "Produto excluído";
            
            document.getElementById('detailDateTime').textContent = dateTime;
            document.getElementById('detailType').textContent = movement.type === 'entry' ? 'Entrada' : movement.type === 'exit' ? 'Saída' : 'Exclusão';
            document.getElementById('detailType').className = `detail-value type ${movement.type}`;
            document.getElementById('detailProduct').textContent = productName;
            document.getElementById('detailQuantity').textContent = `${movement.type === 'entry' ? '+' : movement.type === 'exit' ? '-' : ''}${movement.quantity}`;
            document.getElementById('detailDescription').textContent = movement.note;
            
            movementDetailModal.classList.add('active');
        }
    }
    
    // Apply filters
    function applyFilters() {
        const filteredHistory = getFilteredHistory();
        renderHistoryTable(filteredHistory);
    }
    
    // Clear filters
    function clearFilters() {
        document.getElementById('movementType').value = '';
        document.getElementById('productFilter').value = '';
        document.getElementById('startDate').value = '';
        document.getElementById('endDate').value = '';
        
        renderHistoryTable(); // Mostra todo o histórico
    }
    function exportToExcel() {
        if (history.length === 0) {
            alert('Não há histórico para exportar!');
            return;
        }
    
        const dados = history.map(item => ({
            "Produto": item.productName,
            "Tipo de Movimentação": item.type === "entry" ? "Entrada" : item.type === "exit" ? "Saída" : "Exclusão",
            "Quantidade": item.quantity,
            "Preço Unitário (R$)": item.price ? item.price.toFixed(2) : "-",
            "Data": new Date(item.date).toLocaleString('pt-BR'),
            "Usuário": item.user,
            "Observações": item.note || ""
        }));
    
        exportarParaExcel(dados, "Histórico", "relatorio_historico.xlsx");
    }
    exportBtn.addEventListener('click', exportToExcel);
    
    // Export history to PDF
    function exportHistory() {
        const filteredHistory = getFilteredHistory();
        
        if (filteredHistory.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }
    
        const wb = XLSX.utils.book_new();
        
        // Planilha 1: Histórico de movimentações
        const headers = ["Data/Hora", "Tipo", "Produto", "Quantidade", "Detalhes"];
        const rows = filteredHistory.map(item => {
            const dateTime = formatDateTime(item.date);
            const type = item.type === 'entry' ? 'Entrada' : item.type === 'exit' ? 'Saída' : 'Exclusão';
            const product = products.find(p => p.id == item.productId);
            const productName = product ? `${product.name} (${product.code})` : "Produto excluído";
            const quantity = `${item.type === 'entry' ? '+' : item.type === 'exit' ? '-' : ''}${item.quantity}`;
            return [dateTime, type, productName, quantity, item.note || ''];
        });
        
        rows.unshift(headers);
        
        const ws1 = XLSX.utils.aoa_to_sheet(rows);
        
        // Estilo para cabeçalhos
        const headerStyle = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "2C3E50" } }, // Azul escuro
            alignment: { horizontal: "center" },
            border: {
                top: { style: "thin", color: { rgb: "000000" } },
                bottom: { style: "thin", color: { rgb: "000000" } },
                left: { style: "thin", color: { rgb: "000000" } },
                right: { style: "thin", color: { rgb: "000000" } }
            }
        };
        
        // Aplicar estilo aos cabeçalhos
        for (let col = 0; col < headers.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws1[cellRef]) ws1[cellRef] = { t: 's', v: headers[col] };
            ws1[cellRef].s = headerStyle;
        }
        
        // Formatação condicional para tipos de movimento
        for (let i = 1; i < rows.length; i++) {
            const type = rows[i][1]; // Tipo de movimento
            
            // Formatar tipo
            const typeCell = `B${i+1}`;
            if (!ws1[typeCell]) ws1[typeCell] = { t: 's', v: type };
            
            if (type === 'Entrada') {
                ws1[typeCell].s = { 
                    font: { color: { rgb: "28A745" }, bold: true },
                    fill: { fgColor: { rgb: "D4EDDA" } } // Fundo verde claro
                };
                
                // Formatar quantidade (entrada)
                const qtyCell = `D${i+1}`;
                if (!ws1[qtyCell]) ws1[qtyCell] = { t: 's', v: rows[i][3] };
                ws1[qtyCell].s = { 
                    font: { color: { rgb: "28A745" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            } else if (type === 'Saída') {
                ws1[typeCell].s = { 
                    font: { color: { rgb: "DC3545" }, bold: true },
                    fill: { fgColor: { rgb: "F8D7DA" } } // Fundo vermelho claro
                };
                
                // Formatar quantidade (saída)
                const qtyCell = `D${i+1}`;
                if (!ws1[qtyCell]) ws1[qtyCell] = { t: 's', v: rows[i][3] };
                ws1[qtyCell].s = { 
                    font: { color: { rgb: "DC3545" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            }
            
            // Formatar data/hora
            const dateCell = `A${i+1}`;
            if (!ws1[dateCell]) ws1[dateCell] = { t: 's', v: rows[i][0] };
            ws1[dateCell].s = { alignment: { horizontal: "center" } };
        }
        
        // Ajustar largura das colunas
        const colWidths = [
            { wch: 20 }, // Data/Hora
            { wch: 12 }, // Tipo
            { wch: 30 }, // Produto
            { wch: 12 }, // Quantidade
            { wch: 40 }  // Detalhes
        ];
        
        ws1['!cols'] = colWidths;
        
        // Adicionar filtros
        ws1['!autofilter'] = { ref: `A1:E${rows.length}` };
        
        // Planilha 2: Resumo por produto
        const productSummary = {};
        filteredHistory.forEach(item => {
            if (!productSummary[item.productId]) {
                productSummary[item.productId] = {
                    name: products.find(p => p.id == item.productId)?.name || "Produto excluído",
                    entries: 0,
                    exits: 0
                };
            }
            
            if (item.type === 'entry') {
                productSummary[item.productId].entries += item.quantity;
            } else if (item.type === 'exit') {
                productSummary[item.productId].exits += item.quantity;
            }
        });
        
        const summaryHeaders = ["Produto", "Entradas", "Saídas", "Saldo"];
        const summaryRows = Object.values(productSummary).map(item => [
            item.name,
            item.entries,
            item.exits,
            item.entries - item.exits
        ]);
        
        summaryRows.unshift(summaryHeaders);
        const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
        
        // Aplicar estilo aos cabeçalhos da planilha 2
        for (let col = 0; col < summaryHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws2[cellRef]) ws2[cellRef] = { t: 's', v: summaryHeaders[col] };
            ws2[cellRef].s = headerStyle;
        }
        
        // Formatar saldo na planilha de resumo
        for (let i = 1; i < summaryRows.length; i++) {
            const saldo = summaryRows[i][3];
            const saldoCell = `D${i+1}`;
            
            if (!ws2[saldoCell]) ws2[saldoCell] = { t: 'n', v: saldo };
            
            if (saldo > 0) {
                ws2[saldoCell].s = { 
                    font: { color: { rgb: "28A745" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            } else if (saldo < 0) {
                ws2[saldoCell].s = { 
                    font: { color: { rgb: "DC3545" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            } else {
                ws2[saldoCell].s = { 
                    alignment: { horizontal: "center" }
                };
            }
        }
        
        // Ajustar largura das colunas da planilha 2
        ws2['!cols'] = [
            { wch: 30 }, // Produto
            { wch: 10 }, // Entradas
            { wch: 10 }, // Saídas
            { wch: 10 }  // Saldo
        ];
        
        // Adicionar ambas as planilhas ao arquivo
        XLSX.utils.book_append_sheet(wb, ws1, "Histórico");
        XLSX.utils.book_append_sheet(wb, ws2, "Resumo");
        
        XLSX.writeFile(wb, 'historico_movimentacoes.xlsx');
    }
    
    // Initialize the page
    renderHistoryTable();
    renderProductOptions();
    
    // Set today's date as default end date
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = today;
    
    // Set 30 days ago as default start date
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoFormatted = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('startDate').value = thirtyDaysAgoFormatted;
    
    // Event listeners for modals
    document.querySelectorAll('.close-modal, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            movementDetailModal.classList.remove('active');
        });
    });
    
    // Filter buttons
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    // Export button
    exportBtn.addEventListener('click', exportHistory);
}

// ================== PÁGINA DE CONFIGURAÇÕES (configuracoes.html) ==================
function initConfiguracoes() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    // Check for saved dark mode preference
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    // Dark mode switch event
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
    
    // Theme color selector
    const themeColor = document.getElementById('themeColor');
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Remove any existing theme classes
        document.body.classList.remove('theme-green', 'theme-purple', 'theme-red');
        
        // Apply saved theme if not default
        if (savedTheme !== 'default') {
            document.body.classList.add(savedTheme);
        }
        
        // Set the select value
        themeColor.value = savedTheme;
    }
    
    // Theme color change event
    themeColor.addEventListener('change', function() {
        // First remove all theme classes
        document.body.classList.remove('theme-green', 'theme-purple', 'theme-red');
        
        // If not default, add the selected theme class
        if (this.value !== 'default') {
            document.body.classList.add(this.value);
        }
        
        // Save to localStorage
        localStorage.setItem('theme', this.value);
    });
    
    // User info form
    document.getElementById('userInfoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const userName = document.getElementById('userName').value;
        const userEmail = document.getElementById('userEmail').value;
        
        // Validate and save
        if (userName && userEmail) {
            localStorage.setItem('userName', userName);
            localStorage.setItem('userEmail', userEmail);
            alert('Informações do usuário atualizadas com sucesso!');
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    });
    
    // Preencher formulário com dados salvos
    document.getElementById('userName').value = localStorage.getItem('userName') || '';
    document.getElementById('userEmail').value = localStorage.getItem('userEmail') || '';
    
    // Security form
    document.getElementById('securityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        // Validate
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        // In a real app, verify current password and update
        alert('Senha alterada com sucesso!');
        this.reset();
    });
    
    // Notifications toggles
    const emailNotifications = document.getElementById('emailNotifications');
    emailNotifications.checked = localStorage.getItem('emailNotifications') === 'true';
    emailNotifications.addEventListener('change', function() {
        localStorage.setItem('emailNotifications', this.checked);
        alert(`Notificações por e-mail ${this.checked ? 'ativadas' : 'desativadas'}`);
    });
    
    const lowStockAlerts = document.getElementById('lowStockAlerts');
    lowStockAlerts.checked = localStorage.getItem('lowStockAlerts') === 'true';
    lowStockAlerts.addEventListener('change', function() {
        localStorage.setItem('lowStockAlerts', this.checked);
        alert(`Alertas de baixo estoque ${this.checked ? 'ativados' : 'desativados'}`);
    });
    
    const movementAlerts = document.getElementById('movementAlerts');
    movementAlerts.checked = localStorage.getItem('movementAlerts') === 'true';
    movementAlerts.addEventListener('change', function() {
        localStorage.setItem('movementAlerts', this.checked);
        alert(`Notificações de movimentação ${this.checked ? 'ativadas' : 'desativadas'}`);
    });
    
    // Backup frequency
    const backupFrequency = document.getElementById('backupFrequency');
    backupFrequency.value = localStorage.getItem('backupFrequency') || 'diario';
    backupFrequency.addEventListener('change', function() {
        localStorage.setItem('backupFrequency', this.value);
        alert(`Frequência de backup alterada para: ${this.options[this.selectedIndex].text}`);
    });
    
    // Danger zone buttons
    document.getElementById('deleteAccountBtn').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.')) {
            alert('Conta marcada para exclusão. Um e-mail de confirmação foi enviado.');
        }
    });
    
    document.getElementById('clearDataBtn').addEventListener('click', function() {
        if (confirm('ATENÇÃO: Isso apagará TODOS os dados do sistema. Tem certeza que deseja continuar?')) {
            localStorage.removeItem('estoque_produtos');
            localStorage.removeItem('estoque_historico');
            localStorage.removeItem('estoque_categorias');
            alert('Todos os dados foram apagados com sucesso.');
        }
    });
}
// ===============================
// SISTEMA UNIFICADO DE TEMAS - CORRIGIDO
// ===============================

// Função para remover TODAS as classes de tema
function removeAllThemeClasses() {
    const body = document.body;
    // Remove todas as classes de tema possíveis
    body.classList.remove(
        'theme-default', 'theme-green', 'theme-purple', 'theme-red',
        'theme-pink', 'theme-yellow', 'theme-orange', 'theme-black', 'theme-gray',
        'dark-mode' // Também remove dark-mode para evitar conflitos
    );
}

// 1. Aplica tema salvo (modo e cor) no <body>
function applySavedTheme() {
    const body = document.body;
    
    // Primeiro remove todas as classes para começar do zero
    removeAllThemeClasses();
    
    // 1.1. Modo Escuro - CORREÇÃO: Aplicar separadamente
    const darkMode = localStorage.getItem('darkModeEnabled');
    if (darkMode === 'true') {
        body.classList.add('dark-mode');
    }
    
    // 1.2. Tema de Cor - CORREÇÃO: Aplicar apenas um tema
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    
    // Se não for default, aplica o tema específico
    if (savedTheme !== 'default') {
        body.classList.add(`theme-${savedTheme}`);
    }
    
    console.log('Tema aplicado:', { darkMode, savedTheme });
}

// 2. Inicializa os controles da página de Configurações
function initConfiguracoesPage() {
    const darkToggle = document.getElementById('darkModeToggle');
    const themeSelect = document.getElementById('themeColor');
    
    if (!darkToggle || !themeSelect) return;

    // 2.1. Estado inicial do toggle Dark Mode
    const darkMode = localStorage.getItem('darkModeEnabled');
    darkToggle.checked = (darkMode === 'true');

    // 2.2. Estado inicial do select de Tema
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    themeSelect.value = savedTheme;

    // 2.3. Ao mudar o toggle Dark Mode
    darkToggle.addEventListener('change', () => {
        if (darkToggle.checked) {
            localStorage.setItem('darkModeEnabled', 'true');
        } else {
            localStorage.setItem('darkModeEnabled', 'false');
        }
        // Reaplica todos os temas
        applySavedTheme();
    });

    // 2.4. Ao mudar o select de tema
    themeSelect.addEventListener('change', () => {
        const newTheme = themeSelect.value;
        localStorage.setItem('selectedTheme', newTheme);
        // Reaplica todos os temas
        applySavedTheme();
    });
}

// 3. Sistema de tema alternativo (remover se existir)
// ⚠️ REMOVA qualquer outro sistema de tema duplicado no seu código

// 4. Aplicar tema quando a página carrega
function applyThemeOnLoad() {
    applySavedTheme();
    
    // Inicializar controles apenas na página de configurações
    if (document.getElementById('darkModeToggle') && document.getElementById('themeColor')) {
        initConfiguracoesPage();
    }
}

// 5. Event listener principal
document.addEventListener('DOMContentLoaded', applyThemeOnLoad);

// 6. Função para forçar a reaplicação do tema (útil para debug)
function forceThemeRefresh() {
    console.log('Forçando atualização do tema...');
    applySavedTheme();
}

// ===============================
// SISTEMA DE BACKUP - Caso ainda tenha problemas
// ===============================

// Função alternativa mais agressiva para resolver conflitos
function applyThemeAggressive() {
    const body = document.body;
    
    // Remove absolutamente tudo
    body.className = '';
    
    // Aplica apenas o que está salvo
    const darkMode = localStorage.getItem('darkModeEnabled');
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    
    if (darkMode === 'true') {
        body.classList.add('dark-mode');
    }
    
    if (savedTheme !== 'default') {
        body.classList.add(`theme-${savedTheme}`);
    }
    
    console.log('Tema aplicado (agressivo):', { darkMode, savedTheme });
}

// Use esta função se ainda tiver problemas:
// applyThemeAggressive();
 /* ============================================
         LOGIN AUTH (GOOGLE + EMAIL)
=============================================== */

// Proteção das páginas (qualquer página menos login)
if (!window.location.pathname.includes("login.html")) {
    firebase.auth().onAuthStateChanged(user => {
        if (!user) window.location.href = "login.html";
    });
}

// LOGIN EMAIL/SENHA
function initEmailLogin() {
    const form = document.getElementById("emailLoginForm");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = document.getElementById("emailInput").value;
        const password = document.getElementById("passwordInput").value;

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            window.location.href = "index.html";
        } catch (err) {
            alert("Erro: " + err.message);
        }
    });
}

// LOGIN GOOGLE
function initGoogleLogin() {
    const btn = document.getElementById("googleLoginBtn");
    if (!btn) return;

    btn.addEventListener("click", async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebase.auth().signInWithPopup(provider);
            window.location.href = "index.html";
        } catch (err) {
            alert("Erro no login Google: " + err.message);
        }
    });
}

// Inicialização
document.addEventListener("DOMContentLoaded", () => {
    initEmailLogin();
    initGoogleLogin();
});


