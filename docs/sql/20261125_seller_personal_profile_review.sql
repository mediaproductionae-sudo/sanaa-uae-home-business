-- REVIEW ONLY: Lovable must compare with the managed schema before applying.
-- Additive; no auth user creation, seed data, old migrations, or financial operations.
begin;
create or replace function app_private.seller_personal_actor() returns uuid
language sql stable security definer set search_path='' as $$
 select p.id from public.profiles p
 where p.id=auth.uid() and p.active
 and exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='seller')
 and exists(select 1 from public.seller_profiles sp where sp.user_id=p.id)
$$;
revoke all on function app_private.seller_personal_actor() from public,anon;
grant execute on function app_private.seller_personal_actor() to authenticated;
create or replace function app_private.valid_ae_iban(value text) returns boolean
language plpgsql immutable strict set search_path='' as $$
declare c text; expanded text:=''; rest integer:=0; i integer; begin
 if value !~ '^AE[0-9]{21}$' then return false; end if;
 for i in 1..23 loop
  c:=substr(substr(value,5)||substr(value,1,4),i,1);
  expanded:=expanded||case when c ~ '[A-Z]' then (ascii(c)-55)::text else c end;
 end loop;
 for i in 1..char_length(expanded) loop rest:=(rest*10+substr(expanded,i,1)::integer)%97; end loop;
 return rest=1;
