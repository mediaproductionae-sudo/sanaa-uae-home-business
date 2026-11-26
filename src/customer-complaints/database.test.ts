// @vitest-environment node
// Only the existing isolated test container; no network database URLs or real JWTs.
import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {execFileSync,execFile} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
const container=process.env['COMPLAINT_TEST_DOCKER'];const suite=describe.skipIf(!container);
const database=`complaint_test_${process.pid}_${Date.now()}`;
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',S='33333333-3333-4333-8333-333333333333',C='44444444-4444-4444-8444-444444444444';
const STORE='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';const BODY='نص شكوى للاختبار المعزول';
const args=(db=database)=>['exec','-i',container!,'psql','-U','postgres','-d',db,'-XqAt','-v','ON_ERROR_STOP=1'];
const sql=(input:string,db=database)=>execFileSync('docker',args(db),{input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const asUser=(id:string,input:string)=>`set role authenticated;set "request.jwt.claim.sub"='${id}';${input}`;
const query=(id:string,key=randomUUID(),body=BODY,store=STORE)=>asUser(id,`select public.sanaa_customer_complaint_submit('${key}','${store}','${body.replace(/'/g,"''")}');`);
const submit=(id=A,key=randomUUID(),body=BODY,store=STORE)=>JSON.parse(sql(query(id,key,body,store)));
const read=(id=A)=>JSON.parse(sql(asUser(id,'select public.sanaa_customer_complaints_read();')));
const asyncSql=(input:string)=>new Promise<string>((resolve,reject)=>{const p=execFile('docker',args(),{encoding:'utf8'},(e,stdout)=>e?reject(e):resolve(stdout.trim()));p.stdin?.end(input)});
suite('customer complaints SQL: authorization, privacy, persistence and retries',()=>{
 beforeAll(()=>{
  if(container!=='sanaa-phase4a-pg')throw Error('Refusing a non-test container');
  sql(`do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role')then create role service_role;end if;end$$;create database ${database};`,'postgres');
  sql(`create schema auth;create schema app_private;
   create table auth.users(id uuid primary key,email_confirmed_at timestamptz);
   create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.profiles(id uuid primary key,active boolean default true);create table public.user_roles(user_id uuid,role text);
   create table public.seller_profiles(id uuid primary key,user_id uuid);create table public.stores(id uuid primary key,seller_id uuid,name_ar text,status text);
   create table public.complaints(id uuid primary key default gen_random_uuid(),customer_id uuid references public.profiles,store_id uuid references public.stores,order_item_id uuid,type text,priority text default 'medium',status text default 'new',body text check(char_length(body) between 10 and 4000),assigned_to uuid,closed_at timestamptz,created_at timestamptz default now());
   create table public.complaint_actions(id uuid default gen_random_uuid(),complaint_id uuid references public.complaints,actor_id uuid,visibility text,action text,note text,created_at timestamptz default now());
   grant usage on schema public,auth,app_private to authenticated,anon;
   insert into auth.users values('${A}',now()),('${B}',now()),('${S}',now()),('${C}',null);
   insert into public.profiles(id)select id from auth.users;insert into public.user_roles values('${A}','customer'),('${B}','customer'),('${C}','customer'),('${S}','seller');
   insert into public.seller_profiles values('${S}','${S}');insert into public.stores values('${STORE}','${S}','متجر اختبار','active');`);
  const original=readFileSync('drizzle/migrations/0000_sanaa_full_schema.sql','utf8');const start=original.indexOf('create function app_private.public_store(');const end=original.indexOf('$$;',start)+3;sql(original.slice(start,end));
  const migration=readFileSync('docs/sql/20261126_customer_complaints_review.sql','utf8');sql(migration);sql(migration);
 });
 beforeEach(()=>sql(`truncate public.complaint_actions,app_private.customer_complaint_requests,public.complaints;update public.profiles set active=true;update public.stores set status='active';`));
 afterAll(()=>{if(container==='sanaa-phase4a-pg')sql(`drop database if exists ${database} with(force);`,'postgres')});
 it('saves the verified caller and store with server defaults and reads it in another session',()=>{const item=submit();expect(item.body).toBe(BODY);expect(item.storeId).toBe(STORE);expect(item.status).toBe('new');expect(item.createdAt).toBeTruthy();expect(read()[0].id).toBe(item.id);expect(sql('select customer_id from public.complaints')).toBe(A)});
 it('returns no other customer complaints or internal notes',()=>{const item=submit();sql(`insert into public.complaint_actions(complaint_id,visibility,action,note)values('${item.id}','internal','note','INTERNAL SECRET'),('${item.id}','participants','reply','رد معلن');`);expect(read(B)).toEqual([]);expect(read()[0].replies.map((r:{note:string})=>r.note)).toEqual(['رد معلن'])});
 it('denies anonymous, unconfirmed, seller-only and suspended accounts',()=>{expect(()=>sql('set role anon;select public.sanaa_customer_complaints_read();')).toThrow();expect(()=>submit(C)).toThrow();expect(()=>submit(S)).toThrow();sql(`update public.profiles set active=false where id='${A}'`);expect(()=>submit()).toThrow();expect(()=>read()).toThrow()});
 it('rejects short, long and nonexistent/archived stores, including inactive store owners',()=>{for(const body of ['tiny','x'.repeat(4001)])expect(()=>submit(A,randomUUID(),body)).toThrow();expect(()=>submit(A,randomUUID(),BODY,randomUUID())).toThrow();sql(`update public.stores set status='archived'`);expect(()=>submit()).toThrow();sql(`update public.stores set status='active';update public.profiles set active=false where id='${S}'`);expect(()=>submit()).toThrow()});
 it('reuses the receipt on retry and refuses changed data for the same key',()=>{const key=randomUUID(),first=submit(A,key);expect(submit(A,key).id).toBe(first.id);expect(()=>submit(A,key,BODY+' مختلف')).toThrow();expect(sql('select count(*) from public.complaints')).toBe('1')});
 it('serializes concurrent retries into one complaint',async()=>{const key=randomUUID();const results=await Promise.all([asyncSql(query(A,key)),asyncSql(query(A,key)),asyncSql(query(A,key))]);expect(new Set(results.map(x=>JSON.parse(x).id)).size).toBe(1);expect(sql('select count(*) from public.complaints')).toBe('1')});
 it('scopes request ids to each caller rather than returning a foreign receipt',()=>{const key=randomUUID();const first=submit(A,key),second=submit(B,key);expect(first.id).not.toBe(second.id);expect(read(A)).toHaveLength(1);expect(read(B)).toHaveLength(1)});
 it('limits new submissions but still permits a retry at the limit',()=>{const key=randomUUID(),first=submit(A,key);for(let n=0;n<4;n++)submit();expect(()=>submit()).toThrow();expect(submit(A,key).id).toBe(first.id);});
 it('denies direct receipt access, complaint mutation and a forged owner parameter',()=>{expect(()=>sql(asUser(A,'select * from app_private.customer_complaint_requests'))).toThrow();expect(()=>sql(asUser(A,"insert into public.complaints(customer_id,store_id,type,body)values('"+B+"','"+STORE+"','أخرى','"+BODY+"')"))).toThrow();expect(()=>sql(asUser(A,`select public.sanaa_customer_complaint_submit('${randomUUID()}','${STORE}','${BODY}','${B}');`))).toThrow()});
});
