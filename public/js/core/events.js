/**
 * events.js - Gerenciamento centralizado de eventos
 *
 * Centraliza listeners globais e navegação entre páginas.
 */

const EventManager = {
    /**
     * Inicializa listeners globais
     */
    init() {
        this.initModalClose();
        this.initHighlightActiveLink();
    },

    /**
     * Fecha modais ao clicar fora ou no botão de fechar
     */
    initModalClose() {
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
    },

    /**
     * Destaca link ativo na navegação
     */
    initHighlightActiveLink() {
        const path = window.location.pathname;
        let currentPage = path.split('/').pop();

        if (currentPage === '') {
            currentPage = 'index.html';
        }

        const navLinks = document.querySelectorAll('nav a');

        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            let linkPage = linkHref;

            if (linkPage.startsWith('./')) {
                linkPage = linkPage.substring(2);
            }

            link.classList.toggle('active', currentPage === linkPage);
        });
    },

    /**
     * Adiciona listener de forma segura
     */
    on(selector, event, handler, options = false) {
        const el = typeof selector === 'string'
            ? document.querySelector(selector)
            : selector;

        if (el) {
            el.addEventListener(event, handler, options);
        }
    },

    /**
     * Adiciona listener para múltiplos elementos
     */
    onAll(selector, event, handler) {
        document.querySelectorAll(selector).forEach(el => {
            el.addEventListener(event, handler);
        });
    }
};

window.EventManager = EventManager;
