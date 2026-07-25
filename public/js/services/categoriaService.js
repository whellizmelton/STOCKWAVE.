/**
 * categoriaService.js - Serviço de categorias
 */

const CategoriaService = {
    async listarTodas() {
        const response = await ApiClient.get('categorias');
        return response.data || [];
    },

    async buscarPorId(id) {
        const response = await ApiClient.get(`categorias?id=${id}`);
        return response.data || null;
    },

    async criar(data) {
        return await ApiClient.post('categorias', data);
    },

    async atualizar(id, data) {
        return await ApiClient.put(`categorias?id=${id}`, data);
    },

    async deletar(id) {
        return await ApiClient.delete(`categorias?id=${id}`);
    }
};

window.CategoriaService = CategoriaService;
