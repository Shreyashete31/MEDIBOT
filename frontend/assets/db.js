// Minimal IndexedDB helper for offline storage (contacts, hospitals)
;(function(){
  const DB_NAME = 'healthhub-db';
  const DB_VERSION = 1;
  let dbInstance = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('contacts')) {
          const store = db.createObjectStore('contacts', { keyPath: 'id' });
          store.createIndex('by_user', 'userId', { unique: false });
        }
        if (!db.objectStoreNames.contains('hospitals')) {
          const store = db.createObjectStore('hospitals', { keyPath: 'key' });
          // key can be `${lat.toFixed(3)}_${lng.toFixed(3)}`
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' });
        }
      };
      request.onsuccess = function() { dbInstance = request.result; resolve(dbInstance); };
      request.onerror = function() { reject(request.error); };
    });
  }

  async function putContacts(userId, contacts) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['contacts','meta'], 'readwrite');
      const store = tx.objectStore('contacts');
      const meta = tx.objectStore('meta');
      // Clear existing for user
      const idx = store.index('by_user');
      const req = idx.openCursor(IDBKeyRange.only(userId));
      req.onsuccess = function(e){
        const cursor = e.target.result;
        if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); }
      };
      tx.oncomplete = function(){
        // bulk insert
        const tx2 = db.transaction(['contacts','meta'],'readwrite');
        const s2 = tx2.objectStore('contacts');
        contacts.forEach(c => s2.put({ ...c, userId }));
        meta.put({ key: `contacts_ts_${userId}`, value: Date.now() });
        tx2.oncomplete = () => resolve();
        tx2.onerror = () => reject(tx2.error);
      };
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getContacts(userId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('contacts','readonly');
      const idx = tx.objectStore('contacts').index('by_user');
      const res = [];
      const req = idx.openCursor(IDBKeyRange.only(userId));
      req.onsuccess = function(e){
        const cursor = e.target.result;
        if (cursor) { res.push(cursor.value); cursor.continue(); } else resolve(res); };
      req.onerror = () => reject(req.error);
    });
  }

  async function upsertContact(userId, contact) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('contacts','readwrite');
      tx.objectStore('contacts').put({ ...contact, userId });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function deleteContact(userId, contactId) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('contacts','readwrite');
      tx.objectStore('contacts').delete(contactId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function cacheHospitals(centerKey, list) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('hospitals','readwrite');
      tx.objectStore('hospitals').put({ key: centerKey, list, ts: Date.now() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function getCachedHospitals(centerKey) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('hospitals','readonly');
      const req = tx.objectStore('hospitals').get(centerKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  window.HealthHubDB = {
    openDB,
    putContacts,
    getContacts,
    upsertContact,
    deleteContact,
    cacheHospitals,
    getCachedHospitals
  };
})();


