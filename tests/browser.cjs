const { chromium } = require('/usr/local/lib/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({ executablePath: '/usr/local/bin/chromium', headless: true, args: ['--no-sandbox'] });
 const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
 const page = await context.newPage(); const errors=[]; let checks=0;
 if (process.env.SD_ANDROID_ASSETS) {
  const { readFile } = require('node:fs/promises');
  const { resolve, extname } = require('node:path');
  const root = resolve(process.env.SD_ANDROID_ASSETS);
  const mime = {'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.ico':'image/x-icon','.woff2':'font/woff2','.json':'application/json','.webmanifest':'application/json'};
  await context.route('**/*', async route => {
   const url = new URL(route.request().url());
   if (url.origin !== 'http://127.0.0.1:3000') throw new Error('Неожиданный внешний запрос: '+url.origin);
   const file = resolve(root, '.' + decodeURIComponent(url.pathname) + (url.pathname.endsWith('/') ? 'index.html' : ''));
   if (!file.startsWith(root + '/')) throw new Error('Недопустимый путь ресурса');
   try { await route.fulfill({ status: 200, contentType: mime[extname(file)] || 'application/octet-stream', body: await readFile(file) }); }
   catch { await route.fulfill({status:404,body:''}); }
  });
 }
 page.on('pageerror', e => errors.push(e.message));
 const check = (value, message) => { assert.ok(value,message); checks++; console.log(`✓ ${message}`); };
 const total = async (expected) => { await page.getByTestId('total').waitFor(); check((await page.getByTestId('total').innerText()).replace(/\s/g,'') === `${expected}₽`, `Итог ${expected} ₽`); };
 const empty = async () => { check(await page.getByTestId('total').count() === 0,'Результат очищен'); };
 const price = () => page.locator('#price');
 const dismissInputKeyboard = async (field, description) => {
  const value = await field.inputValue();
  check(await field.getAttribute('enterkeyhint') === 'done', `Клавиша «Готово»: ${description}`);
  await field.focus(); await field.press('Enter');
  check(await field.evaluate(el => el !== document.activeElement), `Enter снимает фокус: ${description}`);
  check(await field.inputValue() === value, `Enter сохраняет сумму: ${description}`);
 };
 const selectCategory = async name => { await page.locator('#category').click(); await page.getByRole('option',{name,exact:true}).click(); };
 const openCalculator = async (section, title) => {
  const home = page.getByRole('button', {name:'На главный экран',exact:true});
  if (await home.isVisible()) await home.click();
  const names = { 'Продажа': 'Расчёт комиссии при продаже', 'Покупка': 'Расчёт комиссии при покупке', 'Расчёт по ПВ': 'Расчёт по первоначальному взносу' };
  await page.getByRole('button', {name:names[title] || title,exact:true}).click();
 };
 await page.goto('http://127.0.0.1:3000');
 await openCalculator('Комиссия','Продажа');
 await page.getByRole('heading', {name:'Комиссия',exact:true}).waitFor();
 await page.evaluate(()=>document.fonts.ready);
 await empty();
 await price().fill('3000000'); await total(95000);
 await dismissInputKeyboard(price(), 'Продажа');
 check(await price().inputValue()==='3 000 000','Пробелы между тысячами');
 await page.screenshot({path:'/tmp/sd-desktop.png',fullPage:true});
 await page.evaluate(() => { window.__copied=''; Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}); });
 await page.getByRole('button',{name:'Скопировать итоговую сумму'}).click();
 await page.getByText('Сумма скопирована в буфер обмена',{exact:true}).waitFor();
 check((await page.evaluate(()=>window.__copied)).replace(/\s/g,'')==='95000₽','Копирование и уведомление об успехе');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));
 await page.getByRole('button',{name:'Скопировать итоговую сумму'}).click();
 await page.getByText('Не удалось скопировать сумму. Выделите и скопируйте её вручную.',{exact:true}).waitFor(); checks++; console.log('✓ Ошибка буфера обмена обработана');
 await page.getByRole('button',{name:'Сбросить'}).click(); await empty(); check(await price().inputValue()==='','Сброс очищает поле');
 await price().fill('-1000000'); await empty(); check(await price().inputValue()==='-1000000','Вставленный минус не удаляется');
 check(await price().getAttribute('aria-invalid')==='true','Доступное сообщение об ошибке');
 await price().fill('0'); await empty(); await price().fill('abc'); await empty();
 await price().fill('1000000,50'); await total(65000);
 await price().fill('1000000.50'); await total(65000);
 await price().fill('1234567'); await price().evaluate(el=>{el.focus();el.setSelectionRange(2,2)});
 await page.keyboard.type('9');
 check((await price().inputValue()).replace(/ /g,'')==='19234567','Вставка в середину сохраняет позицию');
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 check(await price().evaluate(el=>el.selectionStart)===2,'Курсор остаётся у введённой цифры');
 await selectCategory('Гараж / парковочное место'); await empty();
 await price().fill('499500'); await total(30000);
 await price().fill('499999'); await total(30000);
 await price().fill('499999,50'); await page.getByText('Для указанной стоимости тариф не определён. Уточните размер комиссии',{exact:true}).waitFor(); await empty();
 await price().fill('500000'); await total(37500);
 await openCalculator('Комиссия','Покупка'); await empty(); check(await price().inputValue()==='','Переключение операции очищает цену');
 await selectCategory('Загородная недвижимость');
 await price().fill('2000000'); await total(60000);
 await dismissInputKeyboard(price(), 'Покупка');
 check(await page.getByText('Применена минимальная комиссия - 60 000 ₽',{exact:true}).count()===1,'Пояснение о минимальной комиссии');
 check(await page.getByText('35 000 ₽ + 2 000 000 ₽ × 1 % = 55 000 ₽',{exact:true}).count()===1,'Видна вычисленная сумма до минимума');
 await price().fill('2500000'); await total(60000);
 check(await page.getByText('Применена минимальная комиссия - 60 000 ₽',{exact:true}).count()===0,'При равенстве минимум не отмечается как определивший итог');
 await price().fill('3000000'); await total(65000);
 await selectCategory('Земельный участок с ипотекой на строительство дома'); await empty();
 await price().fill('1000000'); await empty();
 await page.locator('#credit').fill('5000000'); await total(85000);
 await dismissInputKeyboard(page.locator('#credit'), 'Кредит на строительство');
 check(await page.getByText('Общая база',{exact:true}).count()===1,'Для участка показана общая база');
 await selectCategory('Квартира / жилое помещение'); await empty();
 await selectCategory('Земельный участок с ипотекой на строительство дома');
 check(await page.locator('#credit').inputValue()==='','Скрытый кредит очищается при смене категории');
 await price().fill('1000000'); await page.locator('#credit').fill('5000000');
 await page.getByRole('button',{name:'Сбросить'}).click();
 check(await price().inputValue()==='' && await page.locator('#credit').inputValue()==='','Сброс очищает оба обязательных поля'); await empty();
 await openCalculator('Комиссия','Продажа');
 await selectCategory('Квартира / жилое помещение');
 await price().fill('900000'); await total(60000);
 check(await page.getByText('Процентная часть',{exact:true}).count()===0,'Фиксированный тариф скрывает процентные строки');
 await page.getByRole('button',{name:'Покупка',exact:false}).focus(); await page.keyboard.press('Enter');
 check(await page.locator('#price').isVisible(),'Карточки выбора доступны с клавиатуры'); await empty();
 for (const width of [375,768,1440]) {
  await page.setViewportSize({width,height:1000});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Без горизонтальной прокрутки: ${width} px`);
 }
 await page.setViewportSize({width:375,height:900});
 await selectCategory('Земельный участок с ипотекой на строительство дома');
 await price().fill('1000000'); await page.locator('#credit').fill('5000000'); await total(85000);
 check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Детальный результат участка помещается на телефоне');
 await page.screenshot({path:'/tmp/sd-mobile.png',fullPage:true});
 await openCalculator('Ипотека','Расчёт по ПВ');
 check(!await page.locator('#price').isVisible(),'Ипотека отделена от полей комиссии');
 const mortgageTotal = async (mode, expected) => {
  await page.waitForFunction(({mode,expected})=>document.querySelector(`[data-testid="mortgage-result-${mode}"]`)?.textContent.replace(/\s/g,'')===`${expected}₽`,{mode,expected});
  check((await page.getByTestId(`mortgage-result-${mode}`).innerText()).replace(/\s/g,'')===`${expected}₽`,`Ипотека ${mode}: ${expected} ₽`);
 };
 const mortgageFields = [
  ['part', 0, 'Введите стоимость'], ['whole', 0, 'Введите сумму'],
  ['adjustment', 0, 'Введите стоимость'], ['adjustment', 1, 'Введите сумму'],
 ];
 const checkMortgageEmpty = async () => {
  for (const [mode, index, placeholder] of mortgageFields) {
   const field = page.locator(`#mortgage-${mode}-${index}`);
   check(await field.inputValue() === '', `Пустое денежное поле: ${mode}/${index}`);
   check(await field.getAttribute('placeholder') === placeholder, `Подсказка: ${mode}/${index} - ${placeholder}`);
  }
  for (const mode of ['part', 'whole', 'adjustment']) {
   check(await page.getByTestId(`mortgage-result-${mode}`).innerText() === '-', `Нет расчёта до ввода: ${mode}`);
  }
 };
 await checkMortgageEmpty();
 await page.locator('#mortgage-part-0').fill('6000000');
 await page.locator('#mortgage-whole-0').fill('700000');
 await page.locator('#mortgage-adjustment-0').fill('5000000');
 await page.locator('#mortgage-adjustment-1').fill('600000');
 await mortgageTotal('part',1206000); await mortgageTotal('whole',3482588); await mortgageTotal('adjustment',5440697);
 await page.locator('#mortgage-part-0').fill('1001'); await page.locator('#mortgage-part-1').fill('0,1'); await mortgageTotal('part',2);
 await page.locator('#mortgage-whole-1').fill('0');
 await page.getByRole('alert').filter({hasText:'Процент не может быть равен нулю.'}).waitFor();
 check((await page.getByTestId('mortgage-result-whole').innerText())==='-','Деление на ноль не даёт результата');
 check((await page.getByTestId('mortgage-client-percent').innerText()).replace(/\s/g,'')==='12%','Процент имеющегося взноса: 12%');
 check((await page.getByTestId('mortgage-missing-percent').innerText()).replace(/\s/g,'')==='8,1%','Недостающий взнос: 8,1%');
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copied=text;}}}));
 await page.getByRole('button',{name:'Скопировать: Рассчитать стоимость ОН при нехватке ПВ',exact:true}).click();
 check((await page.evaluate(()=>window.__copied)).replace(/\s/g,'')==='5440697₽','Копирование ипотечного результата');
 await page.getByRole('button',{name:'Сбросить: Рассчитать стоимость ОН при нехватке ПВ',exact:true}).click();
 check(await page.locator('#mortgage-adjustment-0').inputValue()===''&&await page.locator('#mortgage-adjustment-1').inputValue()==='','Сброс очищает стоимость и сумму взноса');
 check(await page.locator('#mortgage-adjustment-2').inputValue()==='20,1','Сброс сохраняет процент как в исходном APK');
 await mortgageTotal('part',2);
 await openCalculator('Комиссия','Продажа'); await total(60000);
 check(await price().inputValue()==='900 000','После ипотеки комиссия сохраняет введённые значения');
 await price().fill('3000000'); await total(95000);
 await openCalculator('Ипотека','Расчёт по ПВ'); await mortgageTotal('part',2);
 for (const width of [375,768,1440]) {
  await page.setViewportSize({width,height:1000});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Ипотека без горизонтальной прокрутки: ${width} px`);
 }
 for (const [mode, title, indexes] of [
  ['part','Рассчитать ПВ',[0]],
  ['whole','Рассчитать стоимость ОН по ПВ',[0]],
  ['adjustment','Рассчитать стоимость ОН при нехватке ПВ',[0,1]],
 ]) {
  await page.getByRole('button',{name:`Сбросить: ${title}`,exact:true}).click();
  for (const index of indexes) {
   const field=page.locator(`#mortgage-${mode}-${index}`);
   check(await field.inputValue()==='',`Поле пустое после сброса: ${mode}/${index}`);
   check(await field.getAttribute('placeholder')===mortgageFields.find(([m,i])=>m===mode&&i===index)[2],`Подсказка восстановлена после сброса: ${mode}/${index}`);
   await field.click(); await page.keyboard.type('1234');
   check(await field.inputValue()==='1 234',`После сброса нет ведущего нуля: ${mode}/${index}`);
   check(await field.getAttribute('enterkeyhint')==='done',`Клавиша «Готово»: ${mode}/${index}`);
   await field.press('Enter');
   check(await field.evaluate(el=>el!==document.activeElement),`Enter снимает фокус: ${mode}/${index}`);
  }
 }
 const fraction=page.locator('#mortgage-adjustment-1');
 await fraction.fill('0'); await fraction.click(); await page.keyboard.type('0,50');
 check(await fraction.inputValue()==='0,50','Десятичный ноль сохраняется: 0,50');
 await fraction.press('Enter');
 await page.screenshot({path:'/tmp/sd-mortgage-desktop.png',fullPage:true});
 check(errors.length===0,`Без ошибок браузера: ${JSON.stringify(errors)}`);
 console.log(`Проверок браузера пройдено: ${checks}`);
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
