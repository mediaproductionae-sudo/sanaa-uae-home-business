begin;
-- Cross-aggregate foreign keys prevent attaching another store/order's evidence.
alter table public.order_items add unique(id,order_id);
alter table public.refund_items add foreign key(order_item_id,order_id) references public.order_items(id,order_id);
alter table public.shipment_tracking_events add unique(id,shipment_id);
alter table public.shipments drop constraint shipments_evidence_fk;
alter table public.shipments add foreign key(delivery_evidence_id,id) references public.shipment_tracking_events(id,shipment_id) deferrable initially deferred;

create function app_private.reject_mutation() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'append_only: create a documented compensating entry' using errcode='23514'; end $$;
do $$ declare tbl text; begin
 foreach tbl in array array['financial_ledger_entries','commission_entries','commission_status_history','audit_logs','payment_events','payment_transactions','inventory_movements','order_items','order_status_history','shipment_tracking_events','settlement_items','settlement_events','moderation_actions','complaint_actions'] loop
 execute format('create trigger immutable_records before update or delete on public.%I for each row execute function app_private.reject_mutation()',tbl);
 end loop;
end $$;
create function app_private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.audit_logs(actor_id,action,entity_table,entity_id,previous_value,next_value,reason,source)
 values(auth.uid(),tg_op,tg_table_name,coalesce(new.id,old.id),case when tg_op<>'INSERT' then to_jsonb(old) end,
 case when tg_op<>'DELETE' then to_jsonb(new) end,nullif(current_setting('app.audit_reason',true),''),'database_trigger');
 return coalesce(new,old);
end $$;
do $$ declare tbl text; begin
 foreach tbl in array array['user_roles','admin_permissions','profiles','stores','store_documents','products','delivery_companies','delivery_contracts','delivery_rate_cards','seller_commission_rules','delivery_commission_rules','seller_settlements','delivery_settlements','complaints','delivery_assignments'] loop
 execute format('create trigger audit_mutations after insert or update or delete on public.%I for each row execute function app_private.audit_change()',tbl);
 end loop;
end $$;
-- An empty active-admin set is allowed during bootstrap only; the last active one
-- cannot be removed through ordinary writes once provisioned by an operator.
create function app_private.protect_last_admin() returns trigger language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 perform pg_advisory_xact_lock(741004);
 if tg_table_name='user_roles' then
  target=old.user_id;
  if old.role<>'admin' or (tg_op='UPDATE' and new.role='admin' and new.user_id=old.user_id) then return coalesce(new,old); end if;
 else
  target=old.id;
  if not old.active or new.active then return new; end if;
 end if;
 if exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id where r.user_id=target and r.role='admin' and p.active)
 and not exists(select 1 from public.user_roles r join public.profiles p on p.id=r.user_id where r.role='admin' and p.active and p.id<>target)
 then raise exception 'last_active_admin' using errcode='23514'; end if;
 return coalesce(new,old);
end $$;
create trigger guard_admin_role before update or delete on public.user_roles for each row execute function app_private.protect_last_admin();
create trigger guard_admin_active before update of active on public.profiles for each row execute function app_private.protect_last_admin();

create function app_private.check_balanced_batch() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.financial_ledger_entries where batch_id=new.batch_id group by currency having sum(debit_minor)<>sum(credit_minor))
 then raise exception 'ledger_batch_unbalanced' using errcode='23514'; end if;
 return new;
