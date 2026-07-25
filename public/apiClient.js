class StockWaveAPI {
    constructor(baseURL = '/stockwave') {
        this.baseURL = baseURL;
        this.useDirectAPI = true;
        this.csrfToken = null;
    }

    async getCsrfToken() {
        if (this.csrfToken) {
            return this.csrfToken;
        }
        
        try {
            const response = await fetch(`${this.baseURL}/api.php?endpoint=auth&action=csrf-token`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (!data.error) {
                this.csrfToken = data.token;
            }
        } catch (error) {
            console.error('Erro ao obter token CSRF:', error);
        }
        
        return this.csrfToken;
    }

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        
        // Adiciona token CSRF se disponível para métodos que modificam dados
        if (this.csrfToken) {
            headers['X-CSRF-Token'] = this.csrfToken;
        }
        
        return headers;
    }

    async get(endpoint, params = {}) {
        const url = new URL(`${this.baseURL}/api.php`, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, { method: 'GET', headers: this.getHeaders() });
        return this.handleResponse(response);
    }

    async post(endpoint, data = {}, params = {}) {
        await this.getCsrfToken();
        const url = new URL(`${this.baseURL}/api.php`, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async put(endpoint, data = {}, params = {}) {
        await this.getCsrfToken();
        const url = new URL(`${this.baseURL}/api.php`, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    async delete(endpoint, params = {}) {
        await this.getCsrfToken();
        const url = new URL(`${this.baseURL}/api.php`, window.location.origin);
        url.searchParams.append('endpoint', endpoint);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
        const response = await fetch(url, { method: 'DELETE', headers: this.getHeaders() });
        return this.handleResponse(response);
    }

    async handleResponse(response) {
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Erro na requisicao');
        }
        return data;
    }

    async registerEmpresa(data) {
        return this.post('empresas', data);
    }

    async getProdutos(params = {}) {
        return this.get('produtos', params);
    }

    async createProduto(data) {
        return this.post('produtos', data);
    }

    async updateProduto(id, data) {
        return this.put('produtos', data, { id: id });
    }

    async deleteProduto(id) {
        return this.delete('produtos', { id: id });
    }

    async getCategorias() {
        return this.get('categorias');
    }

    async createCategoria(data) {
        return this.post('categorias', data);
    }

    async deleteCategoria(id) {
        return this.delete('categorias', { id: id });
    }

    async registrarEntrada(data) {
        return this.post('movimentacoes', data, { type: 'entrada' });
    }

    async registrarSaida(data) {
        return this.post('movimentacoes', data, { type: 'saida' });
    }

    async getHistorico(params = {}) {
        return this.get('movimentacoes', params);
    }
}

window.api = new StockWaveAPI();
