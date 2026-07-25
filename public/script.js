let products = [];
let history = [];
let categories = [];

document.addEventListener("DOMContentLoaded", async () => {
    applyThemeOnLoad();
    
    initModals();
});

async function loadData() {
    try {
        products = await appIntegration.loadProducts();
        categories = await appIntegration.loadCategories();
        history = await appIntegration.loadHistory();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        products = JSON.parse(localStorage.getItem('stockwave_products')) || [];
        categories = JSON.parse(localStorage.getItem('stockwave_categories')) || [];
        history = JSON.parse(localStorage.getItem('stockwave_history')) || [];
    }
}

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

function formatDateTime(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}

function highlightActiveLink() {
    const path = window.location.pathname;
    let currentPage = path.split("/").pop();
    
    
    if (currentPage === "") {
        currentPage = "index.html"; 
    }
    
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        let linkPage = linkHref;
        
        if (linkPage.startsWith('./')) {
            linkPage = linkPage.substring(2);
        }
        
        const isActive = currentPage === linkPage;
        
        link.classList.toggle('active', isActive);
        
        if (isActive) {
        }
    });
}
function exportarParaExcel(dados, nomePlanilha = "Relatório", nomeArquivo = "relatorio.xlsx") {
    if (!dados || dados.length === 0) {
        alert("Nenhum dado encontrado para exportar!");
        return;
    }

    const wb = XLSX.utils.book_new();

    const ws = XLSX.utils.json_to_sheet(dados);

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

window.addEventListener('DOMContentLoaded', highlightActiveLink);

const StockWaveApp = (() => { 
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
    
    
    const calculateTotalValue = () => {
        return state.products.reduce((total, product) => {
            return total + (product.quantity * product.price);
        }, 0);
    };
    
    const calculateLowStockItems = () => {
        return state.products.filter(product => 
            product.status === 'low-stock' || 
            product.status === 'critical-stock'
        ).length;
    };
    
    const updateProductStatus = (product) => {
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
    };
    
    const filterProducts = () => {
        if (!state.searchTerm) return state.products;
        
        const term = state.searchTerm.toLowerCase();
        return state.products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term) ||
            product.code.toLowerCase().includes(term)
        );
    };
    
    const getPaginatedProducts = () => {
        const filtered = filterProducts();
        const startIndex = (state.currentPage - 1) * state.itemsPerPage;
        const endIndex = startIndex + state.itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    };
    
    const getTotalPages = () => {
        const filtered = filterProducts();
        return Math.ceil(filtered.length / state.itemsPerPage);
    };
    
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
        
        updatePaginationControls();
        
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteProduct(btn.dataset.id));
        });
        
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
        
        updateStatsCards();
    };
    
    const updatePaginationControls = () => {
        const totalPages = getTotalPages();
        
        DOM.pageInfo.textContent = `Página ${state.currentPage} de ${totalPages}`;
        
        DOM.prevPageBtn.disabled = state.currentPage === 1;
        DOM.nextPageBtn.disabled = state.currentPage === totalPages || totalPages === 0;
    };
    
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
    
    const renderCategoryList = () => {
        DOM.categoryList.innerHTML = '';
        state.categories.forEach((category, index) => {
            const categoryName = typeof category === 'object' ? category.nome : category;
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <span>${categoryName}</span>
                <div class="category-actions">
                    <button class="category-btn delete" data-index="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            DOM.categoryList.appendChild(categoryItem);
        });
        
        document.querySelectorAll('.category-btn.delete').forEach(btn => {
            btn.addEventListener('click', () => deleteCategory(btn.dataset.index));
        });
    };
    
    const renderCategoryOptions = () => {
        DOM.productCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        state.categories.forEach(category => {
            const option = document.createElement('option');
            // Suporta ambos os formatos: {id, nome} ou apenas string
            option.value = typeof category === 'object' ? category.id : category;
            option.textContent = typeof category === 'object' ? category.nome : category;
            DOM.productCategorySelect.appendChild(option);
        });
    };
    
    const openAddProductModal = () => {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        DOM.modalProductTitle.textContent = 'Adicionar Novo Produto';
        renderCategoryOptions();
        DOM.productModal.classList.add('active');
    };
    
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
    
    const openMovementModal = (type) => {
        DOM.movementTypeInput.value = type;
        
        DOM.modalMovementTitle.textContent = type === 'entry' ? 
            'Registrar Entrada de Produto' : 'Registrar Saída de Produto';
        
        DOM.movementProductSelect.innerHTML = '';
        state.products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            DOM.movementProductSelect.appendChild(option);
        });
        
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0,5);
        
        document.getElementById('movementDate').value = today;
        document.getElementById('movementTime').value = time;
        
        document.getElementById('entryNoteGroup').style.display = type === 'entry' ? 'block' : 'none';
        document.getElementById('exitReasonGroup').style.display = type === 'exit' ? 'block' : 'none';
        
        document.getElementById('movementQuantity').value = '';
        document.getElementById('movementNote').value = '';
        document.getElementById('movementReason').value = '';
        document.getElementById('lossDescription').value = '';
        document.getElementById('lossDescriptionGroup').style.display = 'none';
        
        DOM.movementModal.classList.add('active');
    };
    
    const openCategoryModal = () => {
        renderCategoryList();
        DOM.categoryModal.classList.add('active');
    };
    
    const saveProduct = async (e) => {
        if (e) e.preventDefault();
        
        const productId = document.getElementById('productId').value;
        const categoryId = document.getElementById('productCategory').value;
        const categoryName = document.querySelector(`#productCategory option[value="${categoryId}"]`)?.textContent || '';
        
        const productData = {
            id: productId || null,
            name: document.getElementById('productName').value,
            category: categoryName,
            categoryId: parseInt(categoryId) || null,
            code: document.getElementById('productCode').value,
            description: document.getElementById('productDescription').value,
            quantity: parseFloat(document.getElementById('productQuantity').value) || 0,
            minStock: parseFloat(document.getElementById('productMinStock').value) || 0,
            price: parseFloat(document.getElementById('productPrice').value) || 0,
            dailyConsumption: parseInt(document.getElementById('productDailyConsumption').value) || 0
        };
        
        if (!productData.name || !categoryId || !productData.code) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        try {
            const success = await appIntegration.saveProduct(productData);
            if (success) {
                await loadData();
                state.products = products;
                state.categories = categories;
                renderProductsTable();
                updateStatsCards();
                DOM.productModal.classList.remove('active');
                showToast(`Produto ${productId ? 'atualizado' : 'adicionado'} com sucesso!`);
            } else {
                showToast('Erro ao salvar produto.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar produto.', 'error');
        }
    };
    
    const deleteProduct = async (productId) => {
        const product = state.products.find(p => p.id == productId);
        if (product && confirm(`Tem certeza que deseja excluir "${product.name}" do estoque?`)) {
            try {
                const success = await appIntegration.deleteProduct(productId);
                if (success) {
                    await loadData();
                    state.products = products;
                    state.history = history;
                    renderProductsTable();
                    renderHistoryItems();
                    updateStatsCards();
                    showToast(`"${product.name}" foi excluído com sucesso.`);
                } else {
                    showToast('Erro ao excluir produto.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Erro ao excluir produto.', 'error');
            }
        }
    };
    
    const saveMovement = async (e) => {
        if (e) e.preventDefault();
        const productId = DOM.movementProductSelect.value;
        const quantity = parseInt(document.getElementById('movementQuantity').value) || 0;
        const date = document.getElementById('movementDate').value;
        const time = document.getElementById('movementTime').value;
        const type = DOM.movementTypeInput.value;
        
        if (!productId || !quantity || !date || !time) {
            showToast('Por favor, preencha todos os campos.', 'error');
            return;
        }
        
        let note = '';
        let reasonVal = '';
        
        if (type === 'entry') {
            reasonVal = document.getElementById('entryReason').value;
            if (!reasonVal) {
                showToast('Por favor, selecione o motivo da entrada.', 'error');
                return;
            }
            const noteText = document.getElementById('movementNote').value;
            note = noteText ? noteText : '';
        } else if (type === 'exit') {
            reasonVal = document.getElementById('movementReason').value;
            if (!reasonVal) {
                showToast('Por favor, selecione o motivo da saída.', 'error');
                return;
            }
            
            if (reasonVal === 'Perda') {
                const lossDescription = document.getElementById('lossDescription').value.trim();
                note = lossDescription;
            }
        }
        
        const dateTime = new Date(`${date}T${time}`).toISOString();
        const movement = {
            productId: productId,
            quantity: quantity,
            type: type,
            reason: reasonVal,
            note: note,
            date: dateTime
        };
        
        try {
            const success = await appIntegration.registerMovement(movement);
            if (success) {
                await loadData();
                state.products = products;
                state.history = history;
                renderProductsTable();
                renderHistoryItems();
                updateStatsCards();
                DOM.movementModal.classList.remove('active');
                showToast(`Movimentação de ${type === 'entry' ? 'entrada' : 'saída'} registrada com sucesso!`);
            } else {
                showToast('Erro ao registrar movimentação.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao registrar movimentação.', 'error');
        }
    };
    
    const addCategory = async (e) => {
        if (e) e.preventDefault();
        const newCategory = document.getElementById('newCategoryName').value.trim();
        if (!newCategory) {
            showToast('Digite um nome para a categoria!', 'error');
            return;
        }

        try {
            const success = await appIntegration.createCategory(newCategory);
            if (success) {
                await loadData();
                state.categories = categories;
                renderCategoryList();
                document.getElementById('newCategoryName').value = '';
                showToast(`Categoria "${newCategory}" adicionada com sucesso!`);
            } else {
                showToast('Erro ao adicionar categoria.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao adicionar categoria.', 'error');
        }
    };
    
    const deleteCategory = async (index) => {
        const categoryName = state.categories[index];
        if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"?`)) {
            try {
                const success = await appIntegration.deleteCategory(categoryName);
                if (success) {
                    await loadData();
                    state.categories = categories;
                    renderCategoryList();
                    showToast(`Categoria "${categoryName}" excluída com sucesso!`);
                } else {
                    showToast('Erro ao excluir categoria.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Erro ao excluir categoria.', 'error');
            }
        }
    };
    
    const registerQuickOut = async (productId, quantity) => {
        const product = state.products.find(p => p.id == productId);
        if (!product) return;
    
        if (product.quantity < quantity) {
            showToast('Quantidade em estoque insuficiente!', 'error');
            return;
        }
        
        const movement = {
            productId: productId,
            quantity: quantity,
            type: 'exit',
            reason: 'Venda',
            note: 'Saída rápida via Dashboard',
            date: new Date().toISOString()
        };
        
        try {
            const success = await appIntegration.registerMovement(movement);
            if (success) {
                await loadData();
                state.products = products;
                state.history = history;
                renderProductsTable();
                renderHistoryItems();
                updateStatsCards();
                showToast(`Saída de ${quantity} unidades de ${product.name} registrada!`);
            } else {
                showToast('Erro ao registrar saída rápida.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao registrar saída rápida.', 'error');
        }
    };
    const showToast = (message, type = 'success') => {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 3000);
    };
    
const init = async () => {
    await loadData();
    state.products = products;
    state.categories = categories;
    state.history = history;
    
    renderProductsTable();
    renderHistoryItems();
    renderCategoryOptions();
    updateStatsCards();
    
        
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

        document.getElementById('entryBtn').addEventListener('click', () => openMovementModal('entry'));
        document.getElementById('exitBtn').addEventListener('click', () => openMovementModal('exit'));
        document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
        document.getElementById('manageCategoriesBtn').addEventListener('click', openCategoryModal);

        document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
        document.getElementById('saveMovementBtn').addEventListener('click', saveMovement);
        document.getElementById('addCategoryBtn').addEventListener('click', addCategory);

        DOM.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                renderHistoryItems(btn.dataset.filter);
            });
        });

        document.getElementById('movementReason').addEventListener('change', function() {
            const lossGroup = document.getElementById('lossDescriptionGroup');
            lossGroup.style.display = this.value === 'Perda' ? 'block' : 'none';
            if (this.value === 'Perda') {
                document.getElementById('lossDescription').required = true;
            } else {
                document.getElementById('lossDescription').required = false;
            }
        });

        const toggleBtn = document.getElementById('toggleVisibility');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                state.isValueVisible = !state.isValueVisible;
                updateStatsCards();
            });
        }
        
        DOM.searchInput.addEventListener('input', (e) => {
            state.searchTerm = e.target.value;
            state.currentPage = 1; // Resetar para a primeira página
            renderProductsTable();
        });
        
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
        
        DOM.refreshBtn.addEventListener('click', () => {
            renderProductsTable();
            renderHistoryItems();
            updateStatsCards();
            showToast('Dados atualizados com sucesso!');
        });
