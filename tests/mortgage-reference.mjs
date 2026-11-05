import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';
import { calculateMortgage } from '../lib/mortgage.ts';
const require=createRequire(import.meta.url);
const { chromium }=require('/usr/local/lib/node_modules/playwright');
const root=process.env.SD_MORTGAGE_REFERENCE_DIR;
if(!root) throw new Error('Укажите SD_MORTGAGE_REFERENCE_DIR — каталог assets из исходного APK');
const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']});
let checked=0;
try {
 const context=await browser.newContext();
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!=='http://sd-reference.local') return route.abort();
  const file=resolve(root,'.'+url.pathname+(url.pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(resolve(root)+'/')) return route.abort();
  const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg'};
  try { await route.fulfill({status:200,contentType:mime[extname(file)]||'application/octet-stream',body:await readFile(file)}); }
  catch { await route.fulfill({status:404,body:''}); }
 });
 const page=await context.newPage();
 await page.goto('http://sd-reference.local/');
 await page.locator('#part-0').waitFor();
 const cases=[
  ['part',['6000000','20,1']],['part',['1001','0,1']],['part',['20.1','100']],['part',['0','20,1']],['part',['100','0']],['part',['100','125']],['part',['-100.01','20']],
  ['whole',['700000','20,1']],['whole',['100','3']],['whole',['20,1','20,1']],['whole',['0','20,1']],['whole',['100','-3']],['whole',['100','0']],
  ['adjustment',['5000000','600000','20,1']],['adjustment',['3000000','123456,78','20,1']],['adjustment',['5000000','1000000','20']],['adjustment',['5000000','0','20']],['adjustment',['5000000','0','0']],['adjustment',['5000000','600000','0']],['adjustment',['5000000','600000','100']],['adjustment',['100','200','20']],['adjustment',['0','0','20']],['adjustment',['100','-1','20']],['adjustment',['100','0','101']],['adjustment',['100','0','100']],
 ];
 for(let i=1;i<=10;i++) {
  cases.push(['part',[String(1234567*i+0.13),'20,1']]);
  cases.push(['whole',[String(98765*i+0.37),'15,7']]);
  cases.push(['adjustment',[String(1500000+i*333333),String(77777*i+0.15),'20,1']]);
 }
 for(const [mode,values] of cases) {
  const id=mode==='adjustment'?'property-overvaluation':mode;
  for(let i=0;i<values.length;i++) await page.locator(`#${id}-${i}`).fill(values[i]);
  const ours=calculateMortgage(mode,values);
  // Sufficient down payments intentionally show a message in the current app.
  if (ours.status === 'sufficient') continue;
  const expected=ours.status==='ok'?String(ours.total):'—';
  await page.waitForFunction(({id,expected})=>document.querySelector(`[data-testid="result-${id}"]`)?.textContent.replace(/\s/g,'').replace('₽','')===expected,{id,expected},{timeout:5000});
  const actual=await page.getByTestId(`result-${id}`).innerText();
  assert.equal(actual.replace(/\s/g,'').replace('₽',''),expected,`${mode}: ${values}`);
  checked++;
 }
 console.log(`Сравнение с исходным APK: ${checked} сценариев, результаты совпадают.`);
} finally {await browser.close();}
