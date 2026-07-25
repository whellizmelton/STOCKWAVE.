/**
 * produtoService.js - Serviço de produtos
 *
 * Centraliza todas as operações de API relacionadas a produtos.
 */

const ProdutoService = {
    /**
     * Lista todos os produtos
     */
    async listarTodos() {
        const response = await ApiClient.get('produtos');
        return response.data || [];
    },

    /**
     * Busca produto por ID
     */
    async buscarPorId(id) {
        const response = await ApiClient.get(`produtos?id=${id}`);
        return response.data || null;
    },

    /**
     * Busca produtos com estoque baixo
     */
    async buscarBaixoEstoque() {
        const response = await ApiClient.get('produtos?low_stock=1');
        return response.data || [];
    },

    /**
     * Cria um novo produto
     */
    async criar(data) {
        const response = await ApiClient.post('produtos', data);
        return response;
    },

    /**
     * Atualiza um produto
     */
    async atualizar(id, data) {
        const response = await ApiClient.put(`produtos?id=${id}`, data);
        return response;
    },

    /**
     * Deleta um produto
     */
    async deletar(id) {
        const response = await ApiClient.delete(`produtos?id=${id}`);
        return response;
    }
};

window.ProdutoService = ProdutoService;
