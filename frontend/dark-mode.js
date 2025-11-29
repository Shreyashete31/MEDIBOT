/**
 * Dark Mode Utility for HealthHub
 * Provides consistent dark mode functionality across all pages
 */

class DarkModeManager {
  constructor() {
    this.storageKey = 'darkMode';
    this.isDarkMode = false;
    this.observer = null; // will be created in init
    this.styleId = 'dark-mode-styles';
    this.init();
  }

  // Safe localStorage getters/setters
  safeGet(key) {
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : v;
    } catch (e) {
      // Storage unavailable (privacy mode, etc.)
      return null;
    }
  }

  safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      return false;
    }
  }

  init() {
    // Check for saved preference or system preference (defensive)
    const savedPreference = this.safeGet(this.storageKey);
    const systemMatches = (typeof window !== 'undefined' && window.matchMedia) ?
      window.matchMedia('(prefers-color-scheme: dark)').matches : false;

    this.isDarkMode = savedPreference !== null ? (savedPreference === 'true') : systemMatches;

    // Create an observer that updates toggle buttons on DOM changes
    this.observer = new MutationObserver(() => {
      try { this.updateToggleButtons(); } catch (e) { /* no-op */ }
    });

    const runApply = () => {
      this.applyDarkMode();
      this.applyAppSettings();
      this.updateToggleButtons();

      // Attach observer after body exists
      if (document && document.body) {
        try {
          this.observer.observe(document.body, { childList: true, subtree: true });
        } catch (e) {
          // ignore observer errors in restricted envs
        }
      }
    };

    if (document && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', runApply, { once: true });
    } else {
      runApply();
    }

    // Listen for system preference changes (backwards-compatible)
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mm = window.matchMedia('(prefers-color-scheme: dark)');
      if (typeof mm.addEventListener === 'function') {
        mm.addEventListener('change', (e) => {
          if (this.safeGet(this.storageKey) === null) {
            this.isDarkMode = !!e.matches;
            this.applyDarkMode();
            this.updateToggleButtons();
          }
        });
      } else if (typeof mm.addListener === 'function') {
        mm.addListener((e) => {
          if (this.safeGet(this.storageKey) === null) {
            this.isDarkMode = !!e.matches;
            this.applyDarkMode();
            this.updateToggleButtons();
          }
        });
      }
    }

    // Ensure styles are injected once
    this.injectStyles();
  }

  toggle() {
    this.isDarkMode = !this.isDarkMode;
    this.safeSet(this.storageKey, this.isDarkMode.toString());
    this.applyDarkMode();
    this.updateToggleButtons();
  }

  applyDarkMode() {
    const root = (typeof document !== 'undefined') ? document.documentElement : null;
    const body = (typeof document !== 'undefined') ? document.body : null;

    // Update theme-color meta immediately if head exists
    this.updateThemeColor();

    if (!root || !body) {
      // Defer if DOM isn't ready
      if (typeof document !== 'undefined' && document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.applyDarkMode(), { once: true });
      }
      return;
    }

    if (this.isDarkMode) {
      root.classList.add('dark-mode');
      body.classList.add('dark-mode');
    } else {
      root.classList.remove('dark-mode');
      body.classList.remove('dark-mode');
    }
  }

  applyAppSettings() {
    if (typeof document === 'undefined') return;
    let s = {};
    try { s = JSON.parse(localStorage.getItem('appSettings') || '{}'); } catch(e) { s = {}; }
    const root = document.documentElement;
    const body = document.body;
    if (!root || !body) return;
    if (s.fontSize) { root.style.fontSize = String(s.fontSize) + 'px'; }
    if (s.highContrast) { body.classList.add('high-contrast'); } else { body.classList.remove('high-contrast'); }
    if (s.screenReader) { body.classList.add('screen-reader-optimized'); } else { body.classList.remove('screen-reader-optimized'); }
    const speed = s.animationSpeed || 'normal';
    if (speed === 'none') { body.classList.add('reduce-motion'); } else { body.classList.remove('reduce-motion'); }
    try {
      const sysReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (speed === 'normal' && sysReduce) { body.classList.add('reduce-motion'); }
    } catch(e) {}
    let factor = '1';
    if (speed === 'slow') factor = '1.5'; else if (speed === 'fast') factor = '0.75';
    try { root.style.setProperty('--animation-factor', factor); } catch(e) {}
  }

  updateThemeColor() {
    if (typeof document === 'undefined') return;
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      try {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        if (document.head) document.head.appendChild(meta);
      } catch (e) {
        return;
      }
    }
    if (!meta) return;
    meta.content = this.isDarkMode ? '#1a1a1a' : '#009688';
  }

  updateToggleButtons() {
    if (typeof document === 'undefined') return;
    const toggles = document.querySelectorAll('.dark-mode-toggle');
    toggles.forEach(toggle => {
      try {
        // Ensure ARIA and keyboard support
        if (!toggle.hasAttribute('role')) toggle.setAttribute('role', 'switch');
        toggle.setAttribute('tabindex', toggle.getAttribute('tabindex') || '0');

        const state = this.isDarkMode;
        toggle.setAttribute('aria-checked', state ? 'true' : 'false');

        // Update icon safely
        const icon = toggle.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-moon', 'fa-sun', 'fas', 'far');
          if (state) {
            icon.classList.add('fas', 'fa-sun');
            toggle.title = 'Switch to Light Mode';
          } else {
            icon.classList.add('fas', 'fa-moon');
            toggle.title = 'Switch to Dark Mode';
          }
        }
      } catch (e) {
        // ignore per-element errors
      }
    });
  }

  getState() {
    return this.isDarkMode;
  }

  setState(isDark) {
    this.isDarkMode = !!isDark;
    this.safeSet(this.storageKey, this.isDarkMode.toString());
    this.applyDarkMode();
    this.updateToggleButtons();
  }

  injectStyles() {
    if (typeof document === 'undefined' || !document.head) return;
    if (document.getElementById(this.styleId)) return; // already injected

    const darkModeStyles = `
      .dark-mode-toggle {
        background: rgba(255,255,255,0.1);
        border: none; color: white; padding: 0.5rem; border-radius: 50%;
        cursor: pointer; font-size: 1.1rem; display:flex; align-items:center; justify-content:center;
        width:40px;height:40px; transition:transform .12s ease;
      }
      .dark-mode-toggle:hover { transform:scale(1.05); }
      :root { --animation-factor: 1; }
      .reduce-motion * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
      .dark-mode {
        --text-primary: #e7e9ea;
        --text-secondary: #b0b8c0;
        --background: #0f1215;
        --surface: #1a1f24;
        --border-color: #2a333a;
        --primary-color: #66c1ff;
        --primary-dark: #4aa7e6;
        --secondary-color: #85d39a;
        --accent-color: #ff9b80;
        --success-color: #4caf50;
        --error-color: #f44336;
        --warning-color: #ffb74d;
        --shadow: 0 2px 12px rgba(0,0,0,0.6);
        --shadow-hover: 0 4px 24px rgba(0,0,0,0.8);
        --gradient-primary: linear-gradient(135deg, #1f7bb6, #165f8c);
        --gradient-secondary: linear-gradient(135deg, #2f7a4a, #25663e);
      }
      body.dark-mode { background: linear-gradient(135deg,#0b0e11 0%, #101413 100%) !important; }
      .dark-mode .app-header { box-shadow: var(--shadow-hover); }
      .dark-mode .card, .dark-mode .settings-section, .dark-mode .action-card, .dark-mode .search-section { background: var(--surface); color: var(--text-primary); }
      .high-contrast.dark-mode { --border-color: #90caf9; }
    `;

    try {
      const styleSheet = document.createElement('style');
      styleSheet.id = this.styleId;
      styleSheet.type = 'text/css';
      styleSheet.appendChild(document.createTextNode(darkModeStyles));
      document.head.appendChild(styleSheet);
    } catch (e) {
      // fail silently if injection not allowed
    }
  }
}

