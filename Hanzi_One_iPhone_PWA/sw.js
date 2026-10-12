const CACHE='hanzi-one-v1';
const SHELL=['./','./index.html','./styles.css','./app.js','./radicals.json','./manifest.webmanifest','./icon.svg','./icon.png','./icon-maskable.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));self.skipWaiting();});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(names=>Promise.all(names.filter(n=>n!==CACHE).map(n=>caches.delete(n)))));self.clients.claim();});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(res=>{if(res.ok)caches.open(CACHE).then(c=>c.put(event.request,res.clone()));return res;})));
});
