/**
 * API utilities for making requests to the backend
 */
const API = {
  // Base URL for API requests
  baseUrl: '/api',
  
  // Store the auth token
  token: localStorage.getItem('token'),
  
  /**
   * Set the authentication token
   * @param {string} token - JWT token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },
  
  /**
   * Get authentication headers
   * @returns {Object} Headers object
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  },
  
  /**
   * Make a GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise resolving to response data
   */
  async get(endpoint, params = {}) {
    // Build query string
    const queryString = Object.keys(params).length 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
      
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}${queryString}`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  /**
   * Make a POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Data to send
   * @returns {Promise} Promise resolving to response data
   */
  async post(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  /**
   * Make a PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} data - Data to send
   * @returns {Promise} Promise resolving to response data
   */
  async put(endpoint, data = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(data)
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  /**
   * Make a DELETE request
   * @param {string} endpoint - API endpoint
   * @returns {Promise} Promise resolving to response data
   */
  async delete(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  /**
   * Upload files with form data
   * @param {string} endpoint - API endpoint
   * @param {FormData} formData - Form data with files
   * @param {Object} extraData - Additional data to include
   * @returns {Promise} Promise resolving to response data
   */
  async uploadFiles(endpoint, formData, extraData = {}) {
    // Add extra data to form data
    for (const key in extraData) {
      formData.append(key, 
        typeof extraData[key] === 'object' 
          ? JSON.stringify(extraData[key]) 
          : extraData[key]
      );
    }
    
    try {
      const headers = { 'Authorization': `Bearer ${this.token}` };
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData
      });
      
      return this.handleResponse(response);
    } catch (error) {
      return this.handleError(error);
    }
  },
  
  /**
   * Handle the API response
   * @param {Response} response - Fetch response object
   * @returns {Promise} Promise resolving to response data
   */
  async handleResponse(response) {
    const data = await response.json();
    
    if (!response.ok) {
      // Handle token expiration
      if (response.status === 401 && this.token) {
        this.setToken(null);
        window.dispatchEvent(new Event('auth:logout'));
      }
      
      throw {
        status: response.status,
        message: data.message || 'API request failed',
        errors: data.errors || []
      };
    }
    
    return data;
  },
  
  /**
   * Handle API errors
   * @param {Error} error - Error object
   * @returns {Promise} Promise rejecting with error
   */
  handleError(error) {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
};

// Auth API
const AuthAPI = {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} Promise resolving to user data with token
   */
  register(userData) {
    return API.post('/auth/register', userData);
  },
  
  /**
   * Login a user
   * @param {Object} credentials - Login credentials
   * @returns {Promise} Promise resolving to user data with token
   */
  login(credentials) {
    return API.post('/auth/login', credentials);
  },
  
  /**
   * Get current user profile
   * @returns {Promise} Promise resolving to user profile data
   */
  getProfile() {
    return API.get('/auth/profile');
  },
  
  /**
   * Update user profile
   * @param {Object} profileData - Updated profile data
   * @returns {Promise} Promise resolving to updated profile
   */
  updateProfile(profileData) {
    return API.put('/auth/profile', profileData);
  },
  
  /**
   * Change user password
   * @param {Object} passwordData - Password change data
   * @returns {Promise} Promise resolving to success message
   */
  changePassword(passwordData) {
    return API.post('/auth/change-password', passwordData);
  },
  
  /**
   * Request password reset
   * @param {Object} data - Email data
   * @returns {Promise} Promise resolving to success message
   */
  forgotPassword(data) {
    return API.post('/auth/forgot-password', data);
  },
  
  /**
   * Reset password with token
   * @param {Object} data - Reset data with token
   * @returns {Promise} Promise resolving to success message
   */
  resetPassword(data) {
    return API.post('/auth/reset-password', data);
  },
  
  /**
   * Logout the current user
   * @returns {Promise} Promise resolving to success message
   */
  logout() {
    const promise = API.post('/auth/logout');
    API.setToken(null);
    return promise;
  }
};

// Listings API
const ListingsAPI = {
  /**
   * Get all listings with optional filters
   * @param {Object} params - Filter parameters
   * @returns {Promise} Promise resolving to listings data
   */
  getListings(params = {}) {
    return API.get('/listings', params);
  },
  
  /**
   * Get a single listing by ID
   * @param {string} id - Listing ID
   * @returns {Promise} Promise resolving to listing data
   */
  getListing(id) {
    return API.get(`/listings/${id}`);
  },
  
  /**
   * Create a new listing
   * @param {Object} listingData - Listing data
   * @param {FileList} images - Image files
   * @returns {Promise} Promise resolving to created listing
   */
  createListing(listingData, images) {
    const formData = new FormData();
    
    // Add images
    if (images && images.length) {
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
    }
    
    return API.uploadFiles('/listings', formData, listingData);
  },
  
  /**
   * Update an existing listing
   * @param {string} id - Listing ID
   * @param {Object} listingData - Updated listing data
   * @param {FileList} images - New image files
   * @returns {Promise} Promise resolving to updated listing
   */
  updateListing(id, listingData, images) {
    if (images && images.length) {
      const formData = new FormData();
      for (let i = 0; i < images.length; i++) {
        formData.append('images', images[i]);
      }
      return API.uploadFiles(`/listings/${id}`, formData, listingData);
    } else {
      return API.put(`/listings/${id}`, listingData);
    }
  },
  
  /**
   * Delete a listing
   * @param {string} id - Listing ID
   * @returns {Promise} Promise resolving to success message
   */
  deleteListing(id) {
    return API.delete(`/listings/${id}`);
  },
  
  /**
   * Get user's own listings
   * @returns {Promise} Promise resolving to user's listings
   */
  getMyListings() {
    return API.get('/listings/my-listings');
  }
};

// Categories API
const CategoriesAPI = {
  /**
   * Get all categories
   * @param {Object} params - Query parameters
   * @returns {Promise} Promise resolving to categories data
   */
  getCategories(params = {}) {
    return API.get('/categories', params);
  },
  
  /**
   * Get a category by ID or slug
   * @param {string} identifier - Category ID or slug
   * @returns {Promise} Promise resolving to category data
   */
  getCategory(identifier) {
    return API.get(`/categories/${identifier}`);
  }
}; 