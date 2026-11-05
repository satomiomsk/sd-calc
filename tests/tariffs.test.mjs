import test from 'node:test';
import assert from 'node:assert/strict';
import {calculate} from '../lib/calculator.ts';
import {DEFAULT_TARIFFS,validateTariffs} from '../lib/tariffs.ts';
test('Все исходные диапазоны сохранены в редактируемых тарифах',()=>{
 validateTariffs(DEFAULT_TARIFFS);
 for(const operation of ['sale','purchase']) for(const category of ['apartment','country','garage','commercial','land']){
 if(operation==='sale'&&category==='land')continue;
 for(const price of [0.01,100000,499999,499999.5,500000,999999,999999.5,999999.99,1000000,2000000,9000000]) assert.deepEqual(calculate(operation,category,price,3000000,DEFAULT_TARIFFS),calculate(operation,category,price,3000000));
 }
});
test('Изменение фиксированной части, процента и минимума используется в результате',()=>{
 const v=structuredClone(DEFAULT_TARIFFS);const r=v.rules.find(r=>r.operation==='sale'&&r.category==='commercial');r.fixed=10000;r.percent=3;r.minimum=50000;
 assert.equal(calculate('sale','commercial',100000,null,v).total,50000);
 assert.equal(calculate('sale','commercial',2000000,null,v).total,70000);
});
test('Повреждённые условия, перекрытия и отсутствующие категории отклоняются',()=>{
 for(const mutate of [v=>v.rules[0].fixed=-1,v=>v.rules[0].percent=101,v=>v.rules[0].fixed=NaN,v=>v.rules[0].to=2000000,v=>v.rules=v.rules.filter(r=>r.category!=='commercial'),v=>v.version=-1]){const v=structuredClone(DEFAULT_TARIFFS);mutate(v);assert.throws(()=>validateTariffs(v));}
});
