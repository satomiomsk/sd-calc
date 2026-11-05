const { chromium } = require('/usr/local/lib/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({executablePath:'/usr/local/bin/chromium',args:['--no-sandbox']});
 try {
  const context = await browser.newContext({permissions:['clipboard-read','clipboard-write']});
  const page = await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  const select = async (id,name) => {await page.locator('#'+id).click(); await page.getByRole('option',{name,exact:true}).click();};
  const total = async (expected,id='total') => {
   await page.waitForFunction(({id,expected})=>document.querySelector(`[data-testid="${id}"]`)?.textContent.replace(/\s/g,'')===expected,{id,expected:expected+'₽'});
  };
 const openCalculator = async (section, title) => {
  const home = page.getByRole('button', {name:'На главный экран',exact:true});
  if (await home.isVisible()) await home.click();
  const names = { 'Продажа': 'Расчёт комиссии при продаже', 'Покупка': 'Расчёт комиссии при покупке', 'Расчёт по ПВ': 'Расчёт по первоначальному взносу' };
  await page.getByRole('button', {name:names[title] || title,exact:true}).click();
 };
 await page.goto('http://127.0.0.1:3000');
  await openCalculator('Комиссия','Продажа');
  await page.locator('#price').fill('5000000'); await total(125000);
  assert((await page.locator('#discount').innerText()).includes('Скидка не применена'));
  for(const [label,amount] of [
   ['Ветеранам ВОВ - 3%',121250],['Участникам СВО - 3%',121250],['Пенсионерам - 3%',121250],
   ['Инвалидам 1-3 группы - 3%',121250],['Многодетным семьям - 3%',121250],
   ['Повторное обращение: 3-4 объекта в одном городе - 3%',121250],
   ['Повторное обращение: от 5 объектов в одном городе - 5%',118750],
   ['За продажу вторичного жилья и покупку новостройки в одном городе - 7%',116250],
  ]) {
   await select('discount',label); await total(amount);
   assert(!(await page.getByTestId('discount-details').innerText()).includes('Степень родства:'));
   assert((await page.getByTestId('discount-applied').innerText()).includes('Применена скидка:'));
  }
  await select('discount','Пенсионерам - 3%');
  await page.getByRole('button',{name:'Скопировать итоговую сумму',exact:true}).click();
  assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\s/g,''),'121250₽');
  await select('discount','Скидка не применена'); await total(125000);
  assert.equal(await page.getByTestId('discount-applied').count(),0);
  const paired='За встречную сделку: продажа + покупка в одном городе - 3%+3%';
  await select('discount',paired);
  assert.equal(await page.getByTestId('total').innerText(),'-');
  assert(await page.getByRole('button',{name:'Скопировать итоговую сумму',exact:true}).isDisabled());
  assert((await page.locator('label[for="paired-price"]').innerText()).includes('Стоимость ранее приобретаемой недвижимости'));
  assert.equal(await page.getByTestId('combined-saving').count(),0);
  await page.locator('#paired-price').fill('4000000'); await total(119330); await total(5670,'combined-saving');
  await page.locator('#price').fill('9000000'); await page.locator('#paired-price').fill('5000000');
  await total(177230); await total(5550,'current-saving'); await total(2220,'previous-saving'); await total(7770,'combined-saving');
  await page.getByRole('button',{name:'Скопировать итоговую сумму',exact:true}).click();
  assert.equal((await page.evaluate(()=>navigator.clipboard.readText())).replace(/\s/g,''),'177230₽');
  assert((await page.getByText('С учётом встречной сделки:',{exact:false}).innerText()).replace(/\s/g,'').includes('185000₽-7770₽=177230₽'));
  await page.locator('#paired-price').press('Enter');
  assert(await page.locator('#paired-price').evaluate(el=>el!==document.activeElement));
  await page.locator('#paired-price').fill('-1'); assert.equal(await page.getByTestId('combined-saving').count(),0);
  assert.equal(await page.getByTestId('total').innerText(),'-');
  await page.locator('#paired-price').fill('4000000');
  for(const width of [320,375,414,768,1440]) {
   await page.setViewportSize({width,height:1000});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Переполнение: '+width);
  }
  await page.setViewportSize({width:375,height:900});
  await select('discount','Повторное обращение: от 5 объектов в одном городе - 5%');
  assert.equal(await page.locator('#paired-price').count(),0);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#discount').click();
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'Сбросить',exact:true}).click();
  assert((await page.locator('#discount').innerText()).includes('Скидка не применена'));
  assert.equal(await page.locator('#price').inputValue(),'');
  await openCalculator('Комиссия','Покупка');
  await page.locator('#price').fill('5000000');
  await select('discount','По сертификатам переселенцев с ДНР, ЛНР и Херсонской области - 10%'); await total(66600);
  assert((await page.getByTestId('discount-details').innerText()).includes('не суммируются'));
  await select('discount',paired);
  assert((await page.locator('label[for="paired-price"]').innerText()).includes('Стоимость ранее продаваемой недвижимости'));
  await page.locator('#paired-price').fill('4000000'); await total(68480); await total(5520,'combined-saving');
  await page.locator('#price').fill('5000000'); await page.locator('#paired-price').fill('9000000'); await total(66230); await total(7770,'combined-saving');
  await select('category','Коммерческая недвижимость');
  assert.equal(await page.locator('#discount').count(),0);
  assert.equal(await page.getByTestId('discount-applied').count(),0);
  assert.equal(await page.locator('#paired-price').count(),0);
  await page.locator('#price').fill('5000000'); await total(75000);
  await openCalculator('Комиссия','Продажа');
  assert((await page.locator('#discount').innerText()).includes('Скидка не применена'));
  await page.locator('#discount').click();
  assert.equal(await page.getByRole('option').filter({hasText:'По сертификатам'}).count(),0);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors,[]);
  console.log('Проверены обе скидки в итоговой комиссии, пример 9 млн и 5 млн, копирование, формула, отсутствие родства и мобильная вёрстка.');
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
