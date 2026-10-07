import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {resolve,extname,sep} from 'node:path';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://localhost');const p=resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(!p.startsWith(root+sep)){res.writeHead(403).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.mp4':'video/mp4','.webmanifest':'application/manifest+json'})[extname(p)]||'text/plain');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
const errors=[],checks=[];let total=0;
for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
const page=await browser.newPage({viewport:size,isMobile:size.width<900,hasTouch:size.width<900,reducedMotion:'reduce'});
page.on('pageerror',e=>errors.push(e.message));
page.on('dialog',dialog=>dialog.dismiss());
if(size.width===320)await page.route('**/cdn.jsdelivr.net/npm/@supabase/**',route=>route.abort());
await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
assert.equal(await page.locator('img[src*="founder-sunshine"],img[src*="sunshine-and-steven"]').count(),0);
assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Website overflow '+size.width);
await page.getByRole('button',{name:'Watch Welcome Video'}).click();
assert.ok(await page.locator('#welcome-video-dialog').evaluate(x=>x.open));await page.keyboard.press('Escape');
await page.getByRole('link',{name:'Enter The Meltdown Room',exact:true}).first().click();
await page.waitForFunction(()=>document.querySelector('#app').contentDocument.querySelector('.mr-phone-header'));
const frame=page.frames().find(f=>f!==page.mainFrame());page.setDefaultTimeout(30000);
await frame.evaluate(()=>window.showScreen('not-a-room'));
assert.equal(await frame.locator('.screen.active').count(),1);
const ids=await frame.locator('.screen').evaluateAll(xs=>xs.filter(x=>!x.hidden).map(x=>x.id));
for(const id of ids){
await frame.evaluate(id=>window.showScreen(id),id);
assert.equal(await frame.locator('.screen.active').getAttribute('id'),id);
assert.ok(await frame.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'App overflow '+id+' '+size.width);
assert.deepEqual(await frame.locator('.screen.active img').evaluateAll(xs=>xs.filter(x=>x.complete&&!x.naturalWidth).map(x=>x.getAttribute('src').slice(0,80))),[]);
if(size.width<=760&&!['home','entrance'].includes(id)){
await frame.locator('#'+id+' .mr-phone-navigation').getByRole('button',{name:'Great Room',exact:true}).click();
assert.equal(await frame.locator('.screen.active').getAttribute('id'),'great');
await frame.evaluate(id=>window.showScreen(id),id);
await frame.locator('#'+id+' .mr-phone-navigation').getByRole('button',{name:'Home',exact:true}).click();
assert.equal(await frame.locator('.screen.active').getAttribute('id'),'home');
}
total++;
}
if(size.width===390){
await frame.evaluate(()=>window.showScreen('hope'));
await frame.locator('#hope .mr-phone-actions').getByRole('button',{name:'Leave Myself a Hope Note',exact:true}).click();
await frame.locator('#hopeNoteText').fill('QA private hope note');
await frame.locator('#hopeWorkspace').getByRole('button',{name:'SAVE PRIVATELY',exact:true}).click();
assert.match(await frame.locator('#hopeStatus').textContent(),/Saved/);
await frame.evaluate(()=>window.showScreen('memorial'));
await frame.getByRole('button',{name:'Open memorial memory 1',exact:true}).click();
await frame.locator('#mrMemorialText').fill('QA memorial memory');
await frame.locator('[data-memorial-edit="save"]').click();
assert.match(await frame.locator('[data-memorial-slot="0"]').textContent(),/QA memorial memory/);
await frame.evaluate(()=>window.showScreen('plan'));
const fields=frame.locator('#plan textarea');await fields.first().fill('QA plan');
await frame.locator('#plan').getByRole('button',{name:'SAVE PRIVATELY',exact:true}).click();
await page.reload({waitUntil:'domcontentloaded',timeout:30000});await page.waitForFunction(()=>document.querySelector('#app').contentDocument.querySelector('.mr-phone-header'));
const refreshed=page.frames().find(f=>f!==page.mainFrame());
assert.equal(await refreshed.evaluate(()=>JSON.parse(localStorage.getItem('hopeRoomNotes'))[0].text),'QA private hope note');
assert.match(await refreshed.evaluate(()=>localStorage.getItem('meltdownReflectionLibrary')),/QA memorial memory/);
await refreshed.evaluate(()=>window.showScreen('memorial'));
if(process.env.QA_SCREENSHOT)await page.screenshot({path:process.env.QA_SCREENSHOT});
checks.push('hope and memorial notes persist after reload; planning save runs');
}
checks.push('Website/video/18 screens/images/navigation at '+size.width+'x'+size.height);await page.close();
}
assert.deepEqual(errors,[]);
console.log(JSON.stringify({passed:total,checks,errors}));
}finally{await browser.close();server.close();}
