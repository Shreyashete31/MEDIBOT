// Accessibility and Dark Mode Manager
class AccessibilityManager {
  constructor() {
    this.isDarkMode = false;
    this.fontSize = 'normal';
    this.highContrast = false;
    this.reducedMotion = false;
    this.init();
  }

  init() {
    this.loadSettings();
    this.createAccessibilityPanel();
    this.setupKeyboardNavigation();
    this.setupScreenReaderSupport();
    this.applySettings();
  }

  loadSettings() {
    const settings = JSON.parse(localStorage.getItem('accessibilitySettings') || '{}');
    this.isDarkMode = settings.isDarkMode || false;
    this.fontSize = settings.fontSize || 'normal';
    this.highContrast = settings.highContrast || false;
    this.reducedMotion = settings.reducedMotion || false;
  }

  saveSettings() {
    const settings = {
      isDarkMode: this.isDarkMode,
      fontSize: this.fontSize,
      highContrast: this.highContrast,
      reducedMotion: this.reducedMotion
    };
    localStorage.setItem('accessibilitySettings', JSON.stringify(settings));
  }

  createAccessibilityPanel() {
    // Create accessibility toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.innerHTML = '<i class="fas fa-universal-access"></i>';
    toggleBtn.className = 'accessibility-toggle';
    toggleBtn.setAttribute('aria-label', 'Open accessibility settings');
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background: var(--primary-color);
      color: white;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 1000;
      font-size: 1.2rem;
      transition: all 0.3s ease;
    `;

    toggleBtn.addEventListener('click', () => {
      this.togglePanel();
    });

    document.body.appendChild(toggleBtn);

    // Create accessibility panel
    this.panel = document.createElement('div');
    this.panel.className = 'accessibility-panel';
    this.panel.style.cssText = `
      position: fixed;
      bottom: 80px;
      left: 20px;
      background: var(--surface);
      color: var(--text-primary);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      padding: 1.5rem;
      min-width: 280px;
      z-index: 1001;
      display: none;
      border: 1px solid var(--border-color);
    `;

    this.panel.innerHTML = `
      <h3 style="margin: 0 0 1rem; color: var(--text-primary); font-size: 1.1rem;">Accessibility Settings</h3>
      
      <div style="margin-bottom: 1rem;">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0.5rem;">
          <input type="checkbox" id="darkModeToggle" ${this.isDarkMode ? 'checked' : ''}>
          <span>Dark Mode</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0.5rem;">
          <input type="checkbox" id="highContrastToggle" ${this.highContrast ? 'checked' : ''}>
          <span>High Contrast</span>
        </label>
        
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer; margin-bottom: 0.5rem;">
          <input type="checkbox" id="reducedMotionToggle" ${this.reducedMotion ? 'checked' : ''}>
          <span>Reduce Motion</span>
        </label>
      </div>
      
      <div style="margin-bottom: 1rem;">
        <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Font Size</label>
        <select id="fontSizeSelect" style="width: 100%; padding: 0.5rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--surface); color: var(--text-primary);">
          <option value="small" ${this.fontSize === 'small' ? 'selected' : ''}>Small</option>
          <option value="normal" ${this.fontSize === 'normal' ? 'selected' : ''}>Normal</option>
          <option value="large" ${this.fontSize === 'large' ? 'selected' : ''}>Large</option>
          <option value="xlarge" ${this.fontSize === 'xlarge' ? 'selected' : ''}>Extra Large</option>
        </select>
      </div>
      
      <div style="display: flex; gap: 0.5rem;">
        <button id="resetSettings" style="flex: 1; padding: 0.5rem; background: var(--background); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">
          Reset
        </button>
        <button id="closePanel" style="flex: 1; padding: 0.5rem; background: var(--primary-color); color: white; border: none; border-radius: 4px; cursor: pointer;">
          Close
        </button>
      </div>
    `;

    document.body.appendChild(this.panel);

    // Add event listeners
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
      this.isDarkMode = e.target.checked;
      this.applySettings();
    });

    document.getElementById('highContrastToggle').addEventListener('change', (e) => {
      this.highContrast = e.target.checked;
      this.applySettings();
    });

    document.getElementById('reducedMotionToggle').addEventListener('change', (e) => {
      this.reducedMotion = e.target.checked;
      this.applySettings();
    });

    document.getElementById('fontSizeSelect').addEventListener('change', (e) => {
      this.fontSize = e.target.value;
      this.applySettings();
    });

    document.getElementById('resetSettings').addEventListener('click', () => {
      this.resetSettings();
    });

    document.getElementById('closePanel').addEventListener('click', () => {
      this.togglePanel();
    });
  }

  togglePanel() {
    const isVisible = this.panel.style.display !== 'none';
    this.panel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
      // Focus first input when opening
      setTimeout(() => {
        document.getElementById('darkModeToggle').focus();
      }, 100);
    }
  }

  applySettings() {
    const root = document.documentElement;
    
    // Dark mode
    if (this.isDarkMode) {
      root.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }

    // High contrast
    if (this.highContrast) {
      root.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
    }

    // Reduced motion
    if (this.reducedMotion) {
      root.classList.add('reduced-motion');
      document.body.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
      document.body.classList.remove('reduced-motion');
    }

    // Font size
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-xlarge');
    root.classList.add(`font-${this.fontSize}`);

    this.saveSettings();
    this.updateCSSVariables();
  }

  updateCSSVariables() {
    const root = document.documentElement;
    
    if (this.isDarkMode) {
      root.style.setProperty('--text-primary', '#ffffff');
      root.style.setProperty('--text-secondary', '#b0b0b0');
      root.style.setProperty('--background', '#121212');
      root.style.setProperty('--surface', '#1e1e1e');
      root.style.setProperty('--border-color', '#333333');
    } else {
      root.style.setProperty('--text-primary', '#212121');
      root.style.setProperty('--text-secondary', '#757575');
      root.style.setProperty('--background', '#fafafa');
      root.style.setProperty('--surface', '#ffffff');
      root.style.setProperty('--border-color', '#e0e0e0');
    }

    if (this.highContrast) {
      root.style.setProperty('--text-primary', this.isDarkMode ? '#ffffff' : '#000000');
      root.style.setProperty('--text-secondary', this.isDarkMode ? '#ffffff' : '#000000');
      root.style.setProperty('--background', this.isDarkMode ? '#000000' : '#ffffff');
      root.style.setProperty('--surface', this.isDarkMode ? '#000000' : '#ffffff');
      root.style.setProperty('--border-color', this.isDarkMode ? '#ffffff' : '#000000');
    }

    // Font size variables
    const fontSizeMap = {
      small: '0.875rem',
      normal: '1rem',
      large: '1.125rem',
      xlarge: '1.25rem'
    };

    root.style.setProperty('--base-font-size', fontSizeMap[this.fontSize]);
  }

  resetSettings() {
    this.isDarkMode = false;
    this.fontSize = 'normal';
    this.highContrast = false;
    this.reducedMotion = false;
    
    // Update UI
    document.getElementById('darkModeToggle').checked = false;
    document.getElementById('highContrastToggle').checked = false;
    document.getElementById('reducedMotionToggle').checked = false;
    document.getElementById('fontSizeSelect').value = 'normal';
    
    this.applySettings();
  }

  setupKeyboardNavigation() {
    // Add skip links
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: var(--primary-color);
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 1000;
      transition: top 0.3s;
    `;
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);

