import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const R=dirname(dirname(fileURLToPath(import.meta.url)));
const P=join(R,'evidence/static-reflow-20260905/raw');
assert.equal(process.argv.length,3,'Usage: node scripts/verify-static-reflow.mjs <new-output-directory>');
const O=resolve(process.argv[2]);
await mkdir(O);
const {chromium}=await import(pathToFileURL(join(R,'node_modules/playwright/index.mjs')).href);
const sha=b=>createHash('sha256').update(b).digest('hex');
const save=async(name,value)=>writeFile(join(O,name),JSON.stringify(value,null,2)+'\n');
const original=await readFile(join(P,'E6h-nodetasks-static-reflow-01/before/catalog/task-browser.html.txt'));
const current=await readFile(join(R,'catalog/task-browser.html'));
const index=await readFile(join(R,'catalog/search-index.js'));
const sourceNames=['scripts/build-catalog.mjs','catalog/task-browser.html','catalog/search-index.js','proof/corpus-receipt.json','apps/nodetasks_streamlit.py','scripts/verify-first-use.mjs','.github/workflows/ci.yml','HANDOFF.md'];
const bindings=await Promise.all(sourceNames.map(async path=>({path,sha256:sha(await readFile(join(R,path)))})));
const report={namedProof:'NODETASKS-STATIC-REFLOW-01',status:'RUNNING',at:new Date().toISOString(),root:R,bindings,originalHtmlSha256:sha(original),currentHtmlSha256:sha(current),indexSha256:sha(index),requests:[],errors:[],externalRequests:[],failures:[],comparisons:[],captures:[],actions:[],limits:['Finite local Chromium proof; no physical touch, OS/browser zoom, screen reader, performance or whole-product grade.','Existing 200-result/8-tag/4-reference display limits are preserved.']};
let requestCount=0;
const server=createServer((req,res)=>{
  requestCount++; if(report.requests.length<200)report.requests.push({method:req.method,path:req.url});
  if(requestCount>200){res.writeHead(429);res.end();return;}
  const bytes=req.url==='/before.html'?original:req.url==='/after.html'?current:req.url==='/search-index.js'?index:null;
  if(req.method!=='GET'||!bytes){res.writeHead(404);res.end();return;}
  res.writeHead(200,{'content-type':req.url.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8','content-length':bytes.length});res.end(bytes);
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
report.base=`http://127.0.0.1:${server.address().port}`;
let browser,context,page;
async function goto(version){await page.goto(`${report.base}/${version}.html`);await page.locator('.result').first().waitFor();}
async function selected(){await page.locator('#query').fill('nodeagent.storyboard.capture.v1');assert.equal(await page.locator('#summary').innerText(),'1 shown');}
async function observation(){return page.evaluate(()=>{
  const nodes=[...document.querySelectorAll('body,.shell,aside,.meta,main,.bar,.result,.result code')];
  const elements=nodes.slice(0,220).map(el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return{tag:el.tagName,class:el.className,text:el.textContent.trim().slice(0,150),x:r.x,right:r.right,width:r.width,y:r.y,height:r.height,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,minWidth:s.minWidth,gridTemplateColumns:s.gridTemplateColumns,overflowWrap:s.overflowWrap,flexWrap:s.flexWrap,overflowX:s.overflowX,fontSize:s.fontSize};});
  const outsideText=[];
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walk.nextNode()){
    const n=walk.currentNode,el=n.parentElement;
    if(!n.textContent.trim()||!el||el.closest('script,style,option,input,select'))continue;
    const range=document.createRange();range.selectNodeContents(n);
    for(const r of range.getClientRects()) if(r.width>0&&(r.x < -1||r.right>innerWidth+1))outsideText.push({tag:el.tagName,text:n.textContent.trim().slice(0,150),x:r.x,right:r.right});
  }
  return{viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY],documentWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth,elements,outsideText,resultTexts:[...document.querySelectorAll('.result')].map(el=>el.textContent),resultIds:[...document.querySelectorAll('.result .row:first-child code')].map(el=>el.textContent),summary:document.querySelector('#summary').textContent,activeId:document.activeElement?.id};
});}
async function capture(name,{required=false,label=false}={}){
  const data=await observation();
  if(required&&(data.overflow>0||data.outsideText.length))report.failures.push({name,overflow:data.overflow,outsideText:data.outsideText});
  await page.screenshot({path:join(O,`${name}.png`)});
  await writeFile(join(O,`${name}.html.txt`),await page.content());
  await save(`${name}.json`,data);
  report.captures.push({name,viewport:data.viewport,overflow:data.overflow,outsideText:data.outsideText.length,resultIds:data.resultIds,sha256:sha(await readFile(join(O,`${name}.png`)))});
  if(label){
    const marker=await page.addStyleTag({content:'.shell{outline:3px solid #ffea00;outline-offset:-3px}.result{outline:3px solid #ff45d9;outline-offset:-3px}'});
    await page.evaluate(()=>{const x=document.createElement('div');x.id='proof-boundary-label';x.textContent='3px: yellow page grid · pink full result';x.style.cssText='position:fixed;bottom:0;left:0;background:#000;color:#fff;padding:4px;font:12px sans-serif;z-index:999999';document.body.append(x);});
    await page.screenshot({path:join(O,`${name}-3px.png`)});
    await marker.evaluate(el=>el.remove());await page.locator('#proof-boundary-label').evaluate(el=>el.remove());
  }
  return data;
}
async function fingerprints(version){
  await goto(version);
  const output=[];
  const record=async action=>{const d=await observation();output.push({action,summary:d.summary,ids:d.resultIds,textSha256:sha(Buffer.from(JSON.stringify(d.resultTexts)))});};
  await record('initial-200');assert.equal(await page.locator('.result').count(),200);
  for(const word of ['nodeagent','graph','spreadsheetbench','bankertoolbench','trace','notebook','streamlit','model-attempt']){await page.getByRole('button',{name:word,exact:true}).click();await record(`quick:${word}`);}
  await page.locator('#query').fill('');
  await page.locator('#kind').selectOption('curated-live');await record('kind:curated-live');
  await page.locator('#family').selectOption('public-node-repo');await record('kind+family');
  await page.locator('#query').fill('nodeagent');await record('kind+family+query');
  await page.locator('#kind').selectOption('');await page.locator('#family').selectOption('');
  for(const text of ['zzzz-no-corpus-task-20260905','<img src=x onerror=alert(1)>','nodeagent.storyboard.capture.v1','  NODEAGENT   graph  ']){await page.locator('#query').fill(text);await record(`query:${text}`);}
  for(let cycle=0;cycle<3;cycle++)for(const word of ['trace','notebook','zzzz-no-corpus-task-20260905','nodeagent']){await page.locator('#query').fill(word);await record(`repeat:${cycle}:${word}`);}
  await page.locator('#query').focus();await page.keyboard.press('ControlOrMeta+A');await page.keyboard.type('nodeagent.storyboard.capture.v1');await record('native-keyboard-long-id');
  await page.keyboard.press('Tab');assert.equal(await page.locator('#kind').evaluate(el=>el===document.activeElement),true);await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await record('native-keyboard-kind');
  return output;
}
try{
  browser=await chromium.launch();
  context=await browser.newContext({viewport:{width:1440,height:960},reducedMotion:'no-preference'});
  await context.route('**/*',route=>{
    if(new URL(route.request().url()).origin===report.base)return route.continue();
    if(report.externalRequests.length<50)report.externalRequests.push(route.request().url());
    return route.abort('blockedbyclient');
  });
  page=await context.newPage();page.setDefaultTimeout(15000);
  page.on('pageerror',error=>{if(report.errors.length<50)report.errors.push(String(error));});
  page.on('console',message=>{if(message.type()==='error'&&report.errors.length<50)report.errors.push(message.text());});
  
  const before=await fingerprints('before'),after=await fingerprints('after');
  assert.deepEqual(after,before);report.comparisons=before.map(e=>({action:e.action,summary:e.summary,results:e.ids.length,textSha256:e.textSha256,exact:true}));
  await save('search-before.json',before);await save('search-after.json',after);
  for(const [width,height] of [[320,800],[360,800],[390,844],[768,1024],[1024,768],[1440,960],[1920,1080]]){
    await page.setViewportSize({width,height});
    if(width===390||width===1440){await goto('before');await selected();await page.evaluate(()=>scrollTo(0,0));await capture(`${width}-before-selected`,{label:true});}
    await goto('after');await selected();await page.evaluate(()=>scrollTo(0,0));
    const normal=await capture(`${width}-after-selected`,{required:true,label:width===390||width===1440});
    assert.equal(normal.resultTexts.length,1);assert.equal(sha(Buffer.from(JSON.stringify(normal.resultTexts))),before.find(e=>e.action==='query:nodeagent.storyboard.capture.v1').textSha256);
    await page.locator('#query').fill('zzzz-no-corpus-task-20260905');assert.equal(await page.locator('.result').count(),0);await capture(`${width}-empty`,{required:true});
    await page.locator('#query').fill('');assert.equal(await page.locator('.result').count(),200);await capture(`${width}-recovered-200`,{required:true});
    await selected();await page.emulateMedia({reducedMotion:'reduce'});
    const fonts=await page.evaluate(()=>{
      const els=[...document.querySelectorAll('body,body *')].filter(el=>!el.matches('script,style'));
      const sizes=els.map(el=>parseFloat(getComputedStyle(el).fontSize));
      els.forEach((el,i)=>el.style.setProperty('font-size',`${sizes[i]*2}px`,'important'));
      return els.map((el,i)=>({tag:el.tagName,id:el.id,class:el.className,before:sizes[i],after:parseFloat(getComputedStyle(el).fontSize)}));
    });
    assert.ok(fonts.every(e=>e.after===e.before*2));await save(`${width}-text200-fonts.json`,fonts);
    await page.locator('#query').focus();await page.evaluate(()=>scrollTo(0,0));await capture(`${width}-text200`,{required:true});
    await page.locator('.result').scrollIntoViewIfNeeded();await capture(`${width}-text200-result`,{required:true});
    await page.emulateMedia({reducedMotion:'no-preference'});
    report.actions.push({viewport:[width,height],selectedExact:true,zeroAnd200Recovery:true,text200Method:'Every computed element font doubled simultaneously; native browser/OS zoom NOT_RUN',fontChecks:fonts.length});
  }
  if(report.errors.length||report.externalRequests.length)report.failures.push({errors:report.errors,externalRequests:report.externalRequests});
  report.status=report.failures.length?'FAIL_OBSERVED_GEOMETRY':'PASS';
  if(report.failures.length)process.exitCode=1;
}catch(error){report.status='FAIL';report.error=error.stack||String(error);process.exitCode=1;if(page)await page.screenshot({path:join(O,'failure.png')}).catch(()=>{});}
finally{
  if(context)await context.close().catch(error=>report.failures.push({cleanup:'context',error:String(error)}));
  if(browser)await browser.close().catch(error=>report.failures.push({cleanup:'browser',error:String(error)}));
  await new Promise(done=>server.close(done));
  if(report.failures.length){report.status='FAIL';process.exitCode=1;}
  report.runtimeClosed=true;report.sourceUnchanged=true;
  for(const e of bindings)if(sha(await readFile(join(R,e.path)))!==e.sha256){report.sourceUnchanged=false;report.status='FAIL_SOURCE_DRIFT';process.exitCode=1;}
  report.finishedAt=new Date().toISOString();await save('report.json',report);
  console.log(JSON.stringify({status:report.status,captures:report.captures.length,comparisons:report.comparisons.length,failures:report.failures.map(x=>({name:x.name,overflow:x.overflow,outsideText:x.outsideText?.length})),runtimeClosed:report.runtimeClosed,sourceUnchanged:report.sourceUnchanged,out:O}));
}
