// Start `python -m http.server 8000` in the repository, then run this with Playwright installed.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,'playwright'):'playwright');
const url=process.env.HANZI_TEST_URL||'http://localhost:8000';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
    await context.route('https://raw.githubusercontent.com/**',r=>r.abort());
    const page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
    await page.goto(url);await page.waitForFunction(()=>typeof hskLoading!=='undefined'&&!hskLoading&&document.querySelector('[data-action="open-units"]'));
    await page.locator('[data-action="open-units"]').first().click();
    assert.equal(await page.locator('[data-unit]').count(),10);
    await page.locator('[data-unit="greetings"]').click();
    assert.equal(await page.locator('.dialogue-line').count(),4);
    await page.screenshot({path:'/tmp/hanzi-one-lesson.png',fullPage:true});
    async function complete(wrongFirst=false){
      for(let i=0;i<6;i++){
        const info=await page.evaluate(()=>{const it=view.unitQuiz.items[view.unitQuiz.i];return {type:it.type,correct:it.correct,choices:it.choices,tokens:it.tokens};});
        if(info.type==='order'){
          const tokens=wrongFirst&&i===0?info.correct.slice().reverse():info.correct;
          for(const text of tokens){const token=info.tokens.find(t=>t.text===text);await page.locator(`[data-token="${token.id}"]`).click();}
          await page.locator('[data-action="unit-check-order"]').click();
        }else{const choice=wrongFirst&&i===0?info.choices.findIndex(x=>x!==info.correct):info.choices.indexOf(info.correct);await page.locator(`[data-unit-choice="${choice}"]`).click();}
        await page.locator('[data-action="unit-next"]').click();
      }
    }
    await page.locator('[data-action="unit-test"]').click();await complete(true);
    assert.equal(await page.locator('.score-big').textContent(),'83%');
    await page.locator('[data-action="unit-retry-errors"]').click();
    const info=await page.evaluate(()=>{const it=view.unitQuiz.items[0];return {type:it.type,correct:it.correct,choices:it.choices,tokens:it.tokens};});
    if(info.type==='order'){for(const text of info.correct){await page.locator(`[data-token="${info.tokens.find(t=>t.text===text).id}"]`).click();}await page.locator('[data-action="unit-check-order"]').click();}
    else await page.locator(`[data-unit-choice="${info.choices.indexOf(info.correct)}"]`).click();
    await page.locator('[data-action="unit-next"]').click();
    assert.equal(await page.evaluate(()=>state.units.greetings.attempts),1);
    await page.locator('[data-nav="courses"]').click();await page.locator('[data-action="open-units"]').click();
    const unitIds=await page.locator('[data-unit]').evaluateAll(nodes=>nodes.map(n=>n.dataset.unit));
    for(const id of unitIds){
      await page.locator(`[data-unit="${id}"]`).click();await page.locator('[data-action="unit-test"]').click();await complete();
      assert.equal(await page.locator('.score-big').textContent(),'100%');
      await page.locator('[data-nav="courses"]').click();await page.locator('[data-action="open-units"]').click();
    }
    assert.equal(await page.evaluate(()=>Object.values(state.units).filter(x=>x.passed).length),10);
    // Exhaust a real deck through the controls; the result must remain stable on render.
    await page.locator('[data-nav="cards"]').click();
    const total=await page.evaluate(()=>view.cardSession.total);assert.ok(total>0);
    for(let i=0;i<total;i++){await page.locator('[data-action="flip"]').click();await page.locator('[data-grade="4"]').click();}
    await page.getByRole('heading',{name:'Повторение завершено!'}).waitFor();
    await page.evaluate(()=>render());assert.equal(await page.locator('[data-action="flip"]').count(),0);
    // Writing must support the second character, including the freehand hint.
    await page.evaluate(()=>{view.practiceWord='你好';view.writingIndex=0;openPage('write');});
    await page.locator('[data-writing-char="1"]').click();assert.equal(await page.locator('.hero-character').textContent(),'好');
    // A malformed file must leave the saved state intact.
    await page.locator('[data-nav="more"]').click();await page.locator('[data-action="open-import"]').click();
    const before=await page.evaluate(()=>localStorage.getItem(KEY));
    await page.locator('#restore-file').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"format":"hanzi-one-v2","state":{"progress":[]}}')});
    await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>localStorage.getItem(KEY)),before);
    // Export/restore from the actual UI, preserving thematic scores and intervals.
    const downloadEvent=page.waitForEvent('download');await page.locator('[data-action="export-backup"]').click();const download=await downloadEvent;
    const data=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(data.format,'hanzi-one-v2');assert.equal(Object.keys(data.state.units).length,10);
    await page.evaluate(()=>{state.units={};save();});
    await page.locator('#restore-file').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
    await page.waitForFunction(()=>Object.keys(state.units).length===10);
    await page.reload();await page.waitForFunction(()=>typeof hskLoading!=='undefined'&&!hskLoading&&document.querySelector('[data-action="open-units"]'));
    assert.equal(await page.evaluate(()=>Object.keys(state.units).length),10);
    // Optional real HSK fixture verifies 11,000 rows and progress migration.
    if(process.env.HANZI_HSK_FIXTURE){
      const payload=JSON.parse(fs.readFileSync(process.env.HANZI_HSK_FIXTURE,'utf8'));
      await context.unroute('https://raw.githubusercontent.com/**');await context.route('https://raw.githubusercontent.com/**',r=>r.fulfill({json:payload}));
      await page.locator('[data-action="load-hsk"]').click();await page.waitForFunction(()=>hskLoaded&&!hskLoading);
      const details=await page.evaluate(()=>({size:dataset.length,unresolved:Object.keys(state.progress).filter(id=>!byId(id))}));
      assert.equal(details.size,11000);assert.deepEqual(details.unresolved,[]);
      await page.locator('[data-nav="more"]').click();await page.locator('[data-action="open-import"]').click();
      const nextDownload=page.waitForEvent('download');await page.locator('[data-action="export-backup"]').click();const d=await nextDownload;
      const backup=JSON.parse(fs.readFileSync(await d.path(),'utf8'));assert.equal(backup.hsk.length,11000);
      await page.evaluate(async()=>{await setAssets({hsk:null,ruPack:null});dataset=SEED.slice();hskLoaded=false;state=HanziCore.normalizeState({});save();});
      await page.locator('#restore-file').setInputFiles({name:'hsk-backup.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
      await page.waitForFunction(()=>hskLoaded);assert.equal(await page.evaluate(()=>dataset.length),11000);assert.equal(await page.evaluate(()=>Object.keys(state.units).length),10);
    }
    await page.locator('[data-nav="home"]').click();
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);assert.equal(overflow,false);
    await page.screenshot({path:'/tmp/hanzi-one-home.png',fullPage:true});
    await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();
    await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);
    await context.setOffline(true);await page.reload();await page.locator('[data-action="open-units"]').first().waitFor();
    await page.locator('[data-action="open-units"]').first().click();assert.equal(await page.locator('[data-unit]').count(),10);
    assert.deepEqual(errors,[]);
    console.log('PASS: 60 exercises, error retry, completed card deck, writing selector, safe restore, backups, reload, mobile layout and offline shell');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
