// @vitest-environment node
// Only a disposable reconstructed database inside the existing local test container.
import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {execFileSync,execFile} from 'node:child_process';import {readFileSync} from 'node:fs';
const container=process.env['CUSTOMER_PROFILE_TEST_DOCKER'];const suite=describe.skipIf(!container),database=`customer_account_test_${process.pid}_${Date.now()}`;
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',S='33333333-3333-4333-8333-333333333333';
const args=(db=database)=>['exec','-i',container!,'psql','-U','postgres','-d',db,'-XqAt','-v','ON_ERROR_STOP=1'];
const sql=(input:string,db=database)=>execFileSync('docker',args(db),{input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const asUser=(id:string,s:string)=>`set role authenticated;set "request.jwt.claim.sub"='${id}';${s}`;
const data={displayName:'اسم جديد',phone:'+971501234567',emirate:'dubai',region:'جميرا',street:'',home:'12',buildingNumber:''};
const query=(id=A,value:object=data)=>asUser(id,`select public.sanaa_customer_profile_save('${JSON.stringify(value).replace(/'/g,"''")}'::jsonb);`);
const save=(id=A,value:object=data)=>JSON.parse(sql(query(id,value)));
const read=(id=A)=>JSON.parse(sql(asUser(id,'select public.sanaa_customer_profile_get();')));
const asyncSql=(input:string)=>new Promise<string>((resolve,reject)=>{const p=execFile('docker',args(),{encoding:'utf8'},(e,out)=>e?reject(e):resolve(out.trim()));p.stdin?.end(input)});
suite('customer account SQL: ownership, verified contact and address preservation',()=>{
 beforeAll(()=>{
  if(container!=='sanaa-phase4a-pg')throw Error('Refusing a non-test database container');
  sql(`do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated;end if;if not exists(select 1 from pg_roles where rolname='service_role')then create role service_role;end if;end$$;create database ${database};`,'postgres');
  sql(`create schema auth;create schema app_private;create type public.emirate_code as enum('abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah');
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,phone text,phone_confirmed_at timestamptz);
   create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.profiles(id uuid primary key,display_name text not null,active boolean default true,updated_at timestamptz default now());create table public.user_roles(user_id uuid,role text);
   create function app_private.active_user()returns boolean language sql stable security definer as $$select exists(select 1 from public.profiles where id=auth.uid() and active)$$;
   grant usage on schema public,auth,app_private to authenticated,anon;
   insert into auth.users values('${A}','a@example.invalid',now(),'971501234567',now()),('${B}','b@example.invalid',now(),'971509999999',now()),('${S}','s@example.invalid',now(),null,null);
   insert into public.profiles(id,display_name)select id,'Original' from auth.users;insert into public.user_roles values('${A}','customer'),('${B}','customer'),('${S}','seller');`);
  const original=readFileSync('drizzle/migrations/0000_sanaa_full_schema.sql','utf8'),start=original.indexOf('create table public.customer_addresses ('),end=original.indexOf('\n);',start)+3;sql(original.slice(start,end));
  sql(`alter table public.customer_addresses enable row level security;grant select on public.customer_addresses to authenticated;`);
  const policyStart=original.indexOf('create policy addresses_owner '),policyEnd=original.indexOf('\n',original.indexOf('grant insert(customer_id,label,emirate',policyStart));sql(original.slice(policyStart,policyEnd));
  const migration=readFileSync('docs/sql/20261127_customer_account_review.sql','utf8');sql(migration);sql(migration);
 });
 beforeEach(()=>sql(`truncate app_private.customer_account_address,public.customer_addresses;update public.profiles set active=true,display_name='Original';update auth.users set email_confirmed_at=now(),phone_confirmed_at=now();update auth.users set phone='971501234567' where id='${A}';`));
 afterAll(()=>{if(container==='sanaa-phase4a-pg')sql(`drop database if exists ${database} with(force);`,'postgres')});
 it('saves the profile and one owned address atomically and reloads it from the database',()=>{const r=save();expect(r.draft).toEqual(data);expect(r.email).toBe('a@example.invalid');expect(read().draft).toEqual(data);expect(sql('select customer_id from public.customer_addresses')).toBe(A)});
 it('does not duplicate the address on retry or concurrent saves',async()=>{await Promise.all([asyncSql(query()),asyncSql(query()),asyncSql(query())]);save();expect(sql('select count(*) from public.customer_addresses')).toBe('1');expect(sql('select count(*) from app_private.customer_account_address')).toBe('1')});
 it('isolates two customer accounts through RPC and the existing address RLS',()=>{save();expect(read(B).draft.home).toBe('');expect(read(B).email).toBe('b@example.invalid');expect(sql(asUser(B,'select count(*) from public.customer_addresses'))).toBe('0')});
 it('denies anonymous, seller-only and suspended users',()=>{expect(()=>sql('set role anon;select public.sanaa_customer_profile_get()')).toThrow();expect(()=>save(S)).toThrow();sql(`update public.profiles set active=false where id='${A}'`);expect(()=>read()).toThrow();expect(()=>save()).toThrow()});
 it('rejects forged owner, email, verification flag or address id',()=>{for(const extra of [{userId:B},{email:'fake'},{phoneConfirmed:true},{addressId:B}])expect(()=>save(A,{...data,...extra})).toThrow()});
 it('requires real server email and matching phone confirmation and rolls back the name on failure',()=>{sql(`update auth.users set phone_confirmed_at=null where id='${A}'`);expect(()=>save()).toThrow();sql(`update auth.users set phone_confirmed_at=now() where id='${A}'`);expect(()=>save(A,{...data,phone:'+971509999999'})).toThrow();sql(`update auth.users set email_confirmed_at=null where id='${A}'`);expect(()=>save()).toThrow();expect(sql(`select display_name from public.profiles where id='${A}'`)).toBe('Original');expect(sql('select count(*) from public.customer_addresses')).toBe('0')});
 it('requires the agreed fields, enforces sizes and leaves optional fields optional',()=>{for(const key of ['displayName','phone','emirate','region','home'])expect(()=>save(A,{...data,[key]:''})).toThrow();expect(()=>save(A,{...data,street:'x'.repeat(161)})).toThrow();expect(save().draft.street).toBe('')});
 it('shows a legacy address and preserves its identity, coverage code, receiver and other addresses',()=>{
  const id=sql(`insert into public.customer_addresses(customer_id,label,emirate,area_code,address_lines,recipient_name,phone)values('${A}','Home','dubai','D1','Legacy home address','Existing recipient','old-phone')returning id;`);
  sql(`insert into public.customer_addresses(customer_id,label,emirate,area_code,address_lines,recipient_name,phone)values('${A}','Work','dubai','D2','Other address','Work recipient','work-phone');`);
  expect(read().legacyAddress).toBe('Legacy home address');save();expect(sql('select address_id from app_private.customer_account_address')).toBe(id);expect(sql(`select area_code||'|'||recipient_name from public.customer_addresses where id='${id}'`)).toBe('D1|Existing recipient');expect(sql("select address_lines from public.customer_addresses where label='Work'")).toBe('Other address');
 });
 it('does not fabricate delivery routing codes from a human-readable area name',()=>{save();expect(sql('select area_code from public.customer_addresses')).toBe('');expect(sql('select region_name from public.customer_addresses')).toBe(data.region)});
 it('denies direct internal-map and newly added private-field writes',()=>{save();expect(()=>sql(asUser(A,'select * from app_private.customer_account_address'))).toThrow();expect(()=>sql(asUser(A,"update public.customer_addresses set home_number='forged'"))).toThrow()});
});
