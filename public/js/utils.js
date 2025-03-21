/**
 * Cyprus Classified - Utility Functions
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether phone number is valid
 */
function isValidPhone(phone) {
  // Allow +, spaces, and digits
  const phoneRegex = /^[+\s\d]{7,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: EUR)
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'EUR') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format date to relative time (e.g., "2 days ago")
 * @param {string|Date} date - Date to format
 * @returns {string} Relative time string
 */
function formatRelativeTime(date) {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = Math.abs(now - dateObj);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      if (diffMinutes === 0) {
        return 'just now';
      }
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  }
  
  if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }
  
  if (diffDays < 30) {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Truncate text to specified length and add ellipsis
 * @param {string} text - Text to truncate
 * @param {number} length - Maximum length (default: 100)
 * @returns {string} Truncated text
 */
function truncateText(text, length = 100) {
  if (!text) return '';
  
  if (text.length <= length) {
    return text;
  }
  
  return text.substring(0, length) + '...';
}

/**
 * Debounce function to limit how often a function is called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
  let timeout;
  
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * Generate a random ID
 * @param {number} length - Length of ID (default: 8)
 * @returns {string} Random ID
 */
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return id;
}

/**
 * Get URL parameters as an object
 * @returns {Object} URL parameters
 */
function getUrlParams() {
  const params = {};
  const queryString = window.location.search;
  
  if (!queryString) return params;
  
  const urlParams = new URLSearchParams(queryString);
  
  for (const [key, value] of urlParams.entries()) {
    params[key] = value;
  }
  
  return params;
}

/**
 * Set URL parameters without page reload
 * @param {Object} params - Parameters to set
 */
function setUrlParams(params) {
  const url = new URL(window.location);
  
  // Clear existing parameters
  url.search = '';
  
  // Add new parameters
  for (const key in params) {
    if (params[key]) {
      url.searchParams.set(key, params[key]);
    }
  }
  
  // Update URL without reload
  window.history.pushState({}, '', url);
}

/**
 * Serialize form data to an object
 * @param {HTMLFormElement} form - Form element
 * @returns {Object} Form data as an object
 */
function serializeForm(form) {
  const formData = new FormData(form);
  const data = {};
  
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }
  
  return data;
}

/**
 * Create DOM element with attributes and children
 * @param {string} tag - HTML tag
 * @param {Object} attributes - Element attributes
 * @param {string|Array} children - Element children
 * @returns {HTMLElement} Created element
 */
function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  for (const key in attributes) {
    if (key === 'className') {
      element.className = attributes[key];
    } else if (key === 'style' && typeof attributes[key] === 'object') {
      Object.assign(element.style, attributes[key]);
    } else {
      element.setAttribute(key, attributes[key]);
    }
  }
  
  // Add children
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        element.appendChild(child);
      }
    });
  }
  
  return element;
}

/**
 * Show loading spinner
 * @param {HTMLElement} container - Container element
 * @param {string} size - Size (sm, md, lg)
 * @returns {HTMLElement} Spinner element
 */
function showSpinner(container, size = 'md') {
  const spinner = createElement('div', {
    className: `spinner-border text-primary spinner-border-${size}`,
    role: 'status'
  }, [
    createElement('span', { className: 'visually-hidden' }, 'Loading...')
  ]);
  
  // Clear container
  container.innerHTML = '';
  container.appendChild(spinner);
  
  return spinner;
}

/**
 * Hide loading spinner
 * @param {HTMLElement} container - Container element
 * @param {HTMLElement} spinner - Spinner element
 */
function hideSpinner(container, spinner) {
  if (spinner && spinner.parentNode === container) {
    container.removeChild(spinner);
  }
}

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @param {Function} callback - Callback function
 */
function handleApiError(error, callback) {
  console.error('API Error:', error);
  
  const message = error.message || 'An error occurred. Please try again.';
  
  // Show error message (using callback to support different UI approaches)
  if (typeof callback === 'function') {
    callback(message);
  } else {
    alert(message);
  }
  
  // Handle authentication errors
  if (error.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth:logout'));
  }
} 