CREATE OR REPLACE FUNCTION app_private.delivery_candidates(prep_uuid uuid) RETURNS TABLE(company_id uuid,company_name text,service_id uuid,service_name text,contract_id uuid,rate_card_id uuid,gross_minor bigint,policy_snapshot jsonb)
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path='' AS $$
 SELECT c.id,c.name_ar,v.id,v.name_ar,k.id,r.id,
 r.base_minor + ceil(p.weight_grams::numeric/1000)::bigint*r.per_kg_minor + ceil(p.volume_cm3::numeric/r.volume_unit_cm3)::bigint*r.per_volume_unit_minor + r.special_handling_minor+r.disclosed_surcharge_minor,
 jsonb_build_object('contract',to_jsonb(k),'rate',to_jsonb(r),'weight_grams',p.weight_grams,'volume_cm3',p.volume_cm3,'shipping_class',p.shipping_class,'ready_at',p.ready_at,'pickup_until',p.pickup_until,'deliver_by',p.deliver_by)
 FROM public.delivery_order_preparations p JOIN public.seller_orders so ON so.id=p.seller_order_id JOIN public.orders o ON o.id=so.order_id
 JOIN public.delivery_companies c ON c.active AND c.approval_status='approved'
 JOIN public.delivery_services v ON v.company_id=c.id AND v.active AND p.shipping_class=ANY(v.shipping_classes)
 JOIN public.delivery_contracts k ON k.company_id=c.id AND k.active AND k.currency=o.currency AND k.valid_from<=clock_timestamp() AND (k.valid_until IS NULL OR k.valid_until>clock_timestamp())
 JOIN public.delivery_rate_cards r ON r.service_id=v.id AND r.currency=o.currency AND r.valid_from<=clock_timestamp() AND (r.valid_until IS NULL OR r.valid_until>clock_timestamp())
 AND r.pickup_emirate::text=p.pickup_snapshot->>'emirate' AND r.pickup_area_code=p.pickup_snapshot->>'area_code'
 AND r.dropoff_emirate::text=o.delivery_address_snapshot->>'emirate' AND r.dropoff_area_code=o.delivery_address_snapshot->>'area_code'
 AND r.max_weight_grams IS NOT NULL AND r.max_volume_cm3 IS NOT NULL AND p.weight_grams<=r.max_weight_grams AND p.volume_cm3<=r.max_volume_cm3
 WHERE p.id=prep_uuid AND app_private.delivery_paid(o.id) AND so.status IN ('confirmed','preparing','ready')
 AND p.ready_at<=clock_timestamp() AND p.pickup_until>clock_timestamp() AND clock_timestamp()+v.eta_minutes*interval '1 minute'<=p.deliver_by
 AND EXISTS(SELECT 1 FROM public.delivery_coverage x WHERE x.service_id=v.id AND x.active AND x.pickup AND x.emirate::text=p.pickup_snapshot->>'emirate' AND x.area_code=p.pickup_snapshot->>'area_code')
 AND EXISTS(SELECT 1 FROM public.delivery_coverage x WHERE x.service_id=v.id AND x.active AND x.dropoff AND x.emirate::text=o.delivery_address_snapshot->>'emirate' AND x.area_code=o.delivery_address_snapshot->>'area_code')
 AND c.capacity_daily IS NOT NULL AND v.capacity_daily IS NOT NULL
 AND (SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=c.id AND a.superseded_at IS NULL AND (a.assigned_at AT TIME ZONE 'Asia/Dubai')::date=(clock_timestamp() AT TIME ZONE 'Asia/Dubai')::date AND NOT EXISTS(SELECT 1 FROM public.shipments reserved WHERE reserved.id=a.shipment_id AND reserved.seller_order_id=p.seller_order_id) AND (a.offer_status='accepted' OR (a.offer_status='offered' AND a.expires_at>clock_timestamp())))<c.capacity_daily
 AND (SELECT count(*) FROM public.delivery_assignments a WHERE a.service_id=v.id AND a.superseded_at IS NULL AND (a.assigned_at AT TIME ZONE 'Asia/Dubai')::date=(clock_timestamp() AT TIME ZONE 'Asia/Dubai')::date AND NOT EXISTS(SELECT 1 FROM public.shipments reserved WHERE reserved.id=a.shipment_id AND reserved.seller_order_id=p.seller_order_id) AND (a.offer_status='accepted' OR (a.offer_status='offered' AND a.expires_at>clock_timestamp())))<v.capacity_daily
