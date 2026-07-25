/**
 * toast.js - Componente de notificações toast
 *
 * Centraliza todas as notificações toast do sistema,
 * eliminando código duplicado entre as páginas.
 */

const Toast = {
    /**
     * Exibe uma notificação
     *
     * @param {string} message - Mensagem
     * @param {string} type - Tipo: success, error, warning, info
     * @param {number} duration - Duração em ms (0 = permanente)
     */
    show(message, type = 'success', duration = 3000) {
        const toast = document.getElementById('toast');
        if (!toast) {
            console.warn('Toast element not found');
            return;
        }

        toast.textContent = message;
        toast.className = `toast ${type} show`;

        if (duration > 0) {
            setTimeout(() => {
                toast.className = 'toast';
            }, duration);
        }
    },

    /**
     * Notificação de sucesso
     */
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },

    /**
     * Notificação de erro
     */
    error(message, duration = 3000) {
        this.show(message, 'error', duration);
    },

    /**
     * Notificação de alerta
     */
    warning(message, duration = 3000) {
        this.show(message, 'warning', duration);
    },

    /**
     * Notificação informativa
     */
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};

window.Toast = Toast;