    // Add keyboard navigation for custom elements
    document.addEventListener('keydown', (e) => {
      // ESC key to close panels
      if (e.key === 'Escape') {
        if (this.panel.style.display !== 'none') {
          this.togglePanel();
        }
      }
      
      // Alt + A to open accessibility panel
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        this.togglePanel();
      }
    });
  }

  setupScreenReaderSupport() {
    // Add ARIA labels to interactive elements
    const interactiveElements = document.querySelectorAll('button, input, select, textarea, a');
    interactiveElements.forEach(element => {
      if (!element.getAttribute('aria-label') && !element.textContent.trim()) {
        const title = element.getAttribute('title') || element.getAttribute('placeholder');
        if (title) {
          element.setAttribute('aria-label', title);
        }
      }
    });

    // Add role attributes
    const cards = document.querySelectorAll('.remedy-card, .first-aid-card, .contact-card');
    cards.forEach(card => {
      card.setAttribute('role', 'article');
    });

    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
      if (!button.getAttribute('aria-label') && !button.textContent.trim()) {
        button.setAttribute('aria-label', 'Button');
      }
    });

    // Add live regions for dynamic content
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `;
    document.body.appendChild(liveRegion);
    
    // Function to announce to screen readers
    window.announceToScreenReader = (message) => {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    };
  }
}

// Global CSS for accessibility features
const accessibilityCSS = `
  /* Dark Mode */
  .dark-mode {
    --text-primary: #ffffff !important;
    --text-secondary: #b0b0b0 !important;
    --background: #121212 !important;
    --surface: #1e1e1e !important;
    --border-color: #333333 !important;
  }

  .dark-mode body {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%) !important;
  }

  /* High Contrast */
  .high-contrast {
    --text-primary: #000000 !important;
    --text-secondary: #000000 !important;
    --background: #ffffff !important;
    --surface: #ffffff !important;
    --border-color: #000000 !important;
    --primary-color: #0000ff !important;
  }

  .high-contrast .dark-mode {
    --text-primary: #ffffff !important;
    --text-secondary: #ffffff !important;
    --background: #000000 !important;
    --surface: #000000 !important;
    --border-color: #ffffff !important;
    --primary-color: #ffff00 !important;
  }

  /* Font Sizes */
  .font-small {
    --base-font-size: 0.875rem !important;
  }

  .font-normal {
    --base-font-size: 1rem !important;
  }

  .font-large {
    --base-font-size: 1.125rem !important;
  }

  .font-xlarge {
    --base-font-size: 1.25rem !important;
  }

  .font-small * {
    font-size: calc(var(--base-font-size) * 0.9) !important;
  }

  .font-large * {
    font-size: calc(var(--base-font-size) * 1.1) !important;
  }

  .font-xlarge * {
    font-size: calc(var(--base-font-size) * 1.2) !important;
  }

  /* Reduced Motion */
  .reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Focus Indicators */
  *:focus {
    outline: 2px solid var(--primary-color) !important;
    outline-offset: 2px !important;
  }

  .high-contrast *:focus {
    outline: 3px solid var(--primary-color) !important;
    outline-offset: 3px !important;
  }

  /* High Contrast Borders */
  .high-contrast .remedy-card,
  .high-contrast .first-aid-card,
  .high-contrast .contact-card {
    border: 2px solid var(--border-color) !important;
  }

  /* Screen Reader Only */
  .sr-only {
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  }
`;

// Inject CSS
const accessibilityStyle = document.createElement('style');
accessibilityStyle.textContent = accessibilityCSS;
document.head.appendChild(accessibilityStyle);

// Initialize accessibility manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.accessibilityManager = new AccessibilityManager();
  });
} else {
  window.accessibilityManager = new AccessibilityManager();
}