// Create single global instance safely
if (typeof window !== 'undefined' && !window.darkModeManager) {
  window.darkModeManager = new DarkModeManager();
}

// Global helpers that use the manager
if (typeof window !== 'undefined') {
  window.toggleDarkMode = () => { if (window.darkModeManager) window.darkModeManager.toggle(); };
  window.setDarkMode = (isDark) => { if (window.darkModeManager) window.darkModeManager.setState(isDark); };
  window.getDarkMode = () => (window.darkModeManager ? window.darkModeManager.getState() : false);
}

// Navigation helper: open local pages safely.
// Usage: <a href="profile.html">Profile</a> or <button data-page="profile.html">Profile</button>
// or add class="nav-link" with an href/data-page. External links (http/https) are left untouched.
function navigateTo(page) {
  if (!page || typeof window === 'undefined') return;
  // If it's an anchor href like "#profile", allow normal behavior
  if (page.startsWith('#')) {
    window.location.hash = page;
    return;
  }
  // If it's an absolute URL (http/https) open normally
  const isExternal = /^https?:\/\//i.test(page);
  try {
    if (isExternal) {
      // let browser handle external links
      window.location.href = page;
    } else {
      // Normalize relative paths (allow "profile", "profile.html", "./profile.html")
      const normalized = page.indexOf('.') === -1 && !page.endsWith('/') ? `${page}.html` : page;
      window.location.href = normalized;
    }
  } catch (e) {
    // ignore navigation errors in restricted environments
  }
}

// Delegated click handler for navigation elements
document.addEventListener('click', function (e) {
  try {
    let el = e.target;
    while (el && el !== document) {
      if (el.matches && (el.matches('[data-page]') || el.matches('.nav-link') || (el.tagName === 'A' && el.getAttribute('href')))) {
        const page = el.getAttribute('data-page') || el.getAttribute('href');
        if (page) {
          e.preventDefault();
          navigateTo(page);
        }
        break;
      }
      el = el.parentElement;
    }
  } catch (e) {
    // ignore delegation errors in restricted environments
  }
});

document.addEventListener('keydown', function(e) {
  try {
    if (e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      const k = String(e.key || '').toLowerCase();
      if (k === 's') { e.preventDefault(); navigateTo('settings'); }
      else if (k === 'a') { e.preventDefault(); navigateTo('about'); }
      else if (k === 'h') { e.preventDefault(); navigateTo('3 home'); }
      else if (k === 'p') { e.preventDefault(); navigateTo('profile'); }
    }
    if (e.key === '/' && !e.altKey && !e.ctrlKey && !e.metaKey) {
      const active = document.activeElement;
      const isTextField = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable);
      if (!isTextField) {
        const input = document.querySelector('input[placeholder*="search" i], .search-container input, #firstAidSearch');
        if (input) { e.preventDefault(); input.focus(); try { input.select(); } catch(_) {} }
      }
    }
  } catch (_) {}
});

