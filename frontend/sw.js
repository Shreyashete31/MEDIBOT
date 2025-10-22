const CACHE_NAME = 'healthhub-v1.0.0';
const STATIC_CACHE_NAME = 'healthhub-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'healthhub-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
  '/',
  '/index.html',
  '/2 login.html',
  '/3 home.html',
  '/remedies.html',
  '/remedies_enhanced.html',
  '/firstaid.html',
  '/emergency.html',
  '/emergency_enhanced.html',
  '/suggestions.html',
  '/chat.html',
  '/quiz.html',
  '/profile.html',
  '/about.html',
  '/settings.html',
  '/hospitals.html',
  '/admin.html',
  '/manifest.json',
  '/assets/quiz_first_aid.json',
  '/assets/remedies.json',
  '/assets/first_aid_data.json',
  '/assets/symptoms_data.json',
  '/assets/remedies_data.json',
  '/dark-mode.js',
  '/accessibility.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Error caching static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // Handle page requests
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            console.log('Serving page from cache:', request.url);
            return response;
          }
          
          console.log('Fetching page from network:', request.url);
          return fetch(request)
            .then(response => {
              // Clone the response because it's a stream
              const responseClone = response.clone();
              
              // Cache the response for future use
              caches.open(DYNAMIC_CACHE_NAME)
                .then(cache => {
                  cache.put(request, responseClone);
                });
              
              return response;
            })
            .catch(() => {
              // Fallback to cached offline page or show offline message
              if (request.url.includes('.html')) {
                return caches.match('/3 home.html') || 
                       new Response('Offline - Please check your internet connection', {
                         status: 503,
                         statusText: 'Service Unavailable'
                       });
              }
            });
        })
    );
  } else if (request.destination === 'style' || 
             request.destination === 'script' || 
             request.destination === 'image') {
    // Handle static assets
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            console.log('Serving asset from cache:', request.url);
            return response;
          }
          
          console.log('Fetching asset from network:', request.url);
          return fetch(request)
            .then(response => {
              // Cache successful responses
              if (response.status === 200) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE_NAME)
                  .then(cache => {
                    cache.put(request, responseClone);
                  });
              }
              return response;
            })
            .catch(() => {
              // Return a fallback for images
              if (request.destination === 'image') {
                return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect width="200" height="200" fill="#f0f0f0"/><text x="100" y="100" text-anchor="middle" fill="#999">Image not available offline</text></svg>', {
                  headers: { 'Content-Type': 'image/svg+xml' }
                });
              }
            });
        })
    );
  } else {
    // Handle other requests (API calls, etc.)
    event.respondWith(
      fetch(request)
        .catch(() => {
          // Return offline response for API calls
          return new Response(JSON.stringify({
            error: 'Offline',
            message: 'This feature requires an internet connection'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(
      // Handle offline actions when connection is restored
      handleBackgroundSync()
    );
  }
});

// Push notifications
self.addEventListener('push', event => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'New health tip available!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View App',
        icon: '/icons/icon-72x72.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/icon-72x72.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('HealthHub', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/3 home.html')
    );
  }
});

// Handle background sync
async function handleBackgroundSync() {
  try {
    console.log('Starting background sync...');
    
    // Sync user data
    await syncUserData();
    
    // Sync favorites
    await syncFavorites();
    
    // Sync quiz progress
    await syncQuizProgress();
    
    // Sync chat history
    await syncChatHistory();
    
    // Get offline actions from IndexedDB or localStorage
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await processOfflineAction(action);
        await removeOfflineAction(action.id);
      } catch (error) {
        console.error('Failed to process offline action:', error);
      }
    }
    
    console.log('Background sync completed');
  } catch (error) {
    console.error('Background sync error:', error);
  }
}

// Sync functions
async function syncUserData() {
  try {
    // This would sync user data with the server
    console.log('Syncing user data...');
    // Implementation would depend on your backend API
  } catch (error) {
    console.error('Error syncing user data:', error);
  }
}

async function syncFavorites() {
  try {
    console.log('Syncing favorites...');
    // Implementation would sync favorites with server
  } catch (error) {
    console.error('Error syncing favorites:', error);
  }
}

async function syncQuizProgress() {
  try {
    console.log('Syncing quiz progress...');
    // Implementation would sync quiz progress with server
  } catch (error) {
    console.error('Error syncing quiz progress:', error);
  }
}

async function syncChatHistory() {
  try {
    console.log('Syncing chat history...');
    // Implementation would sync chat history with server
  } catch (error) {
    console.error('Error syncing chat history:', error);
  }
}

// Get offline actions from storage
async function getOfflineActions() {
  return new Promise((resolve) => {
    // This would typically use IndexedDB
    // For now, return empty array
    resolve([]);
  });
}

// Process offline action
async function processOfflineAction(action) {
  // Process the action (e.g., sync favorites, send emergency contacts)
  console.log('Processing offline action:', action);
}

// Remove processed offline action
async function removeOfflineAction(actionId) {
  console.log('Removing offline action:', actionId);
}

// Message handler for communication with main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});

console.log('Service Worker loaded successfully');
