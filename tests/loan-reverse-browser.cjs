const {chromium}=require('/usr/local/lib/node_modules/playwright');
const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']});try{
 const context=await browser.newContext({viewport:{width:375,height:812}});
 if(process.env.SD_ANDROID_ASSETS){
 const {readFile}=require('node:fs/promises');const {resolve,extname}=require('node:path');const root=resolve(process.env.SD_ANDROID_ASSETS);
 await context.route('**/*',async route=>{const u=new URL(route.request().url());const file=resolve(root,'.'+decodeURIComponent(u.pathname)+(u.pathname.endsWith('/')?'index.html':''));if(u.origin!=='http://127.0.0.1:3000'||!file.startsWith(root+'/'))return route.abort();try{await route.fulfill({body:await readFile(file),contentType:({'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.woff2':'font/woff2'}[extname(file)]||'application/octet-stream')});}catch{await route.fulfill({status:404,body:''});}});
 }
 const p=await context.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 const click=async name=>p.getByRole('button',{name,exact:true}).click();
 const compact=async id=>(await p.getByTestId(id).innerText()).replace(/\s/g,'');
 await p.goto('http://127.0.0.1:3000');await click('Кредитный калькулятор');
 await p.locator('#loan-principal').fill('3000000');await p.locator('#loan-term').fill('15');await p.locator('#loan-rate').fill('18');await click('РАССЧИТАТЬ');assert.equal(await compact('loan-monthly'),'48312,63₽');
 await click('По ежемесячному платежу');assert.equal(await p.locator('#loan-payment').inputValue(),'');assert.equal(await p.getByTestId('loan-available-principal').count(),0);
 await p.locator('#loan-payment').fill('40000');await p.locator('#loan-term').fill('15');await p.locator('#loan-rate').fill('18');
 for(const id of ['loan-payment','loan-term','loan-rate']){const field=p.locator('#'+id);await field.press('Enter');assert(await field.evaluate(e=>e!==document.activeElement));assert.equal(await p.getByTestId('loan-available-principal').count(),0);}
 await click('РАССЧИТАТЬ');assert.equal(await compact('loan-available-principal'),'2483822,49₽');assert.equal(await compact('loan-total'),'7199999,99₽');assert.equal(await compact('loan-interest'),'4716177,50₽');
 await click('По сумме кредита');assert.equal(await p.locator('#loan-principal').inputValue(),'3 000 000');assert.equal(await compact('loan-monthly'),'48312,63₽');
 await click('По ежемесячному платежу');assert.equal(await p.locator('#loan-payment').inputValue(),'40 000');assert.equal(await compact('loan-available-principal'),'2483822,49₽');
 for(const width of [320,360,375,414,768,1440]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));}
 await p.setViewportSize({width:375,height:812});
 await p.locator('#loan-rate').fill('0');assert.equal(await compact('loan-available-principal'),'2483822,49₽');await p.getByText('Параметры изменены.',{exact:false}).waitFor();await click('РАССЧИТАТЬ');assert.equal(await compact('loan-available-principal'),'7200000,00₽');assert.equal(await compact('loan-interest'),'0,00₽');
 await p.getByLabel('Единицы срока кредита').selectOption('months');await p.locator('#loan-term').fill('180');await p.locator('#loan-rate').fill('18');await click('РАССЧИТАТЬ');assert.equal(await compact('loan-available-principal'),'2483822,49₽');
 for(const [field,value,error] of [['#loan-term','361','Срок кредита должен составлять не более 30 лет'],['#loan-term','1.5','целое положительное число месяцев'],['#loan-payment','-1','платёж больше нуля'],['#loan-payment','1.015','с точностью до копеек'],['#loan-rate','-1','корректную ставку']]){
 await p.locator('#loan-payment').fill('40000');await p.locator('#loan-term').fill('180');await p.locator('#loan-rate').fill('18');await p.locator(field).fill(value);await click('РАССЧИТАТЬ');assert((await p.locator('form [role="alert"]').innerText()).includes(error));assert.equal(await p.getByTestId('loan-available-principal').count(),0);
 }
 await p.locator('#loan-rate').fill('18');await click('РАССЧИТАТЬ');await click('Расчёт по ПВ');await click('Кредитный калькулятор');assert.equal(await compact('loan-available-principal'),'2483822,49₽');
 await click('На главный экран');await click('Кредитный калькулятор');assert.equal(await compact('loan-available-principal'),'2483822,49₽');await click('СБРОСИТЬ');assert.equal(await p.locator('#loan-payment').inputValue(),'');assert.equal(await p.locator('#loan-term').inputValue(),'');assert.equal(await p.getByTestId('loan-available-principal').count(),0);await click('По сумме кредита');assert.equal(await compact('loan-monthly'),'48312,63₽');assert.deepEqual(errors,[]);
 console.log('Проверены обратный расчёт, нулевая ставка, годы/месяцы, ошибки, 30 лет, Enter, отдельные черновики и результаты, навигация, сброс и шесть размеров экрана.');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
