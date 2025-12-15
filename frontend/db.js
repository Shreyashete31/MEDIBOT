;(function(){
  const DB_NAME = 'healthhub-db';
  const DB_VERSION = 1;
  let dbInstance = null;

  async function openDB() {
    if (dbInstance) return dbInstance;
    return new Promise((resolve) => {
      try {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = function(event) {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('contacts')) {
            const store = db.createObjectStore('contacts', { keyPath: 'id' });
            store.createIndex('by_user', 'userId', { unique: false });
          }
          if (!db.objectStoreNames.contains('hospitals')) {
            db.createObjectStore('hospitals', { keyPath: 'key' });
          }
          if (!db.objectStoreNames.contains('meta')) {
            db.createObjectStore('meta', { keyPath: 'key' });
          }
        };
        request.onsuccess = function() {
          dbInstance = request.result;
          resolve(dbInstance);
        };
        request.onerror = function() {
          resolve(null);
        };
      } catch (err) {
        resolve(null);
      }
    });
  }

  async function safeTx(storeNames, mode, callback) {
    const db = await openDB();
    if (!db) return;
    try {
      const tx = db.transaction(storeNames, mode);
      await callback(tx);
    } catch (err) {}
  }

  async function putContacts(userId, contacts) {
    try { console.log('EmergencyDebug putContacts', { userId, contacts }); } catch (_) {}
    await safeTx(['contacts','meta'], 'readwrite', (tx) => {
      const store = tx.objectStore('contacts');
      const meta = tx.objectStore('meta');
      const idx = store.index('by_user');
      const req = idx.openCursor(IDBKeyRange.only(userId));
      req.onsuccess = function(e) {
        const cursor = e.target.result;
        if (cursor) { store.delete(cursor.primaryKey); cursor.continue(); }
      };
      tx.oncomplete = function() {
        const tx2 = dbInstance.transaction(['contacts','meta'], 'readwrite');
        const s2 = tx2.objectStore('contacts');
        contacts.forEach(c => s2.put({ ...c, userId }));
        tx2.objectStore('meta').put({ key: `contacts_ts_${userId}`, value: Date.now() });
      };
    });
  }

  async function getContacts(userId) {
    return new Promise(async (resolve) => {
      const db = await openDB();
      if (!db) return resolve([]);
      try {
        const tx = db.transaction('contacts', 'readonly');
        const idx = tx.objectStore('contacts').index('by_user');
        const res = [];
        const req = idx.openCursor(IDBKeyRange.only(userId));
        req.onsuccess = function(e) {
          const cursor = e.target.result;
          if (cursor) { res.push(cursor.value); cursor.continue(); }
          else resolve(res);
        };
        req.onerror = function() { resolve([]); };
      } catch (err) {
        resolve([]);
      }
    });
  }

  async function upsertContact(userId, contact) {
    try { console.log('EmergencyDebug upsertContact', { userId, contact }); } catch (_) {}
    await safeTx(['contacts'], 'readwrite', (tx) => {
      tx.objectStore('contacts').put({ ...contact, userId });
    });
  }

  async function deleteContact(userId, contactId) {
    await safeTx(['contacts'], 'readwrite', (tx) => {
      tx.objectStore('contacts').delete(contactId);
    });
  }

  async function cacheHospitals(centerKey, list) {
    await safeTx(['hospitals'], 'readwrite', (tx) => {
      tx.objectStore('hospitals').put({ key: centerKey, list, ts: Date.now() });
    });
  }

  async function getCachedHospitals(centerKey) {
    return new Promise(async (resolve) => {
      const db = await openDB();
      if (!db) return resolve(null);
      try {
        const tx = db.transaction('hospitals', 'readonly');
        const req = tx.objectStore('hospitals').get(centerKey);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch (err) {
        resolve(null);
      }
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


