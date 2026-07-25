/**
 * config.js - Configurações centralizadas do frontend
 */
const AppConfig = {
    API_BASE: '/stockwave/api.php',
    ITEMS_PER_PAGE: 5,
    MAX_PAGE: 100,
    DEFAULT_LIMIT: 50,
    STORAGE_KEYS: {
        PRODUCTS: 'stockwave_products',
        CATEGORIES: 'stockwave_categories',
        HISTORY: 'stockwave_history',
        DARK_MODE: 'darkModeEnabled',
        THEME: 'selectedTheme',
        USER_NAME: 'userName',
        USER_EMAIL: 'userEmail',
        EMAIL_NOTIFICATIONS: 'emailNotifications',
        LOW_STOCK_ALERTS: 'lowStockAlerts',
        MOVEMENT_ALERTS: 'movementAlerts',
        BACKUP_FREQUENCY: 'backupFrequency'
    },
    STATUS: {
        IN_STOCK: 'in-stock',
        LOW_STOCK: 'low-stock',
        CRITICAL_STOCK: 'critical-stock',
        OUT_OF_STOCK: 'out-of-stock'
    },
    MOVEMENT_TYPE: {
        ENTRY: 'entrada',
        EXIT: 'saida'
    }
};

window.AppConfig = AppConfig;
