// Install a complete version before offering an update to the running application.
const CACHE='hanzi-one-v3';
const SHELL=['./','./index.html','./styles.css','./learning-core.js','./course-data.js','./study.js','./app.js','./radicals.json','./manifest.webmanifest','./icon.svg','./icon.png','./icon-maskable.svg'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));
});
self.addEventListener('message',event=>{if(event.data?.type==='ACTIVATE_UPDATE')self.skipWaiting();});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('hanzi-one-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  const url=new URL(req.url);
  if(req.method!=='GET'||url.origin!==self.location.origin)return;
  // Keep the application shell coherent; refresh only by activating an installed worker.
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const shellURL=req.mode==='navigate'?new URL('./index.html',self.registration.scope).href:req.url;
    const backup=await cache.match(shellURL,{ignoreSearch:true});
    if(backup)return backup;
    try{
      const response=await fetch(req);
      return response;
    }catch(err){
      if(req.mode==='navigate')return await cache.match('./index.html');
      throw err;
    }
  })());
});
