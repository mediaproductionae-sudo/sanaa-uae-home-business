-- REVIEW ONLY. Compare the managed schema, then create a new Lovable migration.
-- Reuses customer_addresses; does not change historical orders, RLS or delivery routing.
begin;
alter table public.customer_addresses add column if not exists region_name text not null default '' check(char_length(region_name)<=160);
alter table public.customer_addresses add column if not exists street_name text not null default '' check(char_length(street_name)<=160);
alter table public.customer_addresses add column if not exists home_number text not null default '' check(char_length(home_number)<=80);
alter table public.customer_addresses add column if not exists building_number text not null default '' check(char_length(building_number)<=40);
create table if not exists app_private.customer_account_address (
 user_id uuid primary key references public.profiles(id),address_id uuid not null unique,
 foreign key(address_id,user_id) references public.customer_addresses(id,customer_id)
);
revoke all on app_private.customer_account_address from public,anon,authenticated,service_role;
create or replace function app_private.customer_account_actor() returns uuid
language sql stable security definer set search_path='' as $$
 select p.id from public.profiles p where p.id=auth.uid() and p.active
 and exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='customer')
$$;
revoke all on function app_private.customer_account_actor() from public,anon,authenticated;
create or replace function public.sanaa_customer_profile_get() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.customer_account_actor();a public.customer_addresses;u auth.users;name text; begin
 if actor is null then raise exception 'customer_required' using errcode='42501';end if;
 select * into u from auth.users where id=actor;select display_name into name from public.profiles where id=actor;
 select * into a from public.customer_addresses x where x.customer_id=actor and x.archived_at is null
 order by exists(select 1 from app_private.customer_account_address m where m.user_id=actor and m.address_id=x.id) desc,x.created_at,x.id limit 1;
 return jsonb_build_object('draft',jsonb_build_object('displayName',name,'phone',case when coalesce(u.phone,'')='' then '' else '+'||ltrim(u.phone,'+') end,
 'emirate',coalesce(a.emirate::text,''),'region',coalesce(a.region_name,''),'street',coalesce(a.street_name,''),'home',coalesce(a.home_number,''),'buildingNumber',coalesce(a.building_number,'')),
 'email',coalesce(u.email,''),'emailConfirmed',u.email_confirmed_at is not null,'authPhone',case when coalesce(u.phone,'')='' then '' else '+'||ltrim(u.phone,'+') end,
 'phoneConfirmed',u.phone_confirmed_at is not null,'legacyAddress',case when coalesce(a.home_number,'')='' then coalesce(a.address_lines,'') else '' end);
end $$;
create or replace function public.sanaa_customer_profile_save(payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.customer_account_actor();a public.customer_addresses;u auth.users;k text;v text;name text;lines text; begin
 if actor is null then raise exception 'customer_required' using errcode='42501';end if;
 if payload is null or jsonb_typeof(payload)<>'object' or payload-array['displayName','phone','emirate','region','street','home','buildingNumber']<>'{}'::jsonb then raise exception 'invalid_customer_profile' using errcode='22023';end if;
 foreach k in array array['displayName','phone','emirate','region','street','home','buildingNumber'] loop
  if jsonb_typeof(payload->k) is distinct from 'string' then raise exception 'invalid_customer_profile' using errcode='22023';end if;
  v:=trim(payload->>k);
  if char_length(v)>(case when k in ('region','street') then 160 when k in ('displayName','home') then 80 when k='buildingNumber' then 40 else 25 end) then raise exception 'invalid_customer_profile' using errcode='22023';end if;
  if k in ('region','home') and char_length(v)=0 then raise exception 'invalid_customer_profile' using errcode='22023';end if;
 end loop;
 name:=trim(payload->>'displayName');
 if char_length(name)<2 or payload->>'phone' !~ '^\+[1-9][0-9]{7,14}$' or payload->>'emirate' not in ('abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah') then raise exception 'invalid_customer_profile' using errcode='22023';end if;
 -- Serialize saves per customer, including the first address, without trusting a client address id.
 perform 1 from public.profiles p where p.id=actor for update;
 if app_private.customer_account_actor() is null then raise exception 'customer_required' using errcode='42501';end if;
 select * into u from auth.users where id=actor for share;
 if u.email_confirmed_at is null then raise exception 'email_not_verified' using errcode='42501';end if;
 if u.phone_confirmed_at is null or coalesce(u.phone,'')='' or payload->>'phone' is distinct from '+'||ltrim(u.phone,'+') then raise exception 'phone_not_verified' using errcode='42501';end if;
 select * into a from public.customer_addresses x where x.customer_id=actor and x.archived_at is null
 order by exists(select 1 from app_private.customer_account_address m where m.user_id=actor and m.address_id=x.id) desc,x.created_at,x.id limit 1 for update;
 lines:=concat_ws('، ',trim(payload->>'home'),nullif(trim(payload->>'buildingNumber'),''),nullif(trim(payload->>'street'),''));
 if a.id is null then
  insert into public.customer_addresses(customer_id,label,emirate,area_code,address_lines,recipient_name,phone,region_name,street_name,home_number,building_number)
  values(actor,'عنوان الحساب',(payload->>'emirate')::public.emirate_code,'',lines,name,payload->>'phone',trim(payload->>'region'),trim(payload->>'street'),trim(payload->>'home'),trim(payload->>'buildingNumber')) returning * into a;
 else
  update public.customer_addresses set emirate=(payload->>'emirate')::public.emirate_code,address_lines=lines,phone=payload->>'phone',
   region_name=trim(payload->>'region'),street_name=trim(payload->>'street'),home_number=trim(payload->>'home'),building_number=trim(payload->>'buildingNumber')
   where id=a.id and customer_id=actor;
 end if;
 insert into app_private.customer_account_address(user_id,address_id)values(actor,a.id)on conflict(user_id)do update set address_id=excluded.address_id;
 perform set_config('app.audit_reason','customer updated their account contact and address',true);
 update public.profiles set display_name=name,updated_at=now() where id=actor;
 return public.sanaa_customer_profile_get();
end $$;
revoke all on function public.sanaa_customer_profile_get(),public.sanaa_customer_profile_save(jsonb) from public,anon;
grant execute on function public.sanaa_customer_profile_get(),public.sanaa_customer_profile_save(jsonb) to authenticated;
-- Existing address RLS and column grants are preserved. Do not grant broad profile access.
-- region_name is human-readable, not a verified delivery area_code. Existing area codes are retained;
-- a new address needs routing-zone mapping before operational shipping is enabled elsewhere.
commit;