document.querySelectorAll('.close-modal, #cancelProductBtn, #closeHistoryDetailModalBtn').forEach(btn => {
    btn.addEventListener('click', () => {
        DOM.productModal.classList.remove('active');
        DOM.movementModal.classList.remove('active');
        DOM.categoryModal.classList.remove('active');
        document.getElementById('historyDetailModal').classList.remove('active');
    });
});
    };
    
    
    return {
        init
    };
})();

async function initProdutos() {
    await loadData();

    const productsTable = document.getElementById('productsTable');
    const productModal = document.getElementById('productModal');
    const productDetailModal = document.getElementById('productDetailModal');
    const categoryFilter = document.getElementById('categoryFilter');
    const productCategorySelect = document.getElementById('productCategory');
    const modalProductTitle = document.getElementById('modalProductTitle');
    let currentFilteredProducts = [...products];

    function formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    }

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

    function renderCategoryOptions() {
        productCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
        categoryFilter.innerHTML = '<option value="">Todas categorias</option>';
        
        categories.forEach(category => {
            const categoryId = typeof category === 'object' ? category.id : category;
            const categoryName = typeof category === 'object' ? category.nome : category;
            
            const option1 = document.createElement('option');
            option1.value = categoryId;
            option1.textContent = categoryName;
            productCategorySelect.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = categoryId;
            option2.textContent = categoryName;
            categoryFilter.appendChild(option2);
        });
    }

    function openAddProductModal() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        modalProductTitle.textContent = 'Adicionar Novo Produto';
        renderCategoryOptions();
        productModal.classList.add('active');
    }

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
    function openProductDetailModal(productId) {
        const product = products.find(p => p.id == productId);
        if (product) {
            document.getElementById('detailName').textContent = product.name;
            document.getElementById('detailCode').textContent = product.code;
            document.getElementById('detailCategory').textContent = product.category;
            document.getElementById('detailLastUpdate').textContent = formatDate(product.lastUpdate);
            document.getElementById('detailDescription').textContent = product.description || 'Nenhuma descrição fornecida';
            document.getElementById('editProductBtn').onclick = () => {
                productDetailModal.classList.remove('active');
                openEditProductModal(productId);
            };
            
            productDetailModal.classList.add('active');
        }
    }

    async function saveProduct(e) {
        if (e) e.preventDefault();
        const productId = document.getElementById('productId').value;
        const categoryId = document.getElementById('productCategory').value;
        const categoryName = document.querySelector(`#productCategory option[value="${categoryId}"]`)?.textContent || '';
        
        const productData = {
            id: productId || null,
            name: document.getElementById('productName').value,
            category: categoryName,
            categoryId: parseInt(categoryId) || null,
            code: document.getElementById('productCode').value,
            description: document.getElementById('productDescription').value,
            quantity: 0,
            price: 0.00,
            minStock: 0,
            dailyConsumption: 0
        };
        
        if (!productData.name || !categoryId || !productData.code) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        try {
            const success = await appIntegration.saveProduct(productData);
            if (success) {
                await loadData();
                currentFilteredProducts = [...products];
                renderProductsTable(currentFilteredProducts);
                productModal.classList.remove('active');
                showToast(`Produto ${productId ? 'atualizado' : 'adicionado'} com sucesso!`);
            } else {
                showToast('Erro ao salvar produto.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao salvar produto.', 'error');
        }
    }

     async function deleteProduct(productId) {
        const product = products.find(p => p.id == productId);
        if (product && confirm(`Tem certeza que deseja excluir "${product.name}" do estoque?`)) {
            try {
                const success = await appIntegration.deleteProduct(productId);
                if (success) {
                    await loadData();
                    currentFilteredProducts = [...products];
                    renderProductsTable(currentFilteredProducts);
                    showToast(`"${product.name}" foi excluído com sucesso.`);
                } else {
                    showToast('Erro ao excluir produto.', 'error');
                }
            } catch (error) {
                console.error(error);
                showToast('Erro ao excluir produto.', 'error');
            }
        }
    }

    function applyFilters() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        currentFilteredProducts = [...products];
        
        if (searchTerm) {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.code.toLowerCase().includes(searchTerm)
            );
        }
        
        if (category) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.category === category);
        }
        
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

    renderProductsTable();
    renderCategoryOptions();
    
    document.querySelectorAll('.close-modal, #cancelProductBtn, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            productModal.classList.remove('active');
            productDetailModal.classList.remove('active');
        });
    });
    
    document.getElementById('addProductBtn').addEventListener('click', openAddProductModal);
    
    document.getElementById('saveProductBtn').addEventListener('click', saveProduct);
    
    document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
    document.getElementById('clearFiltersBtn').addEventListener('click', () => {
        document.getElementById('searchProduct').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('sortBy').value = 'name-asc';
        currentFilteredProducts = [...products];
        renderProductsTable();
    });
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
    

