-- 4A foundation. Apply through Supabase CLI as the migration owner.
-- No public business-write RPCs are enabled in this batch.
begin;
create schema app_private;
revoke all on schema app_private from public;
grant usage on schema app_private to anon, authenticated, service_role;

create type public.app_role as enum ('customer','seller','admin','license_reviewer','complaints_officer','delivery_operator');
create type public.emirate_code as enum ('abu_dhabi','dubai','sharjah','ajman','umm_al_quwain','ras_al_khaimah','fujairah');
create type public.review_status as enum ('draft','submitted','in_review','needs_information','demo_approved','rejected','expired');
create type public.store_status as enum ('draft','pending','active','suspended','rejected','archived');
create type public.product_status as enum ('draft','published','paused','archived');
create type public.order_status as enum ('pending_payment','confirmed','preparing','ready','shipped','completed','cancelled');
create type public.payment_status as enum ('created','pending','succeeded','failed','expired','cancelled','partially_refunded','refunded');
create type public.shipment_status as enum ('pending','allocated','picked_up','in_transit','delivered','failed','cancelled');
create type public.settlement_status as enum ('pending','eligible','on_hold','processing','settled','failed','reversed');
create type public.case_status as enum ('new','in_review','needs_information','processing','closed');
create type public.commission_kind as enum ('sale','delivery');
create type public.commission_model as enum ('fixed','percentage','hybrid');
create domain public.minor_amount as bigint check(value>=0 and value<=9000000000000);
create domain public.currency_code as text check(value ~ '^[A-Z]{3}$');
create domain public.basis_points as integer check(value between 0 and 10000);