end $$;
create constraint trigger ledger_balanced after insert on public.financial_ledger_entries deferrable initially deferred for each row execute function app_private.check_balanced_batch();
create function app_private.check_settlement_item() returns trigger language plpgsql security definer set search_path='' as $$
declare l public.financial_ledger_entries; curr text; beneficiary uuid; is_seller boolean; spent bigint; header_amount bigint;
begin
 select * into strict l from public.financial_ledger_entries where id=new.ledger_entry_id for update;
 is_seller:=new.seller_settlement_id is not null;
 if is_seller then
 select seller_id,currency,amount_minor into beneficiary,curr,header_amount from public.seller_settlements where id=new.seller_settlement_id for update;
 else
 select company_id,currency,amount_minor into beneficiary,curr,header_amount from public.delivery_settlements where id=new.delivery_settlement_id for update;
 end if;
 if curr<>l.currency or (is_seller and beneficiary is distinct from l.seller_id) or (not is_seller and beneficiary is distinct from l.company_id) or l.reverses_entry_id is not null or l.credit_minor=0
 then raise exception 'invalid_settlement_beneficiary_currency_or_credit' using errcode='23514'; end if;
 select coalesce(sum(amount_minor),0) into spent from public.settlement_items where ledger_entry_id=l.id;
 if spent+new.amount_minor>l.credit_minor then raise exception 'settlement_exceeds_available_credit' using errcode='23514'; end if;
 select coalesce(sum(amount_minor),0) into spent from public.settlement_items where
 (is_seller and seller_settlement_id=new.seller_settlement_id) or (not is_seller and delivery_settlement_id=new.delivery_settlement_id);
 if spent+new.amount_minor>header_amount then raise exception 'settlement_items_exceed_header' using errcode='23514'; end if;
 return new;
end $$;
create trigger settlement_capacity before insert on public.settlement_items for each row execute function app_private.check_settlement_item();
-- No state transition constitutes payment or proof of delivery by itself.
-- Operational state machines, reversals, holds and refund eligibility remain
-- closed to API writes until transactional services are implemented in 4C-4F.
create function app_private.protect_financial_snapshots() returns trigger language plpgsql set search_path='' as $$
begin
 if tg_table_name in ('orders','seller_orders') and (to_jsonb(new)-array['status','updated_at']) is distinct from (to_jsonb(old)-array['status','updated_at'])
 then raise exception 'order_snapshot_immutable' using errcode='23514'; end if;
 if tg_table_name='payment_intents' and (to_jsonb(new)-array['status','provider_intent_id']) is distinct from (to_jsonb(old)-array['status','provider_intent_id'])
 then raise exception 'payment_intent_snapshot_immutable' using errcode='23514'; end if;
 if tg_table_name in ('seller_settlements','delivery_settlements') and (to_jsonb(new)-'status') is distinct from (to_jsonb(old)-'status')
 then raise exception 'settlement_snapshot_immutable' using errcode='23514'; end if;
 return new;
end $$;
create trigger preserve_order_price before update on public.orders for each row execute function app_private.protect_financial_snapshots();
create trigger preserve_seller_order before update on public.seller_orders for each row execute function app_private.protect_financial_snapshots();
create trigger preserve_intent_amount before update on public.payment_intents for each row execute function app_private.protect_financial_snapshots();
create trigger preserve_seller_settlement before update on public.seller_settlements for each row execute function app_private.protect_financial_snapshots();
create trigger preserve_delivery_settlement before update on public.delivery_settlements for each row execute function app_private.protect_financial_snapshots();

-- Supabase Storage tables are provided by Storage, not recreated by migrations.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('catalog-media','catalog-media',false,5242880,array['image/png','image/jpeg','image/webp']),
 ('store-documents','store-documents',false,10485760,array['application/pdf','image/png','image/jpeg'])
on conflict(id) do nothing;
create function app_private.path_store(path text) returns uuid language plpgsql immutable set search_path='' as $$
begin return split_part(path,'/',1)::uuid; exception when invalid_text_representation then return null; end $$;
revoke all on function app_private.path_store(text) from public;
grant execute on function app_private.path_store(text) to anon,authenticated;
create policy catalog_media_read on storage.objects for select to anon,authenticated using(bucket_id='catalog-media' and
 (app_private.owns_store(app_private.path_store(name)) or app_private.permitted('catalog.manage') or exists(select 1 from public.product_images i where i.object_path=name and app_private.public_product(i.product_id))));
create policy catalog_media_upload on storage.objects for insert to authenticated with check(bucket_id='catalog-media' and app_private.owns_store(app_private.path_store(name)));
-- No overwrite/delete: new immutable path per upload; garbage collection by server.
create policy store_documents_read on storage.objects for select to authenticated using(bucket_id='store-documents' and
 (app_private.owns_store(app_private.path_store(name)) or app_private.permitted('licenses.review')));
create policy store_documents_upload on storage.objects for insert to authenticated with check(bucket_id='store-documents' and app_private.owns_store(app_private.path_store(name)));
-- Trigger functions also have no public EXECUTE privilege.
revoke all on all functions in schema app_private from public;
commit;
