/**
 * AuthIntegration - Integração de autenticação no frontend
 * 
 * Responsável por:
 * - Gerenciar estado de autenticação
 * - Armazenar dados do usuário
 * - Verificar permissões e roles
 * - Proteger rotas no frontend
 */
class AuthIntegration {
    constructor() {
        this.currentUser = null;
        this.sessionKey = 'stockwave_session';
    }
    
    /**
     * Faz login
     * 
     * @param {string} email Email do usuário
     * @param {string} password Senha do usuário
     * @returns {Promise<boolean>} True se login bem-sucedido
     */
    async login(email, password) {
        const result = await authClient.login(email, password);
        
        if (!result.error) {
            await this.loadUser();
            return true;
        }
        
        return false;
    }
    
    /**
     * Faz logout
     * 
     * @returns {Promise<void>}
     */
    async logout() {
        await authClient.logout();
        this.currentUser = null;
        sessionStorage.removeItem(this.sessionKey);
        window.location.href = '/stockwave/public/auth/login.html';
    }
    
    /**
     * Carrega dados do usuário autenticado
     * 
     * @returns {Promise<boolean>} True se usuário carregado com sucesso
     */
    async loadUser() {
        const result = await authClient.me();
        
        if (!result.error) {
            this.currentUser = result.data;
            sessionStorage.setItem(this.sessionKey, JSON.stringify(this.currentUser));
            return true;
        }
        
        return false;
    }
    
    /**
     * Verifica se está autenticado
     * 
     * @returns {boolean} True se autenticado
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    /**
     * Retorna dados do usuário atual
     * 
     * @returns {object|null} Dados do usuário ou null
     */
    getCurrentUser() {
        return this.currentUser;
    }
    
    /**
     * Verifica se usuário tem uma permissão
     * 
     * @param {string} permission Nome da permissão
     * @returns {boolean} True se tiver a permissão
     */
    hasPermission(permission) {
        if (!this.currentUser) return false;
        return this.currentUser.permissions && this.currentUser.permissions.some(p => p.nome === permission);
    }
    
    /**
     * Verifica se usuário tem uma role
     * 
     * @param {string} role Nome da role
     * @returns {boolean} True se tiver a role
     */
    hasRole(role) {
        if (!this.currentUser) return false;
        return this.currentUser.roles && this.currentUser.roles.some(r => r.nome === role);
    }
    
    /**
     * Verifica sessão (tenta recuperar do sessionStorage ou do servidor)
     * 
     * @returns {Promise<boolean>} True se sessão válida
     */
    async checkSession() {
        // Tenta recuperar da sessionStorage
        const stored = sessionStorage.getItem(this.sessionKey);
        if (stored) {
            try {
                this.currentUser = JSON.parse(stored);
                return true;
            } catch (e) {
                sessionStorage.removeItem(this.sessionKey);
            }
        }
        
        // Se não, verifica com o servidor
        return await this.loadUser();
    }
    
    /**
     * Requer autenticação (redireciona para login se não autenticado)
     * 
     * @returns {Promise<boolean>} True se autenticado
     */
    async requireAuth() {
        const authenticated = await this.checkSession();
        
        if (!authenticated) {
            window.location.href = '/stockwave/public/auth/login.html';
            return false;
        }
        
        return true;
    }
    
    /**
     * Requer permissão (redireciona se não tiver)
     * 
     * @param {string} permission Nome da permissão
     * @returns {Promise<boolean>} True se tiver permissão
     */
    async requirePermission(permission) {
        await this.requireAuth();
        
        if (!this.hasPermission(permission)) {
            window.location.href = '/stockwave/public/auth/login.html';
            return false;
        }
        
        return true;
    }
    
    /**
     * Requer role (redireciona se não tiver)
     * 
     * @param {string} role Nome da role
     * @returns {Promise<boolean>} True se tiver role
     */
    async requireRole(role) {
        await this.requireAuth();
        
        if (!this.hasRole(role)) {
            window.location.href = '/stockwave/public/auth/login.html';
            return false;
        }
        
        return true;
    }
}

const authIntegration = new AuthIntegration();
