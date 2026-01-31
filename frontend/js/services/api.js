/**
 * API Service
 * Backend API communication layer
 */

const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'https://uplayg.onrender.com/api' 
    : 'https://uplayg.onrender.com/api';

/**
 * Get Firebase ID token for authentication
 */
async function getAuthToken() {
    const { auth } = await import('./firebase-config.js');
    const { getAuth, onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
    
    const firebaseAuth = getAuth();
    const user = firebaseAuth.currentUser;
    
    if (!user) return null;
    
    try {
        return await user.getIdToken(true);
    } catch (error) {
        console.error('Error getting auth token:', error);
        return null;
    }
}

/**
 * Make API request
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get auth token if user is logged in
    const token = await getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers
    };
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API request error:', error);
        throw error;
    }
}

/**
 * Upload file with FormData
 */
async function uploadFile(endpoint, formData) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = await getAuthToken();
    
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

// ==================== Apps API ====================

const appsApi = {
    // Get all active apps
    getApps: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/apps?${queryString}`);
    },
    
    // Get app by ID
    getApp: (id) => apiRequest(`/apps/${id}`),
    
    // Get app by slug
    getAppBySlug: (slug) => apiRequest(`/apps/slug/${slug}`),
    
    // Create new app
    createApp: (data) => apiRequest('/apps', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    // Update app
    updateApp: (id, data) => apiRequest(`/apps/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    // Delete app
    deleteApp: (id) => apiRequest(`/apps/${id}`, {
        method: 'DELETE'
    }),
    
    // Get user's apps
    getMyApps: () => apiRequest('/apps/my/apps'),
    
    // Search apps
    searchApps: (query, limit = 20) => apiRequest(`/apps/search?q=${encodeURIComponent(query)}&limit=${limit}`),
    
    // Generate slug
    generateSlug: (appName) => apiRequest('/apps/generate-slug', {
        method: 'POST',
        body: JSON.stringify({ appName })
    })
};

// ==================== Ratings API ====================

const ratingsApi = {
    // Get ratings for an app
    getRatings: (appId, params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/ratings/${appId}?${queryString}`);
    },
    
    // Get rating summary
    getSummary: (appId) => apiRequest(`/ratings/${appId}/summary`),
    
    // Get user's rating
    getMyRating: (appId) => apiRequest(`/ratings/${appId}/my-rating`),
    
    // Submit or update rating
    submitRating: (appId, rating, review = '') => apiRequest(`/ratings/${appId}`, {
        method: 'POST',
        body: JSON.stringify({ rating, review })
    }),
    
    // Delete rating
    deleteRating: (appId) => apiRequest(`/ratings/${appId}`, {
        method: 'DELETE'
    }),
    
    // Check if user has rated
    hasRated: (appId) => apiRequest(`/ratings/${appId}/has-rated`)
};

// ==================== Slider API ====================

const sliderApi = {
    // Get active slides (public)
    getSlides: () => apiRequest('/slider'),
    
    // Get all slides (admin)
    getAllSlides: () => apiRequest('/slider/all'),
    
    // Create slide (admin)
    createSlide: (data) => apiRequest('/slider', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    
    // Update slide (admin)
    updateSlide: (id, data) => apiRequest(`/slider/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    
    // Delete slide (admin)
    deleteSlide: (id) => apiRequest(`/slider/${id}`, {
        method: 'DELETE'
    }),
    
    // Reorder slides (admin)
    reorderSlides: (slideIds) => apiRequest('/slider/reorder', {
        method: 'POST',
        body: JSON.stringify({ slideIds })
    }),
    
    // Toggle slide status (admin)
    toggleSlide: (id) => apiRequest(`/slider/${id}/toggle`, {
        method: 'PATCH'
    })
};

// ==================== Upload API ====================

const uploadApi = {
    // Upload single file
    uploadSingle: (file, folder = 'uploads', prefix = '') => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        if (prefix) formData.append('prefix', prefix);
        
        return uploadFile('/uploads/single', formData);
    },
    
    // Upload multiple files
    uploadMultiple: (files, folder = 'uploads', prefix = '') => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        formData.append('folder', folder);
        if (prefix) formData.append('prefix', prefix);
        
        return uploadFile('/uploads/multiple', formData);
    },
    
    // Upload app logo
    uploadLogo: (file, appId = '') => {
        const formData = new FormData();
        formData.append('file', file);
        if (appId) formData.append('appId', appId);
        
        return uploadFile('/uploads/logo', formData);
    },
    
    // Upload screenshots
    uploadScreenshots: (files, appId = '') => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        if (appId) formData.append('appId', appId);
        
        return uploadFile('/uploads/screenshots', formData);
    },
    
    // Delete file
    deleteFile: (fileUrl) => apiRequest('/uploads', {
        method: 'DELETE',
        body: JSON.stringify({ fileUrl })
    }),
    
    // Get upload stats
    getStats: () => apiRequest('/uploads/stats')
};

// ==================== Categories API ====================

const categoriesApi = {
    // Get all categories
    getCategories: () => apiRequest('/categories'),
    
    // Get category by ID
    getCategory: (id) => apiRequest(`/categories/${id}`)
};

export {
    apiRequest,
    uploadFile,
    appsApi,
    ratingsApi,
    sliderApi,
    uploadApi,
    categoriesApi
};
