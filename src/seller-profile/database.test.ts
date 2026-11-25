// @vitest-environment node
// Disposable reconstructed schema only; never point this at a hosted database.
import {beforeAll,beforeEach,afterAll,describe,it,expect} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const container=process.env['SELLER_PROFILE_TEST_DOCKER'];
const suite=describe.skipIf(!container);
const database=`personal_profile_test_${process.pid}_${Date.now()}`;
const A='11111111-1111-4111-8111-111111111111',B='22222222-2222-4222-8222-222222222222',C='33333333-3333-4333-8333-333333333333';
const sql=(input:string,db=database)=>execFileSync('docker',['exec','-i',container!,'psql','-U','postgres','-d',db,'-XqAt','-v','ON_ERROR_STOP=1'],{input,encoding:'utf8',stdio:['pipe','pipe','pipe']}).trim();
const actor=(id:string,input:string)=>sql(`set role authenticated;set "request.jwt.claim.sub"='${id}';${input}`);
const data={fullNameAr:'أحمد سالم',fullNameEn:'Ahmed Salem',phone:'+971501234567',emirate:'dubai',cityArea:'اختبار',buildingName:'البناية',buildingNumber:'',preferredLanguage:'ar',avatarPath:'',bankHolder:'',bankName:'Example',iban:'AE070331234567890123456',bankCertificatePath:'',vatRegistered:false,trn:''};
const save=(id=A,value:object=data,complete=false)=>actor(id,`select public.sanaa_seller_personal_save('${JSON.stringify(value)}'::jsonb,${complete});`);
const verified=()=>sql(`update auth.users set phone='971501234567',phone_confirmed_at=now() where id='${A}';`);
suite('seller private details: isolated PostgreSQL RPC, RLS and Storage policy checks',()=>{
 beforeAll(()=>{
  if(container!=='sanaa-phase4a-pg')throw Error('Refusing an unrecognized local test container');
  sql(`do $$begin if not exists(select 1 from pg_roles where rolname='anon')then create role anon;end if;if not exists(select 1 from pg_roles where rolname='authenticated')then create role authenticated;end if;end$$;create database ${database};`,'postgres');
  sql(`create schema auth;create schema app_private;create schema storage;
   create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz,phone text,phone_confirmed_at timestamptz,created_at timestamptz default now());
   create function auth.uid()returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.profiles(id uuid primary key references auth.users,active boolean default true);
   create table public.user_roles(user_id uuid,role text);create table public.seller_profiles(user_id uuid);
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));alter table storage.objects enable row level security;
   create function storage.foldername(name text)returns text[] language sql immutable as $$select string_to_array(name,'/')$$;
   grant usage on schema public,auth,app_private,storage to authenticated,anon;
   grant select,insert,update,delete on storage.objects to authenticated;
   insert into auth.users(id,email,email_confirmed_at)values('${A}','seller-a@example.invalid',now()),('${B}','seller-b@example.invalid',now()),('${C}','buyer@example.invalid',now());
   insert into public.profiles(id)select id from auth.users;insert into public.user_roles values('${A}','seller'),('${B}','seller'),('${C}','customer');insert into public.seller_profiles values('${A}'),('${B}');`);
  const migration=readFileSync('docs/sql/20261125_seller_personal_profile_review.sql','utf8');sql(migration);sql(migration);
 });
 beforeEach(()=>sql(`truncate public.seller_personal_details,public.seller_bank_details,storage.objects;update public.profiles set active=true;update auth.users set phone=null,phone_confirmed_at=null,email_confirmed_at=now();`));
 afterAll(()=>{if(container==='sanaa-phase4a-pg')sql(`drop database if exists ${database} with(force);`,'postgres')});
 it('returns system registration/email and saves only the current owner',()=>{const r=JSON.parse(save());expect(r.email).toBe('seller-a@example.invalid');expect(r.registeredAt).toBeTruthy();expect(r.draft.fullNameAr).toBe(data.fullNameAr);expect(sql('select user_id from public.seller_bank_details;')).toBe(A)});
 it('isolates the bank and personal rows of two sellers',()=>{save();expect(actor(B,'select count(*) from public.seller_bank_details;')).toBe('0');expect(actor(B,'select count(*) from public.seller_personal_details;')).toBe('0');expect(JSON.parse(actor(B,'select public.sanaa_seller_personal_get();')).draft.iban).toBe('')});
 it('blocks customers, anonymous callers and suspended sellers',()=>{expect(()=>save(C)).toThrow();expect(()=>sql('set role anon;select public.sanaa_seller_personal_get();')).toThrow();sql(`update public.profiles set active=false where id='${A}';`);expect(()=>save()).toThrow()});
 it('blocks forged owner, email, OTP status, role and signup date fields',()=>{for(const addition of [{user_id:B},{email:'other@example.invalid'},{phoneConfirmed:true},{role:'admin'},{registeredAt:'2020'}])expect(()=>save(A,{...data,...addition})).toThrow()});
 it('requires a real server-side phone confirmation before completion',()=>{expect(()=>save(A,data,true)).toThrow();verified();const result=JSON.parse(save(A,data,true));expect(result.completedAt).toBeTruthy();expect(result.phoneConfirmed).toBe(true)});
 it('requires email confirmation and exact matching verified phone',()=>{verified();expect(()=>save(A,{...data,phone:'+971509999999'},true)).toThrow();sql(`update auth.users set email_confirmed_at=null where id='${A}';`);expect(()=>save(A,data,true)).toThrow()});
 it('rejects invalid IBAN/checksum and missing required fields on the server',()=>{expect(()=>save(A,{...data,iban:'AE080331234567890123456'})).toThrow();verified();expect(()=>save(A,{...data,buildingName:''},true)).toThrow()});
 it('validates conditional TRN and clears TRN when VAT is not registered',()=>{verified();expect(()=>save(A,{...data,vatRegistered:true,trn:''},true)).toThrow();expect(JSON.parse(save(A,{...data,trn:'100123456789012'},true)).draft.trn).toBe('')});
 it('denies direct bank and completion-state updates, even for the owner',()=>{save();expect(()=>actor(A,`update public.seller_bank_details set iban='';`)).toThrow();expect(()=>actor(A,`update public.seller_personal_details set completed_at=now();`)).toThrow()});
 it('rejects attaching a foreign or nonexistent private document',()=>{expect(()=>save(A,{...data,avatarPath:`${B}/avatar/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`})).toThrow();expect(()=>save(A,{...data,avatarPath:`${A}/avatar/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`})).toThrow()});
 it('enforces private Storage owner paths, reference protection and no overwrite',()=>{
  const path=`${A}/avatar/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa.png`;
  actor(A,`insert into storage.objects(bucket_id,name)values('seller-profile-private','${path}');`);expect(()=>actor(B,`insert into storage.objects(bucket_id,name)values('seller-profile-private','${path}');`)).toThrow();
  expect(actor(B,'select count(*) from storage.objects;')).toBe('0');save(A,{...data,avatarPath:path});actor(A,'delete from storage.objects;');expect(sql('select count(*) from storage.objects;')).toBe('1');actor(A,`update storage.objects set name='overwritten';`);expect(sql('select name from storage.objects;')).toBe(path);
  expect(sql(`select public from storage.buckets where id='seller-profile-private';`)).toBe('f');
 });
 it('invalidates completion when the verified phone is changed or confirmation revoked',()=>{verified();save(A,data,true);sql(`update auth.users set phone='971509999999' where id='${A}';`);expect(JSON.parse(actor(A,'select public.sanaa_seller_personal_get();')).completedAt).toBeNull()});
});
