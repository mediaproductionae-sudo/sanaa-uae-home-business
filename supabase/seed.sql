-- Catalog/reference seed ONLY: no auth users, sessions, passwords, real people,
-- commercial agreements or financial history. Safe to re-run without duplicates.
begin;
insert into public.categories(id,slug,name_ar) values
 ('10000000-0000-4000-8000-000000000001','home-food','مذاقات منزلية'),
 ('10000000-0000-4000-8000-000000000002','crafts','حرف وفنون'),
 ('10000000-0000-4000-8000-000000000003','fragrances','عطور وبخور'),
 ('10000000-0000-4000-8000-000000000004','fashion','أزياء وإكسسوارات'),
 ('10000000-0000-4000-8000-000000000005','home-decor','البيت والديكور')
on conflict(id) do nothing;
-- Delivery sandbox data remains disabled until operator review/contracts in 4D.
insert into public.delivery_companies(id,name_ar,active,contact) values
 ('20000000-0000-4000-8000-000000000001','شركة توصيل وهمية — ألف',false,'{"email":"demo-a@example.test"}'),
 ('20000000-0000-4000-8000-000000000002','شركة توصيل وهمية — باء',false,'{"email":"demo-b@example.test"}')
on conflict(id) do nothing;
insert into public.delivery_allocation_policies(id,version,cost_weight,eta_weight,performance_weight,active)
values('30000000-0000-4000-8000-000000000001',1,60,30,10,false) on conflict(id) do nothing;
commit;
