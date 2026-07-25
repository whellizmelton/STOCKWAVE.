/**
 * modal.js - Componente de modais
 *
 * Centraliza a lógica de abrir/fechar modais,
 * eliminando código duplicado entre as páginas.
 */

const Modal = {
    /**
     * Abre um modal
     *
     * @param {string} selector - Seletor do modal
     */
    open(selector) {
        const modal = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (modal) {
            modal.classList.add('active');
        }
    },

    /**
     * Fecha um modal
     *
     * @param {string} selector - Seletor do modal
     */
    close(selector) {
        const modal = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (modal) {
            modal.classList.remove('active');
        }
    },

    /**
     * Fecha todos os modais abertos
     */
    closeAll() {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    },

    /**
     * Alterna visibilidade de um modal
     *
     * @param {string} selector - Seletor do modal
     */
    toggle(selector) {
        const modal = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (modal) {
            modal.classList.toggle('active');
        }
    }
};

window.Modal = Modal;