$$;
CREATE OR REPLACE FUNCTION app_private.delivery_member(company uuid, decision boolean DEFAULT false) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.active_user() AND EXISTS(SELECT 1 FROM public.delivery_operators m JOIN public.delivery_companies c ON c.id=m.company_id
 WHERE m.user_id=auth.uid() AND m.company_id=company AND m.active AND c.active AND c.approval_status='approved' AND m.scoped_role<>'driver'
 AND (NOT decision OR m.scoped_role IN ('company_admin','operations')))
$$;
CREATE OR REPLACE FUNCTION app_private.operates_company(company uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT app_private.delivery_member(company,true)
$$;
ALTER POLICY assignments_read ON public.delivery_assignments USING (app_private.read_shipment(shipment_id));
CREATE FUNCTION app_private.delivery_offer_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF TG_OP='INSERT' AND (NEW.expires_at IS NULL OR NEW.expires_at<=clock_timestamp() OR NEW.expires_at>clock_timestamp()+interval '60 minutes') THEN RAISE EXCEPTION 'delivery_offer_expired'; END IF;
 IF TG_OP='UPDATE' AND NEW.offer_status='accepted' AND OLD.offer_status='offered' THEN
  IF OLD.expires_at IS NULL OR OLD.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'delivery_offer_expired'; END IF;
  IF NOT app_private.delivery_member(NEW.company_id,true) THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER delivery_offer_clock BEFORE INSERT OR UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION app_private.delivery_offer_guard();
CREATE TRIGGER delivery_commission_rule_audit AFTER INSERT OR UPDATE ON public.delivery_commission_rules FOR EACH ROW EXECUTE FUNCTION app_private.audit_change();
CREATE FUNCTION public.sanaa_delivery_toggle(command_key uuid,payload jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); d jsonb:=payload->'data'; why text:=trim(coalesce(payload->>'reason','')); prior app_private.delivery_command_receipts; result jsonb; target uuid:=(d->>'id')::uuid;
BEGIN
 IF actor IS NULL OR NOT app_private.permitted('delivery.manage') THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 IF char_length(why)<3 OR char_length(why)>1000 THEN RAISE EXCEPTION 'delivery_reason_required'; END IF;
 IF command_key IS NULL OR target IS NULL OR jsonb_typeof(d->'active') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
 PERFORM pg_advisory_xact_lock(741005);
 SELECT * INTO prior FROM app_private.delivery_command_receipts WHERE actor_id=actor AND delivery_command_receipts.command_key=sanaa_delivery_toggle.command_key;
 IF FOUND THEN IF prior.payload IS DISTINCT FROM payload THEN RAISE EXCEPTION 'delivery_key_conflict'; END IF; RETURN prior.result; END IF;
 PERFORM set_config('app.audit_reason',why,true);
 IF payload->>'action'='service_state' THEN UPDATE public.delivery_services SET active=(d->>'active')::boolean WHERE id=target;
 ELSIF payload->>'action'='coverage_state' THEN UPDATE public.delivery_coverage SET active=(d->>'active')::boolean WHERE id=target;
 ELSE RAISE EXCEPTION 'delivery_invalid_input'; END IF;
 IF NOT FOUND THEN RAISE EXCEPTION 'delivery_not_found'; END IF;
 result:=jsonb_build_object('id',target);
 INSERT INTO app_private.delivery_command_receipts(actor_id,command_key,payload,result) VALUES(actor,command_key,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.sanaa_delivery_toggle(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sanaa_delivery_toggle(uuid,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.sanaa_delivery_read(request jsonb) RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); platform boolean:=app_private.permitted('delivery.manage'); view_name text:=request->>'view';
 page_no integer:=greatest(0,least(coalesce((request->>'page')::integer,0),10000)); limit_no integer:=25;
 target uuid:=nullif(request->>'id','')::uuid; company uuid:=nullif(request->>'company_id','')::uuid; rows jsonb; total bigint; detail jsonb; prep uuid;
BEGIN
 IF actor IS NULL OR NOT app_private.active_user() THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 IF view_name='access' THEN
  RETURN jsonb_build_object('platform',platform,'memberships',(SELECT coalesce(jsonb_agg(jsonb_build_object('company_id',m.company_id,'name',c.name_ar,'role',m.scoped_role,'available',c.active AND c.approval_status='approved' AND m.scoped_role<>'driver')), '[]') FROM public.delivery_operators m JOIN public.delivery_companies c ON c.id=m.company_id WHERE m.user_id=actor AND m.active));
 END IF;
 IF view_name IN ('companies','company','orders','order','candidates') AND NOT platform THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 IF view_name='companies' THEN
  SELECT count(*) INTO total FROM public.delivery_companies;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM (SELECT id,name_ar,approval_status,active,capacity_daily FROM public.delivery_companies ORDER BY created_at DESC,id LIMIT limit_no OFFSET page_no*limit_no)x;
 ELSIF view_name='company' THEN
  SELECT to_jsonb(c) INTO detail FROM public.delivery_companies c WHERE id=target;
  IF detail IS NULL THEN RAISE EXCEPTION 'delivery_not_found'; END IF;
  RETURN jsonb_build_object('company',detail,'members',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT id,user_id,scoped_role,active FROM public.delivery_operators WHERE company_id=target ORDER BY id LIMIT 100)x),
   'services',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT * FROM public.delivery_services WHERE company_id=target ORDER BY created_at DESC LIMIT 100)x),
   'contracts',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT * FROM public.delivery_contracts WHERE company_id=target ORDER BY version DESC LIMIT 100)x),
   'coverage',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT dc.* FROM public.delivery_coverage dc JOIN public.delivery_services v ON v.id=dc.service_id WHERE v.company_id=target ORDER BY dc.id LIMIT 100)x),
   'rates',(SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') FROM (SELECT r.* FROM public.delivery_rate_cards r JOIN public.delivery_services v ON v.id=r.service_id WHERE v.company_id=target ORDER BY r.created_at DESC LIMIT 100)x));
 ELSIF view_name='orders' THEN
  SELECT count(*) INTO total FROM public.seller_orders so WHERE so.status IN ('confirmed','preparing','ready') AND app_private.delivery_paid(so.order_id) AND NOT EXISTS(SELECT 1 FROM public.shipments s WHERE s.seller_order_id=so.id);
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM (SELECT so.id,so.order_id,so.store_id,so.status,so.created_at,st.name_ar store_name FROM public.seller_orders so JOIN public.stores st ON st.id=so.store_id WHERE so.status IN ('confirmed','preparing','ready') AND app_private.delivery_paid(so.order_id) AND NOT EXISTS(SELECT 1 FROM public.shipments s WHERE s.seller_order_id=so.id) ORDER BY so.created_at DESC,so.id LIMIT limit_no OFFSET page_no*limit_no)x;
 ELSIF view_name='order' THEN
  SELECT jsonb_build_object('id',so.id,'status',so.status,'order_id',o.id,'paid',app_private.delivery_paid(o.id),'customer_delivery_minor',o.delivery_minor,'currency',o.currency,'dropoff',o.delivery_address_snapshot,'store_name',st.name_ar) INTO detail FROM public.seller_orders so JOIN public.orders o ON o.id=so.order_id JOIN public.stores st ON st.id=so.store_id WHERE so.id=target;
  IF detail IS NULL THEN RAISE EXCEPTION 'delivery_not_found'; END IF;
  RETURN jsonb_build_object('order',detail,'items',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',i.id,'name',i.product_name_snapshot,'quantity',i.quantity,'shipping_class',p.shipping_class)),'[]') FROM public.order_items i JOIN public.products p ON p.id=i.product_id WHERE i.seller_order_id=target), 'preparation',(SELECT to_jsonb(p) FROM public.delivery_order_preparations p WHERE p.seller_order_id=target));
 ELSIF view_name='candidates' THEN
  SELECT id INTO prep FROM public.delivery_order_preparations WHERE seller_order_id=target;
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM (SELECT * FROM app_private.delivery_candidates(prep) ORDER BY company_name,service_id LIMIT 100)x;
  RETURN jsonb_build_object('rows',rows);
 ELSIF view_name IN ('shipments','shipment','dashboard') THEN
  IF NOT platform AND (company IS NULL OR NOT app_private.delivery_member(company)) THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
  IF view_name='dashboard' THEN
   RETURN jsonb_build_object('total',(SELECT count(DISTINCT a.shipment_id) FROM public.delivery_assignments a WHERE a.company_id=company),
   'offered',(SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='offered' AND a.expires_at>clock_timestamp()),
   'expired',(SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='offered' AND (a.expires_at IS NULL OR a.expires_at<=clock_timestamp())),
   'accepted',(SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted'),
   'rejected',(SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=company AND a.offer_status='rejected'));
  END IF;
  IF view_name='shipment' THEN
   IF NOT EXISTS(SELECT 1 FROM public.shipments s WHERE s.id=target AND (platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company))) THEN RAISE EXCEPTION 'delivery_not_found'; END IF;
   SELECT jsonb_build_object('id',s.id,'status',s.status,'seller_order_id',CASE WHEN platform THEN s.seller_order_id END,'pickup',jsonb_build_object('emirate',s.pickup_snapshot->>'emirate','area_code',s.pickup_snapshot->>'area_code','address_lines',s.pickup_snapshot->>'address_lines'),'dropoff',jsonb_build_object('emirate',s.dropoff_snapshot->>'emirate','area_code',s.dropoff_snapshot->>'area_code','address_lines',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'address_lines' END,'recipient_name',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'recipient_name' END,'phone',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'phone' END),
   'carrier_gross_minor',CASE WHEN platform OR app_private.delivery_member(company,true) THEN s.carrier_gross_minor END,'currency',s.currency,'promised_at',s.promised_at) INTO detail FROM public.shipments s WHERE s.id=target;
   RETURN jsonb_build_object('shipment',detail,'items',(SELECT coalesce(jsonb_agg(jsonb_build_object('name',i.product_name_snapshot,'quantity',si.quantity)),'[]') FROM public.shipment_items si JOIN public.order_items i ON i.id=si.order_item_id WHERE si.shipment_id=target),
   'assignments',(SELECT coalesce(jsonb_agg(jsonb_build_object('id',a.id,'company_id',a.company_id,'company_name',c.name_ar,'service_id',a.service_id,'status',CASE WHEN a.offer_status='rejected' THEN 'rejected' WHEN a.superseded_at IS NOT NULL THEN 'superseded' WHEN a.offer_status='offered' AND (a.expires_at IS NULL OR a.expires_at<=clock_timestamp()) THEN 'expired' ELSE a.offer_status END,'expires_at',a.expires_at,'response_reason',a.response_reason,'assigned_at',a.assigned_at) ORDER BY a.assigned_at DESC),'[]') FROM public.delivery_assignments a JOIN public.delivery_companies c ON c.id=a.company_id WHERE a.shipment_id=target AND (platform OR a.company_id=company)));
  END IF;
  SELECT count(*) INTO total FROM public.shipments s WHERE (platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company)) AND (coalesce(request->>'filter','')<>'unassigned' OR NOT EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.superseded_at IS NULL AND (a.offer_status='accepted' OR a.offer_status='offered' AND a.expires_at>clock_timestamp())));
  SELECT coalesce(jsonb_agg(to_jsonb(x)),'[]') INTO rows FROM (SELECT s.id,s.status,s.created_at,s.promised_at,s.pickup_snapshot->>'emirate' pickup_emirate,s.dropoff_snapshot->>'emirate' dropoff_emirate FROM public.shipments s WHERE (platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company)) AND (coalesce(request->>'filter','')<>'unassigned' OR NOT EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.superseded_at IS NULL AND (a.offer_status='accepted' OR a.offer_status='offered' AND a.expires_at>clock_timestamp()))) ORDER BY s.created_at DESC,s.id LIMIT limit_no OFFSET page_no*limit_no)x;
 ELSE RAISE EXCEPTION 'delivery_invalid_input'; END IF;
 RETURN jsonb_build_object('rows',rows,'total',total,'page',page_no,'page_size',limit_no,'server_time',clock_timestamp());
END $$;
REVOKE ALL ON FUNCTION public.sanaa_delivery_read(jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sanaa_delivery_read(jsonb) TO authenticated;
