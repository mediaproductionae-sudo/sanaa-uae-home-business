import assert from 'node:assert/strict';
import {sql} from '../scripts/database/psql.mjs';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),category='10000000-0000-4000-8000-000000000002';
function act(user,query,save=false){return sql(`begin;set local role authenticated;set local request.jwt.claim.sub='${id(user)}';${query};${save?'commit':'rollback'};`).output}
function deny(user,query){const r=sql(`begin;set local role authenticated;set local request.jwt.claim.sub='${id(user)}';${query};rollback;`,{fail:false});assert.notEqual(r.status,0)}
const store=act(2,`select public.sanaa_save_store_localized(null,'متجر لغات','وصف أصلي','${category}','dubai','DXB-TEST','{}','Craft studio','Original store translation',true)`,true);
act(4,`select public.sanaa_review_store('${store}','active','موافقة متجر لاختبار اللغة')`,true);
const product=act(2,`select public.sanaa_save_product_localized(null,'${store}','${category}','LANG-1','قطعة عربية','وصف المنتج الأصلي','product',14525,7,'published','ar','','',false)`,true);
assert.equal(act(2,`select name_ar||':'||price_minor||':'||inventory_quantity from public.products where id='${product}'`),'قطعة عربية:14525:7');
assert.equal(sql(`begin;set local role anon;select count(*) from public.product_translations where product_id='${product}';rollback`).output,'0');
act(2,`select public.sanaa_save_product_localized('${product}','${store}','${category}','LANG-1','قطعة عربية','وصف المنتج الأصلي','product',14525,7,'published','ar','Handmade bowl','Reviewed English description',true)`,true);
assert.equal(act(2,`select count(*) from public.products where id='${product}'`),'1');
assert.equal(act(2,`select name_ar||':'||price_minor||':'||inventory_quantity from public.products where id='${product}'`),'قطعة عربية:14525:7');
assert.equal(sql(`begin;set local role anon;select name from public.product_translations where product_id='${product}';rollback`).output,'Handmade bowl');
assert.equal(sql(`begin;set local role anon;select * from public.sanaa_search_catalog_ids('قطعة عربية',store_uuid=>'${store}');rollback`).output,product);
assert.equal(sql(`begin;set local role anon;select * from public.sanaa_search_catalog_ids('HANDMADE BOWL',store_uuid=>'${store}');rollback`).output,product);
sql(`update public.profiles set active=true where id='${id(3)}'`);deny(3,`select public.sanaa_save_product_localized('${product}','${store}','${category}','LANG-1','تجاوز','وصف','product',1,999,'published','ar','Attack','Attack',true)`);
deny(2,`update public.product_translations set approved=true where product_id='${product}'`);
const before=act(2,`select name_ar from public.products where id='${product}'`);deny(2,`select public.sanaa_save_product_localized('${product}','${store}','${category}','LANG-1','لا تحفظ','وصف','product',14525,7,'published','xx','Invalid','Invalid',true)`);assert.equal(act(2,`select name_ar from public.products where id='${product}'`),before);
assert.equal(sql("select count(*) from information_schema.role_table_grants where grantee='authenticated' and privilege_type in ('INSERT','UPDATE','DELETE') and table_name in ('orders','commission_entries','financial_ledger_entries','seller_settlements')").output,'0');
assert.ok(Number(sql("select count(*) from public.audit_logs where entity_table='product_translations'").output)>0);
console.log('PASS localization SQL: optional translation, original preservation, stable IDs, money/stock preservation, approved public visibility, bilingual search, owner isolation, direct-write denial, atomic rollback and audit.');
