/**
 * Storage Service
 * Local storage and session storage utilities
 */

const storage = {
    /**
     * Set item in localStorage
     */
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Storage set error:', error);
            return false;
        }
    },

    /**
     * Get item from localStorage
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Storage get error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from localStorage
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Storage remove error:', error);
            return false;
        }
    },

    /**
     * Clear all localStorage
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Storage clear error:', error);
            return false;
        }
    }
};

const session = {
    /**
     * Set item in sessionStorage
     */
    set(key, value) {
        try {
            sessionStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Session set error:', error);
            return false;
        }
    },

    /**
     * Get item from sessionStorage
     */
    get(key, defaultValue = null) {
        try {
            const item = sessionStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Session get error:', error);
            return defaultValue;
        }
    },

    /**
     * Remove item from sessionStorage
     */
    remove(key) {
        try {
            sessionStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Session remove error:', error);
            return false;
        }
    },

    /**
     * Clear all sessionStorage
     */
    clear() {
        try {
            sessionStorage.clear();
            return true;
        } catch (error) {
            console.error('Session clear error:', error);
            return false;
        }
    }
};

/**
 * Cache API responses
 */
const cache = {
    /**
     * Set cached data with expiration
     */
    set(key, data, ttlMinutes = 5) {
        const item = {
            data,
            expires: Date.now() + (ttlMinutes * 60 * 1000)
        };
        storage.set(`cache_${key}`, item);
    },

    /**
     * Get cached data if not expired
     */
    get(key) {
        const item = storage.get(`cache_${key}`);
        if (!item) return null;
        
        if (Date.now() > item.expires) {
            storage.remove(`cache_${key}`);
            return null;
        }
        
        return item.data;
    },

    /**
     * Clear specific cache
     */
    clear(key) {
        storage.remove(`cache_${key}`);
    },

    /**
     * Clear all cache
     */
    clearAll() {
        Object.keys(localStorage)
            .filter(key => key.startsWith('cache_'))
            .forEach(key => localStorage.removeItem(key));
    }
};

export { storage, session, cache };
