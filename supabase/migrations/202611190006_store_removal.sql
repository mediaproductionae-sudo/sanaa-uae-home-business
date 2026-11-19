-- Store removal is archival where order/complaint/financial references exist.
-- No financial or existing RLS policies are altered.
begin;
create or replace function public.sanaa_save_store(store_uuid uuid,name_ar text,description text,category_uuid uuid,emirate public.emirate_code,area_code text,hours jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member(); seller uuid; result uuid:=coalesce(store_uuid,gen_random_uuid()); begin
 perform app_private.take_slot('store',30);select id into seller from public.seller_profiles where user_id=actor;
 if seller is null or not app_private.has_role('seller') then raise exception 'seller_required' using errcode='42501'; end if;
 if char_length(trim(name_ar)) not between 2 and 120 or char_length(description)>2000 or char_length(trim(area_code)) not between 2 and 80 or jsonb_typeof(hours)<>'object' or length(hours::text)>2000
 or not exists(select 1 from public.categories where id=category_uuid and active) then raise exception 'invalid_store' using errcode='22023'; end if;
 perform set_config('app.audit_reason','seller changed store presentation',true);
 if store_uuid is null then
  perform pg_advisory_xact_lock(hashtextextended(seller::text,5));
  if (select count(*) from public.stores where seller_id=seller and status<>'archived')>=5 then raise exception 'store_limit' using errcode='22023'; end if;
  insert into public.stores(id,seller_id,category_id,slug,name_ar,description,emirate,area_code,hours,status,onboarding_status)
  values(result,seller,category_uuid,'store-'||result::text,trim(name_ar),description,emirate,trim(area_code),hours,'pending','submitted');
 else
  if not app_private.owns_store(store_uuid) or exists(select 1 from public.stores where id=store_uuid and status='archived') then raise exception 'not_owner' using errcode='42501'; end if;
  update public.stores set name_ar=trim(sanaa_save_store.name_ar),description=sanaa_save_store.description,category_id=category_uuid,
  emirate=sanaa_save_store.emirate,area_code=trim(sanaa_save_store.area_code),hours=sanaa_save_store.hours,updated_at=now() where id=store_uuid;
 end if;return result;
end $$;
create or replace function public.sanaa_save_product(product_uuid uuid,store_uuid uuid,category_uuid uuid,sku text,name_ar text,description text,kind text,price_minor bigint,stock integer,publication public.product_status) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();result uuid:=coalesce(product_uuid,gen_random_uuid());old_quantity integer;begin
 perform app_private.take_slot('product',40);
 if not app_private.owns_store(store_uuid) or exists(select 1 from public.stores where id=store_uuid and status='archived') then raise exception 'not_owner' using errcode='42501'; end if;
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

create function public.sanaa_archive_store(store_uuid uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();begin
 perform app_private.take_slot('store_archive',10);
 if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501';end if;
 perform 1 from public.stores where id=store_uuid for update;
 if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501';end if;
 perform set_config('app.audit_reason','store removed by its owner; historical orders and complaints retained',true);
 update public.products set status='archived',updated_at=now() where store_id=store_uuid and status<>'archived';
 update public.stores set status='archived',updated_at=now() where id=store_uuid and status<>'archived';
end $$;
revoke all on function public.sanaa_archive_store(uuid) from public,anon;
grant execute on function public.sanaa_archive_store(uuid) to authenticated;
commit;