function formatDateGlobal(dateString) {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
}
    document.getElementById('exportBtn').addEventListener('click', exportToExcel);
    function showToast(message, type = 'success') {
        let toastContainer = document.getElementById('toast-container');
        
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '20px';
            toastContainer.style.right = '20px';
            toastContainer.style.zIndex = '10000';
            document.body.appendChild(toastContainer);
        }
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 3000);
    }
}
async function initEstoque() {
    await loadData();

    const estoqueTable = document.getElementById('estoqueTable');
    const movementModal = document.getElementById('movementModal');
    const productDetailModal = document.getElementById('productDetailModal');
    const movementProductSelect = document.getElementById('movementProduct');
    const categoryFilter = document.getElementById('categoryFilter');
    const modalMovementTitle = document.getElementById('modalMovementTitle');
    let currentFilteredProducts = [...products];

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

    function closeAllModals() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }

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
        
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', () => openProductDetailModal(btn.dataset.id));
        });
        
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', () => openEditProductModal(btn.dataset.id));
        });
        
    }

    function renderProductOptions() {
        movementProductSelect.innerHTML = '<option value="">Selecione um produto</option>';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            movementProductSelect.appendChild(option);
        });
    }

    
    function renderCategoryOptions() {
        const categoryFilter = document.getElementById('categoryFilter');
        if (categoryFilter) {
            categoryFilter.innerHTML = '<option value="">Todas categorias</option>';
            categories.forEach(category => {
                const categoryId = typeof category === 'object' ? category.id : category;
                const categoryName = typeof category === 'object' ? category.nome : category;
                
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = categoryName;
                categoryFilter.appendChild(option);
            });
        }

        const modalCategorySelect = document.getElementById('productCategory');
        if (modalCategorySelect) {
            modalCategorySelect.innerHTML = '<option value="">Selecione uma categoria</option>';
            categories.forEach(category => {
                const categoryId = typeof category === 'object' ? category.id : category;
                const categoryName = typeof category === 'object' ? category.nome : category;
                
                const option = document.createElement('option');
                option.value = categoryId;
                option.textContent = categoryName;
                modalCategorySelect.appendChild(option);
            });
        }
    }

    function openMovementModal(type) {
        document.getElementById('movementType').value = type;
        modalMovementTitle.textContent = type === 'entry' ? 
            'Registrar Entrada de Produto' : 'Registrar Saída de Produto';
        
        document.getElementById('priceGroup').style.display = type === 'entry' ? 'block' : 'none';
        document.getElementById('reasonGroup').style.display = type === 'exit' ? 'block' : 'none';
        document.getElementById('lossDescriptionGroup').style.display = 'none';
        
        document.getElementById('movementForm').reset();
        renderProductOptions();
        movementModal.classList.add('active');
    }

    function openProductDetailModal(productId) {
        const product = products.find(p => p.id == productId);
        if (product) {
            const entries = history.filter(item => 
                item.type === 'entry' && item.productId === productId
            );
            
            document.getElementById('detailName').textContent = product.name;
            document.getElementById('detailCode').textContent = product.code;
            document.getElementById('detailCategory').textContent = product.category;
            document.getElementById('detailQuantity').textContent = product.quantity;
            document.getElementById('detailPrice').textContent = `R$ ${product.price.toFixed(2)}`;
            document.getElementById('detailTotalValue').textContent = `R$ ${(product.quantity * product.price).toFixed(2)}`;
            
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
            
            const editBtn = document.createElement('button');
            editBtn.className = 'btn btn-primary';
            editBtn.innerHTML = '<i class="fas fa-edit"></i> Editar Produto';
            editBtn.onclick = () => {
                closeAllModals();
                openEditProductModal(productId);
            };
            
            const modalFooter = document.querySelector('#productDetailModal .modal-footer');
            modalFooter.innerHTML = '';
            modalFooter.appendChild(editBtn);
            
            productDetailModal.classList.add('active');
        }
    }

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

    async function saveMovement(e) {
        if (e) e.preventDefault();
        const productId = document.getElementById('movementProduct').value;
        const quantity = parseInt(document.getElementById('movementQuantity').value) || 0;
        const price = parseFloat(document.getElementById('movementPrice').value) || 0;
        const reason = document.getElementById('movementReason') ? document.getElementById('movementReason').value : '';
        const note = document.getElementById('movementNote').value;
        const type = document.getElementById('movementType').value;
        
        if (!productId || !quantity || quantity <= 0) {
            showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        let reasonVal = reason;
        let noteVal = note;
        
        if (type === 'entry') {
            reasonVal = 'Entrada (Geral)';
            if (document.getElementById('entryReason')) {
                reasonVal = document.getElementById('entryReason').value || 'Entrada (Geral)';
            }
        } else if (type === 'exit') {
            if (product.quantity < quantity) {
                showToast('Quantidade em estoque insuficiente!', 'error');
                return;
            }
            if (reason === 'Perda') {
                const lossDescription = document.getElementById('lossDescription') ? document.getElementById('lossDescription').value : '';
                noteVal = lossDescription;
            }
        }
        
        const now = new Date().toISOString();
        
        const movement = {
            productId: productId,
            quantity: quantity,
            type: type,
            reason: reasonVal,
            note: noteVal,
            date: now,
            price: price
        };
        
        try {
            const success = await appIntegration.registerMovement(movement);
            if (success) {
                await loadData();
                renderEstoqueTable();
                closeAllModals();
                showToast(`Movimentação de ${type === 'entry' ? 'entrada' : 'saída'} registrada com sucesso!`);
            } else {
                showToast('Erro ao registrar movimentação.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao registrar movimentação.', 'error');
        }
    }

    function applyFilters() {
        const searchTerm = document.getElementById('searchProduct').value.toLowerCase();
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        const sortBy = document.getElementById('sortBy').value;
        
        currentFilteredProducts = [...products];
        
        if (searchTerm) {
            currentFilteredProducts = currentFilteredProducts.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.code.toLowerCase().includes(searchTerm)
            );
        }
        
        if (category) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.category === category);
        }
        
        if (status) {
            currentFilteredProducts = currentFilteredProducts.filter(p => p.status === status);
        }
        
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
    

    renderEstoqueTable();
    renderCategoryOptions();
    renderProductOptions();
    
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
    
    document.getElementById('movementReason').addEventListener('change', function() {
        const lossGroup = document.getElementById('lossDescriptionGroup');
        lossGroup.style.display = this.value === 'Perda' ? 'block' : 'none';
    });
    
    document.querySelectorAll('.close-modal, #cancelMovementBtn, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeAllModals();
        });
    });

    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAllModals();
            }
        });
    });

    async function saveProductEdit(e) {
        if (e) e.preventDefault();
        const productId = document.getElementById('productId').value;
        const name = document.getElementById('productName').value;
        const categoryId = document.getElementById('productCategory').value;
        const categoryName = document.querySelector(`#productCategory option[value="${categoryId}"]`)?.textContent || '';
        const code = document.getElementById('productCode').value;
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const minStock = parseInt(document.getElementById('productMinStock').value) || 0;
        const dailyConsumption = parseInt(document.getElementById('productDailyConsumption').value) || 0;
        const description = document.getElementById('productDescription').value;

        if (!productId || !name || !code) {
            showToast('Preencha os campos obrigatórios!', 'error');
            return;
        }

        const productData = {
            id: productId,
            name: name,
            category: categoryName,
            categoryId: parseInt(categoryId) || null,
            code: code,
            price: price,
            minStock: minStock,
            dailyConsumption: dailyConsumption,
            description: description,
            quantity: products.find(p => p.id == productId)?.quantity || 0
        };

        try {
            const success = await appIntegration.saveProduct(productData);
            if (success) {
                await loadData();
                renderEstoqueTable();
                document.getElementById('productModal').classList.remove('active');
                showToast('Produto atualizado com sucesso!');
            } else {
                showToast('Erro ao atualizar produto.', 'error');
            }
        } catch (error) {
            console.error(error);
            showToast('Erro ao atualizar produto.', 'error');
        }
    }

    
    const saveProductBtn = document.getElementById('saveProductBtn');
    if (saveProductBtn) {
        saveProductBtn.addEventListener('click', saveProductEdit);
    }

    const cancelProductBtn = document.getElementById('cancelProductBtn');
    if (cancelProductBtn) {
        cancelProductBtn.addEventListener('click', () => {
             document.getElementById('productModal').classList.remove('active');
        });
    }

    const closeProductModalBtn = document.getElementById('closeProductModalBtn');
    if (closeProductModalBtn) {
        closeProductModalBtn.addEventListener('click', () => {
             document.getElementById('productModal').classList.remove('active');
        });
    }
}

