-- REVIEW ONLY: map to a new managed Lovable migration after comparing the live schema.
-- Uses the existing complaints and complaint_actions tables. Never replay 0000.
begin;
create index if not exists customer_complaints_owner_time on public.complaints(customer_id,created_at desc,id);
create index if not exists customer_complaint_visible_actions on public.complaint_actions(complaint_id,created_at,id) where visibility='participants';
create table if not exists app_private.customer_complaint_requests (
 user_id uuid not null references public.profiles(id),request_id uuid not null,
 request_hash bytea not null,complaint_id uuid not null references public.complaints(id),
 created_at timestamptz not null default now(),primary key(user_id,request_id)
);
create index if not exists customer_complaint_request_rate on app_private.customer_complaint_requests(user_id,created_at);
revoke all on app_private.customer_complaint_requests from public,anon,authenticated,service_role;
create or replace function app_private.customer_complaint_actor() returns uuid
language sql stable security definer set search_path='' as $$
 select p.id from public.profiles p join auth.users u on u.id=p.id
 where p.id=auth.uid() and p.active and u.email_confirmed_at is not null
 and exists(select 1 from public.user_roles r where r.user_id=p.id and r.role='customer')
$$;
revoke all on function app_private.customer_complaint_actor() from public,anon,authenticated;
create or replace function app_private.customer_complaint_dto(target uuid) returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('id',c.id,'storeId',c.store_id,'storeName',s.name_ar,'body',c.body,'status',c.status,'createdAt',c.created_at,
 'replies',coalesce((select jsonb_agg(jsonb_build_object('id',a.id,'note',a.note,'createdAt',a.created_at) order by a.created_at,a.id)
 from (select id,note,created_at from public.complaint_actions where complaint_id=c.id and visibility='participants' order by created_at,id limit 100) a),'[]'::jsonb))
 from public.complaints c join public.stores s on s.id=c.store_id where c.id=target and c.customer_id=auth.uid()
$$;
revoke all on function app_private.customer_complaint_dto(uuid) from public,anon,authenticated;
create or replace function public.sanaa_customer_complaints_read() returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.customer_complaint_actor(); result jsonb; begin
 if actor is null then raise exception 'confirmed_customer_required' using errcode='42501'; end if;
 select coalesce(jsonb_agg(app_private.customer_complaint_dto(c.id) order by c.created_at desc,c.id),'[]'::jsonb) into result
 from (select id,created_at from public.complaints where customer_id=actor order by created_at desc,id limit 100) c;
 return result;
end $$;
create or replace function public.sanaa_customer_complaint_submit(request_id uuid,store_uuid uuid,complaint_body text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.customer_complaint_actor();clean text:=trim(complaint_body);fingerprint bytea;receipt app_private.customer_complaint_requests;result uuid; begin
 if actor is null then raise exception 'confirmed_customer_required' using errcode='42501'; end if;
 if request_id is null or store_uuid is null or clean is null or char_length(clean) not between 10 and 4000 then raise exception 'invalid_complaint' using errcode='22023';end if;
 fingerprint:=sha256(convert_to(jsonb_build_object('storeId',store_uuid,'body',clean)::text,'UTF8'));
 perform pg_advisory_xact_lock(hashtextextended(actor::text,20261126));
 select * into receipt from app_private.customer_complaint_requests r where r.user_id=actor and r.request_id=sanaa_customer_complaint_submit.request_id;
 if found then
  if receipt.request_hash<>fingerprint then raise exception 'idempotency_mismatch' using errcode='22023';end if;
  return app_private.customer_complaint_dto(receipt.complaint_id);
 end if;
 if (select count(*) from app_private.customer_complaint_requests r where r.user_id=actor and r.created_at>now()-interval '1 minute')>=5 then raise exception 'rate_limited' using errcode='P0001';end if;
 -- Lock the selected store against concurrent archival while the complaint is inserted.
 perform 1 from public.stores s where s.id=store_uuid and app_private.public_store(s.id) for share;
 if not found then raise exception 'store_unavailable' using errcode='22023';end if;
 perform set_config('app.audit_reason','customer submitted a complaint',true);
 insert into public.complaints(customer_id,store_id,type,body)values(actor,store_uuid,'أخرى',clean) returning id into result;
 insert into app_private.customer_complaint_requests(user_id,request_id,request_hash,complaint_id)values(actor,request_id,fingerprint,result);
 return app_private.customer_complaint_dto(result);
end $$;
revoke all on function public.sanaa_customer_complaints_read(),public.sanaa_customer_complaint_submit(uuid,uuid,text) from public,anon;
grant execute on function public.sanaa_customer_complaints_read(),public.sanaa_customer_complaint_submit(uuid,uuid,text) to authenticated;
-- Existing complaints RLS remains unchanged. No direct INSERT/UPDATE/DELETE grants.
commit;
