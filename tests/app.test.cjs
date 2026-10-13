// Exercise application state transitions without requiring a browser binary.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
async function app(initial){
  const store=new Map(),assets=new Map(),listeners={},alerts=[];
  if(initial)store.set('hanzi-one-state-v1',JSON.stringify(initial));
  const node={innerHTML:'',textContent:'',hidden:true};
  const env={console,Date,Math,JSON,Map,Set,Number,String,Array,Object,Promise,URL,Blob,setTimeout,clearTimeout,
    document:{querySelector:()=>node,querySelectorAll:()=>[],addEventListener:(name,fn)=>listeners[name]=fn},
    localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)},
    navigator:{},location:{protocol:'http:'},alert:x=>alerts.push(x),confirm:()=>true,
    fetch:async url=>{if(url==='radicals.json')return {ok:true,json:async()=>[]};throw Error('offline');},
    scrollTo:()=>{},isSecureContext:false,testAssets:assets};
  env.window=env;vm.createContext(env);
  for(const file of ['learning-core.js','course-data.js','study.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),env,{filename:file});
  const run=source=>vm.runInContext(source,env);
  run("getAsset=async key=>testAssets.get(key)||null;setAssets=async values=>{for(const [key,value] of Object.entries(values)){if(value===null)testAssets.delete(key);else testAssets.set(key,value);}return true;};setAsset=async(key,value)=>{testAssets.set(key,value);return true;};");
  await new Promise(resolve=>setImmediate(resolve));
  return {run,store,assets,listeners,alerts,node,env};
}
test('a finished deck stays finished after re-rendering',async()=>{
  const a=await app();a.run('cardQueue()');const total=a.run('view.cardSession.total');assert.ok(total>0);
  for(let i=0;i<total;i++){await a.run("action('flip',{})");await a.run("action('grade-card',{dataset:{grade:'4'}})");}
  assert.equal(a.run('view.cardQueue.length'),0);assert.equal(a.run('view.cardSession.done'),total);
  a.run('render()');assert.ok(a.node.innerHTML.includes('Повторение завершено!'));assert.ok(!a.node.innerHTML.includes('data-action="flip"'));
  assert.equal(a.run('due().length'),0);
});
test('all thematic exercises save a result and add their vocabulary to repetitions',async()=>{
  const a=await app();a.run("for(const unit of COURSE_UNITS){view.unit=unit.id;startUnitQuiz();for(let i=0;i<6;i++){const it=view.unitQuiz.items[view.unitQuiz.i];answerUnit(it.type==='order'?it.correct.join(''):it.correct);studyAction('unit-next');}}");
  assert.equal(a.run('Object.values(state.units).filter(x=>x.passed&&x.best===100).length'),10);
  assert.ok(a.run('Object.keys(state.progress).length')>30);
  const saved=JSON.parse(a.store.get('hanzi-one-state-v1'));assert.equal(Object.keys(saved.units).length,10);
  const reloaded=await app(saved);assert.equal(reloaded.run('Object.keys(state.units).length'),10);
});
test('retrying wrong exercises cannot inflate full-test attempts or best score',async()=>{
  const a=await app();a.run("startUnitQuiz();for(let i=0;i<6;i++){const it=view.unitQuiz.items[view.unitQuiz.i];answerUnit(i===0?'wrong':it.type==='order'?it.correct.join(''):it.correct);studyAction('unit-next');}");
  assert.equal(a.run('state.units.greetings.last'),83);
  a.run("startUnitQuiz(true);const it=view.unitQuiz.items[0];answerUnit(it.type==='order'?it.correct.join(''):it.correct);studyAction('unit-next');");
  assert.equal(a.run('state.units.greetings.attempts'),1);assert.equal(a.run('state.units.greetings.best'),83);
});
test('HSK migration preserves a supplementary word when it is absent from the official list',async()=>{
  const a=await app();a.run("state.progress['demo-0']={ease:2.5,rep:2,interval:3,next:100};state.progress['topic-名字']={ease:2.5,rep:1,interval:1,next:100};");
  a.env.fixture=Array.from({length:100},(_,i)=>({sort:i+1,word:i===0?'你好':'词'+i,pinyin:i===0?'nǐ hǎo':'cí',levelName:'一级'}));
  assert.equal(a.run('replaceDataset(fixture)'),true);
  assert.equal(a.run("state.progress['hsk26-1'].rep"),2);assert.equal(a.run("state.progress['demo-0']"),undefined);
  assert.equal(a.run("byId('topic-名字').word"),'名字');assert.equal(a.run("state.progress['topic-名字'].rep"),1);
});
test('actual application accepts the current 11,000-row HSK source without orphaning progress',{skip:!process.env.HANZI_HSK_FIXTURE},async()=>{
  const a=await app();a.run("for(const u of COURSE_UNITS)for(const w of unitWords(u))state.progress[w.id]={ease:2.5,rep:1,interval:1,next:100};");
  a.env.fixture=JSON.parse(fs.readFileSync(process.env.HANZI_HSK_FIXTURE,'utf8')).data.records;
  assert.equal(a.run('replaceDataset(fixture)'),true);assert.equal(a.run('dataset.length'),11000);
  assert.equal(a.run('Object.keys(state.progress).filter(id=>!byId(id)).length'),0);
  assert.equal(a.run('COURSE_UNITS.flatMap(u=>unitWords(u)).filter(w=>!ruOf(w)).length'),0);
});
test('backup restoration rejects invalid data before changing either storage',async()=>{
  const a=await app();a.run("state.favorites=['你好'];save();");const before=a.store.get('hanzi-one-state-v1');
  await a.listeners.change({target:{id:'restore-file',files:[{size:100,text:async()=>'{"format":"hanzi-one-v2","state":{"progress":[]}}'}]}});
  assert.equal(a.store.get('hanzi-one-state-v1'),before);assert.equal(a.assets.size,0);assert.match(a.alerts.at(-1),/Не удалось восстановить/);
});
test('restore switches the loaded dataset to the one included in the copy',async()=>{
  const a=await app();const hsk=Array.from({length:100},(_,i)=>({sort:i+1,word:'词'+i,pinyin:'cí',levelName:'一级'}));
  const backup={format:'hanzi-one-v2',state:{progress:{'hsk26-1':{ease:2.5,rep:1,interval:1,next:100}},units:{greetings:{best:100,last:100,attempts:1,passed:123}}},hsk,ruPack:{词:'слово'}};
  await a.listeners.change({target:{id:'restore-file',files:[{size:5000,text:async()=>JSON.stringify(backup)}]}});
  assert.equal(a.run('hskLoaded'),true);assert.equal(a.run("byId('hsk26-1').word"),'词');assert.equal(a.run('state.units.greetings.best'),100);
  assert.equal(a.assets.get('hsk').length,100);
});
test('a failed IndexedDB transaction never replaces saved progress',async()=>{
  const a=await app();a.run("state.favorites=['你好'];save();setAssets=async()=>false;");const before=a.store.get('hanzi-one-state-v1');
  await a.listeners.change({target:{id:'restore-file',files:[{size:500,text:async()=>JSON.stringify({format:'hanzi-one-v2',state:{},hsk:null})}]}});
  assert.equal(a.store.get('hanzi-one-state-v1'),before);assert.match(a.alerts.at(-1),/Прогресс не заменён/);
});
