begin;
-- Fixed empty search_path; identity comes only from the verified JWT auth.uid().
create function app_private.active_user() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and active)
$$;
create function app_private.has_role(wanted public.app_role) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.active_user() and exists(select 1 from public.user_roles where user_id=auth.uid() and role=wanted)
$$;
create function app_private.permitted(wanted text) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.active_user() and (
 (app_private.has_role('admin') and exists(select 1 from public.admin_permissions where user_id=auth.uid() and permission=wanted))
 or (app_private.has_role('license_reviewer') and wanted in ('licenses.review','stores.read'))
 or (app_private.has_role('complaints_officer') and wanted in ('complaints.manage','stores.read')))
$$;
create function app_private.owns_seller(seller uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.has_role('seller') and exists(select 1 from public.seller_profiles where id=seller and user_id=auth.uid())
$$;
create function app_private.owns_store(store uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.stores where id=store and app_private.owns_seller(seller_id))
$$;
create function app_private.public_store(store uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.stores s join public.seller_profiles sp on sp.id=s.seller_id join public.profiles p on p.id=sp.user_id
 where s.id=store and s.status='active' and p.active and exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='seller'))
$$;
create function app_private.public_product(product uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.products p join public.categories c on c.id=p.category_id
 where p.id=product and p.status='published' and not p.moderation_hidden and c.active and app_private.public_store(p.store_id))
$$;
create function app_private.owns_order(ord uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.active_user() and exists(select 1 from public.orders where id=ord and customer_id=auth.uid())
$$;
create function app_private.read_seller_order(ord uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.seller_orders where id=ord and (app_private.owns_store(store_id) or app_private.owns_order(order_id))) or app_private.permitted('orders.read')
$$;
create function app_private.operates_company(company uuid) returns boolean language sql stable security definer set search_path='' as $$
 select app_private.has_role('delivery_operator') and exists(select 1 from public.delivery_operators o join public.delivery_companies c on c.id=o.company_id
 where o.company_id=company and o.user_id=auth.uid() and o.active and c.active)
$$;
create function app_private.read_shipment(shipment uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.shipments s where s.id=shipment and (app_private.read_seller_order(s.seller_order_id) or
 (app_private.operates_company(s.delivery_company_id) and exists(select 1 from public.delivery_assignments a where a.shipment_id=s.id and a.company_id=s.delivery_company_id and a.superseded_at is null)))) or app_private.permitted('delivery.manage')
$$;
create function app_private.read_complaint(case_id uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.complaints where id=case_id and ((customer_id=auth.uid() and app_private.active_user()) or app_private.owns_store(store_id))) or app_private.permitted('complaints.manage')
$$;
-- Auth identities are NEVER made from demo users. Metadata cannot assign any role.
create function app_private.provision_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,display_name) values(new.id,'مستخدم جديد');
 insert into public.user_roles(user_id,role) values(new.id,'customer');
 return new;
end $$;
create trigger on_auth_identity_created after insert on auth.users for each row execute function app_private.provision_profile();

-- Revoke Supabase default broad grants before adding only the minimum surface.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.active_user(), app_private.has_role(public.app_role), app_private.permitted(text),
 app_private.owns_seller(uuid),app_private.owns_store(uuid),app_private.public_store(uuid),app_private.public_product(uuid),
 app_private.owns_order(uuid),app_private.read_seller_order(uuid),app_private.operates_company(uuid),app_private.read_shipment(uuid),app_private.read_complaint(uuid) to anon,authenticated;
-- Trigger entrypoints are not callable by API clients.
revoke all on function app_private.provision_profile() from public,anon,authenticated;
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',t.tablename);
 execute format('grant select on public.%I to authenticated',t.tablename);
 end loop;
end $$;
grant select on public.categories,public.stores,public.products,public.product_images,public.product_variants,public.store_reviews to anon;

