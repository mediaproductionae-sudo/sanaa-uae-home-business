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
 id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(char_length(display_name) between 2 and 80),
 active boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
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
 check(discount_minor<=unit_price_minor*quantity), check(total_minor=unit_price_minor*quantity-discount_minor+tax_minor), unique(id,seller_order_id), unique(id,order_id)
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
 evidence jsonb not null, verified_at timestamptz not null, received_at timestamptz not null default now(), unique(provider,provider_event_id), unique(id,shipment_id)
);
alter table public.shipments add foreign key(delivery_evidence_id,id) references public.shipment_tracking_events(id,shipment_id) deferrable initially deferred;
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
 foreign key(refund_id,order_id) references public.refunds(id,order_id), foreign key(order_item_id,order_id) references public.order_items(id,order_id), unique(refund_id,order_item_id)
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

alter table public.stores add column logo_path text check(logo_path is null or split_part(logo_path,'/',1)=id::text);
alter table public.stores add column cover_path text check(cover_path is null or split_part(cover_path,'/',1)=id::text);

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
create function app_private.provision_profile() returns trigger language plpgsql security definer set search_path='' as $$
declare alias text:=trim(coalesce(new.raw_user_meta_data->>'display_name','مستخدم جديد')); begin
 if char_length(alias)<2 or char_length(alias)>80 then alias:='مستخدم جديد'; end if;
 insert into public.profiles(id,display_name) values(new.id,alias);
 insert into public.user_roles(user_id,role) values(new.id,'customer');
 return new;
end $$;
create trigger on_auth_identity_created after insert on auth.users for each row execute function app_private.provision_profile();

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
revoke all on all tables in schema public from anon, authenticated;
revoke all on all functions in schema app_private from public, anon, authenticated;
grant execute on function app_private.active_user(), app_private.has_role(public.app_role), app_private.permitted(text),
 app_private.owns_seller(uuid),app_private.owns_store(uuid),app_private.public_store(uuid),app_private.public_product(uuid),
 app_private.owns_order(uuid),app_private.read_seller_order(uuid),app_private.operates_company(uuid),app_private.read_shipment(uuid),app_private.read_complaint(uuid) to anon,authenticated;
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='public' loop
 execute format('alter table public.%I enable row level security',t.tablename);
 execute format('grant select on public.%I to authenticated',t.tablename);
 end loop;
end $$;
grant select on public.categories,public.stores,public.products,public.product_images,public.product_variants,public.store_reviews to anon;

