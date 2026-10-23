const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const root=path.resolve(__dirname,'..');
 const server=http.createServer((req,res)=>{
  const file=path.join(root,new URL(req.url,'http://localhost').pathname);
  try{res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':'text/html');res.end(fs.readFileSync(file.endsWith(path.sep)?file+'index.html':file))}catch{res.writeHead(404);res.end()}
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({channel:'msedge',headless:true});
 const results=[];
 try{
  for(const width of [320,390,844,1280]){
   const page=await browser.newPage({viewport:{width,height:width===844?390:844}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.clock.install();
   await page.addInitScript(()=>{
    window.__countdowns=new Map();
    const set=window.setInterval.bind(window),clear=window.clearInterval.bind(window);
    window.setInterval=(fn,delay,...args)=>{const id=set(fn,delay,...args);if(delay===1000)window.__countdowns.set(id,()=>fn(...args));return id};
    window.clearInterval=id=>{window.__countdowns.delete(id);clear(id)};
   });
   await page.goto('http://127.0.0.1:'+server.address().port+'/games/index.html');
   assert.equal(await page.getByRole('link',{name:'Back to The Meltdown Room'}).getAttribute('href'),'../index.html');
   await page.getByRole('button',{name:'Comfort settings'}).click();
   assert.equal(await page.getByRole('dialog',{name:'Play your way'}).count(),1);
   assert.equal(await page.getByRole('button',{name:'Untimed mode'}).getAttribute('aria-pressed'),'true');
   assert.ok(await page.getByRole('button',{name:'Game sounds unavailable'}).isDisabled());
   await page.keyboard.press('Escape');
   assert.ok(await page.getByRole('button',{name:'Comfort settings'}).evaluate(x=>x===document.activeElement));
   for(const game of ['Cloud Catcher','Shape Escape','Cozy Sort','Sudoku','Mahjong Solitaire','Word Square']){
    await page.locator('[data-game="'+game+'"]').click();
    assert.equal(await page.getByRole('dialog',{name:game,exact:true}).count(),1);
    if(game==='Mahjong Solitaire')await page.locator('[data-m="challenge"]').click();
    if(game==='Sudoku')await page.locator('[data-d="easy"]').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow '+width+' '+game);
    if(['Cloud Catcher','Shape Escape','Mahjong Solitaire','Word Square'].includes(game)){
     assert.equal(await page.evaluate(()=>window.__countdowns.size),0,'untimed countdown registered');
     await page.clock.fastForward(125000);
     assert.match(await page.locator('#gameStatus').textContent(),/Untimed/);
     assert.doesNotMatch(await page.locator('#gameStatus').textContent(),/Time is up|Round complete|Net down|You solved/);
    }
    await page.getByRole('button',{name:'Play again'}).click();
    const close=page.getByRole('dialog',{name:game,exact:true}).getByRole('button',{name:'Close dialog'});
    await close.focus();await page.keyboard.press('Shift+Tab');
    assert.ok(await page.getByRole('button',{name:'Back to games'}).evaluate(x=>x===document.activeElement));
    await page.keyboard.press('Tab');assert.ok(await close.evaluate(x=>x===document.activeElement));
    await page.keyboard.press('Escape');
    assert.ok(await page.locator('[data-game="'+game+'"]').evaluate(x=>x===document.activeElement));
   }
   if(width===390){
    await page.getByRole('button',{name:'Comfort settings'}).click();await page.getByRole('button',{name:'Untimed mode'}).click();await page.keyboard.press('Escape');
    for(const [game,seconds] of [['Cloud Catcher',30],['Shape Escape',30],['Word Square',90],['Mahjong Solitaire',120]]){
     await page.locator('[data-game="'+game+'"]').click();
     if(game==='Mahjong Solitaire')await page.locator('[data-m="challenge"]').click();
     assert.equal(await page.evaluate(()=>window.__countdowns.size),1);
     await page.evaluate(seconds=>{for(let i=0;i<=seconds;i++)for(const fn of [...window.__countdowns.values()])fn()},seconds);
     assert.match(await page.locator('#gameStatus').textContent(),/Score:.*token/);
     await page.keyboard.press('Escape');
    }
   }
   assert.deepEqual(errors,[]);results.push({width,games:6,untimed:'passed',keyboard:'passed',pageOverflow:'none'});console.log('Passed viewport '+width);await page.close();
  }
  console.log(JSON.stringify({passed:results,timedCountdowns:4,limits:'Local arcade HTML/JS only; artwork assets and live site not loaded.'},null,2));
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});

