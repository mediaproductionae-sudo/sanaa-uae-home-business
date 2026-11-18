import {chromium} from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('out');
const artifacts=path.resolve('work/responsive-qa');await fs.mkdir(artifacts,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
const results=[];
for(const [width,height,dpr] of [[1920,1080,1],[1440,900,1],[1366,768,1],[1024,768,2],[820,1180,2],[390,844,3],[360,800,3],[683,384,1],[320,600,2]]){
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.route('http://sanaa.test/**',async route=>{let url=new URL(route.request().url());let p=decodeURIComponent(url.pathname);if(p.endsWith('/'))p+='index.html';try{await route.fulfill({path:path.join(root,p)})}catch{await route.fulfill({status:404,body:'Not found'})}});
await page.goto('http://sanaa.test/',{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);
const layout=await page.evaluate(()=>{const selectors=['.hero','.products','.stores','.story'];return {viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,rtl:document.documentElement.dir,columns:Object.fromEntries(selectors.map(s=>[s,getComputedStyle(document.querySelector(s)).gridTemplateColumns])),overflow:[...document.querySelectorAll('body *')].filter(el=>{const r=el.getBoundingClientRect();const viewport=el.closest('svg.brand-logo');const clippedLogoImage=el.tagName==='image'&&viewport&&getComputedStyle(viewport).overflow==='hidden';return !clippedLogoImage&&r.width&&getComputedStyle(el).position!=='fixed'&&(r.left<-.5||r.right>innerWidth+.5)}).map(el=>el.className).filter(x=>x!=='skip'),smallTargets:[...document.querySelectorAll('button,a,select,input')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&r.height>0&&(r.height<43||r.width<43)}).map(el=>({class:el.className,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height}))}});
await page.screenshot({path:`${artifacts}/initial-${width}x${height}.png`,fullPage:true});
await page.getByRole('button',{name:'حفظ خزف يحمل دفء التفاصيل'}).click();await page.getByRole('button',{name:'حفظ خزف يحمل دفء التفاصيل'}).getAttribute('aria-pressed').then(x=>{if(x!=='true')errors.push('favorite did not toggle')});
await page.getByRole('button',{name:'تفاصيل خزف يحمل دفء التفاصيل'}).click();await page.waitForURL('**/product/1/');await page.locator('main h1').waitFor();await page.goBack({waitUntil:'networkidle'});await page.locator('.hero').waitFor();
if(width<=950){await page.getByRole('button',{name:'القائمة',exact:true}).click();await page.keyboard.press('Escape');}
await page.getByRole('combobox',{name:'اختر الإمارة'}).selectOption('دبي');if(await page.locator('.product').count()!==1)errors.push('emirate filter');
await page.screenshot({path:`${artifacts}/${width}x${height}.png`,fullPage:true});
results.push({width,height,dpr,...layout,errors});await context.close();
}
await browser.close();await fs.writeFile(`${artifacts}/results.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));

if(results.some(r=>r.scrollWidth>r.viewport||r.overflow.length||r.smallTargets.length||r.errors.length))process.exitCode=1;
