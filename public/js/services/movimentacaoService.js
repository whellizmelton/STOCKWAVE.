/**
 * movimentacaoService.js - Serviço de movimentações
 */

const MovimentacaoService = {
    async listarTodas(page = 1, limit = 50) {
        const response = await ApiClient.get(`movimentacoes?page=${page}&limit=${limit}`);
        return response;
    },

    async buscarPorId(id) {
        const response = await ApiClient.get(`movimentacoes?id=${id}`);
        return response.data || null;
    },

    async buscarPorProduto(produtoId, limit = 20) {
        const response = await ApiClient.get(`movimentacoes?produto_id=${produtoId}&limit=${limit}`);
        return response.data || [];
    },

    async registrarEntrada(data) {
        return await ApiClient.post('movimentacoes?type=entrada', data);
    },

    async registrarSaida(data) {
        return await ApiClient.post('movimentacoes?type=saida', data);
    },

    async deletar(id) {
        return await ApiClient.delete(`movimentacoes?id=${id}`);
    }
};

window.MovimentacaoService = MovimentacaoService;
