// v0.2: app shell updates online and remains available offline.
const CACHE='hanzi-one-v2';
const SHELL=['./','./index.html','./styles.css','./app.js','./radicals.json','./manifest.webmanifest','./icon.svg','./icon.png','./icon-maskable.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hanzi-one-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  // Prevent old JavaScript from being pinned indefinitely by a cache-first strategy.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    try{
      const response=await fetch(req);
      if(response.ok)await cache.put(req,response.clone());
      return response;
    }catch(err){
      const backup=await cache.match(req,{ignoreSearch:true});
      if(backup)return backup;
      if(req.mode==='navigate')return await cache.match('./index.html');
      throw err;
    }
  })());
});
