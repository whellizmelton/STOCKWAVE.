/**
 * AuthClient - Cliente HTTP de autenticação
 * 
 * Responsável por:
 * - Fazer requisições HTTP para endpoints de autenticação
 * - Gerenciar comunicação com a API
 */
class AuthClient {
    constructor() {
        this.baseURL = '/stockwave/api.php?endpoint=';
        this.csrfToken = null;
    }
    
    /**
     * Obtém token CSRF
     * 
     * @returns {Promise} Token CSRF
     */
    async getCsrfToken() {
        if (this.csrfToken) {
            return this.csrfToken;
        }
        
        const response = await fetch(this.baseURL + 'auth&action=csrf-token', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        
        if (!data.error) {
            this.csrfToken = data.token;
            this.csrfInputName = data.input_name;
        }
        
        return this.csrfToken;
    }
    
    /**
     * Faz login
     * 
     * @param {string} email Email do usuário
     * @param {string} password Senha do usuário
     * @param {boolean} rememberMe Se deve lembrar o usuário
     * @returns {Promise} Resposta da API
     */
    async login(email, password, rememberMe = false) {
        const csrfToken = await this.getCsrfToken();
        
        const response = await fetch(this.baseURL + 'auth&action=login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ email, password, remember_me: rememberMe })
        });
        return response.json();
    }
    
    /**
     * Faz logout
     * 
     * @returns {Promise} Resposta da API
     */
    async logout() {
        const csrfToken = await this.getCsrfToken();
        
        const response = await fetch(this.baseURL + 'auth&action=logout', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            }
        });
        return response.json();
    }
    
    /**
     * Retorna dados do usuário autenticado
     * 
     * @returns {Promise} Resposta da API
     */
    async me() {
        const response = await fetch(this.baseURL + 'auth&action=me', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        return response.json();
    }
    
    /**
     * Solicita recuperação de senha
     * 
     * @param {string} email Email do usuário
     * @returns {Promise} Resposta da API
     */
    async requestPasswordReset(email) {
        const response = await fetch(this.baseURL + 'auth&action=request-password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        return response.json();
    }
    
    /**
     * Reseta senha com token
     * 
     * @param {string} token Token de reset
     * @param {string} password Nova senha
     * @returns {Promise} Resposta da API
     */
    async resetPassword(token, password) {
        const response = await fetch(this.baseURL + 'auth&action=reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password })
        });
        return response.json();
    }
    
    /**
     * Altera senha do usuário autenticado
     * 
     * @param {string} currentPassword Senha atual
     * @param {string} newPassword Nova senha
     * @returns {Promise} Resposta da API
     */
    async changePassword(currentPassword, newPassword) {
        const csrfToken = await this.getCsrfToken();
        
        const response = await fetch(this.baseURL + 'auth&action=change-password', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
            },
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
        return response.json();
    }
}

const authClient = new AuthClient();