async function initHistorico() {
    await loadData();

    const historyTable = document.getElementById('historyTable');
    const movementDetailModal = document.getElementById('movementDetailModal');
    const productFilter = document.getElementById('productFilter');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const exportBtn = document.getElementById('exportBtn');
    
    historyTable.addEventListener('click', function(e) {
        const btn = e.target.closest('.detail-btn');
        if (btn) {
            const movementId = btn.dataset.id;
            openMovementDetailModal(movementId);
        }
    });

    function getFilteredHistory() {
        const type = document.getElementById('movementType').value;
        const productId = document.getElementById('productFilter').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        
        return history.filter(item => {
            if (type && item.type !== type) return false;
            
            if (productId && item.productId !== productId) return false;
            
            const itemDate = new Date(item.date).toISOString().split('T')[0];
            if (startDate && itemDate < startDate) return false;
            if (endDate && itemDate > endDate) return false;
            
            return true;
        });
    }

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
        
    }
    
    function renderProductOptions() {
        productFilter.innerHTML = '<option value="">Todos os produtos</option>';
        
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.id;
            option.textContent = `${product.name} (${product.code})`;
            productFilter.appendChild(option);
        });
    }
    
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
    
    function applyFilters() {
        const filteredHistory = getFilteredHistory();
        renderHistoryTable(filteredHistory);
    }
    
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
    
    function exportHistory() {
        const filteredHistory = getFilteredHistory();
        
        if (filteredHistory.length === 0) {
            alert('Não há dados para exportar!');
            return;
        }
    
        const wb = XLSX.utils.book_new();
        
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
        
        for (let col = 0; col < headers.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws1[cellRef]) ws1[cellRef] = { t: 's', v: headers[col] };
            ws1[cellRef].s = headerStyle;
        }
        
        for (let i = 1; i < rows.length; i++) {
            const type = rows[i][1]; // Tipo de movimento
            
            const typeCell = `B${i+1}`;
            if (!ws1[typeCell]) ws1[typeCell] = { t: 's', v: type };
            
            if (type === 'Entrada') {
                ws1[typeCell].s = { 
                    font: { color: { rgb: "28A745" }, bold: true },
                    fill: { fgColor: { rgb: "D4EDDA" } } // Fundo verde claro
                };
                
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
                
                const qtyCell = `D${i+1}`;
                if (!ws1[qtyCell]) ws1[qtyCell] = { t: 's', v: rows[i][3] };
                ws1[qtyCell].s = { 
                    font: { color: { rgb: "DC3545" }, bold: true },
                    alignment: { horizontal: "center" }
                };
            }
            
            const dateCell = `A${i+1}`;
            if (!ws1[dateCell]) ws1[dateCell] = { t: 's', v: rows[i][0] };
            ws1[dateCell].s = { alignment: { horizontal: "center" } };
        }
        
        const colWidths = [
            { wch: 20 }, // Data/Hora
            { wch: 12 }, // Tipo
            { wch: 30 }, // Produto
            { wch: 12 }, // Quantidade
            { wch: 40 }  // Detalhes
        ];
        
        ws1['!cols'] = colWidths;
        
        ws1['!autofilter'] = { ref: `A1:E${rows.length}` };
        
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
        
        for (let col = 0; col < summaryHeaders.length; col++) {
            const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
            if (!ws2[cellRef]) ws2[cellRef] = { t: 's', v: summaryHeaders[col] };
            ws2[cellRef].s = headerStyle;
        }
        
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
        
        ws2['!cols'] = [
            { wch: 30 }, // Produto
            { wch: 10 }, // Entradas
            { wch: 10 }, // Saídas
            { wch: 10 }  // Saldo
        ];
        
        XLSX.utils.book_append_sheet(wb, ws1, "Histórico");
        XLSX.utils.book_append_sheet(wb, ws2, "Resumo");
        
        XLSX.writeFile(wb, 'historico_movimentacoes.xlsx');
    }
    
    renderHistoryTable();
    renderProductOptions();
    
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('endDate').value = today;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoFormatted = thirtyDaysAgo.toISOString().split('T')[0];
    document.getElementById('startDate').value = thirtyDaysAgoFormatted;
    
    document.querySelectorAll('.close-modal, #closeDetailModalBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            movementDetailModal.classList.remove('active');
        });
    });
    
    applyFiltersBtn.addEventListener('click', applyFilters);
    clearFiltersBtn.addEventListener('click', clearFilters);
    
    exportBtn.addEventListener('click', exportHistory);
}