create table public.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check(char_length(display_name) between 2 and 80),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete restrict,
 role public.app_role not null, granted_by uuid references public.profiles(id), created_at timestamptz not null default now(), unique(user_id,role)
);
create table public.admin_permissions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete restrict,
 permission text not null check(permission in ('users.read','users.manage','stores.read','stores.manage','licenses.review','catalog.manage','orders.read','complaints.manage','delivery.manage','finance.read','finance.manage','audit.read')),
 created_at timestamptz not null default now(), unique(user_id,permission)
);
create table public.seller_profiles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.profiles(id),
 business_name text not null, onboarding_status public.review_status not null default 'draft', created_at timestamptz not null default now()
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.categories(id), slug text not null unique,
 name_ar text not null, active boolean not null default true, created_at timestamptz not null default now(), check(parent_id is distinct from id)
);
create table public.stores (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.seller_profiles(id),
 category_id uuid references public.categories(id), slug text not null unique, name_ar text not null check(char_length(name_ar) between 2 and 120), description text not null default '',
 emirate public.emirate_code not null, area_code text not null check(char_length(area_code) between 1 and 80),
 status public.store_status not null default 'draft', onboarding_status public.review_status not null default 'draft',
 license_status public.review_status not null default 'draft', hours jsonb not null default '{}'::jsonb,
 contact jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.store_documents (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id), uploaded_by uuid not null references public.profiles(id),
 object_path text not null unique check(split_part(object_path,'/',1)=store_id::text), document_type text not null,
 status public.review_status not null default 'draft', issued_at date, expires_at date, reviewer_id uuid references public.profiles(id),
 review_notes text, created_at timestamptz not null default now(), check(expires_at is null or issued_at is null or expires_at>=issued_at)
);
create table public.products (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id), category_id uuid not null references public.categories(id),
 sku text not null, name_ar text not null check(char_length(name_ar) between 2 and 160), description text not null default '',
 kind text not null check(kind in ('product','service')), status public.product_status not null default 'draft',
 moderation_hidden boolean not null default false, price_minor public.minor_amount not null, currency public.currency_code not null default 'AED',
 inventory_quantity integer not null default 0 check(inventory_quantity>=0), shipping_class text not null default 'standard',
 weight_grams integer check(weight_grams>=0), volume_cm3 integer check(volume_cm3>=0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(store_id,sku), unique(id,store_id)
);
create table public.product_images (
 id uuid primary key default gen_random_uuid(), product_id uuid not null, store_id uuid not null,
 object_path text not null unique check(split_part(object_path,'/',1)=store_id::text), alt_ar text not null default '', sort_order integer not null default 0,
 foreign key(product_id,store_id) references public.products(id,store_id), created_at timestamptz not null default now()
);
create table public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), sku text not null unique,
 attributes jsonb not null default '{}'::jsonb, price_minor public.minor_amount not null, inventory_quantity integer not null default 0 check(inventory_quantity>=0),
 active boolean not null default true, created_at timestamptz not null default now(), unique(id,product_id)
);
create table public.customer_addresses (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), label text not null,
 emirate public.emirate_code not null, area_code text not null, address_lines text not null, recipient_name text not null,
 phone text not null, archived_at timestamptz, created_at timestamptz not null default now(), unique(id,customer_id)
);
create table public.carts (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
 currency public.currency_code not null default 'AED', status text not null default 'active' check(status in ('active','converted','abandoned')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index carts_one_active_per_customer on public.carts(customer_id) where status='active';
create table public.cart_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id), product_id uuid not null references public.products(id),
 variant_id uuid, quantity integer not null check(quantity between 1 and 99), created_at timestamptz not null default now(),
 foreign key(variant_id,product_id) references public.product_variants(id,product_id)
);
create unique index cart_items_unique on public.cart_items(cart_id,product_id,coalesce(variant_id,'00000000-0000-0000-0000-000000000000'::uuid));
create table public.orders (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id),
 idempotency_key text not null check(char_length(idempotency_key) between 16 and 200), request_hash text not null,
 status public.order_status not null default 'pending_payment', currency public.currency_code not null default 'AED',
 subtotal_minor public.minor_amount not null, discount_minor public.minor_amount not null default 0,
 delivery_minor public.minor_amount not null, tax_minor public.minor_amount not null default 0, total_minor public.minor_amount not null,
 delivery_address_snapshot jsonb not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(customer_id,idempotency_key), check(discount_minor<=subtotal_minor), check(total_minor=subtotal_minor-discount_minor+delivery_minor+tax_minor)
);
create table public.seller_orders (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), store_id uuid not null references public.stores(id),
 status public.order_status not null default 'pending_payment', subtotal_minor public.minor_amount not null,
 discount_minor public.minor_amount not null default 0, tax_minor public.minor_amount not null default 0,
 total_minor public.minor_amount not null, created_at timestamptz not null default now(),
 unique(order_id,store_id), unique(id,order_id,store_id), check(discount_minor<=subtotal_minor), check(total_minor=subtotal_minor-discount_minor+tax_minor)
);
create table public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null, seller_order_id uuid not null, store_id uuid not null,
 product_id uuid not null, variant_id uuid, product_name_snapshot text not null, sku_snapshot text not null,
 quantity integer not null check(quantity between 1 and 99), unit_price_minor public.minor_amount not null,
 discount_minor public.minor_amount not null default 0, tax_minor public.minor_amount not null default 0, total_minor public.minor_amount not null,
 created_at timestamptz not null default now(), foreign key(seller_order_id,order_id,store_id) references public.seller_orders(id,order_id,store_id),
 foreign key(product_id,store_id) references public.products(id,store_id), foreign key(variant_id,product_id) references public.product_variants(id,product_id),
 check(discount_minor<=unit_price_minor*quantity), check(total_minor=unit_price_minor*quantity-discount_minor+tax_minor), unique(id,seller_order_id)
);
create table public.inventory_movements (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), variant_id uuid,
 order_item_id uuid references public.order_items(id), quantity_delta integer not null check(quantity_delta<>0),
 reason text not null check(char_length(reason)>=3), idempotency_key text not null unique, actor_id uuid references public.profiles(id), created_at timestamptz not null default now(),
 foreign key(variant_id,product_id) references public.product_variants(id,product_id)
);
create table public.order_status_history (
 id uuid primary key default gen_random_uuid(), seller_order_id uuid not null references public.seller_orders(id),
 from_status public.order_status, to_status public.order_status not null, actor_id uuid references public.profiles(id),
 source text not null check(source in ('server','payment_event','delivery_event','admin')), reason text not null, created_at timestamptz not null default now()
);
create table public.store_reviews (
 id uuid primary key default gen_random_uuid(), store_id uuid not null references public.stores(id), customer_id uuid not null references public.profiles(id),
 seller_order_id uuid not null unique references public.seller_orders(id), score integer not null check(score between 1 and 5),
 body text not null, visible boolean not null default false, seller_reply text, created_at timestamptz not null default now()
);