create policy profiles_read on public.profiles for select to authenticated using((id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy profiles_edit_name on public.profiles for update to authenticated using(id=auth.uid() and app_private.active_user()) with check(id=auth.uid() and app_private.active_user());
grant update(display_name) on public.profiles to authenticated;
create policy roles_read on public.user_roles for select to authenticated using((user_id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy permissions_read on public.admin_permissions for select to authenticated using((user_id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy seller_profiles_read on public.seller_profiles for select to authenticated using(app_private.owns_seller(id) or app_private.permitted('stores.read'));
create policy categories_read on public.categories for select to anon,authenticated using(active or app_private.permitted('catalog.manage'));
create policy stores_read on public.stores for select to anon,authenticated using(app_private.public_store(id) or app_private.owns_store(id) or app_private.permitted('stores.read'));
create policy stores_edit on public.stores for update to authenticated using(app_private.owns_store(id)) with check(app_private.owns_store(id));
grant update(name_ar,description,hours,contact) on public.stores to authenticated;
create policy documents_read on public.store_documents for select to authenticated using(app_private.owns_store(store_id) or app_private.permitted('licenses.review'));
create policy documents_submit on public.store_documents for insert to authenticated with check(app_private.owns_store(store_id) and uploaded_by=auth.uid() and status='draft' and reviewer_id is null and review_notes is null);
grant insert(store_id,uploaded_by,object_path,document_type,issued_at,expires_at) on public.store_documents to authenticated;
create policy products_read on public.products for select to anon,authenticated using(app_private.public_product(id) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy products_edit on public.products for update to authenticated using(app_private.owns_store(store_id)) with check(app_private.owns_store(store_id));
-- Moderation, price and stock changes await protected audited services in 4B/4C.
grant update(name_ar,description) on public.products to authenticated;
create policy images_read on public.product_images for select to anon,authenticated using(app_private.public_product(product_id) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy variants_read on public.product_variants for select to anon,authenticated using((active and app_private.public_product(product_id)) or exists(select 1 from public.products p where p.id=product_id and app_private.owns_store(p.store_id)) or app_private.permitted('catalog.manage'));
create policy inventory_read on public.inventory_movements for select to authenticated using(exists(select 1 from public.products p where p.id=product_id and app_private.owns_store(p.store_id)) or app_private.permitted('catalog.manage'));
create policy reviews_read on public.store_reviews for select to anon,authenticated using((visible and app_private.public_store(store_id)) or (customer_id=auth.uid() and app_private.active_user()) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy addresses_owner on public.customer_addresses for all to authenticated using(customer_id=auth.uid() and app_private.active_user()) with check(customer_id=auth.uid() and app_private.active_user());
grant insert(customer_id,label,emirate,area_code,address_lines,recipient_name,phone),update(label,emirate,area_code,address_lines,recipient_name,phone,archived_at) on public.customer_addresses to authenticated;
create policy carts_owner on public.carts for select to authenticated using(customer_id=auth.uid() and app_private.active_user());
create policy cart_items_owner on public.cart_items for select to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=auth.uid() and app_private.active_user()));
-- Cart writes and prices intentionally closed pending server validation in 4C.
create policy orders_customer_or_admin on public.orders for select to authenticated using(app_private.owns_order(id) or app_private.permitted('orders.read'));
-- Seller only reads its own suborder, never the master order containing other sellers.
create policy seller_orders_read on public.seller_orders for select to authenticated using(app_private.read_seller_order(id));
create policy order_items_read on public.order_items for select to authenticated using(app_private.read_seller_order(seller_order_id));
create policy order_history_read on public.order_status_history for select to authenticated using(app_private.read_seller_order(seller_order_id));

create policy companies_read on public.delivery_companies for select to authenticated using(app_private.operates_company(id) or app_private.permitted('delivery.manage'));
create policy operators_read on public.delivery_operators for select to authenticated using((user_id=auth.uid() and app_private.active_user()) or app_private.permitted('delivery.manage'));
create policy services_read on public.delivery_services for select to authenticated using(app_private.operates_company(company_id) or app_private.permitted('delivery.manage'));
create policy coverage_read on public.delivery_coverage for select to authenticated using(exists(select 1 from public.delivery_services s where s.id=service_id and app_private.operates_company(s.company_id)) or app_private.permitted('delivery.manage'));
create policy rates_admin on public.delivery_rate_cards for select to authenticated using(app_private.permitted('delivery.manage'));
create policy contracts_read on public.delivery_contracts for select to authenticated using(app_private.operates_company(company_id) or app_private.permitted('finance.read'));
create policy allocation_admin on public.delivery_allocation_policies for select to authenticated using(app_private.permitted('delivery.manage'));
create policy shipments_read on public.shipments for select to authenticated using(app_private.read_shipment(id));
create policy shipment_items_read on public.shipment_items for select to authenticated using(app_private.read_shipment(shipment_id));
create policy tracking_read on public.shipment_tracking_events for select to authenticated using(app_private.read_shipment(shipment_id));
create policy assignments_read on public.delivery_assignments for select to authenticated using(app_private.read_shipment(shipment_id));

create policy intents_read on public.payment_intents for select to authenticated using(app_private.owns_order(order_id) or app_private.permitted('finance.read'));
create policy transactions_read on public.payment_transactions for select to authenticated using(app_private.owns_order(order_id) or app_private.permitted('finance.read'));
create policy events_finance on public.payment_events for select to authenticated using(app_private.permitted('finance.read'));
create policy refunds_read on public.refunds for select to authenticated using(app_private.owns_order(order_id) or app_private.permitted('finance.read'));
create policy refund_items_read on public.refund_items for select to authenticated using(app_private.owns_order(order_id) or app_private.permitted('finance.read'));
create policy sale_rules_finance on public.seller_commission_rules for select to authenticated using(app_private.permitted('finance.read') or app_private.owns_seller(seller_id));
create policy delivery_rules_finance on public.delivery_commission_rules for select to authenticated using(app_private.permitted('finance.read') or exists(select 1 from public.delivery_contracts c where c.id=contract_id and app_private.operates_company(c.company_id)));
create policy commissions_finance on public.commission_entries for select to authenticated using(app_private.permitted('finance.read') or exists(select 1 from public.seller_orders so where so.id=seller_order_id and app_private.owns_store(so.store_id)) or exists(select 1 from public.shipments sh where sh.id=shipment_id and app_private.operates_company(sh.delivery_company_id)));
create policy commission_history_read on public.commission_status_history for select to authenticated using(exists(select 1 from public.commission_entries c where c.id=commission_entry_id));
-- Raw ledger is financial-admin only. Seller/carrier summaries will be server DTOs in 4E.
create policy ledger_finance on public.financial_ledger_entries for select to authenticated using(app_private.permitted('finance.read'));
create policy seller_settlements_read on public.seller_settlements for select to authenticated using(app_private.owns_seller(seller_id) or app_private.permitted('finance.read'));
create policy delivery_settlements_read on public.delivery_settlements for select to authenticated using(app_private.operates_company(company_id) or app_private.permitted('finance.read'));
create policy settlement_items_read on public.settlement_items for select to authenticated using(app_private.permitted('finance.read') or exists(select 1 from public.seller_settlements ss where ss.id=seller_settlement_id and app_private.owns_seller(ss.seller_id)) or exists(select 1 from public.delivery_settlements ds where ds.id=delivery_settlement_id and app_private.operates_company(ds.company_id)));
create policy settlement_events_read on public.settlement_events for select to authenticated using(app_private.permitted('finance.read') or exists(select 1 from public.seller_settlements ss where ss.id=seller_settlement_id and app_private.owns_seller(ss.seller_id)) or exists(select 1 from public.delivery_settlements ds where ds.id=delivery_settlement_id and app_private.operates_company(ds.company_id)));
create policy complaints_read on public.complaints for select to authenticated using(app_private.read_complaint(id));
create policy complaint_actions_read on public.complaint_actions for select to authenticated using(app_private.permitted('complaints.manage') or (visibility='participants' and app_private.read_complaint(complaint_id)));
create policy moderation_admin on public.moderation_actions for select to authenticated using(app_private.permitted('audit.read'));
create policy audit_admin on public.audit_logs for select to authenticated using(app_private.permitted('audit.read'));
create policy notifications_owner on public.notifications for select to authenticated using(user_id=auth.uid() and app_private.active_user());
create policy notifications_mark_read on public.notifications for update to authenticated using(user_id=auth.uid() and app_private.active_user()) with check(user_id=auth.uid() and app_private.active_user());
grant update(read_at) on public.notifications to authenticated;
create policy imports_admin on public.import_batches for select to authenticated using(app_private.permitted('catalog.manage'));
-- Trusted backend is still obligated to authenticate, authorize and transact;
-- service_role NEVER ships to browser. BYPASSRLS is not user authorization.
grant select,insert,update,delete on all tables in schema public to service_role;
revoke update,delete on public.audit_logs,public.financial_ledger_entries,public.commission_entries,public.commission_status_history,public.payment_events,public.payment_transactions,public.inventory_movements,public.order_status_history,public.shipment_tracking_events,public.settlement_events from service_role;
commit;