function initConfiguracoes() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    }
    
    darkModeToggle.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('darkMode', 'enabled');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('darkMode', 'disabled');
        }
    });
    
    const themeColor = document.getElementById('themeColor');
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.classList.remove('theme-green', 'theme-purple', 'theme-red');
        
        if (savedTheme !== 'default') {
            document.body.classList.add(savedTheme);
        }
        
        themeColor.value = savedTheme;
    }
    
    themeColor.addEventListener('change', function() {
        document.body.classList.remove('theme-green', 'theme-purple', 'theme-red');
        
        if (this.value !== 'default') {
            document.body.classList.add(this.value);
        }
        
        localStorage.setItem('theme', this.value);
    });
    
    document.getElementById('userInfoForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const userName = document.getElementById('userName').value;
        const userEmail = document.getElementById('userEmail').value;
        
        if (userName && userEmail) {
            localStorage.setItem('userName', userName);
            localStorage.setItem('userEmail', userEmail);
            alert('Informações do usuário atualizadas com sucesso!');
        } else {
            alert('Por favor, preencha todos os campos.');
        }
    });
    
    document.getElementById('userName').value = localStorage.getItem('userName') || '';
    document.getElementById('userEmail').value = localStorage.getItem('userEmail') || '';
    
    document.getElementById('securityForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (newPassword !== confirmPassword) {
            alert('As senhas não coincidem!');
            return;
        }
        
        if (newPassword.length < 6) {
            alert('A senha deve ter pelo menos 6 caracteres.');
            return;
        }
        
        alert('Senha alterada com sucesso!');
        this.reset();
    });
    
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
    
    const backupFrequency = document.getElementById('backupFrequency');
    backupFrequency.value = localStorage.getItem('backupFrequency') || 'diario';
    backupFrequency.addEventListener('change', function() {
        localStorage.setItem('backupFrequency', this.value);
        alert(`Frequência de backup alterada para: ${this.options[this.selectedIndex].text}`);
    });
    
    document.getElementById('deleteAccountBtn').addEventListener('click', function() {
        if (confirm('Tem certeza que deseja excluir sua conta permanentemente? Esta ação não pode ser desfeita.')) {
            alert('Conta marcada para exclusão. Um e-mail de confirmação foi enviado.');
        }
    });
    
    document.getElementById('clearDataBtn').addEventListener('click', function() {
        if (confirm('ATENÇÃO: Isso apagará TODOS os dados do sistema. Tem certeza que deseja continuar?')) {
            localStorage.removeItem('stockwave_products');
            localStorage.removeItem('stockwave_history');
            localStorage.removeItem('stockwave_categories');
            alert('Todos os dados foram apagados com sucesso.');
            window.location.reload();
        }
    });
}

