import assert from 'node:assert/strict';
import {sql} from '../scripts/database/psql.mjs';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0'),category='10000000-0000-4000-8000-000000000002';
function act(user,query,save=false){return sql(`begin;set local role authenticated;set local request.jwt.claim.sub='${id(user)}';${query};${save?'commit':'rollback'};`).output}
function denied(user,query){const result=sql(`begin;set local role authenticated;set local request.jwt.claim.sub='${id(user)}';${query};rollback;`,{fail:false});assert.notEqual(result.status,0)}
sql(`update public.profiles set active=true where id='${id(3)}'`);
const store=act(2,`select public.sanaa_save_store(null,'متجر حذف','وصف متجر','${category}','dubai','DXB-TEST','{}')`,true),product=act(2,`select public.sanaa_save_product(null,'${store}','${category}','DELETE-TEST','منتج محفوظ','وصف منتج','product',12345,4,'published')`,true);
act(4,`select public.sanaa_review_store('${store}','active','تفعيل لاختبار أرشفة المتجر')`,true);
const order=sql(`insert into public.orders(customer_id,idempotency_key,request_hash,subtotal_minor,delivery_minor,total_minor,delivery_address_snapshot) values('${id(1)}','STORE-DELETE-TEST-0001','local-test',12345,0,12345,'{}') returning id`).output;
const sellerOrder=sql(`insert into public.seller_orders(order_id,store_id,subtotal_minor,total_minor) values('${order}','${store}',12345,12345) returning id`).output;
sql(`insert into public.order_items(order_id,seller_order_id,store_id,product_id,product_name_snapshot,sku_snapshot,quantity,unit_price_minor,total_minor) values('${order}','${sellerOrder}','${store}','${product}','اسم تاريخي','DELETE-TEST',1,12345,12345);insert into public.complaints(customer_id,store_id,type,body) values('${id(1)}','${store}','quality','شكوى تاريخية لا يجوز حذفها')`);
const before=sql(`select total_minor||':'||status from public.orders where id='${order}'`).output;
denied(3,`select public.sanaa_archive_store('${store}')`);denied(1,`select public.sanaa_archive_store('${store}')`);
act(2,`select public.sanaa_archive_store('${store}')`,true);
assert.equal(act(2,`select status from public.stores where id='${store}'`),'archived');assert.equal(act(2,`select status||':'||price_minor||':'||inventory_quantity from public.products where id='${product}'`),'archived:12345:4');assert.equal(sql(`begin;set local role anon;select count(*) from public.stores where id='${store}';rollback`).output,'0');assert.equal(sql(`select total_minor||':'||status from public.orders where id='${order}'`).output,before);assert.equal(sql(`select product_name_snapshot||':'||unit_price_minor from public.order_items where product_id='${product}'`).output,'اسم تاريخي:12345');assert.equal(sql(`select count(*) from public.complaints where store_id='${store}'`).output,'1');
denied(2,`select public.sanaa_save_store('${store}','استعادة','وصف','${category}','dubai','DXB-TEST','{}')`);denied(2,`select public.sanaa_save_product(null,'${store}','${category}','REVIVE','محاولة','وصف','product',100,1,'published')`);
// Archived stores must not exhaust the five operating-store slots.
for(let i=0;i<5;i++){const next=act(2,`select public.sanaa_save_store(null,'متجر جديد ${i}','وصف','${category}','dubai','DXB-TEST','{}')`,true);act(2,`select public.sanaa_archive_store('${next}')`,true)}
assert.ok(Number(sql("select count(*) from public.audit_logs where entity_table='stores' and next_value->>'status'='archived'").output)>0);
console.log('PASS SQL store removal: active owner-only archive, hidden public store/products, preserved linked orders/items/complaints/prices/stock, no reactivation through seller CRUD, reusable store slots and audit.');
