import {chromium} from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('out'),artifacts=path.resolve('work/link-qa');await fs.mkdir(artifacts,{recursive:true});
const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.ttf':'font/ttf','.ico':'image/x-icon'};
const server=http.createServer(async(req,res)=>{try{let pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);let file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)&&file!==root){res.writeHead(403).end();return}try{if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html')}catch{if(!path.extname(file))file=path.join(file,'index.html')}let data;try{data=await fs.readFile(file)}catch{res.writeHead(404,{'content-type':'text/html'});res.end(await fs.readFile(path.join(root,'404.html')));return}res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream'});res.end(data)}catch{res.writeHead(400).end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
let activePage;
const routes=['/','/stores/','/products/','/categories/','/favorites/','/cart/','/login/','/register/','/profile/','/orders/','/complaints/','/seller/dashboard/',...['store','product'].flatMap(type=>[1,2,3,4].map(id=>`/${type}/${id}/`))];
try{const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('http://sanaa.test/**',async route=>{const u=new URL(route.request().url());const r=await fetch(base+u.pathname+u.search);await route.fulfill({status:r.status,body:Buffer.from(await r.arrayBuffer()),headers:{'content-type':r.headers.get('content-type')||'application/octet-stream'}})});
const hrefs=new Set();for(const r of routes){await page.goto('http://sanaa.test'+r,{waitUntil:'networkidle'});await page.waitForFunction(()=>!document.querySelector('[aria-busy="true"]'));for(const h of await page.locator('a[href]').evaluateAll(a=>a.map(n=>n.href)))hrefs.add(h)}
for(const h of hrefs){const u=new URL(h);assert.equal(u.origin,'http://sanaa.test');const r=await fetch(base+u.pathname+u.search);assert.equal(r.status,200,h);if(u.hash){await page.goto(h,{waitUntil:'networkidle'});assert.ok(await page.locator(u.hash).count(),h)}}assert.deepEqual(errors,[]);await fs.writeFile(path.join(artifacts,'results.json'),JSON.stringify({pages:routes.length,links:[...hrefs],errors},null,2));console.log(`PASS: ${hrefs.size} unique rendered links from ${routes.length} pages; hash targets valid`)}finally{await browser.close();server.close()}
