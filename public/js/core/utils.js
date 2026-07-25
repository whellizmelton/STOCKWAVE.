/**
 * utils.js - Funções utilitárias reutilizáveis
 *
 * Centraliza formatadores, validadores e utilitários
 * que estavam duplicados em script.js.
 */

const Utils = {
    /**
     * Formata data/hora no formato DD/MM/YYYY HH:MM
     */
    formatDateTime(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    },

    /**
     * Formata data no formato DD/MM/YYYY
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    },

    /**
     * Formata valor monetário
     */
    formatCurrency(value) {
        return `R$ ${parseFloat(value).toFixed(2)}`;
    },

    /**
     * Normaliza texto para busca (lowercase + trim)
     */
    normalizeText(text) {
        return String(text || '').toLowerCase().trim();
    },

    /**
     * Verifica se um texto contém outro (case insensitive)
     */
    contains(text, search) {
        return this.normalizeText(text).includes(this.normalizeText(search));
    },

    /**
     * Debounce - executa função após delay sem novas chamadas
     */
    debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    },

    /**
     * Gera ID único
     */
    uniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
};

window.Utils = Utils;
