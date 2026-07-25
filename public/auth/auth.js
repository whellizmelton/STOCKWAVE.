/**
 * auth.js - Lógica da página de login
 * 
 * Responsável por:
 * - Gerenciar formulário de login
 * - Exibir mensagens de erro
 * - Redirecionar após login
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Verifica apenas se há sessão armazenada (não chama servidor para evitar erro 401)
    const stored = sessionStorage.getItem(authIntegration.sessionKey);
    if (stored) {
        try {
            const user = JSON.parse(stored);
            if (user) {
                window.location.href = '/stockwave/public/';
                return;
            }
        } catch (e) {
            sessionStorage.removeItem(authIntegration.sessionKey);
        }
    }
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

//Manipula submissão do formulário de login
 
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');
    
    // Desabilita botão
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
    
    // Limpa erro anterior
    hideError();
    
    try {
        const success = await authIntegration.login(email, password);
        
        if (success) {
            window.location.href = '/stockwave/public/';
        } else {
            showError('Credenciais inválidas');
        }
    } catch (error) {
        console.error('Erro ao fazer login:', error);
        showError('Erro ao fazer login. Tente novamente.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar';
    }
}

// Exibe mensagem de erro
function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }
}

//Esconde mensagem de erro
function hideError() {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.style.display = 'none';
    }
}
