/**
 * main.js - Arquivo de entrada central
 *
 * Carrega todos os módulos core, components, services e pages.
 * Este arquivo deve ser incluído em todas as páginas HTML.
 */

// Core modules
document.write('<script src="js/core/config.js"></script>');
document.write('<script src="js/core/utils.js"></script>');
document.write('<script src="js/core/api.js"></script>');
document.write('<script src="js/core/events.js"></script>');

// Components
document.write('<script src="js/components/toast.js"></script>');
document.write('<script src="js/components/modal.js"></script>');

// Services
document.write('<script src="js/services/produtoService.js"></script>');
document.write('<script src="js/services/categoriaService.js"></script>');
document.write('<script src="js/services/movimentacaoService.js"></script>');

// App Integration (existing)
document.write('<script src="appIntegration.js"></script>');

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    EventManager.init();
});
