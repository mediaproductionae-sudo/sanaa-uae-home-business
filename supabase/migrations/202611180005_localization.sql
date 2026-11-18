-- Interface preference and optional catalog translations. No financial/RLS policy changes to existing tables.
begin;
alter table public.stores add column original_language text not null default 'ar' check(original_language in ('ar','en'));
alter table public.products add column original_language text not null default 'ar' check(original_language in ('ar','en'));
create table public.store_translations(
 id uuid primary key default gen_random_uuid(),
 store_id uuid not null references public.stores(id) on delete cascade,
 language text not null check(language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
 name text not null default '' check(char_length(name)<=160), description text not null default '' check(char_length(description)<=4000),
 approved boolean not null default false, updated_at timestamptz not null default now(), unique(store_id,language)
);
create table public.product_translations(
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id) on delete cascade,
 language text not null check(language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
 name text not null default '' check(char_length(name)<=160), description text not null default '' check(char_length(description)<=4000),
 approved boolean not null default false, updated_at timestamptz not null default now(), unique(product_id,language)
);
alter table public.store_translations enable row level security;
alter table public.product_translations enable row level security;
revoke all on public.store_translations,public.product_translations from public,anon,authenticated;
grant select on public.store_translations,public.product_translations to anon,authenticated;
create policy store_translations_read on public.store_translations for select to anon,authenticated using((approved and app_private.public_store(store_id)) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy product_translations_read on public.product_translations for select to anon,authenticated using((approved and app_private.public_product(product_id)) or exists(select 1 from public.products p where p.id=product_id and app_private.owns_store(p.store_id)) or app_private.permitted('catalog.manage'));
create trigger audit_mutations after insert or update or delete on public.store_translations for each row execute function app_private.audit_change();
create trigger audit_mutations after insert or update or delete on public.product_translations for each row execute function app_private.audit_change();
create function app_private.save_translation(entity text,entity_uuid uuid,original text,second text,translated_name text,translated_description text,reviewed boolean) returns void language plpgsql security definer set search_path='' as $$
begin
 perform app_private.require_member();
 if original not in ('ar','en') or second not in ('ar','en') or original=second or char_length(translated_name)>160 or char_length(translated_description)>4000 then raise exception 'invalid_translation' using errcode='22023';end if;
 if entity='store' then
  if not app_private.owns_store(entity_uuid) then raise exception 'not_owner' using errcode='42501';end if;
  update public.stores set original_language=original where id=entity_uuid;
  insert into public.store_translations(store_id,language,name,description,approved) values(entity_uuid,second,trim(translated_name),trim(translated_description),reviewed)
  on conflict(store_id,language) do update set name=excluded.name,description=excluded.description,approved=excluded.approved,updated_at=now();
 elsif entity='product' then
  if not exists(select 1 from public.products where id=entity_uuid and app_private.owns_store(store_id)) then raise exception 'not_owner' using errcode='42501';end if;
  update public.products set original_language=original where id=entity_uuid;
  insert into public.product_translations(product_id,language,name,description,approved) values(entity_uuid,second,trim(translated_name),trim(translated_description),reviewed)
  on conflict(product_id,language) do update set name=excluded.name,description=excluded.description,approved=excluded.approved,updated_at=now();
 else raise exception 'invalid_entity' using errcode='22023';end if;
end $$;
create function public.sanaa_save_store_localized(store_uuid uuid,name_ar text,description text,category_uuid uuid,emirate public.emirate_code,area_code text,hours jsonb,translation_name text default '',translation_description text default '',translation_approved boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;begin
 result:=public.sanaa_save_store(store_uuid,name_ar,description,category_uuid,emirate,area_code,hours);
 perform app_private.save_translation('store',result,'ar','en',translation_name,translation_description,translation_approved);return result;
end $$;
create function public.sanaa_save_product_localized(product_uuid uuid,store_uuid uuid,category_uuid uuid,sku text,name_ar text,description text,kind text,price_minor bigint,stock integer,publication public.product_status,original_language text default 'ar',translation_name text default '',translation_description text default '',translation_approved boolean default false) returns uuid language plpgsql security definer set search_path='' as $$
declare result uuid;begin
 result:=public.sanaa_save_product(product_uuid,store_uuid,category_uuid,sku,name_ar,description,kind,price_minor,stock,publication);
 perform app_private.save_translation('product',result,original_language,case when original_language='ar' then 'en' else 'ar' end,translation_name,translation_description,translation_approved);return result;
end $$;
revoke all on function app_private.save_translation(text,uuid,text,text,text,text,boolean) from public,anon,authenticated,service_role;
revoke all on function public.sanaa_save_store_localized(uuid,text,text,uuid,public.emirate_code,text,jsonb,text,text,boolean),public.sanaa_save_product_localized(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status,text,text,text,boolean) from public,anon;
grant execute on function public.sanaa_save_store_localized(uuid,text,text,uuid,public.emirate_code,text,jsonb,text,text,boolean),public.sanaa_save_product_localized(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status,text,text,text,boolean) to authenticated;
create index store_translations_search on public.store_translations using gin(to_tsvector('simple',name||' '||description));
create index product_translations_search on public.product_translations using gin(to_tsvector('simple',name||' '||description));
create function public.sanaa_search_catalog_ids(search_text text,after_uuid uuid default null,category_uuid uuid default null,store_uuid uuid default null,emirate_filter public.emirate_code default null) returns setof uuid language sql stable security invoker set search_path='' as $$
 select p.id from public.products p join public.stores s on s.id=p.store_id
 where app_private.public_product(p.id) and (after_uuid is null or p.id>after_uuid) and (category_uuid is null or p.category_id=category_uuid) and (store_uuid is null or p.store_id=store_uuid) and (emirate_filter is null or s.emirate=emirate_filter) and char_length(search_text) between 1 and 80 and (
 strpos(lower(p.name_ar||' '||p.description||' '||s.name_ar||' '||s.description),lower(search_text))>0
 or exists(select 1 from public.product_translations t where t.product_id=p.id and t.approved and strpos(lower(t.name||' '||t.description),lower(search_text))>0)
 or exists(select 1 from public.store_translations t where t.store_id=s.id and t.approved and strpos(lower(t.name||' '||t.description),lower(search_text))>0)) order by p.id limit 25
$$;
revoke all on function public.sanaa_search_catalog_ids(text,uuid,uuid,uuid,public.emirate_code) from public;
grant execute on function public.sanaa_search_catalog_ids(text,uuid,uuid,uuid,public.emirate_code) to anon,authenticated;
commit;
