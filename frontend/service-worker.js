// service-worker.js

const CACHE_NAME = 'uplayg-cache-v7';

const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/assets/images/icon.png',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap',
    'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    'https://fonts.gstatic.com/s/poppins/v20/pxiByp8kv8JHgFVrLCz7Z1xlFQ.woff2'
];

self.addEventListener('install', event => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Service Worker: Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => {
                return self.skipWaiting();
            })
    );
});

self.addEventListener('activate', event => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Service Worker: Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            return self.clients.claim();
        })
    );
});

function shouldBypassCache(request) {
    const url = new URL(request.url);
    
    const bypassPaths = [
        '/__/auth/',
        'accounts.google.com',
        'identitytoolkit.googleapis.com',
        'securetoken.googleapis.com',
        'firebase.googleapis.com',
        'googleapis.com',
        'www.googleapis.com',
        'www.gstatic.com/firebasejs'
    ];
    
    return bypassPaths.some(path => url.href.includes(path));
}

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }
    
    if (shouldBypassCache(event.request)) {
        event.respondWith(
            fetch(event.request).catch(error => {
                console.error('Network fetch failed for auth request:', error);
                throw error;
            })
        );
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                return fetch(event.request).then(
                    networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        const responseToCache = networkResponse.clone();
                        
                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    }
                ).catch(error => {
                    console.error('Service Worker: Fetch failed:', error);
                });
            })
    );
});

self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});