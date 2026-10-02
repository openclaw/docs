#!/usr/bin/env node
// Twenty locale/theme/viewport audits. Use an existing full build, per-locale
// bounded previews, or DOCS_LOCALE_VISUAL_ORIGIN for live deployment proof.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {chromium,webkit} from 'playwright';
import {homeStringsForLocale} from './home-strings.mjs';
const artifacts=path.resolve(process.env.DOCS_LOCALE_VISUAL_ARTIFACT_DIR||'.cache/docs-locale-visual');
fs.mkdirSync(artifacts,{recursive:true});
const locales=['en','de','ar','ja-JP','fr'];
const previewRoot=process.env.DOCS_LOCALE_PREVIEW_ROOT;
let server;
let base=process.env.DOCS_LOCALE_VISUAL_ORIGIN;
if(!base){
 const root=path.resolve(previewRoot||'dist/docs-site');
 const types={'.html':'text/html','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.json':'application/json'};
 server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const prefix=pathname.split('/')[1];const locale=locales.includes(prefix)?prefix:'en';
  const site=previewRoot?path.join(root,locale):root;const target=path.resolve(site,'.'+pathname);
  const file=[target,path.join(target,'index.html')].find(f=>f.startsWith(site+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile());
  if(!file)return res.writeHead(404).end();res.setHeader('content-type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${server.address().port}`;
}
const configs=[{width:1440,theme:'dark',engine:'chromium'},{width:1440,theme:'light',engine:'webkit'},{width:390,theme:'dark',engine:'webkit'},{width:390,theme:'light',engine:'chromium'}];
const browsers={chromium:await chromium.launch({headless:true}),webkit:await webkit.launch({headless:true})};
const passes=[];let layoutReference;
async function inviteCheck(page,errors,label){
 const invite=page.locator('.community-invite');
 if(!await invite.isVisible())return;
 const state=await invite.evaluate(node=>{const card=node.getBoundingClientRect();const links=[...node.querySelectorAll('.community-invite__cta')].map(a=>a.getBoundingClientRect());return {card:card.toJSON(),links:links.map(r=>r.toJSON()),fits:card.left>=-1&&card.right<=innerWidth+1&&card.top>=-1&&card.bottom<=innerHeight+1,linksFit:links.length===3&&links.every(r=>r.left>=card.left-1&&r.right<=card.right+1&&r.top>=card.top-1&&r.bottom<=card.bottom+1)}});
 if(!state.fits||!state.linksFit)errors.push({check:label+' invitation clipping',state});
}
try{
 for(const locale of locales)for(const config of configs){
  const number=passes.length+1;const name=`${String(number).padStart(2,'0')}-${locale}-${config.theme}-${config.width}-${config.engine}`;
  const errors=[];const screenshots=[];const context=await browsers[config.engine].newContext({viewport:{width:config.width,height:config.width===390?844:1000},reducedMotion:'reduce'});
  context.setDefaultTimeout(8000);await context.addInitScript(theme=>localStorage.setItem('theme',theme),config.theme);
  const page=await context.newPage();page.on('pageerror',error=>errors.push({check:'pageerror',message:error.message}));
  const prefix=locale==='en'?'':`/${locale}`;const copy=homeStringsForLocale(locale);
  try{
   await page.goto(`${base}${prefix}/`,{waitUntil:'networkidle'});
   await page.locator('.home-layout').waitFor();
   const state=await page.evaluate(()=>({home:document.body.classList.contains('docs-home-layout'),oldHero:document.querySelectorAll('.docs-hero').length,background:document.querySelectorAll('.home-hero').length,sections:[...document.querySelector('.home-layout').children].map(n=>n.className),description:document.querySelector('.home-description').textContent,quickNav:[...document.querySelectorAll('.docs-quick-nav .nav-link span')].map(n=>n.textContent),overflow:document.documentElement.scrollWidth>innerWidth+1}));
   layoutReference??=state.sections;
   if(!state.home||state.oldHero||state.background!==1||state.overflow||JSON.stringify(state.sections)!==JSON.stringify(layoutReference))errors.push({check:'home structure',state});
   if(!state.description.includes(copy.tagline[0])||JSON.stringify(state.quickNav)!==JSON.stringify(copy.navigation.slice(1,6)))errors.push({check:'localized shell',state});
   await inviteCheck(page,errors,'home desktop');
   const heroFile=path.join(artifacts,name+'-home.png');await page.screenshot({path:heroFile,animations:'disabled'});screenshots.push(heroFile);
   await page.locator('[data-language-trigger]').click();
   const language=await page.locator('.language-menu').boundingBox();
   if(!language||language.x< -1||language.x+language.width>config.width+1)errors.push({check:'language menu bounds',language});
   await page.keyboard.press('Escape');
   await page.locator('.site-header [data-search-open]').click();
   await page.locator('[data-search-input]').waitFor({state:'visible'});await page.keyboard.press('Escape');
   if(config.width===390){
    await page.locator('[data-nav-toggle]').click();
    await page.waitForFunction(()=>Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.sidebar')).transform).m41)<0.1);
    await page.waitForFunction(()=>{const sidebar=document.querySelector('.sidebar').getBoundingClientRect();const card=document.querySelector('.community-invite').getBoundingClientRect();return Math.abs(card.left-sidebar.left)<0.1;});await inviteCheck(page,errors,'mobile drawer');
    const drawerFile=path.join(artifacts,name+'-drawer.png');await page.screenshot({path:drawerFile,animations:'disabled'});screenshots.push(drawerFile);
    await page.locator('[data-nav-close]').click();
   }
   for(const selector of ['.home-quick-links','.home-setup','.home-channels','.home-guides','.home-capabilities','.home-about','.home-community','.site-footer']){
    const section=page.locator(selector);await section.scrollIntoViewIfNeeded();
    await section.locator('img').evaluateAll(async images=>{await Promise.all(images.map(image=>{image.loading='eager';return image.decode().catch(()=>{})}))});
    const bad=await section.evaluate(node=>[node,...node.querySelectorAll('h1,h2,h3,p,a,button')].filter(el=>{if(el.closest('svg'))return false;const r=el.getBoundingClientRect();const s=getComputedStyle(el);return r.width>0&&s.visibility!=='hidden'&&(r.left< -1||r.right>innerWidth+1||el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&s.overflowX==='hidden')}).slice(0,5).map(el=>({tag:el.tagName,class:el.className,text:el.textContent.slice(0,100),rect:el.getBoundingClientRect().toJSON(),clientWidth:el.clientWidth,scrollWidth:el.scrollWidth})));
    if(bad.length)errors.push({check:'section bounds '+selector,bad});
   }
   await page.evaluate(()=>scrollTo({top:document.scrollingElement.scrollHeight,behavior:'instant'}));
   await page.waitForFunction(()=>innerHeight-document.querySelector('.docs-chat-launcher').getBoundingClientRect().bottom<40);
   const footerObscured=await page.evaluate(()=>{const a=document.querySelector('.site-footer-legal a').getBoundingClientRect(),b=document.querySelector('.docs-chat-launcher').getBoundingClientRect();return a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top});
   if(footerObscured)errors.push({check:'footer link obscured by chat'});
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   const fullFile=path.join(artifacts,name+'-full.jpg');await page.screenshot({path:fullFile,fullPage:true,type:'jpeg',quality:70,animations:'disabled'});screenshots.push(fullFile);
   await page.evaluate(()=>window.__localeAuditNavigation=1);
   if(config.width===390)await page.locator('[data-nav-toggle]').click();
   await page.locator(`.docs-quick-nav a[href="${prefix}/start/getting-started"]`).click();
   await page.waitForURL(url=>url.pathname.replace(/\/$/,'')===`${prefix}/start/getting-started`);
   await page.locator('.article-header h1').waitFor();
   const article=await page.evaluate(()=>({sameDocument:window.__localeAuditNavigation===1,home:document.body.classList.contains('docs-home-layout'),layout:document.querySelectorAll('.home-layout').length,background:document.querySelectorAll('.home-hero').length,overflow:document.documentElement.scrollWidth>innerWidth+1,title:getComputedStyle(document.querySelector('.article-header h1')).fontSize}));
   if(!article.sameDocument||article.home||article.layout||article.background!==1||article.overflow)errors.push({check:'article navigation',article});
   await inviteCheck(page,errors,'article');
   const articleFile=path.join(artifacts,name+'-article.png');await page.screenshot({path:articleFile,animations:'disabled'});screenshots.push(articleFile);
   await page.locator('.site-header .brand').click();await page.locator('.home-layout').waitFor();
   if(await page.locator('.home-layout').count()!==1||await page.locator('.docs-hero').count())errors.push({check:'return-home composition'});
  }catch(error){errors.push({check:'exception',message:error.message});await page.screenshot({path:path.join(artifacts,name+'-error.png'),animations:'disabled'}).catch(()=>{});}
  finally{await context.close();}
  passes.push({number,locale,...config,passed:errors.length===0,errors,screenshots});
  fs.writeFileSync(path.join(artifacts,'audit.json'),JSON.stringify({base,checkedAt:new Date().toISOString(),passes},null,2));
  console.log(`${name}: ${errors.length?JSON.stringify(errors):'PASS'}`);
 }
}finally{await Promise.all(Object.values(browsers).map(browser=>browser.close()));server?.close();}
console.log(`${passes.filter(p=>p.passed).length}/${passes.length} audit passes clean`);
process.exitCode=passes.some(p=>!p.passed)?1:0;