create table public.delivery_companies (
 id uuid primary key default gen_random_uuid(), name_ar text not null, active boolean not null default false, contact jsonb not null default '{}'::jsonb,
 hours jsonb not null default '{}'::jsonb, capacity_daily integer check(capacity_daily>0), reliable_performance_bps public.basis_points,
 performance_sample_size integer not null default 0 check(performance_sample_size>=0), created_at timestamptz not null default now()
);
create table public.delivery_operators (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.delivery_companies(id), user_id uuid not null references public.profiles(id),
 active boolean not null default true, created_at timestamptz not null default now(), unique(company_id,user_id)
);
create table public.delivery_services (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.delivery_companies(id), code text not null,
 name_ar text not null, active boolean not null default false, shipping_classes text[] not null default array['standard'],
 eta_minutes integer not null check(eta_minutes>0), capacity_daily integer check(capacity_daily>0), created_at timestamptz not null default now(),
 unique(company_id,code), unique(id,company_id)
);
create table public.delivery_coverage (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.delivery_services(id),
 emirate public.emirate_code not null, area_code text not null, pickup boolean not null, dropoff boolean not null,
 active boolean not null default true, created_at timestamptz not null default now(), unique(service_id,emirate,area_code), check(pickup or dropoff)
);
create table public.delivery_rate_cards (
 id uuid primary key default gen_random_uuid(), service_id uuid not null references public.delivery_services(id),
 pickup_emirate public.emirate_code not null, pickup_area_code text not null, dropoff_emirate public.emirate_code not null, dropoff_area_code text not null,
 currency public.currency_code not null default 'AED', base_minor public.minor_amount not null, per_kg_minor public.minor_amount not null default 0,
 per_volume_unit_minor public.minor_amount not null default 0, volume_unit_cm3 integer not null default 100000 check(volume_unit_cm3>0),
 special_handling_minor public.minor_amount not null default 0, disclosed_surcharge_minor public.minor_amount not null default 0,
 max_weight_grams integer check(max_weight_grams>0), max_volume_cm3 integer check(max_volume_cm3>0),
 valid_from timestamptz not null, valid_until timestamptz, created_at timestamptz not null default now(),
 check(valid_until is null or valid_until>valid_from)
);
create table public.delivery_contracts (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.delivery_companies(id),
 version integer not null check(version>0), model public.commission_model not null, fixed_minor public.minor_amount not null default 0,
 rate_bps public.basis_points not null default 0, currency public.currency_code not null default 'AED',
 commission_deducted_from_carrier boolean not null default true check(commission_deducted_from_carrier),
 valid_from timestamptz not null, valid_until timestamptz, active boolean not null default false,
 created_at timestamptz not null default now(), unique(company_id,version), unique(id,company_id),
 check(valid_until is null or valid_until>valid_from),
 check((model='fixed' and rate_bps=0) or (model='percentage' and fixed_minor=0) or model='hybrid')
);
create table public.delivery_allocation_policies (
 id uuid primary key default gen_random_uuid(), version integer not null unique,
 cost_weight integer not null default 60 check(cost_weight>=0), eta_weight integer not null default 30 check(eta_weight>=0), performance_weight integer not null default 10 check(performance_weight>=0),
 minimum_reliable_samples integer not null default 30 check(minimum_reliable_samples>0), active boolean not null default false,
 created_at timestamptz not null default now(), check(cost_weight+eta_weight+performance_weight=100)
);
create unique index one_active_allocation_policy on public.delivery_allocation_policies(active) where active;
create table public.shipments (
 id uuid primary key default gen_random_uuid(), seller_order_id uuid not null references public.seller_orders(id),
 status public.shipment_status not null default 'pending', delivery_company_id uuid references public.delivery_companies(id), delivery_service_id uuid,
 delivery_contract_id uuid, rate_card_id uuid references public.delivery_rate_cards(id),
 quote_snapshot jsonb not null, allocation_snapshot jsonb not null, pickup_snapshot jsonb not null, dropoff_snapshot jsonb not null,
 customer_fee_minor public.minor_amount not null, carrier_gross_minor public.minor_amount not null, currency public.currency_code not null default 'AED',
 promised_at timestamptz, delivered_at timestamptz, delivery_evidence_id uuid, created_at timestamptz not null default now(),
 foreign key(delivery_service_id,delivery_company_id) references public.delivery_services(id,company_id),
 foreign key(delivery_contract_id,delivery_company_id) references public.delivery_contracts(id,company_id),
 check(delivery_service_id is null or delivery_company_id is not null), check(delivery_contract_id is null or delivery_company_id is not null),
 check((status<>'delivered') or (delivered_at is not null and delivery_evidence_id is not null)), unique(id,seller_order_id)
);
create table public.shipment_items (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null, seller_order_id uuid not null, order_item_id uuid not null,
 quantity integer not null check(quantity between 1 and 99), created_at timestamptz not null default now(),
 foreign key(shipment_id,seller_order_id) references public.shipments(id,seller_order_id), foreign key(order_item_id,seller_order_id) references public.order_items(id,seller_order_id), unique(shipment_id,order_item_id)
);
create table public.shipment_tracking_events (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id),
 provider text not null, provider_event_id text not null, status public.shipment_status not null,
 trusted_source text not null check(trusted_source in ('verified_webhook','verified_operator','admin_review')),
 evidence jsonb not null, verified_at timestamptz not null, received_at timestamptz not null default now(), unique(provider,provider_event_id)
);
alter table public.shipments add constraint shipments_evidence_fk foreign key(delivery_evidence_id) references public.shipment_tracking_events(id);
create table public.delivery_assignments (
 id uuid primary key default gen_random_uuid(), shipment_id uuid not null references public.shipments(id), company_id uuid not null references public.delivery_companies(id),
 policy_id uuid references public.delivery_allocation_policies(id), reason_snapshot jsonb not null, assigned_by uuid references public.profiles(id),
 assigned_at timestamptz not null default now(), superseded_at timestamptz
);
create unique index one_live_delivery_assignment on public.delivery_assignments(shipment_id) where superseded_at is null;

