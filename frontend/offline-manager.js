// Offline Data Manager
class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.syncQueue = [];
    this.syncInProgress = false;
    
    this.init();
  }

  init() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.handleOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.handleOffline();
    });

    // Check if we're online on load
    if (this.isOnline) {
      this.handleOnline();
    }
  }

  handleOnline() {
    console.log('Connection restored - starting sync...');
    this.showSyncNotification('Syncing data...');
    this.syncAllData();
  }

  handleOffline() {
    console.log('Connection lost - switching to offline mode');
    this.showOfflineNotification('You are now offline. Some features may be limited.');
  }

  // Sync all data when connection is restored
  async syncAllData() {
    if (this.syncInProgress) return;
    
    this.syncInProgress = true;
    
    try {
      // Sync user data
      await this.syncUserData();
      
      // Sync favorites
      await this.syncFavorites();
      
      // Sync quiz progress
      await this.syncQuizProgress();
      
      // Sync chat history
      await this.syncChatHistory();
      
      // Process queued actions
      await this.processSyncQueue();
      
      this.showSyncNotification('Data synced successfully!', 'success');
    } catch (error) {
      console.error('Sync error:', error);
      this.showSyncNotification('Sync failed. Will retry when online.', 'error');
    } finally {
      this.syncInProgress = false;
    }
  }

  // Sync user data
  async syncUserData() {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && userData[loggedInUser]) {
      try {
        const response = await fetch('/api/users/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUser,
            data: userData[loggedInUser]
          })
        });
        
        if (response.ok) {
          console.log('User data synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync user data:', error);
        this.addToSyncQueue('userData', { userId: loggedInUser, data: userData[loggedInUser] });
      }
    }
  }

  // Sync favorites
  async syncFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && favorites.length > 0) {
      try {
        const response = await fetch('/api/favorites/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUser,
            favorites: favorites
          })
        });
        
        if (response.ok) {
          console.log('Favorites synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync favorites:', error);
        this.addToSyncQueue('favorites', { userId: loggedInUser, favorites: favorites });
      }
    }
  }

  // Sync quiz progress
  async syncQuizProgress() {
    const quizProgress = JSON.parse(localStorage.getItem('quizProgress') || '{}');
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && Object.keys(quizProgress).length > 0) {
      try {
        const response = await fetch('/api/quiz/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUser,
            progress: quizProgress
          })
        });
        
        if (response.ok) {
          console.log('Quiz progress synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync quiz progress:', error);
        this.addToSyncQueue('quizProgress', { userId: loggedInUser, progress: quizProgress });
      }
    }
  }

  // Sync chat history
  async syncChatHistory() {
    const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
    const loggedInUser = localStorage.getItem('loggedInUser');
    
    if (loggedInUser && chatHistory.length > 0) {
      try {
        const response = await fetch('/api/chat/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: loggedInUser,
            history: chatHistory
          })
        });
        
        if (response.ok) {
          console.log('Chat history synced successfully');
        }
      } catch (error) {
        console.error('Failed to sync chat history:', error);
        this.addToSyncQueue('chatHistory', { userId: loggedInUser, history: chatHistory });
      }
    }
  }

  // Add action to sync queue
  addToSyncQueue(type, data) {
    const action = {
      id: Date.now() + Math.random(),
      type: type,
      data: data,
      timestamp: new Date().toISOString()
    };
    
    this.syncQueue.push(action);
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
    console.log('Added to sync queue:', action);
  }

  // Process sync queue
  async processSyncQueue() {
    const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]');
    
    for (const action of queue) {
      try {
        await this.processSyncAction(action);
        this.removeFromSyncQueue(action.id);
      } catch (error) {
        console.error('Failed to process sync action:', error);
      }
    }
  }

  // Process individual sync action
  async processSyncAction(action) {
    const { type, data } = action;
    
    switch (type) {
      case 'userData':
        await this.syncUserData();
        break;
      case 'favorites':
        await this.syncFavorites();
        break;
      case 'quizProgress':
        await this.syncQuizProgress();
        break;
      case 'chatHistory':
        await this.syncChatHistory();
        break;
      default:
        console.warn('Unknown sync action type:', type);
    }
  }

  // Remove action from sync queue
  removeFromSyncQueue(actionId) {
    this.syncQueue = this.syncQueue.filter(action => action.id !== actionId);
    localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue));
  }

  // Check if data is available offline
  isDataAvailableOffline(dataType) {
    switch (dataType) {
      case 'firstAid':
        return localStorage.getItem('firstAidData') !== null;
      case 'symptoms':
        return localStorage.getItem('symptomsData') !== null;
      case 'remedies':
        return localStorage.getItem('remediesData') !== null;
      case 'quiz':
        return localStorage.getItem('quizQuestions') !== null;
      default:
        return false;
    }
  }

  // Merge helper: deduplicate and prioritize verified entries
  mergeVerifiedData(baseArray, verifiedArray, type) {
    const getKey = (item) => {
      if (item.id) return String(item.id).toLowerCase();
      if (type === 'firstAid') return (item.title || '').toLowerCase();
      return (item.name || '').toLowerCase();
    };
    const map = new Map();
    baseArray.forEach((item) => {
      map.set(getKey(item), item);
    });
    verifiedArray.forEach((item) => {
      const key = getKey(item);
      if (!map.has(key)) {
        map.set(key, item);
      } else {
        // Prefer verified entry and merge keywords
        const existing = map.get(key);
        const merged = {
          ...existing,
          ...item,
          keywords: Array.from(new Set([...(existing.keywords || []), ...(item.keywords || [])]))
        };
        map.set(key, merged);
      }
    });
    return Array.from(map.values());
  }
  
  // Safe JSON fetch helper
  async fetchJSONSafe(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Load data for offline use
  async loadOfflineData(dataType) {
    try {
      let response;
      let basePath;
      let verifiedPath;
  
      switch (dataType) {
        case 'firstAid':
          basePath = './assets/first_aid_data.json';
          verifiedPath = './assets/verified/first_aid_verified.json';
          break;
        case 'symptoms':
          basePath = './assets/symptoms_data.json';
          verifiedPath = './assets/verified/symptoms_verified.json';
          break;
        case 'remedies':
          basePath = './assets/remedies_data.json';
          verifiedPath = './assets/verified/remedies_verified.json';
          break;
        case 'quiz':
          basePath = './assets/quiz_first_aid.json';
          break;
        default:
          throw new Error('Unknown data type');
      }
  
      response = await fetch(basePath);
  
      if (response.ok) {
        const baseData = await response.json();
        let mergedData = baseData;
  
        if (verifiedPath) {
          const verifiedData = await this.fetchJSONSafe(verifiedPath);
          if (verifiedData && Array.isArray(verifiedData) && verifiedData.length > 0) {
            const typeKey = dataType === 'firstAid' ? 'firstAid' : dataType;
            mergedData = this.mergeVerifiedData(Array.isArray(baseData) ? baseData : (baseData.items || baseData), verifiedData, typeKey);
          }
        }
  
        localStorage.setItem(`${dataType}Data`, JSON.stringify(mergedData));
        console.log(`${dataType} data loaded for offline use${verifiedPath ? ' (with verified merge)' : ''}`);
        return mergedData;
      } else {
        throw new Error('Failed to load data');
      }
    } catch (error) {
      console.error(`Error loading ${dataType} data:`, error);
      return null;
    }
  }

  // Show sync notification
  showSyncNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `sync-notification ${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10000;
      font-weight: 500;
      max-width: 300px;
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    if (document.body) {
      document.body.appendChild(notification);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(notification), { once: true });
    }
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  // Show offline notification
  showOfflineNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'offline-notification';
    notification.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff9800;
      color: white;
      padding: 0.75rem;
      text-align: center;
      font-weight: 500;
      z-index: 10000;
      animation: slideDown 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <i class="fas fa-wifi" style="margin-right: 0.5rem;"></i>
      ${message}
    `;
    
    if (document.body) {
      document.body.appendChild(notification);
    } else {
      document.addEventListener('DOMContentLoaded', () => document.body.appendChild(notification), { once: true });
    }
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-in';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  // Get sync status
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      syncInProgress: this.syncInProgress,
      queueLength: this.syncQueue.length
    };
  }
}

// Add CSS animations
const offlineStyle = document.createElement('style');
offlineStyle.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
  
  @keyframes slideDown {
    from {
      transform: translateY(-100%);
    }
    to {
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      transform: translateY(0);
    }
    to {
      transform: translateY(-100%);
    }
  }
`;
document.head.appendChild(offlineStyle);

// Initialize offline manager
const offlineManager = new OfflineManager();

// Export for use in other scripts
window.OfflineManager = OfflineManager;
window.offlineManager = offlineManager;
