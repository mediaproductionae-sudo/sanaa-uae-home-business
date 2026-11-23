create or replace function public.sanaa_archive_store(store_uuid uuid) returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member();begin
 perform app_private.take_slot('store_archive',10);
 if not app_private.owns_store(store_uuid) then raise exception 'not_owner' using errcode='42501';end if;
 perform 1 from public.stores where id=store_uuid for update;
 perform set_config('app.audit_reason','store removed by its owner; historical orders and complaints retained',true);
 update public.products set status='archived',updated_at=now() where store_id=store_uuid and status<>'archived';
 update public.stores set status='archived',updated_at=now() where id=store_uuid and status<>'archived';
end $$;
revoke all on function public.sanaa_archive_store(uuid) from public,anon;
grant execute on function public.sanaa_archive_store(uuid) to authenticated;