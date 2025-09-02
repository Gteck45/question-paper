// Authentication utility functions

/**
 * Get the authentication headers with the Bearer token
 * @returns {Object} Headers object with Authorization
 */
export const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {}; // Server-side
    
    const token = localStorage.getItem('token');
    return {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json'
    };
};

/**
 * Make an authenticated fetch request
 * @param {string} url - The API endpoint
 * @param {Object} options - Fetch options
 * @returns {Promise} Fetch response
 */
export const authenticatedFetch = async (url, options = {}) => {
    const authHeaders = getAuthHeaders();
    
    const config = {
        ...options,
        headers: {
            ...authHeaders,
            ...options.headers
        }
    };
    
    return fetch(url, config);
};

/**
 * Get axios config with authentication headers
 * @param {Object} config - Additional axios config
 * @returns {Object} Axios config with auth headers
 */
export const getAuthAxiosConfig = (config = {}) => {
    const authHeaders = getAuthHeaders();
    
    return {
        ...config,
        headers: {
            ...authHeaders,
            ...config.headers
        }
    };
};
