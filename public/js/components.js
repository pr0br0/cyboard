/**
 * Cyprus Classified - UI Components
 */

/**
 * Create a listing card
 * @param {Object} listing - Listing data
 * @returns {string} HTML string for listing card
 */
function createListingCard(listing) {
  const imageUrl = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'images/placeholder.jpg';
  
  return `
    <div class="col-md-6 col-lg-4 mb-4">
      <div class="listing-card position-relative">
        <button class="wishlist-button" data-id="${listing._id}">
          <i class="bi bi-heart"></i>
        </button>
        <a href="#" class="card-link" data-listing-id="${listing._id}" data-action="view-listing">
          <img src="${imageUrl}" class="card-img-top" alt="${listing.title}">
          <div class="card-body">
            <div class="d-flex justify-content-between">
              <p class="card-price mb-2">${formatCurrency(listing.price)}</p>
              <p class="card-date mb-0">${formatRelativeTime(listing.createdAt)}</p>
            </div>
            <h5 class="card-title">${listing.title}</h5>
            <p class="card-location mb-2">
              <i class="bi bi-geo-alt"></i> ${listing.city}
            </p>
            <p class="card-text text-truncate">${listing.description}</p>
            ${listing.category ? `<span class="badge bg-light text-dark">${listing.category.name}</span>` : ''}
          </div>
        </a>
      </div>
    </div>
  `;
}

/**
 * Create a category card
 * @param {Object} category - Category data
 * @returns {string} HTML string for category card
 */
function createCategoryCard(category) {
  if (!category) return '';
  
  // Get image URL or placeholder
  const imageUrl = category.image || '/images/category-placeholder.jpg';
  
  return `
    <div class="col-6 col-md-3 mb-4">
      <div class="card category-card h-100" data-category-id="${category._id}">
        <div class="card-img-overlay d-flex align-items-center justify-content-center">
          <h5 class="card-title text-white">${category.name.en || category.name}</h5>
        </div>
        <img src="${imageUrl}" class="card-img h-100" alt="${category.name.en || category.name}">
      </div>
    </div>
  `;
}

/**
 * Create pagination controls
 * @param {Object} pagination - Pagination data
 * @param {Function} callback - Click callback function
 * @returns {string} HTML string for pagination
 */
function createPagination(pagination, callback) {
  if (!pagination) return '';
  
  const { page, pages, total } = pagination;
  
  if (pages <= 1) return '';
  
  let paginationHtml = `
    <nav aria-label="Listings pagination">
      <ul class="pagination justify-content-center">
        <li class="page-item ${page <= 1 ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${page - 1}" aria-label="Previous">
            <span aria-hidden="true">&laquo;</span>
          </a>
        </li>
  `;
  
  // First page
  if (page > 3) {
    paginationHtml += `
      <li class="page-item">
        <a class="page-link" href="#" data-page="1">1</a>
      </li>
      ${page > 4 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
    `;
  }
  
  // Page numbers
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) {
    paginationHtml += `
      <li class="page-item ${page === i ? 'active' : ''}">
        <a class="page-link" href="#" data-page="${i}">${i}</a>
      </li>
    `;
  }
  
  // Last page
  if (page < pages - 2) {
    paginationHtml += `
      ${page < pages - 3 ? '<li class="page-item disabled"><span class="page-link">...</span></li>' : ''}
      <li class="page-item">
        <a class="page-link" href="#" data-page="${pages}">${pages}</a>
      </li>
    `;
  }
  
  paginationHtml += `
        <li class="page-item ${page >= pages ? 'disabled' : ''}">
          <a class="page-link" href="#" data-page="${page + 1}" aria-label="Next">
            <span aria-hidden="true">&raquo;</span>
          </a>
        </li>
      </ul>
    </nav>
  `;
  
  if (callback && typeof callback === 'function') {
    // Add event listeners after insertion into DOM
    setTimeout(() => {
      document.querySelectorAll('.pagination .page-link').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetPage = parseInt(e.target.closest('.page-link').dataset.page);
          if (!isNaN(targetPage)) {
            callback(targetPage);
          }
        });
      });
    }, 0);
  }
  
  return paginationHtml;
}

