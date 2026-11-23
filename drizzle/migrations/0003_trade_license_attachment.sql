alter table public.store_documents add column if not exists file_name text, add column if not exists mime_type text, add column if not exists size_bytes integer;

create policy store_documents_owner_insert on storage.objects for insert to authenticated with check(bucket_id='store-documents' and app_private.owns_store(app_private.path_store(name)));
create policy store_documents_owner_delete on storage.objects for delete to authenticated using(bucket_id='store-documents' and app_private.owns_store(app_private.path_store(name)));

create function public.sanaa_attach_license(store_uuid uuid, object_path text, file_name text, mime_type text, size_bytes integer) returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=app_private.require_member(); result uuid; begin
 perform app_private.take_slot('media',20);
 if not app_private.owns_store(store_uuid) or split_part(object_path,'/',1)<>store_uuid::text or length(object_path)>250 or object_path~'\.\.' then raise exception 'not_owner' using errcode='42501'; end if;
 if mime_type not in ('application/pdf','image/png','image/jpeg','image/webp') or size_bytes<=0 or size_bytes>5242880 or char_length(file_name) not between 1 and 200 then raise exception 'invalid_document' using errcode='22023'; end if;
 perform set_config('app.audit_reason','seller attached trade license; review status unchanged',true);
 insert into public.store_documents(store_id,uploaded_by,object_path,document_type,status,file_name,mime_type,size_bytes)
 values(store_uuid,actor,object_path,'trade_license','draft',file_name,mime_type,size_bytes) returning id into result;
 return result;
end $$;

create function public.sanaa_remove_license(document_uuid uuid) returns text language plpgsql security definer set search_path='' as $$
declare path text; begin
 perform app_private.require_member();
 select d.object_path into path from public.store_documents d where d.id=document_uuid and d.document_type='trade_license' and app_private.owns_store(d.store_id);
 if path is null then raise exception 'not_owner' using errcode='42501'; end if;
 perform set_config('app.audit_reason','seller removed trade license attachment',true);
 delete from public.store_documents where id=document_uuid;
 return path;
end $$;

revoke all on function public.sanaa_attach_license(uuid,text,text,text,integer), public.sanaa_remove_license(uuid) from public, anon;
grant execute on function public.sanaa_attach_license(uuid,text,text,text,integer), public.sanaa_remove_license(uuid) to authenticated;