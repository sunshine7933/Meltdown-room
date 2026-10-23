const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const result={screens:[],errors:[],missing:[],checks:[]};
const server=http.createServer((req,res)=>{try{const u=new URL(req.url,'http://localhost');let p=path.resolve(root,'.'+decodeURIComponent(u.pathname));if(u.pathname.endsWith('/'))p=path.join(p,'index.html');if(!p.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',({'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4'})[path.extname(p)]||'application/octet-stream');res.end(fs.readFileSync(p))}catch{result.missing.push(req.url);res.writeHead(404).end()}});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({channel:'msedge',headless:true});
try{for(const size of [{width:320,height:568},{width:390,height:844},{width:844,height:390},{width:1280,height:900}]){
 const page=await browser.newPage({viewport:size,reducedMotion:'reduce'});page.setDefaultTimeout(30000);
 page.on('pageerror',e=>result.errors.push({width:size.width,error:e.message}));page.on('dialog',d=>d.dismiss());
 await page.route('https://**/*',route=>route.abort()); // Local-only sweep: no accounts, ads, location or external writes.
 await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'load',timeout:45000});
 const homeOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);result.checks.push({width:size.width,homepageOverflow:homeOverflow});
 await page.locator('[data-open-welcome]').click();result.checks.push({width:size.width,previewOpen:await page.locator('#welcome-video-dialog').evaluate(x=>x.open)});await page.keyboard.press('Escape');
 await page.getByRole('link',{name:'Enter the Rooms',exact:true}).first().click();await page.waitForFunction(()=>typeof showScreen==='function'&&document.querySelector('.mr-global-nav'));
 const ids=await page.locator('.screen').evaluateAll(xs=>xs.filter(x=>!x.hidden).map(x=>x.id));
 for(const id of ids){await page.evaluate(id=>showScreen(id),id);
  const screen=await page.evaluate(()=>{const x=document.querySelector('.screen.active');return {id:x?.id,activeCount:document.querySelectorAll('.screen.active').length,overflow:document.documentElement.scrollWidth>innerWidth,brokenImages:[...x.querySelectorAll('img')].filter(i=>i.complete&&!i.naturalWidth).map(i=>i.getAttribute('src')),buttons:[...x.querySelectorAll('button,a')].filter(b=>b.getClientRects().length).map(b=>({text:(b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' '),onclick:b.getAttribute('onclick'),href:b.getAttribute('href')})),oversize:[...x.querySelectorAll('*')].filter(e=>e.getBoundingClientRect().right>innerWidth+1&&getComputedStyle(e).position!=='absolute').slice(0,5).map(e=>({tag:e.tagName,id:e.id,class:e.className}))}});
  result.screens.push({width:size.width,requested:id,...screen});
 }
 if(process.env.QA_SCREENSHOT_DIR)await page.screenshot({path:path.join(process.env.QA_SCREENSHOT_DIR,'sweep-'+size.width+'.png')});console.log('Inspected '+ids.length+' screens at '+size.width);await page.close();
}
}finally{await browser.close();server.close();if(process.env.QA_RESULTS)fs.writeFileSync(process.env.QA_RESULTS,JSON.stringify(result,null,2));if(result.errors.length||result.missing.length||result.screens.some(x=>x.overflow||x.brokenImages.length||x.activeCount!==1))process.exitCode=1;console.log(JSON.stringify({screenChecks:result.screens.length,errors:result.errors,missing:[...new Set(result.missing)],failures:result.screens.filter(x=>x.overflow||x.brokenImages.length||x.activeCount!==1).map(({buttons,...x})=>x),checks:result.checks},null,2))}})().catch(e=>{console.error(e);process.exit(1)});