/**
 * Create a filter form
 * @param {Array} categories - Categories for dropdown
 * @param {Object} currentFilters - Current filter values
 * @returns {string} HTML string for filter form
 */
function createFilterForm(categories = [], currentFilters = {}) {
  const categoryOptions = categories.map(category => 
    `<option value="${category._id}" ${currentFilters.category === category._id ? 'selected' : ''}>
      ${category.name.en || category.name}
    </option>`
  ).join('');
  
  return `
    <div class="card mb-4">
      <div class="card-header">
        <h5 class="mb-0">Filter Listings</h5>
      </div>
      <div class="card-body">
        <form id="filterForm">
          <div class="mb-3">
            <label for="category" class="form-label">Category</label>
            <select class="form-select" id="category" name="category">
              <option value="">All Categories</option>
              ${categoryOptions}
            </select>
          </div>
          
          <div class="mb-3">
            <label class="form-label">Price Range</label>
            <div class="row g-2">
              <div class="col">
                <div class="input-group">
                  <span class="input-group-text">€</span>
                  <input type="number" class="form-control" id="priceMin" name="priceMin" 
                    placeholder="Min" value="${currentFilters.priceMin || ''}">
                </div>
              </div>
              <div class="col">
                <div class="input-group">
                  <span class="input-group-text">€</span>
                  <input type="number" class="form-control" id="priceMax" name="priceMax" 
                    placeholder="Max" value="${currentFilters.priceMax || ''}">
                </div>
              </div>
            </div>
          </div>
          
          <div class="mb-3">
            <label for="sort" class="form-label">Sort By</label>
            <select class="form-select" id="sort" name="sort">
              <option value="newest" ${currentFilters.sort === 'newest' ? 'selected' : ''}>
                Newest First
              </option>
              <option value="oldest" ${currentFilters.sort === 'oldest' ? 'selected' : ''}>
                Oldest First
              </option>
              <option value="price_low" ${currentFilters.sort === 'price_low' ? 'selected' : ''}>
                Price: Low to High
              </option>
              <option value="price_high" ${currentFilters.sort === 'price_high' ? 'selected' : ''}>
                Price: High to Low
              </option>
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary w-100">Apply Filters</button>
        </form>
      </div>
    </div>
  `;
}

/**
 * Create a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Message type (success, danger, warning, info)
 * @returns {HTMLElement} Toast element
 */
function createToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastId = 'toast-' + Date.now();
  const toastEl = document.createElement('div');
  toastEl.id = toastId;
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  toastContainer.appendChild(toastEl);
  
  // Initialize and show toast
  const toast = new bootstrap.Toast(toastEl, {
    autohide: true,
    delay: 5000
  });
  
  toast.show();
  
  // Remove toast element after it's hidden
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
  
  return toastEl;
}

/**
 * Create a modal dialog
 * @param {string} id - Modal ID
 * @param {string} title - Modal title
 * @param {string} body - Modal body content
 * @param {Object} options - Additional options
 * @returns {HTMLElement} Modal element
 */
function createModal(id, title, body, options = {}) {
  const modalEl = document.createElement('div');
  modalEl.className = 'modal fade';
  modalEl.id = id;
  modalEl.setAttribute('tabindex', '-1');
  modalEl.setAttribute('aria-labelledby', `${id}Label`);
  modalEl.setAttribute('aria-hidden', 'true');
  
  const size = options.size ? `modal-${options.size}` : '';
  
  modalEl.innerHTML = `
    <div class="modal-dialog ${size}">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="${id}Label">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          ${body}
        </div>
        ${options.footer ? `
          <div class="modal-footer">
            ${options.footer}
          </div>
        ` : ''}
      </div>
    </div>
  `;
  
  document.body.appendChild(modalEl);
  
  // Initialize modal
  const modal = new bootstrap.Modal(modalEl);
  
  // Remove from DOM when hidden
  if (options.removeOnHide) {
    modalEl.addEventListener('hidden.bs.modal', () => {
      modalEl.remove();
    });
  }
  
  return {
    element: modalEl,
    instance: modal,
    show: () => modal.show(),
    hide: () => modal.hide()
  };
}

