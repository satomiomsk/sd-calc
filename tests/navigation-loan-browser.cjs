const { chromium } = require('/usr/local/lib/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', args: ['--no-sandbox'] });
 try {
  const page = await browser.newPage(); const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const click = async name => page.getByRole('button', { name, exact: true }).click();
  const home = async () => click('На главный экран');
  const compact = async id => (await page.getByTestId(id).innerText()).replace(/\s/g, '');
  const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await page.goto('http://127.0.0.1:3000');
  assert.equal(await page.locator('main input:visible').count(),0);
  assert.equal(await page.locator('main button:visible').count(),4);
  for(const width of [320,375,768,1440]) { await page.setViewportSize({width,height:950}); await noOverflow(); }
  await click('Расчёт комиссии при покупке');
  assert.equal(await page.getByRole('button',{name:'Покупка',exact:true}).getAttribute('aria-pressed'),'true');
  await page.locator('#price').fill('5000000'); assert.equal(await compact('total'),'74000₽');
  await click('Продажа'); await page.locator('#price').fill('3000000'); assert.equal(await compact('total'),'95000₽');
  await home(); await click('Расчёт комиссии при продаже'); assert.equal(await page.locator('#price').inputValue(),'3 000 000');
  await click('Покупка'); assert.equal(await page.locator('#price').inputValue(),'5 000 000');
  await home(); await click('Кредитный калькулятор');
  assert.equal(await page.getByRole('button',{name:'Кредитный калькулятор',exact:true}).getAttribute('aria-pressed'),'true');
  assert(await page.locator('#loan-principal').isVisible()); assert(!await page.locator('#mortgage-part-0').isVisible());
  await page.locator('#loan-principal').fill('3000000'); await page.locator('#loan-term').fill('15'); await page.locator('#loan-rate').fill('18');
  for (const id of ['loan-principal','loan-term','loan-rate']) {
    const field = page.locator('#'+id);
    const value = await field.inputValue();
    assert.equal(await field.getAttribute('enterkeyhint'),'done');
    await field.focus(); await field.press('Enter');
    assert(await field.evaluate(el=>el!==document.activeElement),'Enter снимает фокус: '+id);
    assert.equal(await field.inputValue(),value);
    assert.equal(await page.getByTestId('loan-monthly').count(),0,'Enter не запускает расчёт');
  }
  assert.equal(await page.getByTestId('loan-monthly').count(),0);
  await click('РАССЧИТАТЬ'); assert.equal(await compact('loan-monthly'),'48312,63₽');
  assert.equal(await compact('loan-total'),'8696273,61₽'); assert.equal(await compact('loan-interest'),'5696273,61₽');
  for(const width of [320,360,375,414,768,1440]) { await page.setViewportSize({width,height:950}); await noOverflow(); }
  await page.locator('#loan-rate').fill('0'); assert.equal(await compact('loan-monthly'),'48312,63₽');
  await click('РАССЧИТАТЬ'); assert.equal(await compact('loan-monthly'),'16666,67₽'); assert.equal(await compact('loan-total'),'3000000,00₽'); assert.equal(await compact('loan-interest'),'0,00₽');
  await page.getByLabel('Единицы срока кредита').selectOption('months'); await page.locator('#loan-term').fill('180'); await page.locator('#loan-rate').fill('18');
  await click('РАССЧИТАТЬ'); assert.equal(await compact('loan-monthly'),'48312,63₽');
  await page.locator('#loan-principal').fill('6000000'); await click('РАССЧИТАТЬ'); assert.equal(await compact('loan-monthly'),'96625,26₽');
  await page.locator('#loan-term').fill('0'); await click('РАССЧИТАТЬ'); assert(await page.locator('form [role="alert"]').isVisible()); assert.equal(await page.getByTestId('loan-monthly').count(),0);
  await page.locator('#loan-term').fill('180'); await click('РАССЧИТАТЬ');
  await click('Расчёт по ПВ'); await page.locator('#mortgage-part-0').fill('6000000'); assert.equal(await compact('mortgage-result-part'),'1206000₽');
  await click('Кредитный калькулятор'); assert.equal(await compact('loan-monthly'),'96625,26₽');
  await home(); await click('Расчёт по первоначальному взносу');
  assert.equal(await page.getByRole('button',{name:'Расчёт по ПВ',exact:true}).getAttribute('aria-pressed'),'true');
  assert.equal(await compact('mortgage-result-part'),'1206000₽'); assert(!await page.locator('#loan-principal').isVisible());
  await click('Кредитный калькулятор'); await click('СБРОСИТЬ');
  assert.equal(await page.locator('#loan-principal').inputValue(),''); assert.equal(await page.locator('#loan-term').inputValue(),''); assert.equal(await page.locator('#loan-rate').inputValue(),''); assert.equal(await page.getByTestId('loan-monthly').count(),0);
  assert.deepEqual(errors,[]);
  console.log('Четыре прямых перехода открывают нужный калькулятор; внутренние переключатели, значения и расчёты сохранены.');
 } finally { await browser.close(); }
})().catch(error => {console.error(error); process.exit(1);});