create policy profiles_read on public.profiles for select to authenticated using((id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy roles_read on public.user_roles for select to authenticated using((user_id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy permissions_read on public.admin_permissions for select to authenticated using((user_id=auth.uid() and app_private.active_user()) or app_private.permitted('users.read'));
create policy seller_profiles_read on public.seller_profiles for select to authenticated using(app_private.owns_seller(id) or app_private.permitted('stores.read'));
create policy categories_read on public.categories for select to anon,authenticated using(active or app_private.permitted('catalog.manage'));
create policy stores_read on public.stores for select to anon,authenticated using(app_private.public_store(id) or app_private.owns_store(id) or app_private.permitted('stores.read'));
create policy documents_read on public.store_documents for select to authenticated using(app_private.owns_store(store_id) or app_private.permitted('licenses.review'));
create policy products_read on public.products for select to anon,authenticated using(app_private.public_product(id) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy images_read on public.product_images for select to anon,authenticated using(app_private.public_product(product_id) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy variants_read on public.product_variants for select to anon,authenticated using((active and app_private.public_product(product_id)) or exists(select 1 from public.products p where p.id=product_id and app_private.owns_store(p.store_id)) or app_private.permitted('catalog.manage'));
create policy inventory_read on public.inventory_movements for select to authenticated using(exists(select 1 from public.products p where p.id=product_id and app_private.owns_store(p.store_id)) or app_private.permitted('catalog.manage'));
create policy reviews_read on public.store_reviews for select to anon,authenticated using((visible and app_private.public_store(store_id)) or (customer_id=auth.uid() and app_private.active_user()) or app_private.owns_store(store_id) or app_private.permitted('catalog.manage'));
create policy addresses_owner on public.customer_addresses for all to authenticated using(customer_id=auth.uid() and app_private.active_user()) with check(customer_id=auth.uid() and app_private.active_user());
grant insert(customer_id,label,emirate,area_code,address_lines,recipient_name,phone),update(label,emirate,area_code,address_lines,recipient_name,phone,archived_at) on public.customer_addresses to authenticated;
create policy carts_owner on public.carts for select to authenticated using(customer_id=auth.uid() and app_private.active_user());
create policy cart_items_owner on public.cart_items for select to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=auth.uid() and app_private.active_user()));
create policy orders_customer_or_admin on public.orders for select to authenticated using(app_private.owns_order(id) or app_private.permitted('orders.read'));
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
grant select,insert,update,delete on all tables in schema public to service_role;
revoke update,delete on public.audit_logs,public.financial_ledger_entries,public.commission_entries,public.commission_status_history,public.payment_events,public.payment_transactions,public.inventory_movements,public.order_status_history,public.shipment_tracking_events,public.settlement_events from service_role;

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

create function app_private.path_store(path text) returns uuid language plpgsql immutable set search_path='' as $$
begin return split_part(path,'/',1)::uuid; exception when invalid_text_representation then return null; end $$;
revoke all on function app_private.path_store(text) from public;
grant execute on function app_private.path_store(text) to anon,authenticated;
create policy catalog_media_read on storage.objects for select to anon,authenticated using(bucket_id='catalog-media' and
 (app_private.owns_store(app_private.path_store(name)) or app_private.permitted('catalog.manage') or exists(select 1 from public.product_images i where i.object_path=name and app_private.public_product(i.product_id)) or exists(select 1 from public.stores s where (s.logo_path=name or s.cover_path=name) and app_private.public_store(s.id))));
create policy store_documents_read on storage.objects for select to authenticated using(bucket_id='store-documents' and
 (app_private.owns_store(app_private.path_store(name)) or app_private.permitted('licenses.review')));

create table app_private.runtime_environment(singleton boolean primary key default true check(singleton),environment text not null default 'unconfigured' check(environment in ('unconfigured','staging')),project_ref text);
insert into app_private.runtime_environment(singleton,environment,project_ref) values(true,'staging','srbdiosgajbyuohwsvau');
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
end $$;
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
revoke all on all functions in schema app_private from public;
revoke all on function app_private.bootstrap_first_admin(uuid,text),app_private.require_member(),app_private.take_slot(text,integer),app_private.provision_profile() from anon,authenticated,service_role;
grant execute on function app_private.active_user(), app_private.has_role(public.app_role), app_private.permitted(text),
 app_private.owns_seller(uuid),app_private.owns_store(uuid),app_private.public_store(uuid),app_private.public_product(uuid),
 app_private.owns_order(uuid),app_private.read_seller_order(uuid),app_private.operates_company(uuid),app_private.read_shipment(uuid),app_private.read_complaint(uuid),app_private.path_store(text) to anon,authenticated;
revoke all on function public.sanaa_upload_slot(uuid),public.sanaa_enroll_seller(text),public.sanaa_profile_save(text),public.sanaa_save_store(uuid,text,text,uuid,public.emirate_code,text,jsonb),public.sanaa_save_product(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status),public.sanaa_archive_product(uuid),public.sanaa_register_media(uuid,uuid,text,text,text),public.sanaa_review_store(uuid,public.store_status,text) from public,anon;
grant execute on function public.sanaa_upload_slot(uuid),public.sanaa_enroll_seller(text),public.sanaa_profile_save(text),public.sanaa_save_store(uuid,text,text,uuid,public.emirate_code,text,jsonb),public.sanaa_save_product(uuid,uuid,uuid,text,text,text,text,bigint,integer,public.product_status),public.sanaa_archive_product(uuid),public.sanaa_register_media(uuid,uuid,text,text,text),public.sanaa_review_store(uuid,public.store_status,text) to authenticated;