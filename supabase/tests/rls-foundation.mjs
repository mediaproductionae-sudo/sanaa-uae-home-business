import assert from 'node:assert/strict';
import fs from 'node:fs';
import {sql} from '../../scripts/database/psql.mjs';
const id=n=>'00000000-0000-4000-8000-'+String(n).padStart(12,'0');
const q=n=>`'${id(n)}'`;
const A='10000000-0000-4000-8000-000000000002',C1='20000000-0000-4000-8000-000000000001',C2='20000000-0000-4000-8000-000000000002';
let passed=0;const results=[];
function test(name,fn){fn();passed++;results.push({name,status:'passed'});console.log('PASS',name)}
function as(user,query,role='authenticated'){return `begin;set local role ${role};set local request.jwt.claim.sub='${user? id(user):''}';${query};rollback;`}
function equal(query,want){assert.equal(sql(query).output,String(want))}
function denied(query,match=/permission denied|row-level security|23514|23505|23503/){const r=sql(query,{fail:false});assert.notEqual(r.status,0);assert.match(r.error,match)}
function rollback(query){return 'begin;'+query+';rollback;'}
// All these identities exist only in the isolated test database, not Supabase Auth.
sql(`begin;
insert into auth.users(id,raw_user_meta_data) values ${Array.from({length:9},(_,i)=>`(${q(i+1)},'{"role":"admin","roles":["admin"]}')`).join(',')};
insert into public.user_roles(user_id,role) values (${q(3)},'seller'),(${q(4)},'seller'),(${q(5)},'admin'),(${q(6)},'license_reviewer'),(${q(7)},'delivery_operator'),(${q(8)},'delivery_operator');
insert into public.admin_permissions(user_id,permission) values ${['users.read','users.manage','stores.read','stores.manage','licenses.review','catalog.manage','orders.read','complaints.manage','delivery.manage','finance.read','finance.manage','audit.read'].map(p=>`(${q(5)},'${p}')`).join(',')};
insert into public.seller_profiles(id,user_id,business_name) values (${q(101)},${q(3)},'اختبار بائع أ'),(${q(102)},${q(4)},'اختبار بائع ب');
insert into public.stores(id,seller_id,category_id,slug,name_ar,emirate,area_code,status) values
(${q(201)},${q(101)},'${A}','test-store-a','متجر اختبار أ','dubai','DXB-JUMEIRAH','active'),
(${q(202)},${q(102)},'${A}','test-store-b','متجر اختبار ب','sharjah','SHJ-MAJAZ','active');
insert into public.products(id,store_id,category_id,sku,name_ar,kind,status,price_minor,inventory_quantity) values
(${q(301)},${q(201)},'${A}','A','منتج اختبار أ','product','published',14500,10),
(${q(302)},${q(202)},'${A}','B','منتج اختبار ب','product','published',8000,10),
(${q(303)},${q(201)},'${A}','DRAFT','مسودة خاصة','product','draft',3000,10);
insert into public.orders(id,customer_id,idempotency_key,request_hash,status,subtotal_minor,delivery_minor,total_minor,delivery_address_snapshot) values
(${q(401)},${q(1)},'test-order-customer-one','testhash','confirmed',22500,0,22500,'{}'),
(${q(402)},${q(2)},'test-order-customer-two','testhash','confirmed',14500,0,14500,'{}');
insert into public.seller_orders(id,order_id,store_id,subtotal_minor,total_minor) values
(${q(501)},${q(401)},${q(201)},14500,14500),(${q(502)},${q(401)},${q(202)},8000,8000),(${q(503)},${q(402)},${q(201)},14500,14500);
insert into public.order_items(id,order_id,seller_order_id,store_id,product_id,product_name_snapshot,sku_snapshot,quantity,unit_price_minor,total_minor) values
(${q(601)},${q(401)},${q(501)},${q(201)},${q(301)},'سعر تاريخي أ','A',1,14500,14500),
(${q(602)},${q(401)},${q(502)},${q(202)},${q(302)},'سعر تاريخي ب','B',1,8000,8000),
(${q(603)},${q(402)},${q(503)},${q(201)},${q(301)},'سعر تاريخي أ','A',1,14500,14500);
update public.delivery_companies set active=true;
insert into public.delivery_operators(company_id,user_id) values ('${C1}',${q(7)}),('${C2}',${q(8)});
insert into public.delivery_services(id,company_id,code,name_ar,eta_minutes,active) values
(${q(701)},'${C1}','test','خدمة أ',60,true),(${q(702)},'${C2}','test','خدمة ب',60,true);
insert into public.shipments(id,seller_order_id,delivery_company_id,delivery_service_id,status,quote_snapshot,allocation_snapshot,pickup_snapshot,dropoff_snapshot,customer_fee_minor,carrier_gross_minor) values
(${q(801)},${q(501)},'${C1}',${q(701)},'allocated','{}','{}','{}','{}',2000,2000),
(${q(802)},${q(502)},'${C2}',${q(702)},'allocated','{}','{}','{}','{}',2000,2000);
insert into public.delivery_assignments(shipment_id,company_id,reason_snapshot) values (${q(801)},'${C1}','{}'),(${q(802)},'${C2}','{}');
insert into public.payment_intents(id,order_id,idempotency_key,amount_minor,expires_at) values (${q(1001)},${q(401)},'test-intent',22500,now()+interval '1 hour');
insert into public.payment_events(id,intent_id,provider,provider_event_id,event_type,payload_hash,verified_at) values (${q(1101)},${q(1001)},'simulation','test-event','captured','hash',now());
insert into public.payment_transactions(id,intent_id,order_id,event_id,provider_transaction_id,kind,amount_minor) values (${q(1201)},${q(1001)},${q(401)},${q(1101)},'test-txn','capture',22500);
insert into public.seller_commission_rules(id,seller_id,version,valid_from) values (${q(1301)},${q(101)},1,now());
insert into public.commission_entries(id,kind,seller_order_id,seller_rule_id,basis_minor,amount_minor,idempotency_key,rule_snapshot,eligibility_evidence,reason) values
(${q(1401)},'sale',${q(501)},${q(1301)},14500,1450,'test-commission-one','{"bps":1000,"exclude_delivery":true}','{}','test pending eligibility');
insert into public.financial_ledger_entries(id,batch_id,account_code,seller_id,credit_minor,idempotency_key,reason) values
(${q(1501)},${q(1601)},'seller_payable',${q(101)},10000,'ledger-test-credit','test credit');
insert into public.financial_ledger_entries(id,batch_id,account_code,debit_minor,idempotency_key,reason) values
(${q(1502)},${q(1601)},'platform_clearing',10000,'ledger-test-debit','test debit');
insert into public.seller_settlements(id,seller_id,amount_minor,idempotency_key,reason) values (${q(1701)},${q(101)},6000,'settle-one','test partial settlement'),(${q(1702)},${q(101)},5000,'settle-two','test next settlement');
insert into public.complaints(id,customer_id,store_id,type,body) values (${q(1801)},${q(1)},${q(201)},'quality','اختبار شكوى وهمية فقط');
insert into public.complaint_actions(complaint_id,actor_id,visibility,action,note) values
(${q(1801)},${q(5)},'internal','review','ملاحظة داخلية'),(${q(1801)},${q(3)},'participants','reply','رد البائع');
insert into public.store_documents(store_id,uploaded_by,object_path,document_type) values (${q(201)},${q(3)},'${id(201)}/test.pdf','demo');
insert into storage.objects(bucket_id,name) values('store-documents','${id(201)}/test.pdf');
insert into public.product_images(product_id,store_id,object_path) values (${q(301)},${q(201)},'${id(201)}/test.png');
insert into storage.objects(bucket_id,name) values('catalog-media','${id(201)}/test.png');
commit;`);
test('50 tables exist; all public tables enforce RLS',()=>{equal("select count(*) from pg_tables where schemaname='public'",50);equal("select count(*) from pg_tables where schemaname='public' and not rowsecurity",0);equal("select count(*) from pg_tables t where schemaname='public' and not exists(select 1 from pg_policies p where p.schemaname=t.schemaname and p.tablename=t.tablename)",0)});
test('Reference seeds repeat without users, orders or active contracts',()=>{equal("select count(*) from public.categories",5);equal('select count(*) from public.delivery_companies',2);equal('select count(*) from public.delivery_contracts',0)});
test('Auth metadata cannot self-assign admin',()=>{equal(`select count(*) from public.user_roles where user_id=${q(1)} and role='admin'`,0);equal(`select count(*) from public.user_roles where user_id=${q(1)} and role='customer'`,1)});
test('Anonymous reads published catalog, never draft/identities',()=>{equal(as(null,'select count(*) from public.products','anon'),2);denied(as(null,'select * from public.profiles','anon'));denied(as(null,`update public.products set price_minor=1 where id=${q(301)}`,'anon'))});
test('Customer sees only own order and both own seller suborders',()=>{equal(as(1,'select count(*) from public.orders'),1);equal(as(1,'select count(*) from public.seller_orders'),2);equal(as(1,'select count(*) from public.order_items'),2);equal(as(2,`select count(*) from public.orders where id=${q(401)}`),0)});
test('Seller cannot read other seller suborders or full marketplace master order',()=>{equal(as(3,'select count(*) from public.seller_orders'),2);equal(as(4,'select count(*) from public.seller_orders'),1);equal(as(3,`select count(*) from public.seller_orders where id=${q(502)}`),0);equal(as(3,'select count(*) from public.orders'),0)});
test('Seller sees own draft only; cannot change moderation, stock or money',()=>{equal(as(3,'select count(*) from public.products'),3);equal(as(4,'select count(*) from public.products'),2);for(const col of ['price_minor=1','inventory_quantity=999','moderation_hidden=false','store_id='+q(202)])denied(as(3,`update public.products set ${col} where id=${q(301)}`));denied(as(3,`update public.stores set license_status='demo_approved' where id=${q(201)}`))});
test('Safe seller edits do not cross tenants',()=>{equal(as(3,`with changed as(update public.products set name_ar='تعديل اختبار' where id=${q(302)} returning id)select count(*) from changed`),0);equal(as(3,`with changed as(update public.products set name_ar='تعديل اختبار' where id=${q(301)} returning id)select count(*) from changed`),1)});
test('Client cannot change roles, suspend identities, confirm payments or create settlements',()=>{for(const cmd of [`insert into public.user_roles(user_id,role) values(${q(1)},'admin')`,`update public.profiles set active=false where id=${q(2)}`,`update public.payment_intents set status='succeeded' where id=${q(1001)}`,`update public.seller_commission_rules set rate_bps=0`,`insert into public.seller_settlements(seller_id,amount_minor,idempotency_key,reason)values(${q(101)},100,'bad','bad settlement')`])denied(as(1,cmd));denied(as(5,`update public.seller_commission_rules set rate_bps=0`))});
test('Delivery operator sees assigned company shipment only, no orders or customer profiles',()=>{equal(as(7,'select count(*) from public.shipments'),1);equal(as(7,`select count(*) from public.shipments where id=${q(802)}`),0);equal(as(7,'select count(*) from public.orders'),0);equal(as(7,'select count(*) from public.profiles'),1);denied(as(7,`update public.shipments set status='delivered',delivered_at=now() where id=${q(801)}`))});
test('No assignment means no operator shipment access',()=>{sql(`begin;delete from public.delivery_assignments where shipment_id=${q(801)};commit;`);equal(as(7,'select count(*) from public.shipments'),0);sql(`insert into public.delivery_assignments(shipment_id,company_id,reason_snapshot) values(${q(801)},'${C1}','{}')`)});
test('Reviewer cannot read finance or other private profiles; admin needs explicit permissions',()=>{equal(as(6,'select count(*) from public.financial_ledger_entries'),0);equal(as(6,'select count(*) from public.store_documents'),1);equal(as(6,'select count(*) from public.profiles'),1);equal(as(5,'select count(*) from public.financial_ledger_entries'),2);equal(as(5,'select count(*)>0 from public.audit_logs'),'t')});
test('Private document storage isolates sellers and customers',()=>{equal(as(3,"select count(*) from storage.objects where bucket_id='store-documents'"),1);equal(as(4,"select count(*) from storage.objects where bucket_id='store-documents'"),0);equal(as(1,"select count(*) from storage.objects where bucket_id='store-documents'"),0);equal(as(6,"select count(*) from storage.objects where bucket_id='store-documents'"),1);denied(as(4,`insert into storage.objects(bucket_id,name)values('store-documents','${id(201)}/foreign.pdf')`));equal(as(null,"select count(*) from storage.objects where bucket_id='catalog-media'",'anon'),1)});
test('Internal complaint notes are never visible to customers or sellers',()=>{equal(as(1,'select count(*) from public.complaint_actions'),1);equal(as(3,'select count(*) from public.complaint_actions'),1);equal(as(5,'select count(*) from public.complaint_actions'),2);denied(as(3,`update public.complaints set status='closed' where id=${q(1801)}`))});
test('Suspended user loses even own private access and public catalog hides suspended seller',()=>{equal(`begin;update public.profiles set active=false where id=${q(3)};set local role anon;select count(*) from public.products;rollback;`,1);equal(`begin;update public.profiles set active=false where id=${q(1)};set local role authenticated;set local request.jwt.claim.sub='${id(1)}';select count(*) from public.orders;rollback;`,0)});
test('Last active admin cannot be suspended, demoted or deleted',()=>{denied(rollback(`update public.profiles set active=false where id=${q(5)}`),/last_active_admin/);denied(rollback(`delete from public.user_roles where user_id=${q(5)} and role='admin'`),/last_active_admin/)});
test('Duplicate order idempotency and payment event are rejected',()=>{denied(rollback(`insert into public.orders(customer_id,idempotency_key,request_hash,subtotal_minor,delivery_minor,total_minor,delivery_address_snapshot)values(${q(1)},'test-order-customer-one','testhash',100,0,100,'{}')`),/duplicate key/);denied(rollback(`insert into public.payment_events(intent_id,provider,provider_event_id,event_type,payload_hash,verified_at)values(${q(1001)},'simulation','test-event','capture','hash',now())`),/duplicate key/)});
test('Cross-store order items rejected',()=>{denied(rollback(`insert into public.order_items(order_id,seller_order_id,store_id,product_id,product_name_snapshot,sku_snapshot,quantity,unit_price_minor,total_minor)values(${q(401)},${q(501)},${q(201)},${q(302)},'bad','bad',1,100,100)`),/foreign key/)});
test('Negative money, inconsistent order totals and unsafe bounds are rejected',()=>{denied(rollback(`update public.products set price_minor=-1 where id=${q(301)}`),/check constraint/);denied(rollback(`update public.products set price_minor=9000000000001 where id=${q(301)}`),/check constraint/);denied(rollback(`insert into public.orders(customer_id,idempotency_key,request_hash,subtotal_minor,delivery_minor,total_minor,delivery_address_snapshot)values(${q(1)},'inconsistent-totals-key','hash',100,20,100,'{}')`),/check constraint/)});
test('Order snapshots, audit, ledger and commission entries are immutable',()=>{for(const table of ['audit_logs','financial_ledger_entries','commission_entries','order_items'])denied(rollback(`delete from public.${table}`),/append_only/);denied(rollback(`update public.orders set total_minor=1 where id=${q(401)}`),/order_snapshot_immutable/);denied(rollback(`update public.seller_orders set total_minor=1 where id=${q(501)}`),/order_snapshot_immutable/);denied(rollback(`update public.payment_intents set amount_minor=1 where id=${q(1001)}`),/payment_intent_snapshot_immutable/)});
test('Database audit logs actual seller metadata update',()=>{equal(`begin;set local role authenticated;set local request.jwt.claim.sub='${id(3)}';update public.products set name_ar='تعديل مدقق' where id=${q(301)};reset role;select count(*) from public.audit_logs where entity_id=${q(301)} and actor_id=${q(3)} and next_value->>'name_ar'='تعديل مدقق';rollback;`,1)});
test('Unbalanced financial batches cannot commit',()=>{denied(`begin;insert into public.financial_ledger_entries(batch_id,account_code,credit_minor,idempotency_key,reason)values(${q(1666)},'bad',100,'unbalanced-test','test imbalance');commit;`,/ledger_batch_unbalanced/)});
test('Partial settlement allocation allowed; duplicate/over-allocation rejected',()=>{sql(`insert into public.settlement_items(seller_settlement_id,ledger_entry_id,amount_minor,idempotency_key)values(${q(1701)},${q(1501)},6000,'test-allocation-one')`);denied(rollback(`insert into public.settlement_items(seller_settlement_id,ledger_entry_id,amount_minor,idempotency_key)values(${q(1702)},${q(1501)},5000,'test-allocation-two')`),/settlement_exceeds_available_credit/);equal('select sum(amount_minor) from public.settlement_items',6000)});
test('Sale commission cannot be recorded twice for one seller order',()=>{denied(rollback(`insert into public.commission_entries(kind,seller_order_id,seller_rule_id,basis_minor,amount_minor,idempotency_key,rule_snapshot,eligibility_evidence,reason)values('sale',${q(501)},${q(1301)},14500,1450,'test-commission-duplicate','{}','{}','duplicate test')`),/duplicate key/)});
test('No unsafe PUBLIC execute or writable financial API grants',()=>{equal("select count(*) from information_schema.role_table_grants where grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE') and table_name in ('user_roles','orders','seller_orders','order_items','payment_intents','financial_ledger_entries','commission_entries','seller_settlements','delivery_settlements')",0);equal("select count(*) from information_schema.routine_privileges where specific_schema='app_private' and grantee='PUBLIC' and privilege_type='EXECUTE'",0)});
fs.mkdirSync('work/phase4a',{recursive:true});fs.writeFileSync('work/phase4a/database-test-results.json',JSON.stringify({engine:sql('select version()').output,scope:'PostgreSQL engine with mocked Auth/Storage contracts; no hosted Supabase',passed,results},null,2));console.log(`${passed} database foundation tests passed`);
