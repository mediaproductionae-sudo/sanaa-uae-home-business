-- 4B: staging only. No checkout, payment, commission or delivery operations.
begin;
alter table public.stores add column logo_path text check(logo_path is null or split_part(logo_path,'/',1)=id::text);
alter table public.stores add column cover_path text check(cover_path is null or split_part(cover_path,'/',1)=id::text);
create table app_private.runtime_environment(singleton boolean primary key default true check(singleton),environment text not null default 'unconfigured' check(environment in ('unconfigured','staging')),project_ref text);
insert into app_private.runtime_environment(singleton) values(true);
create table app_private.rate_buckets(actor_id uuid not null,scope text not null,window_at timestamptz not null,hits integer not null,primary key(actor_id,scope));
revoke all on all tables in schema app_private from public,anon,authenticated,service_role;
create function app_private.require_member() returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); begin
 if not exists(select 1 from app_private.runtime_environment where singleton and environment='staging' and project_ref is not null) then raise exception 'staging_not_marked' using errcode='42501';end if;
 if actor is null or not app_private.active_user() or not exists(select 1 from auth.users where id=actor and email_confirmed_at is not null)
 then raise exception 'confirmed_identity_required' using errcode='42501'; end if;return actor;
end $$;
create function app_private.take_slot(p_scope text,maximum integer) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member(); n integer; begin
 insert into app_private.rate_buckets(actor_id,scope,window_at,hits) values(actor,p_scope,date_trunc('minute',now()),1)
 on conflict(actor_id,scope) do update set window_at=excluded.window_at,hits=case when app_private.rate_buckets.window_at=excluded.window_at then app_private.rate_buckets.hits+1 else 1 end returning hits into n;
 if n>maximum then raise exception 'rate_limited' using errcode='P0001'; end if;
end $$;
create or replace function app_private.provision_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare alias text:=trim(coalesce(new.raw_user_meta_data->>'display_name','مستخدم جديد')); begin
 if char_length(alias)<2 or char_length(alias)>80 then alias:='مستخدم جديد'; end if;
 insert into public.profiles(id,display_name) values(new.id,alias);
 insert into public.user_roles(user_id,role) values(new.id,'customer');
 -- Requested account type is intent only. No role comes from mutable metadata.
 return new;
