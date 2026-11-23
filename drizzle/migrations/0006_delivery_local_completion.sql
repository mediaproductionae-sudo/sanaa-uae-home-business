-- Local Codex completion, applied by Lovable after review. No production records are seeded.
CREATE FUNCTION app_private.delivery_hours_valid(hours jsonb) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
BEGIN
 IF jsonb_typeof(hours) IS DISTINCT FROM 'object' OR hours->>'timezone' IS DISTINCT FROM 'Asia/Dubai'
 OR coalesce(hours->>'open','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 OR coalesce(hours->>'close','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
 OR jsonb_typeof(hours->'days') IS DISTINCT FROM 'array' THEN RETURN false; END IF;
 IF jsonb_array_length(hours->'days') NOT BETWEEN 1 AND 7 THEN RETURN false; END IF;
 RETURN NOT EXISTS(SELECT 1 FROM jsonb_array_elements(hours->'days') d WHERE jsonb_typeof(d) IS DISTINCT FROM 'number' OR d::text !~ '^[0-6]$');
END $$;
CREATE FUNCTION app_private.delivery_is_open(hours jsonb, at_time timestamptz) RETURNS boolean
LANGUAGE plpgsql IMMUTABLE SET search_path='' AS $$
DECLARE local_time timestamp; opens time; closes time; weekday integer;
BEGIN
 IF NOT app_private.delivery_hours_valid(hours) OR at_time IS NULL THEN RETURN false; END IF;
 local_time:=at_time AT TIME ZONE 'Asia/Dubai'; opens:=(hours->>'open')::time; closes:=(hours->>'close')::time;
 weekday:=extract(dow FROM local_time)::integer;
 IF opens=closes THEN RETURN (hours->'days') @> jsonb_build_array(weekday); END IF;
 IF opens<closes THEN RETURN (hours->'days') @> jsonb_build_array(weekday) AND local_time::time>=opens AND local_time::time<closes; END IF;
 IF local_time::time>=opens THEN RETURN (hours->'days') @> jsonb_build_array(weekday); END IF;
 RETURN local_time::time<closes AND (hours->'days') @> jsonb_build_array((weekday+6)%7);
END $$;
REVOKE ALL ON FUNCTION app_private.delivery_hours_valid(jsonb),app_private.delivery_is_open(jsonb,timestamptz) FROM PUBLIC,anon,authenticated;
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
 WHERE p.id=prep_uuid AND app_private.delivery_paid(o.id)
 AND k.fixed_minor::numeric+floor(((r.base_minor + ceil(p.weight_grams::numeric/1000)::bigint*r.per_kg_minor + ceil(p.volume_cm3::numeric/r.volume_unit_cm3)::bigint*r.per_volume_unit_minor + r.special_handling_minor+r.disclosed_surcharge_minor)::numeric*k.rate_bps+5000)/10000)<=(r.base_minor + ceil(p.weight_grams::numeric/1000)::bigint*r.per_kg_minor + ceil(p.volume_cm3::numeric/r.volume_unit_cm3)::bigint*r.per_volume_unit_minor + r.special_handling_minor+r.disclosed_surcharge_minor)
 AND app_private.delivery_is_open(c.hours,greatest(clock_timestamp(),p.ready_at))
 AND app_private.delivery_is_open(c.hours,p.pickup_until-interval '1 microsecond')
 AND app_private.delivery_is_open(c.hours,clock_timestamp()+v.eta_minutes*interval '1 minute') AND so.status IN ('confirmed','preparing','ready')
 AND p.ready_at<=clock_timestamp() AND p.pickup_until>clock_timestamp() AND clock_timestamp()+v.eta_minutes*interval '1 minute'<=p.deliver_by
 AND EXISTS(SELECT 1 FROM public.delivery_coverage x WHERE x.service_id=v.id AND x.active AND x.pickup AND x.emirate::text=p.pickup_snapshot->>'emirate' AND x.area_code=p.pickup_snapshot->>'area_code')
 AND EXISTS(SELECT 1 FROM public.delivery_coverage x WHERE x.service_id=v.id AND x.active AND x.dropoff AND x.emirate::text=o.delivery_address_snapshot->>'emirate' AND x.area_code=o.delivery_address_snapshot->>'area_code')
 AND c.capacity_daily IS NOT NULL AND v.capacity_daily IS NOT NULL
 AND (SELECT count(*) FROM public.delivery_assignments a WHERE a.company_id=c.id AND a.superseded_at IS NULL AND (a.assigned_at AT TIME ZONE 'Asia/Dubai')::date=(clock_timestamp() AT TIME ZONE 'Asia/Dubai')::date AND NOT EXISTS(SELECT 1 FROM public.shipments reserved WHERE reserved.id=a.shipment_id AND reserved.seller_order_id=p.seller_order_id) AND (a.offer_status='accepted' OR (a.offer_status='offered' AND a.expires_at>clock_timestamp())))<c.capacity_daily
 AND (SELECT count(*) FROM public.delivery_assignments a WHERE a.service_id=v.id AND a.superseded_at IS NULL AND (a.assigned_at AT TIME ZONE 'Asia/Dubai')::date=(clock_timestamp() AT TIME ZONE 'Asia/Dubai')::date AND NOT EXISTS(SELECT 1 FROM public.shipments reserved WHERE reserved.id=a.shipment_id AND reserved.seller_order_id=p.seller_order_id) AND (a.offer_status='accepted' OR (a.offer_status='offered' AND a.expires_at>clock_timestamp())))<v.capacity_daily
$$;
CREATE OR REPLACE FUNCTION public.sanaa_delivery_command(command_key uuid, payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE actor uuid:=auth.uid(); action text:=payload->>'action'; d jsonb:=payload->'data'; why text:=trim(coalesce(payload->>'reason',''));
 prior app_private.delivery_command_receipts; result jsonb; cid uuid; sid uuid; oid uuid; rid uuid; aid uuid;
 s public.shipments; a public.delivery_assignments; p public.delivery_order_preparations; so public.seller_orders; o public.orders;
 candidate record; quote jsonb; fee bigint; n integer; before_row jsonb;
BEGIN
 IF actor IS NULL OR NOT app_private.active_user() THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 IF action NOT IN ('accept','reject') AND NOT app_private.permitted('delivery.manage') THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 IF char_length(why)<3 OR char_length(why)>1000 THEN RAISE EXCEPTION 'delivery_reason_required'; END IF;
 IF command_key IS NULL OR jsonb_typeof(d) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
 -- A single bounded operational lock serializes capacity, idempotency, creation and responses.
 -- This also gives every command the same lock ordering, avoiding reassignment/accept deadlocks.
 PERFORM pg_advisory_xact_lock(741005);
 IF action IN ('accept','reject') THEN
  SELECT * INTO a FROM public.delivery_assignments WHERE id=(d->>'assignment_id')::uuid;
  IF NOT FOUND OR NOT app_private.delivery_member(a.company_id,true) THEN RAISE EXCEPTION 'delivery_forbidden' USING errcode='42501'; END IF;
 END IF;
 SELECT * INTO prior FROM app_private.delivery_command_receipts WHERE actor_id=actor AND delivery_command_receipts.command_key=sanaa_delivery_command.command_key;
 IF FOUND THEN
  IF prior.payload IS DISTINCT FROM payload THEN RAISE EXCEPTION 'delivery_key_conflict'; END IF;
  RETURN prior.result;
 END IF;
 PERFORM set_config('app.audit_reason',why,true);
 IF action='company' THEN
  IF NOT app_private.delivery_hours_valid(d->'hours') THEN RAISE EXCEPTION 'delivery_hours_required'; END IF;
  cid:=nullif(d->>'id','')::uuid;
  IF char_length(trim(d->>'name_ar')) NOT BETWEEN 2 AND 120 OR (d->>'capacity_daily')::integer<=0 OR d->>'approval_status' NOT IN ('pending','approved','suspended') THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
  IF cid IS NULL THEN
   INSERT INTO public.delivery_companies(name_ar,active,approval_status,capacity_daily,contact,hours)
   VALUES(trim(d->>'name_ar'),d->>'approval_status'='approved',d->>'approval_status',(d->>'capacity_daily')::integer,'{}',d->'hours') RETURNING id INTO cid;
  ELSE
   UPDATE public.delivery_companies SET name_ar=trim(d->>'name_ar'),approval_status=d->>'approval_status',active=d->>'approval_status'='approved',capacity_daily=(d->>'capacity_daily')::integer,hours=d->'hours' WHERE id=cid;
   IF NOT FOUND THEN RAISE EXCEPTION 'delivery_not_found'; END IF;
  END IF;
  result:=jsonb_build_object('id',cid);
 ELSIF action='member' THEN
  cid:=(d->>'company_id')::uuid;
  IF d->>'scoped_role' NOT IN ('company_admin','operations','dispatcher','driver') OR NOT EXISTS(SELECT 1 FROM public.delivery_companies WHERE id=cid) OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=(d->>'user_id')::uuid AND active) THEN RAISE EXCEPTION 'delivery_known_account_required'; END IF;
  INSERT INTO public.delivery_operators(company_id,user_id,scoped_role,active) VALUES(cid,(d->>'user_id')::uuid,d->>'scoped_role',(d->>'active')::boolean)
  ON CONFLICT(company_id,user_id) DO UPDATE SET scoped_role=excluded.scoped_role,active=excluded.active RETURNING id INTO rid;
  result:=jsonb_build_object('id',rid);
 ELSIF action='service' THEN
  INSERT INTO public.delivery_services(company_id,code,name_ar,active,shipping_classes,eta_minutes,capacity_daily)
  VALUES((d->>'company_id')::uuid,d->>'code',d->>'name_ar',true,ARRAY(SELECT jsonb_array_elements_text(d->'shipping_classes')),(d->>'eta_minutes')::integer,(d->>'capacity_daily')::integer) RETURNING id INTO rid;
  result:=jsonb_build_object('id',rid);
 ELSIF action='coverage' THEN
  IF char_length(trim(d->>'area_code'))<1 THEN RAISE EXCEPTION 'delivery_location_missing'; END IF;
  INSERT INTO public.delivery_coverage(service_id,emirate,area_code,pickup,dropoff,active) VALUES((d->>'service_id')::uuid,(d->>'emirate')::public.emirate_code,trim(d->>'area_code'),(d->>'pickup')::boolean,(d->>'dropoff')::boolean,true) RETURNING id INTO rid;
  result:=jsonb_build_object('id',rid);
 ELSIF action='contract' THEN
  cid:=(d->>'company_id')::uuid;
  IF (d->>'valid_until')::timestamptz<=(d->>'valid_from')::timestamptz THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
  UPDATE public.delivery_contracts SET active=false WHERE company_id=cid AND active;
  SELECT coalesce(max(version),0)+1 INTO n FROM public.delivery_contracts WHERE company_id=cid;
  INSERT INTO public.delivery_contracts(company_id,version,model,fixed_minor,rate_bps,currency,commission_deducted_from_carrier,valid_from,valid_until,active)
  VALUES(cid,n,(d->>'model')::public.commission_model,(d->>'fixed_minor')::bigint,(d->>'rate_bps')::integer,'AED',true,(d->>'valid_from')::timestamptz,(d->>'valid_until')::timestamptz,true) RETURNING id INTO rid;
  INSERT INTO public.delivery_commission_rules(contract_id,version,eligibility_policy,active) VALUES(rid,1,jsonb_build_object('manual_offer_only',true,'settlement_enabled',false),true);
  result:=jsonb_build_object('id',rid);
 ELSIF action='rate' THEN
  IF (d->>'valid_until')::timestamptz<=(d->>'valid_from')::timestamptz OR (d->>'max_weight_grams')::integer<=0 OR (d->>'max_volume_cm3')::integer<=0 OR char_length(trim(d->>'pickup_area_code'))<1 OR char_length(trim(d->>'dropoff_area_code'))<1 THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
  INSERT INTO public.delivery_rate_cards(service_id,pickup_emirate,pickup_area_code,dropoff_emirate,dropoff_area_code,currency,base_minor,per_kg_minor,per_volume_unit_minor,volume_unit_cm3,special_handling_minor,disclosed_surcharge_minor,max_weight_grams,max_volume_cm3,valid_from,valid_until)
  VALUES((d->>'service_id')::uuid,(d->>'pickup_emirate')::public.emirate_code,trim(d->>'pickup_area_code'),(d->>'dropoff_emirate')::public.emirate_code,trim(d->>'dropoff_area_code'),'AED',(d->>'base_minor')::bigint,(d->>'per_kg_minor')::bigint,(d->>'per_volume_unit_minor')::bigint,(d->>'volume_unit_cm3')::integer,(d->>'special_handling_minor')::bigint,(d->>'disclosed_surcharge_minor')::bigint,(d->>'max_weight_grams')::integer,(d->>'max_volume_cm3')::integer,(d->>'valid_from')::timestamptz,(d->>'valid_until')::timestamptz) RETURNING id INTO rid;
  result:=jsonb_build_object('id',rid);
 ELSIF action IN ('prepare','quote','create') THEN
  oid:=(d->>'seller_order_id')::uuid;
  SELECT * INTO so FROM public.seller_orders WHERE id=oid FOR UPDATE;
  IF NOT FOUND OR so.status NOT IN ('confirmed','preparing','ready') OR NOT app_private.delivery_paid(so.order_id) THEN RAISE EXCEPTION 'delivery_paid_order_required'; END IF;
  SELECT * INTO STRICT o FROM public.orders WHERE id=so.order_id FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.shipments WHERE seller_order_id=oid) THEN RAISE EXCEPTION 'delivery_already_created'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.order_items WHERE seller_order_id=oid) THEN RAISE EXCEPTION 'delivery_items_missing'; END IF;
  IF action='prepare' THEN
   IF (d->>'weight_grams')::integer<=0 OR (d->>'volume_cm3')::integer<=0 OR char_length(trim(d->>'shipping_class'))<1 OR char_length(trim(d->'pickup_snapshot'->>'area_code'))<1 OR char_length(trim(d->'pickup_snapshot'->>'address_lines'))<3 OR d->'pickup_snapshot'->>'emirate' IS NULL OR char_length(trim(d->>'evidence'))<3 OR (d->>'pickup_until')::timestamptz<=(d->>'ready_at')::timestamptz OR (d->>'deliver_by')::timestamptz<=(d->>'pickup_until')::timestamptz THEN RAISE EXCEPTION 'delivery_preparation_missing'; END IF;
   PERFORM (d->'pickup_snapshot'->>'emirate')::public.emirate_code;
   IF EXISTS(SELECT 1 FROM public.order_items i JOIN public.products pr ON pr.id=i.product_id WHERE i.seller_order_id=oid AND pr.shipping_class<>d->>'shipping_class') THEN RAISE EXCEPTION 'delivery_shipping_class_mismatch'; END IF;
   INSERT INTO public.delivery_order_preparations(seller_order_id,weight_grams,volume_cm3,shipping_class,pickup_snapshot,ready_at,pickup_until,deliver_by,prepared_by,evidence)
   VALUES(oid,(d->>'weight_grams')::integer,(d->>'volume_cm3')::integer,d->>'shipping_class',d->'pickup_snapshot',(d->>'ready_at')::timestamptz,(d->>'pickup_until')::timestamptz,(d->>'deliver_by')::timestamptz,actor,d->>'evidence')
   ON CONFLICT(seller_order_id) DO UPDATE SET weight_grams=excluded.weight_grams,volume_cm3=excluded.volume_cm3,shipping_class=excluded.shipping_class,pickup_snapshot=excluded.pickup_snapshot,ready_at=excluded.ready_at,pickup_until=excluded.pickup_until,deliver_by=excluded.deliver_by,prepared_by=actor,evidence=excluded.evidence,quote_snapshot=NULL,updated_at=clock_timestamp() RETURNING id INTO rid;
   result:=jsonb_build_object('id',rid);
  ELSE
   SELECT * INTO p FROM public.delivery_order_preparations WHERE seller_order_id=oid FOR UPDATE;
   IF NOT FOUND THEN RAISE EXCEPTION 'delivery_preparation_missing'; END IF;
   IF coalesce(o.delivery_address_snapshot->>'emirate','')='' OR coalesce(o.delivery_address_snapshot->>'area_code','')='' OR coalesce(o.delivery_address_snapshot->>'address_lines','')='' OR coalesce(o.delivery_address_snapshot->>'recipient_name','')='' OR coalesce(o.delivery_address_snapshot->>'phone','')='' THEN RAISE EXCEPTION 'delivery_location_missing'; END IF;
   IF action='quote' THEN
    -- This milestone requires a pre-existing unambiguous customer fee. Multi-store splits require the later checkout quote engine.
    IF (SELECT count(*) FROM public.seller_orders WHERE order_id=o.id)<>1 THEN RAISE EXCEPTION 'delivery_quote_mapping_missing'; END IF;
    SELECT * INTO candidate FROM app_private.delivery_candidates(p.id) WHERE service_id=(d->>'service_id')::uuid AND contract_id=(d->>'contract_id')::uuid AND rate_card_id=(d->>'rate_card_id')::uuid;
    IF NOT FOUND THEN RAISE EXCEPTION 'delivery_no_eligible_service'; END IF;
    -- Do not approve unfunded carrier cost or silently change historical customer fees.
    IF candidate.gross_minor<>o.delivery_minor THEN RAISE EXCEPTION 'delivery_quote_fee_mismatch'; END IF;
    quote:=jsonb_build_object('company_id',candidate.company_id,'service_id',candidate.service_id,'contract_id',candidate.contract_id,'rate_card_id',candidate.rate_card_id,'carrier_gross_minor',candidate.gross_minor,'customer_fee_minor',o.delivery_minor,'currency',o.currency,'policy',candidate.policy_snapshot,'approved_by',actor,'approved_at',clock_timestamp(),'evidence',why);
    UPDATE public.delivery_order_preparations SET quote_snapshot=quote,updated_at=clock_timestamp() WHERE id=p.id;
    result:=jsonb_build_object('id',p.id);
   ELSE
    quote:=p.quote_snapshot;
    IF quote IS NULL THEN RAISE EXCEPTION 'delivery_quote_mapping_missing'; END IF;
    SELECT * INTO candidate FROM app_private.delivery_candidates(p.id) WHERE service_id=(quote->>'service_id')::uuid AND contract_id=(quote->>'contract_id')::uuid AND rate_card_id=(quote->>'rate_card_id')::uuid AND gross_minor=(quote->>'carrier_gross_minor')::bigint;
    IF NOT FOUND OR (quote->>'customer_fee_minor')::bigint<>o.delivery_minor THEN RAISE EXCEPTION 'delivery_no_eligible_service'; END IF;
    -- All actual items are copied under the order lock, never from client item IDs/quantities.
    IF EXISTS(SELECT 1 FROM public.order_items i WHERE i.seller_order_id=oid AND coalesce((SELECT sum(si.quantity) FROM public.shipment_items si WHERE si.order_item_id=i.id),0)>0) THEN RAISE EXCEPTION 'delivery_over_shipment'; END IF;
    INSERT INTO public.shipments(seller_order_id,quote_snapshot,allocation_snapshot,pickup_snapshot,dropoff_snapshot,customer_fee_minor,carrier_gross_minor,currency,promised_at)
    VALUES(oid,quote,jsonb_build_object('preparation_id',p.id),p.pickup_snapshot,o.delivery_address_snapshot,(quote->>'customer_fee_minor')::bigint,(quote->>'carrier_gross_minor')::bigint,o.currency,p.deliver_by) RETURNING id INTO sid;
    INSERT INTO public.shipment_items(shipment_id,seller_order_id,order_item_id,quantity) SELECT sid,oid,id,quantity FROM public.order_items WHERE seller_order_id=oid;
    result:=jsonb_build_object('id',sid);
   END IF;
  END IF;
 ELSIF action='assign' THEN
  sid:=(d->>'shipment_id')::uuid;
  SELECT * INTO s FROM public.shipments WHERE id=sid FOR UPDATE;
  IF NOT FOUND OR s.status NOT IN ('pending','allocated') THEN RAISE EXCEPTION 'delivery_shipment_ineligible'; END IF;
  SELECT * INTO p FROM public.delivery_order_preparations WHERE seller_order_id=s.seller_order_id;
  SELECT * INTO a FROM public.delivery_assignments WHERE shipment_id=sid AND superseded_at IS NULL FOR UPDATE;
  IF FOUND THEN
   IF coalesce((d->>'confirm_reassignment')::boolean,false)<>true THEN RAISE EXCEPTION 'delivery_reassignment_confirmation'; END IF;
   UPDATE public.delivery_assignments SET superseded_at=clock_timestamp() WHERE id=a.id;
   INSERT INTO public.notifications(user_id,type,title_ar,body_ar) SELECT user_id,'delivery_reassigned','تغير إسناد الشحنة',sid::text FROM public.delivery_operators WHERE company_id=a.company_id AND active AND scoped_role IN ('company_admin','operations');
  END IF;
  SELECT * INTO candidate FROM app_private.delivery_candidates(p.id) WHERE company_id=(d->>'company_id')::uuid AND service_id=(d->>'service_id')::uuid AND contract_id=(d->>'contract_id')::uuid AND rate_card_id=(d->>'rate_card_id')::uuid AND gross_minor=s.carrier_gross_minor;
  IF NOT FOUND OR p.quote_snapshot IS NULL THEN RAISE EXCEPTION 'delivery_no_eligible_service'; END IF;
  IF (d->>'offer_minutes')::integer NOT BETWEEN 1 AND 60 THEN RAISE EXCEPTION 'delivery_invalid_input'; END IF;
  INSERT INTO public.delivery_assignments(shipment_id,company_id,service_id,contract_id,rate_card_id,assigned_by,reason_snapshot,expires_at)
  VALUES(sid,candidate.company_id,candidate.service_id,candidate.contract_id,candidate.rate_card_id,actor,jsonb_build_object('reason',why,'approved_quote',s.quote_snapshot,'policy',candidate.policy_snapshot),least(clock_timestamp()+(d->>'offer_minutes')::integer*interval '1 minute',p.pickup_until)) RETURNING id INTO aid;
  UPDATE public.shipments SET status='allocated',delivery_company_id=candidate.company_id,delivery_service_id=candidate.service_id,delivery_contract_id=candidate.contract_id,rate_card_id=candidate.rate_card_id WHERE id=sid;
  INSERT INTO public.notifications(user_id,type,title_ar,body_ar) SELECT user_id,'delivery_offer','عرض شحنة جديد',sid::text FROM public.delivery_operators WHERE company_id=candidate.company_id AND active AND scoped_role IN ('company_admin','operations');
  result:=jsonb_build_object('id',aid);
 ELSIF action IN ('accept','reject') THEN
  SELECT * INTO s FROM public.shipments WHERE id=a.shipment_id FOR UPDATE;
  SELECT * INTO a FROM public.delivery_assignments WHERE id=a.id FOR UPDATE;
  IF a.superseded_at IS NOT NULL OR a.offer_status<>'offered' OR s.status<>'allocated' THEN RAISE EXCEPTION 'delivery_stale_offer'; END IF;
  IF a.expires_at IS NULL OR a.expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'delivery_offer_expired'; END IF;
  SELECT * INTO p FROM public.delivery_order_preparations WHERE seller_order_id=s.seller_order_id;
  IF action='accept' THEN
   -- Temporarily remove this reserved slot from eligibility counts while holding the global lock.
   UPDATE public.delivery_assignments SET superseded_at=clock_timestamp() WHERE id=a.id;
   SELECT * INTO candidate FROM app_private.delivery_candidates(p.id) WHERE company_id=a.company_id AND service_id=a.service_id AND contract_id=a.contract_id AND rate_card_id=a.rate_card_id AND gross_minor=s.carrier_gross_minor;
   IF NOT FOUND THEN RAISE EXCEPTION 'delivery_no_eligible_service'; END IF;
   UPDATE public.delivery_assignments SET superseded_at=NULL,offer_status='accepted',responded_at=clock_timestamp(),responded_by=actor,response_reason=why WHERE id=a.id;
  ELSE
   UPDATE public.delivery_assignments SET offer_status='rejected',superseded_at=clock_timestamp(),responded_at=clock_timestamp(),responded_by=actor,response_reason=why WHERE id=a.id;
   UPDATE public.shipments SET status='pending' WHERE id=s.id;
  END IF;
  INSERT INTO public.notifications(user_id,type,title_ar,body_ar) SELECT DISTINCT r.user_id,'delivery_response','تحديث عرض الشحنة',s.id::text||': '||action FROM public.user_roles r JOIN public.admin_permissions ap ON ap.user_id=r.user_id AND ap.permission='delivery.manage' WHERE r.role='admin';
  result:=jsonb_build_object('id',a.id);
 ELSE RAISE EXCEPTION 'delivery_invalid_input';
 END IF;
 INSERT INTO app_private.delivery_command_receipts(actor_id,command_key,payload,result) VALUES(actor,command_key,payload,result);
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.sanaa_delivery_command(uuid,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.sanaa_delivery_command(uuid,jsonb) TO authenticated;
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
   SELECT jsonb_build_object('id',s.id,'status',s.status,'seller_order_id',CASE WHEN platform THEN s.seller_order_id END,'pickup',jsonb_build_object('emirate',s.pickup_snapshot->>'emirate','area_code',s.pickup_snapshot->>'area_code','address_lines',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments own WHERE own.shipment_id=s.id AND own.company_id=company AND own.superseded_at IS NULL AND own.offer_status='accepted') THEN s.pickup_snapshot->>'address_lines' END),'dropoff',jsonb_build_object('emirate',s.dropoff_snapshot->>'emirate','area_code',s.dropoff_snapshot->>'area_code','address_lines',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'address_lines' END,'recipient_name',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'recipient_name' END,'phone',CASE WHEN platform OR EXISTS(SELECT 1 FROM public.delivery_assignments a WHERE a.shipment_id=s.id AND a.company_id=company AND a.superseded_at IS NULL AND a.offer_status='accepted') THEN s.dropoff_snapshot->>'phone' END),
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
