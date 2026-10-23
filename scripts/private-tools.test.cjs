const fs=require('node:fs'),http=require('node:http'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root=path.resolve(__dirname,'..'),checks=[],errors=[];
const server=http.createServer((req,res)=>{try{const p=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webp':'image/webp'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))}catch{res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const b=await chromium.launch({channel:'msedge',headless:true});try{
const p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});p.setDefaultTimeout(25000);p.on('pageerror',e=>errors.push(e.message));p.on('dialog',d=>d.dismiss());await p.route('https://**/*',r=>r.abort());
await p.goto('http://127.0.0.1:'+server.address().port+'/app-fixed.html',{waitUntil:'load',timeout:45000});
const room=async id=>{await p.evaluate(id=>showScreen(id),id)};
await room('hope');await p.getByRole('button',{name:/Write a hope note/}).click();await p.locator('#hopeNoteText').fill('QA hope <b>private</b>');await p.locator('#hopeWorkspace').getByRole('button',{name:'SAVE PRIVATELY',exact:true}).click();assert.match(await p.evaluate(()=>localStorage.getItem('hopeRoomNotes')),/QA hope/);checks.push('Hope note save');
await room('meltdown');await p.locator('#meltdown .mm-support summary').click();await p.getByRole('button',{name:'Private journal',exact:true}).click();await p.locator('#meltdownJournal').fill('QA private journal');await p.getByRole('button',{name:'SAVE PRIVATELY',exact:true}).click();assert.equal(await p.evaluate(()=>localStorage.getItem('meltdownPrivateJournal')),'QA private journal');checks.push('Meltdown journal save');
await room('thinking');await p.getByRole('button',{name:/Write it out/}).click();await p.locator('#thinkingWriting').fill('QA private thoughts');await p.getByRole('button',{name:'SAVE PRIVATELY',exact:true}).click();assert.equal(await p.evaluate(()=>localStorage.getItem('thinkingPrivateWriting')),'QA private thoughts');checks.push('Thinking writing save');
await room('rant');await p.locator('#rantText').fill('QA rant text');await p.getByRole('button',{name:/Save privately/}).click();assert.match(await p.evaluate(()=>localStorage.getItem('meltdownPrivateRants')),/QA rant text/);checks.push('Rant save');
await room('companion');await p.getByRole('button',{name:'Name & preferences',exact:true}).click();await p.locator('#companionName').fill('QA Willow');

await p.locator('.pc-editor').getByRole('button',{name:/Save/,exact:false}).click();assert.match(await p.evaluate(()=>localStorage.getItem('meltdownCompanion'))||'',/QA Willow/);checks.push('Companion preferences save');
await p.reload({waitUntil:'load',timeout:45000});assert.equal(await p.evaluate(()=>localStorage.getItem('meltdownPrivateJournal')),'QA private journal');assert.equal(await p.evaluate(()=>localStorage.getItem('thinkingPrivateWriting')),'QA private thoughts');assert.match(await p.evaluate(()=>localStorage.getItem('hopeRoomNotes')),/QA hope/);checks.push('Private writing persists after reload');
for(const width of [320,390,844,1280]){await p.setViewportSize({width,height:844});await room('companion');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Companion overflow '+width);checks.push('Companion layout '+width)}
if(process.env.QA_SCREENSHOT)await p.screenshot({path:process.env.QA_SCREENSHOT});assert.deepEqual(errors,[]);
console.log(JSON.stringify({checks,errors}));
}finally{await b.close();server.close();if(process.env.QA_RESULTS)fs.writeFileSync(process.env.QA_RESULTS,JSON.stringify({checks,errors},null,2))}})().catch(e=>{console.error(e);process.exit(1)});