/**
 * Create a confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Function} onConfirm - Callback on confirm
 * @param {Function} onCancel - Callback on cancel
 * @param {Object} options - Additional options
 */
function createConfirmDialog(message, onConfirm, onCancel, options = {}) {
  const id = 'confirmModal-' + Date.now();
  const title = options.title || 'Confirm Action';
  
  const footer = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
      ${options.cancelText || 'Cancel'}
    </button>
    <button type="button" class="btn btn-${options.confirmButtonType || 'primary'}" id="${id}-confirm">
      ${options.confirmText || 'Confirm'}
    </button>
  `;
  
  const modal = createModal(id, title, message, {
    size: options.size || null,
    footer,
    removeOnHide: true
  });
  
  // Add event listeners
  const confirmBtn = document.getElementById(`${id}-confirm`);
  
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (typeof onConfirm === 'function') {
        onConfirm();
      }
      modal.hide();
    });
  }
  
  if (typeof onCancel === 'function') {
    modal.element.addEventListener('hidden.bs.modal', (e) => {
      if (e.target === modal.element) {
        onCancel();
      }
    });
  }
  
  // Show the modal
  modal.show();
  
  return modal;
}

/**
 * Create a loading skeleton
 * @param {string} type - Skeleton type (card, list, text)
 * @param {number} count - Number of items
 * @returns {string} HTML string for skeleton loader
 */
function createSkeleton(type = 'card', count = 3) {
  let skeletonHtml = '';
  
  switch (type) {
    case 'card':
      for (let i = 0; i < count; i++) {
        skeletonHtml += `
          <div class="col-md-6 col-lg-4 mb-4">
            <div class="card skeleton-card">
              <div class="skeleton-img"></div>
              <div class="card-body">
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="d-flex justify-content-between mt-3">
                  <div class="skeleton-price"></div>
                  <div class="skeleton-location"></div>
                </div>
              </div>
            </div>
          </div>
        `;
      }
      break;
      
    case 'list':
      for (let i = 0; i < count; i++) {
        skeletonHtml += `
          <div class="skeleton-list-item d-flex mb-3">
            <div class="skeleton-img-small me-3"></div>
            <div class="flex-grow-1">
              <div class="skeleton-title"></div>
              <div class="skeleton-text"></div>
            </div>
            <div class="skeleton-price"></div>
          </div>
        `;
      }
      break;
      
    case 'text':
      for (let i = 0; i < count; i++) {
        skeletonHtml += `<div class="skeleton-text mb-2"></div>`;
      }
      break;
  }
  
  return skeletonHtml;
}

/**
 * Create an image gallery
 * @param {Array} images - Image URLs
 * @param {string} containerId - Container element ID
 * @returns {string} HTML string for image gallery
 */
function createImageGallery(images, containerId = 'imageGallery') {
  if (!images || !images.length) {
    return `<div class="text-center py-5">No images available</div>`;
  }
  
  return `
    <div id="${containerId}" class="carousel slide" data-bs-ride="carousel">
      <div class="carousel-indicators">
        ${images.map((img, i) => `
          <button type="button" data-bs-target="#${containerId}" data-bs-slide-to="${i}" 
            ${i === 0 ? 'class="active" aria-current="true"' : ''} aria-label="Slide ${i+1}"></button>
        `).join('')}
      </div>
      <div class="carousel-inner">
        ${images.map((img, i) => `
          <div class="carousel-item ${i === 0 ? 'active' : ''}">
            <img src="${img.url || img}" class="d-block w-100" alt="Image ${i+1}">
          </div>
        `).join('')}
      </div>
      <button class="carousel-control-prev" type="button" data-bs-target="#${containerId}" data-bs-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Previous</span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#${containerId}" data-bs-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="visually-hidden">Next</span>
      </button>
    </div>
  `;
}

/**
 * Create empty state message
 * @param {string} message - Message to display
 * @param {string} icon - Bootstrap icon name
 * @returns {string} HTML string for empty state
 */
function createEmptyState(message = 'No data found', icon = 'inbox') {
  return `
    <div class="empty-state text-center py-5">
      <i class="bi bi-${icon} display-1 text-muted"></i>
      <h4 class="mt-3">${message}</h4>
    </div>
  `;
} 