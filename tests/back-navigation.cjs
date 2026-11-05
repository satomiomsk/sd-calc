const { chromium } = require('/usr/local/lib/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']});
 try {
  const page = await browser.newPage({viewport:{width:375,height:667}});
  const errors=[]; page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:3000');
  const initialLength=await page.evaluate(()=>history.length);
  const click=async name=>page.getByRole('button',{name,exact:true}).click();
  const home=async()=>page.getByRole('heading',{name:'Калькулятор SD',exact:true}).waitFor();
  for(const name of ['Расчёт комиссии при продаже','Расчёт комиссии при покупке','Расчёт по первоначальному взносу','Кредитный калькулятор']) {
   await click(name);
   await page.goBack(); await home();
   assert.equal(await page.locator('main button:visible').count(),4);
  }
  await click('Расчёт комиссии при продаже'); await page.locator('#price').fill('3000000');
  await click('Покупка'); await page.locator('#price').fill('5000000');
  await page.goBack(); await home(); // One back exits the section, including after changing tabs.
  await page.goForward(); await page.locator('#price').waitFor({state:'visible'});
  assert.equal(await page.locator('#price').inputValue(),'5 000 000');
  await click('Продажа'); assert.equal(await page.locator('#price').inputValue(),'3 000 000');
  await click('На главный экран'); await home();
  for(let i=0;i<3;i++) {
   await click('Кредитный калькулятор'); await click('На главный экран'); await home();
  }
  assert.equal(await page.evaluate(()=>history.length),initialLength+1,'В истории только главная и текущий раздел');
  assert.deepEqual(errors,[]);
  console.log('Системный возврат из всех четырёх калькуляторов ведёт на главную; переключение вкладок не добавляет лишних шагов, значения сохраняются.');
 } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exit(1)});