end $$;
create function public.sanaa_enroll_seller(business_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member(); result uuid; begin
 perform app_private.take_slot('enroll',10);perform pg_advisory_xact_lock(hashtextextended(actor::text,4));
 if char_length(trim(business_name)) not between 2 and 120 then raise exception 'invalid_business_name' using errcode='22023'; end if;
 perform set_config('app.audit_reason','confirmed user opted into seller account',true);
 insert into public.user_roles(user_id,role) values(actor,'seller') on conflict(user_id,role) do nothing;
 insert into public.seller_profiles(user_id,business_name) values(actor,trim(business_name)) on conflict(user_id) do nothing;
 select id into result from public.seller_profiles where user_id=actor; return result;
end $$;
create function public.sanaa_profile_save(display_name text) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();begin
 perform app_private.take_slot('profile',30);
 if char_length(trim(display_name)) not between 2 and 80 then raise exception 'invalid_name' using errcode='22023'; end if;
 perform set_config('app.audit_reason','profile display name changed by owner',true);
 update public.profiles set display_name=trim(sanaa_profile_save.display_name),updated_at=now() where id=actor;
end $$;
create function public.sanaa_save_store(store_uuid uuid,name_ar text,description text,category_uuid uuid,emirate public.emirate_code,area_code text,hours jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member(); seller uuid; result uuid:=coalesce(store_uuid,gen_random_uuid()); begin
 perform app_private.take_slot('store',30);select id into seller from public.seller_profiles where user_id=actor;
 if seller is null or not app_private.has_role('seller') then raise exception 'seller_required' using errcode='42501'; end if;
 if char_length(trim(name_ar)) not between 2 and 120 or char_length(description)>2000 or char_length(trim(area_code)) not between 2 and 80 or jsonb_typeof(hours)<>'object' or length(hours::text)>2000
 or not exists(select 1 from public.categories where id=category_uuid and active) then raise exception 'invalid_store' using errcode='22023'; end if;
 perform set_config('app.audit_reason','seller changed store presentation',true);
 if store_uuid is null then
  perform pg_advisory_xact_lock(hashtextextended(seller::text,5));
  if (select count(*) from public.stores where seller_id=seller)>=5 then raise exception 'store_limit' using errcode='22023'; end if;
  insert into public.stores(id,seller_id,category_id,slug,name_ar,description,emirate,area_code,hours,status,onboarding_status)
  values(result,seller,category_uuid,'store-'||result::text,trim(name_ar),description,emirate,trim(area_code),hours,'pending','submitted');
 else
  if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501'; end if;
  update public.stores set name_ar=trim(sanaa_save_store.name_ar),description=sanaa_save_store.description,category_id=category_uuid,
  emirate=sanaa_save_store.emirate,area_code=trim(sanaa_save_store.area_code),hours=sanaa_save_store.hours,updated_at=now() where id=store_uuid;
 end if;return result;
end $$;
create function public.sanaa_save_product(product_uuid uuid,store_uuid uuid,category_uuid uuid,sku text,name_ar text,description text,kind text,price_minor bigint,stock integer,publication public.product_status) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();result uuid:=coalesce(product_uuid,gen_random_uuid());old_quantity integer;begin
 perform app_private.take_slot('product',40);
 if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501'; end if;
 if char_length(trim(name_ar)) not between 2 and 160 or char_length(description)>4000 or char_length(trim(sku)) not between 1 and 80 or kind not in ('product','service') or price_minor<0 or price_minor>9000000000000 or stock<0 or stock>1000000 or not exists(select 1 from public.categories where id=category_uuid and active)
 then raise exception 'invalid_product' using errcode='22023'; end if;
 perform set_config('app.audit_reason','seller changed catalog data; no financial history altered',true);
 if product_uuid is null then
  insert into public.products(id,store_id,category_id,sku,name_ar,description,kind,price_minor,inventory_quantity,status)
  values(result,store_uuid,category_uuid,trim(sku),trim(name_ar),description,kind,price_minor,stock,publication);old_quantity:=0;
 else
  select inventory_quantity into old_quantity from public.products where id=product_uuid and store_id=store_uuid for update;
  if not found then raise exception 'not_owner' using errcode='42501'; end if;
  update public.products set category_id=category_uuid,sku=trim(sanaa_save_product.sku),name_ar=trim(sanaa_save_product.name_ar),description=sanaa_save_product.description,
  kind=sanaa_save_product.kind,price_minor=sanaa_save_product.price_minor,inventory_quantity=stock,status=publication,updated_at=now() where id=product_uuid;
 end if;
 if old_quantity<>stock then insert into public.inventory_movements(product_id,quantity_delta,reason,idempotency_key,actor_id) values(result,stock-old_quantity,'seller catalog stock adjustment',gen_random_uuid()::text,actor); end if;
 return result;
end $$;
create function public.sanaa_archive_product(product_uuid uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.require_member();perform app_private.take_slot('product',40);
 if not exists(select 1 from public.products p where p.id=product_uuid and app_private.owns_store(p.store_id)) then raise exception 'not_owner' using errcode='42501'; end if;
 perform set_config('app.audit_reason','seller archived product, preserving references',true);
 update public.products set status='archived',updated_at=now() where id=product_uuid;
end $$;
create function public.sanaa_upload_slot(store_uuid uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.require_member();
 if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501';end if;
 perform app_private.take_slot('upload_preflight',12);
end $$;
create function public.sanaa_register_media(store_uuid uuid,product_uuid uuid,object_path text,purpose text,document_type text) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();result uuid;begin
 perform app_private.take_slot('media',20);
 if not app_private.owns_store(store_uuid) or split_part(object_path,'/',1)<>store_uuid::text or length(object_path)>250 or object_path~'\.\.' then raise exception 'invalid_owner_or_path' using errcode='42501'; end if;
 if purpose='product' then
  if not exists(select 1 from public.products where id=product_uuid and store_id=store_uuid) then raise exception 'not_owner' using errcode='42501'; end if;
  insert into public.product_images(product_id,store_id,object_path) values(product_uuid,store_uuid,object_path) returning id into result;
 elsif purpose='document' then
  if char_length(document_type) not between 2 and 80 then raise exception 'invalid_document' using errcode='22023'; end if;
  insert into public.store_documents(store_id,uploaded_by,object_path,document_type,status) values(store_uuid,actor,object_path,document_type,'draft') returning id into result;
 elsif purpose in ('logo','cover') then
  perform set_config('app.audit_reason','seller changed store media',true);
  if purpose='logo' then update public.stores set logo_path=object_path,updated_at=now() where id=store_uuid;
  else update public.stores set cover_path=object_path,updated_at=now() where id=store_uuid;end if;result:=store_uuid;
 else raise exception 'invalid_purpose' using errcode='22023';end if;return result;
end $$;
create function public.sanaa_review_store(store_uuid uuid,decision public.store_status,reason text) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();previous public.store_status;begin
 perform app_private.take_slot('moderation',30);
 if not app_private.permitted('stores.manage') then raise exception 'permission_required' using errcode='42501'; end if;
 if decision not in ('active','suspended','rejected') or char_length(trim(reason)) not between 3 and 1000 then raise exception 'invalid_decision' using errcode='22023'; end if;
 select status into previous from public.stores where id=store_uuid for update;if not found then raise exception 'not_found' using errcode='22023';end if;
 perform set_config('app.audit_reason',reason,true);update public.stores set status=decision,updated_at=now() where id=store_uuid;
 insert into public.moderation_actions(store_id,actor_id,decision,reason,previous_value,next_value) values(store_uuid,actor,decision::text,reason,to_jsonb(previous),to_jsonb(decision));
 -- This action deliberately does not approve a government license.
end $$;
-- Bootstrap is operator SQL only, not an HTTP/RPC endpoint.
create function app_private.bootstrap_first_admin(target uuid,reason text) returns void language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(741004);
 if not exists(select 1 from app_private.runtime_environment where singleton and environment='staging' and project_ref is not null) then raise exception 'staging_not_marked';end if;
 if exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id where r.role='admin' and p.active) then raise exception 'admin_already_exists';end if;
 if char_length(trim(reason))<10 or not exists(select 1 from auth.users a join public.profiles p on p.id=a.id where a.id=target and a.email_confirmed_at is not null and p.active) then raise exception 'confirmed_user_and_reason_required';end if;
 perform set_config('app.audit_reason',reason,true);
 insert into public.user_roles(user_id,role) values(target,'admin');
 insert into public.admin_permissions(user_id,permission) select target,unnest(array['users.read','users.manage','stores.read','stores.manage','licenses.review','catalog.manage','orders.read','complaints.manage','delivery.manage','finance.read','finance.manage','audit.read']);
end $$;
-- Protected writes use whitelisted RPCs, never broad direct column grants.
revoke update on public.profiles,public.products,public.stores from authenticated;
revoke update(display_name) on public.profiles from authenticated;
revoke update(name_ar,description) on public.products from authenticated;
revoke update(name_ar,description,hours,contact) on public.stores from authenticated;
revoke insert on public.store_documents from authenticated;
revoke insert(store_id,uploaded_by,object_path,document_type,issued_at,expires_at) on public.store_documents from authenticated;
-- All uploads now pass the verified server gateway; no direct raw Storage write.
drop policy catalog_media_upload on storage.objects;
drop policy store_documents_upload on storage.objects;
drop policy catalog_media_read on storage.objects;
create policy catalog_media_read on storage.objects for select to anon,authenticated using(bucket_id='catalog-media' and
 (app_private.owns_store(app_private.path_store(name)) or app_private.permitted('catalog.manage') or exists(select 1 from public.product_images i where i.object_path=name and app_private.public_product(i.product_id)) or exists(select 1 from public.stores s where (s.logo_path=name or s.cover_path=name) and app_private.public_store(s.id))));
revoke all on all functions in schema app_private from public;
revoke all on function app_private.bootstrap_first_admin(uuid,text),app_private.require_member(),app_private.take_slot(text,integer) from anon,authenticated,service_role;
revoke all on function public.sanaa_upload_slot(uuid) from public,anon;
grant execute on function public.sanaa_upload_slot(uuid) to authenticated;
revoke all on function public.sanaa_enroll_seller(text),public.sanaa_profile_save(text),public.sanaa_save_store(uuid,text,text,uuid,public.emirate_code,text,jsonb),public.sanaa_save_product(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status),public.sanaa_archive_product(uuid),public.sanaa_register_media(uuid,uuid,text,text,text),public.sanaa_review_store(uuid,public.store_status,text) from public,anon;
grant execute on function public.sanaa_enroll_seller(text),public.sanaa_profile_save(text),public.sanaa_save_store(uuid,text,text,uuid,public.emirate_code,text,jsonb),public.sanaa_save_product(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status),public.sanaa_archive_product(uuid),public.sanaa_register_media(uuid,uuid,text,text,text),public.sanaa_review_store(uuid,public.store_status,text) to authenticated;
commit;