end $$;
revoke all on function app_private.valid_ae_iban(text) from public,anon;
create table if not exists public.seller_personal_details (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 full_name_ar text not null default '' check(char_length(full_name_ar)<=120),
 full_name_en text not null default '' check(char_length(full_name_en)<=120),
 phone text not null default '' check(phone='' or phone ~ '^\+[1-9][0-9]{7,14}$'),
 emirate text not null default '' check(emirate in ('','abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah')),
 city_area text not null default '' check(char_length(city_area)<=160),
 building_name text not null default '' check(char_length(building_name)<=120),
 building_number text not null default '' check(char_length(building_number)<=30),
 preferred_language text not null default 'ar' check(preferred_language in ('ar','en')),
 avatar_path text not null default '',
 vat_registered boolean not null default false,
 trn text not null default '' check(trn='' or trn ~ '^[0-9]{15}$'),
 completed_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.seller_bank_details (
 user_id uuid primary key references public.profiles(id) on delete cascade,
 holder_name text not null default '' check(char_length(holder_name)<=120),
 bank_name text not null default '' check(char_length(bank_name)<=120),
 iban text not null default '' check(iban='' or app_private.valid_ae_iban(iban)),
 certificate_path text not null default '', updated_at timestamptz not null default now()
);
alter table public.seller_personal_details enable row level security;
alter table public.seller_bank_details enable row level security;
revoke all on public.seller_personal_details,public.seller_bank_details from public,anon,authenticated;
grant select on public.seller_personal_details,public.seller_bank_details to authenticated;
drop policy if exists seller_personal_owner on public.seller_personal_details;
create policy seller_personal_owner on public.seller_personal_details for select to authenticated using(user_id=app_private.seller_personal_actor());
drop policy if exists seller_bank_owner on public.seller_bank_details;
create policy seller_bank_owner on public.seller_bank_details for select to authenticated using(user_id=app_private.seller_personal_actor());
create or replace function public.sanaa_seller_personal_get() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.seller_personal_actor(); p public.seller_personal_details; b public.seller_bank_details; u auth.users; begin
 if actor is null then raise exception 'seller_required' using errcode='42501'; end if;
 select * into p from public.seller_personal_details where user_id=actor;
 select * into b from public.seller_bank_details where user_id=actor;
 select * into u from auth.users where id=actor;
 return jsonb_build_object('draft',jsonb_build_object(
  'fullNameAr',coalesce(p.full_name_ar,''),'fullNameEn',coalesce(p.full_name_en,''),'phone',coalesce(p.phone,''),
  'emirate',coalesce(p.emirate,''),'cityArea',coalesce(p.city_area,''),'buildingName',coalesce(p.building_name,''),'buildingNumber',coalesce(p.building_number,''),
  'preferredLanguage',coalesce(p.preferred_language,'ar'),'avatarPath',coalesce(p.avatar_path,''),
  'bankHolder',coalesce(b.holder_name,''),'bankName',coalesce(b.bank_name,''),'iban',coalesce(b.iban,''),'bankCertificatePath',coalesce(b.certificate_path,''),
  'vatRegistered',coalesce(p.vat_registered,false),'trn',coalesce(p.trn,'')),
  'email',coalesce(u.email,''),'emailConfirmed',u.email_confirmed_at is not null,
  'authPhone',case when coalesce(u.phone,'')='' then '' else '+'||ltrim(u.phone,'+') end,
  'phoneConfirmed',u.phone_confirmed_at is not null,'registeredAt',u.created_at,
  'completedAt',case when u.email_confirmed_at is not null and u.phone_confirmed_at is not null and p.phone='+'||ltrim(u.phone,'+') then p.completed_at else null end);
end $$;
create or replace function public.sanaa_seller_personal_save(payload jsonb,complete_profile boolean default false) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.seller_personal_actor(); u auth.users; k text; v text; vat boolean; clean_trn text; path text; begin
 if actor is null then raise exception 'seller_required' using errcode='42501'; end if;
 if payload is null or jsonb_typeof(payload)<>'object' or payload-array['fullNameAr','fullNameEn','phone','emirate','cityArea','buildingName','buildingNumber','preferredLanguage','avatarPath','bankHolder','bankName','iban','bankCertificatePath','vatRegistered','trn']<>'{}'::jsonb then raise exception 'invalid_profile' using errcode='22023'; end if;
 if payload ? 'vatRegistered' and jsonb_typeof(payload->'vatRegistered')<>'boolean' then raise exception 'invalid_profile' using errcode='22023'; end if;
 for k,v in select key,value from jsonb_each_text(payload) loop
  if k='vatRegistered' then continue; end if;
  if jsonb_typeof(payload->k)<>'string' or char_length(v)>(case when k in ('avatarPath','bankCertificatePath') then 250 when k='cityArea' then 160 when k='phone' then 25 when k='buildingNumber' then 30 when k='trn' then 15 when k='iban' then 40 else 120 end) then raise exception 'invalid_profile' using errcode='22023'; end if;
 end loop;
 if coalesce(payload->>'fullNameAr','')<>'' and payload->>'fullNameAr' !~ '[ء-ي]' then raise exception 'invalid_profile' using errcode='22023'; end if;
 if coalesce(payload->>'fullNameEn','')<>'' and (payload->>'fullNameEn' !~ '[A-Za-z]' or payload->>'fullNameEn' ~ '[ء-ي]') then raise exception 'invalid_profile' using errcode='22023'; end if;
 if coalesce(payload->>'iban','')<>'' and not app_private.valid_ae_iban(payload->>'iban') then raise exception 'invalid_bank' using errcode='22023'; end if;
 vat:=coalesce((payload->>'vatRegistered')::boolean,false);clean_trn:=case when vat then coalesce(payload->>'trn','') else '' end;
 if clean_trn<>'' and clean_trn !~ '^[0-9]{15}$' then raise exception 'invalid_profile' using errcode='22023'; end if;
 foreach k in array array['avatarPath','bankCertificatePath'] loop
  path:=coalesce(payload->>k,'');
  if path<>'' then
   if path !~ ('^'||actor::text||case when k='avatarPath' then '/avatar/[a-f0-9-]{36}\.(png|jpg|webp)$' else '/bank/[a-f0-9-]{36}\.(png|jpg|pdf)$' end)
    or not exists(select 1 from storage.objects o where o.bucket_id='seller-profile-private' and o.name=path)
    then raise exception 'invalid_document' using errcode='22023'; end if;
  end if;
 end loop;
 select * into u from auth.users where id=actor;
 if complete_profile then
  foreach k in array array['fullNameAr','fullNameEn','phone','emirate','cityArea','buildingName','bankName','iban'] loop
   if char_length(trim(coalesce(payload->>k,'')))<(case when k in ('fullNameAr','fullNameEn') then 2 else 1 end) then raise exception 'invalid_profile' using errcode='22023'; end if;
  end loop;
  if vat and clean_trn !~ '^[0-9]{15}$' then raise exception 'invalid_profile' using errcode='22023'; end if;
  if u.email_confirmed_at is null then raise exception 'email_not_verified' using errcode='42501'; end if;
  if u.phone_confirmed_at is null or coalesce(u.phone,'')='' or payload->>'phone' is distinct from '+'||ltrim(u.phone,'+') then raise exception 'phone_not_verified' using errcode='42501'; end if;
 end if;
 perform pg_advisory_xact_lock(hashtextextended(actor::text,20261125));
 insert into public.seller_personal_details(user_id,full_name_ar,full_name_en,phone,emirate,city_area,building_name,building_number,preferred_language,avatar_path,vat_registered,trn,completed_at)
 values(actor,trim(coalesce(payload->>'fullNameAr','')),trim(coalesce(payload->>'fullNameEn','')),coalesce(payload->>'phone',''),coalesce(payload->>'emirate',''),trim(coalesce(payload->>'cityArea','')),trim(coalesce(payload->>'buildingName','')),trim(coalesce(payload->>'buildingNumber','')),coalesce(payload->>'preferredLanguage','ar'),coalesce(payload->>'avatarPath',''),vat,clean_trn,case when complete_profile then now() end)
 on conflict(user_id) do update set full_name_ar=excluded.full_name_ar,full_name_en=excluded.full_name_en,phone=excluded.phone,emirate=excluded.emirate,city_area=excluded.city_area,building_name=excluded.building_name,building_number=excluded.building_number,preferred_language=excluded.preferred_language,avatar_path=excluded.avatar_path,vat_registered=excluded.vat_registered,trn=excluded.trn,completed_at=excluded.completed_at,updated_at=now();
 insert into public.seller_bank_details(user_id,holder_name,bank_name,iban,certificate_path)
 values(actor,trim(coalesce(payload->>'bankHolder','')),trim(coalesce(payload->>'bankName','')),coalesce(payload->>'iban',''),coalesce(payload->>'bankCertificatePath',''))
 on conflict(user_id) do update set holder_name=excluded.holder_name,bank_name=excluded.bank_name,iban=excluded.iban,certificate_path=excluded.certificate_path,updated_at=now();
 return public.sanaa_seller_personal_get();
end $$;
revoke all on function public.sanaa_seller_personal_get(),public.sanaa_seller_personal_save(jsonb,boolean) from public,anon;
grant execute on function public.sanaa_seller_personal_get(),public.sanaa_seller_personal_save(jsonb,boolean) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('seller-profile-private','seller-profile-private',false,5242880,array['image/png','image/jpeg','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists seller_personal_files_read on storage.objects;
create policy seller_personal_files_read on storage.objects for select to authenticated using(bucket_id='seller-profile-private' and (storage.foldername(name))[1]=app_private.seller_personal_actor()::text);
drop policy if exists seller_personal_files_insert on storage.objects;
create policy seller_personal_files_insert on storage.objects for insert to authenticated with check(bucket_id='seller-profile-private' and (storage.foldername(name))[1]=app_private.seller_personal_actor()::text and name ~ ('^'||auth.uid()::text||'/(avatar|bank)/[a-f0-9-]{36}\.(png|jpg|webp|pdf)$'));
drop policy if exists seller_personal_files_delete on storage.objects;
create policy seller_personal_files_delete on storage.objects for delete to authenticated using(bucket_id='seller-profile-private' and (storage.foldername(name))[1]=app_private.seller_personal_actor()::text and not exists(select 1 from public.seller_personal_details p where p.user_id=auth.uid() and p.avatar_path=name) and not exists(select 1 from public.seller_bank_details b where b.user_id=auth.uid() and b.certificate_path=name));
-- No UPDATE policy: uploads use unique paths and cannot overwrite linked documents.
commit;
