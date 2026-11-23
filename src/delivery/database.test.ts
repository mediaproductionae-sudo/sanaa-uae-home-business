// @vitest-environment node
// ONLY disposable local PostgreSQL. No production fixtures, auth users, or writes.
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import postgres from 'postgres';
import {readFile,readdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {spawn} from 'node:child_process';
import {Duplex} from 'node:stream';
const testUrl=process.env['DELIVERY_TEST_DATABASE_URL'];
const suite=describe.skipIf(!testUrl);
const dbName=`delivery_test_${process.pid}_${Date.now()}`;
const dockerContainer=process.env['DELIVERY_TEST_DOCKER_CONTAINER'];
function localSocket(){
 if(!dockerContainer||!/^sanaa-(phase4a-pg|delivery-test)$/.test(dockerContainer))throw new Error('Refusing unrecognized local container');
 const child=spawn('docker',['exec','-i',dockerContainer,'bash','-c','exec 3<>/dev/tcp/127.0.0.1/5432; cat <&3 & cat >&3; wait'],{stdio:['pipe','pipe','pipe']});
 const stream=Duplex.from({readable:child.stdout,writable:child.stdin});
 child.on('error',e=>stream.destroy(e));child.on('close',()=>stream.destroy());stream.on('close',()=>child.kill());return stream;
}
const localOptions={ssl:false as const,...(dockerContainer?{socket:localSocket}:{})};
let root:ReturnType<typeof postgres>, db:ReturnType<typeof postgres>;
const admin=randomUUID(), ops=randomUUID(), dispatcher=randomUUID(), driver=randomUUID(), otherOps=randomUUID(), customer=randomUUID(), seller=randomUUID();
let storeId:string,productId:string,companyId:string,otherCompanyId:string,serviceId:string,contractId:string,rateId:string;
const fullHours={timezone:'Asia/Dubai',days:[0,1,2,3,4,5,6],open:'00:00',close:'00:00'};
const date=(minutes:number)=>new Date(Date.now()+minutes*60000).toISOString();
async function asUser<T>(user:string,run:(tx:any)=>Promise<T>):Promise<T>{return db.begin(async tx=>{await tx`select set_config('request.jwt.claim.sub',${user},true)`;await tx.unsafe('set local role authenticated');return run(tx);}) as Promise<T>;}
async function command(user:string,action:string,data:unknown,key=randomUUID(),reason='Verified test decision'){return asUser(user,async tx=>(await tx`select public.sanaa_delivery_command(${key}::uuid,${tx.json({action,data,reason})}::jsonb) result`)[0].result);}
async function read(user:string,request:unknown){return asUser(user,async tx=>(await tx`select public.sanaa_delivery_read(${tx.json(request)}::jsonb) result`)[0].result);}
async function makeOrder(paid=true,dropoff:unknown={emirate:'dubai',area_code:'D1',address_lines:'Actual delivery address',recipient_name:'Local fixture recipient',phone:'000'},fee=500){
 const orderId=randomUUID(),sellerOrderId=randomUUID(),itemId=randomUUID();
 await db`insert into public.orders(id,customer_id,idempotency_key,request_hash,status,subtotal_minor,delivery_minor,total_minor,delivery_address_snapshot) values(${orderId},${customer},${randomUUID()},'isolated-fixture','confirmed',1000,${fee},${1000+fee},${db.json(dropoff as any)}::jsonb)`;
 await db`insert into public.seller_orders(id,order_id,store_id,status,subtotal_minor,total_minor) values(${sellerOrderId},${orderId},${storeId},'ready',1000,1000)`;
 await db`insert into public.order_items(id,order_id,seller_order_id,store_id,product_id,product_name_snapshot,sku_snapshot,quantity,unit_price_minor,total_minor) values(${itemId},${orderId},${sellerOrderId},${storeId},${productId},'Local fixture product','fixture',2,500,1000)`;
 if(paid){const intent=randomUUID(),event=randomUUID();await db`insert into public.payment_intents(id,order_id,idempotency_key,amount_minor,status,expires_at) values(${intent},${orderId},${randomUUID()},${1000+fee},'succeeded',${date(100)}::timestamptz)`;await db`insert into public.payment_events(id,intent_id,provider,provider_event_id,event_type,payload_hash,verified_at) values(${event},${intent},'simulation',${randomUUID()},'capture','isolated-fixture',now())`;await db`insert into public.payment_transactions(intent_id,order_id,event_id,provider_transaction_id,kind,amount_minor) values(${intent},${orderId},${event},${randomUUID()},'capture',${1000+fee})`;}
 return {orderId,sellerOrderId,itemId};
}
const preparation=(seller_order_id:string,extra={})=>({seller_order_id,weight_grams:1000,volume_cm3:1000,shipping_class:'standard',pickup_snapshot:{emirate:'dubai',area_code:'P1',address_lines:'Actual pickup address'},ready_at:date(-10),pickup_until:date(120),deliver_by:date(240),evidence:'Verified local measurements',...extra});
async function prepare(order:string,extra={}){return command(admin,'prepare',preparation(order,extra));}
async function quote(order:string){return command(admin,'quote',{seller_order_id:order,service_id:serviceId,contract_id:contractId,rate_card_id:rateId});}
async function shipment(){const order=await makeOrder();await prepare(order.sellerOrderId);await quote(order.sellerOrderId);const result=await command(admin,'create',{seller_order_id:order.sellerOrderId});return {...order,shipmentId:result.id};}
const assignment=(shipment_id:string,extra={})=>({shipment_id,company_id:companyId,service_id:serviceId,contract_id:contractId,rate_card_id:rateId,offer_minutes:10,...extra});
suite('delivery PostgreSQL transactions, RLS and concurrent commands',()=>{
 beforeAll(async()=>{
  if(!testUrl)throw new Error('Local test URL required'); const url=new URL(testUrl);
  if(!['127.0.0.1','localhost'].includes(url.hostname)||url.port!=='55432')throw new Error('Refusing non-isolated database');
  root=postgres(testUrl,{...localOptions,max:1}); await root.unsafe("DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF; IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF; END $$;"); await root.unsafe(`create database "${dbName}"`);url.pathname=`/${dbName}`; db=postgres(url.toString(),{...localOptions,max:8});
  await db.unsafe(`create schema auth; create schema storage; create schema extensions;
  create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}',email_confirmed_at timestamptz default now());
  create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
  create table storage.objects(id uuid primary key,bucket_id text,name text);
  grant usage on schema auth,storage to anon,authenticated,service_role; grant execute on function auth.uid() to anon,authenticated,service_role;`);
  await db.unsafe(await readFile('drizzle/migrations/0000_sanaa_full_schema.sql','utf8'));
  for(const file of (await readdir('drizzle/migrations')).sort().filter(x=>/^000[1-9]_.*\.sql$/.test(x)))await db.unsafe(await readFile(`drizzle/migrations/${file}`,'utf8'));
  for(const id of [admin,ops,dispatcher,driver,otherOps,customer,seller])await db`insert into auth.users(id) values(${id})`;
  await db`insert into public.user_roles(user_id,role) values(${admin},'admin'),(${seller},'seller')`;
  await db`insert into public.admin_permissions(user_id,permission) values(${admin},'delivery.manage'),(${admin},'orders.read')`;
  const sellerRow=await db`insert into public.seller_profiles(user_id,business_name) values(${seller},'Isolated seller') returning id`;
  const category=await db`insert into public.categories(slug,name_ar) values('isolated-test','Isolated category') returning id`;
  const store=await db`insert into public.stores(seller_id,slug,name_ar,emirate,area_code,status) values(${sellerRow[0]?.['id']},'isolated-test','Isolated store','dubai','P1','active') returning id`;storeId=String(store[0]?.['id']);
  const product=await db`insert into public.products(store_id,category_id,sku,name_ar,kind,status,price_minor) values(${storeId},${category[0]?.['id']},'fixture','Isolated product','product','published',500) returning id`;productId=String(product[0]?.['id']);
  companyId=(await command(admin,'company',{name_ar:'Isolated carrier A',capacity_daily:100,approval_status:'approved',hours:fullHours})).id;
  otherCompanyId=(await command(admin,'company',{name_ar:'Isolated carrier B',capacity_daily:100,approval_status:'approved',hours:fullHours})).id;
  for(const [user,role,cid] of [[ops,'operations',companyId],[dispatcher,'dispatcher',companyId],[driver,'driver',companyId],[otherOps,'operations',otherCompanyId]])await command(admin,'member',{company_id:cid,user_id:user,scoped_role:role,active:true});
  serviceId=(await command(admin,'service',{company_id:companyId,code:'standard',name_ar:'Isolated service',shipping_classes:['standard'],eta_minutes:30,capacity_daily:100})).id;
  contractId=(await command(admin,'contract',{company_id:companyId,model:'fixed',fixed_minor:0,rate_bps:0,valid_from:date(-60),valid_until:date(600)})).id;
  for(const [area,pickup,dropoff] of [['P1',true,false],['D1',false,true]])await command(admin,'coverage',{service_id:serviceId,emirate:'dubai',area_code:area,pickup,dropoff});
  rateId=(await command(admin,'rate',{service_id:serviceId,pickup_emirate:'dubai',pickup_area_code:'P1',dropoff_emirate:'dubai',dropoff_area_code:'D1',base_minor:500,per_kg_minor:0,per_volume_unit_minor:0,volume_unit_cm3:1000,special_handling_minor:0,disclosed_surcharge_minor:0,max_weight_grams:10000,max_volume_cm3:10000,valid_from:date(-60),valid_until:date(600)})).id;
 },30000);
 afterAll(async()=>{if(db)await db.end();if(root){await root.unsafe(`drop database if exists "${dbName}"`);await root.end();}},30000);
 it('blocks unpaid orders and numeric UI ids',async()=>{const o=await makeOrder(false);await expect(prepare(o.sellerOrderId)).rejects.toThrow('delivery_paid_order_required');await expect(command(admin,'create',{seller_order_id:'123'})).rejects.toThrow();});
 it('creates one shipment from actual order items and immutable fees',async()=>{const s=await shipment();const lines=await db`select order_item_id,quantity from public.shipment_items where shipment_id=${s.shipmentId}`;expect(lines).toHaveLength(1);expect(lines[0]?.['order_item_id']).toBe(s.itemId);expect(lines[0]?.['quantity']).toBe(2);const fees=await db`select customer_fee_minor,carrier_gross_minor from public.shipments where id=${s.shipmentId}`;expect(Number(fees[0]?.['customer_fee_minor'])).toBe(500);expect(Number(fees[0]?.['carrier_gross_minor'])).toBe(500);await expect(db`update public.shipments set carrier_gross_minor=501 where id=${s.shipmentId}`).rejects.toThrow('delivery_immutable_quote');await expect(command(admin,'create',{seller_order_id:s.sellerOrderId})).rejects.toThrow('delivery_already_created');});
 it('blocks missing locations, unknown measurements, wrong coverage and fee mismatch',async()=>{const missing=await makeOrder(true,{});await prepare(missing.sellerOrderId);await expect(quote(missing.sellerOrderId)).rejects.toThrow('delivery_location_missing');const o=await makeOrder();await expect(prepare(o.sellerOrderId,{weight_grams:0})).rejects.toThrow('delivery_preparation_missing');await prepare(o.sellerOrderId,{weight_grams:20000});expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);await prepare(o.sellerOrderId,{pickup_snapshot:{emirate:'dubai',area_code:'UNKNOWN',address_lines:'Actual address'}});expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);const mismatched=await makeOrder(true,undefined,501);await prepare(mismatched.sellerOrderId);await expect(quote(mismatched.sellerOrderId)).rejects.toThrow('delivery_quote_fee_mismatch');});
 it('blocks wrong class, future readiness and expired contract',async()=>{const o=await makeOrder();await expect(prepare(o.sellerOrderId,{shipping_class:'cold'})).rejects.toThrow('delivery_shipping_class_mismatch');await prepare(o.sellerOrderId,{ready_at:date(60)});expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);await prepare(o.sellerOrderId);await db`update public.delivery_contracts set active=false where id=${contractId}`;expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);await db`update public.delivery_contracts set active=true where id=${contractId}`;});
 it('requires rejection reason and persists rejection with admin notification',async()=>{const s=await shipment();const a=await command(admin,'assign',assignment(s.shipmentId));await expect(command(ops,'reject',{assignment_id:a.id},randomUUID(),' ')).rejects.toThrow('delivery_reason_required');await command(ops,'reject',{assignment_id:a.id},randomUUID(),'Insufficient collection capacity');const detail=await read(admin,{view:'shipment',id:s.shipmentId});expect(detail.assignments[0].status).toBe('rejected');expect(detail.assignments[0].response_reason).toBe('Insufficient collection capacity');expect(detail.shipment.status).toBe('pending');const notices=await db`select count(*) n from public.notifications where user_id=${admin} and type='delivery_response'`;expect(Number(notices[0]?.['n'])).toBeGreaterThan(0);});
 it('replays the same command and conflicts on changed payload',async()=>{const s=await shipment();const key=randomUUID();const first=await command(admin,'assign',assignment(s.shipmentId),key);expect(await command(admin,'assign',assignment(s.shipmentId),key)).toEqual(first);await expect(command(admin,'assign',assignment(s.shipmentId,{offer_minutes:11}),key)).rejects.toThrow('delivery_key_conflict');});
 it('rejects expired and superseded acceptance and permits safe reoffer',async()=>{const s=await shipment();const first=await command(admin,'assign',assignment(s.shipmentId));await db`update public.delivery_assignments set expires_at=now()-interval '1 minute' where id=${first.id}`;await expect(command(ops,'accept',{assignment_id:first.id})).rejects.toThrow('delivery_offer_expired');expect((await read(ops,{view:'shipment',id:s.shipmentId,company_id:companyId})).assignments[0].status).toBe('expired');const second=await command(admin,'assign',assignment(s.shipmentId,{confirm_reassignment:true}));await expect(command(ops,'accept',{assignment_id:first.id})).rejects.toThrow('delivery_stale_offer');await command(ops,'accept',{assignment_id:second.id});});
 it('suspension blocks acceptance and access immediately',async()=>{const s=await shipment();const a=await command(admin,'assign',assignment(s.shipmentId));await command(admin,'company',{id:companyId,name_ar:'Isolated carrier A',capacity_daily:100,approval_status:'suspended',hours:fullHours});await expect(command(ops,'accept',{assignment_id:a.id})).rejects.toThrow('delivery_forbidden');await expect(read(ops,{view:'shipments',company_id:companyId})).rejects.toThrow('delivery_forbidden');await command(admin,'company',{id:companyId,name_ar:'Isolated carrier A',capacity_daily:100,approval_status:'approved',hours:fullHours});});
 it('scopes portal and direct Data API reads; lower roles cannot respond or edit money',async()=>{const s=await shipment();const a=await command(admin,'assign',assignment(s.shipmentId));await expect(command(otherOps,'accept',{assignment_id:a.id})).rejects.toThrow('delivery_forbidden');await expect(read(otherOps,{view:'shipment',company_id:otherCompanyId,id:s.shipmentId})).rejects.toThrow('delivery_not_found');await expect(read(ops,{view:'shipments',company_id:otherCompanyId})).rejects.toThrow('delivery_forbidden');for(const user of [dispatcher,driver])await expect(command(user,'accept',{assignment_id:a.id})).rejects.toThrow('delivery_forbidden');await expect(command(ops,'rate',{})).rejects.toThrow('delivery_forbidden');const direct=await asUser(ops,async tx=>({shipments:await tx`select * from public.shipments where id=${s.shipmentId}`,orders:await tx`select * from public.orders where id=${s.orderId}`,assignments:await tx`select * from public.delivery_assignments where company_id=${otherCompanyId}`}));expect(direct.shipments).toHaveLength(0);expect(direct.orders).toHaveLength(0);expect(direct.assignments).toHaveLength(0);const own=await read(ops,{view:'shipment',company_id:companyId,id:s.shipmentId});expect(own.shipment.dropoff.phone).toBeNull();await command(ops,'accept',{assignment_id:a.id});expect((await read(ops,{view:'shipment',company_id:companyId,id:s.shipmentId})).shipment.dropoff.phone).toBe('000');});
 it('serializes concurrent creates and assignments',async()=>{const o=await makeOrder();await prepare(o.sellerOrderId);await quote(o.sellerOrderId);const created=await Promise.allSettled([command(admin,'create',{seller_order_id:o.sellerOrderId}),command(admin,'create',{seller_order_id:o.sellerOrderId})]);expect(created.filter(r=>r.status==='fulfilled')).toHaveLength(1);const s=created.find(r=>r.status==='fulfilled');if(!s||s.status!=='fulfilled')throw new Error('No created shipment');const offers=await Promise.allSettled([command(admin,'assign',assignment(s.value.id)),command(admin,'assign',assignment(s.value.id))]);expect(offers.filter(r=>r.status==='fulfilled')).toHaveLength(1);const live=await db`select count(*) n from public.delivery_assignments where shipment_id=${s.value.id} and superseded_at is null`;expect(Number(live[0]?.['n'])).toBe(1);});
 it('concurrent acceptance succeeds only once; idempotent retry reads same result',async()=>{const s=await shipment();const a=await command(admin,'assign',assignment(s.shipmentId));const result=await Promise.allSettled([command(ops,'accept',{assignment_id:a.id}),command(ops,'accept',{assignment_id:a.id})]);expect(result.filter(x=>x.status==='fulfilled')).toHaveLength(1);const s2=await shipment();const a2=await command(admin,'assign',assignment(s2.shipmentId));const key=randomUUID();const first=await command(ops,'accept',{assignment_id:a2.id},key);expect(await command(ops,'accept',{assignment_id:a2.id},key)).toEqual(first);});
 it('enforces capacity without guessing and keeps pending slot for current shipment',async()=>{const s=await shipment();await command(admin,'assign',assignment(s.shipmentId));await db`update public.delivery_companies set capacity_daily=1 where id=${companyId}`;const fresh=await makeOrder();await prepare(fresh.sellerOrderId);expect((await read(admin,{view:'candidates',id:fresh.sellerOrderId})).rows).toHaveLength(0);await db`update public.delivery_companies set capacity_daily=100 where id=${companyId}`;});

 it('blocks driver portal and raw reads even with a legacy global delivery role',async()=>{
  await db`insert into public.user_roles(user_id,role) values(${driver},'delivery_operator') on conflict do nothing`;
  await expect(read(driver,{view:'dashboard',company_id:companyId})).rejects.toThrow('delivery_forbidden');
  await expect(read(driver,{view:'shipments',company_id:companyId})).rejects.toThrow('delivery_forbidden');
  const direct=await asUser(driver,tx=>tx`select * from public.shipments`);expect(direct).toHaveLength(0);
 });
 it('checks configured UAE hours, including overnight shifts, and rejects unfunded commission',async()=>{
  const hours={timezone:'Asia/Dubai',days:[1],open:'22:00',close:'06:00'};
  const checks=await db`select app_private.delivery_is_open(${db.json(hours)}::jsonb,'2026-11-23T23:00:00+04'::timestamptz) evening,app_private.delivery_is_open(${db.json(hours)}::jsonb,'2026-11-24T03:00:00+04'::timestamptz) overnight,app_private.delivery_is_open(${db.json(hours)}::jsonb,'2026-11-24T23:00:00+04'::timestamptz) closed`;
  expect(checks[0]).toMatchObject({evening:true,overnight:true,closed:false});
  await expect(command(admin,'company',{name_ar:'Missing hours',capacity_daily:5,approval_status:'approved'})).rejects.toThrow('delivery_hours_required');
  const o=await makeOrder();await prepare(o.sellerOrderId);
  const closedHours={...fullHours,days:[(new Date().getUTCDay()+3)%7]};
  await db`update public.delivery_companies set hours=${db.json(closedHours)}::jsonb where id=${companyId}`;
  expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);
  await db`update public.delivery_companies set hours=${db.json(fullHours)}::jsonb where id=${companyId}`;
  await db`update public.delivery_contracts set fixed_minor=501 where id=${contractId}`;
  expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);
  await db`update public.delivery_contracts set fixed_minor=0 where id=${contractId}`;
 });
 it('audits service and coverage toggles and denies company writes',async()=>{
  const payload={action:'service_state',data:{id:serviceId,active:false},reason:'Temporarily disable local fixture service'};
  const key=randomUUID();
  await expect(asUser(ops,tx=>tx`select public.sanaa_delivery_toggle(${key}::uuid,${tx.json(payload)}::jsonb)`)).rejects.toThrow('delivery_forbidden');
  await asUser(admin,tx=>tx`select public.sanaa_delivery_toggle(${key}::uuid,${tx.json(payload)}::jsonb)`);
  const o=await makeOrder();await prepare(o.sellerOrderId);expect((await read(admin,{view:'candidates',id:o.sellerOrderId})).rows).toHaveLength(0);
  await asUser(admin,tx=>tx`select public.sanaa_delivery_toggle(${randomUUID()}::uuid,${tx.json({...payload,data:{id:serviceId,active:true}})}::jsonb)`);
  const logs=await db`select count(*) n from public.audit_logs where entity_table='delivery_services' and entity_id=${serviceId}`;
  expect(Number(logs[0]?.['n'])).toBeGreaterThan(1);
 });
 it('withholds full addresses and other-company offers after reassignment',async()=>{
  const bService=(await command(admin,'service',{company_id:otherCompanyId,code:'private-test',name_ar:'Other service',shipping_classes:['standard'],eta_minutes:30,capacity_daily:100})).id;
  const bContract=(await command(admin,'contract',{company_id:otherCompanyId,model:'fixed',fixed_minor:0,rate_bps:0,valid_from:date(-60),valid_until:date(600)})).id;
  for(const [area,pickup,dropoff] of [['P1',true,false],['D1',false,true]])await command(admin,'coverage',{service_id:bService,emirate:'dubai',area_code:area,pickup,dropoff});
  const bRate=(await command(admin,'rate',{service_id:bService,pickup_emirate:'dubai',pickup_area_code:'P1',dropoff_emirate:'dubai',dropoff_area_code:'D1',base_minor:500,per_kg_minor:0,per_volume_unit_minor:0,volume_unit_cm3:1000,special_handling_minor:0,disclosed_surcharge_minor:0,max_weight_grams:10000,max_volume_cm3:10000,valid_from:date(-60),valid_until:date(600)})).id;
  const s=await shipment();const a=await command(admin,'assign',assignment(s.shipmentId));
  expect((await read(ops,{view:'shipment',company_id:companyId,id:s.shipmentId})).shipment.pickup.address_lines).toBeNull();
  await command(ops,'accept',{assignment_id:a.id});expect((await read(ops,{view:'shipment',company_id:companyId,id:s.shipmentId})).shipment.pickup.address_lines).toBe('Actual pickup address');
  await command(admin,'assign',assignment(s.shipmentId,{company_id:otherCompanyId,service_id:bService,contract_id:bContract,rate_card_id:bRate,confirm_reassignment:true}));
  const former=await read(ops,{view:'shipment',company_id:companyId,id:s.shipmentId});
  expect(former.shipment.pickup.address_lines).toBeNull();expect(former.shipment.dropoff.phone).toBeNull();
  expect(former.assignments.every((x:any)=>x.company_id===companyId)).toBe(true);
 });
 it('rejects an offer that expires while its command waits for the transaction lock',async()=>{
  const s=await shipment();const offer=await command(admin,'assign',assignment(s.shipmentId));let outcome:Promise<any>|undefined;
  await db.begin(async tx=>{await tx`select pg_advisory_xact_lock(741005)`;await tx`update public.delivery_assignments set expires_at=clock_timestamp()+interval '100 milliseconds' where id=${offer.id}`;
   outcome=command(ops,'accept',{assignment_id:offer.id}).then(value=>({ok:true,value}),error=>({ok:false,error}));await tx`select pg_sleep(0.2)`;
  });
  const result=await outcome;expect(result.ok).toBe(false);expect(result.error.message).toContain('delivery_offer_expired');
 });
});
