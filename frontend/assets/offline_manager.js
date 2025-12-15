// Offline Data Manager
class OfflineManager {
  constructor() { this.isOnline = navigator.onLine; this.syncQueue = []; this.syncInProgress = false; this.init(); }
  init() {
    window.addEventListener('online', () => { this.isOnline = true; this.handleOnline(); });
    window.addEventListener('offline', () => { this.isOnline = false; this.handleOffline(); });
    if (this.isOnline) this.handleOnline();
  }
  handleOnline() { console.log('Connection restored - starting sync...'); this.showSyncNotification('Syncing data...'); this.syncAllData(); }
  handleOffline() { console.log('Connection lost - switching to offline mode'); this.showOfflineNotification('You are now offline. Some features may be limited.'); }
  async syncAllData() { if (this.syncInProgress) return; this.syncInProgress = true; try { await this.syncUserData(); await this.syncFavorites(); await this.syncQuizProgress(); await this.syncChatHistory(); await this.processSyncQueue(); this.showSyncNotification('Data synced successfully!', 'success'); } catch (error) { console.error('Sync error:', error); this.showSyncNotification('Sync failed. Will retry when online.', 'error'); } finally { this.syncInProgress = false; } }
  async syncUserData(dataOverride) { const userData = JSON.parse(localStorage.getItem('userData') || '{}'); const loggedInUser = localStorage.getItem('loggedInUser'); const payload = dataOverride || (loggedInUser && userData[loggedInUser]); if (loggedInUser && payload) { try { const response = await fetch('/api/users/sync', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId: loggedInUser, data: payload }) }); if (response.ok) console.log('User data synced successfully'); } catch (error) { console.error('Failed to sync user data:', error); this.addToSyncQueue('userData', { userId: loggedInUser, data: payload }); } } }
  async syncFavorites(favsOverride) { let favorites = []; try { favorites = JSON.parse(localStorage.getItem('favoriteRemedies') || '[]'); } catch (_) { favorites = []; } if (!Array.isArray(favorites) || favorites.length === 0) { try { favorites = JSON.parse(localStorage.getItem('favorites') || '[]'); } catch (_) { favorites = []; } }
    if (Array.isArray(favsOverride)) favorites = favsOverride;
    const loggedInUser = localStorage.getItem('loggedInUser'); if (loggedInUser && favorites.length > 0) { try { const response = await fetch('/api/favorites/sync', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId: loggedInUser, favorites }) }); if (response.ok) console.log('Favorites synced successfully'); } catch (error) { console.error('Failed to sync favorites:', error); this.addToSyncQueue('favorites', { userId: loggedInUser, favorites }); } } }
  async syncQuizProgress(progressOverride) { let quizProgress = {}; try { quizProgress = JSON.parse(localStorage.getItem('quizProgress') || '{}'); } catch (_) { quizProgress = {}; } if (progressOverride && typeof progressOverride === 'object') quizProgress = progressOverride; const loggedInUser = localStorage.getItem('loggedInUser'); if (loggedInUser && Object.keys(quizProgress).length > 0) { try { const response = await fetch('/api/quiz/sync', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId: loggedInUser, progress: quizProgress }) }); if (response.ok) console.log('Quiz progress synced successfully'); } catch (error) { console.error('Failed to sync quiz progress:', error); this.addToSyncQueue('quizProgress', { userId: loggedInUser, progress: quizProgress }); } } }
  async syncChatHistory(historyOverride) { let chatHistory = []; try { chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]'); } catch (_) { chatHistory = []; } if (Array.isArray(historyOverride)) chatHistory = historyOverride; const loggedInUser = localStorage.getItem('loggedInUser'); if (loggedInUser && chatHistory.length > 0) { try { const response = await fetch('/api/chat/sync', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ userId: loggedInUser, history: chatHistory }) }); if (response.ok) console.log('Chat history synced successfully'); } catch (error) { console.error('Failed to sync chat history:', error); this.addToSyncQueue('chatHistory', { userId: loggedInUser, history: chatHistory }); } } }
  addToSyncQueue(type, data) { const action = { id: Date.now() + Math.random(), type, data, timestamp: new Date().toISOString() }; this.syncQueue.push(action); localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue)); console.log('Added to sync queue:', action); }
  async processSyncQueue() { const queue = JSON.parse(localStorage.getItem('syncQueue') || '[]'); for (const action of queue) { try { await this.processSyncAction(action); this.removeFromSyncQueue(action.id); } catch (error) { console.error('Failed to process sync action:', error); } } }
  async processSyncAction(action) { const { type, data } = action; switch (type) { case 'userData': await this.syncUserData(data && data.data ? data.data : data); break; case 'favorites': await this.syncFavorites(data && data.favorites ? data.favorites : data); break; case 'quizProgress': await this.syncQuizProgress(data && data.progress ? data.progress : data); break; case 'chatHistory': await this.syncChatHistory(data && data.history ? data.history : data); break; default: console.warn('Unknown sync action type:', type); } }
  removeFromSyncQueue(actionId) { this.syncQueue = this.syncQueue.filter(action => action.id !== actionId); localStorage.setItem('syncQueue', JSON.stringify(this.syncQueue)); }
  isDataAvailableOffline(dataType) { switch (dataType) { case 'firstAid': return localStorage.getItem('firstAidData') !== null; case 'symptoms': return localStorage.getItem('symptomsData') !== null; case 'remedies': return localStorage.getItem('remediesData') !== null; case 'quiz': return localStorage.getItem('quizQuestions') !== null; default: return false; } }
  mergeVerifiedData(baseArray, verifiedArray, type) { const getKey = (item) => { if (item.id) return String(item.id).toLowerCase(); if (type==='firstAid') return (item.title||'').toLowerCase(); return (item.name||'').toLowerCase(); }; const map = new Map(); baseArray.forEach(i=>map.set(getKey(i), i)); verifiedArray.forEach(item=>{ const key = getKey(item); if (!map.has(key)) map.set(key, item); else { const existing = map.get(key); const merged = { ...existing, ...item, keywords: Array.from(new Set([...(existing.keywords||[]), ...(item.keywords||[])])) }; map.set(key, merged); } }); return Array.from(map.values()); }
  async fetchJSONSafe(path) { try { const res = await fetch(path); if (!res.ok) return null; return await res.json(); } catch (e) { return null; } }
  async loadOfflineData(dataType) {
    try {
      const base = (window.BASE_ASSET_PATH || 'assets/');
      let basePath, verifiedPath; switch (dataType) {
        case 'firstAid': basePath = base + 'first_aid_data.json'; verifiedPath = base + 'verified/first_aid_verified.json'; break;
        case 'symptoms': basePath = base + 'symptoms_data.json'; verifiedPath = base + 'verified/symptoms_verified.json'; break;
        case 'remedies': basePath = base + 'remedies_data.json'; verifiedPath = base + 'verified/remedies_verified.json'; break;
        case 'quiz': basePath = base + 'quiz_first_aid.json'; break;
        default: throw new Error('Unknown data type'); }
      const baseData = await this.fetchJSONSafe(basePath); if (!baseData) throw new Error('Failed to load base JSON');
      let mergedData = baseData;
      if (verifiedPath) {
        const verifiedData = await this.fetchJSONSafe(verifiedPath);
        if (verifiedData && Array.isArray(verifiedData) && verifiedData.length > 0) {
          const typeKey = dataType === 'firstAid' ? 'firstAid' : dataType;
          const baseArr = Array.isArray(baseData) ? baseData : (baseData.items || baseData);
          mergedData = this.mergeVerifiedData(baseArr, verifiedData, typeKey);
        }
      }
      localStorage.setItem(`${dataType}Data`, JSON.stringify(mergedData));
      console.log(`${dataType} data loaded for offline use${verifiedPath ? ' (with verified merge)' : ''}`);
      return mergedData;
    } catch (error) { console.error(`Error loading ${dataType} data:`, error); return null; }
  }
  showSyncNotification(message, type='info') { const el = document.createElement('div'); el.className = `sync-notification ${type}`; el.style.cssText = `position:fixed;top:20px;right:20px;background:${type==='success'?'#4caf50':type==='error'?'#f44336':'#2196f3'};color:white;padding:1rem 1.5rem;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;font-weight:500;max-width:300px;animation:slideIn .3s ease-out;`; el.textContent = message; if (document.body) { document.body.appendChild(el); } else { document.addEventListener('DOMContentLoaded', function once(){ document.removeEventListener('DOMContentLoaded', once); document.body.appendChild(el); }); } setTimeout(()=>{ el.style.animation='slideOut .3s ease-in'; setTimeout(()=>el.remove(),300); },3000); }
  showOfflineNotification(message) { const n = document.createElement('div'); n.className='offline-notification'; n.style.cssText='position:fixed;top:0;left:0;right:0;background:#ff9800;color:white;padding:.75rem;text-align:center;font-weight:500;z-index:10000;animation:slideDown .3s ease-out;'; n.innerHTML = message; if (document.body) { document.body.appendChild(n); } else { document.addEventListener('DOMContentLoaded', function once(){ document.removeEventListener('DOMContentLoaded', once); document.body.appendChild(n); }); } setTimeout(()=>n.remove(),2500); }
}
window.offlineManager = window.offlineManager || new OfflineManager();