function removeAllThemeClasses() {
    const body = document.body;
    body.classList.remove(
        'theme-default', 'theme-green', 'theme-purple', 'theme-red',
        'theme-pink', 'theme-yellow', 'theme-orange', 'theme-black', 'theme-gray',
        'dark-mode' // Também remove dark-mode para evitar conflitos
    );
}

function applySavedTheme() {
    const body = document.body;
    
    removeAllThemeClasses();
    
    const darkMode = localStorage.getItem('darkModeEnabled');
    if (darkMode === 'true') {
        body.classList.add('dark-mode');
    }
    
    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    
    if (savedTheme !== 'default') {
        body.classList.add(`theme-${savedTheme}`);
    }
    
}

function initConfiguracoesPage() {
    const darkToggle = document.getElementById('darkModeToggle');
    const themeSelect = document.getElementById('themeColor');
    
    if (!darkToggle || !themeSelect) return;

    const darkMode = localStorage.getItem('darkModeEnabled');
    darkToggle.checked = (darkMode === 'true');

    const savedTheme = localStorage.getItem('selectedTheme') || 'default';
    themeSelect.value = savedTheme;

    darkToggle.addEventListener('change', () => {
        if (darkToggle.checked) {
            localStorage.setItem('darkModeEnabled', 'true');
        } else {
            localStorage.setItem('darkModeEnabled', 'false');
        }
        applySavedTheme();
    });

    themeSelect.addEventListener('change', () => {
        const newTheme = themeSelect.value;
        localStorage.setItem('selectedTheme', newTheme);
        applySavedTheme();
    });
}

function applyThemeOnLoad() {
    applySavedTheme();
    
    if (document.getElementById('darkModeToggle') && document.getElementById('themeColor')) {
        initConfiguracoesPage();
    }
}

document.addEventListener('DOMContentLoaded', applyThemeOnLoad);

function initModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
}