create table public.payment_intents (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id), provider text not null default 'simulation' check(provider='simulation'),
 provider_intent_id text unique, idempotency_key text not null unique, amount_minor public.minor_amount not null,
 currency public.currency_code not null default 'AED', status public.payment_status not null default 'created',
 expires_at timestamptz not null, created_at timestamptz not null default now(), unique(id,order_id)
);
create unique index one_live_payment_intent on public.payment_intents(order_id) where status in ('created','pending','succeeded','partially_refunded');
create table public.payment_events (
 id uuid primary key default gen_random_uuid(), intent_id uuid not null references public.payment_intents(id), provider text not null check(provider='simulation'),
 provider_event_id text not null, event_type text not null, payload_hash text not null, verified_at timestamptz not null,
 received_at timestamptz not null default now(), unique(provider,provider_event_id)
);
create table public.payment_transactions (
 id uuid primary key default gen_random_uuid(), intent_id uuid not null, order_id uuid not null,
 event_id uuid not null unique references public.payment_events(id), provider_transaction_id text not null unique,
 kind text not null check(kind in ('capture','refund')), amount_minor public.minor_amount not null check(amount_minor>0),
 gateway_fee_minor public.minor_amount not null default 0, currency public.currency_code not null default 'AED', created_at timestamptz not null default now(),
 foreign key(intent_id,order_id) references public.payment_intents(id,order_id), unique(id,order_id)
);
create unique index one_capture_per_intent on public.payment_transactions(intent_id) where kind='capture';
create table public.refunds (
 id uuid primary key default gen_random_uuid(), order_id uuid not null, capture_transaction_id uuid not null,
 idempotency_key text not null unique, amount_minor public.minor_amount not null check(amount_minor>0), delivery_refund_minor public.minor_amount not null default 0,
 status text not null default 'requested' check(status in ('requested','approved','processing','succeeded','failed','rejected')),
 reason text not null, requested_by uuid not null references public.profiles(id), created_at timestamptz not null default now(),
 foreign key(capture_transaction_id,order_id) references public.payment_transactions(id,order_id), unique(id,order_id), check(delivery_refund_minor<=amount_minor)
);
create table public.refund_items (
 id uuid primary key default gen_random_uuid(), refund_id uuid not null, order_id uuid not null, order_item_id uuid not null references public.order_items(id),
 quantity integer not null check(quantity between 1 and 99), amount_minor public.minor_amount not null check(amount_minor>0), created_at timestamptz not null default now(),
 foreign key(refund_id,order_id) references public.refunds(id,order_id), unique(refund_id,order_item_id)
);
create table public.seller_commission_rules (
 id uuid primary key default gen_random_uuid(), seller_id uuid references public.seller_profiles(id), version integer not null check(version>0),
 rate_bps public.basis_points not null default 1000, currency public.currency_code not null default 'AED',
 exclude_delivery boolean not null default true check(exclude_delivery), tax_basis text not null default 'exclude' check(tax_basis in ('exclude','include')),
 discount_basis text not null default 'after_discount' check(discount_basis in ('before_discount','after_discount')),
 refund_policy text not null default 'proportional' check(refund_policy in ('proportional','full_on_full_refund')),
 eligibility_policy jsonb not null default '{"payment_captured":true,"fulfilment_complete":true,"no_hold":true}',
 valid_from timestamptz not null, valid_until timestamptz, active boolean not null default false, created_at timestamptz not null default now(),
 check(valid_until is null or valid_until>valid_from)
);
create unique index seller_rule_version on public.seller_commission_rules(coalesce(seller_id,'00000000-0000-0000-0000-000000000000'::uuid),version);
create table public.delivery_commission_rules (
 id uuid primary key default gen_random_uuid(), contract_id uuid not null references public.delivery_contracts(id), version integer not null check(version>0),
 eligibility_policy jsonb not null default '{"verified_delivery":true,"no_hold":true}', active boolean not null default false,
 created_at timestamptz not null default now(), unique(contract_id,version)
);
create table public.commission_entries (
 id uuid primary key default gen_random_uuid(), kind public.commission_kind not null, seller_order_id uuid references public.seller_orders(id), shipment_id uuid references public.shipments(id),
 seller_rule_id uuid references public.seller_commission_rules(id), delivery_rule_id uuid references public.delivery_commission_rules(id),
 basis_minor public.minor_amount not null, amount_minor public.minor_amount not null, currency public.currency_code not null default 'AED',
 idempotency_key text not null unique, rule_snapshot jsonb not null, eligibility_evidence jsonb not null, eligible_at timestamptz,
 reverses_entry_id uuid references public.commission_entries(id), reason text not null check(char_length(reason)>=3), created_at timestamptz not null default now(),
 check(amount_minor<=basis_minor), check((kind='sale' and seller_order_id is not null and seller_rule_id is not null and shipment_id is null and delivery_rule_id is null) or
 (kind='delivery' and shipment_id is not null and delivery_rule_id is not null and seller_order_id is null and seller_rule_id is null))
);
create unique index sale_commission_once on public.commission_entries(seller_order_id) where kind='sale' and reverses_entry_id is null;
create unique index delivery_commission_once on public.commission_entries(shipment_id) where kind='delivery' and reverses_entry_id is null;
-- Eligibility/holds evolve as append-only events, never by editing the money.
create table public.commission_status_history (
 id uuid primary key default gen_random_uuid(), commission_entry_id uuid not null references public.commission_entries(id),
 status text not null check(status in ('pending','eligible','on_hold','reversed')),
 evidence jsonb not null, reason text not null check(char_length(reason)>=3),
 actor_id uuid references public.profiles(id), created_at timestamptz not null default now()
);
create table public.financial_ledger_entries (
 id uuid primary key default gen_random_uuid(), batch_id uuid not null, account_code text not null,
 seller_id uuid references public.seller_profiles(id), company_id uuid references public.delivery_companies(id), order_id uuid references public.orders(id),
 commission_entry_id uuid references public.commission_entries(id), payment_transaction_id uuid references public.payment_transactions(id), refund_id uuid references public.refunds(id),
 debit_minor public.minor_amount not null default 0, credit_minor public.minor_amount not null default 0, currency public.currency_code not null default 'AED',
 reverses_entry_id uuid references public.financial_ledger_entries(id), idempotency_key text not null unique, reason text not null check(char_length(reason)>=3),
 created_at timestamptz not null default now(), check((debit_minor>0 and credit_minor=0) or (credit_minor>0 and debit_minor=0)),
 check(not(seller_id is not null and company_id is not null))
);
create table public.seller_settlements (
 id uuid primary key default gen_random_uuid(), seller_id uuid not null references public.seller_profiles(id), currency public.currency_code not null default 'AED',
 idempotency_key text not null unique, amount_minor public.minor_amount not null check(amount_minor>0), status public.settlement_status not null default 'pending',
 reason text not null, created_at timestamptz not null default now()
);
create table public.delivery_settlements (
 id uuid primary key default gen_random_uuid(), company_id uuid not null references public.delivery_companies(id), currency public.currency_code not null default 'AED',
 idempotency_key text not null unique, amount_minor public.minor_amount not null check(amount_minor>0), status public.settlement_status not null default 'pending',
 reason text not null, created_at timestamptz not null default now()
);
create table public.settlement_items (
 id uuid primary key default gen_random_uuid(), seller_settlement_id uuid references public.seller_settlements(id), delivery_settlement_id uuid references public.delivery_settlements(id),
 ledger_entry_id uuid not null references public.financial_ledger_entries(id), amount_minor public.minor_amount not null check(amount_minor>0),
 idempotency_key text not null unique, created_at timestamptz not null default now(),
 check((seller_settlement_id is not null)::integer+(delivery_settlement_id is not null)::integer=1),
 unique(ledger_entry_id,seller_settlement_id), unique(ledger_entry_id,delivery_settlement_id)
);
create table public.settlement_events (
 id uuid primary key default gen_random_uuid(), seller_settlement_id uuid references public.seller_settlements(id), delivery_settlement_id uuid references public.delivery_settlements(id),
 from_status public.settlement_status, to_status public.settlement_status not null, evidence jsonb not null,
 reason text not null, actor_id uuid references public.profiles(id), created_at timestamptz not null default now(),
 check((seller_settlement_id is not null)::integer+(delivery_settlement_id is not null)::integer=1)
);
create table public.complaints (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), store_id uuid not null references public.stores(id),
 order_item_id uuid references public.order_items(id), type text not null, priority text not null default 'medium' check(priority in ('low','medium','high')),
 status public.case_status not null default 'new', body text not null check(char_length(body) between 10 and 4000),
 assigned_to uuid references public.profiles(id), closed_at timestamptz, created_at timestamptz not null default now()
);
create table public.complaint_actions (
 id uuid primary key default gen_random_uuid(), complaint_id uuid not null references public.complaints(id), actor_id uuid references public.profiles(id),
 visibility text not null check(visibility in ('internal','participants')), action text not null, note text not null, created_at timestamptz not null default now()
);
create table public.moderation_actions (
 id uuid primary key default gen_random_uuid(), store_id uuid references public.stores(id), product_id uuid references public.products(id), user_id uuid references public.profiles(id),
 actor_id uuid not null references public.profiles(id), decision text not null, reason text not null check(char_length(reason)>=3),
 previous_value jsonb, next_value jsonb, created_at timestamptz not null default now(),
 check(num_nonnulls(store_id,product_id,user_id)=1)
);
create table public.audit_logs (
 id uuid primary key default gen_random_uuid(), actor_id uuid, action text not null, entity_table text not null, entity_id uuid,
 previous_value jsonb, next_value jsonb, reason text, source text not null, created_at timestamptz not null default now()
);
create table public.notifications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id), type text not null,
 title_ar text not null, body_ar text not null, read_at timestamptz, created_at timestamptz not null default now()
);
create table public.import_batches (
 id uuid primary key default gen_random_uuid(), source_hash text not null unique, requested_by uuid not null references public.profiles(id),
 status text not null check(status in ('validated','approved','imported','rejected')), summary jsonb not null,
 created_at timestamptz not null default now()
);
-- Explicitly indexes every foreign key prefix; used for joins, deletes and RLS lookups.
do $$ declare r record; begin
 for r in select conrelid::regclass as tbl,a.attname as col from pg_constraint c
 join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
 where c.contype='f' and c.connamespace='public'::regnamespace loop
 execute format('create index if not exists %I on %s (%I)',replace(r.tbl::text,'.','_')||'_'||r.col||'_fk_idx',r.tbl,r.col);
 end loop;
end $$;
create index orders_customer_created on public.orders(customer_id,created_at desc,id);
create index seller_orders_store_created on public.seller_orders(store_id,created_at desc,id);
create index products_catalog_page on public.products(category_id,created_at desc,id) where status='published' and not moderation_hidden;
create index stores_public_location on public.stores(emirate,area_code,id) where status='active';
create index complaints_queue on public.complaints(status,priority,created_at,id);
create index audit_entity_time on public.audit_logs(entity_table,entity_id,created_at desc);
create index shipment_company_queue on public.shipments(delivery_company_id,status,promised_at,id);
create index ledger_batch on public.financial_ledger_entries(batch_id,currency);
commit;
