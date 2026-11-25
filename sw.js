const CACHE='caoba-pages-visitas-v14';
const SHELL=['./','./index.html','./theme.css','./ar.css','./ar.js','./room.js','./room.css','./assets/fonts/outfit-semibold-latin.woff2','./assets/fonts/outfit-semibold-latin-ext.woff2','./icons.js','./catalog.js','./experience.js','./manifest.webmanifest','./assets/brand/logo-caoba.jpg','./assets/brand/favicon.ico','./assets/brand/caoba-icon-32.png','./assets/brand/caoba-icon-180.png','./assets/brand/caoba-icon-192.png','./assets/brand/caoba-icon-512.png','./assets/trabajo-Dc4SXuamYD_.jpg','./assets/organizador-600.webp','./assets/mesas-de-luz-600.webp'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('caoba-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 const network=()=>fetch(request).then(response=>{if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)))}return response});
 if(request.destination==='image')event.respondWith(caches.match(request).then(hit=>hit||network()));
 else event.respondWith(network().catch(()=>caches.match(request).then(hit=>hit||(request.mode==='navigate'?caches.match('./index.html'):Response.error()))));
});
