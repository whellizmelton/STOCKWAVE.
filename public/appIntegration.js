class StockWaveAppIntegration {
    constructor() {
        this.useAPI = true;
        this.api    = window.api;
    }

    async loadProducts() {
        if (this.useAPI && this.api) {
            try {
                const response = await this.api.getProdutos();
                const list     = Array.isArray(response) ? response : (response.data || []);
                return list.map(p => ({
                    id:          p.id,
                    name:        p.nome,
                    category:    p.categoria_nome || 'Sem categoria',
                    code:        p.codigo_barras || '',
                    quantity:    parseFloat(p.quantidade),
                    minStock:    parseFloat(p.quantidade_minima),
                    price:       parseFloat(p.preco),
                    description: p.descricao || '',
                    lastUpdate:  p.updated_at,
                    status:      p.quantidade <= 0 ? 'out-of-stock' : 
                                 p.quantidade <= p.quantidade_minima ? 'low-stock' : 'in-stock'
                }));
            } catch (error) {
                console.error('Erro ao carregar produtos da API:', error);
                return this.loadFromLocalStorage('stockwave_products');
            }
        }
        return this.loadFromLocalStorage('stockwave_products');
    }

    async loadCategories() {
        if (this.useAPI && this.api) {
            try {
                const response = await this.api.getCategorias();
                return response.map(c => ({
                    id: c.id,
                    nome: c.nome
                }));
            } catch (error) {
                console.error('Erro ao carregar categorias da API:', error);
                return this.loadFromLocalStorage('stockwave_categories');
            }
        }
        return this.loadFromLocalStorage('stockwave_categories');
    }

    async loadHistory() {
        if (this.useAPI && this.api) {
            try {
                const response = await this.api.getHistorico();
                return response.data.map(m => ({
                    id:          m.id,
                    type:        m.tipo === 'entrada' ? 'entry' : 'exit',
                    productId:   m.produto_id,
                    productName: m.produto_nome,
                    quantity:    parseFloat(m.quantidade),
                    date:        m.data_hora,
                    user:        'Usuario',
                    note:        `${m.motivo}: ${m.observacoes || ''}`
                }));
            } catch (error) {
                console.error('Erro ao carregar historico da API:', error);
                return this.loadFromLocalStorage('stockwave_history');
            }
        }
        return this.loadFromLocalStorage('stockwave_history');
    }

    async saveProduct(product) {
        if (this.useAPI && this.api) {
            try {
                const data = {
                    nome:              product.name,
                    descricao:         product.description,
                    categoria_id:      product.categoryId || null,
                    quantidade:        product.quantity,
                    quantidade_minima: product.minStock,
                    preco:             product.price,
                    codigo_barras:     product.code
                };
                if (product.id) {
                    await this.api.updateProduto(product.id, data);
                } else {
                    const result = await this.api.createProduto(data);
                    product.id   = result.id;
                }
                return true;
            } catch (error) {
                console.error('Erro ao salvar produto na API:', error);
                return false;
            }
        }
        return this.saveToLocalStorage('stockwave_products');
    }

    async deleteProduct(productId) {
        if (this.useAPI && this.api) {
            try {
                await this.api.deleteProduto(productId);
                return true;
            } catch (error) {
                console.error('Erro ao deletar produto na API:', error);
                return false;
            }
        }
        let products = this.loadFromLocalStorage('stockwave_products');
        products     = products.filter(p => p.id != productId);
        localStorage.setItem('stockwave_products', JSON.stringify(products));
        return true;
    }

    async registerMovement(movement) {
        if (this.useAPI && this.api) {
            try {
                const data = {
                    produto_id: movement.productId,
                    quantidade: movement.quantity,
                    motivo:     movement.reason,
                    observacoes: movement.note || '',
                    data_hora:  movement.date || new Date().toISOString()
                };
                if (movement.type === 'entry') {
                    await this.api.registrarEntrada(data);
                } else {
                    await this.api.registrarSaida(data);
                }
                return true;
            } catch (error) {
                console.error('Erro ao registrar movimentacao na API:', error);
                return false;
            }
        }
        let history = this.loadFromLocalStorage('stockwave_history');
        history.unshift(movement);
        localStorage.setItem('stockwave_history', JSON.stringify(history));
        return true;
    }

    async createCategory(categoryName) {
        if (this.useAPI && this.api) {
            try {
                await this.api.createCategoria({ nome: categoryName, descricao: '' });
                return true;
            } catch (error) {
                console.error('Erro ao criar categoria na API:', error);
                return false;
            }
        }
        let categories = this.loadFromLocalStorage('stockwave_categories');
        categories.push(categoryName);
        localStorage.setItem('stockwave_categories', JSON.stringify(categories));
        return true;
    }

    async deleteCategory(categoryName) {
        if (this.useAPI && this.api) {
            try {
                const categories = await this.api.getCategorias();
                const category   = categories.find(c => c.nome === categoryName);
                if (category) {
                    await this.api.deleteCategoria(category.id);
                }
                return true;
            } catch (error) {
                console.error('Erro ao deletar categoria na API:', error);
                return false;
            }
        }
        let categories = this.loadFromLocalStorage('stockwave_categories');
        categories     = categories.filter(c => c !== categoryName);
        localStorage.setItem('stockwave_categories', JSON.stringify(categories));
        return true;
    }

}

const appIntegration = new StockWaveAppIntegration();
