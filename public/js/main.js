/**
 * Main JavaScript file for Cyprus Classified
 * Simple version for testing CSS and JS functionality
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Cyprus Classified app initialized');
  
  // DOM Elements
  const searchForm = document.getElementById('searchForm');
  const categoryCards = document.querySelectorAll('.card');
  
  // Initialize UI
  initializeUI();
  
  // Log CSS information
  checkCssLoading();
  
  // Event listeners
  if (searchForm) {
    searchForm.addEventListener('submit', function(e) {
      e.preventDefault();
      console.log('Search submitted:', searchForm.querySelector('input').value);
      alert('Search for: ' + searchForm.querySelector('input').value);
    });
  }
  
  // Add hover effects to category cards
  categoryCards.forEach(card => {
    card.addEventListener('mouseenter', function() {
      console.log('Card hover:', this.querySelector('h5').textContent);
    });
    
    card.addEventListener('click', function() {
      const category = this.querySelector('h5').textContent;
      console.log('Selected category:', category);
      alert('You selected: ' + category);
    });
  });

  // Generate placeholder images
  generatePlaceholderImages();

  // Add Bootstrap modal HTML to the page for login and register
  const modalsHTML = `
    <!-- Login Modal -->
    <div class="modal fade" id="loginModal" tabindex="-1" aria-labelledby="loginModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="loginModalLabel">Login</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="loginForm">
              <div class="mb-3">
                <label for="loginEmail" class="form-label">Email address</label>
                <input type="email" class="form-control" id="loginEmail" placeholder="name@example.com" required>
              </div>
              <div class="mb-3">
                <label for="loginPassword" class="form-label">Password</label>
                <input type="password" class="form-control" id="loginPassword" required>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="rememberCheck">
                <label class="form-check-label" for="rememberCheck">Remember me</label>
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary">Login</button>
              </div>
              <div class="text-center mt-3">
                <a href="#" class="text-decoration-none small" id="forgotPasswordLink">Forgot password?</a>
              </div>
            </form>
            <hr class="my-4">
            <div class="text-center">
              <p class="mb-3">Don't have an account?</p>
              <button class="btn btn-outline-primary" id="switchToRegisterBtn">Register</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Register Modal -->
    <div class="modal fade" id="registerModal" tabindex="-1" aria-labelledby="registerModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="registerModalLabel">Create Account</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body">
            <form id="registerForm">
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label for="firstName" class="form-label">First Name</label>
                  <input type="text" class="form-control" id="firstName" required>
                </div>
                <div class="col-md-6 mb-3">
                  <label for="lastName" class="form-label">Last Name</label>
                  <input type="text" class="form-control" id="lastName" required>
                </div>
              </div>
              <div class="mb-3">
                <label for="registerEmail" class="form-label">Email address</label>
                <input type="email" class="form-control" id="registerEmail" required>
              </div>
              <div class="mb-3">
                <label for="registerPhone" class="form-label">Phone Number</label>
                <input type="tel" class="form-control" id="registerPhone" required>
              </div>
              <div class="mb-3">
                <label for="registerPassword" class="form-label">Password</label>
                <input type="password" class="form-control" id="registerPassword" required>
                <div class="form-text">Must be at least 8 characters with letters and numbers</div>
              </div>
              <div class="mb-3">
                <label for="confirmPassword" class="form-label">Confirm Password</label>
                <input type="password" class="form-control" id="confirmPassword" required>
              </div>
              <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="termsCheck" required>
                <label class="form-check-label" for="termsCheck">
                  I agree to the <a href="#" class="text-decoration-none">Terms & Conditions</a> and <a href="#" class="text-decoration-none">Privacy Policy</a>
                </label>
              </div>
              <div class="d-grid">
                <button type="submit" class="btn btn-primary">Create Account</button>
              </div>
            </form>
            <hr class="my-4">
            <div class="text-center">
              <p class="mb-3">Already have an account?</p>
              <button class="btn btn-outline-primary" id="switchToLoginBtn">Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Append modals to body
  document.body.insertAdjacentHTML('beforeend', modalsHTML);

  // Initialize Bootstrap components
  const loginModal = new bootstrap.Modal(document.getElementById('loginModal'));
  const registerModal = new bootstrap.Modal(document.getElementById('registerModal'));

  // Login button click handler
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', function() {
      loginModal.show();
    });
  }

  // Register button click handler
  const registerBtn = document.getElementById('registerBtn');
  if (registerBtn) {
    registerBtn.addEventListener('click', function() {
      registerModal.show();
    });
  }

  // Join Now button click handler
  const joinNowBtn = document.getElementById('joinNowBtn');
  if (joinNowBtn) {
    joinNowBtn.addEventListener('click', function() {
      registerModal.show();
    });
  }

  // Switch between login and register modals
  const switchToRegisterBtn = document.getElementById('switchToRegisterBtn');
  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener('click', function() {
      loginModal.hide();
      setTimeout(() => {
        registerModal.show();
      }, 400);
    });
  }

  const switchToLoginBtn = document.getElementById('switchToLoginBtn');
  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', function() {
      registerModal.hide();
      setTimeout(() => {
        loginModal.show();
      }, 400);
    });
  }

  // Form submission handlers (just for demo - would connect to backend in real app)
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Simulate login success (in real app this would call an API)
      const email = document.getElementById('loginEmail').value;
      
      // Hide modal
      loginModal.hide();
      
      // Update UI to show logged in state
      updateUIForLoggedInUser(email);
      
      // Show toast notification
      showToast('Welcome back! You have successfully logged in.');
    });
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Validate passwords match
      const password = document.getElementById('registerPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      
      if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
      }
      
      // Simulate registration success (in real app this would call an API)
      const email = document.getElementById('registerEmail').value;
      const firstName = document.getElementById('firstName').value;
      
      // Hide modal
      registerModal.hide();
      
      // Update UI to show logged in state
      updateUIForLoggedInUser(email);
      
      // Show toast notification
      showToast(`Welcome to Cyprus Classified, ${firstName}! Your account has been created.`);
    });
  }

  // Function to update UI when user is logged in
  function updateUIForLoggedInUser(email) {
    // Get navbar buttons container
    const navButtons = document.querySelector('.navbar .d-flex');
    
    if (navButtons) {
      // Replace login/register buttons with user dropdown
      navButtons.innerHTML = `
        <div class="dropdown">
          <button class="btn dropdown-toggle" type="button" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle me-1"></i> ${email.split('@')[0]}
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>My Profile</a></li>
            <li><a class="dropdown-item" href="#"><i class="bi bi-card-list me-2"></i>My Listings</a></li>
            <li><a class="dropdown-item" href="#"><i class="bi bi-heart me-2"></i>Favorites</a></li>
            <li><a class="dropdown-item" href="#"><i class="bi bi-chat-dots me-2"></i>Messages</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </div>
      `;
      
      // Add logout handler
      document.getElementById('logoutBtn').addEventListener('click', function() {
        // Reset UI to logged out state
        navButtons.innerHTML = `
          <button class="btn me-2" id="loginBtn">Login</button>
          <button class="btn btn-primary rounded-pill" id="registerBtn">Register</button>
        `;
        
        // Reattach event listeners
        document.getElementById('loginBtn').addEventListener('click', function() {
          loginModal.show();
        });
        document.getElementById('registerBtn').addEventListener('click', function() {
          registerModal.show();
        });
        
        // Show toast notification
        showToast('You have been logged out.');
      });
    }
  }

  // Toast notification function
  function showToast(message) {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      document.body.appendChild(toastContainer);
    }
    
    // Create toast
    const toastId = 'toast-' + Date.now();
    const toastHTML = `
      <div id="${toastId}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="toast-header">
          <i class="bi bi-house-heart-fill me-2 text-primary"></i>
          <strong class="me-auto">Cyprus Classified</strong>
          <small>Just now</small>
          <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
          ${message}
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(document.getElementById(toastId));
    toast.show();
    
    // Remove toast after it's hidden
    document.getElementById(toastId).addEventListener('hidden.bs.toast', function() {
      this.remove();
    });
  }

  /**
   * Initialize UI components
   */
  function initializeUI() {
    console.log('Initializing UI components');
    
    // Add a debug message to the debug info section
    const debugInfo = document.querySelector('.debug-info');
    if (debugInfo) {
      const timestamp = new Date().toLocaleTimeString();
      const debugMessage = document.createElement('div');
      debugMessage.innerHTML = `
        <hr>
        <h5>JavaScript Initialized</h5>
        <p>Time: ${timestamp}</p>
        <p>User Agent: ${navigator.userAgent}</p>
        <p>Window size: ${window.innerWidth}x${window.innerHeight}</p>
      `;
      debugInfo.appendChild(debugMessage);
    }
    
    // Apply some dynamic styling to test JS functionality
    document.querySelectorAll('.card').forEach((card, index) => {
      // Add a slight delay to each card to create a staggered effect
      setTimeout(() => {
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }
  
  /**
   * Check if CSS is properly loaded
   */
  function checkCssLoading() {
    console.log('Checking CSS loading status...');
    
    // Check loaded stylesheets
    const stylesheets = Array.from(document.styleSheets);
    console.log('Total stylesheets loaded:', stylesheets.length);
    
    // Log each stylesheet URL
    stylesheets.forEach((sheet, index) => {
      try {
        const sheetUrl = sheet.href || 'inline style';
        console.log(`[${index}] ${sheetUrl}`);
        
        // Check if it's our main.css
        if (sheetUrl.includes('main.css')) {
          console.log('✅ main.css is loaded!');
          testCssRules(sheet);
        }
      } catch (err) {
        console.log(`[${index}] Error accessing stylesheet:`, err.message);
      }
    });
    
    // Test some computed styles
    const hero = document.querySelector('.hero-section');
    if (hero) {
      const heroStyles = window.getComputedStyle(hero);
      console.log('Hero section background:', heroStyles.backgroundColor);
      console.log('Hero section padding:', heroStyles.padding);
    }
  }
  
  /**
   * Test CSS rules from a stylesheet
   */
  function testCssRules(stylesheet) {
    try {
      const rules = stylesheet.cssRules || stylesheet.rules;
      console.log(`CSS Rules count: ${rules.length}`);
      
      // Log a sample of the rules
      for (let i = 0; i < Math.min(5, rules.length); i++) {
        console.log(`Rule ${i}:`, rules[i].cssText);
      }
    } catch (err) {
      console.log('Cannot access CSS rules due to CORS policy. This is normal for cross-origin stylesheets.');
    }
  }

  // Generate placeholder images
  function generatePlaceholderImages() {
    // Find all img elements with placeholder URLs
    const placeholderImages = document.querySelectorAll('img[src*="placeholder.com"]');
    
    placeholderImages.forEach(img => {
      const originalSrc = img.src;
      const alt = img.alt || 'Placeholder';
      
      // Parse size and text from the original src
      let width = 300;
      let height = 200;
      let bgColor = '3498db';
      let textColor = 'ffffff';
      let text = alt.replace(/\s+/g, '+');
      
      if (originalSrc.includes('placeholder.com')) {
        const sizeMatch = originalSrc.match(/(\d+)x(\d+)/);
        if (sizeMatch) {
          width = parseInt(sizeMatch[1]);
          height = parseInt(sizeMatch[2]);
        }
        
        const textMatch = originalSrc.match(/text=([^&]+)/);
        if (textMatch) {
          text = textMatch[1];
        }
      }
      
      // Create placeholder
      const placeholderSrc = createPlaceholderImage(width, height, bgColor, textColor, text);
      img.src = placeholderSrc;
    });
  }
  
  function createPlaceholderImage(width, height, bgColor, textColor, text) {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    // Get the context
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = `#${bgColor}`;
    ctx.fillRect(0, 0, width, height);
    
    // Draw text
    ctx.fillStyle = `#${textColor}`;
    ctx.font = `bold ${Math.floor(width / 20)}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Handle line breaks for long text (split by +)
    const lines = text.split('+');
    const lineHeight = Math.floor(width / 15);
    const startY = (height / 2) - ((lines.length - 1) * lineHeight / 2);
    
    lines.forEach((line, i) => {
      ctx.fillText(line, width / 2, startY + (i * lineHeight));
    });
    
    // Return base64 image
    return canvas.toDataURL('image/jpeg', 0.8);
  }
});