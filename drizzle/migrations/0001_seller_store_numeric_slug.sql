CREATE OR REPLACE FUNCTION public.sanaa_save_store(store_uuid uuid, name_ar text, description text, category_uuid uuid, emirate public.emirate_code, area_code text, hours jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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
  values(result,seller,category_uuid,'store-'||(floor(extract(epoch from clock_timestamp())*1000))::bigint::text,trim(name_ar),description,emirate,trim(area_code),hours,'active','submitted');
 else
  if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501'; end if;
  update public.stores set name_ar=trim(sanaa_save_store.name_ar),description=sanaa_save_store.description,category_id=category_uuid,
  emirate=sanaa_save_store.emirate,area_code=trim(sanaa_save_store.area_code),hours=sanaa_save_store.hours,updated_at=now() where id=store_uuid;
 end if;return result;
end $function$;